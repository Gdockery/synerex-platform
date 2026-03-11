"""
Tariff Lookup API routes.

POST /api/tariff-lookup
  Body: { utility, tariff, state, country, sector }
  Returns: normalised rate structure from best available source.
"""
import logging

from flask import Blueprint, jsonify, request
from flask_login import login_required

from app.helpers.decorators import license_required
from app.services.tariff_lookup_service import lookup_tariff_rates

logger = logging.getLogger(__name__)

tariff_bp = Blueprint("tariff", __name__, url_prefix="")


@tariff_bp.route("/api/tariff-lookup", methods=["POST"])
@login_required
@license_required
def tariff_lookup():
    """
    POST /api/tariff-lookup

    Body JSON:
      utility  - utility company name from bill (e.g. "Oncor Electric Delivery")
      tariff   - tariff / rate schedule code from bill (e.g. "TOU-GS-3-B")
      state    - US state abbreviation or full name (e.g. "TX" or "Texas")
      country  - country name or code (default "USA")
      sector   - "Commercial" or "Industrial" (default "Commercial")

    Response JSON:
      {
        source, source_label, confidence,
        energy_rate, demand_rate, billing_model,
        tou_on_peak?, tou_off_peak?, summer_fraction_pct?, ...
        notes?
      }
    """
    data    = request.get_json() or {}
    utility = (data.get("utility") or "").strip()
    tariff  = (data.get("tariff")  or "").strip()
    state   = (data.get("state")   or "").strip()
    country = (data.get("country") or "USA").strip()
    sector  = (data.get("sector")  or "Commercial").strip()

    if not utility and not tariff and not state:
        return jsonify({"error": "At least one of utility, tariff, or state is required"}), 400

    try:
        result = lookup_tariff_rates(
            utility=utility,
            tariff=tariff,
            state=state,
            country=country,
            sector=sector,
        )
        return jsonify({"meta": {}, "response": result})
    except Exception as exc:
        logger.exception("Tariff lookup failed")
        return jsonify({"error": str(exc)}), 500
