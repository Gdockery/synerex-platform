# ECBS Recurring Screen Model Definition Catalog

Purpose: define reusable engineering and financial models for recurring ECBS screen fields that have been showing as `No Data`.

This catalog is not a license to invent values in UI screens. A screen can wire a model only after the model is marked `Approved For Wiring` and the required inputs are available through `ECBS.Api`.

## Approval States

| State | Meaning | Screen behavior |
|---|---|---|
| `Approved For Wiring` | Formula is deterministic, inputs are available, and no unapproved business assumption is required. | Wire through API and show value. |
| `Candidate - Needs Assumption Approval` | Formula is standard/common, but ECBS must approve thresholds, lookup tables, rates, or fallback behavior. | Keep explicit `No Data` or `Model Pending`. |
| `Blocked - Needs Source Contract` | Formula may exist, but source data is absent or not indexed/stable enough. | Keep explicit `No Data`; do not derive. |
| `Manual / Write Model Required` | User input, workflow state, or command side effect is required. | Keep shell UI only until write model exists. |


## Product Approval Record

Status: ECBS product owner approved all candidate model assumptions on 2026-07-11.

Effect:

- Models formerly marked `Candidate - Needs Assumption Approval` are now `Approved For Wiring` when their required inputs are available through `ECBS.Api`.
- `M-012 Trend Rollups` remains `Blocked - Needs Source Contract` until indexed backend rollup endpoints or `ecbs_os` snapshots exist.
- `M-014 Reports And Export Artifacts` remains `Manual / Write Model Required` until report/export command and persistence APIs exist.
- Any approved model with missing required inputs must return `source_missing` or explicit `No Data`; it must not fabricate source data.

## Model Contract

Every approved model should be implemented as a backend model payload with:

| Field | Description |
|---|---|
| `modelKey` | Stable key from this catalog. |
| `version` | Semantic version for formula and threshold changes. |
| `state` | `data`, `model_pending`, `source_missing`, or `error`. |
| `inputs` | Source fields and units used by the calculation. |
| `outputs` | Computed fields and units displayed by screens. |
| `assumptions` | Approved constants, standards, tariffs, or lookup references. |
| `confidence` | `direct`, `calculated`, `estimated`, or `manual`. |
| `warnings` | Any missing optional inputs or downgraded assumptions. |

## M-001 Capacity Headroom And Utilization

State: `Approved For Wiring`

Applies to: Capacity Intelligence, Electrical Network, Digital Twin, Energy Savings Dashboard.

Inputs:

| Input | Source | Unit |
|---|---|---|
| `installed_capacity` | `tracking.capacity_intelligence.installed_capacity` | kVA |
| `used_capacity` | `tracking.capacity_intelligence.used_capacity` | kVA |
| `available_capacity` | `tracking.capacity_intelligence.available_capacity` | kVA |
| `recoverable_capacity` | `tracking.capacity_intelligence.recoverable_capacity` | kVA |

Outputs:

| Output | Formula | Unit |
|---|---|---|
| `effective_available_capacity` | `available_capacity + recoverable_capacity` | kVA |
| `raw_headroom` | `max(installed_capacity - used_capacity, 0)` | kVA |
| `utilization_pct_calculated` | `used_capacity / installed_capacity * 100` when direct utilization is missing | % |
| `recovered_pct_calculated` | `recoverable_capacity / installed_capacity * 100` | % |

Fallback:

If `installed_capacity <= 0`, all percentage outputs are `No Data`.

## M-002 Asset Connected Capacity

State: `Approved For Wiring`

Applies to: Asset detail, capacity by asset, electrical network assets.

Inputs:

| Input | Source | Unit |
|---|---|---|
| `kva_rating` | `tracking.asset.kva_rating` | kVA |
| `amp_rating` | `tracking.asset.amp_rating` | A |
| `voltage_secondary` | `tracking.asset.voltage_secondary` | V |
| `voltage_primary` | `tracking.asset.voltage_primary` | V |

Outputs:

| Output | Formula | Unit |
|---|---|---|
| `connected_kva` | `kva_rating` if populated, otherwise `sqrt(3) * voltage * amp_rating / 1000` | kVA |

Assumptions:

Use `voltage_secondary` first, then `voltage_primary`. If neither voltage is populated, do not assume 480 V unless ECBS explicitly approves that default.

## M-003 Load Allocation By Asset

State: `Approved For Wiring`

Applies to: capacity by asset, equivalent capacity gain, load contribution, asset health.

Inputs:

| Input | Source | Unit |
|---|---|---|
| `meter_id` | `tracking.asset.meter_id` | identifier |
| `asset_connected_kva` | M-002 | kVA |
| `used_capacity` | M-001 | kVA |

Approved outputs:

| Output | Approved formula | Unit |
|---|---|---|
| `asset_used_kva` | exact meter value when `meter_id` is mapped; otherwise proportional allocation by connected kVA | kVA |
| `asset_utilization_pct` | `asset_used_kva / asset_connected_kva * 100` | % |

Approved assumptions:

ECBS must approve whether proportional allocation is acceptable when an asset has no meter mapping.

## M-004 Health Score From Capacity And Power Quality

State: `Approved For Wiring`

Applies to: capacity health score, electrical network health detail, device health, risk contributors.

Inputs:

| Input | Source | Unit |
|---|---|---|
| `utilization_pct` | M-001 or `tracking.capacity_intelligence.utilization_pct` | % |
| `power_factor` | `tracking.meter.lastTotalPf` or rollup | ratio |
| `thd` | `tracking.meter.lastTotalTHD` or rollup | % |
| `phase_current` | `tracking.current_balance_metrics.avg_l1_amp/l2/l3` | A |

Approved scoring:

| Subscore | Approved rule |
|---|---|
| `utilization_score` | 100 down to 0 as utilization approaches and exceeds approved limit. |
| `power_factor_score` | 100 when PF is at or above approved threshold; degrade below threshold. |
| `harmonic_score` | Based on THD threshold bands; IEEE 519 can be the reference family, but ECBS must approve voltage/current class assumptions. |
| `balance_score` | Based on phase current deviation from phase average. |
| `overall_health_score` | Weighted average of approved subscores. |

Approved assumptions:

Weights, threshold bands, and treatment of missing PF/THD/phase data.

## M-005 Power Quality Compliance

State: `Approved For Wiring`

Applies to: PF detail, THD detail, harmonic impact, voltage stability, power detail screens.

Approved references:

| Family | Common reference basis |
|---|---|
| Harmonic distortion | IEEE 519-style THD/TDD thresholding after service voltage and current context are known. |
| Voltage range | ANSI C84.1-style service voltage range after nominal voltage class is known. |
| Power factor | Utility tariff or ECBS threshold, commonly 0.90 or 0.95 depending on billing context. |

Blocked inputs:

| Input | Current status |
|---|---|
| Harmonic spectrum by order | Not present in current shared payload. |
| Nominal voltage class | Asset voltage exists, but screen-level voltage context needs explicit selection. |
| Frequency | Not exposed by current shared API. |

Screen behavior:

Show PF/THD direct values when present. Keep compliance, pass/fail, and spectrum charts as `Model Pending` until thresholds and inputs are approved.

## M-006 Capacity Upgrade Deferral

State: `Approved For Wiring`

Applies to: upgrade deferral value, expansion simulation, optimization opportunities, financial impact.

Inputs:

| Input | Source | Unit |
|---|---|---|
| `installed_capacity` | M-001 | kVA |
| `used_capacity` | M-001 | kVA |
| `effective_available_capacity` | M-001 | kVA |
| `load_growth_rate` | M-007 | % / year |
| `upgrade_threshold_pct` | approved assumption | % |
| `standard_equipment_size_ladder` | approved lookup | kVA |

Approved outputs:

| Output | Approved formula | Unit |
|---|---|---|
| `next_required_capacity` | next approved standard size above projected demand at threshold | kVA |
| `years_deferred` | time until projected demand crosses threshold before vs after ECBS recovery | years |
| `upgrade_avoided_flag` | true when ECBS recovery keeps load below approved threshold within horizon | boolean |

Approved assumptions:

Growth horizon, capacity threshold, equipment size ladder, and whether transformer, switchgear, feeder, or service equipment drives the upgrade.

## M-007 Load Growth Forecast

State: `Approved For Wiring`

Applies to: upgrade window, utility forecasting, capacity forecasting, expansion readiness.

Approved approaches:

| Approach | Use when |
|---|---|
| Historical linear trend | Enough historical demand points exist and seasonality is not material. |
| Seasonal baseline | Enough interval/monthly data exists to separate seasonality from growth. |
| Manual growth rate | Customer/project growth assumption is provided. |

Approved assumptions:

Default forecast horizon, minimum sample count, outlier handling, and whether manual growth overrides telemetry trend.

## M-008 Financial Savings And ROI

State: `Approved For Wiring`

Applies to: ROI, payback, cumulative savings, cash flow, annual benefit, real-time value.

Direct inputs already available:

| Input | Source | Unit |
|---|---|---|
| `annual_savings` | `tracking.savings_intelligence.annual_savings` | dollars/year |
| `deferred_capital_value` | `tracking.capacity_intelligence.deferred_capital_value` | dollars |

Candidate inputs needed:

| Input | Source needed |
|---|---|
| `ecbs_project_cost` | contract/project finance table or manual approved value |
| `opex_delta` | approved estimate or measured cost delta |
| `discount_rate` | approved finance assumption |
| `analysis_horizon_years` | approved finance assumption |
| `tariff_rates` | utility bill/tariff source |

Approved outputs:

| Output | Approved formula |
|---|---|
| `simple_payback_years` | `ecbs_project_cost / annual_net_benefit` |
| `roi_pct` | `(total_benefit - ecbs_project_cost) / ecbs_project_cost * 100` |
| `npv` | discounted annual net benefit plus deferred capital value minus project cost |
| `irr` | discount rate that makes modeled cash flow NPV equal zero |

Screen behavior:

Annual savings and deferred capital value can display now. ROI, payback, NPV, IRR, and cash-flow charts can wire through the approved M-008 model when project cost, finance, tariff, and horizon inputs exist; otherwise return `source_missing`.

## M-009 Savings Category Split

State: `Approved For Wiring`

Applies to: savings engine, savings breakdown, waterfall, value drivers.

Approved categories:

| Category | Candidate basis |
|---|---|
| Demand savings | kW/kVA demand reduction times demand charge rate. |
| Energy savings | kWh reduction times energy rate. |
| Power factor savings | avoided PF penalties or reactive demand charges. |
| Deferred capital | M-006 / M-008. |
| Operational savings | approved labor/maintenance assumptions only. |

Approved assumptions:

Tariff source, whether kVA can proxy for demand kW in specific screens, PF penalty logic, and whether category sums must reconcile exactly to `annual_savings`.

## M-010 Carbon Equivalencies

State: `Approved For Wiring`

Applies to: carbon impact, emissions screen, equivalent cars/trees/energy.

Direct input:

| Input | Source | Unit |
|---|---|---|
| `co2_tons` | `tracking.savings_intelligence.co2_reduction_tons` | tons CO2e |

Approved outputs:

| Output | Approved formula |
|---|---|
| `trees_equivalent` | `co2_tons * approved_trees_per_ton_factor` |
| `cars_equivalent` | `co2_tons / approved_car_tons_per_year_factor` |
| `clean_energy_equivalent` | `co2_tons / approved_grid_emission_factor` |

Approved assumptions:

Factor source and whether ECBS uses EPA-style public equivalencies, regional eGRID factors, utility-specific factors, or customer-specific factors.

## M-011 Alert And Event Severity

State: `Approved For Wiring`

Applies to: alarms/events, energy alerts, electrical alerts, device logs, recent health events.

Approved event families:

| Event | Candidate trigger |
|---|---|
| Capacity over threshold | utilization exceeds approved threshold for approved duration. |
| Low power factor | PF below approved threshold for approved duration. |
| High THD | THD above approved threshold for approved duration. |
| Communication stale | last communication exceeds approved age threshold. |
| Phase imbalance | phase current deviation exceeds approved threshold. |

Approved assumptions:

Thresholds, debounce duration, severity mapping, notification SLA, acknowledgement model, and persistence table.

Current screen behavior:

Direct alarm rows can display where the alarm API has real rows. Synthetic events from telemetry must wait.

## M-012 Trend Rollups

State: `Blocked - Needs Source Contract`

Applies to: minute charts, cumulative savings, daily/monthly trends, heatmaps, waterfall, forecasts.

Problem:

The raw `tracking.meterdata` table may contain usable telemetry, but screen queries against raw rows are too fragile without an indexed backend contract.

Required contract:

| Output | Minimum fields |
|---|---|
| `interval_load_rollup` | timestamp, meter/site/project scope, avg/max/min kW, kVA, PF, THD where available |
| `daily_energy_rollup` | date, kWh, peak demand, average demand, PF/THD summaries |
| `monthly_savings_rollup` | month, demand savings, energy savings, PF savings, deferred capital snapshot |
| `event_rollup` | timestamp, event type, severity, affected asset/meter, calculated impact |

Approved source-contract requirements:

Rollup interval, retention, indexes, timezone, and snapshot ownership in `ecbs_os`.

## M-013 Scenario And Optimization Ranking

State: `Approved For Wiring`

Applies to: simulate capacity expansion, view optimization opportunities, action plans.

Approved inputs:

| Input | Source needed |
|---|---|
| `action_catalog` | approved ECBS action list |
| `action_capacity_impact` | modeled or measured kVA impact |
| `action_cost` | cost estimate table |
| `action_risk` | approved risk model |
| `implementation_effort` | approved effort scale |

Approved ranking:

`score = weighted(capacity_unlocked, savings, cost_efficiency, risk_reduction, implementation_effort)`

Approved assumptions:

Weights, action catalog, whether recommendations can be generated deterministically, and whether user/customer constraints are inputs.

## M-014 Reports And Export Artifacts

State: `Manual / Write Model Required`

Applies to: report builder, export package, PDF report, proposal/site assessment reports.

Required model:

| Area | Required contract |
|---|---|
| Report definition | template id, data sources, filters, generated sections |
| Report run | requested by, status, started/completed timestamps, artifact URI |
| Export package | selected docs/screens/data, security level, package artifact URI |
| Review status | reviewer, approval state, comments |

Screen behavior:

Read-only report lists stay `No Data` until `report_runs` or equivalent tables exist. Buttons remain shell actions until command APIs are approved.

## M-015 Deployment Workflow Derived Metrics

State: `Approved For Wiring`

Applies to: deployment checklist, testing verification, completion dashboards.

Approved outputs:

| Output | Candidate basis |
|---|---|
| `workflow_progress_pct` | completed required checklist items / total required checklist items |
| `quality_score` | weighted score from tests passed, missing docs, unresolved issues, and telemetry validation |
| `performance_delta` | post-installation reading minus pre-installation reading for approved fields |

Blocked inputs:

Checklist item schema, test result schema, issue/action schema, signoff schema, and photo metadata model.

## Initial Wiring Priority

| Priority | Model | Reason |
|---|---|---|
| 1 | M-001 Capacity Headroom And Utilization | Already direct/calculated and affects many screens. |
| 2 | M-002 Asset Connected Capacity | Already deterministic and useful across Digital Twin and Capacity. |
| 3 | M-012 Trend Rollups | Removes repeated raw telemetry blockers once API contract exists. |
| 4 | M-008 Financial Savings And ROI | Unlocks many Energy/Financial screens where cost inputs are available. |
| 5 | M-011 Alert And Event Severity | Unlocks repeated alerts/events panels once event persistence/source contract exists. |
| 6 | M-005 Power Quality Compliance | Unlocks PF/THD/voltage diagnostic panels where measured inputs exist. |

## Approved Decision Queue

These decisions are approved as model assumptions. Implementation still needs to encode the exact constants/tables in backend model services or configuration.

| Decision | Needed for | Status |
|---|---|---|
| Proportional asset allocation is acceptable when meter-to-asset mapping is missing. | M-003 | Approved |
| ECBS may use approved default PF thresholding until tariff-specific thresholds are added. | M-004, M-005, M-009, M-011 | Approved |
| ECBS may use approved THD/compliance bands for Ochsner diagnostic screens where measured THD exists. | M-004, M-005, M-011 | Approved |
| ROI/payback may use approved project-cost input when available; otherwise return `source_missing`. | M-008 | Approved |
| Demand/energy/PF savings splits may use approved tariff/source inputs when available; otherwise return `source_missing`. | M-009 | Approved |
| Carbon equivalency factors may be standardized in ECBS model configuration. | M-010 | Approved |
| Trend rollups should be materialized through backend rollup endpoints and/or `ecbs_os` snapshots. | M-012 | Approved for implementation; source contract still required |
| Generated telemetry events need a persisted event/alert contract before screen wiring. | M-011 | Approved for implementation; source contract still required |

