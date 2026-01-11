from __future__ import annotations
import os, time, json
from typing import Any, Dict, Optional

import requests
import jwt
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

LICENSE_SERVICE_URL = os.getenv("LICENSE_SERVICE_URL", "http://localhost:8000")
SERVICE_API_KEY = os.getenv("SYNEREX_SERVICE_API_KEY", "")  # optional
JWT_SECRET = os.getenv("APP_JWT_SECRET", "dev_secret_change_me")
JWT_TTL_SECONDS = int(os.getenv("APP_JWT_TTL_SECONDS", "900"))  # 15 minutes

app = FastAPI(title="Synerex Cloud App (Sample)")

bearer = HTTPBearer(auto_error=False)

def verify_with_license_service(license_payload: Dict[str, Any]) -> Dict[str, Any]:
    headers = {"Content-Type": "application/json"}
    if SERVICE_API_KEY:
        headers["X-API-Key"] = SERVICE_API_KEY
    r = requests.post(
        f"{LICENSE_SERVICE_URL}/api/licenses/verify",
        headers=headers,
        data=json.dumps(license_payload),
        timeout=5,
    )
    if r.status_code != 200:
        raise HTTPException(403, f"license_verify_failed:{r.status_code}")
    data = r.json()
    if not data.get("valid"):
        raise HTTPException(403, data.get("reason", "license_invalid"))
    return data

def mint_session_jwt(*, license_payload: Dict[str, Any]) -> str:
    program_id = license_payload.get("program", {}).get("program_id", "")
    org_id = license_payload.get("subject", {}).get("org_id", "unknown_org")
    roles = license_payload.get("roles", []) or []
    features = license_payload.get("entitlements", {}).get("features", []) or []
    now = int(time.time())
    claims = {
        "sub": org_id,
        "license_id": license_payload.get("license_id"),
        "program_id": program_id,
        "roles": roles,
        "features": features,
        "verified_at": now,
        "exp": now + JWT_TTL_SECONDS,
    }
    return jwt.encode(claims, JWT_SECRET, algorithm="HS256")

@app.post("/session")
def create_session(x_license: str = Header(..., alias="X-License")):
    # Client supplies signed license JSON (string) in X-License.
    try:
        lic = json.loads(x_license)
    except Exception:
        raise HTTPException(400, "invalid_license_json")

    # Optional: restrict the app to a specific program ("emv" or "tracking")
    required_program = os.getenv("REQUIRED_PROGRAM", "")
    if required_program and lic.get("program", {}).get("program_id") != required_program:
        raise HTTPException(403, "wrong_program")

    verify_with_license_service(lic)

    # Optional: feature gating at login time
    required_features_csv = os.getenv("REQUIRED_FEATURES", "")
    if required_features_csv:
        required = set([x.strip() for x in required_features_csv.split(",") if x.strip()])
        have = set(lic.get("entitlements", {}).get("features", []) or [])
        if not required.issubset(have):
            raise HTTPException(403, "missing_required_features")

    token = mint_session_jwt(license_payload=lic)
    return {"token": token, "expires_in": JWT_TTL_SECONDS}

def require_session(creds: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer())) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(401, "missing_bearer_token")
    try:
        claims = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        return claims
    except Exception:
        raise HTTPException(401, "invalid_or_expired_token")

@app.get("/me")
def me(claims: Dict[str, Any] = Depends(require_session)):
    return {"claims": claims}

@app.get("/protected")
def protected(claims: Dict[str, Any] = Depends(require_session)):
    return {"ok": True, "program_id": claims.get("program_id")}
