# ECBS Screen Batch Checklist: Devices Detail Job Costing

## Batch Identity

- Batch name: Devices Detail Job Costing
- Date: 2026-07-11
- Module / route family: Devices
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 68-71, 73, 75-77.
- Blocked siblings: validation sequence 72 `Firmware Detail Firmware History Page`, 74 `Meter Allocation Page`, and 78 `Switch Logs Page` are invalid blockers and are not included.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Job Costing - Payments / Invoices | `/devices/switches/devices-switches-job-costing-payments-invoices` | `ECBS-Devices-Switches-Job Costing-Payments-Invoices Screenshot.png` | Pending |
| 2 | Job Costing - Production Time | `/devices/switches/devices-switches-job-costing-production-time` | `ECBS-Devices-Switches-Job Costing Screenshot-Production_Time Screenshot.png` | Pending |
| 3 | Job Costing - Reports | `/devices/switches/devices-switches-job-costing-reports` | `ECBS-Devices-Switches-Job Costing-Reports Screenshot.png` | Pending |
| 4 | Switches | `/devices/switches/devices-switches2` | `ECBS-Devices-Switches2 Screenshot.png` | Pending |
| 5 | Gateway Detail | `/devices/gateways/detail` | `ECBS-Gateway Detail Page Screenshot.png` | Pending |
| 6 | Meter Detail | `/devices/meters/detail` | `ECBS-Meter Detail Page Screenshot.png` | Pending |
| 7 | Repeater Detail | `/devices/repeaters/detail` | `ECBS-Repeater Detail Page Screenshot.png` | Pending |
| 8 | Switch Detail | `/devices/switches/switch-detail-page` | `ECBS-Switch Detail Page Screenshot.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Device detail screens are scoped to approved site/device context.
- [ ] Invalid sequences 72, 74, and 78 are not implemented.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `device.name` | device/gateway/meter/switch name | list/detail | Direct Data if rows exist | `ecbs_os.devices.name` | Wire |
| `device.kind` | type/category | list/detail | Direct Data if rows exist | `ecbs_os.devices.kind` | Wire |
| `device.serial_number` | serial number | detail/information | Direct Data if rows exist | `ecbs_os.devices.serial_number` | Wire |
| `device.last_communicated_at` | last seen/last check | detail/list | Direct Data if populated | `ecbs_os.devices.last_communicated_at_utc` | Wire |
| `device.status` | online/offline/connected | detail/list | Calculated from last communication when present | existing Devices API status | Wire / No Data |
| `telemetry.kilowatts/kva/kwh/pf` | live values/energy/demand | meter/switch/job panels | Direct Data if scoped telemetry exists | latest `ecbs_os.telemetry_intervals` | Wire where label matches |
| `device.repeaters` | repeater detail/signal/topology | repeater detail | No Data / Question | current `DeviceKind` has no Repeater kind | Show No Data |
| `device.health_score` | health/performance/status distributions | detail panels | No Data / Question | no approved health score model | Show No Data |
| `device.firmware` | firmware/latest/update | detail/job/list | No Data / Question | no approved firmware field/table | Show No Data |
| `device.location` | location/site/panel/network | detail/list | No Data / Question | no approved device location/network mapping | Show No Data |
| `device.network_config` | IP/MAC/DNS/cellular/topology | gateway/repeater detail | No Data / Question | no approved network configuration model | Show No Data |
| `device.events` | recent events/trips/alarms/logs | detail panels | No Data / Question | no approved device event/log schema | Show No Data |
| `device.write_actions` | restart/configure/update/remove/export | action panels | No Data / Question until write model approved | shell actions only | Leave shell / No Data |
| `device.job_costing` | invoices/payments/production time/reports/costs | job costing tabs | No Data / Question | no approved job/cost allocation source | Show No Data |

## API / Data Contract

- Read endpoint(s): reuse `GET /api/v1/devices`.
- Write command endpoint(s): none in this batch.
- Existing DTOs reused: `DevicesData`, `DeviceDataRow`, `DeviceKindSummary`, `DeviceTelemetrySummary`.
- `ecbs_os` tables queried/written: read `devices`, `telemetry_intervals`; no writes.
- `tracking` tables queried: none.

## Write Model Decision

Visible job report, invoice, export, restart, configure, update firmware, remove, and log actions exist, but this batch is read-only.

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Job Costing | Payments / Invoices tab | `/devices/switches/devices-switches-job-costing-payments-invoices` | Pending |
| Job Costing | Production Time tab | `/devices/switches/devices-switches-job-costing-production-time` | Pending |
| Job Costing | Reports tab | `/devices/switches/devices-switches-job-costing-reports` | Pending |
| Devices | Switches tab | `/devices/switches/devices-switches2` | Pending |
| Gateways | Gateway row / Detail | `/devices/gateways/detail` | Pending |
| Meters | Meter row / Detail | `/devices/meters/detail` | Pending |
| Repeaters | Repeater row / Detail | `/devices/repeaters/detail` | Pending |
| Switches | Switch row / Detail | `/devices/switches/switch-detail-page` | Pending |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Job costing/payments/reports | No approved job/cost allocation table. | invoices, payments, costs, report runs | Define costing write/read model |
| Production time model | No approved production schedule/time source. | included/excluded hours, shift allocation | Define production-time source |
| Detail location/network fields | Current device model lacks location/IP/MAC/topology. | location cards, gateway/repeater topology, network config | Define device metadata model |
| Device event/log schema | No approved device event table. | recent events, trips, alarms, switch logs | Define event/log source |
| Repeater model | Current `DeviceKind` does not include repeater. | repeater detail, signal strength, throughput | Define repeater entity/kind |
| Firmware model | No approved firmware field/table. | version, latest, update actions | Define firmware model |

## Verification Config

- Verification config path: planned `verification/devices-detail-job-costing.json`
- Mutating checks required? No
- Browser click checks required? Yes, one detail route and one job-costing child route.

Required before deploy:

- [ ] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/devices-detail-job-costing.json`
- [ ] Browser smoke check
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Device detail routes are not deployment routes. | Do not use `deploymentId=1`; reuse Devices API. |
| `DeviceKind` lacks Repeater. | Repeater detail must be explicit No Data until modeled. |
| Job-costing child screens are derivative of an unmodeled source. | Propagate No Data from `device.job_costing`. |
| Manual frontend Docker run must match container port. | Next container listens on `3001`; map host `3000:3001`. |
| Proxy container resolves by Docker network name. | Connect `ecbs-os-frontend` to `synerex-platform_default` before proxy verification. |
| Browser screenshots can be stale. | Take a fresh snapshot after navigation. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

