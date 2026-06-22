"""
SLD (Single-Line Drawing) routes.

POST /api/sld/analyze                  — submit file to GPU, return GPU job ID immediately
GET  /api/sld/analyze/<gpu_id>         — pure GPU proxy
POST /api/project/<id>/sld/accept      — save placements + sldAnalysis to project
POST /api/project/<id>/sld/dismiss     — front-end only acknowledgment
POST /api/project/<id>/sld/seed-twin   — accept SLD result AND seed the Digital Twin in one call
GET  /api/sld/<gpu_id>/topology        — return GPU result formatted as topoMeters JSON
"""
import logging
import os

import requests as _requests
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.helpers.decorators import license_required
from app.db.request_session import get_session
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)

sld_bp = Blueprint("sld", __name__, url_prefix="")

SLD_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")

_CONTENT_TYPES = {
    "pdf": "application/pdf",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}


@sld_bp.route("/api/sld/analyze", methods=["POST"])
@login_required
@license_required
def analyze_sld():
    """
    POST /api/sld/analyze
    Submits SLD file to GPU server, returns GPU job ID immediately.
    Angular saves { gpu_job_id, filename, estimated_minutes } to localStorage
    and polls GET /api/sld/analyze/<gpu_id> via My Jobs.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file or not file.filename:
        return jsonify({"success": False, "error": "No file selected"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in _CONTENT_TYPES:
        return jsonify({"success": False, "error": "File must be PDF, JPG, PNG, or WebP"}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 50 * 1024 * 1024:
        return jsonify({"success": False, "error": "File too large (max 50MB)"}), 400

    try:
        file_bytes = file.read()
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to read file: {e}"}), 500

    bill_peak_kw = None
    try:
        val = request.form.get("bill_peak_kw", "").strip()
        if val:
            bill_peak_kw = float(val)
    except (ValueError, TypeError):
        pass

    filename = file.filename or "sld.pdf"
    ct = _CONTENT_TYPES.get(ext, "application/octet-stream")

    extra_data = {}
    if bill_peak_kw is not None:
        extra_data["bill_peak_kw"] = str(bill_peak_kw)

    # If PDF, pre-convert to PNG locally to work around GPU server's pdf→image bug.
    # Falls back to sending PDF directly if conversion is unavailable.
    if ext == "pdf":
        try:
            import subprocess, tempfile, os as _os
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
                tmp_pdf.write(file_bytes)
                tmp_pdf_path = tmp_pdf.name
            tmp_png_prefix = tmp_pdf_path.replace(".pdf", "_page")
            result = subprocess.run(
                ["pdftoppm", "-r", "200", "-png", "-singlefile", tmp_pdf_path, tmp_png_prefix],
                capture_output=True, timeout=60
            )
            _os.unlink(tmp_pdf_path)
            png_path = tmp_png_prefix + ".png"
            if result.returncode == 0 and _os.path.exists(png_path):
                with open(png_path, "rb") as png_fh:
                    file_bytes = png_fh.read()
                _os.unlink(png_path)
                filename = filename.replace(".pdf", ".png").replace(".PDF", ".png")
                ct = "image/png"
                logger.info("PDF pre-converted to PNG before GPU submission: %s", filename)
        except Exception as conv_err:
            logger.warning("PDF→PNG conversion failed (%s) — sending PDF directly", conv_err)

    try:
        resp = _requests.post(
            f"{SLD_PLATFORM_URL}/slds",
            files={"file": (filename, file_bytes, ct)},
            data=extra_data,
            timeout=60,
        )
        resp.raise_for_status()
    except _requests.ConnectionError:
        return jsonify({"success": False, "error": "Cannot connect to the SLD processing service. Please try again later."}), 503
    except _requests.HTTPError as e:
        return jsonify({"success": False, "error": f"GPU server error: {e.response.status_code}"}), 502
    except Exception as e:
        logger.exception("Failed to submit SLD to GPU")
        return jsonify({"success": False, "error": f"Failed to submit SLD: {e}"}), 500

    gpu_data = resp.json()
    gpu_id = gpu_data.get("id")
    estimated_minutes = gpu_data.get("estimated_minutes", 30)

    logger.info("SLD submitted to GPU: gpu_id=%s file=%s peak_kw=%s", gpu_id, filename, bill_peak_kw)
    return jsonify({
        "success": True,
        "job_id": gpu_id,
        "job_type": "sld",
        "filename": filename,
        "estimated_minutes": estimated_minutes,
        "status": "pending",
    }), 202


@sld_bp.route("/api/sld/analyze/<gpu_id>", methods=["GET"])
@login_required
def analyze_sld_status(gpu_id: str):
    """
    GET /api/sld/analyze/<gpu_id>
    Pure GPU proxy — maps GPU response to Angular-expected format.
    GPU is the source of truth; no in-memory state needed.
    """
    try:
        poll = _requests.get(f"{SLD_PLATFORM_URL}/slds/{gpu_id}", timeout=15)
    except _requests.ConnectionError:
        return jsonify({"status": "error", "error": "Cannot reach GPU server"}), 503
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    if poll.status_code == 404:
        return jsonify({"status": "pending", "success": True}), 200

    try:
        poll.raise_for_status()
    except _requests.HTTPError:
        return jsonify({"status": "error", "error": f"GPU error: {poll.status_code}"}), 200

    data = poll.json()
    status = data.get("status", "")

    if status == "pending_review":
        return jsonify({
            "status": "done",
            "success": True,
            "result": data.get("result") or {},
        }), 200

    elif status == "failed":
        error_notes = data.get("error_notes") or ""
        return jsonify({
            "status": "error",
            "success": False,
            "error": "SLD parsing failed on the AI server. Please try again.",
            "error_notes": error_notes,
        }), 200

    else:
        # processing or unknown
        return jsonify({"status": "pending", "success": True}), 200



@sld_bp.route("/api/sld/<gpu_id>/diagram", methods=["GET"])
@login_required
def sld_diagram(gpu_id: str):
    """
    GET /api/sld/<gpu_id>/diagram?fmt=png|pdf
    Proxies to GPU GET /slds/{id}/diagram?fmt=... and streams the binary back.
    Only available when the SLD status is pending_review (done).
    """
    fmt = request.args.get("fmt", "png").lower()
    if fmt not in ("png", "pdf"):
        return jsonify({"error": "fmt must be png or pdf"}), 400
    try:
        resp = _requests.get(
            f"{SLD_PLATFORM_URL}/slds/{gpu_id}/diagram",
            params={"fmt": fmt},
            timeout=15,
            stream=True,
        )
        resp.raise_for_status()
    except _requests.ConnectionError:
        return jsonify({"error": "Cannot reach GPU server"}), 503
    except _requests.HTTPError as e:
        return jsonify({"error": f"GPU error: {e.response.status_code}"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    content_type = "image/png" if fmt == "png" else "application/pdf"
    from flask import Response
    return Response(resp.content, status=200, content_type=content_type)

@sld_bp.route("/api/project/<int:project_id>/sld/accept", methods=["POST"])
@login_required
@license_required
def accept_sld(project_id: int):
    """POST /api/project/<id>/sld/accept — save placements + sldAnalysis to project."""
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    placements = data.get("placements")
    sld_analysis = data.get("sldAnalysis")

    if placements is None and sld_analysis is None:
        return jsonify({"error": "placements or sldAnalysis required"}), 400

    sess = get_session()
    p = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Project not found"}), 404

    user = sess.query(User).get(current_user.id)
    from app.api.web_routes import _user_can_access_project
    if not _user_can_access_project(sess, user, p):
        return jsonify({"error": "Forbidden"}), 403

    if placements is not None:
        p.placements = placements
    if sld_analysis is not None:
        p.sldAnalysis = sld_analysis
    sess.add(p)
    sess.commit()

    return jsonify({"success": True})


@sld_bp.route("/api/project/<int:project_id>/sld/dismiss", methods=["POST"])
@login_required
@license_required
def dismiss_sld(project_id: int):
    """POST /api/project/<id>/sld/dismiss — front-end only acknowledgment."""
    return jsonify({"success": True})


def _gpu_result_to_topo_meters(result: dict) -> list:
    """
    Convert raw Qwen 2.5 VL GPU result → topoMeters list for digital-twin seeding.
    Handles both direct topoMeters format and the nested bus/panel structure.
    """
    if isinstance(result, list):
        return result  # Already topoMeters format

    meter_id = (
        result.get("meter_id") or
        result.get("utility_account") or
        result.get("meter_no") or
        "MAIN"
    )
    buses_raw = result.get("buses") or []

    buses = []
    for b in buses_raw:
        circuits = []
        for p in (b.get("panels") or b.get("circuits") or []):
            circuits.append({
                "name":    p.get("name") or p.get("label") or "Panel",
                "amps":    p.get("amps") or p.get("amp_rating"),
                "nEcbs":   p.get("n_ecbs", 0),
                "nApf50":  p.get("n_apf50", 0),
                "nApf100": p.get("n_apf100", 0),
                "note":    p.get("description") or p.get("note", ""),
            })
        buses.append({
            "badge":    b.get("label") or b.get("badge") or "MAIN-SWG",
            "dwg":      b.get("drawing_ref") or b.get("dwg") or "SLD-01",
            "xfKva":    b.get("transformer_kva") or b.get("kva_rating"),
            "mainA":    b.get("main_amps") or b.get("amp_rating"),
            "pctLoad":  b.get("load_pct") or b.get("pct_load"),
            "circuits": circuits,
        })

    return [{"meterNo": meter_id, "buses": buses}]


@sld_bp.route("/api/sld/<int:gpu_id>/topology", methods=["GET"])
@login_required
def sld_topology(gpu_id: int):
    """
    GET /api/sld/<gpu_id>/topology
    Returns the GPU result formatted as a topoMeters array, ready for digital twin seeding.
    Returns {status: "pending"} if analysis is still running.
    """
    try:
        poll = _requests.get(f"{SLD_PLATFORM_URL}/slds/{gpu_id}", timeout=15)
    except _requests.ConnectionError:
        return jsonify({"status": "error", "error": "Cannot reach GPU server"}), 503
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    if poll.status_code == 404:
        return jsonify({"status": "pending"}), 200

    try:
        poll.raise_for_status()
    except _requests.HTTPError:
        return jsonify({"status": "error", "error": f"GPU error {poll.status_code}"}), 200

    data   = poll.json()
    status = data.get("status", "")

    if status == "pending_review":
        result      = data.get("result") or {}
        topo_meters = _gpu_result_to_topo_meters(result)
        return jsonify({
            "status":      "done",
            "gpu_id":      gpu_id,
            "topo_meters": topo_meters,
            "raw_result":  result,
        }), 200

    elif status == "failed":
        return jsonify({
            "status": "error",
            "error":  data.get("error_notes") or "SLD analysis failed",
        }), 200

    return jsonify({"status": "pending"}), 200


@sld_bp.route("/api/project/<int:project_id>/sld/seed-twin", methods=["POST"])
@login_required
@license_required
def seed_twin_from_sld(project_id: int):
    """
    POST /api/project/<id>/sld/seed-twin
    Body: { "gpu_id": <int>, "sld_analysis": <optional override> }

    1. Fetches the GPU result for the given gpu_id.
    2. Saves sldAnalysis + placements to the project.
    3. Calls /api/digital-twin/from-project/<id> to materialise assets.
    Returns { twin_id, created, status }.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Unauthorized"}), 403

    body   = request.get_json() or {}
    gpu_id = body.get("gpu_id")
    if not gpu_id:
        return jsonify({"error": "gpu_id required"}), 400

    sess = get_session()
    p    = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Project not found"}), 404

    # ── Fetch GPU result
    try:
        poll = _requests.get(f"{SLD_PLATFORM_URL}/slds/{gpu_id}", timeout=20)
        poll.raise_for_status()
    except Exception as e:
        return jsonify({"error": f"Cannot reach GPU: {e}"}), 503

    data   = poll.json()
    status = data.get("status", "")
    if status != "pending_review":
        return jsonify({"error": f"GPU job not ready (status={status}). Poll again later."}), 409

    result      = data.get("result") or body.get("sld_analysis") or {}
    topo_meters = _gpu_result_to_topo_meters(result)

    # ── Save to project
    p.sldAnalysis = result
    p.placements  = topo_meters
    # Also store topoMeters in proposalData so digital-twin/from-project can seed it
    proposal = dict(p.proposalData or {})
    proposal["topoMeters"] = topo_meters
    p.proposalData = proposal
    sess.add(p)
    sess.commit()

    # ── Seed digital twin (inline, same session)
    from app.models.digital_twin import DigitalTwin
    from app.models.site import Site
    from app.api.digital_twin_routes import (
        _create_assets_from_topo, _twin_dict, _now
    )

    existing = sess.query(DigitalTwin).filter_by(project_id=project_id, is_deleted=False).first()
    if existing:
        return jsonify({
            "twin_id": existing.id,
            "created": False,
            "status":  existing.status,
            "topo_meters": topo_meters,
        }), 200

    now  = _now()
    site = sess.query(Site).filter_by(project_id=project_id, is_deleted=False).first()
    if not site:
        pd   = p.proposalData or {}
        site = Site(
            org_id    = p.org_id,
            client_id = p.client,
            project_id= p.id,
            name      = pd.get("facility_name") or p.name,
            address   = pd.get("facility_address") or p.location,
            status    = "active",
            createdAt = now,
            updatedAt = now,
        )
        sess.add(site)
        sess.flush()

    from app.models.digital_twin import DigitalTwin as DT
    twin = DT(
        site_id        = site.id,
        org_id         = p.org_id,
        project_id     = project_id,
        status         = "draft",
        version_number = 1,
        source         = "sld_gpu",
        label          = f"Auto-seeded from SLD (GPU job {gpu_id})",
        createdAt      = now,
        updatedAt      = now,
    )
    sess.add(twin)
    sess.flush()

    _create_assets_from_topo(sess, site.id, twin.id, p.org_id, topo_meters, now)
    sess.commit()

    return jsonify({
        "twin_id":     twin.id,
        "created":     True,
        "status":      twin.status,
        "topo_meters": topo_meters,
    }), 201


# ─── Ollama / Qwen 2.5 VL direct analysis ─────────────────────────────────────

OLLAMA_URL   = os.environ.get("OLLAMA_LOCAL_URL",  "http://100.106.19.30:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_SLD_MODEL",  "qwen2.5vl:32b")

_SLD_QWEN_PROMPT = """You are an expert electrical engineer analyzing a single-line diagram for a commercial facility.
Read every label, breaker rating, transformer kVA, and bus ampacity shown on the drawing.
Return ONLY valid JSON — no markdown — matching this schema exactly:
{
  "facility_name": "",
  "facility_type": "",
  "drawing_number": "",
  "service_voltage": "",
  "distribution_voltage": "",
  "phases": 3,
  "utility_service": {"label": "", "amps": null, "voltage": null},
  "main_switchgear": [
    {
      "label": "",
      "bus_amps": null,
      "kva_rating": null,
      "drawing_ref": "",
      "circuits": [{"name": "", "amps": null, "poles": 3, "load_type": ""}]
    }
  ],
  "transformers": [{"label": "", "kva": null, "primary_v": null, "secondary_v": null, "location": ""}],
  "generators": [{"label": "", "kw": null, "voltage": null}],
  "ats_units": [{"label": "", "amps": null}],
  "ecbs_locations": [{"bus": "", "ct_amps": null, "note": ""}],
  "meter_id": "",
  "notes": ""
}"""


def _pdf_to_png_bytes(pdf_bytes: bytes) -> bytes:
    """Convert first page of PDF to PNG bytes using pdftoppm."""
    import subprocess, tempfile
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name
    out_prefix = tmp_path.replace(".pdf", "_p")
    try:
        subprocess.run(
            ["pdftoppm", "-r", "200", "-png", "-singlefile", tmp_path, out_prefix],
            check=True, capture_output=True, timeout=60
        )
        import os as _os
        for suffix in (".png", "-1.png"):
            p = out_prefix + suffix
            if _os.path.exists(p):
                with open(p, "rb") as f:
                    data = f.read()
                _os.unlink(p)
                return data
    finally:
        import os as _os
        try:
            _os.unlink(tmp_path)
        except Exception:
            pass
    raise RuntimeError("pdftoppm produced no output")


def _analyze_with_ollama(img_bytes: bytes, content_type: str) -> dict:
    """
    Send image bytes to Qwen 2.5 VL 32B via Ollama and return parsed topology dict.
    content_type: 'image/png', 'image/jpeg', 'application/pdf' (auto-converted)
    """
    import base64, json as _json, threading

    if content_type == "application/pdf":
        img_bytes    = _pdf_to_png_bytes(img_bytes)
        content_type = "image/png"

    img_b64 = base64.b64encode(img_bytes).decode()
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "user", "content": _SLD_QWEN_PROMPT, "images": [img_b64]}
        ],
        "stream": False,
        "options": {"temperature": 0.1},
    }

    resp = _requests.post(
        f"{OLLAMA_URL}/api/chat",
        json=payload,
        timeout=600,
    )
    resp.raise_for_status()
    content = resp.json().get("message", {}).get("content", "").strip()

    # Strip markdown fences
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        return _json.loads(content)
    except Exception:
        return {"raw_response": content}


@sld_bp.route("/api/sld/analyze-ollama", methods=["POST"])
@login_required
@license_required
def analyze_sld_ollama():
    """
    POST /api/sld/analyze-ollama
    Synchronous SLD analysis via Ollama/Qwen 2.5 VL 32B.
    Returns topology JSON directly (no polling needed).
    This is the preferred route — bypasses the GPU FastAPI parse_sld bug.

    Slower than async (2–5 min), but reliable.
    Accepts same multipart/form-data as /api/sld/analyze.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    ext  = (file.filename or "").rsplit(".", 1)[-1].lower()
    ct_map = {
        "pdf": "application/pdf", "png": "image/png",
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
    }
    if ext not in ct_map:
        return jsonify({"success": False, "error": "File must be PDF, PNG, JPG, or WebP"}), 400

    file_bytes = file.read()
    ct         = ct_map[ext]

    try:
        topo = _analyze_with_ollama(file_bytes, ct)
    except _requests.ConnectionError:
        return jsonify({"success": False, "error": "Cannot connect to Ollama GPU server"}), 503
    except Exception as e:
        logger.exception("Ollama SLD analysis failed")
        return jsonify({"success": False, "error": str(e)}), 500

    # Convert to topoMeters
    topo_meters = _gpu_result_to_topo_meters(topo)

    return jsonify({
        "success":     True,
        "topology":    topo,
        "topo_meters": topo_meters,
        "model":       OLLAMA_MODEL,
    }), 200


@sld_bp.route("/api/project/<int:project_id>/sld/analyze-and-seed", methods=["POST"])
@login_required
@license_required
def analyze_and_seed(project_id: int):
    """
    POST /api/project/<id>/sld/analyze-and-seed  (multipart/form-data with 'file')
    One-shot: analyze SLD with Qwen → save to project → seed digital twin.
    Returns { twin_id, created, status, topology, topo_meters }.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Unauthorized"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    ext  = (file.filename or "").rsplit(".", 1)[-1].lower()
    ct_map = {
        "pdf": "application/pdf", "png": "image/png",
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
    }
    if ext not in ct_map:
        return jsonify({"error": "File must be PDF, PNG, or JPG"}), 400

    file_bytes = file.read()
    ct         = ct_map[ext]

    # ── Analyze with Qwen
    try:
        topo = _analyze_with_ollama(file_bytes, ct)
    except Exception as e:
        return jsonify({"error": f"Qwen analysis failed: {e}"}), 500

    topo_meters = _gpu_result_to_topo_meters(topo)

    # ── Save to project
    sess = get_session()
    p    = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Project not found"}), 404

    p.sldAnalysis  = topo
    p.placements   = topo_meters
    proposal       = dict(p.proposalData or {})
    proposal["topoMeters"] = topo_meters
    p.proposalData = proposal
    sess.add(p)
    sess.commit()

    # ── Seed Digital Twin
    from app.models.digital_twin import DigitalTwin
    from app.models.site import Site
    from app.api.digital_twin_routes import _create_assets_from_topo, _now

    existing = sess.query(DigitalTwin).filter_by(project_id=project_id, is_deleted=False).first()
    if existing:
        return jsonify({
            "twin_id":     existing.id,
            "created":     False,
            "status":      existing.status,
            "topology":    topo,
            "topo_meters": topo_meters,
        }), 200

    now  = _now()
    site = sess.query(Site).filter_by(project_id=project_id, is_deleted=False).first()
    if not site:
        pd   = p.proposalData or {}
        site = Site(
            org_id     = p.org_id,
            client_id  = p.client,
            project_id = p.id,
            name       = pd.get("facility_name") or p.name,
            address    = pd.get("facility_address") or p.location,
            status     = "active",
            createdAt  = now,
            updatedAt  = now,
        )
        sess.add(site)
        sess.flush()

    from app.models.digital_twin import DigitalTwin as DT
    twin = DT(
        site_id        = site.id,
        org_id         = p.org_id,
        project_id     = project_id,
        status         = "draft",
        version_number = 1,
        source         = "ollama_qwen",
        label          = f"Auto-seeded from SLD via Qwen 2.5 VL 32B",
        createdAt      = now,
        updatedAt      = now,
    )
    sess.add(twin)
    sess.flush()

    _create_assets_from_topo(sess, site.id, twin.id, p.org_id, topo_meters, now)
    sess.commit()

    return jsonify({
        "twin_id":     twin.id,
        "created":     True,
        "status":      twin.status,
        "topology":    topo,
        "topo_meters": topo_meters,
        "model":       OLLAMA_MODEL,
    }), 201
