#!/usr/bin/env python3
"""
Bill extraction test: text parser with sample text, or real PDF if path given.
Run: python3 tracking-program/8087/flask_app/scripts/test_bill_extraction.py
     python3 .../test_bill_extraction.py path/to/BillImage.pdf
Or from Docker: docker-compose run --rm -v "$(pwd)/BillImage.pdf:/tmp/bill.pdf:ro" tracking-program python /app/8087-flask/scripts/test_bill_extraction.py /tmp/bill.pdf
"""
import sys
from pathlib import Path

# Add flask_app so "from app.services" works
_flask_app = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_flask_app))

def _load_parser():
    import importlib.util
    _services = Path(__file__).resolve().parent.parent / "app" / "services"
    _spec = importlib.util.spec_from_file_location("electric_bill_parser", _services / "electric_bill_parser.py")
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    return _mod.parse

parse_text = None  # set in main


# Dallas-mod.pdf style sample text (values before kWh, kW; various bill amount formats)
SAMPLE_BILL_TEXT = """
Oncor Electric Delivery
Account: 123456789
Meter: 987654321
Service Period: 12/01/2024 - 12/31/2024
Billing Days: 31

Usage Summary:
Energy Charges
  100 kWh @ $0.05      $5.00
  500 kWh @ $0.08     $40.00
  11,845 kWh @ $0.10  $1,184.50

Demand Charges
  Billed Demand: 450 kW @ $12.50  $5,625.00

Customer Charge                    $25.00
Tax                                  $89.45
-------------------------------------------
Total Amount Due               $6,968.95
Please pay this amount by 01/15/2025
"""


def _print_data(data, title="Extracted data"):
    print(f"\n   {title}:")
    print(f"   totalKwh:      {data.get('totalKwh')}")
    print(f"   kwPeak:        {data.get('kwPeak')}")
    print(f"   billAmount:    {data.get('billAmount')}")
    print(f"   kwRatePerTariff: {data.get('kwRatePerTariff')}")
    print(f"   kwhRate:       {data.get('kwhRate')}")
    print(f"   customerCharge: {data.get('customerCharge')}")
    print(f"   taxAmount:     {data.get('taxAmount')}")
    print(f"   daysBilled:    {data.get('daysBilled')}")
    if data.get("lineItems"):
        total = float(data.get("billAmount") or 0)
        line_sum = sum(float(li.get("cost") or 0) for li in data["lineItems"])
        print(f"   lineItems ({len(data['lineItems'])}):")
        for li in data["lineItems"]:
            print(f"      - {li.get('name')}: {li.get('cost')} (type={li.get('type')})")
        print(f"   sum of line items: {line_sum:.2f} (bill total: {total:.2f}) {'✓' if abs(line_sum - total) < 0.02 else 'MISMATCH'}")


def main():
    global parse_text
    parse_text = _load_parser()

    pdf_path = sys.argv[1] if len(sys.argv) > 1 else None

    if pdf_path:
        path = Path(pdf_path)
        if not path.exists():
            print(f"Error: PDF not found: {path}")
            sys.exit(1)
        print("=" * 60)
        print(f"Bill Extraction from PDF: {path.name}")
        print("=" * 60)
        pdf_bytes = path.read_bytes()
        from app.services.bill_pdf_extractor import extract_bill_data
        result = extract_bill_data(pdf_bytes)
        print(f"\nsuccess: {result.get('success')}")
        if result.get("error"):
            print(f"error: {result['error']}")
        if result.get("data"):
            _print_data(result["data"], "Extracted data")
    else:
        print("=" * 60)
        print("Bill Extraction (sample text)")
        print("=" * 60)
        result = parse_text(SAMPLE_BILL_TEXT)
        print(f"\nsuccess: {result.get('success')}")
        if result.get("data"):
            _print_data(result["data"], "Sample text parsed")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
