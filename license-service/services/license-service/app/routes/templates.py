from __future__ import annotations
import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException

from ..templates_loader import TEMPLATES_ROOT
from ..programs.guardrails import validate_template

router = APIRouter(prefix="/api/templates", tags=["templates"])

def _list_templates(program_id: str) -> List[Dict[str, Any]]:
    """Load template files and extract summary information."""
    folder = TEMPLATES_ROOT / program_id
    if not folder.exists():
        return []
    
    templates_list = []
    for path in sorted(folder.glob("*.json"), key=lambda p: p.name):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            tier_name = path.stem.replace("_", " ").title()
            
            enabled_products = []
            if data.get("products", {}).get("emv", {}).get("enabled"):
                enabled_products.append("EM&V")
            if data.get("products", {}).get("tracking", {}).get("enabled"):
                enabled_products.append("Tracking")
            
            entitlements = data.get("entitlements", {})
            limits = entitlements.get("limits", {})
            features = entitlements.get("features", [])
            
            templates_list.append({
                "name": path.name,
                "template_id": data.get("template_id", ""),
                "tier_name": tier_name,
                "policy_version": data.get("policy_version", ""),
                "enabled_products": enabled_products,
                "feature_count": len(features),
                "roles": data.get("roles", []),
                "limits": limits,
                "support_tier": entitlements.get("support_tier", ""),
                "api_access": entitlements.get("api_access", False),
                "data_retention_days": entitlements.get("data_retention_days", 0)
            })
        except Exception as e:
            templates_list.append({
                "name": path.name,
                "tier_name": path.stem.replace("_", " ").title(),
                "error": str(e)
            })
    
    return templates_list

@router.get("")
def list_all_templates():
    """List all available templates across all programs."""
    emv = _list_templates("emv")
    tracking = _list_templates("tracking")
    return {
        "emv": emv,
        "tracking": tracking
    }

@router.get("/{program_id}")
def list_program_templates(program_id: str):
    """List templates for a specific program."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    templates = _list_templates(program_id)
    return {
        "program_id": program_id,
        "templates": templates
    }

@router.get("/{program_id}/{template_id}")
def get_template(program_id: str, template_id: str):
    """Get full template details by program and template ID."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    # Map template_id to filename
    if program_id == "emv":
        mapping = {
            "emv_baseline": "baseline.json",
            "emv_pro": "pro.json",
            "emv_enterprise": "enterprise.json",
            "emv_single_report": "baseline.json",  # Single report uses baseline template
            "emv_annual": "enterprise.json"  # Annual unlimited uses enterprise template
        }
        filename = mapping.get(template_id)
    elif program_id == "tracking":
        mapping = {"tracking_basic": "basic.json", "tracking_pro": "pro.json", "tracking_enterprise": "enterprise.json"}
        filename = mapping.get(template_id)
    else:
        filename = None
    
    if not filename:
        raise HTTPException(404, f"Template ID '{template_id}' not found for program '{program_id}'")
    
    path = TEMPLATES_ROOT / program_id / filename
    if not path.exists():
        raise HTTPException(404, "Template file not found")
    
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        validate_template(program_id, data)
        return {
            "program_id": program_id,
            "template_id": template_id,
            "template": data
        }
    except Exception as e:
        raise HTTPException(500, f"Error loading template: {str(e)}")

