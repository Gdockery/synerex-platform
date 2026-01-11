from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from .draft_seal import BaselineDraft

class Outbox:
    def __init__(self, outbox_dir: str):
        self.root = Path(outbox_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def bundles(self) -> List[Path]:
        return sorted([p for p in self.root.iterdir() if p.is_dir() and p.name.startswith("BL-")])

    def load_draft(self, bundle_dir: Path) -> BaselineDraft:
        d = json.loads((bundle_dir / "draft.json").read_text(encoding="utf-8"))
        return BaselineDraft(**d)

    def save_draft(self, bundle_dir: Path, draft: BaselineDraft) -> None:
        from dataclasses import asdict
        (bundle_dir / "draft.json").write_text(json.dumps(asdict(draft), indent=2, ensure_ascii=False), encoding="utf-8")

    def raw_files(self, bundle_dir: Path) -> List[Path]:
        raw_dir = bundle_dir / "raw"
        if not raw_dir.exists():
            return []
        return sorted([p for p in raw_dir.iterdir() if p.is_file()])

    def summary(self) -> List[Dict[str, Any]]:
        items = []
        for b in self.bundles():
            try:
                d = self.load_draft(b)
                items.append({"baseline_id": d.baseline_id, "project_id": d.project_id, "status": d.status, "last_error": d.last_error})
            except Exception as e:
                items.append({"baseline_id": b.name, "status": "corrupt", "last_error": str(e)})
        return items
