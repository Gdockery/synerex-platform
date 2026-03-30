# Synerex Platform — Admin User Accounts

> **Internal use only. Do not commit or distribute outside the team.**
> These credentials are for the development/staging environment and must be rotated before production.

---

## 1. License Service (Synerex Admin Panel)

| Field         | Value                                   |
|---------------|-----------------------------------------|
| **URL**       | `http://<host>:8080/license/admin/login` |
| **Username**  | `admin`                                 |
| **Password**  | `admin123`                              |
| **Role**      | Super Admin (full platform control)     |
| **Set via**   | `.env` → `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `license-service/services/license-service/.env` |

**Notes:**
- This is the master Synerex Admin login used to manage organizations, OEM approvals, API keys, PE registrations, software licenses, and authorizations.
- Logging in here also grants SSO access to the Tracking and EMV program admin views.

---

## 2. Tracking Program (Synerex Administrator)

| Field         | Value                        |
|---------------|------------------------------|
| **URL**       | `http://<host>:8080/tracking/login` |
| **Email**     | `admin@synerex.local`        |
| **Password**  | `admin123`                   |
| **Role**      | 8 — Synerex Administrator   |
| **Name**      | Synerex Admin                |
| **DB Table**  | `tracking.user` (id = 8)    |

**Notes:**
- Seeded automatically on first startup via `db_migrations.py → ensure_synerex_admin_user()`.
- In normal operations, Synerex Admin accesses the Tracking program through SSO from the License Service admin panel (not by logging in directly to `/tracking/login`).
- The `/tracking/#/synerex-administrator/` routes are visible only to role 8 and role 9 users.

---

## 3. EMV Program (Engineering Analysis Tool)

| Field         | Value                                       |
|---------------|---------------------------------------------|
| **URL**       | `http://<host>:8080/emv/login`              |
| **Username**  | `admin`                                     |
| **Password**  | `admin123`                                  |
| **Email**     | `admin@synerex.com`                         |
| **Role**      | `administrator`                             |
| **Org**       | Synerex (Admin) — select from dropdown on login |
| **DB Table**  | `emv.users` (id = 4)                        |

**Notes:**
- On first login, select **Organization: "Synerex (Admin)"**, then enter username `admin` and password `admin123`.
- Default password is set by `EMV_DEFAULT_ADMIN_PASSWORD` env var (falls back to `admin123`).
- The EMV program also has a secondary engineer user:

| Field         | Value                      |
|---------------|----------------------------|
| **Username**  | `engineer`                 |
| **Email**     | `jane.engineer@synerex.com` |
| **Password**  | `engineer123` (default)    |
| **Role**      | `engineer`                 |

---

## Summary Table

| Program          | Login URL                                     | Username / Email         | Password     | Role                   |
|------------------|-----------------------------------------------|--------------------------|--------------|------------------------|
| License Service  | `/license/admin/login`                        | `admin`                  | `admin123`   | Super Admin            |
| Tracking Program | `/tracking/login`                             | `admin@synerex.local`    | `admin123`   | Synerex Administrator  |
| EMV Program      | `/emv/login` (Org: Synerex Admin)             | `admin`                  | `admin123`   | Administrator          |
| EMV Engineer     | `/emv/login` (Org: Synerex Admin)             | `engineer`               | `engineer123`| Engineer               |

---

## Credential Storage Locations

| Program         | File                                                                          |
|-----------------|-------------------------------------------------------------------------------|
| License Service | `license-service/services/license-service/.env`                               |
| Tracking        | `tracking-program/8087/flask_app/app/db_migrations.py` (seeded at startup)   |
| EMV             | `emv-program/8082/main_hardened_ready_refactored.py` + `EMV_DEFAULT_ADMIN_PASSWORD` env var |

---

*Last updated: 2026-03-12*
