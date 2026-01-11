from __future__ import annotations
import json
import time
from typing import Any, Dict, Iterable, Optional, Set

import requests
from cachetools import TTLCache

class LicenseError(Exception):
    pass

class LicenseChecker:
    """Online-only license checker for the Tracking Portal.

    - Calls license-service /api/licenses/verify
    - Enforces required roles/features for routes
    - Caches positive results briefly to reduce chatter
    """

    def __init__(
        self,
        *,
        license_service_base_url: str,
        service_api_key: Optional[str] = None,
        cache_ttl_sec: int = 30,
        cache_max: int = 2048,
        timeout_sec: int = 5,
    ):
        self.base = license_service_base_url.rstrip("/")
        self.service_api_key = service_api_key
        self.timeout = timeout_sec
        self.cache = TTLCache(maxsize=cache_max, ttl=cache_ttl_sec)

    def _headers(self) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.service_api_key:
            h["X-API-Key"] = self.service_api_key
        return h

    def _cache_key(self, license_payload: Dict[str, Any]) -> str:
        return license_payload.get("license_id", "") + ":" + license_payload.get("program", {}).get("authorization_id", "")

    def verify_online(self, license_payload: Dict[str, Any]) -> Dict[str, Any]:
        key = self._cache_key(license_payload)
        if key in self.cache:
            return self.cache[key]

        resp = requests.post(
            f"{self.base}/api/licenses/verify",
            headers=self._headers(),
            data=json.dumps(license_payload),
            timeout=self.timeout,
        )
        if resp.status_code != 200:
            raise LicenseError(f"verify_failed:{resp.status_code}")
        data = resp.json()
        if not data.get("valid"):
            raise LicenseError(data.get("reason", "invalid"))
        self.cache[key] = data
        return data

    @staticmethod
    def _require_roles(payload: Dict[str, Any], roles: Iterable[str]):
        if not roles:
            return
        have = set(payload.get("roles", []))
        need = set(roles)
        if not need.issubset(have):
            raise LicenseError(f"missing_roles:{sorted(list(need-have))}")

    @staticmethod
    def _require_features(payload: Dict[str, Any], features: Iterable[str]):
        if not features:
            return
        have = set(payload.get("entitlements", {}).get("features", []))
        need = set(features)
        if not need.issubset(have):
            raise LicenseError(f"missing_features:{sorted(list(need-have))}")

    def enforce(
        self,
        *,
        license_payload: Dict[str, Any],
        require_program: str = "tracking",
        require_roles: Iterable[str] = (),
        require_features: Iterable[str] = (),
    ) -> Dict[str, Any]:
        # Program guard
        program_id = license_payload.get("program", {}).get("program_id")
        if program_id != require_program:
            raise LicenseError(f"wrong_program:{program_id}")

        # Online verify (authoritative)
        verify_data = self.verify_online(license_payload)

        # Role/feature enforcement
        self._require_roles(license_payload, require_roles)
        self._require_features(license_payload, require_features)

        return verify_data
