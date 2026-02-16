"""
Selected Bill Analytic calculations - port of api/services/utilities/selected-bill-analytic-calculations.js
Aggregates meter bills for selectedBillAnalytic (when metersToReport filters which meters to include).
Used in bill-analytic and proposal PDF data mappers.
"""


def calculate(project, bills=None):
    """
    Aggregate electricBillAnalysis across meter bills, optionally filtered by bills (meter numbers).
    Modifies project['electricBillAnalysis'] in place and returns it.
    project: dict with electricBillAnalysis.meterBills, etc.
    bills: optional list of meter numbers to include; None = all
    """
    eba = project.get("electricBillAnalysis") or {}
    meter_bills = eba.get("meterBills") or []
    if not meter_bills:
        return eba

    sum_bill_amount = 0
    sum_kwh = 0
    voltage = 0
    sum_peak = 0
    sum_customer_charge = 0
    sum_switch_gear = 0
    sum_main_circuit = 0
    sum_total_savings = 0
    sum_kw_rate_per_tariff = 0

    sum_line_items = [
        {"name": "KWH Charges", "type": "kwh", "cost": 0, "billingRate": 0, "savings": 0},
        {"name": "KW Charges", "type": "kw", "cost": 0, "billingRate": 0, "savings": 0},
        {"name": "Tax Charges", "type": "tax", "cost": 0, "savings": 0},
        {"name": "Miscellaneous Charges", "type": "m", "cost": 0, "savings": 0},
        {"name": "X Charges", "type": "x", "cost": 0, "savings": 0},
    ]

    for bill in meter_bills:
        meter_num = bill.get("meterNumber")
        if bills is not None and meter_num not in bills:
            continue
        sum_kwh += float(bill.get("totalKwh") or 0)
        sum_peak += float(bill.get("kwPeak") or 0)
        sum_bill_amount += float(bill.get("billAmount") or 0)
        voltage = float(bill.get("voltage") or 0)
        sum_total_savings += float(bill.get("totalSavings") or 0)
        sum_customer_charge += float(bill.get("customerCharge") or 0)
        sum_switch_gear += int(bill.get("switchGearCount") or 0)
        sum_main_circuit += int(bill.get("mainCircuitCount") or 0)
        sum_kw_rate_per_tariff += float(bill.get("kwRatePerTariff") or 0)

        bill_billing_rate = 0
        bill_avg_rate = 0
        kwh_saving = kw_saving = kwh_cost = kw_cost = 0
        m_saving = m_cost = tax_saving = tax_cost = x_saving = x_cost = 0

        for line_item in bill.get("lineItems") or []:
            li_type = line_item.get("type", "")
            if li_type == "kwh":
                bill_billing_rate += float(line_item.get("tierHours") or 0) / 24 * float(line_item.get("billingRate") or 0)
                kwh_saving += float(line_item.get("savings") or 0)
                kwh_cost += float(line_item.get("cost") or 0)
            elif li_type == "kw":
                bill_avg_rate += float(line_item.get("tierHours") or 0) / 24 * float(line_item.get("billingRate") or 0)
                kw_saving += float(line_item.get("savings") or 0)
                kw_cost += float(line_item.get("cost") or 0)
            elif li_type == "m":
                m_saving += float(line_item.get("savings") or 0)
                m_cost += float(line_item.get("cost") or 0)
            elif li_type == "tax":
                tax_saving += float(line_item.get("savings") or 0)
                tax_cost += float(line_item.get("cost") or 0)
            elif li_type == "x":
                x_saving += float(line_item.get("savings") or 0)
                x_cost += float(line_item.get("cost") or 0)

        for sli in sum_line_items:
            if sli["type"] == "kwh":
                sli["billingRate"] += bill_billing_rate
                sli["cost"] += kwh_cost
                sli["savings"] += kwh_saving
            elif sli["type"] == "kw":
                sli["billingRate"] += bill_avg_rate
                sli["cost"] += kw_cost
                sli["savings"] += kw_saving
            elif sli["type"] == "m":
                sli["cost"] += m_cost
                sli["savings"] += m_saving
            elif sli["type"] == "tax":
                sli["cost"] += tax_cost
                sli["savings"] += tax_saving
            elif sli["type"] == "x":
                sli["cost"] += x_cost
                sli["savings"] += x_saving

    # Average rates - divide by meterBills.length (total count)
    n_bills = len(meter_bills)
    if n_bills > 0:
        for sli in sum_line_items:
            if sli["type"] in ("kwh", "kw"):
                sli["billingRate"] = sli["billingRate"] / n_bills
        sum_kw_rate_per_tariff = sum_kw_rate_per_tariff / n_bills

    eba["billAmount"] = sum_bill_amount
    eba["totalKwh"] = sum_kwh
    eba["kwPeak"] = sum_peak
    eba["voltage"] = voltage
    eba["customerCharge"] = sum_customer_charge
    eba["switchGearCount"] = sum_switch_gear
    eba["mainCircuitCount"] = sum_main_circuit
    eba["lineItems"] = sum_line_items
    eba["totalSavings"] = sum_total_savings
    eba["kwRatePerTariff"] = sum_kw_rate_per_tariff

    return eba
