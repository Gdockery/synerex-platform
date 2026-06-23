# Migration Audit

Comprehensive audit of the ECBS Intelligence Platform migration to Flask (8087-flask).  
**Audit date:** February 2025

---

## Executive Summary

| Category | Status | Notes |
|----------|--------|------|
| **API Routes** | ~95% ported | Most critical endpoints implemented; a few minor gaps |
| **Models** | Complete | All Sails models have Flask/SQLAlchemy equivalents |
| **Auth** | Complete | Login, logout, SSO, forgot/reset password |
| **PDF Generation** | Partial | 19 types supported; several use simplified layouts vs full Sails |
| **DataSync** | Complete | Export, sync, migrate-xuid, undo-migrate-xuid |
| **Rollup/Errands** | Complete | All rollup tasks and errands ported |
| **Sockets** | Complete | Project ticker rooms, join/leave |
| **Device Processing** | External | MQTT/device-processor is separate Node app; not part of Flask |
| **Utilities** | Partial | Electric bill PDF parser/OCR not ported |

---

## 1. API Routes

### 1.1 Fully Ported ✅

| Sails Route | Flask Module | Notes |
|-------------|--------------|-------|
| `GET/POST /login` | auth_routes | |
| `GET /logout` | auth_routes | |
| `POST /api/auth/verify-jwt` | auth_routes | Via license service |
| `GET /sso` | auth_routes | SSO login |
| `GET /forgot-password` | auth_routes | |
| `POST /reset-password-email` | auth_routes | |
| `GET/POST /reset-password` | auth_routes | |
| `GET /api/account` | web_routes | |
| `PUT /api/account` | web_routes | |
| `POST /api/account` | web_routes | accept-invite |
| `POST /api/account/:user/upload-logo` | web_routes | |
| `GET /api/project` | web_routes | |
| `GET/POST/PUT/DELETE /api/project/:id` | web_routes | |
| `GET /api/client` | web_routes | |
| `GET/POST/PUT/DELETE /api/client/:id` | web_routes | |
| `POST /api/client/:id/upload-logo` | web_routes | |
| `GET /api/whitelabel/brand-name` | web_routes | |
| `GET /api/meter`, `/:id`, POST/PUT/DELETE | device_routes | |
| `GET /api/meter/data` | device_routes | |
| `GET /api/meter/data/export` | device_routes | |
| `GET /api/meter/period` | device_routes | |
| `GET /api/meter/daily` | device_routes | |
| `GET /api/meter/monthly` | device_routes | |
| `GET /api/meter/quality` | phase8_routes | |
| `GET /api/meter/quality-chart` | phase8_routes | |
| `GET /api/gateway` (CRUD) | device_routes | |
| `GET /api/repeater` (CRUD) | device_routes | |
| `GET /api/switch` (CRUD) | device_routes | |
| `GET /api/meter/alert` (CRUD, events) | phase6_routes | |
| `GET /api/repeater/alert` (CRUD, events) | phase6_routes | |
| `GET /api/switch/alert` (CRUD, events) | phase6_routes | |
| `GET/POST/DELETE /api/meter/csv/*` | phase6_routes | |
| `GET /api/test` (list, create, delete) | phase6_routes | |
| `GET /api/user` (CRUD) | phase6_routes | |
| Savings report, budget, electric bill, equipment | phase7_routes | |
| `GET /api/project/ticker` | phase8_routes | |
| `GET /api/project/close-ticker-sockets` | phase8_routes | |
| `PUT /api/rollup/*` | phase10_routes | |
| Switch schedules, events, test reports | phase11_routes | |
| `PUT /api/project/calculate-*` | phase7_routes | |
| `GET /api/switch/get-savings` | phase11_routes | |
| `GET /api/switch/equipment/*` | phase7, phase11 | |
| `GET /api/datasync/:table/*` | phase9_routes | |
| `PUT /api/synerex` | phase9_routes | |
| `POST /api/maintenance/*` | phase9_routes | |
| `GET /api/dev/:command` | phase9_routes | |
| `/api/payment/:action` | phase9_routes | |
| `GET /secure/view` | web_routes | PDF download |
| `GET /invite/accept` | web_routes | |
| `GET /faq`, `/terms`, `/agreement` | web_routes | |
| `GET /files/*` | web_routes | Storage serve |
| `POST /assets/images/company_logo` | web_routes | |

### 1.2 Missing or Different ⚠️

| Sails | Status | Notes |
|-------|--------|------|
| `POST /api/switch/command` | **Missing** | Angular `equipments.service.sendSwitchCommand()` POSTs here; Sails routes also don't list it – may be handled by `POST /api/switch/event` (schedule-event) instead. Verify Angular usage. |
| `web/project/analyze-electric-bill` | **Not in routes** | Sails controller exists; uses PDF form extraction, pdf-parse, OCR. Not exposed in `routes.js`. Angular uses `PUT electric-bill-analysis` (manual entry) – analyze endpoint may be legacy or unused. |
| `web/user/list-users-in-project` | **Not in routes** | Controller exists; not in Sails routes. Likely internal/legacy. |
| `web/ticker` | **Different** | Sails has `web/ticker.js`; Flask uses `phase8_routes` `/api/project/ticker`. Verify behavior matches. |

### 1.3 Route Path Differences

| Sails | Flask | Notes |
|-------|-------|------|
| `POST /api/account/:user/upload-logo` | `POST /api/account/<uid>/upload-logo` | Same semantics |
| `DELETE /api/project/delete-file/:fileName/:fileId` | `DELETE /api/project/delete-file/<name>/<id>` | Same |
| `POST /api/meter/csv/:id/create` | `POST /api/meter/csv/<id>/create` | Sails also has `:project` variant |

---

## 2. PDF Generation

### 2.1 Ported Generators (Full Layout)

- budgetReport
- meterCertificate
- budgetInvoice
- depositInvoice, finalInvoice, installationInvoice, totalInvoice
- proposal, selectedProposal
- testReport
- financeAgreement (simplified in Flask)

### 2.2 Simplified (Summary-Style) in Flask

These use `simple_document.generate_summary()` instead of full Sails-style layouts:

| Type | Sails Generator | Flask |
|------|-----------------|-------|
| billAnalytic, selectedBillAnalytic | bill-analytic.js | simple_summary |
| costSavings | monthly-energy-savings.js | simple_summary |
| lsPotential | ls-potential.js | simple_summary |
| co2Savings | co2.js | simple_summary |
| partsProcurement | parts-procurement.js | simple_summary |
| shippingDocuments, selectedShippingDocuments | shipping-documents.js | simple_summary |
| financeAgreement | finance-agreement.js | simple_summary |

**Action:** Port full Sails PDF generators for the above to preserve original layouts.

### 2.3 Sails PDF Utilities Not Ported

- `api/helpers/pdf/bill-analytic-data-mapper.js` – partial in `data_mappers.py`
- `api/helpers/pdf/*-data-mapper.js` – cost-savings, co2, parts-procurement, shipping-documents data mappers
- `api/services/utilities/pdf-ocr.js` – OCR for scanned bills
- `api/services/utilities/pdf-form-extractor.js` – AcroForm extraction
- `api/services/utilities/pdfjs-text-extractor.js` – pdf.js text extraction
- `api/services/utilities/electric-bill-parser.js` – text parsing for bill data

---

## 3. Auth & Session

| Feature | Status |
|---------|--------|
| Login (email/password) | ✅ |
| Logout | ✅ |
| Session (Flask-Login) | ✅ |
| SSO (JWT from License Service) | ✅ |
| Forgot password (email) | ✅ |
| Reset password (token) | ✅ |
| Invite accept | ✅ |
| JWT verify (Angular API auth) | ✅ |
| License check policy | ✅ via `license_required` decorator |

---

## 4. Services

### 4.1 Ported ✅

| Sails Service | Flask Module |
|---------------|--------------|
| DataSyncService | datasync_service.py, datasync_sync.py, datasync_migration.py |
| StorageService | storage_service.py |
| AuthorizenetService | authorizenet_service.py |
| IotCommand | iot_command_service.py |
| MaintenanceService | maintenance_service.py |
| License (verify JWT) | license_service.py |
| Device (send commands) | device_service.py |
| PDF (generate) | pdf_service.py + generators |
| Rollup helpers | rollup_errands.py, rollup_utils.py |
| Bill analytic calculations | bill_analytic_calculations.py |
| Calculate savings | calculate_savings_service.py |
| Test calculation | test_calculation_service.py |
| Aggregate data | aggregate_data_service.py |

### 4.2 Not Ported / External ❌

| Sails | Reason |
|-------|--------|
| FileListDiffService | Unknown usage – check if needed |
| electric-bill-parser | Used by analyze-electric-bill (not in routes) |
| pdf-ocr, pdf-form-extractor, pdfjs-text-extractor | PDF parsing for analyze-electric-bill |
| memcache | Caching – Flask may use different approach |
| equipment-calculations | Check if in calculate_savings_service |
| savings-report-calculations | Check if in calculate_savings_service |
| selected-bill-analytic-calculations | Check if in bill_analytic_calculations |
| Device processor (MQTT) | Separate `eb/apps/device-processor/` – Node.js, not Flask |

---

## 5. Helpers

### 5.1 Device Helpers (MQTT/Device Processing)

These run in `eb/apps/device-processor/` and `device-sim` – separate Node apps:

- process-status, process-beacon, process-gateway-flare
- process-meter-data, process-sensor-data, process-equipment-data
- process-software-ack, process-control-ack
- send-gateway-command, send-switch-command
- cancel-switch-schedule, cancel-gateway-schedule

**Flask:** `device_service.py` has `send_switch_command`, `cancel_switch_schedule` – used when creating/canceling switch commands. The MQTT ingestion runs in Node.

### 5.2 Alert Helpers

- check-for-meter-alert-conditions
- check-for-repeater-alert-conditions
- check-for-switch-alert-conditions

**Status:** Sails runs these from `alerts/schedule-tasks.js`. Flask rollup has `run_schedule_tasks` but alert condition checks may differ. Verify cron runs alert tasks.

### 5.3 Other Helpers

- ensure-report-data – project helper
- SES send-email – Flask uses smtplib for reset-password
- S3 upload-stream, build-download-url – not obviously used in Flask

---

## 6. Socket Events

| Sails | Flask |
|-------|-------|
| join_project (project room) | ✅ socket_events.handle_join_project |
| leave_project | ✅ socket_events.handle_leave_project |
| project (ticker broadcast) | ✅ emit_project_ticker |
| Room naming: project_{id} | ✅ _project_room_name |

---

## 7. Rollup & Errands

### 7.1 Rollup App (1339)

| Endpoint | Sails | Flask |
|----------|-------|-------|
| POST /schedule | rollup/schedule-tasks | ✅ |
| POST /cache-instantaneous-readings | rollup/cache-instantaneous-readings | ✅ |
| POST /perform-rollup | rollup/perform-rollup | ✅ |
| POST /calculate-tests | rollup/calculate-tests | ✅ |
| POST /accumulate-savings | rollup/accumulate-savings | ✅ |
| POST /schedule-switches | schedule/schedule-switches | ✅ |
| POST /generate-automatic-monthly-reports | Manual trigger in Flask main app | Via phase10_routes |

### 7.2 Errands App (1340)

| Endpoint | Sails | Flask |
|----------|-------|-------|
| POST /check-payment | errands/check-payment | ✅ |
| POST /sync-data | errands/sync-data | ✅ |
| POST /schedule-switches | errands (or rollup) | ✅ |
| POST /migrate-xuid | errands/migrate-xuid | ✅ Full doMigrate |
| POST /undo-migrate-xuid | errands/undo-migrate-xuid | ✅ Full undoMigrate |
| GET /test | errands/test (recreate delete triggers) | ✅ |
| GET /reload | errands/reload | ✅ (no-op for Flask) |

---

## 8. Models

All Sails models have Flask equivalents:

- Client, User, Project, project_user
- Meter, Gateway, Repeater, Switch
- MeterData, MeterDataAggregate, PerMeterDataAggregate
- MeterAlert, MeterAlertGroup, MeterAlertEvent (same for repeater, switch)
- MeterCsv, Schedule, SwitchCommand
- Test, ReportData, SavingsReport
- File, Synerex, PiBoard
- ServicePlan, GatewayCommand

---

## 9. Views / Templates

| Sails (EJS) | Flask |
|-------------|-------|
| login-page.ejs | auth/login.html |
| forgot-password-page.ejs | auth/forgot-password.html |
| reset-password-page.ejs | auth/reset-password.html |
| accept-invite.ejs | invite_accept (redirect or template) |
| terms.ejs | terms_page |
| faq.ejs | faq_page |
| agreement.ejs | agreement_page |
| app.ejs (SPA shell) | Serves from 8087/.tmp/public or assets |
| 404, 500 | Flask error handlers |
| Email templates (reset-password, invite, alerts) | Reset uses simple HTML; other emails may differ |

---

## 10. Configuration

| Sails Config | Flask |
|--------------|-------|
| datastores | SQLALCHEMY_DATABASE_URI |
| models | SQLAlchemy models |
| policies | license_required, login_required |
| bootstrap | No equivalent; DB migrations manual |
| storage | STORAGE_LOCAL_PATH |
| whitelabel | WHITELABEL_BASE_PATH, WHITELABEL_DOMAIN_MAPPINGS |
| datasync | DATASYNC_MASTER, DATASYNC_SLAVES |
| S3 | S3_BUCKET_NAME, etc. |
| constants (USER_ROLES, etc.) | config.py or inline |

---

## 11. Missing / To Verify

### High Priority

1. **PDF full layouts** – Use PDF_BRIDGE_PATH (8087/scripts/pdf-bridge.js) when set; bridge invokes Node generators for billAnalytic, costSavings, lsPotential, co2Savings, partsProcurement, shippingDocuments, financeAgreement. Requires full data mappers for costSavings etc. (cost-savings-data-mapper etc. not yet ported).
2. **POST /api/switch/command** – Confirm if Angular really uses this; if so, add route or align with schedule-event.
3. **Bootstrap / migrations** – Sails has bootstrap for dev; Flask uses manual scripts (e.g. add_user_logo_column). Consider Flask-Migrate for schema changes.

### Medium Priority

4. **Electric bill PDF analysis** – If `analyze-electric-bill` is used anywhere, port: pdf-form-extractor, pdf-ocr, electric-bill-parser.
5. ~~**Alert cron**~~ – **Fixed**: POST /check-alerts on errands (1340) checks meter/repeater/switch conditions. Add cron: `*/5 * * * * curl -X POST http://localhost:1340/check-alerts`.
6. **reportdata REFERENCES** – DataSync skips reportdata (var ref typeId:@type). Confirm sync behavior.
7. ~~**S3 static redirect**~~ – **Implemented**: Flask serve_static redirects /js, /css, /images to S3 when S3_BUCKET_NAME set, ENV=production, ENVIRONMENT!=test_prod. Set FLASK_ENV=production in prod.

### Low Priority

8. **list-users-in-project** – Only if used.
9. ~~**FileListDiffService**~~ – **Ported**: maintenance_service.py has diff_list, parse_file_list.
10. ~~**memcache**~~ – **Ported**: rollup_errands uses _rollup_cache dict.
11. ~~**selected-bill-analytic-calculations**~~ – **Ported**: selected_bill_analytic_calculations.py.
12. **Email templates** – Invite, meter-offline-alert, etc. – match Sails if needed.

---

## 12. Testing Recommendations

1. Run `scripts/verify_api_parity.py` with both apps up.
2. Compare PDF output for each document type.
3. Test SSO, forgot/reset password, invite flow.
4. Test DataSync export/import and migrate/undo-migrate.
5. Test switch schedule creation and device command delivery.
6. Compare socket ticker updates.

---

*Generated by migration audit. Update as gaps are closed.*
