# ECBS Screen Batch Checklist: Digital Twin And Energy Savings Core

## Batch Identity

- Batch name: Digital Twin And Energy Savings Core
- Date: 2026-07-11
- Module / route family: Enterprise / Digital Twin / Energy Dashboard
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 95-102.
- Next sibling batch begins at validation sequence 103.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Full Network Page Expanded Electrical Network View | `/enterprise/digital-twin/full-network-page-expanded-electrical-network-view` | `ECBS-Full Network Page  Expanded Electrical Network View Screenshot.png` | Pending |
| 2 | One-Line Drawing Scanner | `/enterprise/digital-twin/one-line-drawing-scanner` | `ECBS-One-Line Drawing Scanner Screenshot.png` | Pending |
| 3 | Capacity Intelligence - Annual Benefit - Financial Impact | `/enterprise/energy-dashboard/capacity-intelligence-annual-benefit-financial-impact-screen` | `ECBS_Capacity Intelligence - Annual Benefit → Financial Impact Screen.png` | Pending |
| 4 | Energy Savings Dashboard | `/enterprise/energy-dashboard` | `ECBS-Energy Savings Dashboard Screenshot.png` | Pending |
| 5 | Energy and Savings Dashboard - Alerts Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-alerts-screen` | `ECBS_Energy and Savings Dashboard -  Alerts Screen.png` | Pending |
| 6 | Energy and Savings Dashboard - Baseline Comparison Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-baseline-comparison-screen` | `ECBS_Energy and Savings Dashboard - Baseline Comparison Screen.png` | Pending |
| 7 | Energy and Savings Dashboard - Capacity Intelligence Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-capacity-intelligence-screen` | `ECBS_Energy and Savings Dashboard - Capacity Intelligence Screen.png` | Pending |
| 8 | Energy and Savings Dashboard - Capacity Recovered Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-capacity-recovered-screen` | `ECBS_Energy and Savings Dashboard - Capacity Recovered Screen.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Screens are scoped to the Ochsner site/project from tracking adapters.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `digital_twin.site_name` | site selector, expanded network context | headers/context | Direct Data | `tracking.site.name` via `getOchsnerDigitalTwinData` | Wire |
| `digital_twin.asset_identity` | expanded full-network one-line assets | full network diagram | Direct Data | `tracking.asset` | Wire where the component supports asset rows |
| `digital_twin.scanner_upload` | scan/upload/review extracted components | scanner controls | No Data / Question | no approved upload/OCR/write model | Leave shell / Show No Data where data output is implied |
| `capacity.installed/used/available/recovered` | capacity intelligence, capacity recovered, utilization | energy capacity panels/KPIs | Direct Data / Calculated | `tracking.capacity_intelligence` via `getOchsnerCapacityIntelligenceData` | Wire |
| `financial.annual_savings` | annual benefit, lifetime/current savings | energy/financial KPIs | Direct Data if latest annual value exists | `tracking.savings_intelligence.annual_savings` | Wire only latest annual benefit; time buckets remain blocked |
| `financial.deferred_capital_value` | deferred capital value, capacity value benefit | energy/financial KPIs | Direct Data | `tracking.capacity_intelligence.deferred_capital_value` | Wire |
| `carbon.co2_tons` | CO2 reduction | energy panels | Direct Data | `tracking.savings_intelligence.co2_reduction_tons` | Wire where shown |
| `meter.power_factor` | power factor, PF improvement | baseline/capacity KPIs | Direct Data if populated | current meter/current balance adapter fields | Wire where payload exposes it; otherwise No Data |
| `energy.alerts` | alerts/events, active alerts, alert trends, response SLA | alerts screen | No Data / Question | no approved energy-alert event source in current payload | Show No Data |
| `energy.baseline_comparison` | baseline vs current kWh/kW/THD/PF charts/tables | baseline screen | No Data / Question except direct current PF/capacity where separately approved | no approved baseline energy contract | Show No Data |
| `energy.savings_trends` | lifetime/month/day savings, waterfall, time-series charts | overview/financial panels | No Data / Question unless backed by approved snapshots | only latest savings row is available in current shared payload | Show No Data for trends/splits |
| `energy.write_actions` | export/share/configure/scan/upload/report actions | buttons/actions | No Data / Question until write/report models approved | shell controls only | Leave shell / No Data |

## API / Data Contract

- Read endpoint(s): existing frontend server adapters `getOchsnerDigitalTwinData()` and `getOchsnerCapacityIntelligenceData()` from tracking DB.
- Write command endpoint(s): none in this batch.
- Existing types reused: `DigitalTwinData`, `CapacityIntelligenceData`.
- `tracking` tables queried: `site`, `project`, `digital_twin`, `asset`, `asset_relationship`, `capacity_intelligence`, `savings_intelligence`, `meter`, `meterdata`.
- `ecbs_os` tables queried/written: none in this batch.

## Write Model Decision

Visible scan/upload, review/edit, export, share, configure, acknowledge, report, and alert controls exist, but this batch is read-only.

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Scanner/OCR model | No approved upload, scan, OCR, extracted component, or drawing write model. | extracted components, review/edit workflow, drawing file output | Define scanner/write model |
| Energy alert model | No approved energy-alert event/SLA table in current payload. | active alerts, severity trend, response time, priority matrix | Define alert/event model |
| Baseline energy contract | No approved baseline/current kWh/kW/THD time-series contract. | baseline comparison charts, before/after tables, savings impact | Define baseline contract |
| Savings trend/split model | Current payload exposes latest savings but not approved lifetime/month/day trend buckets or category splits. | lifetime/month/today savings, waterfall, benefit over time, driver splits | Define savings rollup contract |
| Financial investment model | No approved cost/investment basis for ROI/payback details. | ROI, payback, NPV, operational cost avoidance | Define financial model |
| Write/report actions | No approved command/write APIs. | export/share/configure/scan/report actions | Define write/report models |

## Verification Config

- Verification config path: planned `verification/digital-twin-energy-savings-core.json`
- Mutating checks required? No
- Browser click checks required? Yes, one Digital Twin route and one Energy route.

Required before deploy:

- [ ] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/digital-twin-energy-savings-core.json`
- [ ] Browser smoke check
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| The batch crosses Digital Twin and Energy Dashboard modules. | Keep shared data adapters separate and do not blend entity semantics. |
| Scanner UI is an action/write workflow. | Preserve shell UI; do not invent scanner output or upload storage. |
| Energy dashboard currently has many static derived values. | Wire latest direct values only and mark unapproved derived panels No Data. |
| These are enterprise routes, not deployment routes. | Do not use `deploymentId=1`. |
| Manual frontend Docker run must match container port. | Next container listens on `3001`; map host `3001:3001`. |
| Manual frontend Docker run must use the Synerex compose network. | Always run `ecbs-os-frontend` with `--network synerex-platform_default`; otherwise the frontend cannot resolve `mysql-tracking` and nginx/proxy access may return `502`. |

## Checkpoint Summary

- Screens completed: 8 routes, validation sequences 95-102.
- Direct/Calculated fields wired: Digital Twin site/project/asset context; Energy capacity installed/used/available/recovered/utilization; annual savings; deferred capital value.
- Explicit `No Data` decisions: scanner/OCR outputs, alert model, baseline contract, savings trends/splits, utility forecasting, ROI/payback/projection details, network event details.
- Write actions implemented: none; all scan/export/share/configure/report controls remain shell UI only.
- Verification results: local backend build passed; frontend lint/build passed with existing warnings; local verifier passed; dev direct `3001` verifier passed; dev proxied `8080` verifier passed.
- Dev URL(s): `http://100.91.109.59:8080/enterprise/digital-twin/full-network-page-expanded-electrical-network-view`, `http://100.91.109.59:8080/enterprise/energy-dashboard`.
- Remaining questions: approve scanner/OCR write model, Energy alert/event model, baseline energy contract, savings rollup/split model, and financial investment model before wiring those fields.

