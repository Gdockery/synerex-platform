from __future__ import annotations
from typing import Iterable
from fastapi import Depends, HTTPException, Request

from .license_check import LicenseChecker, LicenseError

def require_tracking_license(
    *,
    checker: LicenseChecker,
    roles: Iterable[str] = (),
    features: Iterable[str] = (),
):
    async def _dep(request: Request):
        # Expect signed license JSON in header or session (choose your pattern)
        lic = request.headers.get("X-License")
        if not lic:
            raise HTTPException(401, "Missing X-License header")
        try:
            import json
            payload = json.loads(lic)
            checker.enforce(
                license_payload=payload,
                require_program="tracking",
                require_roles=roles,
                require_features=features,
            )
            return True
        except LicenseError as e:
            raise HTTPException(403, str(e))
    return _dep
