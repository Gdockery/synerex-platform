"""
Bill Section Utils - extract document sections for scoped field extraction.
Used to limit service address patterns to the Service Address section only,
avoiding capture of unrelated addresses (e.g. remit-to at bottom).
"""
import re

# Header variants that start the service address section
SVC_HEADER = re.compile(
    r"(?:service\s+(?:address|location)|meter\s+location|service\s+to)\b",
    re.I,
)

# Section boundaries - stop before these phrases
BOUNDARY_PATTERN = re.compile(
    r"\s+(?:account\s*(?:#|number|no\.?)|meter\s*(?:#|number|no\.?)|"
    r"billing\s+(?:address|period)|service\s+period|total\s+amount|"
    r"remit\s+to|bill\s+to|current\s+charges)\b",
    re.I,
)


def extract_service_address_section(text: str) -> str:
    """
    Extract the substring from 'Service Address' (or similar header) until
    the next section boundary. Returns empty string if header not found.

    The returned section includes the header so existing regex patterns that
    match "Service Address: <content>" continue to work.
    """
    if not text or not isinstance(text, str):
        return ""

    t = re.sub(r"\s+", " ", text).strip()
    match = SVC_HEADER.search(t)
    if not match:
        return ""

    start = match.start()
    # Search for boundary after the header
    boundary = BOUNDARY_PATTERN.search(t, match.end())
    end = boundary.start() if boundary else len(t)

    return t[start:end].strip()
