from __future__ import annotations
import base64
import json
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Set

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

def canonical_json_bytes(obj: Dict[str, Any]) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def load_public_key(pem_bytes: bytes) -> Ed25519PublicKey:
    return serialization.load_pem_public_key(pem_bytes)

def verify_signed_payload(pub: Ed25519PublicKey, signed_payload: Dict[str, Any]) -> bool:
    sig = signed_payload.get("signature", {})
    sig_b64 = sig.get("value")
    if not sig_b64:
        return False
    unsigned = dict(signed_payload)
    unsigned.pop("signature", None)
    try:
        sig_bytes = base64.b64decode(sig_b64.encode("ascii"))
        pub.verify(sig_bytes, canonical_json_bytes(unsigned))
        return True
    except Exception:
        return False

def _today_utc() -> date:
    return datetime.now(timezone.utc).date()

def _in_term(payload: Dict[str, Any]) -> bool:
    term = payload.get("term", {})
    start_s = term.get("start")
    end_s = term.get("end")
    if not start_s or not end_s:
        return False
    start_d = date.fromisoformat(start_s)
    end_d = date.fromisoformat(end_s)
    today = _today_utc()
    return start_d <= today <= end_d

@dataclass
class VerifyResult:
    ok: bool
    reason: str = ""
    program_id: str = ""
    license_id: str = ""

def assert_emv_license_ok(
    license_json: Dict[str, Any],
    public_key_pem: bytes,
    require_role: str = "oem_engineer",
    require_feature: Optional[str] = "baseline_creation",
) -> VerifyResult:
    try:
        pub = load_public_key(public_key_pem)
    except Exception:
        return VerifyResult(False, "bad_public_key")

    if not verify_signed_payload(pub, license_json):
        return VerifyResult(False, "bad_signature")

    if not _in_term(license_json):
        return VerifyResult(False, "expired_or_not_active")

    program = license_json.get("program", {})
    program_id = program.get("program_id", "")
    if program_id != "emv":
        return VerifyResult(False, "not_emv_program", program_id=program_id, license_id=license_json.get("license_id",""))

    products = license_json.get("products", {})
    emv = products.get("emv", {})
    if not emv.get("enabled", False):
        return VerifyResult(False, "emv_not_enabled", program_id=program_id, license_id=license_json.get("license_id",""))

    if not emv.get("offline_allowed", False):
        return VerifyResult(False, "offline_not_allowed", program_id=program_id, license_id=license_json.get("license_id",""))

    roles: Set[str] = set(license_json.get("roles", []))
    if require_role and require_role not in roles:
        return VerifyResult(False, f"missing_role:{require_role}", program_id=program_id, license_id=license_json.get("license_id",""))

    feats: Set[str] = set(license_json.get("entitlements", {}).get("features", []))
    if require_feature and require_feature not in feats:
        return VerifyResult(False, f"missing_feature:{require_feature}", program_id=program_id, license_id=license_json.get("license_id",""))

    return VerifyResult(True, "ok", program_id=program_id, license_id=license_json.get("license_id",""))

def load_public_key_file(path: str) -> bytes:
    return Path(path).read_bytes()

def load_license_file(path: str) -> Dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def compute_device_fingerprint() -> str:
    """Best-effort, cross-platform device fingerprint (placeholder).

    For production, consider TPM-backed IDs or signed device certificates.
    """
    import platform, uuid, hashlib
    parts = [
        platform.system(),
        platform.release(),
        platform.version(),
        platform.node(),
        str(uuid.getnode()),
    ]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()

def require_device_fingerprint(license_json: Dict[str, Any], local_fingerprint: str) -> VerifyResult:
    bindings = license_json.get("bindings", {})
    allowed = bindings.get("device_fingerprints") or []
    if not allowed:
        return VerifyResult(True, "no_device_binding", program_id=license_json.get("program", {}).get("program_id",""), license_id=license_json.get("license_id",""))
    if local_fingerprint not in set(allowed):
        return VerifyResult(False, "device_not_authorized", program_id=license_json.get("program", {}).get("program_id",""), license_id=license_json.get("license_id",""))
    return VerifyResult(True, "device_ok", program_id=license_json.get("program", {}).get("program_id",""), license_id=license_json.get("license_id",""))
