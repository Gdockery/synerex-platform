# ECBS Screen Batch Checklist: Current / Live / Deployment Completion

## Batch Identity

- Batch name: Current / Live / Deployment Completion
- Date: 2026-07-10
- Module / route family: Current Analysis, Data & Analytics, Deployment App
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 30-31 and 33-38. Sequence 32 is route-blocked; see No Data / Question Queue.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Current Analysis | `/enterprise/current-analysis` | `ECBS-Current Analysis Screenshot.png` | Pending |
| 2 | Live Data | `/data-analytics/live-data/live-data` | `ECBS-Live Data Screenshot.png` | Pending |
| 3 | Customer Acceptance | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-final-validation-checklist-customer-acceptance-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist - Final Validation Checklist - Customer Acceptance screen.png` | Pending |
| 4 | Final Validation Checklist | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist screen.png` | Pending |
| 5 | Deployment Closure Confirmation | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-deployment-closure-confirmation-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist screen - Sign Off Capture - Deployment Closure Confirmation screen.png` | Pending |
| 6 | Sign-Off Capture | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist screen - Sign Off Capture screen.png` | Pending |
| 7 | Post-Completion Dashboard | `/operations/deployments/1/completion/completion-post-completion-dashboard-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard screen.png` | Pending |
| 8 | Completion Screen | `/operations/deployments/1/completion/completion-screen` | `ECBS_Deployment App - Completion screen.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] No multi-site/client totals outside Enterprise Dashboard or Client Management.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

Classify reusable field families, not every duplicate label.

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| Pending audit | Pending audit | Pending audit | Pending audit | Pending audit | Pending audit |

## API / Data Contract

- Read endpoint(s): pending audit
- Write command endpoint(s): none unless sign-off/acceptance commands are implemented in this batch
- Existing shared endpoint reused: pending audit
- New DTOs: pending audit
- Existing DTOs extended: pending audit
- `tracking` tables queried: pending audit
- `ecbs_os` tables queried/written: pending audit

## Write Model Decision

Complete only if the batch contains visible form/save/generate actions.

| Action | UI control | Endpoint | Target table(s) | Writes tracking? | Sync later? |
|---|---|---|---|---|---|
| Sign-off capture | Signature / submit controls | Pending classification | `ecbs_os.*` if implemented | No | Yes |
| Customer acceptance | Acceptance / signature controls | Pending classification | `ecbs_os.*` if implemented | No | Yes |

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Current Analysis | none in batch | none | Static route |
| Live Data | none in batch | none | Static route |
| Post-Completion Dashboard | Final Validation Checklist | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen` | Pending audit |
| Final Validation Checklist | Sign-Off Capture | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-screen` | Pending audit |
| Sign-Off Capture | Deployment Closure Confirmation | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-deployment-closure-confirmation-screen` | Pending audit |
| Final Validation Checklist | Customer Acceptance | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-final-validation-checklist-customer-acceptance-screen` | Pending audit |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Commissioning Summary Report route | `screenshot_constitution_validation.csv` maps the Commissioning Summary Report, Testing & Verification, Add Issue, View Details, and View Trend screens to the same route. Existing TSX has a `commissioning` variant but the route currently renders `testingVerification`. | Commissioning Summary Report click route and deployed verification | Needs route decision before wiring |

## Verification Config

- Verification config path: pending
- Mutating checks required? No until write commands are approved for sign-off/acceptance
- Browser click checks required? Yes

Required before deploy:

- [ ] `dotnet build ECBS.sln`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py <config>`
- [ ] Browser click check for interactive flows, if applicable
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

