"""
Bill analytic calculations - ported from api/services/utilities/bill-analytic-calculations.js
Used by invoice PDF data mapper.
"""


def calculate(project):
    """Calculate bill analytic data from project. project must have electricBillAnalysis, reportFields."""
    eba = (project.electricBillAnalysis or {}) if hasattr(project, "electricBillAnalysis") else {}
    rf = (project.reportFields or {}) if hasattr(project, "reportFields") else {}

    if not eba:
        return _default_calc()

    savings = {"amp": 0.4, "kw": 487 / 1000}
    data = {}

    total_kwh = float(eba.get("totalKwh") or 0)
    eff_pct = rf.get("effectivePercent") or 100
    total_kwh = total_kwh * (eff_pct / 100)
    data["recommendedCalculatedReservePercentAsFraction"] = 15 / 100
    days_billed = int(eba.get("daysBilled") or 30)
    data["billingHours"] = days_billed * 24
    data["volts"] = float(eba.get("voltage") or 476)
    data["ampDraw"] = total_kwh / (data["billingHours"] or 720)
    data["ampDraw"] = data["ampDraw"] * 1000 / data["volts"]

    data["kvar"] = (data["ampDraw"] * data["volts"]) / 1000
    kw_peak = float(eba.get("kwPeak") or 1)
    data["kw15MinuteInterval"] = total_kwh / (24 * days_billed)
    data["pfEquation"] = data["kw15MinuteInterval"] / kw_peak
    data["kvarPercent"] = (data["pfEquation"] - 1) * -1
    data["kwInKvar"] = data["kvar"] * data["kvarPercent"]
    data["actualKw"] = data["kvar"] + data["kwInKvar"]
    data["demandSidePowerFactor"] = data["pfEquation"]
    data["demandSideReactiveEnergy"] = 1 - data["demandSidePowerFactor"]
    data["kwKwhSupplyRatio"] = data["kw15MinuteInterval"] / kw_peak
    data["baselineKwh"] = total_kwh * data["kwKwhSupplyRatio"]
    data["demandKwh"] = total_kwh * (1 - data["kwKwhSupplyRatio"])
    data["reactiveKvarSupplyWaste"] = 1 - data["demandSidePowerFactor"]
    data["ampSavings"] = data["demandSideReactiveEnergy"] * data["ampDraw"] * savings["amp"]
    data["calculatedKwSavings"] = data["ampSavings"] * data["volts"] / 1000
    data["calculatedKwhSavings"] = data["calculatedKwSavings"] * 23 * 29
    data["baselineDemand"] = data["demandKwh"] / total_kwh if total_kwh else 0
    data["co2Reduction"] = data["calculatedKwhSavings"] * 0.00070868248

    line_items = eba.get("lineItems") or []
    data["combinedKwhRate"] = sum(
        float(i.get("billingRate") or 0) for i in line_items if i.get("type") == "kwh"
    )
    data["totalOverageCost"] = data["combinedKwhRate"] * data["demandKwh"]
    data["totalCharges"] = sum(float(i.get("cost") or 0) for i in line_items) + float(
        eba.get("customerCharge") or 0
    )

    kw_rate = float(eba.get("kwRatePerTariff") or 0)
    data["afterXecoKwUsage"] = data["kw15MinuteInterval"] - data["calculatedKwSavings"]
    data["newKwSupplyReserve"] = data["afterXecoKwUsage"] * (
        1 + data["recommendedCalculatedReservePercentAsFraction"]
    )
    data["montlyKwSavings"] = kw_peak - data["newKwSupplyReserve"]
    data["rateKwAfter"] = data["montlyKwSavings"] * kw_rate

    data["currentUnusedKwOversupply"] = kw_peak - data["kw15MinuteInterval"]
    data["currentCalculatedReservePercent"] = (
        data["currentUnusedKwOversupply"] / data["kw15MinuteInterval"]
        if data["kw15MinuteInterval"]
        else 0
    )
    data["currentOverbill"] = round(data["currentUnusedKwOversupply"], 0) * kw_rate
    data["recommendedCalculatedReservePercent"] = data["recommendedCalculatedReservePercentAsFraction"]
    data["additionalUnusedKwOversupply"] = kw_peak - (
        data["kw15MinuteInterval"] * (data["recommendedCalculatedReservePercentAsFraction"] + 1)
    )
    data["additionalCalculatedReservePercent"] = (
        data["currentCalculatedReservePercent"] - data["recommendedCalculatedReservePercent"]
    )
    data["additionalOverbill"] = round(data["additionalUnusedKwOversupply"], 0) * kw_rate
    data["recommendedUnusedKwOversupply"] = (
        data["currentUnusedKwOversupply"] - data["additionalUnusedKwOversupply"]
    )
    data["recommendedOverbill"] = data["currentOverbill"] - data["additionalOverbill"]

    if data["additionalOverbill"] < 0:
        data["additionalOverbill"] = 0
        data["additionalCalculatedReservePercent"] = 0
        data["additionalUnusedKwOversupply"] = 0

    total_savings = float(eba.get("totalSavings") or 0)
    data["estimatedMonthlySavingsWithReserveAdjustment"] = data["additionalOverbill"] + total_savings
    data["estimatedMonthlySavingsPercent"] = (
        data["estimatedMonthlySavingsWithReserveAdjustment"] / data["totalCharges"]
        if data["totalCharges"]
        else 0
    )
    return data


def _default_calc():
    return {
        "co2Reduction": 0,
        "totalCharges": 0,
        "estimatedMonthlySavingsWithReserveAdjustment": 0,
        "estimatedMonthlySavingsPercent": 0,
        "recommendedCalculatedReservePercentAsFraction": 0.15,
        "billingHours": 720,
        "volts": 476,
        "ampDraw": 0,
        "kvar": 0,
        "kw15MinuteInterval": 0,
        "pfEquation": 0,
        "kvarPercent": 0,
        "kwInKvar": 0,
        "actualKw": 0,
        "demandSidePowerFactor": 0,
        "demandSideReactiveEnergy": 0,
        "kwKwhSupplyRatio": 0,
        "baselineKwh": 0,
        "demandKwh": 0,
        "reactiveKvarSupplyWaste": 0,
        "ampSavings": 0,
        "calculatedKwSavings": 0,
        "calculatedKwhSavings": 0,
        "baselineDemand": 0,
        "combinedKwhRate": 0,
        "totalOverageCost": 0,
        "afterXecoKwUsage": 0,
        "newKwSupplyReserve": 0,
        "montlyKwSavings": 0,
        "rateKwAfter": 0,
        "currentUnusedKwOversupply": 0,
        "currentCalculatedReservePercent": 0,
        "currentOverbill": 0,
        "recommendedCalculatedReservePercent": 0.15,
        "additionalUnusedKwOversupply": 0,
        "additionalCalculatedReservePercent": 0,
        "additionalOverbill": 0,
        "recommendedUnusedKwOversupply": 0,
        "recommendedOverbill": 0,
    }
