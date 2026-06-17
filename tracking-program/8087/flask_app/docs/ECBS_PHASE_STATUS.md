# ECBS Operating System™ — Phase Implementation Status
**Spec reference:** ECBS Operating System v4.0 Master Requirements Specification  
**Last updated:** 2026-06-17  
**Scope:** Phases 1–13 backend API + DB schema + Angular UI where indicated

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and tested on dev |
| ⚠️ | Partial — implemented but with known gaps |
| ❌ | Explicitly omitted or not started |

---

## Phase 1 — Core Platform Foundation

**Objective:** Foundational architecture supporting all future ECBS OS modules.

### Implemented ✅
| Module | Details |
|--------|---------|
| Local authentication | Login, Logout — `auth_routes.py` |
| Password Reset | Forgot-password email + token flow — `auth_routes.py` |
| MFA (TOTP) | `pyotp`-based TOTP, `user_mfa` table — `mfa_routes.py` |
| Google OAuth | `oauth_routes.py`, `oauth_provider`/`oauth_sub` on User |
| Microsoft Entra ID | `oauth_routes.py` (Microsoft provider) |
| Role granularity | `app/helpers/roles.py` — all 13 named roles with constants, groupings (`WRITE_ROLES`, `ENGINEERING_ROLES`, `DEPLOYMENT_ROLES`), `require_roles()` decorator, `GET /api/roles` endpoint. New roles: Engineering (5), Operations (6), Read Only (13) |
| Invite / transactional email | Gmail SMTP configured in `.env.docker` (`smtp.gmail.com:587`, TLS, `support@synerexlabs.com` app password). Password-reset and invite flows use this — `auth_routes.py` |
| Multi-tenant hierarchy | Synerex → OEM → Customer → Site → Assets → Devices → Meters |
| OEM management | `oem_routes.py`, `OemBranding` model, per-OEM SMTP |
| Meter licensing | `MeterLicense` model, Active/Grace/Suspended/Expired states — `license_routes.py` |
| Audit logging | `AuditLog` model — `audit_routes.py` |
| DB migration | `flask phase1-migrate` |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| Per-route role enforcement | ✅ **Done (2026-06-16)** — `require_roles()` applied to all Phase 3/4/6/7 write routes. WRITE_ROLES on create/update, DEPLOYMENT_ROLES on field ops, ENGINEERING_ROLES on reviews/activation/baseline transitions, ADMIN_ROLES on deletes. |

---

## Phase 2 — Asset Management & Digital Twin Foundation

**Objective:** Engineering model of the electrical infrastructure.

### Implemented ✅
| Module | Details |
|--------|---------|
| Site CRUD | `site_routes.py`, `Site` model |
| Asset Framework | All spec asset types: Utility Service, Transformer, Switchgear, MCC, Panel, Feeder, Load — `asset_routes.py` |
| Asset Relationship Engine | Relationship types: `feeds`, `contains`, `connected_to`, `monitored_by`, `controlled_by` — `AssetRelationship` model |
| Digital Twin | `DigitalTwin` + `DigitalTwinVersion` (snapshot per save) — `digital_twin_routes.py` |
| Twin status workflow | `draft → field_verified → engineering_review → needs_revision → approved → locked → archived` |
| Version control | Every save creates a new `DigitalTwinVersion` with full JSON snapshot |
| DB migration | `flask phase2-migrate` |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| Digital Twin Editor UI | API only. No Angular component for visually adding/editing/connecting assets |

---

## Phase 3 — Device Management Platform

**Objective:** Manage all installed ECBS-related devices.

### Implemented ✅
| Module | Details |
|--------|---------|
| Device Registry | All spec device types: PQ Meter, APF, Gateway, Controller, Filter, Rack, Booster, CT Set — `device_registry_routes.py` |
| Device status workflow | Planned → Assigned → Installed → Commissioned → Active → Warning → Fault → Retired |
| Commissioning tests | `CommissioningTest` model with outcomes (pass/fail/needs_rework) |
| Barcode verification | `POST /api/device-registry/verify-barcode` — validates serial number or barcode string |
| Camera scanning (web) | Angular `BarcodeScanComponent` at `/#/device-registry/scan` — three-tier strategy: (1) live `getUserMedia()` + native `BarcodeDetector` API for continuous video scanning, (2) `<input type="file" accept="image/*" capture="environment">` photo capture with `BarcodeDetector` decode, (3) manual text entry. Works on desktop and mobile browsers |
| Device list UI | Angular `ListDeviceRegistryComponent` at `/#/device-registry` with real-time filter |
| DB migration | `flask phase3-migrate` |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| `BarcodeDetector` browser support | ✅ **Done (2026-06-16)** — `@zxing/browser` added and lazily imported in `barcode-scan.component.ts`. When `BarcodeDetector` is absent (Firefox), `BrowserMultiFormatReader` is used for live camera and photo decode. |
| Server-side scan-barcode | ✅ **Done (2026-06-16)** — `POST /api/device-registry/scan-barcode` implemented using `pyzbar` + `Pillow`. Returns graceful 503 until container is rebuilt with `libzbar0` (already in Dockerfile). |

---

## Phase 4 — Deployment Management System

**Objective:** Complete deployment workflows from scheduling through activation.

### Implemented ✅
| Module | Details |
|--------|---------|
| Deployment model | Full status workflow: Not Started → Scheduled → Installing → Commissioning → Awaiting Approval → Activated → On Hold — `deployment_routes.py` |
| Site Discovery | Pre-install assessment data (utility info, panel details, access notes, equipment found) — `SiteDiscovery` model |
| Engineering Review | Approve / Reject / Needs Info with reviewer notes — `EngineeringReview` model |
| All Checks Clear™ | Certification record with code, certified_by, certified_at — `SiteActivation` model |
| Deployment Device | Per-device install progress, CT details (Amp Rating, Ratio, Orientation, Phase Rotation) — `DeploymentDevice` model |
| Field entry data | JSON merge endpoint for installer field data |
| Photo uploads (web) | `POST /api/deployment/<id>/photos` — multipart file upload, stored under `STORAGE_LOCAL_PATH/deployment_photos/<id>/`. `GET /api/deployment/<id>/photos` lists metadata. `GET /api/deployment/<id>/photos/<file>` serves the file. Metadata stored in `deployment.field_entry_data["photos"]` |
| Deployment photo UI | Angular `DeploymentDetailComponent` at `/#/deployment/:id` — `<input type="file" accept="image/*" capture="environment">` opens native camera on iOS/Android; preview before upload; gallery grid of uploaded photos |
| Deployment list UI | Angular `ListDeploymentComponent` at `/#/deployment` |
| DB migration | `flask phase4-migrate` |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| Native Installer Mobile App | Spec envisions a dedicated mobile app (native iOS/Android) with offline checklist support, push notifications, and Bluetooth commissioning. The web-based photo/barcode workflow covers the core field use-case but is not a native app |
| `/deployment/new` route | Create-deployment form not yet built in Angular (backend `POST /api/deployment/` works) |

---

## Phase 5 — PQ Meter Data Collection Layer

**Objective:** Data acquisition architecture for PQ meter readings.

### Implemented ✅
| Module | Details |
|--------|---------|
| 1-minute readings | `meterdata` table, enhanced with `frequency` and `site_id` columns — `flask phase5-migrate` |
| 15-minute aggregate | `meterdataaggregate` table (pre-existing) |
| THDv (voltage THD) | `l1THDv`, `l2THDv`, `l3THDv`, `totalTHDv` columns on `meterdata` — `flask phase5b-migrate` |
| PQ channels | Full coverage: Voltage, Current, kW, kVA, kVAR, PF, THDi, THDv, Frequency per phase and total — 34 channels via `GET /api/pq-data/channels` |
| Individual harmonics | 60 columns: L1/L2/L3 current + voltage harmonics H3–H21 |
| Query routes | `/api/pq-data/readings`, `/aggregate`, `/latest`, `/summary`, `/channels` — `pq_data_routes.py` |
| Errands clone | `rollup_errands.py` cache-instantaneous clone now copies `l1THD`–`totalTHD`, `l1THDv`–`totalTHDv`, `frequency` from the last known reading. Backward-compatible: `datasync_sync._import_record()` filters by `SHOW COLUMNS` on destination — older site servers without new columns skip them silently |

### Explicitly Omitted ❌
| Item | Reason |
|------|--------|
| 15-second data tier | User instruction: "build it without the 15second tier." No `meterdata_15sec` table, no routes |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| Live write path for new columns | The errands clone forward-fills from the last reading. The original real-time ingest from meters (via the site-server errands service over MQTT/DataSync) doesn't yet populate `frequency`, `l1THDv`–`totalTHDv`. These will remain NULL until the site-server firmware or ingest pipeline is updated to send them |

---

## Phase 6 — EM&V Baseline Manager™

**Objective:** Measurement and verification foundation.

### Implemented ✅
| Module | Details |
|--------|---------|
| `baseline_master` table | Full schema: version, status, test dates, snapshot metrics, reviewer/approver/locker tracking |
| Baseline CRUD | Create, Read, Update; no DELETE (spec: historical baselines never deleted) |
| Status workflow | `draft → engineering_review → approved → locked` with guards — `baseline_routes.py` |
| Baseline versioning | Auto-increment version per project |
| `version-forward` | Creates new draft from a locked baseline for re-baselining |
| `link-analysis` | Attaches an `EmvAnalysis` record and syncs metrics (avg_kw, avg_pf, etc.) |
| `comparison` | Returns deltas between two baseline versions |
| `GET /active` | Returns the currently locked baseline for a project |
| `project.active_baseline_id` | Set automatically when a baseline is locked |
| DB migration | `flask phase6-migrate` |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| Auto-compute from meterdata | Baseline metrics (avg_kw, avg_pf, savings_pct, etc.) are manually supplied or copied from `EmvAnalysis`. No function computes them directly from raw `meterdata` for a given date range |
| Test-type span validation | `test_type` (24h/7d/30d/custom) stored but not validated against `test_end - test_start` |

---

## Phase 7 — Current Balance Intelligence™

**Objective:** Classify electrical current and generate Current Balance Index (CBI).

### Implemented ✅
| Module | Details |
|--------|---------|
| Current classifications | All 5 spec categories: Productive™, Reactive™, Harmonic™, Imbalance™, Neutral™ + Lost Capacity Current™ — `current_balance_engine.py` |
| CBI score | 0–100 with Excellent/Good/Fair/Poor rating |
| `current_balance_metrics` table | One row per 15-min bucket per meter/project with all classifications + CBI |
| 15-min bucket aggregation | `compute_buckets()` in engine |
| On-demand calculation | `POST /api/current-balance/calculate` |
| Dashboard KPIs | `GET /api/current-balance/summary` |
| Time-series | `GET /api/current-balance/timeseries` |
| Per-meter breakdown | `GET /api/current-balance/breakdown` |
| Baseline comparison | `GET /api/current-balance/baseline-compare` |
| DB migration | `flask phase7-migrate` |

### Remaining Gaps ⚠️
| Item | Detail |
|------|--------|
| Automatic calculation | CBI is computed on-demand only. No background job triggers `compute_buckets()` automatically when new meterdata arrives. To add: call engine from `rollup_errands.py` after meterdata rollup |
| Current Analysis Dashboard UI | No Angular component. API is complete |
| Digital Twin integration | Engine reads `meterdata` only — does not cross-reference Digital Twin asset graph (transformer capacity, feeder ratings) as spec §60 describes |

---

## Phases 8–13 — Not Started

| Phase | Spec Name | Status |
|-------|-----------|--------|
| 8 | Capacity Intelligence™ | ❌ Not started |
| 9 | Savings Intelligence™ | ❌ Not started |
| 10 | Utility Intelligence™ | ❌ Not started |
| 11 | Alarms & Events™ | ❌ Not started |
| 12 | Reporting Engine™ | ❌ Not started |
| 13 | Commercial Platform | ❌ Not started |
| 14 | Advanced Features (AI, Simulator) | ❌ Not started |

> **Important:** The files `phase6_routes.py`–`phase11_routes.py` in `app/api/` are **ported Sails JS routes** from the original xeco tracking system, **not** ECBS OS spec phases 6–11. They handle legacy alerts, sockets, savings reports, budget/files, etc. Do not confuse with ECBS spec phases.

---

## v1.0 Release Criteria (spec §1A)

| Requirement | Status |
|------------|--------|
| Multi-Tenant Architecture | ✅ Done |
| Role-based access (named roles) | ✅ Done — `roles.py`, `require_roles()` decorator, `/api/roles` endpoint |
| Transactional email | ✅ Done — Gmail SMTP configured |
| Site Management | ✅ Done |
| Digital Twin™ | ⚠️ API done — UI editor not built |
| Device Management + barcode | ✅ Done — web camera scanning + manual entry |
| Deployment Management + photos | ✅ Done — web photo capture; native mobile app not built |
| PQ Meter Data Collection | ⚠️ Done minus 15s tier (intentional) |
| THDv measurement | ✅ Done — `l1THDv`–`totalTHDv` columns + channels |
| EM&V Baseline Manager™ | ⚠️ API done — auto-compute from meterdata not built |
| Current Balance Intelligence™ | ⚠️ API done — UI and auto-trigger not built |
| Capacity Intelligence™ | ✅ Phase 8 done — `capacity_intelligence` table, `/api/capacity/summary|assets|trends|calculate|transformer/<id>`, `_run_ci_auto_compute` in rollup |
| Savings Intelligence™ | ✅ Phase 9 done — `savings_intelligence` table, `/api/savings/intelligence|trends|waterfall`, `/api/roi`, `/api/payback`, `_run_si_auto_compute` in rollup |
| Utility Intelligence™ | ✅ Phase 10 done — `utility_accounts`, `utility_bills`, `utility_forecast` tables, `/api/utility/accounts|bills|forecast|summary` |
| Alarms & Events™ | ✅ Phase 11 done — `alarms`, `alarm_assignments`, `events`, `notifications`, `alert_rules` tables; alarm engine; `/api/alarms/...`, `/api/events/...`, `/api/alert-rules/...`; `_run_alarm_evaluation` in rollup |
| Reporting Engine™ | ✅ Phase 12 done — `ecbs_reports`, `report_schedules`, `report_exports` tables; `report_generator.py`; `/api/reports/...`, `/api/report-schedules/...`; `_run_scheduled_reports` in rollup |
| Commercial Platform™ | ✅ Phase 13 done — `royalties` table + `oem.royalty_rate`; `royalty_engine.py`; `/api/licenses`, `/api/licensed-meters`, `/api/royalties/...`, `/api/oems/<id>/royalties`, `/api/oem/admin/dashboard|list`, `/api/oem/branding/<org_id>`; `@require_active_license` on CBI/Capacity/Savings/Utility summary endpoints |

---

## Development Plan — Two-Pass Approach

The spec contains 25 embedded UI screenshots as **design authority** (pages 18–41).
These images are not extractable from the PDF as text, so UI components cannot be built
accurately until the screenshot pages are available as images.

**Pass 1 (current):** All backend items and Angular scaffolding that does not require
pixel-accurate layout.

**Pass 2 (UI):** Once key screenshot pages (5, 8, 9, 20, 21, 24, 25 — Digital Twin
editor, Current Analysis, Deployment App, Field Entry, All Checks Clear) are available
as images, Angular components will be rebuilt to match the spec visuals.

---

## Outstanding Items (all remaining gaps summarised)

| # | Item | Phase | Priority | Status |
|---|------|-------|----------|--------|
| 1 | Apply `require_roles()` guards to individual routes | 1 | Medium | ✅ Done 2026-06-16 |
| 2 | ZXing JS library for Firefox barcode scanning | 3 | Low | ✅ Done 2026-06-16 |
| 3 | `POST /api/device-registry/scan-barcode` server-side decode | 3 | Low | ✅ Done 2026-06-16 (503 until container rebuild) |
| 4 | Angular create-deployment form (`/deployment/new`) | 4 | Medium | ⏳ UI pass — needs spec screenshots |
| 5 | Site-server firmware/ingest populates `frequency`/THDv | 5 | Medium | ❌ Out of scope — requires site firmware change |
| 6 | Baseline auto-compute from meterdata date range | 6 | High | ✅ Done 2026-06-16 (`POST /api/baseline/<id>/compute`) |
| 7 | CBI auto-trigger in rollup errand | 7 | Medium | ✅ Done 2026-06-16 (`_run_cbi_auto_compute` after rollup) |
| 8 | Current Balance Dashboard Angular component | 7 | Medium | ⏳ UI pass — needs spec screenshots |
| 9 | Digital Twin editor Angular component | 2 | Low | ⏳ UI pass — needs spec screenshots |
| 10 | Digital Twin → CBI integration (asset graph) | 7 | Low | ✅ Done 2026-06-16 (transformer kVA context in CBI buckets) |
| 11 | Phases 8–12 backend | 8–12 | Done | ✅ Complete 2026-06-16 |
| 12 | Phase 13 — Commercial Platform | 13 | Done | ✅ Complete 2026-06-17 — `royalties` table, royalty engine, license enforcement, OEM/branding APIs |
| 13 | Phase 14 — Advanced Platform | 14 | Future | ❌ Deferred — AI, predictive analytics, Digital Twin 3D (spec says "Future Roadmap") |
| 14 | Angular UI for Phases 8–13 dashboards | 8–13 | UI pass | ⏳ Pending spec screenshot delivery |
