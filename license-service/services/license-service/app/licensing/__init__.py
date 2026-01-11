# Re-export functions from parent licensing.py module
import sys
from pathlib import Path

# Import the parent licensing.py module
_parent_dir = Path(__file__).parent.parent
_licensing_module_path = _parent_dir / "licensing.py"

if _licensing_module_path.exists():
    import importlib.util
    spec = importlib.util.spec_from_file_location("app.licensing_module", _licensing_module_path)
    licensing_module = importlib.util.module_from_spec(spec)
    sys.modules["app.licensing_module"] = licensing_module
    spec.loader.exec_module(licensing_module)
    
    # Re-export the functions
    build_license_payload = licensing_module.build_license_payload
    sign_license = licensing_module.sign_license
    verify_license = licensing_module.verify_license
    now_iso = licensing_module.now_iso
else:
    raise ImportError(f"Could not find licensing.py at {_licensing_module_path}")

__all__ = ["build_license_payload", "sign_license", "verify_license", "now_iso"]


