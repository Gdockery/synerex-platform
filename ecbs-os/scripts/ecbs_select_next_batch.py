#!/usr/bin/env python3
"""Select the next constitution-approved ECBS screen batch.

This keeps batch planning cheap: parse the validation CSV locally and print only
the routes needed for the next implementation pass.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Any


DEFAULT_VALIDATION_CSV = (
    Path(__file__).resolve().parents[3]
    / "ECBS Software Development Project"
    / "analysis"
    / "screenshot_constitution_validation.csv"
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Print the next approved ECBS screen batch.")
    parser.add_argument("--after", type=int, required=True, help="Only include validation_sequence values greater than this.")
    parser.add_argument("--limit", type=int, default=20, help="Maximum screens to print.")
    parser.add_argument("--module", help="Optional module exact match.")
    parser.add_argument("--route-prefix", help="Optional route prefix filter.")
    parser.add_argument("--csv", default=str(DEFAULT_VALIDATION_CSV), help="Path to screenshot_constitution_validation.csv.")
    args = parser.parse_args()

    rows = load_rows(Path(args.csv))
    selected = []
    for row in rows:
        sequence = parse_sequence(row)
        if sequence is None or sequence <= args.after:
            continue
        if row.get("automated_first_pass_status") != "VALID_CONSTITUTION_APPROVED":
            continue
        route = row.get("nextjs_route_candidate", "")
        if args.module and row.get("module") != args.module:
            continue
        if args.route_prefix and not route.startswith(args.route_prefix):
            continue
        selected.append((sequence, row))
        if len(selected) >= args.limit:
            break

    print("sequence | screen | route")
    print("--- | --- | ---")
    for sequence, row in selected:
        print(f"{sequence} | {row.get('screen_name', '')} | {row.get('nextjs_route_candidate', '')}")
    return 0


def load_rows(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def parse_sequence(row: dict[str, Any]) -> int | None:
    try:
        return int(float(row.get("validation_sequence", "")))
    except ValueError:
        return None


if __name__ == "__main__":
    raise SystemExit(main())
