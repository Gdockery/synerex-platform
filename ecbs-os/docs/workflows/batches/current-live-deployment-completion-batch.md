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
| 1 | Current Analysis | `/enterprise/current-analysis` | `ECBS-Current Analysis Screenshot.png` | Deployed / HTTP 200 |
| 2 | Live Data | `/data-analytics/live-data/live-data` | `ECBS-Live Data Screenshot.png` | Deployed / HTTP 200 |
| 3 | Customer Acceptance | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-final-validation-checklist-customer-acceptance-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist - Final Validation Checklist - Customer Acceptance screen.png` | Deployed / HTTP 200 |
| 4 | Final Validation Checklist | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist screen.png` | Deployed / HTTP 200 |
| 5 | Deployment Closure Confirmation | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-deployment-closure-confirmation-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist screen - Sign Off Capture - Deployment Closure Confirmation screen.png` | Deployed / HTTP 200 |
| 6 | Sign-Off Capture | `/operations/deployments/1/completion/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard - Final Validation Checklist screen - Sign Off Capture screen.png` | Deployed / HTTP 200 |
| 7 | Post-Completion Dashboard | `/operations/deployments/1/completion/completion-post-completion-dashboard-screen` | `ECBS_Deployment App - Completion - Post-completion dashboard screen.png` | Deployed / HTTP 200 |
| 8 | Completion Screen | `/operations/deployments/1/completion/completion-screen` | `ECBS_Deployment App - Completion screen.png` | Deployed / HTTP 200 |

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

## Quirks Found During Execution

Keep this section updated as the batch is wired, verified, and deployed so these same issues do not get rediscovered in later batches.

| Quirk | Where it showed up | Rule for next time |
|---|---|---|
| `zsh` treats `[deploymentId]` in route paths as a glob. | `git add ecbs-os/frontend/src/app/operations/deployments/[deploymentId]/...` failed with `no matches found`. | Always quote Next.js dynamic route paths in shell commands. |
| `DashboardKpiTone` does not accept every API tone string. | `AnalysisDataScreens.tsx` failed build when API DTO tone included `red`. | Normalize API KPI tones to the local dashboard union before passing them to `DashboardKpi` components. |
| `AnalysisSummaryRow` only has `label` and `value`. | Deployment completion widgets initially assumed a `detail` field. | Check shared TypeScript row types before adding derived display text; use explicit source notes if detail is not modeled. |
| Deployment route id `1` is not an existing ECBS deployment GUID. | `/api/v1/deployments/1/completion` correctly returns an explicit `No Data` payload. | Treat `deploymentId=1` as a route/render smoke test only; use a real GUID when validating real deployment data. |
| The dev deploy wrapper requires DB env vars from the local shell. | `scripts/ecbs_dev_deploy.py` stopped until `ECBS_CONNECTION_STRING` and `TRACKING_DB_*` were provided. | If env vars are missing locally, read the current dev API process env and reuse it for the deploy command. |
| Dev can have duplicate stale API processes before deploy. | Two matching `ECBS.Api` processes were observed before restart. | Use the deploy script restart step and verify a single process after deployment. |
| Browser click output can be misleading for Next.js links. | A browser click focused a link while the reported URL did not immediately change. | Inspect rendered `href`s with browser CDP and use route HTTP checks as the source of truth when click metadata stalls. |
| Browser refs go stale after a route transition. | A reused ref pointed to a different element after the page changed. | Always take a fresh `browser_snapshot` after a click or navigation before clicking the next element. |
| Browser automation viewport may hide footer links. | `browser_click` could not scroll a footer link into view in the small browser viewport. | Use `browser_scroll` with `scrollIntoView: true` on the fresh ref, or fall back to route HTTP checks for already-known links. |
| Accessibility snapshot and DOM link inspection can disagree. | Snapshot reported a footer item as a link, but `document.querySelectorAll('a')` did not find the same text after the click/focus state. | For route verification, combine snapshot evidence with explicit HTTP route checks; do not trust one browser-tool view alone. |
| Raw route `200` is necessary but not sufficient. | All deployed routes returned HTML, but browser snapshot was still needed to confirm the No Data payload rendered. | Do both HTTP route/API checks and at least one browser snapshot/click check for interactive batches. |

## Checkpoint Summary

- Screens completed: 8 routes in this batch are wired and deployed.
- Direct/Calculated fields wired: Current/Live KPIs and summaries from `tracking`; deployment status/project/site/document/equipment summaries from `ecbs_os` where a valid deployment exists.
- Explicit `No Data` decisions: unsupported deployment checklist counts, signatures, identity verification, quality/readiness scores, generated reports, photos, handover contacts, raw chart trends, harmonic spectrum, and `deploymentId=1` missing-record state.
- Write actions implemented: none; sign-off and customer acceptance submits remain blocked until the write command model is approved.
- Verification results: `npm run lint`, frontend `npm run build`, backend `dotnet build`, dev deploy, 8 deployed frontend route `200` checks, and 3 API endpoint `200` checks passed.
- Dev URL(s): `http://100.91.109.59:8080/enterprise/current-analysis`, `http://100.91.109.59:8080/data-analytics/live-data/live-data`, and the six `/operations/deployments/1/completion/...` routes listed above.
- Remaining questions: Commissioning Summary Report route ambiguity; real deployment GUID needed for non-No-Data deployment completion validation; write model for sign-off/acceptance commands not yet approved.

