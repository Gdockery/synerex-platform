"""
PDF data mappers - ported from api/helpers/pdf/*-data-mapper.js
Map DB/models to structures expected by PDF generators.
"""
import re
from datetime import datetime

from app.services.bill_analytic_calculations import calculate as bill_analytic_calculate


def _is_conforming_number(val):
    if not val:
        return False
    v = str(val).strip()
    return bool(re.match(r"^\d{4}-\d{4,}$", v) or re.match(r"^\d{8,}$", v))


def _lazy_assign_number(project):
    """
    If project.proposalNumber is blank or non-conforming, generate and persist one.
    Returns the (bare) number string without any B-/P- prefix.
    """
    raw = getattr(project, "proposalNumber", None) or ""
    if _is_conforming_number(raw):
        return str(raw).strip()

    try:
        from app.db.request_session import get_session
        from app.models.client import Client
        from app.api.web_routes import _generate_project_number
        sess = get_session()
        client = sess.query(Client).filter_by(id=project.client, isDeleted=False).first()
        sponsor = getattr(client, "sponsor_org_id", None) if client else None
        new_num = _generate_project_number(sess, sponsor)
        project.proposalNumber = new_num
        sess.add(project)
        sess.commit()
        return new_num
    except Exception:
        return raw or ""


def _get_project_proposal_date(project):
    """Proposal date from project."""
    pd = getattr(project, "proposalDate", None) or getattr(project, "startDate", None)
    if pd:
        try:
            dt = datetime.fromisoformat(str(pd).replace("Z", "+00:00"))
            return dt.strftime("%B %d, %Y")
        except (ValueError, TypeError):
            pass
    return datetime.now().strftime("%B %d, %Y")


def _fmt_currency(val, currency="USD"):
    try:
        return f"${float(val):,.0f}" if val is not None else "$0"
    except (ValueError, TypeError):
        return "$0"


def _fmt_number(val):
    try:
        return f"{float(val):,.0f}" if val is not None else "0"
    except (ValueError, TypeError):
        return "0"


def map_invoice_data(project, client, xeco, invoice_type):
    """Map project+client+xeco to invoice PDF data. invoice_type: depositInvoice|finalInvoice|installationInvoice|totalInvoice."""
    rf = (project.reportFields or {}) if hasattr(project, "reportFields") else {}
    equip = (project.equipmentInfo or {}) if hasattr(project, "equipmentInfo") else {}
    eba = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    inv_num = (project.invoiceNumber or {}) if hasattr(project, "invoiceNumber") else {}

    type_map = {
        "depositInvoice": ("Deposit", rf.get("depositInvoicePercent", 0) / 100, rf.get("depositInvoiceDate"), inv_num.get("deposit")),
        "installationInvoice": ("Installation", rf.get("installationInvoicePercent", 0) / 100, rf.get("installationInvoiceDate"), inv_num.get("installation")),
        "finalInvoice": ("Final", rf.get("finalInvoicePercent", 0) / 100, rf.get("finalInvoiceDate"), inv_num.get("final")),
        "totalInvoice": ("Total", 1.0, rf.get("depositInvoiceDate"), inv_num.get("total")),
    }
    label, cost_mult, inv_date, inv_num_val = type_map.get(invoice_type, ("Invoice", 1.0, None, ""))

    try:
        dt = datetime.fromisoformat(str(inv_date).replace("Z", "+00:00")) if inv_date else datetime.now()
        invoice_date = dt.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        invoice_date = datetime.now().strftime("%B %d, %Y")

    calc = bill_analytic_calculate(project)
    discount = float(project.discount or 0) / 100
    sales_tax = float(project.salesTax or 0) / 100

    items = []
    for item in (equip.get("items") or []):
        qty = int(item.get("count") or 0)
        if qty <= 0:
            continue
        price = float(item.get("price") or 0)
        cost = price * qty * (1 - discount)
        items.append({
            "type": "XECO Model",
            "name": item.get("name", ""),
            "quantity": qty,
            "price": _fmt_currency(price),
            "status": "ok",
            "cost": _fmt_currency(cost),
            "tax": _fmt_currency(cost * sales_tax),
        })

    parts = []
    for part in (equip.get("parts") or []):
        qty = float(part.get("count") or 0)
        price = float(part.get("price") or 0)
        cost = price * qty
        parts.append({
            "type": "test",
            "name": part.get("name", ""),
            "quantity": qty,
            "price": _fmt_currency(price),
            "status": "",
            "tax": _fmt_currency(cost * sales_tax),
            "cost": _fmt_currency(cost),
        })

    services = []
    for svc in (equip.get("services") or []):
        price = float(svc.get("price") or 0)
        services.append({
            "type": "test",
            "name": svc.get("name", ""),
            "quantity": "",
            "status": "",
            "price": _fmt_currency(price),
            "tax": _fmt_currency(price * sales_tax),
            "cost": _fmt_currency(price),
        })

    total_obj = equip.get("total") or {}
    subtotal = float(total_obj.get("subtotal") or 0)
    tax_val = float(total_obj.get("tax") or 0)
    total_val = float(total_obj.get("total") or 0)
    discount_val = float(total_obj.get("discount") or 0)
    item_total = float(total_obj.get("itemTotal") or 0)

    metering_svc = next(
        (s for s in (equip.get("services") or [])
         if "METERING" in (s.get("name") or "").upper() and "SERVER" in (s.get("name") or "").upper()),
        {},
    )
    metering_price = float(metering_svc.get("price") or 0)

    xeco_addr = (xeco.address or "").split("\n")
    ship_parts = [
        rf.get("shipToAddress", ""),
        f"{rf.get('shipToZip', '')} {rf.get('shipToCity', '')}, {rf.get('shipToState', '')}, {rf.get('shipToCountry', '')}",
    ]
    bill_parts = [
        rf.get("billToAddress", ""),
        f"{rf.get('billToZip', '')} {rf.get('billToCity', '')}, {rf.get('billToState', '')}, {rf.get('billToCountry', '')}",
    ]
    ship_to = ",\n".join(p for p in ship_parts if p)
    bill_to = ",\n".join(p for p in bill_parts if p)

    roi = total_val / float(eba.get("totalSavings") or 1) if eba.get("totalSavings") else 0
    bl_pct = (
        (float(eba.get("totalSavings") or 0) / calc["totalCharges"] * 100)
        if calc["totalCharges"]
        else 0
    )
    xeco_equip = sum(
        int(i.get("count") or 0) * float(i.get("price") or 0)
        for i in (equip.get("items") or [])
    )
    part_cost = sum(
        float(p.get("count") or 0) * float(p.get("price") or 0)
        for p in (equip.get("parts") or [])
    )

    return {
        "invoiceType": label,
        "invoiceNumber": str(inv_num_val or ""),
        "invoiceDate": invoice_date,
        "xecoAddress": "\n".join(xeco_addr) if xeco_addr else (xeco.address or ""),
        "xecoCity": f"{xeco.city or ''}, {xeco.state or ''} {xeco.zip or ''}",
        "contact": rf.get("invoiceContactName", ""),
        "phone": rf.get("invoiceContactPhone", ""),
        "clientName": client.legalName or client.name if client else "",
        "currencyCode": project.currencyCode or "USD",
        "shipToAddress": ship_to,
        "billToAddress": bill_to,
        "clientAttn": client.name if client else "",
        "clientPhone": client.contactPhone if client else "",
        "clientRfcCode": rf.get("rfcCode", ""),
        "clientCompanyPo": project.purchaseOrder or "",
        "estimatedCo2SavingsPerMonth": _fmt_number(calc["co2Reduction"] / 12),
        "estimatedCo2SavingsPerYear": _fmt_number(calc["co2Reduction"]),
        "estimatedCarbonCreditValue": _fmt_currency(calc["co2Reduction"] * float(project.carbonCreditRate or 0)),
        "items": items,
        "parts": parts,
        "services": services,
        "totalAmount": _fmt_currency(subtotal),
        "discount": _fmt_currency(discount_val),
        "salesTax": _fmt_currency(tax_val),
        "totalCost": _fmt_currency(total_val),
        "subtotalDue": _fmt_currency(cost_mult * subtotal - cost_mult * discount_val),
        "taxDue": _fmt_currency(cost_mult * tax_val),
        "amountDue": _fmt_currency(cost_mult * total_val),
        "shippingTerms": client.shippingTerms if client else "",
        "paymentTerms": f"{rf.get('downPaymentPercent', 0)}% down",
        "costMultiplier": cost_mult * 100,
        "estimatedSavings": {
            "totalCharges": _fmt_currency(calc["totalCharges"]),
            "monthEndCharge": _fmt_currency(eba.get("billAmount")),
            "customerCharge": _fmt_currency(eba.get("customerCharge")),
            "totalSavings": _fmt_currency(eba.get("totalSavings")),
            "bill": _fmt_currency(calc["totalCharges"] - float(eba.get("totalSavings") or 0)),
            "annualSavings": _fmt_currency(float(eba.get("totalSavings") or 0) * 12),
            "xecoEquipmentCost": _fmt_currency(xeco_equip),
            "partCost": _fmt_currency(part_cost),
            "meteringFee": _fmt_currency(metering_price),
            "discount": f"-{item_total * (float(project.discount or 0) / 100)}",
            "subtotal": _fmt_currency(subtotal),
            "co2Reduction": _fmt_number(calc["co2Reduction"]),
            "estimatedRoi": round(roi),
            "baselineSavingsPercent": f"{bl_pct:.2f}",
            "xecoUnits": sum(int(i.get("count") or 0) for i in (equip.get("items") or [])),
            "estimatedCo2Reduction": _fmt_number(calc["co2Reduction"]),
            "salesTax": _fmt_currency(tax_val),
            "totalCost": _fmt_currency(total_val),
        },
        "invoiceSubtotal": _fmt_currency(cost_mult * subtotal),
        "invoiceTax": _fmt_currency(cost_mult * tax_val),
        "invoiceTotal": _fmt_currency(cost_mult * total_val),
    }


def map_proposal_data(project, client, xeco_manager):
    """Map project to proposal PDF data (full - matches client-proposal.js shape)."""
    rf = (project.reportFields or {}) if hasattr(project, "reportFields") else {}
    equip = (project.equipmentInfo or {}) if hasattr(project, "equipmentInfo") else {}
    eba = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    calc = bill_analytic_calculate(project)

    total_obj = equip.get("total") or {}
    total_val = float(total_obj.get("total") or 0)
    total_savings = float(eba.get("totalSavings") or 0)
    dep_pct = float(rf.get("depositInvoicePercent") or 30) / 100
    inst_pct = float(rf.get("installationInvoicePercent") or 30) / 100
    fin_pct = float(rf.get("finalInvoicePercent") or 40) / 100

    name_to_show = rf.get("invoiceContactName") or (client.name if client else "")
    if not name_to_show and client:
        name_to_show = client.name

    # Equipment item costs
    equip_items = equip.get("items") or []
    parts_list = equip.get("parts") or []
    services_list = equip.get("services") or []

    equipment_cost = sum(float(i.get("price") or 0) * int(i.get("count") or 0) for i in equip_items)
    part_cost = sum(float(p.get("price") or 0) * float(p.get("count") or 0) for p in parts_list)
    service_cost = sum(float(s.get("price") or 0) for s in services_list)
    discount_val = float(total_obj.get("discount") or project.discount or 0)
    sales_tax_rate = float(total_obj.get("taxRate") or project.salesTax or 0)
    metering_fee = float(rf.get("meteringFee") or 0)
    mgmt_cost = float(rf.get("projectManagementCost") or 0)

    # Recommended units = count of XPS600 items
    xeco_units = next((int(i.get("count") or 0) for i in equip_items if "XPS" in (i.get("name") or "")), 0)

    # Baseline savings % from bill analytic
    baseline_pct = float(eba.get("baselineSavingsPercent") or calc.get("baselineSavingsPercent") or 0)
    estimated_pct = float(eba.get("estimatedSavingsPercent") or calc.get("estimatedSavingsPercent") or 0)
    baseline_roi = round((total_val * 12) / total_savings) if total_savings else 0

    # Xeco company info
    xeco_name = f"{xeco_manager.firstName or ''} {xeco_manager.lastName or ''}".strip() if xeco_manager else ""

    items = []
    for item in equip_items:
        items.append({
            "name": item.get("name", ""),
            "quantity": item.get("count", 0),
            "price": _fmt_currency(item.get("price")),
            "cost": _fmt_currency(float(item.get("price") or 0) * int(item.get("count") or 0)),
        })
    parts = []
    for part in parts_list:
        parts.append({
            "name": part.get("name", ""),
            "quantity": part.get("count", 0),
            "price": _fmt_currency(part.get("price")),
            "cost": _fmt_currency(float(part.get("price") or 0) * float(part.get("count") or 0)),
        })

    try:
        bill_dt = datetime.fromisoformat(str(eba.get("billDate", "")).replace("Z", "+00:00"))
        bill_date = bill_dt.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        bill_date = datetime.now().strftime("%B %d, %Y")
    try:
        ana_dt = datetime.fromisoformat(str(eba.get("date", "")).replace("Z", "+00:00"))
        analytics_date = ana_dt.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        analytics_date = datetime.now().strftime("%B %d, %Y")

    base_number = _lazy_assign_number(project)
    proposal_number = f"P-{base_number}" if base_number else ""

    return {
        "proposalNumber": proposal_number,
        "projectCurrency": project.currencyCode or "USD",
        "clientName": name_to_show,
        "clientManagerName": rf.get("clientManagerName") or name_to_show,
        "clientAddress": f"{client.address or ''}\n{client.city or ''}, {client.state or ''} {client.zip or ''}" if client else "",
        "location": project.location or "",
        "preparedBy": xeco_name,
        "xecoName": xeco_name,
        "xecoAddress": rf.get("xecoAddress") or "",
        "xecoAddress2": rf.get("xecoAddress2") or "",
        "proposalDate": _get_project_proposal_date(project),
        "billDate": bill_date,
        "analyticsDate": analytics_date,
        "meterNumber": eba.get("meterNumber", ""),
        "electricCompanyName": eba.get("electricCompanyName", ""),
        "depositAmount": _fmt_currency(dep_pct * total_val),
        "installationAmount": _fmt_currency(inst_pct * total_val),
        "finalAmount": _fmt_currency(fin_pct * total_val),
        "estimatedSavings": {
            "totalCharges": _fmt_currency(calc["totalCharges"]),
            "monthEndCharge": _fmt_currency(eba.get("billAmount")),
            "customerCharge": _fmt_currency(eba.get("customerCharge")),
            "totalSavings": _fmt_currency(total_savings),
            "bill": _fmt_currency(float(eba.get("billAmount") or 0) - total_savings),
            "annualSavings": _fmt_currency(total_savings * 12),
            "xecoEquipmentCost": _fmt_currency(equipment_cost),
            "partCost": _fmt_currency(part_cost),
            "projectManagementCost": _fmt_currency(mgmt_cost),
            "meteringFee": _fmt_currency(metering_fee),
            "discount": _fmt_currency(discount_val),
            "totalCost": _fmt_currency(total_val),
            "co2Reduction": _fmt_number(calc["co2Reduction"]),
            "salesTax": sales_tax_rate,
            "baselineSavingsPercent": str(round(baseline_pct, 2)),
            "estimatedSavingsPercent": str(round(estimated_pct, 2)),
            "baselineROI": baseline_roi,
            "estimatedROI": round((total_val * 12) / total_savings) if total_savings else 0,
            "xecoUnits": xeco_units,
            "charges": [
                {
                    "chargeName": li.get("name") or li.get("chargeName") or "",
                    "amount": _fmt_currency(li.get("amount") or li.get("totalCharge") or 0),
                    "savingsAmount": _fmt_currency(
                        float(li.get("amount") or li.get("totalCharge") or 0) * baseline_pct / 100
                    ),
                }
                for li in (eba.get("lineItems") or [])
                if li.get("name") or li.get("chargeName")
            ],
        },
        "identifiedEquipment": {
            "items": items,
            "parts": parts,
            "total": _fmt_currency(total_obj.get("subtotal")),
            "tax": _fmt_currency(total_obj.get("tax")),
            "discount": _fmt_currency(total_obj.get("discount")),
            "totalProjectCost": _fmt_currency(total_val),
        },
    }


def map_finance_agreement_data(project, client, xeco):
    """Map project to finance agreement PDF data."""
    rf = (project.reportFields or {}) if hasattr(project, "reportFields") else {}
    equip = (project.equipmentInfo or {}) if hasattr(project, "equipmentInfo") else {}
    eba = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    calc = bill_analytic_calculate(project)

    total_val = float((equip.get("total") or {}).get("total") or 0)
    down_pct = float(rf.get("downPaymentPercent") or 0) / 100
    interest_rate = float(rf.get("interestRate") or 0) / 100
    down_payment = down_pct * total_val
    finance_cost = (total_val - down_payment) * interest_rate
    balance = total_val - down_payment + finance_cost
    total_savings = float(eba.get("totalSavings") or 1)
    months_to_pay = round(balance / total_savings, 2) if total_savings else 0

    try:
        bill_dt = datetime.fromisoformat(str(eba.get("billDate", "")).replace("Z", "+00:00"))
        report_date = bill_dt.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        report_date = datetime.now().strftime("%B %d, %Y")

    fa_base_number = _lazy_assign_number(project)
    fa_report_number = f"B-{fa_base_number}" if fa_base_number else ""

    return {
        "projectCurrency": project.currencyCode or "USD",
        "date": datetime.now().strftime("%B %d, %Y"),
        "interestRate": rf.get("interestRate", 0),
        "downPaymentPercent": rf.get("downPaymentPercent", 0),
        "reportNumber": fa_report_number,
        "clientName": client.legalName or client.name if client else "",
        "clientAddress": client.address if client else "",
        "clientCity": client.city if client else "",
        "clientState": client.state if client else "",
        "clientZip": client.zip if client else "",
        "location": project.location or "",
        "downPayment": _fmt_currency(down_payment),
        "monthlyPayment": _fmt_currency(total_savings),
        "totalFinancingCost": _fmt_currency(finance_cost),
        "totalProjectCost": _fmt_currency(total_val + finance_cost),
        "monthsToPay": months_to_pay,
        "reportDate": report_date,
        "billAnalysis": {
            "demand": _fmt_number(calc.get("demandKwh", 0)),
            "totalCost": _fmt_currency(total_val),
        },
        "estimatedROI": round(total_val / total_savings) if total_savings else 0,
    }
