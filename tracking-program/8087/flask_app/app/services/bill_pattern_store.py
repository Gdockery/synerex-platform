"""
Bill Pattern Store - stores and retrieves regex patterns for electric bill extraction.
Scales to 10,000+ patterns via indexing by utility_name and structure_key.
"""
import hashlib
import os
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    from flask import current_app
except ImportError:
    current_app = None


@dataclass
class Pattern:
    """A single extraction pattern."""

    id: int
    field: str
    regex: str
    capture_group: int
    category: str
    utility_name: str
    structure_key: str
    priority: int
    created_by: str
    status: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "field": self.field,
            "regex": self.regex,
            "capture_group": self.capture_group,
            "category": self.category,
            "utility_name": self.utility_name,
            "structure_key": self.structure_key,
            "priority": self.priority,
            "created_by": self.created_by,
            "status": self.status,
        }


def _get_db_path() -> Path:
    """Get path to pattern store SQLite DB."""
    path = ""
    try:
        if current_app:
            path = current_app.config.get("BILL_PATTERN_STORE_PATH", "")
    except RuntimeError:
        pass
    if not path:
        path = os.environ.get("BILL_PATTERN_STORE_PATH", "")
    if not path:
        # Default: flask_app/data/bill_pattern_store.db
        base = Path(__file__).resolve().parent.parent.parent
        path = str(base / "data" / "bill_pattern_store.db")
    return Path(path)


def _get_table_name() -> str:
    """Get pattern store table name."""
    name = ""
    if current_app:
        name = current_app.config.get("BILL_PATTERN_STORE_TABLE", "")
    if not name:
        name = os.environ.get("BILL_PATTERN_STORE_TABLE", "")
    return name or "bill_extraction_patterns"


def _get_connection() -> sqlite3.Connection:
    """Get a connection to the pattern store DB."""
    db_path = _get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_store() -> None:
    """Create the pattern store table and indexes if they do not exist."""
    conn = _get_connection()
    table = _get_table_name()
    safe_table = re.sub(r"[^a-zA-Z0-9_]", "_", table)
    try:
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS [{table}] (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field TEXT NOT NULL,
                regex TEXT NOT NULL,
                capture_group INTEGER DEFAULT 1,
                category TEXT NOT NULL,
                utility_name TEXT NOT NULL DEFAULT '*',
                structure_key TEXT NOT NULL DEFAULT '*',
                priority INTEGER DEFAULT 0,
                created_by TEXT DEFAULT 'migration',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success_count INTEGER DEFAULT 0,
                fail_count INTEGER DEFAULT 0
            )
        """)
        conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{safe_table}_lookup ON [{table}] (utility_name, structure_key)")
        conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{safe_table}_field ON [{table}] (field, utility_name)")
        conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{safe_table}_status ON [{table}] (status)")
        conn.commit()
    finally:
        conn.close()


def _validate_regex(regex: str) -> bool:
    """Return True if the regex compiles."""
    try:
        re.compile(regex)
        return True
    except re.error:
        return False


def classify_bill(text: str) -> tuple[str, str]:
    """
    Classify bill text to (utility_name, structure_key).
    utility_name: extracted from company regex, or 'unknown' if not found.
    structure_key: hash of text structure for now, or '*' for generic.
    """
    if not text or not isinstance(text, str):
        return ("unknown", "*")

    head = text[:500]
    t = re.sub(r"\s+", " ", head).strip()

    # Try to extract utility/company name
    util_match = re.search(
        r"([A-Z][A-Za-z\s]+(?:Energy|Electric|Power|Utilities?|Corp|Company|Co\.?))\b",
        t,
    )
    utility_name = "unknown"
    if util_match:
        name = util_match.group(1).strip()
        # Normalize to a short key (e.g. "Poudre Valley REA" -> "poudre")
        name_lower = name.lower()
        if "poudre" in name_lower:
            utility_name = "poudre"
        elif "dallas" in name_lower or "oncor" in name_lower:
            utility_name = "dallas"
        else:
            utility_name = re.sub(r"[^a-z0-9]+", "_", name_lower)[:30] or "unknown"

    # Structure key: simple hash of section markers (presence of key phrases)
    markers = []
    for phrase in [
        "total amount due",
        "billing period",
        "services",
        "from",
        "to",
        "kwh",
        "kw",
        "account",
        "meter",
    ]:
        if phrase in t.lower():
            markers.append(phrase)
    sig = "|".join(sorted(markers)) if markers else "generic"
    structure_key = hashlib.md5(sig.encode()).hexdigest()[:12]

    return (utility_name, structure_key)


def get_patterns(
    utility_name: str, structure_key: str, status: str = "active"
) -> list[Pattern]:
    """
    Fetch applicable patterns with fallback chain:
    1. exact (utility_name, structure_key)
    2. utility fallback (utility_name, *)
    3. generic (*, *)
    Returns patterns ordered by priority desc, then id asc.
    """
    conn = _get_connection()
    table = _get_table_name()
    patterns: list[Pattern] = []
    seen_ids: set[int] = set()

    for uname, skey in [
        (utility_name, structure_key),
        (utility_name, "*"),
        ("*", "*"),
    ]:
        try:
            rows = conn.execute(
                f"""
                SELECT id, field, regex, capture_group, category,
                       utility_name, structure_key, priority, created_by, status
                FROM [{table}]
                WHERE utility_name = ? AND structure_key = ? AND status = ?
                ORDER BY priority DESC, id ASC
                """,
                (uname, skey, status),
            ).fetchall()
            for row in rows:
                if row["id"] not in seen_ids:
                    seen_ids.add(row["id"])
                    patterns.append(
                        Pattern(
                            id=row["id"],
                            field=row["field"],
                            regex=row["regex"],
                            capture_group=row["capture_group"] or 1,
                            category=row["category"],
                            utility_name=row["utility_name"],
                            structure_key=row["structure_key"],
                            priority=row["priority"] or 0,
                            created_by=row["created_by"] or "migration",
                            status=row["status"] or "active",
                        )
                    )
        except sqlite3.OperationalError:
            pass

    conn.close()
    return patterns


def add_pattern(
    field: str,
    regex: str,
    category: str,
    *,
    capture_group: int = 1,
    utility_name: str = "*",
    structure_key: str = "*",
    priority: int = 0,
    created_by: str = "manual",
) -> Pattern | None:
    """
    Add a pattern. Validates regex before insert.
    Returns the Pattern or None if regex invalid.
    """
    if not _validate_regex(regex):
        return None
    conn = _get_connection()
    table = _get_table_name()
    try:
        init_store()
        cursor = conn.execute(
            f"""
            INSERT INTO [{table}]
            (field, regex, capture_group, category, utility_name, structure_key, priority, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
            """,
            (field, regex, capture_group, category, utility_name, structure_key, priority, created_by),
        )
        conn.commit()
        row_id = cursor.lastrowid
        row = conn.execute(
            f"SELECT id, field, regex, capture_group, category, utility_name, structure_key, priority, created_by, status FROM [{table}] WHERE id = ?",
            (row_id,),
        ).fetchone()
        if row:
            return Pattern(
                id=row["id"],
                field=row["field"],
                regex=row["regex"],
                capture_group=row["capture_group"] or 1,
                category=row["category"],
                utility_name=row["utility_name"],
                structure_key=row["structure_key"],
                priority=row["priority"] or 0,
                created_by=row["created_by"] or "manual",
                status=row["status"] or "active",
            )
    finally:
        conn.close()
    return None


def batch_add_patterns(
    patterns: list[dict[str, Any]], created_by: str = "migration"
) -> tuple[int, int]:
    """
    Add multiple patterns. Validates each regex.
    Returns (added_count, skipped_invalid_count).
    """
    added = 0
    skipped = 0
    conn = _get_connection()
    table = _get_table_name()
    try:
        init_store()
        for p in patterns:
            regex = p.get("regex", "")
            if not _validate_regex(regex):
                skipped += 1
                continue
            conn.execute(
                f"""
                INSERT INTO [{table}]
                (field, regex, capture_group, category, utility_name, structure_key, priority, created_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
                """,
                (
                    p.get("field", ""),
                    regex,
                    p.get("capture_group", 1),
                    p.get("category", "metadata"),
                    p.get("utility_name", "*"),
                    p.get("structure_key", "*"),
                    p.get("priority", 0),
                    created_by,
                ),
            )
            added += 1
        conn.commit()
    finally:
        conn.close()
    return (added, skipped)
