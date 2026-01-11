from __future__ import annotations
import json
import uuid
import hashlib
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def canonical_json_bytes(obj: Dict[str, Any]) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def hash_calc_params(calc_params: Dict[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes(calc_params))

def hash_files(paths: List[Path]) -> Tuple[str, List[Dict[str, str]]]:
    manifest = []
    hashes = []
    for p in paths:
        data = p.read_bytes()
        h = sha256_hex(data)
        manifest.append({"name": p.name, "sha256": h, "bytes": str(len(data))})
        hashes.append(h)
    raw_hash = sha256_hex("|".join(sorted(hashes)).encode("utf-8"))
    return raw_hash, manifest

@dataclass
class BaselineDraft:
    baseline_id: str
    org_id: str
    project_id: str
    created_by: str
    meter_ids: List[str]
    start_date: str
    end_date: str
    raw_data_hash: str
    calc_hash: str
    calc_params: Dict[str, Any]
    file_manifest: List[Dict[str, str]]
    created_at: str
    status: str  # queued|syncing|synced|failed
    last_error: str = ""
    license_id: str = ""

def create_draft(
    *,
    org_id: str,
    project_id: str,
    created_by: str,
    meter_ids: List[str],
    start_date: str,
    end_date: str,
    raw_files: List[str],
    calc_params: Dict[str, Any],
    license_id: str,
    baseline_id: str | None = None,
) -> Tuple[BaselineDraft, List[Path]]:
    baseline_id = baseline_id or f"BL-{uuid.uuid4()}"
    paths = [Path(p) for p in raw_files]
    raw_hash, manifest = hash_files(paths)
    calc_hash = hash_calc_params(calc_params)

    draft = BaselineDraft(
        baseline_id=baseline_id,
        org_id=org_id,
        project_id=project_id,
        created_by=created_by,
        meter_ids=meter_ids,
        start_date=start_date,
        end_date=end_date,
        raw_data_hash=raw_hash,
        calc_hash=calc_hash,
        calc_params=calc_params,
        file_manifest=manifest,
        created_at=datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        status="queued",
        license_id=license_id,
    )
    return draft, paths

def save_outbox_bundle(outbox_dir: str, draft: BaselineDraft, raw_paths: List[Path]) -> Path:
    outbox = Path(outbox_dir)
    outbox.mkdir(parents=True, exist_ok=True)

    bundle_dir = outbox / draft.baseline_id
    bundle_dir.mkdir(parents=True, exist_ok=True)

    # copy raw files into bundle to make sync reliable
    raw_dir = bundle_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    for p in raw_paths:
        (raw_dir / p.name).write_bytes(p.read_bytes())

    (bundle_dir / "draft.json").write_text(json.dumps(asdict(draft), indent=2, ensure_ascii=False), encoding="utf-8")
    return bundle_dir
