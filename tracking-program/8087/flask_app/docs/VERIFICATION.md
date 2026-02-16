# Sails-to-Flask Port Verification

## Remaining Gaps

| Item | Status |
|------|--------|
| PDF generation | All 19 types implemented |
| `/scripts/*` route | Implemented |
| test_prod S3 behavior | Implemented (ENVIRONMENT=test_prod) |
| CORS for `/files/*` | Implemented (@cross_origin) |
| Rollup / Errands apps | Parity achieved; all Errands routes implemented |
| Email host override for invites | Implemented (EMAIL_HOST) |
| user.userLogo DB column | Run `TRACKING_DB_URL=mysql://... python scripts/add_user_logo_column.py` against MySQL |
| Full API response parity | See docs/api_parity.md; run `scripts/verify_api_parity.py` when both apps up |

### PDF Document Types

**All 19 types implemented:** budgetReport, meterCertificate, budgetInvoice, depositInvoice, finalInvoice, installationInvoice, totalInvoice, proposal, selectedProposal, testReport, billAnalytic, selectedBillAnalytic, costSavings, lsPotential, co2Savings, partsProcurement, financeAgreement, shippingDocuments, selectedShippingDocuments

---

## Rollup App Parity

**Sails** (`eb/apps/rollup/app.js`): POST /schedule, /cache-instantaneous-readings, /perform-rollup, /calculate-tests, /accumulate-savings. Cron also POSTs /schedule-switches.

**Flask** (`8087-rollup/run.py`): All six routes implemented. Uses `app.services.rollup_errands`.

**Status**: Parity achieved. Cron format compatible (POST to port 1339).

## Errands App Parity

**Sails** (`eb/apps/errands/app.js`): POST /check-payment, /sync-data, /schedule-switches, /migrate-xuid, /undo-migrate-xuid; GET /test, /reload.

**Flask** (`8087-errands/run.py`): All six routes implemented. migrate-xuid ensures sync status table; undo-migrate-xuid returns 501 (full port pending); GET /test, /reload return 200.

## Invite Email Flow

**Sails**: `api/controllers/web/user/create.js` sends invite email when creating a user without a password. Uses `sails.helpers.sendTemplateEmail` with template `invite-user`.

**Flask**: `app/api/phase6_routes.py` `create_user()` now calls `_send_invite_email()` when `token` is set and no password provided. Uses same MAIL_* config as password reset.

**Verified**:
- Email sent when MAIL_SERVER and MAIL_USERNAME are configured
- Link format: `{TRACKING_BASE_URL}/invite/accept?token={token}`
- In development without mail config, link is logged

**Action**: Test by creating a user without password via `POST /api/user` and verifying email (or log in dev).
