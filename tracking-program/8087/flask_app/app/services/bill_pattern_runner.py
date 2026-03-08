"""
Bill Pattern Runner - runs regex patterns against bill text and merges into a single candidate extraction.
Each pattern contributes (field, value). Conflicts resolved by priority (higher wins).
"""
import re
from typing import Any

from app.services.bill_pattern_store import Pattern
from app.services.bill_section_utils import extract_service_address_section


# Fields where we take the LARGEST match (e.g. totalKwh, kwPeak - multiple readings, use max)
FIELDS_AGGREGATE_MAX = {"totalKwh", "kwPeak"}

# Service address fields - run patterns on Service Address section only to avoid wrong address capture
SERVICE_ADDRESS_FIELDS = {"serviceAddress", "serviceCity", "serviceState", "serviceZip"}


def run_patterns(text: str, patterns: list[Pattern]) -> dict[str, Any]:
    """
    Run all patterns on text and merge into one candidate extraction.
    For each field: if multiple patterns match, highest priority wins.
    For totalKwh/kwPeak: use findall and take max of numeric values.
    """
    if not text or not isinstance(text, str):
        return {}

    t = re.sub(r"\s+", " ", text).strip()
    svc_section = extract_service_address_section(t)
    result: dict[str, Any] = {}

    # Group patterns by field, sort by priority desc
    by_field: dict[str, list[Pattern]] = {}
    for p in patterns:
        if p.status != "active":
            continue
        by_field.setdefault(p.field, []).append(p)
    for field in by_field:
        by_field[field].sort(key=lambda x: (-x.priority, x.id))

    for field, pats in by_field.items():
        # Use service section for service-address fields to avoid capturing bottom/billing address
        search_text = (svc_section or t) if field in SERVICE_ADDRESS_FIELDS else t
        for pat in pats:
            value = _run_single_pattern(search_text, pat, field)
            if value is not None:
                result[field] = str(value) if not isinstance(value, str) else value
                break  # First (highest priority) match wins for this field

    return result


def _run_single_pattern(text: str, pat: Pattern, field: str) -> str | int | float | None:
    """
    Run one pattern. Returns extracted value or None.
    For totalKwh/kwPeak: findall and return max.
    """
    try:
        rx = re.compile(pat.regex, re.IGNORECASE)
    except re.error:
        return None

    grp = pat.capture_group or 1

    if field in FIELDS_AGGREGATE_MAX:
        matches = rx.findall(text)
        if not matches:
            return None
        values: list[float] = []
        for m in matches:
            if isinstance(m, tuple):
                part = m[grp - 1] if grp <= len(m) else m[0]
            else:
                part = m
            val = _parse_numeric(part)
            if val is not None:
                values.append(val)
        if not values:
            return None
        mx = max(values)
        return str(int(mx)) if mx == int(mx) else str(mx)

    m = rx.search(text)
    if not m:
        return None
    return _extract_from_match(m, grp)


def _parse_numeric(s: str) -> float | None:
    """Parse string to float, return None on failure."""
    if s is None:
        return None
    cleaned = str(s).replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def _extract_from_match(match: re.Match, group: int) -> str | float | None:
    """Extract value from search match object using capture_group."""
    try:
        if match.lastindex and group <= match.lastindex:
            val = match.group(group)
        else:
            val = match.group(1) if match.groups() else match.group(0)
        if val is None:
            return None
        cleaned = val.replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return cleaned
    except (IndexError, AttributeError):
        return None
