"""
Sync organization to EMV and Tracking programs when org is created in License service.
Called after registration and admin org create.
"""
import logging
from typing import Optional

import requests

from ..config import settings
from ..models.org import Organization

logger = logging.getLogger(__name__)


def sync_org_to_programs(org: Organization) -> None:
    """
    Sync org to EMV and Tracking. Non-blocking; logs errors but does not raise.
    """
    payload = {
        "org_id": org.org_id,
        "org_name": org.org_name,
        "org_type": org.org_type,
        "email": org.email,
        "contact_name": org.contact_name,
        "phone": org.phone,
        "company_address": org.company_address,
        "company_city": org.company_city,
        "company_state": org.company_state,
        "company_zip": org.company_zip,
    }

    # EMV
    if settings.emv_program_url:
        try:
            resp = requests.post(
                f"{settings.emv_program_url.rstrip('/')}/api/orgs/sync",
                json=payload,
                timeout=10,
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code in (200, 201):
                logger.info("Org %s synced to EMV", org.org_id)
            else:
                logger.warning("EMV org sync failed for %s: %s %s", org.org_id, resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("EMV org sync failed for %s: %s", org.org_id, e)

    # Tracking
    if settings.tracking_program_url:
        try:
            resp = requests.post(
                f"{settings.tracking_program_url.rstrip('/')}/api/orgs/sync",
                json=payload,
                timeout=10,
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code in (200, 201):
                logger.info("Org %s synced to Tracking", org.org_id)
            else:
                logger.warning("Tracking org sync failed for %s: %s %s", org.org_id, resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("Tracking org sync failed for %s: %s", org.org_id, e)
