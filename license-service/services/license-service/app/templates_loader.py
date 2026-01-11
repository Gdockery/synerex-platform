import json
from pathlib import Path
from typing import Dict, Any

# Path: services/license-service/app/templates_loader.py
# Need to go up 3 levels: app -> license-service -> services -> project root -> templates
TEMPLATES_ROOT = Path(__file__).resolve().parents[3] / "templates"

def load_template(program_id: str, template_id: str) -> Dict[str, Any]:
    # map template_id to filename convention
    if program_id == "emv":
        mapping = {
            "emv_baseline": "baseline.json",
            "emv_pro": "pro.json",
            "emv_enterprise": "enterprise.json",
            "emv_single_report": "baseline.json",  # Single report uses baseline template
            "emv_annual": "enterprise.json"  # Annual unlimited uses enterprise template
        }
        fn = mapping.get(template_id)
        path = TEMPLATES_ROOT / "emv" / fn if fn else None
    elif program_id == "tracking":
        mapping = {"tracking_basic":"basic.json","tracking_pro":"pro.json","tracking_enterprise":"enterprise.json"}
        fn = mapping.get(template_id)
        path = TEMPLATES_ROOT / "tracking" / fn if fn else None
    else:
        raise ValueError("program_id must be emv or tracking")
    if not path or not path.exists():
        raise FileNotFoundError(f"Template not found: {program_id}:{template_id}")
    return json.loads(path.read_text(encoding="utf-8"))
