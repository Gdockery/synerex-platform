from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, Optional

class LicenseStore:
    def __init__(self, root_dir: str):
        self.root = Path(root_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, license_payload: Dict[str, Any], filename: str = "license.json") -> Path:
        p = self.root / filename
        p.write_text(json.dumps(license_payload, indent=2, ensure_ascii=False), encoding="utf-8")
        return p

    def load(self, filename: str = "license.json") -> Dict[str, Any]:
        p = self.root / filename
        return json.loads(p.read_text(encoding="utf-8"))

    def exists(self, filename: str = "license.json") -> bool:
        return (self.root / filename).exists()

    def path(self, filename: str = "license.json") -> Path:
        return (self.root / filename)
