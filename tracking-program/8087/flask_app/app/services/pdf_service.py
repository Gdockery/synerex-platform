"""
PDF generation service - dispatches by document kind.
Ported from api/helpers/pdf/generate-pdf.js and api/services/pdf/index.js.
Uses PDF_BRIDGE_PATH when set for full layouts via Node pdf-bridge.
"""
import json
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path

from app.services.pdf.generators import budget_report
from app.services.pdf.generators import meter_certificate
from app.services.pdf.generators import budget_invoice
from app.services.pdf.generators import invoice as invoice_gen
from app.services.pdf.generators import proposal as proposal_gen
from app.services.pdf.generators import test_report as test_report_gen
from app.services.pdf.generators import simple_document as simple_gen
from app.services.pdf import data_mappers


INVOICE_TYPES = frozenset({"depositInvoice", "finalInvoice", "installationInvoice", "totalInvoice"})
SUPPORTED_DOCUMENT_KINDS = frozenset({
    "budgetReport", "meterCertificate", "budgetInvoice",
    "depositInvoice", "finalInvoice", "installationInvoice", "totalInvoice",
    "proposal", "selectedProposal", "testReport", "billAnalytic", "selectedBillAnalytic",
    "costSavings", "lsPotential", "co2Savings", "partsProcurement", "financeAgreement",
    "shippingDocuments", "selectedShippingDocuments",
})


def generate_pdf(project, document_kind, **kwargs):
    """
    Generate PDF for the given document kind and project.
    Returns BytesIO stream. Raises ValueError for unsupported kinds.
    project: Project model instance (SQLAlchemy)
    document_kind: str (e.g. 'budgetReport')
    kwargs: optional meter, test, metersToReport for document-specific data
    """
    if document_kind not in SUPPORTED_DOCUMENT_KINDS:
        raise ValueError(f"Unsupported document type: {document_kind}")

    if document_kind == "budgetReport":
        data = project.lastBudget if hasattr(project, "lastBudget") else None
        if not data:
            data = {}
        return budget_report.generate(data)

    if document_kind == "meterCertificate":
        meter_id = kwargs.get("meter")
        if not meter_id:
            raise ValueError("meterCertificate requires meter id")
        from app.models.meter import Meter
        meter = Meter.query.filter_by(id=meter_id, project=project.id, isDeleted=False).first()
        if not meter:
            raise ValueError("Meter not found")
        serial = getattr(meter, "meterSerialNumber", None) or ""
        logo_path = _get_pdf_logo_path("meter-certificate-logo.png")
        return meter_certificate.generate(serial, logo_path)

    if document_kind == "budgetInvoice":
        data = project.lastBudgetInvoice if hasattr(project, "lastBudgetInvoice") else None
        if not data:
            data = {}
        client_logo_path = _get_client_logo_path(project, data)
        return budget_invoice.generate(data, client_logo_path)

    if document_kind in INVOICE_TYPES:
        client = _get_project_client(project)
        xeco = _get_xeco()
        if not xeco:
            raise ValueError("Xeco config not found")
        invoice_data = data_mappers.map_invoice_data(project, client, xeco, document_kind)
        logo_path = _get_pdf_logo_path("logo.png")
        brand_name = _get_brand_name()
        return invoice_gen.generate(invoice_data, logo_path, brand_name)

    if document_kind in ("proposal", "selectedProposal"):
        client = _get_project_client(project)
        xeco_manager = _get_xeco_manager(project)
        proposal_data = data_mappers.map_proposal_data(project, client, xeco_manager)
        logo_path = _get_pdf_logo_path("logo.png")
        brand_name = _get_brand_name()
        return proposal_gen.generate(proposal_data, logo_path, brand_name)

    if document_kind == "testReport":
        test_id = kwargs.get("test")
        meters_to_report = kwargs.get("metersToReport") or []
        if not test_id:
            raise ValueError("testReport requires test id")
        report_data = _build_test_report_data(project, test_id, meters_to_report)
        logo_path = _get_pdf_logo_path("bill-logo.png")
        brand_name = _get_brand_name()
        return test_report_gen.generate(report_data, logo_path, brand_name)

    if document_kind in ("billAnalytic", "selectedBillAnalytic"):
        data = _build_bill_analytic_data(project, kwargs.get("metersToReport"))
        buf = _try_pdf_bridge(document_kind, data)
        if buf:
            return buf
        return simple_gen.generate_summary("Bill Analytic", data, [
            ("Total Charges", data.get("estimatedSavings", {}).get("totalCharges")),
            ("Total Savings", data.get("estimatedSavings", {}).get("totalSavings")),
            ("Annual Savings", data.get("estimatedSavings", {}).get("annualSavings")),
        ])

    if document_kind == "financeAgreement":
        client = _get_project_client(project)
        xeco = _get_xeco()
        if not xeco:
            raise ValueError("Xeco config not found")
        data = data_mappers.map_finance_agreement_data(project, client, xeco)
        buf = _try_pdf_bridge(document_kind, data)
        if buf:
            return buf
        return simple_gen.generate_summary("Finance Agreement", data, [
            ("Down Payment", data.get("downPayment")),
            ("Monthly Payment", data.get("monthlyPayment")),
            ("Total Financing Cost", data.get("totalFinancingCost")),
            ("Total Project Cost", data.get("totalProjectCost")),
            ("Months to Pay", data.get("monthsToPay")),
        ])

    if document_kind in ("costSavings", "lsPotential", "co2Savings", "partsProcurement", "shippingDocuments", "selectedShippingDocuments"):
        data = _build_minimal_document_data(project)
        buf = _try_pdf_bridge(document_kind, data)
        if buf:
            return buf
        title = document_kind.replace("_", " ").title()
        return simple_gen.generate_summary(title, data, [
            ("Project", data.get("projectName")),
            ("Location", data.get("location")),
            ("Client", data.get("clientName")),
        ])

    raise ValueError(f"Unsupported document type: {document_kind}")


def _get_pdf_logo_path(asset_name):
    """Resolve PDF resource path (whitelabel or default)."""
    from app.config import _8087_ROOT
    base = _8087_ROOT / "api" / "services" / "pdf" / "resources"
    return str(base / asset_name) if (base / asset_name).exists() else None


def _try_pdf_bridge(document_kind, data, paths=None):
    """Invoke Node pdf-bridge.js for full PDF layouts. Returns BytesIO or None on failure."""
    from app.config import _8087_ROOT
    from flask import current_app
    bridge = current_app.config.get("PDF_BRIDGE_PATH", "").strip()
    if not bridge or not Path(bridge).exists():
        return None
    kind_map = {
        "billAnalytic": "billAnalytic", "selectedBillAnalytic": "billAnalytic",
        "costSavings": "costSavings", "lsPotential": "lsPotential", "co2Savings": "co2Savings",
        "partsProcurement": "partsProcurement", "shippingDocuments": "shippingDocuments",
        "selectedShippingDocuments": "shippingDocuments", "financeAgreement": "financeAgreement",
    }
    node_kind = kind_map.get(document_kind)
    if not node_kind:
        return None
    logo_path = _get_pdf_logo_path("logo.png")
    data_ser = json.loads(json.dumps(data, default=str)) if isinstance(data, dict) else data
    payload = {"data": data_ser, "paths": dict(paths or {}, logo=logo_path)}
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as out:
            out_path = out.name
        proc = subprocess.run(
            ["node", bridge, node_kind, f"--output={out_path}"],
            input=json.dumps(payload, default=str),
            capture_output=True,
            text=True,
            cwd=str(_8087_ROOT),
            timeout=120,
        )
        if proc.returncode == 0 and Path(out_path).exists():
            with open(out_path, "rb") as f:
                buf = BytesIO(f.read())
            Path(out_path).unlink(missing_ok=True)
            return buf
        if proc.stderr:
            import logging
            logging.getLogger(__name__).warning("PDF bridge failed: %s", proc.stderr[:500])
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("PDF bridge error: %s", e)
    return None


def _get_project_client(project):
    """Get Client for project."""
    from app.models.client import Client
    cid = project.client if hasattr(project, "client") else None
    return Client.query.get(cid) if cid else None


def _get_xeco():
    """Get first Xeco config."""
    from app.models.xeco import Xeco
    return Xeco.query.first()


def _get_xeco_manager(project):
    """Get xecoManager User for project."""
    from app.models.user import User
    xid = getattr(project, "xecoManager", None)
    return User.query.get(xid) if xid else None


def _build_test_report_data(project, test_id, meters_to_report):
    """Build test report data using test_calculation_service."""
    from app.services.test_calculation_service import calculate_test_results
    from datetime import datetime
    from zoneinfo import ZoneInfo

    meter_ids = ",".join(str(m) for m in meters_to_report) if meters_to_report else None
    result = calculate_test_results(test_id, meter_ids)
    client = _get_project_client(project)
    tz = project.timeZoneId or "America/Chicago"
    try:
        zone = ZoneInfo(tz)
    except Exception:
        zone = ZoneInfo("America/Chicago")

    from app.models.test import Test
    test = Test.query.get(test_id)
    raw_start = (test.startAt if test else None) or result.get("startedAt") or 0
    raw_end = (test.endAt if test else None) or result.get("endAt") or 0
    start_ts = raw_start / 1000
    end_ts = raw_end / 1000 if raw_end else start_ts + ((test.duration or 0) * 3600)
    start_dt = datetime.fromtimestamp(start_ts, tz=zone).strftime("%B %d, %Y %I:%M %p")
    end_dt = datetime.fromtimestamp(end_ts, tz=zone).strftime("%B %d, %Y %I:%M %p")

    eba = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    bill_amount = float(eba.get("billAmount") or 0)
    total_savings = 0
    charges = []
    if result and result.get("percentSaved"):
        ps = result["percentSaved"]
        line_items = eba.get("lineItems") or []
        if not line_items and eba.get("meterBills"):
            mb = eba["meterBills"][0] if eba["meterBills"] else {}
            line_items = mb.get("lineItems") or []
        for item in line_items:
            if isinstance(item, dict):
                cost = float(item.get("cost") or 0)
                t = item.get("type", "")
                if t in ("kwh", "tax"):
                    sav = round(ps.get("kwh", 0) * cost, 2)
                elif t == "kw":
                    sav = round(ps.get("kwPeak", 0) * cost, 2)
                else:
                    sav = 0
                total_savings += sav
                charges.append({
                    "description": item.get("name", ""),
                    "amount": f"${cost:,.2f}",
                    "savingsAmount": f"${sav:,.2f}",
                    "type": t,
                })

    return {
        "clientName": client.name if client else "",
        "location": project.location or "",
        "reportNumber": project.proposalNumber or "",
        "date": datetime.now(zone).strftime("%B %d, %Y"),
        "testStartAt": start_dt,
        "testEndAt": end_dt,
        "billAmount": f"${bill_amount:,.2f}",
        "savings": f"${total_savings:,.2f}",
        "actualSavings": f"${total_savings:,.2f}",
        "customerCharge": f"${float(eba.get('customerCharge') or 0):,.2f}",
        "charges": charges,
    }


def _build_bill_analytic_data(project, meters_to_report=None):
    """Build bill analytic data. Uses selected_bill_analytic when metersToReport filters meters."""
    import copy
    from types import SimpleNamespace
    client = _get_project_client(project)
    eba = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    if meters_to_report and eba.get("meterBills"):
        from app.services.selected_bill_analytic_calculations import calculate as selected_calc
        proj_dict = {"electricBillAnalysis": copy.deepcopy(eba), "reportFields": (project.reportFields or {}) if hasattr(project, "reportFields") else {}}
        selected_calc(proj_dict, meters_to_report)
        eba = proj_dict["electricBillAnalysis"]
        project = SimpleNamespace(
            electricBillAnalysis=eba,
            reportFields=proj_dict["reportFields"],
            **{k: getattr(project, k, None) for k in ("location", "proposalNumber", "currencyCode") if hasattr(project, k)},
        )
    from app.services.bill_analytic_calculations import calculate
    calc_data = calculate(project)
    total_savings = float(eba.get("totalSavings") or 0)
    total_charges = float(calc_data.get("totalCharges") or 0)
    return {
        "clientName": (client.legalName or (client.name if client else "")),
        "location": project.location or "",
        "date": __import__("datetime").datetime.now().strftime("%B %d, %Y"),
        "estimatedSavings": {
            "totalCharges": f"${total_charges:,.2f}",
            "totalSavings": f"${total_savings:,.2f}",
            "annualSavings": f"${total_savings * 12:,.2f}",
        },
    }


def _build_minimal_document_data(project):
    """Build minimal data for simple document types."""
    client = _get_project_client(project)
    return {
        "projectName": project.name or "",
        "clientName": client.legalName or (client.name if client else ""),
        "location": project.location or "",
        "date": __import__("datetime").datetime.now().strftime("%B %d, %Y"),
    }


def _get_brand_name():
    """Get brand name for whitelabel."""
    from flask import request, current_app
    try:
        hostname = (request.host or "").split(":")[0]
        mappings = current_app.config.get("WHITELABEL_DOMAIN_MAPPINGS") or {}
        branding = mappings.get(hostname)
        if branding:
            return branding
        parts = hostname.split(".")
        sub = parts[0].lower() if parts else ""
        if sub in ("", "www", "portal"):
            return "Xeco"
        return sub or "Xeco"
    except Exception:
        return "Xeco"


def _get_client_logo_path(project, invoice_data):
    """Resolve client logo for budget invoice."""
    from pathlib import Path
    from flask import current_app
    storage = current_app.config.get("STORAGE_LOCAL_PATH", "")
    if not storage:
        return None
    client_id = project.client if hasattr(project, "client") else None
    logo_name = (invoice_data.get("clientLogoName") or "") if isinstance(invoice_data, dict) else ""
    if not logo_name and client_id:
        logo_name = f"{client_id}-client-logo"
    if logo_name:
        path = Path(storage) / "images" / "client_company_logo" / logo_name
        if path.exists():
            return str(path)
    return None
