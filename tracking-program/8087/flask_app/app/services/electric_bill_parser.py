"""
Electric Bill Parser - extracts bill data from extracted PDF text using regex.
Ported from api/services/utilities/electric-bill-parser.js.
Returns data shape for Bill Analytic form pre-fill.
"""
import re
from datetime import datetime
from typing import Any


def _parse_bill_date(date_str: str) -> int | None:
    """Parse bill date string to epoch ms. Tries common formats."""
    s = date_str.strip()
    formats = [
        "%b %d, %Y",
        "%B %d, %Y",
        "%b %d %Y",
        "%B %d %Y",
        "%m/%d/%Y",
        "%Y-%m-%d",
        "%d %b %Y",
        "%d %B %Y",
    ]
    for fmt in formats:
        try:
            d = datetime.strptime(s, fmt)
            return int(d.timestamp() * 1000)
        except ValueError:
            continue
    return None


def parse(text: str) -> dict[str, Any]:
    """
    Parse extracted PDF text and return data shape for Bill Analytic form.
    Returns: { success, data?, error?, partial? }
    """
    if not text or not isinstance(text, str):
        return {"success": False, "error": "No text to parse"}

    t = re.sub(r"\s+", " ", text).strip()
    result = {}

    # totalKwh
    kwh_match = (
        re.search(
            r"(?:total\s+)?(?:kwh|kilowatt[\s-]?hours?|usage|energy\s+consumed)[\s:]*(?:=\s*)?([\d,]+(?:\.\d+)?)",
            t,
            re.I,
        )
        or re.search(r"([\d,]+(?:\.\d+)?)\s*(?:kwh|kilowatt[\s-]?hours?)", t, re.I)
        or re.search(r"usage[:\s]+([\d,]+(?:\.\d+)?)", t, re.I)
    )
    if kwh_match:
        result["totalKwh"] = kwh_match.group(1).replace(",", "")

    # kwPeak
    kw_match = (
        re.search(
            r"(?:peak\s+)?demand[\s:(]*(?:kw)?[\s)]*[:\s]*([\d,]+(?:\.\d+)?)",
            t,
            re.I,
        )
        or re.search(r"billed\s+demand[\s:]+([\d,]+(?:\.\d+)?)", t, re.I)
        or re.search(r"([\d,]+(?:\.\d+)?)\s*kw\b", t, re.I)
    )
    if kw_match:
        result["kwPeak"] = kw_match.group(1).replace(",", "")

    # billAmount
    amount_match = (
        re.search(
            r"(?:total\s+due|amount\s+due|balance\s+due|current\s+charges?)[\s:$]*([\d,]+\.\d{2})",
            t,
            re.I,
        )
        or re.search(r"\$\s*([\d,]+\.\d{2})\s*(?:total|due)", t, re.I)
        or re.search(r"(?:total|grand\s+total)[\s:]*\$?\s*([\d,]+\.\d{2})", t, re.I)
    )
    if amount_match:
        result["billAmount"] = amount_match.group(1).replace(",", "")

    # daysBilled
    days_match = (
        re.search(r"(?:billing\s+)?days[\s:]*(\d+)", t, re.I)
        or re.search(r"(\d+)\s*days?\s*(?:billed|in\s+period)", t, re.I)
        or re.search(r"billing\s+period[:\s]+(?:\d+\s*-\s*)?\d+\s*\(\s*(\d+)\s*days?", t, re.I)
    )
    if days_match:
        result["daysBilled"] = days_match.group(1)

    # kwRatePerTariff
    kw_rate_match = (
        re.search(r"(?:demand\s+)?(?:charge|rate)[\s:$]*([\d.]+)", t, re.I)
        or re.search(r"\$\s*([\d.]+)\s*(?:per\s+)?kw", t, re.I)
    )
    if kw_rate_match:
        result["kwRatePerTariff"] = kw_rate_match.group(1)

    # customerCharge
    cust_match = re.search(
        r"(?:customer|service)\s+charge[\s:$]*([\d.]+)", t, re.I
    )
    if cust_match:
        result["customerCharge"] = cust_match.group(1)

    # voltage
    volt_match = (
        re.search(r"\b(480|240|208|277|120)\s*v(?:olt)?s?\b", t, re.I)
        or re.search(r"(?:voltage|service\s+voltage)[\s:]+(\d{3})", t, re.I)
        or re.search(r"(?:primary|secondary)\s+(?:voltage)?[\s:]*(\d{3})", t, re.I)
    )
    if volt_match:
        v = int(volt_match.group(1))
        if v in (120, 208, 240, 277, 480):
            result["voltage"] = v

    # tariff
    tariff_match = (
        re.search(
            r"(?:tariff|rate\s*schedule|rate\s*class|schedule|rate\s*code|rate\s*type|billing\s*schedule)[\s:]+([A-Za-z0-9\s\-\.\/\>\<]{3,80}?)(?=\.\s+[A-Z]|\s+account\b|\s+meter\b|\s+total\s+kwh|$)",
            t,
            re.I,
        )
        or re.search(
            r"(?:under\s+)?(?:tariff|schedule)[\s:]+([A-Za-z0-9\s\-\.\/\>\<]{3,60})",
            t,
            re.I,
        )
        or re.search(
            r"([A-Z][A-Za-z0-9\-\/]+\s+(?:TOU|GS|General|Large|Small|Primary|Secondary|Medium|Gen)\s+[A-Za-z0-9\s\-\.\/]+)",
            t,
        )
        or re.search(
            r"([A-Z]{2,6}[\-\s]?[A-Z]?\s+(?:TOU|GS|OPT[\-\s]?V?|General|Large|Small)\s+[A-Za-z0-9\s\-\.\/]+)",
            t,
            re.I,
        )
        or re.search(
            r"([A-Za-z0-9\-\/\s]{4,50}(?:TOU|Time[\s\-]?of[\s\-]?Use|General\s*Service|Demand)[A-Za-z0-9\s\-\.\/]*)",
            t,
            re.I,
        )
    )
    if tariff_match:
        tariff = tariff_match.group(1).strip()
        tariff = re.sub(r"\s+", " ", tariff)[:120]
        if len(tariff) >= 3:
            result["tariff"] = tariff

    # electricCompanyName
    util_match = re.search(
        r"([A-Z][A-Za-z\s]+(?:Energy|Electric|Power|Utilities?|Corp|Company|Co\.?))\b",
        t,
    )
    if util_match:
        result["electricCompanyName"] = util_match.group(1).strip()

    # electricCompanyAddress
    addr_match = (
        re.search(
            r"(?:billing\s+)?address[\s:]+(\d+[A-Za-z0-9\s\.\-\#]+?)(?=\s*(?:[A-Za-z]+,|[A-Z]{2}\s+\d{5}|$))",
            t,
            re.I,
        )
        or re.search(
            r"(\d{1,6}\s+[A-Za-z0-9\s\.\-\#]{4,40}?(?:\s+(?:street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|way|place|pl)\.?)?)\s*(?:,|\s+[A-Z]{2}\s+\d{5}|$)",
            t,
            re.I,
        )
    )
    if addr_match:
        result["electricCompanyAddress"] = re.sub(
            r"\s+", " ", addr_match.group(1).strip()
        )

    # electricCompanyCity, State, Zip
    city_state_zip_match = (
        re.search(r"([A-Za-z\s\-]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b", t)
        or re.search(r"([A-Za-z\s\-]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b", t)
    )
    if city_state_zip_match:
        city, state, zip_code = city_state_zip_match.groups()
        if "electricCompanyCity" not in result:
            result["electricCompanyCity"] = city.strip()
        if "electricCompanyState" not in result:
            result["electricCompanyState"] = state
        if "electricCompanyZip" not in result:
            result["electricCompanyZip"] = zip_code

    # serviceAddress, serviceCity, serviceState, serviceZip
    svc_addr_match = re.search(
        r"(?:service\s+(?:address|location)|meter\s+location|service\s+to)[\s:]+([^\n]+?)(?=\s*\n|$)",
        t,
        re.I,
    )
    if svc_addr_match:
        svc_line = svc_addr_match.group(1).strip()
        svc_line = re.sub(r"\s+", " ", svc_line)
        parts = re.split(r",\s*", svc_line)
        if parts:
            result["serviceAddress"] = parts[0].strip()
        svc_csz = re.search(
            r"([A-Za-z\s\-]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)", svc_line
        )
        if svc_csz:
            result["serviceCity"] = svc_csz.group(1).strip()
            result["serviceState"] = svc_csz.group(2)
            result["serviceZip"] = svc_csz.group(3)

    # accountNumber
    acct_match = re.search(
        r"(?:account\s*(?:#|number|no\.?)[\s:]*)([A-Za-z0-9\-]+)", t, re.I
    )
    if acct_match:
        result["accountNumber"] = acct_match.group(1).strip()

    # meterNumber
    meter_match = re.search(
        r"(?:meter\s*(?:#|number|no\.?)[\s:]*)([\d\-]+)", t, re.I
    )
    if meter_match:
        result["meterNumber"] = meter_match.group(1).strip()

    # voltage (second pass - more values)
    voltage_match = (
        re.search(r"\b(600|480|460|277|240|230|208|120)\s*v(?:olts?)?\b", t, re.I)
        or re.search(
            r"(?:primary|service)\s*(?:voltage|level)?[\s:]*(\d{3})", t, re.I
        )
        or re.search(
            r"(\d{3})\s*(?:volt|v)\s*(?:service|primary|secondary)?", t, re.I
        )
    )
    if voltage_match:
        v = int(voltage_match.group(1))
        if v in (120, 208):
            result["voltage"] = v
        elif v in (230, 240):
            result["voltage"] = 240
        elif v == 277:
            result["voltage"] = 277
        elif v in (460, 480):
            result["voltage"] = 480
        elif v == 600:
            result["voltage"] = 600

    # billDate / billReference
    date_match = (
        re.search(r"(?:statement|bill)\s+date[\s:]+(\w+\s+\d{1,2},?\s*\d{4})", t, re.I)
        or re.search(r"(\w+\s+\d{1,2},?\s*\d{4})", t)
    )
    if date_match:
        result["billReference"] = date_match.group(1)
        ts = _parse_bill_date(date_match.group(1))
        if ts:
            result["billDate"] = ts

    # Line items
    line_items = []
    kwh_charge_match = re.search(
        r"(?:energy|kwh)\s+charge[s]?[\s:$]*([\d,]+\.?\d*)", t, re.I
    )
    if kwh_charge_match:
        line_items.append(
            {
                "name": "KWH Charges",
                "type": "kwh",
                "cost": float(
                    kwh_charge_match.group(1).replace(",", "") or "0"
                ),
                "billingRate": 0,
                "tierHours": "24",
                "meterReading": result.get("totalKwh", ""),
                "savings": 0,
            }
        )
    kw_charge_match = re.search(
        r"(?:demand|kw)\s+charge[s]?[\s:$]*([\d,]+\.?\d*)", t, re.I
    )
    if kw_charge_match:
        line_items.append(
            {
                "name": "KW Charges",
                "type": "kw",
                "cost": float(kw_charge_match.group(1).replace(",", "") or "0"),
                "billingRate": float(result.get("kwRatePerTariff", 0) or 0),
                "tierHours": "24",
                "meterReading": result.get("kwPeak", ""),
                "savings": 0,
            }
        )
    if line_items:
        result["lineItems"] = line_items

    has_minimum_data = bool(
        result.get("totalKwh") or result.get("kwPeak") or result.get("billAmount")
    )
    partial = bool(
        (result.get("totalKwh") or result.get("kwPeak") or result.get("billAmount"))
        and not (
            result.get("totalKwh") and result.get("kwPeak") and result.get("billAmount")
        )
    )
    return {
        "success": has_minimum_data,
        "data": result,
        "partial": partial,
    }
