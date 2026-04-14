"""
DataSync service - ported from api/services/DataSyncService.js
Exports records for sync between XECO installations.
Expects tables to have xuid and updatedAt columns.
"""

# References: ref field -> table(s) to join for xuid
REFERENCES = {
    "client": {},
    "gateway": {"project": "project"},
    "meter": {"project": "project"},
    "switch_switches_switch__switchcommand_switches": {
        "switch_switches_switch": "switch",
        "switchcommand_switches": "switchcommand",
    },
    "project": {"client": "client", "servicePlan": "serviceplan", "xecoManager": "user", "selectedTest": "test"},
    "repeater": {"project": "project"},
    "schedule": {"project": "project", "switches": "switch"},
    "serviceplan": {},
    "switch": {"project": "project"},
    "switchcommand": {"project": "project"},
    "test": {"project": "project"},
    "meterdata": {"meter": "meter"},
    "meterdataaggregate": {"project": "project"},
    "permeterdataaggregate": {"project": "project", "meter": "meter"},
    "xeco": {},
    # reportdata has var ref typeId:@type:meter|project - skipped for simplified port
    "piboard": {},
}


def is_syncable(table):
    """Check if table can be synced."""
    return table == "deleted" or (table in REFERENCES)


def export_records(table, since, limit, ref_id):
    """Export records for table. Returns list of dicts."""
    from flask import current_app
    from sqlalchemy import text
    from app.extensions import db

    since = since or 0
    limit = limit or 10000
    if limit > 10000:
        limit = 10000
    ref_id = ref_id or 0

    if table == "deleted":
        return _export_deleted(since, limit)

    if table not in REFERENCES:
        return []

    refs = REFERENCES[table]
    selects = ["mainTable.*"]
    joins = []
    wheres = []

    if ref_id:
        wheres.append(
            f"(mainTable.updatedAt = {since} AND mainTable.id >= {ref_id} OR mainTable.updatedAt > {since})"
        )
    else:
        wheres.append(f"mainTable.updatedAt >= {since}")

    replaced_fields = []
    for ref_field, ref_val in refs.items():
        if isinstance(ref_val, str) and ref_val.startswith("@"):
            continue  # Skip var refs for now (reportdata)
        ref_tables = [ref_val] if isinstance(ref_val, str) else ref_val.split("|")
        for ref_table in ref_tables:
            field_prefix = ref_table + "___" if len(ref_tables) > 1 else ""
            replaced_fields.append(field_prefix + ref_field)
            selects.append(f"{ref_table}.xuid AS {field_prefix}{ref_field}_xuid")
            joins.append(
                f"LEFT JOIN {ref_table} AS {ref_table} ON mainTable.{ref_field} = {ref_table}.id"
            )
            wheres.append(
                f"({ref_table}.id IS NOT NULL OR (mainTable.{ref_field} IS NULL AND {ref_table}.id IS NULL))"
            )

    sql = f"""
        SELECT {', '.join(selects)}
        FROM {table} AS mainTable {' '.join(joins)}
        WHERE {' AND '.join(wheres)}
        ORDER BY mainTable.updatedAt, mainTable.id
        LIMIT {limit}
    """
    try:
        result = db.session.execute(text(sql))
        rows = result.fetchall()
    except Exception:
        return []

    records = []
    for row in rows:
        rec = dict(row._mapping) if hasattr(row, "_mapping") else dict(zip(row._fields, row))
        rec["_refid"] = rec.get("id")
        if "id" in rec:
            del rec["id"]
        for field in replaced_fields:
            xuid_key = field + "_xuid"
            if xuid_key in rec:
                rec[field] = rec.get(xuid_key)
                del rec[xuid_key]
        records.append(rec)
    return records


def _export_deleted(since, limit):
    """Export deleted xuid records."""
    from sqlalchemy import text
    from app.extensions import db
    try:
        result = db.session.execute(
            text(f"SELECT * FROM _deleted_xuids WHERE deletedAt > {since} ORDER BY deletedAt LIMIT {limit}")
        )
        rows = result.fetchall()
        return [dict(r._mapping) if hasattr(r, "_mapping") else {} for r in rows]
    except Exception:
        return []
