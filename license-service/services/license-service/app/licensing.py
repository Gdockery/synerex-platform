import json
from datetime import datetime, timezone
from typing import Any, Dict
from .crypto.canonical import canonical_json_bytes
from .crypto.signing import sign_bytes, verify_bytes

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

def build_license_payload(*, license_id: str, issuer: str, org: Dict[str,str], term_start: str, term_end: str,
                          program: Dict[str,Any], template: Dict[str,Any]) -> Dict[str, Any]:
    payload = {
        "license_version": "1.0",
        "license_id": license_id,
        "issued_at": now_iso(),
        "issuer": issuer,
        "organization": org,
        "program": program,
        "products": template["products"],
        "roles": template["roles"],
        "entitlements": template["entitlements"],
        "bindings": template["bindings"],
        "term": {"start": term_start, "end": term_end, "auto_expire": True},
        "revocation": {"revocable": True, "reason_codes": ["non_payment","breach","term_expired"], "grace_seconds": 300, "cache_ttl_sec": 30}
    }
    return payload

def sign_license(priv_key, payload: Dict[str, Any], key_id: str) -> Dict[str, Any]:
    unsigned = dict(payload)
    unsigned.pop("signature", None)
    sig_b64 = sign_bytes(priv_key, canonical_json_bytes(unsigned))
    signed = dict(unsigned)
    signed["signature"] = {"alg": "Ed25519", "key_id": key_id, "value": sig_b64}
    return signed

def verify_license(pub_key, signed_payload: Dict[str, Any]) -> bool:
    sig = signed_payload.get("signature", {})
    sig_b64 = sig.get("value")
    if not sig_b64:
        return False
    unsigned = dict(signed_payload)
    unsigned.pop("signature", None)
    return verify_bytes(pub_key, canonical_json_bytes(unsigned), sig_b64)
