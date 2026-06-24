"""Shared time utilities for Flask route modules."""
from time import time as _time


def now_ms() -> int:
    """Return current UTC time as a Unix millisecond timestamp (int)."""
    return int(_time() * 1000)
