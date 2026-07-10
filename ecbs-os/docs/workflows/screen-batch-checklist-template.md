# ECBS Screen Batch Checklist Template

Copy this file for each 5-8 screen implementation batch.

## Batch Identity

- Batch name:
- Date:
- Module / route family:
- Source flow map section:
- Validation-approved screenshots:

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 |  |  |  | Pending |
| 2 |  |  |  | Pending |
| 3 |  |  |  | Pending |
| 4 |  |  |  | Pending |
| 5 |  |  |  | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Screen may show multi-client / multi-site data only if allowed by Constitution Rule 11 or explicit docs.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

Classify reusable field families, not every duplicate label.

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
|  |  |  | Direct Data / Calculated / Estimated / No Data |  | Wire / No Data / Question |

## API / Data Contract

- Read endpoint(s):
- Write command endpoint(s):
- Existing shared endpoint reused:
- New DTOs:
- Existing DTOs extended:
- `tracking` tables queried:
- `ecbs_os` tables queried/written:

## Write Model Decision

Complete only if the batch contains visible form/save/generate actions.

| Action | UI control | Endpoint | Target table(s) | Writes tracking? | Sync later? |
|---|---|---|---|---|---|
|  |  |  | `ecbs_os.*` | No | Yes / No |

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
|  |  |  |  |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
|  |  |  |  |

## Verification Config

- Verification config path:
- Mutating checks required? Yes / No
- Browser click checks required? Yes / No

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

