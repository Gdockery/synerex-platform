# Per-Org Database (Consistent with EMV)

Each organization (`org_id`) gets its own database file for full isolation, matching the EMV program architecture.

## Enable

1. **SQLite mode** (no MySQL): Leave `TRACKING_DB_URL` unset.
2. Set `TRACKING_USE_PER_ORG_DB=true`.

When enabled, each org uses: `{TRACKING_RESULTS_DIR}/org_{org_id}/tracking.db`  
Default `TRACKING_RESULTS_DIR` is `flask_app/tracking_data`.

## Bootstrap

```bash
# Initialize the default org's database (creates tables)
TRACKING_USE_PER_ORG_DB=true flask org-db-init
```

## How It Works

- **Request context**: `before_request` sets `g.org_id` and `g.org_db_session` from session (or `X-Org-Id` header, or form `org_id`).
- **Session selection**: Use `get_session()` from `app.db.request_session` instead of `db.session`.
- **Model queries**: Use `get_session().query(Model)` instead of `Model.query`.
- **Login / SSO**: Auth routes use org-scoped session. For local login without org, `DEFAULT_ORG_ID` ("default") is used.

## MySQL

When `TRACKING_DB_URL` is set (MySQL), per-org mode is disabled. Shared database with `org_id` column filtering is used. MySQL per-org (database per tenant) can be added in a follow-up.

## Migration Status

- **Done**: auth_routes, web_routes (projects, clients, _serve_spa, _project_to_dict), app __init__ (lastActiveAt, teardown), org_db module, config, CLI.
- **Remaining**: web_routes (secure PDF, account, reset-password), device_routes, phase6–11, socket_events, rollup_errands, alert_service, db_migrations, etc. These still use `db.session` / `Model.query`. When per-org is enabled, those routes will hit the default DB. Update them to use `get_session()` for full per-org support.
