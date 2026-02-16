#!/usr/bin/env python3
"""
API Response Parity Verification Script
Compares Flask responses against a reference server (e.g. legacy implementation).
Usage:
  cd tracking-program/8087/flask_app && python scripts/verify_api_parity.py
  # Or with custom URLs:
  REFERENCE_URL=http://localhost:8087 FLASK_URL=http://localhost:8088 python scripts/verify_api_parity.py
"""
import os
import sys
import json
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

REFERENCE_URL = os.environ.get("REFERENCE_URL", os.environ.get("SAILS_URL", "http://localhost:8087"))
FLASK_URL = os.environ.get("FLASK_URL", "http://localhost:8088")

# Endpoints that don't require auth (or we'll just check status)
PUBLIC_ENDPOINTS = [
    ("GET", "/api/whitelabel/brand-name", "whitelabel"),
]

# Endpoints that need auth - we'll check structure if 200, or document auth required
AUTH_ENDPOINTS = [
    ("GET", "/api/account", "account"),
    ("GET", "/api/project?page=1&pageSize=10", "project_list"),
    ("GET", "/api/client", "client_list"),
]


def _fetch(method, base_url, path, headers=None):
    url = base_url.rstrip("/") + path
    req = Request(url, method=method, headers=headers or {})
    try:
        with urlopen(req, timeout=10) as r:
            return r.getcode(), json.loads(r.read().decode())
    except HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(body) if body else {}
        except json.JSONDecodeError:
            return e.code, {"_raw": body}
    except URLError as e:
        return None, {"_error": str(e)}
    except json.JSONDecodeError as e:
        return 200, {"_parse_error": str(e)}


def _keys_set(obj, prefix=""):
    """Recursively collect key paths from dict."""
    if not isinstance(obj, dict):
        return set()
    keys = set()
    for k, v in obj.items():
        path = f"{prefix}.{k}" if prefix else k
        keys.add(path)
        if isinstance(v, dict) and not path.endswith("_raw"):
            keys.update(_keys_set(v, path))
    return keys


def _check_structure(ref_body, flask_body):
    """Compare top-level keys and report differences."""
    ref_keys = _keys_set(ref_body)
    flask_keys = _keys_set(flask_body)
    missing = ref_keys - flask_keys
    extra = flask_keys - ref_keys
    return missing, extra


def main():
    print("API Parity Verification")
    print("=" * 50)
    print(f"Reference: {REFERENCE_URL}")
    print(f"Flask: {FLASK_URL}")
    print()

    results = []
    for method, path, name in PUBLIC_ENDPOINTS + AUTH_ENDPOINTS:
        ref_status, ref_body = _fetch(method, REFERENCE_URL, path, {})
        flask_status, flask_body = _fetch(method, FLASK_URL, path, {})

        ok = ref_status == flask_status and ref_status is not None
        if ref_status and flask_status and ref_status == 200 and flask_status == 200:
            missing, extra = _check_structure(ref_body, flask_body)
            if missing or extra:
                ok = False
        else:
            missing, extra = set(), set()

        results.append({
            "name": name,
            "path": path.split("?")[0],
            "reference_status": ref_status,
            "flask_status": flask_status,
            "ok": ok,
            "missing_in_flask": sorted(missing),
            "extra_in_flask": sorted(extra),
        })
        status_sym = "✓" if ok else "✗"
        path_display = path.split("?")[0] if "?" in path else path
        print(f"{status_sym} {name} ({path_display}): Ref={ref_status} Flask={flask_status}")
        if not ok and (missing or extra):
            if missing:
                print(f"  Missing in Flask: {list(missing)[:5]}{'...' if len(missing) > 5 else ''}")
            if extra:
                print(f"  Extra in Flask: {list(extra)[:5]}{'...' if len(extra) > 5 else ''}")

    print()
    passed = sum(1 for r in results if r["ok"])
    print(f"Passed: {passed}/{len(results)}")

    # Write report
    report_path = os.path.join(os.path.dirname(__file__), "..", "docs", "api_parity_report.json")
    with open(report_path, "w") as f:
        json.dump({"endpoints": results, "summary": {"passed": passed, "total": len(results)}}, f, indent=2)
    print(f"Report written to {report_path}")

    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
