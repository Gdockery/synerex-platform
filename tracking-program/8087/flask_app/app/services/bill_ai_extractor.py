"""
Bill AI Extractor - AI-only extraction from electric bill text.
- extract_bill_from_text: AI extracts structured bill data from raw text (no regex).
"""
import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

# Default Ollama URL (same as EMV program)
OLLAMA_DEFAULT_URL = os.environ.get("OLLAMA_LOCAL_URL", "http://localhost:11434")

# Expected bill fields for AI extraction
BILL_FIELDS = [
    "totalKwh", "kwPeak", "billAmount", "daysBilled",
    "serviceAddress", "serviceCity", "serviceState", "serviceZip",
    "electricCompanyName", "electricCompanyAddress", "electricCompanyCity",
    "electricCompanyState", "electricCompanyZip",
    "accountNumber", "meterNumber", "voltage", "billReference", "billDate",
    "kwhRate", "kwRatePerTariff", "customerCharge", "taxAmount", "tariff",
]


def _is_ai_enabled() -> bool:
    """Check if AI extraction is enabled via config or env."""
    if hasattr(__import__("flask", fromlist=["current_app"]), "current_app"):
        try:
            from flask import current_app
            if current_app:
                return current_app.config.get("BILL_AI_VALIDATION_ENABLED", True)
        except RuntimeError:
            pass
    return os.environ.get("BILL_AI_VALIDATION_ENABLED", "true").lower() in ("1", "true", "yes")


def _get_ollama_url() -> str:
    """Get Ollama base URL from config or env."""
    try:
        from flask import current_app
        if current_app:
            url = current_app.config.get("OLLAMA_BILL_URL", "")
            if url:
                return url
    except RuntimeError:
        pass
    return os.environ.get("OLLAMA_BILL_URL") or os.environ.get("OLLAMA_LOCAL_URL") or OLLAMA_DEFAULT_URL


def _get_vision_model() -> str:
    """Get vision model name from config or env."""
    try:
        from flask import current_app
        if current_app:
            m = current_app.config.get("OLLAMA_BILL_VISION_MODEL", "")
            if m:
                return m
    except RuntimeError:
        pass
    return os.environ.get("OLLAMA_BILL_VISION_MODEL", "qwen2.5vl:7b")


def _call_ollama_chat(prompt: str, images: list[str] | None = None, max_tokens: int = 1200) -> str | None:
    """Call Ollama /api/chat - supports images for vision models. Uses Qwen2.5-VL-7B (olmocr vision unreliable in Ollama)."""
    try:
        import requests
    except ImportError:
        return None

    url = f"{_get_ollama_url()}/api/chat"
    model = _get_vision_model()

    msg: dict[str, Any] = {"role": "user", "content": prompt}
    if images:
        msg["images"] = images

    payload = {
        "model": model,
        "messages": [msg],
        "stream": False,
        "options": {"temperature": 0.0, "num_predict": max_tokens},
    }

    try:
        logger.warning("Ollama chat: calling model=%s images=%d url=%s", model, len(images) if images else 0, url)
        response = requests.post(url, json=payload, timeout=600)
        try:
            result = response.json()
        except Exception:
            result = {}
        if not response.ok:
            logger.warning("Ollama chat: HTTP %d body=%s", response.status_code, (response.text or "")[:500])
            response.raise_for_status()
        content = (result.get("message") or {}).get("content") or ""
        for token in ("<|im_start|>", "<|im_end|>", "<|endoftext|>"):
            content = content.replace(token, "")
        content = content.strip()
        if not content:
            logger.warning("Ollama chat: empty content. result_keys=%s message=%s", list(result.keys()), str(result.get("message"))[:400])
        else:
            logger.warning("Ollama chat: got %d chars content_preview=%s", len(content), repr(content[:150]))
        return content if content else None
    except Exception as e:
        err_str = str(e).lower()
        if "timed out" in err_str or "timeout" in err_str:
            raise TimeoutError(
                "AI extraction timed out after 10 minutes. The vision model may need more time. Try again or use a smaller PDF."
            ) from e
        logger.warning("Ollama chat API call failed: %s", e)
        return None


def _call_ollama(prompt: str, max_tokens: int = 500) -> str | None:
    """Call Ollama chat API (Qwen2.5-VL) for text-only extraction."""
    if len(prompt) > 6000:
        prompt = prompt[:6000] + "\n\n[Bill text truncated for length]"
    return _call_ollama_chat(prompt, images=None, max_tokens=max_tokens)


DEFAULT_TEXT_PROMPT = """Extract electric bill data from the bill text below. You must extract ONLY values that actually appear in the bill. Never guess, never invent, never use example values. If a field is not in the bill, omit it or use "".

Return a JSON object. For each field, get the value from the EXACT location described:

accountNumber: From "Account Number", "Account #", "Account No.", "Acct No." – the customer account ID. Numbers only, no spaces.
billAmount: From "Total Amount Due", "Amount Due", "Pay This Amount", "Balance Due", "Amount Enclosed". The main total the customer pays. Numbers with 2 decimals, no $ sign. NOT donation lines ($5, $10).
billDate: From "Bill Date", "Service Date", "Due Date", "Statement Date". As YYYY-MM-DD string.
customerCharge: From "Customer Charge", "Basic Charge", "Service Charge". Number with 2 decimals.
daysBilled: From "Days Billed", "Billing Days", "Billing Period". Integer.
electricCompanyAddress: From utility header – street address of the electric company.
electricCompanyCity: From utility header – city of the electric company.
electricCompanyName: From utility logo/header – name of the electric company.
electricCompanyState: From utility header – state of the electric company.
electricCompanyZip: From utility header – zip of the electric company.
kwRatePerTariff: $/kW rate. From "Demand Charge", "kW Charge", "$/kW", "Rate per kW". The $ per kW for demand. Number.
kwhRate: $/kWh rate. From "Energy Charge", "kWh Charge", "$/kWh", "Rate per kWh". The $ per kWh for energy. Number.
meterNumber: From "Meter Number", "Meter #", "Meter ID". The meter identifier.
serviceAddress: From "Service Address", "Delivery Address", "Mailing Address" – where power is delivered. Street address only.
serviceCity: From service address – city.
serviceState: From service address – state abbreviation.
serviceZip: From service address – zip.
taxAmount: From "Tax", "Sales Tax", "Tax Amount". Number with 2 decimals.
totalKwh: From "Total kWh", "Usage", "Energy (kWh)", "Current Reading". Total kWh consumed. Number.
kwPeak: From "Peak Demand", "Demand (kW)", "KW", "Billing Demand". Peak kW. Number.
voltage: From "Voltage", "Service Voltage" if stated (120, 208, 240, 277, 480).
billReference: From "Bill Number", "Invoice #", "Reference".
tariff: From "Rate", "Tariff", "Rate Schedule" if stated.

Also include "lineItems" as array of charge line items if present. Each item: name, type, cost, billingRate.

CRITICAL: Extract only what you actually see. Omit any field not in the bill. No placeholder or example values."""

FIND_METERS_PROMPT = '''You are an extremely literal OCR + label matcher. Your ONLY job is to find the exact label "Meter Number" or "Meter #" in the image and report ONLY the value immediately following it on the same line (typically in a table cell or field block).

Rules you MUST follow without exception:
- Scan the image for the exact phrase "Meter Number" or "Meter #". The value is the text/number directly to the right of that label, on the same line.
- Meter numbers typically look like: "2995142 09" or "64718" — digits, possibly a space and 2 more digits. SHORT.
- Do NOT include: barcode content (strings with asterisks *), long alphanumeric codes, "MM", "ADC", "MIXED", service IDs, or anything that looks like a barcode/2D code.
- Do NOT use: account number, kWh, phone, dates, multipliers, readings, differences, withdrawal amounts.
- If multiple "Meter Number" labels exist (multi-service), collect each value separated by comma: "2995142 09,2995141 09".
- If the label is not clearly visible or the value is ambiguous → output "".

Return ONLY this JSON:

{
  "meterNumber": ""
}'''

DEFAULT_VISION_PROMPT = """You are a data extraction tool analyzing a scanned image of an electric bill. Your only task is to extract exact values visible in the image. Do not infer, assume, or invent any data—if a value is unclear, blurry, missing, or not explicitly shown, set the field to an empty string "". Do not use sample or placeholder data like "123.45" or "Anytown". Ignore any prior knowledge of bills; base everything on this image alone.

Return ONLY a valid JSON object with these exact fields. No additional text, explanations, or formatting outside the JSON.

{
  "accountNumber": "",
  "billAmount": "",
  "billDate": "",
  "customerCharge": "",
  "daysBilled": "",
  "electricCompanyAddress": "",
  "electricCompanyCity": "",
  "electricCompanyName": "",
  "electricCompanyState": "",
  "electricCompanyZip": "",
  "kwRatePerTariff": "",
  "kwhRate": "",
  "meterNumber": "",
  "serviceAddress": "",
  "serviceCity": "",
  "serviceState": "",
  "serviceZip": "",
  "taxAmount": "",
  "totalKwh": "",
  "kwPeak": "",
  "voltage": "",
  "billReference": "",
  "tariff": ""
}

accountNumber: Exact "Account Number", "Account #", or "Account No." value – customer account ID.
billAmount: Exact "Total Amount Due", "Amount Due", "Pay This Amount", or "Balance Due" – numbers only, 2 decimals.
billDate: Exact "Bill Date", "Service Date", or "Due Date" – convert to epoch milliseconds.
customerCharge: Exact "Customer Charge", "Basic Charge", or "Service Charge".
daysBilled: Exact "Days Billed" or "Billing Days".
electricCompanyAddress/City/Name/State/Zip: From utility header.
kwRatePerTariff: Exact $/kW from "Demand Charge".
kwhRate: Exact $/kWh from "Energy Charge".
meterNumber: Exact "Meter Number" or "Meter #" value.
serviceAddress/City/State/Zip: Exact service/delivery address.
taxAmount: Exact "Tax" or "Sales Tax".
totalKwh: Exact "Total kWh", "Usage", or "Energy (kWh)".
kwPeak: Exact "Peak Demand", "Demand (kW)", or "KW".
voltage: Exact "Volts" value.
billReference: Exact "Reference".
tariff: Exact "Tariff".

If multiple values appear (e.g., multiple services), concatenate with commas. Output nothing but the JSON."""


def get_default_prompts() -> dict[str, str]:
    """Return default prompts for UI. Keys: textPrompt, visionPrompt."""
    return {"textPrompt": DEFAULT_TEXT_PROMPT, "visionPrompt": DEFAULT_VISION_PROMPT}


def _is_likely_barcode_or_wrong(s: str) -> bool:
    """Filter out barcode content and obviously wrong meter values."""
    s = str(s).strip()
    if not s or len(s) > 40:
        return True
    if "*" in s or "MM" in s.upper() or "ADC" in s.upper() or "MIXED" in s.upper():
        return True
    if s.count("*") >= 2:
        return True
    # Reject short all-digit (5-6 chars, no space) - often account IDs; real meters often "2995142 09"
    if " " not in s and s.isdigit() and len(s) <= 6:
        return True
    return False


def _parse_meters_from_reply(reply: str) -> list[str]:
    """Extract meter strings from Ollama JSON reply."""
    obj = _parse_ai_json_any(reply)
    parts: list[str] = []
    if isinstance(obj, dict):
        m = (
            obj.get("meterNumber")
            or obj.get("meter_number")
            or obj.get("Meter Number")
            or obj.get("meterNumbers")
            or obj.get("meter numbers")
        )
        if m is not None:
            if isinstance(m, list):
                parts = [str(x).strip() for x in m if x]
            elif str(m).strip():
                parts = [p.strip() for p in str(m).split(",") if p.strip()]
        if not parts:
            m = obj.get("meters") or obj.get("meterNumbers")
            if isinstance(m, list):
                parts = [str(x).strip() for x in m if x]
    elif isinstance(obj, list):
        parts = [str(x).strip() for x in obj if x]
    if not parts:
        try:
            arr = json.loads(reply.strip())
            if isinstance(arr, list):
                parts = [str(x).strip() for x in arr if x]
        except json.JSONDecodeError:
            pass
    return parts


def find_meters_from_images(image_b64_list: list[str]) -> list[str]:
    """
    Find all meter numbers visible on the bill. Used as step 1 before full extraction.
    Calls Ollama once per page (qwen2.5vl returns only tokens with 2+ images). Merges and filters results.
    Returns list of meter number strings, or [] if none/unclear.
    """
    if not _is_ai_enabled() or not image_b64_list:
        logger.warning("find_meters_from_images: skipped ai_enabled=%s images=%d", _is_ai_enabled(), len(image_b64_list or []))
        return []
    prompt = FIND_METERS_PROMPT
    all_parts: list[str] = []
    seen: set[str] = set()
    for idx, img in enumerate(image_b64_list):
        logger.warning("find_meters_from_images: page %d/%d base64_len=%d", idx + 1, len(image_b64_list), len(img))
        reply = _call_ollama_chat(prompt, images=[img], max_tokens=300)
        if not reply:
            continue
        parts = _parse_meters_from_reply(reply)
        for p in parts:
            if _is_likely_barcode_or_wrong(p):
                logger.info("find_meters_from_images: rejecting likely barcode/wrong: %s", p[:50])
                continue
            if p not in seen:
                seen.add(p)
                all_parts.append(p)
    if all_parts:
        logger.info("find_meters_from_images: found meters=%s", all_parts)
    return all_parts


def _build_vision_prompt_with_meters(
    base_prompt: str, selected_meters: list[str] | None
) -> str:
    """Prepend meter focus from step 1; append consolidation instructions when multiple meters selected."""
    if not selected_meters:
        return base_prompt
    meters_str = ", ".join(selected_meters)
    prefix = f"""IMPORTANT - METER(S) FROM STEP 1: The user identified these meter(s): {meters_str}. Extract data for these meter(s) ONLY. Ignore any other meters on the bill.

"""
    if len(selected_meters) <= 1:
        return prefix + base_prompt
    suffix = f"""

IMPORTANT - MULTIPLE METERS: Extract data for ALL of {meters_str} and CONSOLIDATE into one bill:
- totalKwh: SUM the kWh for each selected meter.
- kwPeak: SUM or use the maximum kW (or billing demand total if shown).
- billAmount: Use the total amount due.
- meterNumber: "{meters_str}"
- Consolidate costs, taxes, and line items by summing where applicable.
Output one consolidated JSON object."""
    return prefix + base_prompt + suffix


def _build_text_prompt_with_meters(base_prompt: str, selected_meters: list[str] | None) -> str:
    """Prepend meter focus from step 1; append consolidation instructions when multiple meters selected."""
    if not selected_meters:
        return base_prompt
    meters_str = ", ".join(selected_meters)
    prefix = f"""IMPORTANT - METER(S) FROM STEP 1: The user identified these meter(s): {meters_str}. Extract data for these meter(s) ONLY. Ignore any other meters on the bill.

"""
    if len(selected_meters) <= 1:
        return prefix + base_prompt
    suffix = f"""

IMPORTANT - MULTIPLE METERS: Extract for ALL of {meters_str} and CONSOLIDATE: totalKwh=SUM, kwPeak=SUM or max, billAmount=total due, meterNumber="{meters_str}". Sum costs where applicable. Output one JSON object."""
    return prefix + base_prompt + suffix


def extract_bill_from_text(
    bill_text: str,
    prompt_override: str | None = None,
    selected_meters: list[str] | None = None,
) -> dict[str, Any] | None:
    """
    Extract structured bill data from raw bill text using AI only (no regex).
    Returns dict with bill fields or None if AI fails or is disabled.
    prompt_override: if provided, used instead of default. Use {{BILL_TEXT}} as placeholder for bill content, or it will be appended automatically.
    """
    if not _is_ai_enabled():
        return None

    if not bill_text or len(bill_text.strip()) < 50:
        return None

    excerpt = bill_text[:5500]
    if len(bill_text) > 5500:
        excerpt += "\n\n[Bill text truncated]"

    if prompt_override and prompt_override.strip():
        base = prompt_override.strip()
        if "{{BILL_TEXT}}" in base:
            base = base.replace("{{BILL_TEXT}}", excerpt)
        else:
            base = base + "\n\nBill text:\n" + excerpt + "\n\nReturn ONLY valid JSON, no other text."
    else:
        base = DEFAULT_TEXT_PROMPT + "\n\nBill text:\n" + excerpt + "\n\nReturn ONLY valid JSON, no other text."
    prompt = _build_text_prompt_with_meters(base, selected_meters)

    reply = _call_ollama(prompt, max_tokens=1200)
    if not reply:
        return None

    obj = _parse_ai_json_response(reply)
    if not obj:
        logger.warning("AI text extraction: response not valid JSON. Reply snippet: %s", reply[:500] if reply else "(empty)")
        return None

    # Normalize: ensure strings for key fields, drop empty; normalize billDate
    result: dict[str, Any] = {}
    for k, v in obj.items():
        if v is None:
            continue
        if k == "billDate":
            epoch = _normalize_bill_date(v)
            if epoch is not None:
                result[k] = epoch
        elif isinstance(v, (int, float)) and k not in ("voltage",):
            result[k] = str(v)
        else:
            result[k] = v

    _sanity_check_bill_amount(result)
    # Require at least one non-lineItems field so we don't return empty/lineItems-only
    meaningful = [k for k in result if k != "lineItems" and result[k] not in (None, "", [])]
    if meaningful:
        return result
    return None


def _sanity_check_bill_amount(result: dict[str, Any]) -> None:
    """
    Reject billAmount if it looks like a donation when other amounts are large.
    E.g. billAmount=5 when totalKwh implies ~$5000 bill.
    """
    bill_amt_str = result.get("billAmount")
    if not bill_amt_str:
        return
    try:
        bill_amt = float(str(bill_amt_str).replace(",", ""))
    except (ValueError, TypeError):
        return
    if bill_amt >= 20:  # Donations are typically $5, $10
        return
    # Check if other amounts suggest a large bill
    kwh_str = result.get("totalKwh")
    kwh_rate_str = result.get("kwhRate")
    if kwh_str and kwh_rate_str:
        try:
            kwh = float(str(kwh_str).replace(",", ""))
            rate = float(str(kwh_rate_str).replace(",", ""))
            if kwh > 1000 and rate > 0.01 and kwh * rate > 100:
                logger.info("Rejecting billAmount %.2f as likely donation (kwh=%s, rate=%s)", bill_amt, kwh_str, kwh_rate_str)
                result["billAmount"] = ""
        except (ValueError, TypeError):
            pass


def _normalize_bill_date(val: Any) -> int | None:
    """Convert date to epoch milliseconds. Accepts epoch (int/float), ISO string, or YYYY-MM-DD."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        try:
            return int(val)
        except (ValueError, OverflowError):
            return None
    s = str(val).strip()
    if not s:
        return None
    try:
        from datetime import datetime
        for fmt, take in (("%Y-%m-%d", 10), ("%Y-%m-%dT%H:%M:%S", 19), ("%m/%d/%Y", 10), ("%d/%m/%Y", 10)):
            if len(s) < take:
                continue
            try:
                dt = datetime.strptime(s[:take], fmt)
                return int(dt.replace(tzinfo=None).timestamp() * 1000)
            except (ValueError, TypeError):
                continue
    except Exception:
        pass
    return None


def _parse_ai_json_response(reply: str) -> dict[str, Any] | None:
    """Parse JSON from AI reply (handles markdown, extra text, trailing content). Returns dict or None."""
    obj = _parse_ai_json_any(reply)
    return obj if isinstance(obj, dict) else None


def _parse_ai_json_any(reply: str) -> dict[str, Any] | list | None:
    """Parse JSON from AI reply - returns dict, list, or None. Handles markdown, {...}, [...], extra text."""
    if not reply:
        return None
    reply = reply.strip()
    # Find start of JSON (object or array)
    json_str = None
    for start in ("```json", "```", "{", "["):
        idx = reply.find(start)
        if idx >= 0:
            if start in ("{", "["):
                json_str = reply[idx:]
            else:
                json_str = reply[idx + len(start) :].split("```")[0].strip()
                if not json_str.startswith("{") and not json_str.startswith("["):
                    json_str = "{" + json_str
            break
    if json_str is None:
        json_str = reply
    # Extract balanced {...} or [...]
    if json_str.startswith("{") or json_str.startswith("["):
        open_ch, close_ch = ("{", "}") if json_str.startswith("{") else ("[", "]")
        depth, end = 0, 0
        for i, c in enumerate(json_str):
            if c == open_ch:
                depth += 1
            elif c == close_ch:
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end:
            json_str = json_str[:end]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None


def extract_bill_from_images(
    image_b64_list: list[str],
    prompt_override: str | None = None,
    selected_meters: list[str] | None = None,
) -> dict[str, Any] | None:
    """
    Extract bill data from PDF page images using AI vision model.
    Use when text extraction fails (scanned PDFs, image-only).
    prompt_override: if provided, used instead of default.
    """
    if not _is_ai_enabled() or not image_b64_list:
        return None

    base = (prompt_override and prompt_override.strip()) or DEFAULT_VISION_PROMPT
    prompt = _build_vision_prompt_with_meters(base.strip(), selected_meters)
    prompt = prompt + "\n\nReturn ONLY valid JSON, no other text."

    last_reply = ""
    for img_count in (1, 2, 4):
        images = image_b64_list[:img_count]
        reply = _call_ollama_chat(prompt, images=images, max_tokens=1500)
        if not reply:
            continue
        last_reply = reply
        obj = _parse_ai_json_response(reply)
        if not obj:
            continue
        result: dict[str, Any] = {}
        for k, v in obj.items():
            if v is None:
                continue
            if k == "billDate":
                epoch = _normalize_bill_date(v)
                if epoch is not None:
                    result[k] = epoch
            elif isinstance(v, (int, float)) and k not in ("voltage",):
                result[k] = str(v)
            else:
                result[k] = v
        _sanity_check_bill_amount(result)
        # Require at least one non-lineItems field
        meaningful = [k for k in result if k != "lineItems" and result[k] not in (None, "", [])]
        if meaningful:
            logger.warning("AI vision extraction: full JSON returned: %s", json.dumps(result, default=str))
            return result
    if last_reply:
        logger.warning("AI vision extraction: no valid data. Reply snippet: %s", last_reply[:500])
    return None


def ask_ai_recommend_decode_tool(
    image_b64_list: list[str], failed_methods: list[str]
) -> str | None:
    """
    When text extraction fails, ask the AI (with PDF page image) which tool to try next.
    Returns one of: pypdf, pdfplumber, ocr_200, ocr_300, vision
    """
    if not _is_ai_enabled() or not image_b64_list:
        return None

    failed_str = ", ".join(failed_methods) if failed_methods else "standard extraction"
    prompt = f"""This PDF could not be decoded. Failed methods: {failed_str}.

Look at this document page. We have these tools to try:
- pypdf: another PDF text extractor
- pdfplumber: table-aware PDF extractor
- ocr_200: OCR at 200 DPI (for scanned documents)
- ocr_300: OCR at 300 DPI (higher resolution)
- vision: extract data directly from the image (AI reads it)

Recommend one tool to try next. Consider: Is this a scanned document? Does it have tables? Is the text embedded or image-only?

Reply with exactly ONE word: pypdf, pdfplumber, ocr_200, ocr_300, or vision."""

    reply = _call_ollama_chat(prompt, images=image_b64_list[:1], max_tokens=50)
    if not reply:
        return None

    reply = reply.strip().lower()
    for tool in ("vision", "ocr_300", "ocr_200", "pdfplumber", "pypdf"):
        if tool in reply:
            return tool
    return "vision"  # default if unclear
