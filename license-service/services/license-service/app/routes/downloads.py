from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from fastapi import APIRouter, Header, HTTPException, Request, Body, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.license import License
from ..audit.events import log_event
from ..downloads.watermark import watermark_pdf_bytes

router = APIRouter(prefix="/downloads", tags=["downloads"])

DOWNLOADS_DIR = Path(__file__).resolve().parents[3] / "downloads"
REGISTRY_PATH = DOWNLOADS_DIR / "registry.json"
FILES_DIR = Path(__file__).resolve().parents[4] / "governance" / "pdfs"

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _load_registry() -> Dict[str, Any]:
    if not REGISTRY_PATH.exists():
        return {"documents": []}
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))

def _parse_license_header(x_license: Optional[str]) -> Dict[str, Any]:
    if not x_license:
        raise HTTPException(401, "Missing X-License header (signed license JSON)")
    try:
        return json.loads(x_license)
    except Exception:
        raise HTTPException(400, "Invalid X-License JSON")

def _validate_license_online(db: Session, lic_payload: Dict[str, Any]) -> License:
    license_id = lic_payload.get("license_id")
    if not license_id:
        raise HTTPException(401, "Missing license_id")
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(403, "License not found")
    if rec.revoked:
        raise HTTPException(403, "License revoked")
    # term check (same semantics as verify endpoint)
    term = lic_payload.get("term", {})
    if not (term.get("start") and term.get("end")):
        raise HTTPException(403, "Missing term")
    from datetime import date, datetime, timezone
    today = datetime.now(timezone.utc).date()
    if not (date.fromisoformat(term["start"]) <= today <= date.fromisoformat(term["end"])):
        raise HTTPException(403, "License expired_or_not_active")
    return rec

def _license_roles(lic_payload: Dict[str, Any]) -> Set[str]:
    return set(lic_payload.get("roles", []) or [])

def _license_features(lic_payload: Dict[str, Any]) -> Set[str]:
    return set((lic_payload.get("entitlements", {}) or {}).get("features", []) or [])

def _license_program(lic_payload: Dict[str, Any]) -> str:
    return (lic_payload.get("program", {}) or {}).get("program_id", "")

def _license_org(lic_payload: Dict[str, Any]) -> str:
    return (lic_payload.get("subject", {}) or {}).get("org_id") or "unknown_org"

def _license_user(lic_payload: Dict[str, Any]) -> str:
    # optional user_id if portals provide it
    return (lic_payload.get("subject", {}) or {}).get("user_id") or _license_org(lic_payload)

def _doc_allowed(doc: Dict[str, Any], program_id: str, roles: Set[str], features: Set[str]) -> bool:
    lifecycle = doc.get("lifecycle", "approved")
    # draft is never downloadable
    if lifecycle == "draft":
        return False
    # retired is downloadable to admin only
    if lifecycle == "retired":
        if roles.isdisjoint({"admin", "synerex_admin"}):
            return False
    # approved is normal path
    if lifecycle not in {"approved", "retired"}:
        return False
    programs = set(doc.get("programs", []) or [])
    if programs and program_id not in programs:
        return False
    allowed_roles = set(doc.get("allowed_roles", []) or [])
    if allowed_roles and roles.isdisjoint(allowed_roles):
        return False
    required = set(doc.get("required_entitlements", []) or [])
    if required and not required.issubset(features):
        return False
    return True

@router.get("")
def list_downloads(
    request: Request,
    x_license: Optional[str] = Header(None),
):
    lic_payload = _parse_license_header(x_license)
    roles = _license_roles(lic_payload)
    features = _license_features(lic_payload)
    program_id = _license_program(lic_payload)
    reg = _load_registry()

    docs = []
    for d in reg.get("documents", []):
        if _doc_allowed(d, program_id, roles, features):
            docs.append({
                "id": d.get("id"),
                "filename": d.get("filename"),
                "version": d.get("version", "1.0"),
                "category": d.get("category"),
            })
    return {"documents": docs}

@router.get("/{doc_id}")
def get_document(
    doc_id: str,
    request: Request,
    x_license: Optional[str] = Header(None),
    x_recipient_id: Optional[str] = Header(None),
    x_recipient_type: Optional[str] = Header(None),
    x_role: Optional[str] = Header(None),
):
    db = SessionLocal()
    try:
        lic_payload = _parse_license_header(x_license)
        rec = _validate_license_online(db, lic_payload)

        roles = _license_roles(lic_payload)
        features = _license_features(lic_payload)
        program_id = _license_program(lic_payload)

        reg = _load_registry()
        doc = next((d for d in reg.get("documents", []) if d.get("id") == doc_id), None)
        if not doc:
            raise HTTPException(404, "Document not found")

        if not _doc_allowed(doc, program_id, roles, features):
            raise HTTPException(403, "Not authorized for this document")

        filename = doc.get("filename")
        if not filename:
            raise HTTPException(500, "Registry missing filename")

        src = (FILES_DIR / filename)
        if not src.exists():
            raise HTTPException(404, "Document file missing on server")

        pdf_bytes = src.read_bytes()

        # Determine recipient identifiers for watermarking
        recipient_type = x_recipient_type or ("investor" if "investor" in roles else ("utility" if ("utility" in roles or "regulator" in roles) else ("oem" if "oem" in roles or "oem_engineer" in roles else "customer")))
        recipient_id = x_recipient_id or _license_org(lic_payload)
        role = x_role or (next(iter(roles)) if roles else "licensed_user")

        out_bytes = pdf_bytes
        if bool(doc.get("watermark", True)):
            out_bytes = watermark_pdf_bytes(
                pdf_bytes,
                recipient_type=recipient_type,
                recipient_id=recipient_id,
                version=str(doc.get("version", "1.0")),
                program_id=program_id,
                role=role,
                license_id=rec.license_id,
                doc_id=doc_id,
            )

        # Audit event
        actor = _license_user(lic_payload)
        log_event(
            db,
            actor=actor,
            action="document.download",
            ref_id=doc_id,
            detail={
                "filename": filename,
                "version": doc.get("version", "1.0"),
                "category": doc.get("category"),
                "program_id": program_id,
                "org_id": _license_org(lic_payload),
                "roles": sorted(list(roles)),
                "recipient_type": recipient_type,
                "recipient_id": recipient_id,
                "watermarked": bool(doc.get("watermark", True)),
                "license_id": rec.license_id,
            },
        )

        import io
        return StreamingResponse(io.BytesIO(out_bytes), media_type="application/pdf", headers={"Content-Disposition": f"inline; filename={filename}"})
    finally:
        db.close()

@router.get("/registry")
def get_registry():
    """Get the full document registry (admin endpoint)."""
    reg = _load_registry()
    return reg

@router.post("/registry")
def update_registry(
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(db_session)
):
    """Update the document registry (admin endpoint)."""
    # Validate structure
    if "documents" not in body:
        raise HTTPException(400, "Missing 'documents' field")
    
    # Write updated registry
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(body, indent=2, ensure_ascii=False), encoding="utf-8")
    
    log_event(db, actor="admin", action="downloads.registry.update", ref_id="registry", detail={"document_count": len(body.get("documents", []))})
    return {"ok": True, "documents": len(body.get("documents", []))}

@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(db_session)
):
    """Remove a document from the registry (admin endpoint)."""
    reg = _load_registry()
    docs = reg.get("documents", [])
    
    original_count = len(docs)
    docs = [d for d in docs if d.get("id") != doc_id]
    
    if len(docs) == original_count:
        raise HTTPException(404, "Document not found in registry")
    
    reg["documents"] = docs
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(reg, indent=2, ensure_ascii=False), encoding="utf-8")
    
    log_event(db, actor="admin", action="downloads.document.delete", ref_id=doc_id)
    return {"ok": True, "doc_id": doc_id}
