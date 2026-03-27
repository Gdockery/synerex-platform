"""
Tariff Lookup Service — Multi-source worldwide utility rate lookup.

Strategy (in order):
  1. NREL OpenEI URDB  — best source for US utilities (tariff-level detail, free API key)
  2. EIA API           — US state-level averages (free API key, fallback)
  3. Ollama AI         — worldwide coverage via LLM knowledge (estimated, flagged clearly)
  4. Static fallback   — US/international region averages (last resort)

The caller always knows the confidence level via the "source" field in the response.
"""

import json
import logging
import os
import re
import requests
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config — keys read from env (safe defaults = None so callers know they're absent)
# ---------------------------------------------------------------------------
def _cfg(key: str, default: str = "") -> str:
    """Read from Flask app config first, then env, then default."""
    try:
        from flask import current_app
        if current_app:
            v = current_app.config.get(key)
            if v:
                return str(v)
    except RuntimeError:
        pass
    return os.environ.get(key, default)


def NREL_API_KEY() -> str:  # type: ignore[override]  # noqa: N802
    return _cfg("NREL_API_KEY")

def EIA_API_KEY() -> str:  # type: ignore[override]  # noqa: N802
    return _cfg("EIA_API_KEY")

def OLLAMA_URL() -> str:  # type: ignore[override]  # noqa: N802
    return _cfg("OLLAMA_BILL_URL") or _cfg("OLLAMA_LOCAL_URL", "http://localhost:11434")

def OLLAMA_MODEL() -> str:  # type: ignore[override]  # noqa: N802
    return _cfg("OLLAMA_BILL_VISION_MODEL", "qwen2.5vl:7b")

NREL_URDB_URL  = "https://api.openei.org/utility_rates"
EIA_API_URL    = "https://api.eia.gov/v2/electricity/retail-sales/data/"

# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

_STATE_ABBREVS = {
    "AL":"alabama","AK":"alaska","AZ":"arizona","AR":"arkansas","CA":"california",
    "CO":"colorado","CT":"connecticut","DE":"delaware","FL":"florida","GA":"georgia",
    "HI":"hawaii","ID":"idaho","IL":"illinois","IN":"indiana","IA":"iowa",
    "KS":"kansas","KY":"kentucky","LA":"louisiana","ME":"maine","MD":"maryland",
    "MA":"massachusetts","MI":"michigan","MN":"minnesota","MS":"mississippi",
    "MO":"missouri","MT":"montana","NE":"nebraska","NV":"nevada","NH":"new hampshire",
    "NJ":"new jersey","NM":"new mexico","NY":"new york","NC":"north carolina",
    "ND":"north dakota","OH":"ohio","OK":"oklahoma","OR":"oregon","PA":"pennsylvania",
    "RI":"rhode island","SC":"south carolina","SD":"south dakota","TN":"tennessee",
    "TX":"texas","UT":"utah","VT":"vermont","VA":"virginia","WA":"washington",
    "WV":"west virginia","WI":"wisconsin","WY":"wyoming","DC":"district of columbia",
}

def _normalise_state(s: str) -> str:
    """Return full lowercase state name from abbreviation or full name."""
    s = (s or "").strip().upper()
    if s in _STATE_ABBREVS:
        return _STATE_ABBREVS[s]
    return s.lower()


def _safe_float(val, default=None):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Source 1: NREL OpenEI URDB  (US tariff-level detail)
# ---------------------------------------------------------------------------

def _lookup_urdb(utility_name: str, tariff_code: str, state: str, sector: str = "Commercial") -> dict | None:
    """
    Query OpenEI URDB for the specific tariff.  Returns a normalised rate dict
    or None if not found / no API key.
    """
    if not NREL_API_KEY():
        logger.info("NREL_API_KEY not set — skipping URDB lookup")
        return None

    params: dict[str, Any] = {
        "version": 8,
        "format": "json",
        "detail": "full",
        "api_key": NREL_API_KEY(),
        "sector": sector,
        "limit": 25,
    }
    if utility_name:
        params["utility"] = utility_name
    if state:
        # URDB expects 2-letter state abbreviation
        params["state"] = state.upper()[:2] if len(state) > 2 else state.upper()

    try:
        resp = requests.get(NREL_URDB_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("URDB request failed: %s", exc)
        return None

    items = data.get("items") or []
    if not items:
        logger.info("URDB: no rates found for utility=%r state=%r", utility_name, state)
        return None

    # Try to match the tariff code (e.g. "TOU-GS-3-B") against rate name/label
    best = None
    tariff_upper = (tariff_code or "").upper().strip()
    for item in items:
        name = (item.get("name") or "").upper()
        if tariff_upper and tariff_upper in name:
            best = item
            break
    if best is None:
        best = items[0]  # fall back to first result for this utility

    return _parse_urdb_item(best)


def _parse_urdb_item(item: dict) -> dict:
    """Extract all rate components from a URDB item into our normalised format."""
    result: dict[str, Any] = {
        "source": "nrel_urdb",
        "source_label": "NREL OpenEI Utility Rate Database",
        "confidence": "high",
        "tariff_name": item.get("name", ""),
        "utility_name": item.get("utility", ""),
        "description": item.get("description", ""),
        "uri": item.get("uri", ""),
    }

    # --- Energy rate ($/kWh) ---
    energy_structure = item.get("energyratestructure") or []
    kwh_rates = []
    for period in energy_structure:
        for tier in (period if isinstance(period, list) else [period]):
            r = _safe_float(tier.get("rate"))
            if r is not None and r > 0:
                kwh_rates.append(r)
    if kwh_rates:
        result["energy_rate"] = round(sum(kwh_rates) / len(kwh_rates), 6)

    # --- Demand rate ($/kW) ---
    demand_structure = item.get("demandratestructure") or []
    kw_rates = []
    for period in demand_structure:
        for tier in (period if isinstance(period, list) else [period]):
            r = _safe_float(tier.get("rate"))
            if r is not None and r > 0:
                kw_rates.append(r)
    if kw_rates:
        result["demand_rate"] = round(sum(kw_rates) / len(kw_rates), 4)

    # --- Fixed / customer charge ---
    fc = _safe_float(item.get("fixedchargefirstmeter"))
    if fc is not None:
        result["customer_charge"] = fc

    # --- TOU on/off peak ---
    # energyweekdayschedule[hour] = period index; 0=off-peak by convention in URDB
    schedule = item.get("energyweekdayschedule") or []
    if schedule and kwh_rates:
        # Identify on-peak period (highest index used in schedule)
        flat = [h for row in schedule for h in row]
        peak_period = max(flat) if flat else None
        if peak_period is not None and peak_period < len(energy_structure):
            peak_tiers = energy_structure[peak_period] or []
            offpeak_tiers = energy_structure[0] or []
            peak_r   = _safe_float((peak_tiers[0] if peak_tiers else {}).get("rate"))
            offpeak_r= _safe_float((offpeak_tiers[0] if offpeak_tiers else {}).get("rate"))
            if peak_r:
                result["tou_on_peak"]  = round(peak_r, 6)
            if offpeak_r:
                result["tou_off_peak"] = round(offpeak_r, 6)

        # On-peak share of hours: fraction of weekday hours in peak period
        peak_hours = flat.count(peak_period) if peak_period is not None else 0
        if peak_hours > 0:
            result["onpeak_fraction_pct"] = round((peak_hours / len(flat)) * 100, 1)

    # --- Seasonal (summer vs winter) ---
    summer_months = set(item.get("peakkwcapacitysummer", []) or [])
    if summer_months:
        result["summer_fraction_pct"] = round(len(summer_months) / 12 * 100, 1)

    # --- Capacity rate ---
    cap = _safe_float(item.get("coincidentpeakdemandchargeunits"))
    if cap:
        result["capacity_rate"] = cap

    # --- Billing model hint ---
    demand_unit = (item.get("demandrateunit") or "").lower()
    if "kva" in demand_unit:
        result["billing_model"] = "kva_demand"
    elif "kvar" in demand_unit:
        result["billing_model"] = "reactive_adder"
    else:
        result["billing_model"] = "kw_pf_adjust"

    return result


# ---------------------------------------------------------------------------
# Source 2: EIA API  (US state-level averages, free key)
# ---------------------------------------------------------------------------

def _lookup_eia(state: str, sector: str = "commercial") -> dict | None:
    """Fetch average retail electricity price from EIA for a US state + sector."""
    if not EIA_API_KEY():
        logger.info("EIA_API_KEY not set — skipping EIA lookup")
        return None

    state_abbrev = state.upper()[:2] if len(state) > 2 else state.upper()
    params = {
        "api_key": EIA_API_KEY(),
        "frequency": "monthly",
        "data[0]": "price",
        "facets[stateid][]": state_abbrev,
        "facets[sectorid][]": {"commercial": "COM", "industrial": "IND", "residential": "RES"}.get(sector.lower(), "COM"),
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": 1,
        "offset": 0,
    }
    try:
        resp = requests.get(EIA_API_URL, params=params, timeout=10)
        resp.raise_for_status()
        rows = (resp.json().get("response") or {}).get("data") or []
        if rows:
            price_cents = _safe_float(rows[0].get("price"))
            if price_cents:
                return {
                    "source": "eia_api",
                    "source_label": "U.S. Energy Information Administration",
                    "confidence": "medium",
                    "energy_rate": round(price_cents / 100, 6),  # EIA returns cents/kWh
                    "period": rows[0].get("period", ""),
                    "state": state_abbrev,
                }
    except Exception as exc:
        logger.warning("EIA lookup failed: %s", exc)
    return None


# ---------------------------------------------------------------------------
# Source 3: Ollama AI  (worldwide, estimates)
# ---------------------------------------------------------------------------

_AI_PROMPT_TEMPLATE = """You are a utility rate expert. A user scanned an electric bill and needs help filling in the billing rate fields for an energy analysis.

Known information from the bill:
  - Utility company: {utility}
  - Tariff / Rate Schedule: {tariff}
  - Service state/region: {state}
  - Service country: {country}
  - Account type: {sector}

Based on this, provide your BEST ESTIMATE of the rate structure for this tariff.
Return ONLY valid JSON with these keys (omit any you are not confident about):
{{
  "energy_rate": <$/kWh as float>,
  "demand_rate": <$/kW-month as float, if applicable>,
  "capacity_rate": <$/kW-month capacity/transmission charge, if any>,
  "billing_model": <"kw_pf_adjust" | "kva_demand" | "reactive_adder">,
  "tou_on_peak": <on-peak energy rate $/kWh if TOU>,
  "tou_off_peak": <off-peak energy rate $/kWh if TOU>,
  "summer_fraction_pct": <% of year that is summer billing season, e.g. 50>,
  "summer_on_peak": <summer on-peak $/kWh if applicable>,
  "summer_off_peak": <summer off-peak $/kWh if applicable>,
  "winter_on_peak": <winter on-peak $/kWh if applicable>,
  "winter_off_peak": <winter off-peak $/kWh if applicable>,
  "onpeak_fraction_pct": <% of hours that are on-peak, e.g. 33>,
  "ncp_demand_rate": <non-coincident peak demand rate $/kW if applicable>,
  "cp_demand_rate": <coincident peak demand rate $/kW if applicable>,
  "kva_demand_rate": <kVA demand rate $/kVA-month if kVA billing>,
  "reactive_adder": <reactive adder $/kVAR-month if applicable>,
  "target_pf": <target power factor 0-1, e.g. 0.90>,
  "discount_rate": <typical discount rate %, e.g. 5>,
  "escalation_rate": <typical annual rate escalation %, e.g. 2>,
  "analysis_period": <typical analysis period in years, e.g. 10>,
  "ratchet_percent": <ratchet % of prior peak if applicable>,
  "customer_charge": <monthly fixed customer charge $ if known>,
  "notes": "<brief explanation of tariff structure and any caveats>"
}}

Important: This is an ESTIMATE for initial analysis. All values should be reasonable for a commercial/industrial customer on this utility and tariff. Return ONLY the JSON object, no other text."""


def _lookup_ai(utility: str, tariff: str, state: str, country: str, sector: str) -> dict | None:
    """Use Ollama AI to estimate rate structure for any utility worldwide."""
    prompt = _AI_PROMPT_TEMPLATE.format(
        utility=utility or "Unknown",
        tariff=tariff or "Standard commercial tariff",
        state=state or "Unknown",
        country=country or "USA",
        sector=sector or "Commercial",
    )

    try:
        resp = requests.post(
            f"{OLLAMA_URL()}/api/chat",
            json={
                "model": OLLAMA_MODEL(),
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 600},
            },
            timeout=60,
        )
        resp.raise_for_status()
        raw = (resp.json().get("message") or {}).get("content") or ""
    except Exception as exc:
        logger.warning("AI tariff lookup failed: %s", exc)
        return None

    # Extract JSON from response
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if not json_match:
        logger.warning("AI response contained no JSON: %r", raw[:200])
        return None

    try:
        parsed = json.loads(json_match.group(0))
    except json.JSONDecodeError:
        logger.warning("AI JSON parse failed: %r", json_match.group(0)[:200])
        return None

    # Tag the source and convert numeric strings
    result: dict[str, Any] = {
        "source": "ai_estimate",
        "source_label": "AI-estimated (verify with utility)",
        "confidence": "low",
        "notes": parsed.pop("notes", ""),
    }
    numeric_fields = [
        "energy_rate", "demand_rate", "capacity_rate",
        "tou_on_peak", "tou_off_peak",
        "summer_fraction_pct", "summer_on_peak", "summer_off_peak",
        "winter_on_peak", "winter_off_peak",
        "onpeak_fraction_pct", "ncp_demand_rate", "cp_demand_rate",
        "kva_demand_rate", "reactive_adder", "target_pf",
        "discount_rate", "escalation_rate", "analysis_period",
        "ratchet_percent", "customer_charge",
    ]
    for field in numeric_fields:
        v = _safe_float(parsed.get(field))
        if v is not None:
            result[field] = v
    if parsed.get("billing_model") in ("kw_pf_adjust", "kva_demand", "reactive_adder"):
        result["billing_model"] = parsed["billing_model"]

    return result if len(result) > 3 else None  # Must have at least one rate field


# ---------------------------------------------------------------------------
# Source 4: Static regional fallback
# ---------------------------------------------------------------------------

_STATIC_FALLBACK: dict[str, dict] = {
    # USA regions
    "california":        {"energy_rate": 0.28, "demand_rate": 16.0,  "tou_on_peak": 0.45, "tou_off_peak": 0.25, "summer_fraction_pct": 50},
    "texas":             {"energy_rate": 0.12, "demand_rate":  8.5,  "billing_model": "kw_pf_adjust"},
    "new york":          {"energy_rate": 0.22, "demand_rate": 14.0,  "tou_on_peak": 0.35, "tou_off_peak": 0.18},
    "florida":           {"energy_rate": 0.12, "demand_rate":  7.5},
    "illinois":          {"energy_rate": 0.10, "demand_rate": 10.0},
    "pennsylvania":      {"energy_rate": 0.11, "demand_rate":  9.0},
    "ohio":              {"energy_rate": 0.11, "demand_rate":  8.0},
    "georgia":           {"energy_rate": 0.11, "demand_rate":  8.5},
    "north carolina":    {"energy_rate": 0.11, "demand_rate":  9.0},
    "michigan":          {"energy_rate": 0.13, "demand_rate": 10.0},
    "arizona":           {"energy_rate": 0.13, "demand_rate": 12.0},
    "colorado":          {"energy_rate": 0.12, "demand_rate":  9.0},
    "louisiana":         {"energy_rate": 0.09, "demand_rate":  7.0},
    "virginia":          {"energy_rate": 0.11, "demand_rate":  9.5},
    "washington":        {"energy_rate": 0.08, "demand_rate":  5.0},
    "oregon":            {"energy_rate": 0.10, "demand_rate":  6.0},
    "nevada":            {"energy_rate": 0.13, "demand_rate": 11.0},
    # International regions
    "canada":            {"energy_rate": 0.13, "demand_rate": 10.0},
    "united kingdom":    {"energy_rate": 0.35, "demand_rate": 18.0},
    "uk":                {"energy_rate": 0.35, "demand_rate": 18.0},
    "australia":         {"energy_rate": 0.28, "demand_rate": 14.0},
    "germany":           {"energy_rate": 0.40, "demand_rate": 20.0},
    "france":            {"energy_rate": 0.22, "demand_rate": 12.0},
    "mexico":            {"energy_rate": 0.09, "demand_rate":  6.0},
    "japan":             {"energy_rate": 0.22, "demand_rate": 15.0},
    "south korea":       {"energy_rate": 0.11, "demand_rate":  8.0},
    "china":             {"energy_rate": 0.08, "demand_rate":  5.0},
    "india":             {"energy_rate": 0.08, "demand_rate":  4.0},
    "brazil":            {"energy_rate": 0.13, "demand_rate":  7.0},
    "south africa":      {"energy_rate": 0.10, "demand_rate":  6.0},
    "uae":               {"energy_rate": 0.07, "demand_rate":  5.0},
    "singapore":         {"energy_rate": 0.18, "demand_rate": 10.0},
    # Generic fallback
    "_default":          {"energy_rate": 0.13, "demand_rate": 10.0},
}


def _static_fallback(state: str, country: str) -> dict:
    key = (state or "").lower().strip()
    if key in _STATIC_FALLBACK:
        base = _STATIC_FALLBACK[key].copy()
    else:
        key2 = (country or "").lower().strip()
        base = _STATIC_FALLBACK.get(key2, _STATIC_FALLBACK["_default"]).copy()

    base["source"] = "static_fallback"
    base["source_label"] = "Regional average estimate (static data)"
    base["confidence"] = "very_low"
    return base


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def lookup_tariff_rates(
    utility: str,
    tariff: str,
    state: str,
    country: str = "USA",
    sector: str = "Commercial",
) -> dict:
    """
    Look up rate structure for a utility tariff using the best available source.

    Returns a dict with:
      source, source_label, confidence,
      energy_rate, demand_rate, billing_model,
      (optionally) tou_on_peak, tou_off_peak, seasonal rates, etc.
    """
    country = (country or "USA").strip()
    state   = (state or "").strip()
    is_us   = country.upper() in ("USA", "US", "UNITED STATES", "UNITED STATES OF AMERICA")

    # --- Source 1: NREL URDB (US only) ---
    if is_us and NREL_API_KEY():
        result = _lookup_urdb(utility, tariff, _normalise_state(state)[:2].upper(), sector)
        if result and result.get("energy_rate"):
            logger.info("Tariff lookup via NREL URDB: utility=%r tariff=%r", utility, tariff)
            return result

    # --- Source 2: EIA state average (US only, fallback) ---
    if is_us and EIA_API_KEY() and state:
        result = _lookup_eia(state, sector)
        if result and result.get("energy_rate"):
            logger.info("Tariff lookup via EIA API: state=%r", state)
            return result

    # --- Source 3: AI estimate (worldwide) ---
    result = _lookup_ai(utility, tariff, state, country, sector)
    if result and result.get("energy_rate"):
        logger.info("Tariff lookup via AI: utility=%r tariff=%r country=%r", utility, tariff, country)
        return result

    # --- Source 4: Static regional fallback ---
    logger.info("Tariff lookup via static fallback: state=%r country=%r", state, country)
    return _static_fallback(state, country)
