"""
Equipment calculations - port of api/services/utilities/equipment-calculations.js
Selects/aggregates equipmentInfo from meterEquipment when metersToReport filters meters.
"""
import copy


def calculate(project, meters_to_report=None):
    equip = (project.equipmentInfo or {}) if hasattr(project, "equipmentInfo") else {}
    meter_equip = equip.get("meterEquipment")

    if not meters_to_report:
        if meter_equip is None:
            return equip
        equipments = meter_equip
    else:
        if not meter_equip or not isinstance(meter_equip, list):
            return equip
        equipments = [m for m in meter_equip if m.get("meterNumber") in meters_to_report]
        if not equipments:
            return equip

    if not isinstance(equipments, list):
        return equipments
    if not equipments:
        return equip

    if len(equipments) > 1:
        equipment_info = copy.deepcopy(equipments[1])
    else:
        equipment_info = copy.deepcopy(equipments[0])

    if len(equipments) <= 2:
        return equipment_info

    equipment_info.setdefault("items", [])
    equipment_info.setdefault("parts", [])
    equipment_info.setdefault("services", [])
    equipment_info.setdefault("total", {"itemTotal": 0, "subtotal": 0, "tax": 0, "discount": 0, "total": 0})
    discount_pct = float(getattr(project, "discount", 0) or 0) / 100

    for i in range(2, len(equipments)):
        other = equipments[i]
        for svc in (other.get("services") or []):
            existing = next((s for s in equipment_info["services"] if s.get("name") == svc.get("name")), None)
            if existing:
                existing["price"] = float(existing.get("price") or 0) + float(svc.get("price") or 0)
        for p in (other.get("parts") or []):
            existing = next((x for x in equipment_info["parts"] if x.get("name") == p.get("name")), None)
            if existing:
                existing["count"] = int(existing.get("count") or 0) + int(p.get("count") or 0)
        for it in (other.get("items") or []):
            existing = next((x for x in equipment_info["items"] if x.get("name") == it.get("name")), None)
            if existing:
                existing["count"] = int(existing.get("count") or 0) + int(it.get("count") or 0)
        t = equipment_info["total"]
        ot = other.get("total") or {}
        t["itemTotal"] = float(t.get("itemTotal") or 0) + float(ot.get("itemTotal") or 0)
        t["subtotal"] = float(t.get("subtotal") or 0) + float(ot.get("subtotal") or 0)
        t["tax"] = float(t.get("tax") or 0) + float(ot.get("tax") or 0)
        t["discount"] = (t["itemTotal"] * discount_pct) + float(t.get("discount") or 0)
        t["total"] = float(t.get("total") or 0) + float(ot.get("total") or 0)

    return equipment_info
