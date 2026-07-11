# ECBS Screen Batch Checklist: Electrical Network Losses And Power

## Batch Identity

- Batch name: Electrical Network Losses And Power
- Date: 2026-07-11
- Module / route family: Enterprise / Digital Twin / Electrical Network
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 87-94.
- Next sibling batch begins at validation sequence 95.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Losses Detail - Download Action Plan | `/enterprise/digital-twin/electrical-network-losses-detail-view-losses-optimization-download-action-plan-screen` | `ECBS_Electrical Network - Losses Detail - View Losses Optimization - Download Action Plan screen.png` | Pending |
| 2 | Losses Detail - View Losses Optimization | `/enterprise/digital-twin/electrical-network-losses-detail-view-losses-optimization-screen` | `ECBS_Electrical Network - Losses Detail - View Losses Optimization screen.png` | Pending |
| 3 | Losses Detail | `/enterprise/digital-twin/electrical-network-losses-detail-screen` | `ECBS_Electrical Network - Losses Detail screen.png` | Pending |
| 4 | Optimization Detail | `/enterprise/digital-twin/electrical-network-optimization-detail-screen` | `ECBS_Electrical Network - Optimization Detail screen.png` | Pending |
| 5 | Power Detail - View All Low PF Events | `/enterprise/digital-twin/electrical-network-power-detail-view-all-low-pf-events-screen` | `ECBS_Electrical Network - Power Detail -  View All Low PF Events screen.png` | Pending |
| 6 | Power Detail - View Reactive Power Detail | `/enterprise/digital-twin/electrical-network-power-detail-view-reactive-power-detail-screen` | `ECBS_Electrical Network - Power Detail - View Reactive Power Detail screen.png` | Pending |
| 7 | Power Detail | `/enterprise/digital-twin/electrical-network-power-detail-screen` | `ECBS_Electrical Network - Power Detail Screen.png` | Pending |
| 8 | Electrical Network Optimization Recommendations | `/enterprise/digital-twin/electrical-network-optimization-recommendations` | `ECBS-Electrical Network Optimization Recommendations Screenshot.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Screens are scoped to the Ochsner site/project from the Digital Twin tracking adapter.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `digital_twin.site_name` | site/client selector | header/context | Direct Data | `tracking.site.name` via `getOchsnerDigitalTwinData` | Wire |
| `digital_twin.date_range` | date range | header/filter | Direct Data | adapter date range | Wire |
| `capacity.used_capacity` | real power / connected load where label matches | power/recommendations KPIs | Direct Data | `tracking.capacity_intelligence.used_capacity` | Wire |
| `capacity.installed_capacity` | capacity/utilization denominator | power/recommendations KPIs | Direct Data | `tracking.capacity_intelligence.installed_capacity` | Wire |
| `capacity.available_capacity` | available capacity | supporting KPIs | Calculated / Direct | adapter headroom or available capacity | Wire where label matches |
| `network.losses` | total losses, loss energy, loss percentage, loss heat map | losses screens | No Data / Question | no approved losses model in current payload | Show No Data |
| `network.loss_optimization` | loss reduction, savings, roadmap, action plan | losses optimization/action plan | No Data / Question | derivative of missing losses model | Show No Data |
| `network.power_quality` | apparent/reactive power, kVAR, PF distribution, THD, low PF events | power screens | No Data / Question except direct current load/capacity | no approved feeder-level PQ/event source | Show No Data |
| `network.optimization_recommendations` | recommendations, priorities, payback, confidence, savings | optimization screens | No Data / Question | no approved recommendation engine/model | Show No Data |
| `network.write_actions` | export, recalculate, save plan, download PDF | buttons/actions | No Data / Question until write models approved | shell controls only | Leave shell / No Data |

## API / Data Contract

- Read endpoint(s): existing frontend server adapter `getOchsnerDigitalTwinData()` from `tracking` DB.
- Write command endpoint(s): none in this batch.
- Existing type reused: `DigitalTwinData`.
- `tracking` tables queried: `site`, `project`, `digital_twin`, `asset`, `asset_relationship`, `capacity_intelligence`, `current_balance_metrics`.
- `ecbs_os` tables queried/written: none in this batch.

## Write Model Decision

Visible export, configure alerts, save plan, recalculate, download PDF, and implementation-plan controls exist, but this batch is read-only.

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Losses model | No approved losses calculation or source table. | loss kW, loss MWh, loss %, loss heat maps, location/category losses | Define losses contract |
| Loss optimization model | Depends on losses model plus cost/action assumptions. | action plan, savings forecast, roadmap, payback | Define optimization model |
| Power-quality detail | No feeder-level kVAR, kVA, PF event, THD, or trend source in payload. | reactive power screens, low PF events, PF distributions | Define PQ telemetry mapping |
| Recommendation engine | No approved recommendation/savings/payback model. | recommendation table, priority actions, confidence, next steps | Define recommendation model |
| Write/report actions | No approved command/write APIs. | export, save, recalculate, PDF action plan | Define write/report models |

## Verification Config

- Verification config path: planned `verification/electrical-network-losses-power.json`
- Mutating checks required? No
- Browser click checks required? Yes, one losses route and one power route.

Required before deploy:

- [ ] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/electrical-network-losses-power.json`
- [ ] Browser smoke check
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| These are enterprise routes, not deployment routes. | Do not use `deploymentId=1`; use Ochsner Digital Twin adapter. |
| Losses and power-quality detail screens derive from unmodeled sources. | Propagate No Data from the missing source family. |
| Manual frontend Docker run must match container port. | Next container listens on `3001`; map host `3001:3001`. |
| Proxy container resolves by Docker network name. | Connect `ecbs-os-frontend` to `synerex-platform_default` before proxy verification. |
| Dev server may not have `rg`. | Use plain Docker/status output remotely, or filter locally after SSH. |
| Browser screenshots can be stale. | Trust snapshot URL/text and take a fresh snapshot after navigation. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

