#!/usr/bin/env python3
"""
Seed the bill pattern store from patterns extracted from electric_bill_parser.py.
Run: python3 scripts/seed_bill_pattern_store.py
Or: python3 -m scripts.seed_bill_pattern_store (from flask_app dir)
"""
import sys
from pathlib import Path

_flask_app = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_flask_app))

# Import directly from services to avoid loading Flask app
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "bill_pattern_store",
    _flask_app / "app" / "services" / "bill_pattern_store.py",
)
_store = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_store)
batch_add_patterns = _store.batch_add_patterns
init_store = _store.init_store

# Patterns extracted from electric_bill_parser.py - field, regex, capture_group, category
# All use utility_name='*', structure_key='*' (generic) for now
SEED_PATTERNS = [
    # Energy
    {"field": "totalKwh", "regex": r"([\d,]+(?:\.\d+)?)\s*(?:kwh|kilowatt[\s-]?hours?)", "capture_group": 1, "category": "energy", "priority": 10},
    {"field": "kwhRate", "regex": r"[\d,]+\s*kwh\s+([\d.]+)\s+\$[\d,]+", "capture_group": 1, "category": "energy", "priority": 10},
    {"field": "kwhRate", "regex": r"([\d,]+)\s*kwh\s*@\s*\$([\d.]+)", "capture_group": 2, "category": "energy", "priority": 5},
    {"field": "kwhRate", "regex": r"\$\s*([\d.]+)\s*(?:per\s+)?kwh", "capture_group": 1, "category": "energy", "priority": 1},
    {"field": "kwhRate", "regex": r"(?:energy|kwh)\s+(?:rate|charge)[\s:$]*([\d.]+)", "capture_group": 1, "category": "energy", "priority": 1},
    # Demand
    {"field": "kwPeak", "regex": r"(?<![$])([\d,]+(?:\.\d+)?)\s*kw(?!h)\b", "capture_group": 1, "category": "demand", "priority": 10},
    {"field": "kwRatePerTariff", "regex": r"[\d,]+\s+Kw\s+([\d.]+)\s+\$[\d,]+", "capture_group": 1, "category": "demand", "priority": 10},
    {"field": "kwRatePerTariff", "regex": r"\$\s*([\d.]+)\s*(?:per\s+)?kw", "capture_group": 1, "category": "demand", "priority": 5},
    {"field": "kwRatePerTariff", "regex": r"kw\s*[@]\s*\$([\d.]+)", "capture_group": 1, "category": "demand", "priority": 5},
    {"field": "kwRatePerTariff", "regex": r"(?:demand|kw)\s+(?:charge|rate)[\s:$]*([\d.]+)", "capture_group": 1, "category": "demand", "priority": 1},
    # Charges - billAmount (fallback patterns; TAD section logic handled separately)
    {"field": "billAmount", "regex": r"total\s+amount\s+due[\s$]*([\d,]+\.\d{2})", "capture_group": 1, "category": "charges", "priority": 20},
    {"field": "billAmount", "regex": r"(?:total\s+amount\s+due|total\s+due)[^\d]*\$([\d,]+\.\d{2})", "capture_group": 1, "category": "charges", "priority": 15},
    {"field": "billAmount", "regex": r"\$\s*([\d,]+\.\d{2})\s*(?:total|due|payable)", "capture_group": 1, "category": "charges", "priority": 10},
    {"field": "billAmount", "regex": r"pay\s+this\s+amount[\s:]*\$?\s*([\d,]+\.\d{2})", "capture_group": 1, "category": "charges", "priority": 10},
    {"field": "customerCharge", "regex": r"customer\s+charge[^\$]*\$([\d,]+\.\d{2})", "capture_group": 1, "category": "charges", "priority": 10},
    {"field": "customerCharge", "regex": r"(?:customer|service)\s+charge[\s:$]*([\d.]+)", "capture_group": 1, "category": "charges", "priority": 5},
    {"field": "taxAmount", "regex": r"Balance[^\$]*\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}\s+\$([\d,]+\.\d{2})\s+\$[\d,]+", "capture_group": 1, "category": "charges", "priority": 10},
    {"field": "taxAmount", "regex": r"\$[\d,]+\.\d{2}\s+\$[\d,]+\.\d{2}\s+\$([\d,]+\.\d{2})\s+\$[\d,]+\.\d{2}\s+Bill", "capture_group": 1, "category": "charges", "priority": 8},
    {"field": "taxAmount", "regex": r"\btax\s+\$?\s*([\d,]+\.\d{2})", "capture_group": 1, "category": "charges", "priority": 5},
    {"field": "taxAmount", "regex": r"(?:total|subtotal)\s+taxes?\s+\$?\s*([\d,]+\.\d{2})", "capture_group": 1, "category": "charges", "priority": 5},
    # Metadata
    {"field": "daysBilled", "regex": r"(?:billing\s+)?days[\s:]*(\d+)", "capture_group": 1, "category": "metadata", "priority": 10},
    {"field": "daysBilled", "regex": r"(\d+)\s*days?\s*(?:billed|in\s+period)", "capture_group": 1, "category": "metadata", "priority": 5},
    {"field": "daysBilled", "regex": r"billing\s+period[:\s]+(?:\d+\s*-\s*)?\d+\s*\(\s*(\d+)\s*days?", "capture_group": 1, "category": "metadata", "priority": 5},
    {"field": "voltage", "regex": r"\b(480|240|208|277|120)\s*v(?:olt)?s?\b", "capture_group": 1, "category": "metadata", "priority": 10},
    {"field": "voltage", "regex": r"(?:voltage|service\s+voltage)[\s:]+(\d{3})", "capture_group": 1, "category": "metadata", "priority": 5},
    {"field": "voltage", "regex": r"(?:primary|secondary)\s+(?:voltage)?[\s:]*(\d{3})", "capture_group": 1, "category": "metadata", "priority": 5},
    {"field": "electricCompanyName", "regex": r"([A-Z][A-Za-z\s]+(?:Energy|Electric|Power|Utilities?|Corp|Company|Co\.?))\b", "capture_group": 1, "category": "metadata", "priority": 10},
    {"field": "accountNumber", "regex": r"(?:account\s*(?:#|number|no\.?)[\s:]*)([A-Za-z0-9\-]+)", "capture_group": 1, "category": "metadata", "priority": 10},
    {"field": "meterNumber", "regex": r"(?:meter\s*(?:#|number|no\.?)[\s:]*)([\d\-]+)", "capture_group": 1, "category": "metadata", "priority": 10},
    {"field": "billReference", "regex": r"billing\s+period\s+[\d/\-]+\s+to\s+([\d/\-]+)", "capture_group": 1, "category": "metadata", "priority": 15},
    {"field": "billReference", "regex": r"(?:from|to)\s+(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})\s+(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})", "capture_group": 2, "category": "metadata", "priority": 10},
    {"field": "billReference", "regex": r"(\d{1,2}/\d{1,2}/\d{4})\s+(\d{1,2}/\d{1,2}/\d{4})\s+\d{1,3}\s+[\d,]+\s+[\d,]", "capture_group": 2, "category": "metadata", "priority": 8},
    {"field": "billReference", "regex": r"(?:statement|bill)\s+date[\s:]+(\w+\s+\d{1,2},?\s*\d{4})", "capture_group": 1, "category": "metadata", "priority": 5},
    {"field": "serviceAddress", "regex": r"(?:service\s+(?:address|location)|meter\s+location|service\s+to)[\s:]+([^\n]+?)(?=\s*\n|$)", "capture_group": 1, "category": "metadata", "priority": 10},
]


def main():
    init_store()
    added, skipped = batch_add_patterns(SEED_PATTERNS, created_by="migration")
    print(f"Seed complete: {added} patterns added, {skipped} skipped (invalid regex)")
    return 0 if skipped == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
