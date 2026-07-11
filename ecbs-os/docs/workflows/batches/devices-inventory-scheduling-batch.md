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
| 1 | Device Health Detail Page | `/devices/device-health-detail-page` | `ECBS-Device Health Detail Page Screenshot.png` | Pending |
| 2 | Device Scheduling | `/devices/switches/device-switches-device-scheduling` | `ECBS-Device-Switches-Device Scheduling Screenshot.png` | Pending |
| 3 | Gateways | `/devices/gateways` | `ECBS-Devices-Gateways Screenshot.png` | Pending |
| 4 | Meters | `/devices/meters` | `ECBS-Devices-Meters Screenshot.png` | Pending |
| 5 | Repeaters | `/devices/repeaters` | `ECBS-Devices-Repeaters Screenshot.png` | Pending |
| 6 | Scheduling Commissioning / Testing | `/devices/switches/devices-switches-device-scheduling-commissioning-testing` | `ECBS-Devices-Switches-Device Scheduling-Commissioning_Testing Screenshot.png` | Pending |
| 7 | Scheduling Commissioning / Testing Next Step | `/devices/switches/devices-switches-device-scheduling-commissioning-testing-next-step` | `ECBS-Devices-Switches-Device Scheduling-Commissioning_Testing Screenshot-Next Step.png` | Pending |
| 8 | Job Costing | `/devices/switches/devices-switches-job-costing` | `ECBS-Devices-Switches-Job Costing Screenshot.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Device screens are scoped to approved site/device context.
- [ ] Invalid sequence 59 is not implemented.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

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

- Read endpoint(s): planned `GET /api/v1/devices`.
- Write command endpoint(s): none in this batch.
- New DTOs: planned `DevicesData`, `DeviceDataRow`, `DeviceTelemetrySummary`.
- `ecbs_os` tables queried/written: read `devices`, `telemetry_intervals`; no writes.
- `tracking` tables queried: none unless a later approved adapter exists.

## Write Model Decision

Visible schedule, configure, restart, export, update firmware, commissioning, and job-costing controls exist, but this batch is read-only.

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Devices root/switches | Device Health card | `/devices/device-health-detail-page` | Pending |
| Devices root/switches | Gateways tab | `/devices/gateways` | Pending |
| Devices root/switches | Meters tab | `/devices/meters` | Pending |
| Devices root/switches | Repeaters tab | `/devices/repeaters` | Pending |
| Switches | Device Scheduling | `/devices/switches/device-switches-device-scheduling` | Pending |
| Scheduling | Commissioning / Testing | `/devices/switches/devices-switches-device-scheduling-commissioning-testing` | Pending |
| Commissioning / Testing | Next Step | `/devices/switches/devices-switches-device-scheduling-commissioning-testing-next-step` | Pending |
| Switches | Job Costing | `/devices/switches/devices-switches-job-costing` | Pending |

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

- Verification config path: planned `verification/devices-inventory-scheduling.json`
- Mutating checks required? No
- Browser click checks required? Yes, one inventory route plus one scheduling/job-costing route.

Required before deploy:

- [ ] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/devices-inventory-scheduling.json`
- [ ] Browser smoke check
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Device screens are not deployment routes. | Do not use `deploymentId=1`; use site/device-scoped Devices API. |
| `DeviceKind` lacks Repeater. | Repeaters must be explicit No Data until modeled. |
| Many device controls are write actions. | Leave controls as shell; do not implement writes. |
| Browser screenshots can be stale. | Take a fresh snapshot after navigation. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

