"""
Bill Analytic data mapper - port of api/helpers/pdf/bill-analytic-data-mapper.js
Produces the full data structure for api/services/pdf/generators/bill-analytic.js
"""
import copy
import re
from datetime import datetime

from app.services.bill_analytic_calculations import calculate as bill_analytic_calculate
from app.services.selected_bill_analytic_calculations import calculate as selected_bill_calculate
from app.services.equipment_calculations import calculate as equipment_calculate


def _is_conforming_number(val):
    if not val:
        return False
    v = str(val).strip()
    return bool(re.match(r"^\d{4}-\d{4,}$", v) or re.match(r"^\d{8,}$", v))


def _lazy_assign_number(project):
    """
    If project.proposalNumber is blank or non-conforming, generate and persist one.
    Returns the (bare) number string without any prefix.
    """
    raw = getattr(project, "proposalNumber", None) or ""
    if _is_conforming_number(raw):
        return str(raw).strip()

    # Need a DB session to generate the next number
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


def _fmt_currency(val):
    try:
        return f"${float(val):,.2f}" if val is not None else "$0.00"
    except (ValueError, TypeError):
        return "$0.00"


def _fmt_number(val):
    try:
        return f"{float(val):,.0f}" if val is not None else "0"
    except (ValueError, TypeError):
        return "0"


def _fmt_date(ts):
    if ts is None:
        return datetime.now().strftime("%B %d, %Y")
    try:
        if isinstance(ts, (int, float)):
            dt = datetime.fromtimestamp(ts / 1000 if ts > 1e12 else ts)
        else:
            dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        return datetime.now().strftime("%B %d, %Y")


def _find_service(services, name):
    return next((s for s in (services or []) if (s.get("name") or "") == name), None)


def map_bill_analytic_data(project, client, xeco_manager, meters_to_report=None):
    eba_raw = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    rf = (project.reportFields or {}) if hasattr(project, "reportFields") else {}

    proj_dict = {
        "electricBillAnalysis": copy.deepcopy(eba_raw),
        "reportFields": rf,
        "equipmentInfo": getattr(project, "equipmentInfo", None) or {},
        "discount": getattr(project, "discount", 0),
        "salesTax": getattr(project, "salesTax", 0),
        "currencyCode": getattr(project, "currencyCode", "USD") or "USD",
        "location": getattr(project, "location", ""),
        "proposalNumber": getattr(project, "proposalNumber", ""),
    }

    if meters_to_report and (eba_raw.get("meterBills") or []):
        selected_bill_calculate(proj_dict, meters_to_report)
        eba = proj_dict["electricBillAnalysis"]
    else:
        eba = proj_dict["electricBillAnalysis"]

    class Proj:
        pass

    proj = Proj()
    proj.electricBillAnalysis = eba
    proj.reportFields = rf
    proj.equipmentInfo = getattr(project, "equipmentInfo", None) or {}
    proj.discount = getattr(project, "discount", 0)
    proj.currencyCode = getattr(project, "currencyCode", "USD") or "USD"
    proj.location = getattr(project, "location", "")
    proj.proposalNumber = getattr(project, "proposalNumber", "")

    equipment_info = equipment_calculate(proj, meters_to_report)
    calculated_data = bill_analytic_calculate(proj)

    all_charges = []
    for bill in (eba.get("meterBills") or []):
        if bill and (not meters_to_report or bill.get("meterNumber") in meters_to_report):
            all_charges.extend(bill.get("lineItems") or [])
    if not all_charges:
        all_charges = eba.get("lineItems") or []

    items = equipment_info.get("items") or []
    extra_savings_pf = 0
    for item in items:
        if (item.get("name") or "") == "XPF480-100":
            cnt = int(item.get("count") or 0)
            extra_savings_pf = min(cnt * 0.25, 6 * 0.25) / 100
            break

    total_charges = float(calculated_data.get("totalCharges") or 0)
    total_savings = float(eba.get("totalSavings") or 0)
    baseline_savings_pct = (total_savings / total_charges + extra_savings_pf) if total_charges else 0
    estimated_savings_pct = baseline_savings_pct * 1.47
    extra_offset = baseline_savings_pct / (total_savings / total_charges) if (total_savings and total_charges) else 1

    charges = [
        {"description": c.get("name", ""), "amount": _fmt_currency(c.get("cost")), "savings": _fmt_currency(float(c.get("savings") or 0) * extra_offset), "reference": 2}
        for c in all_charges
    ]

    line_items = eba.get("lineItems") or []
    ref2_sec1 = [{"name": c.get("name", ""), "cost": float(c.get("cost") or 0), "amount": _fmt_currency(c.get("cost"))} for c in line_items[0:4]]
    total_ref2_sec1 = round(sum(c.get("cost", 0) for c in ref2_sec1), 2)
    ref2_sec2 = [{"name": c.get("name", ""), "cost": float(c.get("cost") or 0), "amount": _fmt_currency(c.get("cost"))} for c in line_items[3:10]]
    while len(ref2_sec2) < 10:
        ref2_sec2.append({"name": "", "amount": ""})
    total_ref2_sec2 = sum(c.get("cost", 0) for c in ref2_sec2)
    ref3_charges = [{"name": c.get("name", ""), "cost": float(c.get("cost") or 0), "amount": _fmt_currency(c.get("cost"))} for c in line_items[10:]]
    ref3_total = sum(c.get("cost", 0) for c in ref3_charges) + float(eba.get("customerCharge") or 0)

    client_name = (client.name or "") if client else ""
    client_addr = "\n".join(p for p in [client.address or "", f"{client.city or ''}, {client.state or ''} {client.zip or ''}".strip(", ")] if p.strip()) if client else ""
    prepared_for = f"{(client.legalName or client_name)}\n{client_addr}" if client else ""
    prepared_by = audited_by = ""
    if xeco_manager:
        prepared_by = audited_by = f"{xeco_manager.firstName or ''} {xeco_manager.lastName or ''}".strip()
    attn = f"{client.contactName or ''}, {client.contactTitle or ''}".strip(", ") if client and (client.contactName or client.contactTitle) else ""

    equip_total = equipment_info.get("total") or {}
    items_sum = sum(int(i.get("count") or 0) * float(i.get("price") or 0) for i in items)
    parts_list = equipment_info.get("parts") or []
    parts_sum = sum(float(p.get("count") or 0) * float(p.get("price") or 0) for p in parts_list)
    xeco_equip_cost = items_sum + parts_sum
    discount_val = sum(int(i.get("count") or 0) * float(i.get("price") or 0) * float(proj.discount or 0) / 100 for i in items)
    eng_svc = _find_service(equipment_info.get("services"), "ENGINEERING/SERVICES/INSTALLATIONS")
    metering_svc = _find_service(equipment_info.get("services"), "ANNUAL METERING/SERVER FEE")
    shipping_svc = _find_service(equipment_info.get("services"), "SHIPPING COSTS")
    total_cost_val = float(equip_total.get("total") or 0)
    sales_tax_rate = float(getattr(project, "salesTax", 0) or 0) / 100

    est_roi = int(total_cost_val / (total_charges * estimated_savings_pct)) if (total_charges * estimated_savings_pct) else 0
    base_roi = int(total_cost_val / (total_charges * baseline_savings_pct)) if (total_charges * baseline_savings_pct) else 0
    recommended_units = sum(int(i.get("count") or 0) for i in items)

    base_number = _lazy_assign_number(project)
    report_number = f"B-{base_number}" if base_number else ""

    data = {
        "projectCurrency": proj.currencyCode,
        "date": _fmt_date(eba.get("date")),
        "reportNumber": report_number,
        "clientName": client_name,
        "clientAddress": client_addr,
        "clientAccount": eba.get("accountNumber", ""),
        "clientSupplier": eba.get("electricCompanyName", ""),
        "location": proj.location,
        "preparedFor": prepared_for,
        "preparedBy": prepared_by,
        "auditedBy": audited_by,
        "attn": attn,
        "estimatedSavingsPercent": f"{(estimated_savings_pct * 100):.2f}",
        "baselineSavingsPercent": f"{(baseline_savings_pct * 100):.2f}",
        "estimatedROI": est_roi,
        "baselineROI": base_roi,
        "recommendedUnits": recommended_units,
        "reference": eba.get("billReference", ""),
        "reportDate": _fmt_date(eba.get("billDate")),
        "version": "1",
        "regulatoryCharges": "$3,272.88",
        "greenChoicePatron15": "$41,800.00",
        "powerSupplyAdjustment": "$67,708.67",
        "loadProfile": "$60,00",
    }

    data["estimatedSavings"] = {
        "totalCharges": _fmt_currency(calculated_data.get("totalCharges")),
        "monthEndCharge": _fmt_currency(eba.get("billAmount")),
        "customerCharge": _fmt_currency(eba.get("customerCharge")),
        "totalSavings": _fmt_currency(total_savings * extra_offset),
        "bill": _fmt_currency(total_charges - total_savings * extra_offset),
        "annualSavings": _fmt_currency(total_savings * extra_offset * 12),
        "xecoEquipmentCost": _fmt_currency(xeco_equip_cost),
        "partCost": _fmt_currency(parts_sum),
        "projectManagementCost": _fmt_currency(eng_svc.get("price") if eng_svc else 0),
        "meteringFee": _fmt_currency(metering_svc.get("price") if metering_svc else 0),
        "shippingFee": _fmt_currency(shipping_svc.get("price") if shipping_svc else 0),
        "discount": "-" + _fmt_currency(discount_val),
        "totalCost": _fmt_currency(total_cost_val),
        "co2Reduction": round(float(calculated_data.get("co2Reduction") or 0), 2),
        "charges": charges,
        "salesTax": sales_tax_rate,
    }

    data["billAnalysis"] = {
        "bill": _fmt_currency(eba.get("billAmount")),
        "kwhConsumed": round(float(eba.get("totalKwh") or 0)),
        "kwhTotalRate": round(float(calculated_data.get("combinedKwhRate") or 0), 6),
        "demandChargeRate": _fmt_currency(eba.get("kwRatePerTariff")),
        "baselineKwh": _fmt_number(calculated_data.get("baselineKwh")),
        "demand": _fmt_number(calculated_data.get("demandKwh")),
        "totalOverageCost": _fmt_currency(calculated_data.get("totalOverageCost")),
        "totalCharges": _fmt_currency(calculated_data.get("totalCharges")),
        "totalReference2Section1Charges": _fmt_currency(total_ref2_sec1),
        "reference2Section1Charges": ref2_sec1,
        "totalReference2Section2Charges": _fmt_currency(total_ref2_sec2),
        "reference2Section2Charges": ref2_sec2,
        "reference3Charges": ref3_charges,
    }

    data["calculatedWaste"] = {
        "kwhConsumed": _fmt_number(eba.get("totalKwh")),
        "Kw15Min": _fmt_number(calculated_data.get("kw15MinuteInterval")),
        "avgAmpDraw": _fmt_number(calculated_data.get("ampDraw")),
        "avgAmpDrawNum": calculated_data.get("ampDraw"),
        "powerFactor": round(float(calculated_data.get("demandSidePowerFactor") or 0) * 100, 2),
        "reactiveKvarWaste": round(float(calculated_data.get("demandSideReactiveEnergy") or 0) * 100, 2),
        "reactiveKvarSupplyWasteAmps": round(float(calculated_data.get("ampDraw") or 0) * float(calculated_data.get("demandSideReactiveEnergy") or 0)),
        "ampSavings": _fmt_number(calculated_data.get("ampSavings")),
        "kwSavings": _fmt_number(calculated_data.get("calculatedKwSavings")),
        "kwhSavings": _fmt_number(calculated_data.get("calculatedKwhSavings")),
    }

    data["reference3"] = {
        "customerCharge": _fmt_currency(eba.get("customerCharge")),
        "totalAdditional": _fmt_currency(ref3_total),
        "totalCurrent": _fmt_currency(calculated_data.get("totalCharges")),
    }

    kw_rate = float(eba.get("kwRatePerTariff") or 0)
    montly_kw_savings = float(calculated_data.get("montlyKwSavings") or 0)

    data["supplySide"] = {
        "billedKw": round(float(eba.get("kwPeak") or 0)),
        "billedKWAsOf": _fmt_date(eba.get("billDate")),
        "current": {"kwUsage": _fmt_number(calculated_data.get("kw15MinuteInterval")), "kwSupplyReserve": "----", "kwSavings": "", "rateKw": ""},
        "afterXeco": {
            "kwUsage": _fmt_number(calculated_data.get("afterXecoKwUsage")),
            "kwSupplyReserve": _fmt_number(calculated_data.get("newKwSupplyReserve")),
            "kwSavings": _fmt_number(montly_kw_savings),
            "rateKw": _fmt_currency(kw_rate * round(montly_kw_savings, 0)),
        },
    }

    curr_reserve = float(calculated_data.get("currentCalculatedReservePercent") or 0) * 100
    rec_reserve = float(calculated_data.get("recommendedCalculatedReservePercent") or 0) * 100
    add_reserve = float(calculated_data.get("additionalCalculatedReservePercent") or 0) * 100

    data["reserveCalculations"] = {
        "current": {"reserve": _fmt_number(curr_reserve), "unusedKwOversupply": _fmt_number(calculated_data.get("currentUnusedKwOversupply")), "overbill": _fmt_currency(calculated_data.get("currentOverbill"))},
        "recommended": {"reserve": _fmt_number(rec_reserve), "unusedKwOversupply": _fmt_number(calculated_data.get("recommendedUnusedKwOversupply")), "overbill": _fmt_currency(calculated_data.get("recommendedOverbill"))},
        "savings": {"reserve": _fmt_number(add_reserve), "unusedKwOversupply": _fmt_number(calculated_data.get("additionalUnusedKwOversupply")), "overbill": _fmt_currency(calculated_data.get("additionalOverbill"))},
    }

    data["totalReserveSavings"] = _fmt_currency(calculated_data.get("estimatedMonthlySavingsWithReserveAdjustment"))
    data["totalReserveSavingsPercent"] = _fmt_number(calculated_data.get("estimatedMonthlySavingsPercent"))

    return data
