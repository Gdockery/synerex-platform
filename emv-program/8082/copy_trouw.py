import sqlite3
import json
from pathlib import Path

results_dir = Path("emv-program/8082/results")
src_db = results_dir / "org_admin" / "app.db"
dst_db = results_dir / "app.db"

print("Copying Trouw-Lethbridge from org_admin...")
src_conn = sqlite3.connect(str(src_db))
dst_conn = sqlite3.connect(str(dst_db))
src_cursor = src_conn.cursor()
dst_cursor = dst_conn.cursor()

src_cursor.execute("SELECT name, data FROM projects WHERE name = ?", ("Trouw-Lethbridge",))
proj = src_cursor.fetchone()
print(f"Source: {len(proj[1])} bytes")

dst_cursor.execute("DELETE FROM projects WHERE name = ?", ("Trouw-Lethbridge",))
dst_cursor.execute("INSERT INTO projects (name, description, data, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))", (proj[0], "", proj[1]))
dst_conn.commit()
print(f"Copied: ID={dst_cursor.lastrowid}")

data = json.loads(proj[1])
payload = json.loads(data.get("payload", "{}"))
print(f"Fields: {len(payload)}")

src_conn.close()
dst_conn.close()
