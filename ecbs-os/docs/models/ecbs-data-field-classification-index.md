# ECBS Data Field Classification Index

Purpose: human-readable index of reusable ECBS screen data field families.

Use this like the screen flow map, but for data. A screen label should map to one of these field keys before wiring.

## Classification Legend

- `Direct Data`: exists in `tracking`, `ecbs_os`, or an approved API/source.
- `Calculated`: deterministic calculation from direct data.
- `Approved Model`: ECBS-approved derivation/model; wire through backend when required inputs/source contracts exist.
- `Estimated / Model Required`: possible only after approving assumptions, lookup tables, or business rules.
- `No Data / Question`: no reliable source or no approved model yet.

## Model Definition Branch

The recurring modelable blockers are now tracked in:

`synerex-platform/ecbs-os/docs/models/ecbs-recurring-screen-model-definition-catalog.md`

Use the model catalog to separate fields that are genuinely missing from fields that can now be derived through approved ECBS models once required inputs, source contracts, or write models exist.

Current model states:

| Model key | Status | Primary field families |
|---|---|---|
| `M-001` | Approved For Wiring | capacity headroom, utilization, recovered capacity percentages |
| `M-002` | Approved For Wiring | asset connected kVA from rating or three-phase volts/amps |
| `M-003` | Approved For Wiring | asset load allocation and asset utilization |
| `M-004` | Approved For Wiring | health score from capacity and power quality |
| `M-005` | Approved For Wiring | PF/THD/voltage compliance and diagnostic bands |
| `M-006` | Approved For Wiring | capacity upgrade deferral and avoided upgrade logic |
| `M-007` | Approved For Wiring | load growth forecast and upgrade window |
| `M-008` | Approved For Wiring | ROI, payback, NPV, IRR, cash-flow model |
| `M-009` | Approved For Wiring | savings category splits and waterfall |
| `M-010` | Approved For Wiring | carbon equivalencies |
| `M-011` | Approved For Wiring | synthetic alerts/events and severity |
| `M-012` | Blocked - Needs Source Contract | trend rollups and raw telemetry charts |
| `M-013` | Approved For Wiring | scenarios and optimization ranking |
| `M-014` | Manual / Write Model Required | reports, exports, generated artifacts |
| `M-015` | Approved For Wiring | deployment workflow derived metrics |

## Propagation Rule

If a field family is `No Data / Question`, stop wiring it for the current pass.

All same/derivative fields inherit that status until the question is answered.

Example:

`model.transformer_step_up = Approved Model via M-006`

Therefore these can be wired through approved model payloads when required inputs/source contracts exist:

- `model.next_transformer_size`
- `model.upgrade_avoided`
- `model.deferral_duration`
- `financial.deferral_value_over_time`
- `financial.upgrade_window`
- `financial.capex_roadmap`
- `financial.projected_avoided_cost`

## Capacity

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `capacity.installed` | Direct Data | `tracking.capacity_intelligence.installed_capacity` | Total Connected Capacity, Installed Capacity, Nameplate Capacity |
| `capacity.used` | Direct Data | `tracking.capacity_intelligence.used_capacity` | Used Capacity, Utilized Capacity, Connected Load |
| `capacity.available_raw` | Direct Data | `tracking.capacity_intelligence.available_capacity` | Available Capacity before recovery |
| `capacity.recovered` | Direct Data | `tracking.capacity_intelligence.recoverable_capacity` | Recovered Capacity, Recoverable Capacity, Optimization Potential |
| `capacity.available_effective` | Calculated | `available_capacity + recoverable_capacity` | Effective Available Capacity, Immediate Usable Capacity, Reserve Capacity after ECBS |
| `capacity.utilization_pct` | Direct Data | `tracking.capacity_intelligence.utilization_pct` | Capacity Utilization |
| `capacity.recovered_pct` | Calculated | `recoverable_capacity / installed_capacity` | Recovery Percentage, Effective Capacity Gain |
| `capacity.reserve_pct` | Calculated | `available_effective / installed_capacity` | Reserve Capacity %, Capacity Headroom % |
| `capacity.hidden` | Direct Data | `tracking.capacity_intelligence.hidden_capacity` | Hidden Capacity |
| `capacity.hidden_pct` | Direct Data | `tracking.capacity_intelligence.hidden_pct` | Hidden Capacity % |
| `capacity.health_score` | Direct Data | `tracking.capacity_intelligence.capacity_health_score` | Capacity Health Score, Overall Health Score |
| `capacity.rollup_trend` | Direct Data | `tracking.capacity_intelligence` rows by `bucket_ts` | Capacity Trend, Utilization Trend, Recent Capacity Rollups |

## Assets

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `asset.name` | Direct Data | `tracking.asset.name` | Asset Name, Affected Asset |
| `asset.type` | Direct Data | `tracking.asset.asset_type` | Asset Type, Equipment Type |
| `asset.kva_rating` | Direct Data | `tracking.asset.kva_rating` | Connected kVA where rating exists |
| `asset.amp_rating` | Direct Data | `tracking.asset.amp_rating` | Amp Rating |
| `asset.voltage_primary` | Direct Data | `tracking.asset.voltage_primary` | Primary Voltage |
| `asset.voltage_secondary` | Direct Data | `tracking.asset.voltage_secondary` | Secondary Voltage |
| `asset.connected_kva_calculated` | Calculated | kVA rating or sqrt(3) * volts * amps / 1000 | Connected Capacity by Asset |
| `asset.utilized_kva_allocated` | Approved Model | `M-003`; direct when meter mapped, candidate proportional allocation otherwise | Utilized Capacity by Asset |
| `asset.health_calculated` | Approved Model | `M-004`; uses approved thresholds/weights; requires mapped inputs before shared health score wiring | Asset Health, Warning/Critical Status |
| `asset.location` | No Data / Question unless sourced | no approved shared location source in current payload | Asset Location, Room, Facility Area |
| `asset.hierarchy` | Direct Data if scoped to Digital Twin; otherwise No Data / Question | `tracking.asset_relationship` through Digital Twin adapter for approved twin graph; no generic hierarchy for all modules | Asset Tree, Sub-Asset Tree, Equipment Hierarchy |
| `asset.sub_asset_rows` | No Data / Question | No approved sub-asset model in current shared API | Sub-Asset Rows, Primary Winding, Cooling System |
| `asset.load_category_breakdown` | Approved Model | `M-003` plus approved category mapping; wire when category inputs exist | Motor Loads, HVAC Loads, Lighting Loads, Spare / Misc |
| `asset.temperature` | No Data / Question | no approved temperature source in current shared payload | Temperature Average, Thermal Condition |
| `asset.events` | Approved Model | `M-011`; synthetic event generation needs thresholds and persistence contract | Recent Events, Optimization Events, Asset Event History |

## Clients And Projects

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `client.name` | Direct Data | `tracking.client.name` or `ecbs_os.clients.name` | Client Name |
| `client.legal_name` | Direct Data | `tracking.client.legalName` | Legal Entity Name |
| `client.address` | Direct Data | `tracking.client.address/city/state/zip/country` | Client Address, Billing Address |
| `client.market_segment` | Direct Data | `tracking.client.marketSegment` | Industry, Segment |
| `client.primary_contact` | Direct Data when populated | `tracking.client.contactName/contactTitle/contactPhone`, manager fields | Primary Contact, Account Manager |
| `client.status` | Calculated | active when `tracking.client.isDeleted = 0` | Status |
| `client.created_at` | Direct Data | `tracking.client.createdAt` | Client Since, Joined Date |
| `client.contract_number` | No Data / Question unless `xuid` is accepted as external reference | no dedicated contract number in tracking client schema | Contract Number, Customer Number |
| `client.contacts` | No Data / Question unless `tracking.user.client` is explicitly approved | user rows may be users, not client contacts | Contacts Count, Contact Table |
| `project.name` | Direct Data | `tracking.project.name` | Project Name, Facility Name |
| `project.location` | Direct Data | `tracking.project.location` | Site Location |
| `project.start_date` | Direct Data if populated | `tracking.project.startDate` | Start Date |
| `project.status` | Calculated / No Data | Active if not deleted; detailed workflow status not present | Project Status |
| `project.capacity` | Direct Data / Calculated | `tracking.capacity_intelligence.installed_capacity` or `tracking.project.peakKva/avg15MinuteKva` | Project Capacity, Total Capacity |
| `project.progress_pct` | No Data / Question | no approved workflow progress source | Progress, Percent Complete |
| `project.target_completion` | No Data / Question | no approved target completion source | Target Completion |
| `site.count` | Direct Data if `tracking.site` query succeeds; otherwise No Data | `tracking.site.project_id` | Site Count, Sites |

## Meters And Power Quality

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `meter.last_total_kva` | Direct Data | `tracking.meter.lastTotalKva` | Latest kVA, Current Demand where meter-mapped |
| `meter.avg_15_min_kva` | Direct Data | `tracking.meter.avg15MinuteKva` | 15-Min Average Demand |
| `meter.power_factor` | Direct Data | `tracking.meter.lastTotalPf` if populated | Power Factor, PF |
| `meter.thd` | Direct Data if populated; otherwise No Data | `tracking.meter.lastTotalTHD` only when available | THD, Harmonic Impact |
| `meter.voltage` | Approved Model | `M-005`; asset voltage exists, but measured voltage trend/compliance still needs payload and nominal class input | Voltage Stability, Voltage Average |
| `meter.frequency` | Blocked - Needs Source Contract | no approved frequency source in current shared payload | Frequency, Hz |
| `meter.phase_current` | Direct Data when phase fields exist | `tracking.current_balance_metrics.avg_l1_amp/avg_l2_amp/avg_l3_amp` | Phase Current, L1/L2/L3 Current |
| `meter.harmonic_spectrum` | Blocked - Needs Source Contract | `M-005`; no approved harmonic-order source | Harmonic Spectrum, IEEE 519 Bars |
| `meter.raw_meterdata_trend` | Blocked - Needs Source Contract | `M-012`; raw `meterdata` needs indexed backend rollup contract | Raw telemetry trend, Minute-by-minute chart |

## Devices

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `device.name` | Direct Data | `ecbs_os.devices.name` when an ECBS device row exists | Device Name, Gateway Name, Meter Name, Switch Name |
| `device.kind` | Direct Data | `ecbs_os.devices.kind` currently supports Meter, Switch, Gateway | Device Type, Device Category |
| `device.serial_number` | Direct Data | `ecbs_os.devices.serial_number` | Serial Number, Device ID when no separate approved ID exists |
| `device.last_communicated_at` | Direct Data if populated | `ecbs_os.devices.last_communicated_at_utc` | Last Seen, Last Communicated |
| `device.status` | Calculated / No Data | calculated from recent last communication only when timestamp exists | Online, Offline, Communication Status |
| `device.health_score` | Approved Model | `M-004`; uses approved thresholds/weights and requires device telemetry mapping | Health Score, Component Health, Health Distribution |
| `device.firmware` | No Data / Question | no approved firmware field/table on current ECBS device model | Firmware Version, Firmware Up To Date |
| `device.location` | No Data / Question | no approved location/panel/asset field on current ECBS device model | Location, Asset, Installed Location |
| `device.repeaters` | No Data / Question | current `DeviceKind` has no Repeater kind | Repeaters, Signal Strength, Repeater Detail |
| `device.schedule` | No Data / Question | no approved schedule table or command API | Device Scheduling, Next Run, Current Mode |
| `device.commissioning_tests` | No Data / Question | no approved commissioning or test-result table | Commissioning, Testing, Pass/Fail Counts, Next Step |
| `device.job_costing` | No Data / Question | no approved job/cost allocation table | Job Costing, Production Time, Payments, Invoices, Reports |
| `device.production_time` | No Data / Question | no approved production schedule/time source | Production Time, Included Hours, Excluded Hours, Shift Allocation |
| `device.job_reports` | No Data / Question | derivative of unapproved job-costing/report model | Job Costing Reports, Generated Reports, Scheduled Reports |
| `device.payments_invoices` | No Data / Question | derivative of unapproved job-costing/payment model | Payments, Invoices, Outstanding Balance, Paid Amount |
| `device.network_config` | No Data / Question | no approved network configuration fields on current device model | IP Address, MAC Address, DNS, Cellular, Topology, Parent Gateway |
| `device.events_logs` | Approved Model | `M-011`; uses approved event thresholds; requires persistence/source contract | Recent Events, Trips, Alarms, Switch Logs, Gateway Events |
| `device.write_actions` | No Data / Question until write model approved | configure/restart/export/update/remove controls are shell actions only | Restart, Configure, Update Firmware, Export Diagnostics |

## Financial

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `financial.deferred_capital_value` | Direct Data | `tracking.capacity_intelligence.deferred_capital_value` | Upgrade Deferral Value, Deferred CAPEX |
| `financial.annual_savings` | Direct Data | `tracking.savings_intelligence.annual_savings` | Annual Benefit, Annual Savings |
| `financial.deferral_value_over_time` | Approved Model | `M-006`, `M-008`, `M-012`; needs snapshots, load growth, and finance assumptions | Deferral Value Over Time, Cumulative Deferral |
| `financial.deferral_category_breakdown` | Approved Model | `M-006`, `M-009`; uses approved mapping from recovered capacity to upgrade categories | Deferral By Asset Category, Upgrade Type Split |
| `financial.upgrade_cost` | Approved Model | `M-006`; requires equipment cost source/table | Upgrade Cost, Transformer Upgrade Cost, Switchgear Cost |
| `financial.upgrade_window` | Approved Model | `M-006`, `M-007`; needs load growth + threshold + cost model | Next Upgrade Window, Recommended Window |
| `financial.cash_flow_deferral` | Approved Model | `M-008`; uses approved finance schedule/time-bucket model | Cash Flow Impact, Deferred Capital By Year |
| `financial.roi` | Approved Model | `M-008`; requires project cost/investment source | ROI, Capital Efficiency, IRR |
| `financial.payback_period` | Approved Model | `M-008`; requires project cost/investment source | Payback, Payback Period Avoided |

## Energy Savings Dashboard

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `energy.latest_annual_savings` | Direct Data | `tracking.savings_intelligence.annual_savings` latest row | Annual Benefit, Savings This Year, Estimated Annual Savings |
| `energy.capacity_value` | Direct Data | `tracking.capacity_intelligence.deferred_capital_value` | Capacity Value Benefit, Deferred Capital Value |
| `energy.current_capacity_context` | Direct Data / Calculated | `tracking.capacity_intelligence` installed/used/available/recoverable/utilization fields | Capacity Intelligence KPIs, Capacity Recovered KPIs |
| `energy.lifetime_savings` | Approved Model | `M-008`, `M-012`; needs activation baseline and savings snapshots | Lifetime Savings, Total Savings Since Activation |
| `energy.monthly_daily_savings` | Blocked - Needs Source Contract | `M-012`; no approved monthly/daily savings rollup in current payload | Savings This Month, Savings Today, Hourly/Minute Savings Rate |
| `energy.savings_trend` | Blocked - Needs Source Contract | `M-012`; no approved historical snapshot contract for Energy dashboard rollups | Cumulative Savings, Annual Benefit Over Time, Waterfall |
| `energy.savings_category_split` | Approved Model | `M-009`; uses approved split among demand, energy, PF, operational, and maintenance categories where inputs exist | Savings Breakdown, Benefit Breakdown, Savings By Driver |
| `energy.utility_billing_forecast` | Approved Model | `M-007`, `M-008`, `M-009`; needs utility bill/tariff source | Utility Intelligence, Annual Utility Cost, Forecast |
| `energy.baseline_contract` | Approved Model | `M-008`, `M-009`, `M-012`; uses approved baseline model; still needs baseline source contract/input | Baseline Comparison, Before/After, Improvement %, Savings Impact |
| `energy.alert_model` | Approved Model | `M-011`; uses approved Energy alert/event/SLA model; persistence/source contract may be required | Active Alerts, Severity Trend, Alert Response, Priority Matrix, Notifications |
| `energy.report_write_actions` | Manual / Write Model Required | `M-014`; requires export/share/configure/report command APIs | Export, Share, Configure, View Report, Acknowledge |

## Carbon

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `carbon.co2_tons` | Direct Data | `tracking.savings_intelligence.co2_reduction_tons` | CO2e Avoided, Carbon Impact |
| `carbon.trees_equivalent` | Calculated | CO2 tons * approved equivalency factor | Equivalent Trees Planted |
| `carbon.cars_equivalent` | Calculated | CO2 tons / approved car emissions factor | Passenger Cars Off Road |
| `carbon.co2_trend` | Blocked - Needs Source Contract | `M-010`, `M-012`; needs historical CO2 snapshots or approved derivation | Emissions Avoided Over Time, Carbon Trend |
| `carbon.monthly_trend` | Blocked - Needs Source Contract | `M-010`, `M-012`; needs monthly CO2 snapshots or approved rollup source | Monthly Emissions Impact |
| `carbon.baseline_comparison` | Approved Model | `M-010`; requires baseline emissions source | Baseline Vs ECBS, Before / After Carbon |
| `carbon.intensity` | Approved Model | `M-010`; needs denominator/source such as kWh, production, area, or revenue | Emissions Intensity, CO2 per Output |
| `carbon.clean_energy_equivalent` | Approved Model | `M-010`; uses approved conversion factor; source input still required | Clean Energy Generated |
| `carbon.emission_reduction_pct` | Approved Model | `M-010`; needs baseline emissions source | Emission Reduction % |
| `carbon.source_breakdown` | Approved Model | `M-010`; no approved source allocation yet | Emissions By Source |
| `carbon.asset_category_breakdown` | Approved Model | `M-010`; no approved carbon allocation by asset category yet | Carbon By Asset, Category Emissions |

## Equivalent Capacity

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `equivalent.category_attribution` | Approved Model | `M-003`, `M-009`; no approved allocation from recovered capacity to Motor/HVAC/Production/IT/Other | Category Donut, Category Attribution |
| `equivalent.category_trend` | Approved Model | `M-003`, `M-009`, `M-012`; depends on category attribution plus trend model | Stacked Area, Category Trend Over Time |
| `equivalent.equipment_contribution` | Approved Model | `M-003`; no approved equipment-level contribution source | Contribution Breakdown, Equipment Recovered kVA |
| `equivalent.location_attribution` | Approved Model | `M-003`; no approved location allocation source | Location Bars, Site/Building Gain |
| `equivalent.factor_model` | Approved Model | `M-013`; uses approved equivalent factor assumptions | Equivalent Factor, Calculation Basis |
| `equivalent.impact_multiplier` | Approved Model | `M-013`; depends on approved equivalent factor model | Impact Multiplier, Gain Multiplier |

## Electrical Network

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `electrical.apparent_power` | Direct Data / Calculated | apparent power can use kVA fields from capacity/asset models; use `M-001`, `M-002` where scoped | Apparent Power, Network Apparent Load |
| `electrical.voltage_capacity_distribution` | Approved Model | `M-002`, `M-005`; uses approved voltage/rating grouping from asset data | Voltage-Level Distribution |
| `electrical.feeder_capacity_table` | Blocked - Needs Source Contract | no approved feeder-level source/contract | Feeder Table, Feeder Loading |
| `electrical.site_name` | Direct Data | `tracking.site.name` through Digital Twin adapter | Site Selector, Facility Context |
| `electrical.project_name` | Direct Data | `tracking.project.name` through Digital Twin adapter | Project Context |
| `electrical.asset_identity` | Direct Data | `tracking.asset.name/type/status` when a Digital Twin asset row exists | Asset Name, Asset Type, One-Line Node |
| `electrical.asset_rating` | Direct Data if populated | `tracking.asset.kva_rating`, `amp_rating`, `voltage_primary`, `voltage_secondary` | kVA Rating, Amp Rating, Voltage Rating |
| `electrical.asset_relationships` | Direct Data if populated | `tracking.asset_relationship` | Parent/Child Link, Network Link Count |
| `electrical.current_load_kva` | Direct Data | `tracking.capacity_intelligence.used_capacity` via Digital Twin adapter | Current Load, Total Connected Load where kVA label matches |
| `electrical.installed_capacity_kva` | Direct Data | `tracking.capacity_intelligence.installed_capacity` or transformer asset rating | Installed Capacity, Transformer Capacity |
| `electrical.available_capacity_kva` | Direct Data / Calculated | `tracking.capacity_intelligence.available_capacity`; headroom from installed minus used | Available Capacity, Headroom |
| `electrical.recovered_capacity_kva` | Direct Data | `tracking.capacity_intelligence.recoverable_capacity` | Recovered Capacity, Capacity That Can Be Released |
| `electrical.network_health_score` | Calculated From Data | latest average `tracking.current_balance_metrics.cbi_score` | Network Health, CBI Score |
| `electrical.active_meter_count` | Direct Data | latest `tracking.current_balance_metrics` row count | Active Meters, Meter Count |
| `electrical.health_breakdown` | Approved Model | `M-004`; uses approved per-category health model; source inputs required | Health By Asset, Health Breakdown, Risk Contributors |
| `electrical.alert_events` | Approved Model | `M-011`; requires alert/event source contract or generated event persistence | Active Alerts, Alert History, Notes, Recent Health Events |
| `electrical.peak_events` | Approved Model | `M-011`, `M-012`; requires peak-event/time-series source contract | Peak Events, Full Event Analysis, Demand Spike |
| `electrical.load_trends` | Blocked - Needs Source Contract | `M-012`; no approved screen trend payload | Load Over Time, Demand Timeline, Load Comparison |
| `electrical.losses` | Approved Model | `M-005`, `M-009`; uses approved losses model; source inputs required | Total Losses, Loss Reduction, Action Plan |
| `electrical.write_actions` | Manual / Write Model Required | `M-014`; export/configure/acknowledge/note/work-order controls are shell actions only | Export, Configure Alerts, Acknowledge, Add Note, Create Work Order |

## Digital Twin

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `digital_twin.id` | Direct Data | `tracking.digital_twin.id` | Twin ID |
| `digital_twin.label` | Direct Data | `tracking.digital_twin.label` | Twin Name, Selected Twin |
| `digital_twin.status` | Direct Data | `tracking.digital_twin.status` | Twin Status, Approved/Locked State |
| `digital_twin.version` | Direct Data | `tracking.digital_twin.version_number` | Version |
| `digital_twin.updated_at` | Direct Data | `tracking.digital_twin.updatedAt` / `approved_at` | Last Updated |
| `digital_twin.notes` | Direct Data if populated | `tracking.digital_twin.notes` | Twin Notes |
| `digital_twin.canvas_layout` | Direct Data / No Data | use `tracking.asset` and `tracking.asset_relationship`; no layout coordinate table exists | One-Line Canvas, Asset Graph |
| `digital_twin.asset_summary` | Direct Data / Calculated | counts and ratings from `tracking.asset` | Asset Summary, Capacity By Level |

## Models And Questions

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `model.transformer_step_up` | Approved Model | `M-006`; uses approved transformer sizing rule and standard size ladder | Next Transformer Size, Step Up Transformer |
| `model.upgrade_avoided` | Approved Model | `M-006`; depends on transformer/switchgear/feeder model | Avoided Upgrade, Upgrade Avoided |
| `model.deferral_duration` | Approved Model | `M-006`, `M-007`; needs load growth + threshold model | Deferral Duration, Years Deferred |
| `model.load_growth` | Approved Model | `M-007`; uses approved load growth model; source inputs required | Growth Rate, Forecast Growth |
| `model.peer_benchmark` | No Data / Question | no benchmark source | Similar Sites, Industry Average, Best in Class |
| `model.implementation_roadmap` | Approved Model | `M-013`; no approved scheduling/action source | Roadmap, Phase 1/2/3, Implementation Dates |
| `model.expansion_readiness` | Approved Model | uses approved scoring model; source inputs required | Expansion Readiness, Readiness Score |
| `model.bottleneck_analysis` | Approved Model | `M-006`, `M-013`; uses approved bottleneck detection model; source inputs required | Bottleneck, Capacity Constraint |

## Scenarios And Optimization

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `scenario.configuration` | Manual / Write Model Required | `M-013`; no persisted scenario configuration source | Scenario Inputs, Selected Option, Simulation Controls |
| `scenario.waterfall` | Approved Model | `M-013`; depends on approved simulation model | Simulation Waterfall, Incremental Impact |
| `scenario.comparison` | Approved Model | `M-013`; depends on approved scenario model and assumptions | Scenario Comparison, Before/After Options |
| `scenario.assumptions` | Manual / Write Model Required | `M-013`; no approved assumption store/source | Assumptions, Input Parameters |
| `optimization.opportunities` | Approved Model | `M-013`; uses approved ranking model; requires opportunity source/action catalog | Opportunity Table, Ranked Actions |
| `optimization.unlock_breakdown` | Approved Model | `M-013`; uses approved action-level capacity unlock model; source inputs required | Capacity Unlock Summary, Unlock By Action |

## Documents And Reports

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `documents.name` | Direct Data if scoped rows exist | `ecbs_os.documents.file_name` | Document Name, File Name, Package Item, Search Result Title |
| `documents.type` | Direct Data / Calculated | `ecbs_os.documents.document_type`, or file extension from `file_name` if needed | Type, PDF/JPG/XLSX/DWG, File Type |
| `documents.status` | Direct Data if scoped rows exist | `ecbs_os.documents.status` | Uploaded, Pending Review, Current, Document Status |
| `documents.uploaded_by` | Direct Data if populated; otherwise No Data / Question | `ecbs_os.documents.uploaded_by`; no approved user table mapping yet | Uploaded By, Created By, Reviewer User |
| `documents.uploaded_at` | Direct Data | `ecbs_os.documents.created_at` from `BaseEntity.CreatedAtUtc` | Uploaded On, Date Uploaded, Created Date |
| `documents.updated_at` | Direct Data if populated | `ecbs_os.documents.updated_at` from `BaseEntity.UpdatedAtUtc` | Last Modified, Updated On |
| `documents.storage_uri` | Direct Data if populated | `ecbs_os.documents.storage_uri` | Download URL, Storage Path |
| `documents.folder` | Manual / Write Model Required | `M-014`; no approved folder entity/model in `ecbs_os` | Folder, Folder Tree, Engineering Folder, Folder Counts |
| `documents.version_history` | Manual / Write Model Required | `M-014`; no approved document version table/model | Version, Current Version, Superseded Version, Restore Version |
| `documents.review_workflow` | Manual / Write Model Required | `M-014`; no approved review/approval workflow table/model | Review Queue, Reviewer, Priority, Due Date, Pending Review |
| `documents.permissions` | Manual / Write Model Required | `M-014`; no approved document/folder RBAC model | Roles, Users, Access Level, Permission Matrix |
| `documents.export_package` | Manual / Write Model Required | `M-014`; no approved package/export artifact table/model | Export Package, Package Size, Selected Items, Security |
| `documents.upload_command` | Manual input / write model required | requires approved file storage policy and command API | Upload Wizard, Drag & Drop, File Classification |
| `documents.search` | Calculated only after scoped document rows exist | filter approved document rows; otherwise explicit No Data | Search Results, Result Count, Highlight |
| `documents.client_project_docs` | No Data / Question | no approved document index source for Client Management batch | Documents, Uploaded Documents |
| `documents.uploaded_project_docs` | No Data / Question | no approved upload metadata source in current screen payload | Utility Bill Upload, One-Line Drawings |
| `reports.generated` | Manual / Write Model Required | `M-014`; no approved `report_runs` or generated-report source yet | Generated Reports, Report Status |
| `reports.generated_content` | Manual / Write Model Required | `M-014`; requires report generation engine/model | Proposal Report, Site Assessment Report |
| `form.new_client_input` | Manual input | user-entered form state | Add New Client fields |
| `form.new_project_input` | Manual input | user-entered form state | New Project Scanning fields |

## Deployments

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `deployment.name` | Direct Data if present | `ecbs_os.deployments.name` | Deployment ID, Deployment Name |
| `deployment.status` | Direct Data if present | `ecbs_os.deployments.status` | Deployment Status, Overall Status |
| `deployment.commissioned_on` | Direct Data if present | `ecbs_os.deployments.commissioned_on` | Commissioned On, Completion Date |
| `deployment.duration` | Calculated only when approved start/end timestamps exist | start/end timestamps | Duration, Total Duration |
| `deployment.technician` | No Data / Question | no approved technician assignment field | Technician, Closed By, Reviewer |
| `deployment.workflow_progress` | Approved Model | `M-015`; no approved workflow state table | Steps Complete, Completion %, Workflow Progress |
| `deployment.checklist_items` | Manual / Write Model Required | `M-015`; no approved checklist item/status schema | Checklist Rows, Final Checklist, Acceptance Checklist |
| `deployment.checklist_counts` | Approved Model | `M-015`; inherits `deployment.checklist_items` | Completed/Pending/Warning/Error Counts |
| `deployment.signoff_records` | Manual / Write Model Required | `M-015`; no approved sign-off/acceptance schema | Signature, Customer Acceptance, Reviewer Sign-Off |
| `deployment.identity_verification` | No Data / Question | no approved OTP/GPS verification store | OTP Verified, GPS Location, Identity Verification |
| `deployment.test_results` | Manual / Write Model Required | `M-015`; no approved test-result table | Tests Passed, Open Issues, Test Summary |
| `deployment.quality_score` | Approved Model | `M-015`; uses approved quality/readiness scoring model; requires checklist/test/issue inputs | Data Quality, Readiness Score, System Readiness |
| `deployment.performance_delta` | Approved Model | `M-015`; uses approved pre/post baseline rules | PF Improvement, THD Improvement, kVA Reduction |
| `deployment.photos` | No Data / Question | no approved deployment photo metadata source | Photos, Recent Captured Photos |
| `deployment.handover_contact` | No Data / Question | no approved handover contact source | Operations Contact, Handover Confirmation |
| `deployment.installation_checklist` | Manual / Write Model Required | `M-015`; no approved deployment checklist/workflow table | Installation Checklist, Completed Tasks, Required Items |
| `deployment.installation_status_detail` | Direct Data if present; otherwise No Data | `ecbs_os.deployments.status`; detailed step status not modeled | Installation Status, Operational Status |
| `deployment.field_notes` | No Data / Question | no approved notes/capture table for deployment workflow | Notes, Comments, Field Notes |
| `deployment.photo_gallery` | No Data / Question | no approved photo metadata/storage model separate from documents | Photo Gallery, Recent Captured Photos, Captured By |
| `deployment.add_equipment_form` | Manual / Write Model Required | requires approved device/equipment command API | Add Equipment fields, Save & Add To Inventory |
| `deployment.test_results` | Manual / Write Model Required | `M-015`; no approved deployment testing/checklist result table | Passed, Warning, Failed, Not Tested, Testing Checklist |
| `deployment.test_issue_form` | Manual / Write Model Required | requires approved deployment issue/action command API | Add Issue, Issue Title, Recommended Action |
| `deployment.issue_records` | Manual / Write Model Required | `M-015`; no approved issue/action table | Open Issues, Assigned To, Due Date, Severity |
| `deployment.testing_annotations` | Manual / Write Model Required | `M-015`; no approved testing annotation/event table | Event Annotations, Add Annotation |
| `deployment.testing_export` | Manual / Write Model Required | `M-014`, `M-015`; no approved export/report artifact model for testing screens | Export PDF, Export Trend, Report Package |

## Devices And Field Equipment

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `device.name` | Direct Data if rows exist | `ecbs_os.devices.name` | Equipment Name, Tag, Asset Name |
| `device.kind` | Direct Data if rows exist | `ecbs_os.devices.kind` | Equipment Type, Device Type |
| `device.serial_number` | Direct Data if rows exist | `ecbs_os.devices.serial_number` | Serial Number, Device Serial |
| `device.is_main` | Direct Data if rows exist | `ecbs_os.devices.is_main` | Main Device, Primary Equipment |
| `device.last_communicated_at` | Direct Data if rows exist | `ecbs_os.devices.last_communicated_at` | Last Seen, Last Communication |
| `device.rating` | No Data / Question | no approved rating/capacity/voltage fields on current `Device` entity | Rating, Capacity, Voltage, kVA, kVAR |
| `device.location` | No Data / Question | no approved equipment location/panel field on current `Device` entity | Location, Panel, Electrical Room |
| `device.manufacturer_model` | No Data / Question | no approved manufacturer/model fields on current `Device` entity | Manufacturer, Model |

## Deployment Telemetry Readings

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `telemetry.kilowatts` | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.kilowatts` | kW, Total kW |
| `telemetry.kilovolt_amps` | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.kilovolt_amps` | kVA, Total kVA |
| `telemetry.kilowatt_hours` | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.kilowatt_hours` | kWh, Energy |
| `telemetry.power_factor` | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.power_factor` | PF, Power Factor |
| `telemetry.pre_post_delta` | Calculated only when pre and post scoped rows exist | latest minus earliest `ecbs_os.telemetry_intervals` values | Improvement, Delta, Before/After |
| `telemetry.voltage` | No Data / Question | not present on current `TelemetryInterval` entity | Voltage L-L, Voltage L-N |
| `telemetry.frequency` | No Data / Question | not present on current `TelemetryInterval` entity | Frequency, Hz |
| `telemetry.thd` | No Data / Question | not present on current `TelemetryInterval` entity | THD, Harmonic Distortion |
| `telemetry.phase_current` | No Data / Question | not present on current `TelemetryInterval` entity | Current Verification, Phase A/B/C Current |
| `telemetry.testing_quality` | Approved Model | `M-015`; uses approved thresholds/result rules over telemetry | Values Within Expected Range, Data Quality, Compliance |

## Manual / AI Narrative Fields

| Field key | Classification | Source / rule | Same or derivative labels |
|---|---|---|---|
| `narrative.key_insight` | Direct Data when surfaced; otherwise No Data / Question | shared API `keyInsight` or approved AI/manual source | Key Insight, AI Insight |
| `narrative.recommendations` | Approved Model | `M-013`; requires source/model/AI ownership and deterministic rule approval | Recommendations, Recommended Actions |
| `narrative.risk_summary` | Approved Model | `M-004`, `M-006`, `M-011`; uses approved risk model | Risk Of Overload, Risk Summary |
| `narrative.operational_status` | Calculated when based on thresholds | direct thresholding from real fields | All Systems Operational, Good, Warning |

## How To Use

1. Map a screen label to a field key.
2. Reuse the field key classification.
3. If `Direct Data`, wire source.
4. If `Calculated`, wire deterministic formula.
5. If `Approved Model`, wire through backend model services when required inputs/source contracts exist.
6. If `No Data / Question`, stop and propagate that status to same/derivative fields.
