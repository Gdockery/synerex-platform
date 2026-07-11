# ECBS Screen Batch Checklist: Deployment Testing Verification

## Batch Identity

- Batch name: Deployment Testing Verification
- Date: 2026-07-11
- Module / route family: Deployment App / Testing & Verification
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 55-58.
- Blocked sibling: validation sequence 59 is `INVALID_CONSTITUTION_BLOCKER`, so it is not included.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Testing & Verification - Add Issue | `/operations/deployments/1/testing-verification?mode=add-issue` | `ECBS_Deployment App - Testing & Verification - Add Issue screen.png` | Deployed / HTTP 200 |
| 2 | Testing & Verification - View Details | `/operations/deployments/1/testing-verification?mode=details` | `ECBS_Deployment App - Testing & Verification - View Details screen.png` | Deployed / HTTP 200 |
| 3 | Testing & Verification - View Trend | `/operations/deployments/1/testing-verification?mode=trend` | `ECBS_Deployment App - Testing & Verification - View Trend screen.png` | Deployed / HTTP 200 |
| 4 | Testing & Verification | `/operations/deployments/1/testing-verification` | `ECBS_Deployment App - Testing & Verification screen.png` | Deployed / HTTP 200 |

## Constitution Gates

- [x] `SITE != PROJECT != DEPLOYMENT` checked.
- [x] Deployment testing screens are scoped to one deployment/project.
- [x] Invalid sequence 59 is not implemented.
- [x] No UI invented beyond approved screenshots.
- [x] Existing TSX look and feel preserved.
- [x] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

Classify reusable field families, not every duplicate label.

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `deployment.name` | deployment id/name | shell/header | Direct Data if present | `ecbs_os.deployments.name` | Wire |
| `deployment.status` | overall status | shell/header/status | Direct Data if present | `ecbs_os.deployments.status` | Wire |
| `deployment.technician` | technician/assigned to/reviewer | header/issues | No Data / Question | no approved technician/user assignment model | Show No Data |
| `deployment.test_results` | passed/warning/failed rows, test list | testing panels/tables | No Data / Question | no approved test-result/checklist schema | Show No Data |
| `deployment.test_issue_form` | add issue fields | Add Issue modal | Manual input / write model required | no approved issue command/table in scope | Leave shell / No Data |
| `deployment.issue_records` | open issues/actions | issue cards/tables | No Data / Question | no approved issue/action table | Show No Data |
| `deployment.quality_score` | data quality/compliance | detail panels | No Data / Question | no approved quality scoring model | Show No Data |
| `telemetry.kilowatts` | Total kW | performance cards/tables | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.kilowatts` | Wire |
| `telemetry.kilovolt_amps` | kVA | performance details | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.kilovolt_amps` | Wire |
| `telemetry.kilowatt_hours` | kWh | performance details | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.kilowatt_hours` | Wire |
| `telemetry.power_factor` | Power Factor | performance cards/tables | Direct Data if scoped rows exist | `ecbs_os.telemetry_intervals.power_factor` | Wire |
| `telemetry.pre_post_delta` | change/improvement | trend/details | Calculated only when pre and post rows exist | latest minus earliest scoped telemetry rows | Wire |
| `telemetry.voltage_frequency_thd_current` | voltage, frequency, THD, current | testing/trend/detail panels | No Data / Question | not present on current `TelemetryInterval` entity | Show No Data |

## API / Data Contract

- Read endpoint(s): reuse `GET /api/v1/deployments/{deploymentId}/field-workflow`.
- Write command endpoint(s): none in this batch.
- Existing DTOs reused: `DeploymentFieldWorkflowData`.
- New DTOs: none planned.
- `tracking` tables queried: none.
- `ecbs_os` tables queried/written: read `deployments`, `projects`, `sites`, `devices`, `documents`, `telemetry_intervals`. No writes.

## Write Model Decision

Visible add issue, save draft, export, annotation, and corrective-action controls exist, but this batch is read-only.

| Action | UI control | Endpoint | Target table(s) | Writes tracking? | Sync later? |
|---|---|---|---|---|---|
| Add issue | Add Issue modal | Not implemented | Future deployment issue/action table | No | Yes |
| Save testing verification | Save Draft / Next | Not implemented | Future test-result/checklist table | No | Yes |
| Export details/trend | Export PDF / Export | Not implemented | Future report/export model | No | Yes |
| Add annotation | Add Annotation | Not implemented | Future annotation/event table | No | Yes |

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Testing & Verification | Add Issue | `/operations/deployments/1/testing-verification?mode=add-issue` | Query mode route exists / HTTP 200 |
| Testing & Verification | View Details | `/operations/deployments/1/testing-verification?mode=details` | Query mode route exists / HTTP 200 |
| Testing & Verification | View Trend | `/operations/deployments/1/testing-verification?mode=trend` | Query mode route exists / HTTP 200 |
| Testing & Verification | Next: Documentation | `/operations/deployments/1/documents/documentation-screen` | Footer link wired / HTTP 200 target from previous batch |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Real deployment GUID fixture | `deploymentId=1` is route smoke data only and returns No Data. | Real test/performance validation | Need known deployment GUID with telemetry and test rows |
| Test result/checklist schema | No approved testing table/model. | passed/warning/failed counts, checklist rows, compliance | Define deployment test-result model |
| Issue/action table | No approved issue/action schema. | open issues, severity, assigned to, due date | Define issue/action write model |
| Technician/user assignment | No approved technician/user assignment field. | technician, assigned to, reviewed by | Define assignment/user model |
| Voltage/current/THD/frequency telemetry | Not present on current `TelemetryInterval`. | electrical verification and power quality rows | Define source/model or show No Data |
| Export/annotation model | No approved export or annotation table. | PDF exports, trend annotations | Define report/export/annotation model |

## Verification Config

- Verification config path: planned `verification/deployment-testing-verification.json`
- Mutating checks required? No
- Browser click checks required? Yes, one testing route plus one query-mode smoke check.

Required before deploy:

- [x] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `python3 scripts/ecbs_batch_verify.py verification/deployment-testing-verification.json --base-url http://100.91.109.59:8080 --api-base-url http://100.91.109.59:5090`
- [x] Browser smoke check
- [x] Dev deploy completed
- [x] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Quote `[deploymentId]` paths in shell commands. | Always quote dynamic route paths. |
| `deploymentId=1` is route smoke data only. | Expect explicit `No Data` unless a real deployment GUID is provided/found. |
| Browser refs/screenshots can go stale. | Take a fresh snapshot after navigation before judging UI. |
| Shared row types are narrow. | Check TypeScript DTOs before assuming fields. |
| Query-mode routes share one Next.js page. | Verify every mode explicitly. |
| Invalid sequence 59 is nearby. | Do not implement invalid screenshots from sequence order alone. |
| Browser navigate can attach a stale screenshot. | Trust the URL/snapshot, then take a fresh screenshot before judging visuals. |

## Checkpoint Summary

- Screens completed: 4 Testing & Verification query-mode routes are wired and deployed.
- Direct/Calculated fields wired: deployment shell identity/status via field workflow payload, and scoped telemetry `kW`, `kVA`, `kWh`, `power factor`, plus simple pre/post deltas when scoped rows exist.
- Explicit `No Data` decisions: test-result/checklist schema, passed/warning/failed counts, issue/action records, technician/assignee/due dates, compliance/quality scoring, voltage/current/frequency/THD, detailed trend/chart series, annotations, exports, and add-issue command writes.
- Write actions implemented: none. Add Issue, save draft, exports, and annotations remain shell controls until their write models are approved.
- Verification results: local `dotnet build`, local `npm run lint`, local `npm run build`, remote backend build, remote frontend Docker build, dev deploy, deployed verifier, and browser smoke check passed.
- Dev URL(s): `http://100.91.109.59:8080/operations/deployments/1/testing-verification?mode=trend` plus the main/add-issue/details routes listed above.
- Remaining questions: real deployment GUID with telemetry/test rows needed for non-No-Data validation; test-result, issue/action, technician assignment, quality scoring, export, and annotation write models need decisions before functional testing workflow actions.

