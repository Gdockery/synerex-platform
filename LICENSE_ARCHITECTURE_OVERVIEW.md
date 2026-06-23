# License Service Architecture – Roles & Databases

## 1. Database Layout (One DB per Service)

```
┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
│   LICENSE SERVICE DB     │  │      EMV PROGRAM DB      │  │   TRACKING PROGRAM DB    │
│   (mysql / licensing)    │  │   (mysql-emv / emv)      │  │ (mysql-tracking/tracking)│
├──────────────────────────┤  ├──────────────────────────┤  ├──────────────────────────┤
│ organizations            │  │ projects                 │  │ user (User model)        │
│ users                    │  │ feeders_data              │  │ client                   │
│ program_authorizations   │  │ transformers_data         │  │ project                  │
│ licenses                 │  │ csv_fingerprints          │  │ project_users            │
│ api_keys                 │  │ pe_certifications        │  │ meterdata                │
│ billing_orders           │  │ organizations             │  │ meterdataaggregate       │
│ payments                 │  │ user_sessions            │  │ reportdata               │
│ webhooks                 │  │                          │  │ client.org_id            │
│ audit_events             │  │                          │  │ project.org_id           │
│ seat_assignments         │  │                          │  │ (org_id links to License)│
│ usage_events             │  │                          │  │                          │
└────────────┬─────────────┘  └────────────┬─────────────┘  └────────────┬─────────────┘
             │   org_id (central registry) │   org_id (projects filter)  │   org_id (client/project)
             └────────────────────────────┴─────────────────────────────┴─────────────────────────────
```

| Service | DB Engine | DB Name | Purpose |
|---------|-----------|---------|---------|
| License Service | MySQL | licensing | Orgs, licenses, auth, billing |
| EMV Program | MySQL | emv | Projects, feeders, PE certs, sessions |
| ECBS Intelligence Platform | MySQL | tracking | Users, clients, projects, meters |

**org_id** is the shared identifier across all three. License Service owns the org registry; EMV and Tracking use org_id for multi-tenancy and license checks.

---

## 2. Roles

### 2.1 License Service Roles

**Authentication Actors**

| Actor | Description |
|-------|-------------|
| Admin | Session-based (admin_logged_in). Credentials: ADMIN_USERNAME / ADMIN_PASSWORD. Full access: orgs, licenses, PE approvals, billing, server restart. |
| API Key | X-API-Key header. Scopes: orgs, licenses, authorizations. Used by: Tracking (ensure_org), EMV (license check). |
| Client User | bcrypt login → session + JWT. User belongs to Organization. Used for: /auth/api/login, MyAccount, SSO to programs. |

**Org Types (Organization.org_type)**

| Type | Description |
|------|-------------|
| oem | OEM / manufacturer. EMV templates (oem_engineer). |
| customer | End customer. EMV or Tracking templates. |
| pe | Licensed Professional Engineer. Synced to EMV pe_certifications on approve. |

**License Roles (from template)**

| Program | Roles |
|---------|-------|
| EMV templates | oem_engineer |
| Tracking templates | customer_admin, customer_viewer, oem_engineer, investor, utility, regulator, admin, synerex_admin |

### 2.2 EMV Program

| Aspect | Details |
|--------|---------|
| User model | No local User table. |
| Auth | Session token from Access Gateway (JWT with org_id, license_id, roles). |
| Sessions | user_sessions (user_id, org_id, session_token). |
| org_id | Filters projects; comes from session/JWT. |

### 2.3 ECBS Intelligence Platform – User.role (integer)

| Role | Name | Description |
|------|------|-------------|
| 1 | Client User | Limited project access |
| 2 | Client Admin | Client-level admin |
| 3 | Client Manager | Client-level manager |
| 4 | Synerex User | Internal user |
| 7 | Account Manager | Account management |
| 8 | Synerex Admin | Synerex admin – all projects, admin UI. SSO: admin_sso_email + role=8 |

---

## 2.4 OEM → Client → Project Hierarchy

```
OEM Admin (role 9)
│
├── Client Organization 1 (org_id: CUSTOMER-A, sponsor_org_id: OEM-ACME)
│   ├── Client Admin (role 2) – manages this org
│   ├── Project / Location 1
│   ├── Project / Location 2
│   └── Project / Location 3
│
├── Client Organization 2 (org_id: CUSTOMER-B, sponsor_org_id: OEM-ACME)
│   ├── Client Admin (role 2)
│   └── Project / Location 1
│
└── ...
```

- **OEM Admin** creates multiple **Client organizations** (each with its own `org_id` via License `ensure_org`).
- Each client has `sponsor_org_id` = OEM org when created by OEM.
- **Client Admin** manages one client org and can create multiple projects within it.
- Projects inherit `org_id` from their client.

---

## 3. Role Flow

```
Admin (session) → Create orgs, licenses, API keys | Approve PE, Sync to EMV | Billing, Restart
Org (org_type)  → oem: EMV/oem_engineer | customer: EMV or Tracking | pe: PE registration → pe_certifications
License roles   → EMV: oem_engineer | Tracking: customer_admin/viewer | Downloads: allowed_roles
```

---

## 4. Database Relationships via org_id

```
LICENSE SERVICE (organizations.org_id) ←→ EMV (projects filtered by org_id) ←→ TRACKING (client.org_id, project.org_id)
GET /api/licenses/check?org_id=X&program_id=emv|tracking | ensure_org() creates org in License if needed
```

---

## 5. PE Sync (License → EMV)

```
Admin approves PE → sync_pe_to_emv(org) → POST {emv_program_url}/api/pe/register
→ EMV DB: pe_certifications INSERT/UPDATE by (license_number, state)
```

---

## 6. Summary Table

| Aspect | License Service | EMV Program | ECBS Intelligence Platform |
|--------|-----------------|--------------|-------------------|
| DB | licensing | emv | tracking |
| User store | users | user_sessions | user |
| Org link | organizations.org_id | org_id in session/JWT | client.org_id, project.org_id |
| Roles | org_type, license roles | License payload roles | User.role (1–8) |
| Admin | Session (ADMIN_*) | N/A | User.role=8 + admin_sso_email |
| License check | Source of truth | GET /api/licenses/check | GET /api/licenses/check |

---

## Regenerate HTML

```bash
python3 scripts/gen_license_arch_html.py
```
