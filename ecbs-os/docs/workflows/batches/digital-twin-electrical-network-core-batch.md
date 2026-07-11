# ECBS Screen Batch Checklist: Digital Twin Electrical Network Core

## Batch Identity

- Batch name: Digital Twin Electrical Network Core
- Date: 2026-07-11
- Module / route family: Enterprise / Digital Twin / Electrical Network
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 79-86.
- Next sibling batch begins at validation sequence 87.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Digital Twin | `/enterprise/digital-twin` | `ECBS-Digital Twin Screenshot.png` | Pending |
| 2 | Electrical Network | `/enterprise/digital-twin/electrical-network` | `ECBS-Electrical Network Screenshot.png` | Pending |
| 3 | Electrical Network - Alerts Detail | `/enterprise/digital-twin/electrical-network-alerts-detail-screen` | `ECBS_Electrical Network - Alerts Detail screen.png` | Pending |
| 4 | Electrical Network - Health Detail - Recent Health Events | `/enterprise/digital-twin/electrical-network-health-detail-recent-health-events-sub-screen` | `ECBS_Electrical Network - Health Detail - Recent Health Events sub screen.png` | Pending |
| 5 | Electrical Network - Health Detail | `/enterprise/digital-twin/electrical-network-health-detail-screen` | `ECBS_Electrical Network - Health Detail Screen.png` | Pending |
| 6 | Electrical Network - Load Detail - View All Peak Events | `/enterprise/digital-twin/electrical-network-load-detail-view-all-peak-events-screen` | `ECBS_Electrical Network - Load Detail - View All Peak Events screen.png` | Pending |
| 7 | Electrical Network - Load Detail - Full Event Analysis | `/enterprise/digital-twin/electrical-network-load-detail-view-all-peak-events-screen-full-event-analysis-screen` | `ECBS_Electrical Network - Load Detail - View All Peak Events screen - Full Event Analysis Screen.png` | Pending |
| 8 | Electrical Network - Load Detail | `/enterprise/digital-twin/electrical-network-load-detail-screen` | `ECBS_Electrical Network - Load Detail Screen.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Digital Twin screens are scoped to the Ochsner site/project from the tracking adapter.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `digital_twin.site_name` | site/client selector, subtitle | header/context | Direct Data | `tracking.site.name` via `getOchsnerDigitalTwinData` | Wire |
| `digital_twin.project_name` | project/context | header/context | Direct Data | `tracking.project.name` | Wire |
| `digital_twin.asset_identity` | asset name/type/status | canvas, detail, summary | Direct Data | `tracking.asset` rows | Wire |
| `digital_twin.asset_rating` | kVA/amp/voltage rating | canvas, hierarchy | Direct Data if populated | `tracking.asset.kva_rating`, `amp_rating`, voltages | Wire |
| `digital_twin.relationships` | parent/child network links | one-line/canvas | Direct Data if rows exist | `tracking.asset_relationship` | Wire basic count / list |
| `capacity.installed/used/available/recovered` | load, connected load, headroom, recovered capacity | KPIs/summary | Direct Data / Calculated | `tracking.capacity_intelligence`; headroom from installed minus used | Wire |
| `meter.active_count` | active meters | summary | Direct Data | latest `tracking.current_balance_metrics` meter count | Wire |
| `network.health_score` | Network Health / CBI | health KPI | Calculated From Data | latest average `current_balance_metrics.cbi_score` | Wire where labelled as overall health |
| `network.health_breakdown` | health by asset/category, risk contributors | health panels | No Data / Question | no approved per-category health/event model | Show No Data |
| `network.alerts` | alerts, alert history, notes/actions | alerts panels | No Data / Question | no approved alert/event source in current payload | Show No Data |
| `network.peak_events` | peak events, event analysis, demand spike | peak event screens | No Data / Question | no approved peak-event/time-series source in current payload | Show No Data |
| `network.trends` | load trend, voltage profile, health trend | charts | No Data / Question | no approved trend payload for these screens | Show No Data |
| `network.power_quality` | voltage, THD, PF by feeder | electrical panels | No Data / Question except CBI/PF where separately approved | no feeder-level voltage/current/THD source | Show No Data |
| `network.losses` | total losses, optimization losses | KPIs/panels | No Data / Question | no approved losses model in current payload | Show No Data |
| `network.write_actions` | export, configure, acknowledge, note, work order | buttons/actions | No Data / Question until write models approved | shell actions only | Leave shell / No Data |

## API / Data Contract

- Read endpoint(s): existing frontend server adapter `getOchsnerDigitalTwinData()` from `tracking` DB.
- Write command endpoint(s): none in this batch.
- Existing type reused: `DigitalTwinData`.
- `tracking` tables queried: `site`, `project`, `digital_twin`, `asset`, `asset_relationship`, `capacity_intelligence`, `current_balance_metrics`.
- `ecbs_os` tables queried/written: none in this batch.

## Write Model Decision

Visible export, configure alerts, acknowledge, add note, assign, work-order, and scanner controls exist, but this batch is read-only.

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Nav | Digital Twin link | `/enterprise/digital-twin` | Pending |
| Digital Twin | Electrical Network link | `/enterprise/digital-twin/electrical-network` | Pending |
| Electrical Network | Alerts card/detail | `/enterprise/digital-twin/electrical-network-alerts-detail-screen` | Pending |
| Electrical Network | Health card/detail | `/enterprise/digital-twin/electrical-network-health-detail-screen` | Pending |
| Health Detail | Recent Health Events | `/enterprise/digital-twin/electrical-network-health-detail-recent-health-events-sub-screen` | Pending |
| Electrical Network | Load card/detail | `/enterprise/digital-twin/electrical-network-load-detail-screen` | Pending |
| Load Detail | View All Peak Events | `/enterprise/digital-twin/electrical-network-load-detail-view-all-peak-events-screen` | Pending |
| Peak Events | Full Event Analysis | `/enterprise/digital-twin/electrical-network-load-detail-view-all-peak-events-screen-full-event-analysis-screen` | Pending |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Alerts/events source | Current payload has no approved alert/event table. | active alerts, history, notes, health events, alert counts | Define alert/event model |
| Peak-event/time-series model | Current payload has no approved peak-event or 5-minute trend source. | peak events, full event analysis, demand timeline, event markers | Define trend/event contract |
| Per-category health model | Only CBI score exists; no asset/category health formula. | health breakdown, risk contributors, impact matrix | Define health model |
| Feeder-level electrical measurements | Current payload has no feeder voltage/current/THD/load time series. | voltage profile, feeder loading, power quality by feeder | Define telemetry mapping |
| Losses/optimization model | Current payload has no losses calculation. | total losses, losses reduction, action plans | Define losses model |
| Write actions | No approved command/write APIs. | export/configure/acknowledge/note/work order | Define write models |

## Verification Config

- Verification config path: planned `verification/digital-twin-electrical-network-core.json`
- Mutating checks required? No
- Browser click checks required? Yes, one overview route plus one detail route.

Required before deploy:

- [ ] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/digital-twin-electrical-network-core.json`
- [ ] Browser smoke check
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| These are enterprise routes, not deployment routes. | Do not use `deploymentId=1`; use Ochsner Digital Twin adapter. |
| Digital Twin parent already had a data adapter but ignored data. | Wire the existing payload before adding new APIs. |
| Alert/peak/health-event screens are derivative of unmodeled event sources. | Propagate No Data from the missing event models. |
| Manual frontend Docker run must match container port. | Next container listens on `3001`; map host `3000:3001`. |
| Proxy container resolves by Docker network name. | Connect `ecbs-os-frontend` to `synerex-platform_default` before proxy verification. |
| Dev server may not have `rg`. | Use plain Docker/status output remotely, or filter locally after SSH. |
| Browser screenshots can be stale. | Take a fresh snapshot after navigation. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

