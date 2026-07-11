# ECBS Screen Batch Checklist: Devices Inventory Scheduling

## Batch Identity

- Batch name: Devices Inventory Scheduling
- Date: 2026-07-11
- Module / route family: Devices
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 60-67.
- Blocked sibling: validation sequence 59 is invalid and remains excluded.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Device Health Detail Page | `/devices/device-health-detail-page` | `ECBS-Device Health Detail Page Screenshot.png` | Deployed / HTTP 200 |
| 2 | Device Scheduling | `/devices/switches/device-switches-device-scheduling` | `ECBS-Device-Switches-Device Scheduling Screenshot.png` | Deployed / HTTP 200 |
| 3 | Gateways | `/devices/gateways` | `ECBS-Devices-Gateways Screenshot.png` | Deployed / HTTP 200 |
| 4 | Meters | `/devices/meters` | `ECBS-Devices-Meters Screenshot.png` | Deployed / HTTP 200 |
| 5 | Repeaters | `/devices/repeaters` | `ECBS-Devices-Repeaters Screenshot.png` | Deployed / HTTP 200 |
| 6 | Scheduling Commissioning / Testing | `/devices/switches/devices-switches-device-scheduling-commissioning-testing` | `ECBS-Devices-Switches-Device Scheduling-Commissioning_Testing Screenshot.png` | Deployed / HTTP 200 |
| 7 | Scheduling Commissioning / Testing Next Step | `/devices/switches/devices-switches-device-scheduling-commissioning-testing-next-step` | `ECBS-Devices-Switches-Device Scheduling-Commissioning_Testing Screenshot-Next Step.png` | Deployed / HTTP 200 |
| 8 | Job Costing | `/devices/switches/devices-switches-job-costing` | `ECBS-Devices-Switches-Job Costing Screenshot.png` | Deployed / HTTP 200 |

## Constitution Gates

- [x] `SITE != PROJECT != DEPLOYMENT` checked.
- [x] Device screens are scoped to approved site/device context.
- [x] Invalid sequence 59 is not implemented.
- [x] No UI invented beyond approved screenshots.
- [x] Existing TSX look and feel preserved.
- [x] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `device.name` | device/gateway/meter/switch name | inventory/detail | Direct Data if rows exist | `ecbs_os.devices.name` | Wire |
| `device.kind` | type/category | inventory/detail | Direct Data if rows exist | `ecbs_os.devices.kind` | Wire |
| `device.serial_number` | serial number | inventory/detail | Direct Data if rows exist | `ecbs_os.devices.serial_number` | Wire |
| `device.last_communicated_at` | last seen | inventory/detail | Direct Data if rows exist | `ecbs_os.devices.last_communicated_at_utc` | Wire |
| `device.status` | online/offline/status | inventory/detail | Calculated from last communication when present | recent communication threshold; otherwise No Data | Wire / No Data |
| `device.health_score` | health score | cards/tables | No Data / Question | no approved device health score model | Show No Data |
| `device.firmware` | firmware version/status | tables/cards | No Data / Question | no approved firmware field/table | Show No Data |
| `device.location` | location/site/panel | tables/details | No Data / Question | no approved device location field | Show No Data |
| `telemetry.kilowatts/kva/kwh/pf` | live meter values | meter/detail/performance | Direct Data if scoped telemetry exists | latest `ecbs_os.telemetry_intervals` | Wire |
| `telemetry.voltage/current/frequency/thd` | power quality values | meter/switch/detail | No Data / Question | not present on current telemetry model | Show No Data |
| `devices.repeaters` | repeaters count/list | repeaters screen | No Data / Question | current `DeviceKind` has no Repeater kind | Show No Data |
| `devices.schedule` | schedules, modes, next run | scheduling screens | No Data / Question | no approved scheduling table/command | Show No Data |
| `devices.commissioning_tests` | commissioning/test rows | commissioning screens | No Data / Question | no approved device commissioning schema | Show No Data |
| `devices.job_costing` | cost center, kWh/cost/job | job costing screen | No Data / Question | no approved device/job costing source | Show No Data |

## API / Data Contract

- Read endpoint(s): `GET /api/v1/devices`.
- Write command endpoint(s): none in this batch.
- New DTOs: `DevicesData`, `DeviceDataRow`, `DeviceKindSummary`, `DeviceTelemetrySummary`.
- `ecbs_os` tables queried/written: read `devices`, `telemetry_intervals`; no writes.
- `tracking` tables queried: none unless a later approved adapter exists.

## Write Model Decision

Visible schedule, configure, restart, export, update firmware, commissioning, and job-costing controls exist, but this batch is read-only.

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Devices root/switches | Device Health card | `/devices/device-health-detail-page` | Route exists / HTTP 200 |
| Devices root/switches | Gateways tab | `/devices/gateways` | Route exists / HTTP 200 |
| Devices root/switches | Meters tab | `/devices/meters` | Route exists / HTTP 200 |
| Devices root/switches | Repeaters tab | `/devices/repeaters` | Route exists / HTTP 200 |
| Switches | Device Scheduling | `/devices/switches/device-switches-device-scheduling` | Route exists / HTTP 200 |
| Scheduling | Commissioning / Testing | `/devices/switches/devices-switches-device-scheduling-commissioning-testing` | Route exists / HTTP 200 |
| Commissioning / Testing | Next Step | `/devices/switches/devices-switches-device-scheduling-commissioning-testing-next-step` | Route exists / HTTP 200 |
| Switches | Job Costing | `/devices/switches/devices-switches-job-costing` | Route exists / HTTP 200 |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Repeater model | Current `DeviceKind` does not include repeater. | repeater list/count/signal strength | Define repeater entity/kind |
| Device health score | No approved health-score calculation/table. | health distribution, component health, average health | Define deterministic health model |
| Firmware model | No firmware version/status fields. | firmware status/up-to-date/update actions | Define firmware fields/table |
| Device scheduling | No schedule table/command API. | schedules, next run, device modes | Define scheduling write model |
| Commissioning tests | No approved commissioning test schema. | test rows/pass/fail/next step | Define test model |
| Job costing | No approved job/cost allocation table. | kWh/cost by job, invoices, production time | Define costing model |

## Verification Config

- Verification config path: `verification/devices-inventory-scheduling.json`
- Mutating checks required? No
- Browser click checks required? Yes, one inventory route plus one scheduling/job-costing route.

Required before deploy:

- [x] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `python3 scripts/ecbs_batch_verify.py verification/devices-inventory-scheduling.json --base-url http://100.91.109.59:8080 --api-base-url http://100.91.109.59:5090`
- [x] Browser smoke check
- [x] Dev deploy completed
- [x] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Device screens are not deployment routes. | Do not use `deploymentId=1`; use site/device-scoped Devices API. |
| `DeviceKind` lacks Repeater. | Repeaters must be explicit No Data until modeled. |
| Many device controls are write actions. | Leave controls as shell; do not implement writes. |
| Browser screenshots can be stale. | Take a fresh snapshot after navigation. |
| Manual frontend Docker run must match container port. | Next container listens on `3001`; map host `3000:3001`. |
| Proxy container resolves by Docker network name. | Connect `ecbs-os-frontend` to `synerex-platform_default` before proxy verification. |

## Checkpoint Summary

- Screens completed: 8 Devices inventory/scheduling screens are wired and deployed.
- Direct/Calculated fields wired: `ecbs_os.devices` identity/kind/serial/last-communicated status summaries and latest `ecbs_os.telemetry_intervals` kW/kVA/kWh/PF where present.
- Explicit `No Data` decisions: repeater model, device location, firmware, health score, alerts/events, uptime, IP/MAC/network data, schedule model, commissioning test model, and job-costing allocation/cost models.
- Write actions implemented: none. Schedule, configure, restart, export, update firmware, commissioning, and job-costing actions remain shell controls until write models are approved.
- Verification results: local backend build, frontend lint, frontend build, remote backend build, remote frontend Docker build, API restart, deployed route/API verifier, and browser smoke check passed.
- Dev URL(s): `http://100.91.109.59:8080/devices/gateways` plus the seven batch routes listed above.
- Remaining questions: define repeater entity/kind, device health/firmware/location models, device scheduling write model, commissioning test model, and job-costing allocation source.

