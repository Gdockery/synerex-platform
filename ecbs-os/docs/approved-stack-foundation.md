# Approved Stack Foundation Notes

## Source of Truth

The `ECBS Software Development Project` folder is authoritative for this implementation. Current screenshots, Appendix D navigation, the screenshot compiler engine, and the master traceability materials drive screen implementation.

## Database Decision

The implementation target is MySQL 8.x. EF Core is used through the Pomelo MySQL provider from the Infrastructure layer.

## Semantic Chain

The foundation models the required chain as:

`TENANT/CLIENT -> PROJECT as site/building record -> DEPLOYMENT -> DEVICE -> DATA -> REPORTS`

The current database may represent site fields through project records. The new code keeps `Project` as the database-facing aggregate and includes site/building fields on that record.

## First Backend Baseline

The initial migration creates:

- `tenants`
- `clients`
- `projects`
- `deployments`
- `devices`
- `telemetry_intervals`
- `report_runs`

Devices include `IsMain` and `LastCommunicatedAtUtc` from the start so main PQM selection and device health can be implemented from real source fields.

## First Frontend Baseline

The Next.js app is only a foundation shell. Production screens should be implemented from the screenshot library and documentation, not copied from legacy Angular markup.
