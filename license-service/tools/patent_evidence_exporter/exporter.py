
from pathlib import Path
import json, zipfile

def export_patent_evidence(output_zip: str, *, baseline_id: str, storage_root: str, audit_events: list):
    root = Path(storage_root) / baseline_id
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for p in root.rglob("*"):
            if p.is_file():
                z.write(p, arcname=str(p.relative_to(root)))
        z.writestr("audit_events.json", json.dumps(audit_events, indent=2))
        z.writestr("patent_notice.txt", "This evidence relates to US‑12,375,324‑B2")
