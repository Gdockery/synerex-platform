"""
Org registry client - ensures org_id exists in License service.
Calls POST /api/orgs/ensure for create-or-adopt (idempotent).

Integration: When starting analysis without org_id in session (analysis-first flow),
call ensure_org(org_name=project_name or company_name, org_type="customer")
before create_analysis_session. Use returned org_id for get_db_connection(org_id=...).
"""
import logging
import os
import urllib.request
import urllib.error
import json

logger = logging.getLogger(__name__)

LICENSE_SERVICE_URL = os.environ.get("LICENSE_SERVICE_URL", "http://localhost:8000")


def ensure_org(org_name: str, org_type: str = "customer", org_id: str = None, **kwargs) -> dict | None:
    """
    Create or adopt an org in the License service. Idempotent.
    Returns dict with org_id, org_name, org_type, created (bool), or None on failure.
    """
    url = f"{LICENSE_SERVICE_URL.rstrip('/')}/api/orgs/ensure"
    payload = {"org_name": org_name, "org_type": org_type}
    if org_id:
        payload["org_id"] = org_id
    for k in ("email", "contact_name", "phone"):
        if kwargs.get(k):
            payload[k] = kwargs[k]

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
            logger.info("Org ensure: org_id=%s created=%s", body.get("org_id"), body.get("created"))
            return body
    except urllib.error.HTTPError as e:
        logger.warning("Org ensure HTTP error %s: %s", e.code, e.read().decode()[:200])
        return None
    except Exception as e:
        logger.warning("Org ensure failed: %s", e)
        return None
