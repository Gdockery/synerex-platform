# ECBS Screen Batch Checklist: Energy Savings Value Engine

## Batch Identity

- Batch name: Energy Savings Value Engine
- Date: 2026-07-11
- Module / route family: Enterprise / Energy Dashboard
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 103-107 and 109-111.
- Skipped blocker: validation sequence 108 is `INVALID_CONSTITUTION_BLOCKER`.

## Screens In Batch

| Order | Screen | Route | Status |
|---:|---|---|---|
| 1 | Energy and Savings Dashboard - Cumulative Savings Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-cumulative-savings-screen` | Pending |
| 2 | Energy and Savings Dashboard - ROI Payback | `/enterprise/energy-dashboard/energy-and-savings-dashboard-roi-payback` | Pending |
| 3 | Energy and Savings Dashboard - ROI Payback - ROI Payback Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-roi-payback-roi-payback-screen` | Pending |
| 4 | Energy and Savings Dashboard - Real-Time Value Engine - Real-Time Value Engine Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-real-time-value-engine-real-time-value-engine-screen` | Pending |
| 5 | Energy and Savings Dashboard - Real-Time Value Engine Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-real-time-value-engine-screen` | Pending |
| 6 | Energy and Savings Dashboard - Savings Engine - Savings Engine - Savings Engine - Savings Engine | `/enterprise/energy-dashboard/energy-and-savings-dashboard-savings-engine-savings-engine-savings-engine-savings-engine` | Pending |
| 7 | Energy and Savings Dashboard - Savings Engine - Savings Engine Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-savings-engine-savings-engine-screen` | Pending |
| 8 | Energy and Savings Dashboard - Savings Engine Screen | `/enterprise/energy-dashboard/energy-and-savings-dashboard-savings-engine-screen` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Existing TSX look and feel preserved.
- [ ] Only direct/calculated fields wired.
- [ ] Missing model outputs explicitly render `No Data`.
- [ ] No write/report/export command behavior invented.

## Field Classification

| Field key | Screen label(s) | Classification | Source / rule | Action |
|---|---|---|---|---|
| `energy.latest_annual_savings` | annual benefit, savings this year | Direct Data | `tracking.savings_intelligence.annual_savings` latest row | Wire |
| `energy.capacity_value` | capacity value, deferred capital value | Direct Data | `tracking.capacity_intelligence.deferred_capital_value` | Wire |
| `energy.current_capacity_context` | capacity recovered | Direct Data / Calculated | `tracking.capacity_intelligence.recoverable_capacity` | Wire |
| `energy.lifetime_savings` | lifetime/cumulative savings | No Data / Question | no approved lifetime rollup or activation baseline | No Data |
| `energy.monthly_daily_savings` | savings this month/today | No Data / Question | no approved monthly/daily rollup | No Data |
| `energy.savings_trend` | cumulative/time-series/value stream | No Data / Question | no approved historical snapshot contract | No Data |
| `energy.savings_category_split` | energy/demand/PF/capacity splits, drivers | No Data / Question | no approved split model | No Data |
| `energy.baseline_contract` | ROI, payback, baseline, avoided cost | No Data / Question | no approved baseline/investment model | No Data |
| `energy.report_write_actions` | export/share/configure/report actions | No Data / Question | no approved command APIs | Leave shell only |

## API / Data Contract

- Read endpoint(s): existing frontend server adapter `getOchsnerCapacityIntelligenceData()`.
- Write command endpoint(s): none in this batch.
- Existing types reused: `CapacityIntelligenceData`.
- `tracking` tables queried: `capacity_intelligence`, `savings_intelligence`, supporting site/project/meter rows already used by the adapter.
- `ecbs_os` tables queried/written: none in this batch.

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked |
|---|---|---|
| Lifetime/cumulative savings rollup | no approved activation baseline or lifetime rollup contract | cumulative savings, milestones, lifetime total |
| Monthly/daily savings rollup | no approved bucketed savings contract | savings this month, savings today, daily/monthly tables |
| Real-time value model | no approved per-minute value algorithm | value rate, live stream, value events, contribution trend |
| Savings split/driver model | no approved allocation model | energy/demand/PF/operational splits, drivers, source tables |
| ROI/payback model | no approved investment basis | ROI, IRR, NPV, payback, cash flow |
| Reports/actions | no approved command APIs | export/share/configure/view report behavior |

## Verification Config

- Verification config path: planned `verification/energy-savings-value-engine.json`
- Mutating checks required? No
- Browser click checks required? One value/savings route smoke check.

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Validation sequence 108 is invalid. | Skip it; do not wire or generate route work for that screen in this batch. |
| These screens look financial but do not have an approved financial model. | Wire latest annual savings/deferred value only; ROI/payback/cash flow stay No Data. |
| Manual dev Docker restart must use compose network. | Always run `ecbs-os-frontend` with `--network synerex-platform_default` so `mysql-tracking` resolves and nginx `8080` works. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

