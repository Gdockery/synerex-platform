from __future__ import annotations
import json
import time
from typing import Dict, Any, Optional

import requests

from .outbox import Outbox
from .draft_seal import BaselineDraft

def sync_outbox(
    *,
    outbox_dir: str,
    license_service_base_url: str,
    api_key: str,
    max_attempts: int = 5,
    timeout_sec: int = 60,
) -> Dict[str, Any]:
    outbox = Outbox(outbox_dir)
    base = license_service_base_url.rstrip("/")

    results = {"synced": 0, "failed": 0, "skipped": 0, "details": []}

    for bundle in outbox.bundles():
        draft = outbox.load_draft(bundle)
        if draft.status == "synced":
            results["skipped"] += 1
            continue

        raw_files = outbox.raw_files(bundle)
        if not raw_files:
            draft.status = "failed"
            draft.last_error = "no_raw_files_in_bundle"
            outbox.save_draft(bundle, draft)
            results["failed"] += 1
            results["details"].append({"baseline_id": draft.baseline_id, "status": "failed", "error": draft.last_error})
            continue

        # mark syncing
        draft.status = "syncing"
        draft.last_error = ""
        outbox.save_draft(bundle, draft)

        attempt = 0
        while attempt < max_attempts:
            attempt += 1
            try:
                files = []
                for p in raw_files:
                    files.append(("raw_files", (p.name, p.read_bytes(), "application/octet-stream")))

                data = {
                    "org_id": draft.org_id,
                    "project_id": draft.project_id,
                    "baseline_id": draft.baseline_id,
                    "created_by": draft.created_by,
                    "meter_ids_csv": ",".join(draft.meter_ids),
                    "start_date": draft.start_date,
                    "end_date": draft.end_date,
                    "calc_params_json": json.dumps(draft.calc_params),
                    "license_id": draft.license_id,
                }

                resp = requests.post(
                    f"{base}/api/baselines/seal",
                    headers={"X-API-Key": api_key},
                    data=data,
                    files=files,
                    timeout=timeout_sec,
                )

                if resp.status_code == 200:
                    # success or already exists (idempotent)
                    draft.status = "synced"
                    outbox.save_draft(bundle, draft)
                    results["synced"] += 1
                    results["details"].append({"baseline_id": draft.baseline_id, "status": "synced"})
                    break

                # Non-200: treat as transient for 5xx, permanent otherwise
                if resp.status_code >= 500:
                    raise RuntimeError(f"server_error:{resp.status_code}:{resp.text[:200]}")
                else:
                    draft.status = "failed"
                    draft.last_error = f"client_error:{resp.status_code}:{resp.text[:300]}"
                    outbox.save_draft(bundle, draft)
                    results["failed"] += 1
                    results["details"].append({"baseline_id": draft.baseline_id, "status": "failed", "error": draft.last_error})
                    break

            except Exception as e:
                if attempt >= max_attempts:
                    draft.status = "failed"
                    draft.last_error = str(e)
                    outbox.save_draft(bundle, draft)
                    results["failed"] += 1
                    results["details"].append({"baseline_id": draft.baseline_id, "status": "failed", "error": draft.last_error})
                    break
                # exponential backoff
                time.sleep(min(2 ** attempt, 20))

    return results
