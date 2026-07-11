# ECBS Screen Batch Checklist: Deployment Documentation Children

## Batch Identity

- Batch name: Deployment Documentation Children
- Date: 2026-07-10
- Module / route family: Deployment App / Documentation
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 39-46.
- Deferred sibling: sequence 47 `Deployment App - Documentation screen` parent route, because this batch is bounded to eight child screens.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Document Viewer | `/operations/deployments/1/documents/documentation-document-viewer-screen` | `ECBS_Deployment App - Documentation - Document Viewer screen.png` | Pending |
| 2 | Export Package Builder | `/operations/deployments/1/documents/documentation-export-package-builder-screen` | `ECBS_Deployment App - Documentation - Export Package Builder screen.png` | Pending |
| 3 | Folder Detail View | `/operations/deployments/1/documents/documentation-folder-detail-view-screen` | `ECBS_Deployment App - Documentation - Folder Detail View screen.png` | Pending |
| 4 | Permissions / Access Control | `/operations/deployments/1/documents/documentation-permissions-access-control-screen` | `ECBS_Deployment App - Documentation - Permissions  Access Control screen.png` | Pending |
| 5 | Review / Approval Queue | `/operations/deployments/1/documents/documentation-review-approval-queue-screen` | `ECBS_Deployment App - Documentation - Review  Approval Queue screen.png` | Pending |
| 6 | Search Results Page | `/operations/deployments/1/documents/documentation-search-results-page-screen` | `ECBS_Deployment App - Documentation - Search Results Page screen.png` | Pending |
| 7 | Upload Wizard | `/operations/deployments/1/documents/documentation-upload-wizard-screen` | `ECBS_Deployment App - Documentation - Upload Wizard screen.png` | Pending |
| 8 | Version History | `/operations/deployments/1/documents/documentation-version-history-screen` | `ECBS_Deployment App - Documentation - Version History screen.png` | Pending |

## Constitution Gates

- [ ] `SITE != PROJECT != DEPLOYMENT` checked.
- [ ] Documentation is scoped to a deployment/project, not invented global data.
- [ ] No UI invented beyond approved screenshots.
- [ ] Existing TSX look and feel preserved.
- [ ] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

Classify reusable field families, not every duplicate label.

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `document.name` | document name, package contents, search result title | Document tables/cards/header | Direct Data if scoped rows exist | `ecbs_os.documents.file_name` | Wire |
| `document.type` | PDF/JPG/XLSX/DWG, Type | Document tables/cards | Direct Data if scoped rows exist | `ecbs_os.documents.document_type` or extension from filename | Wire / calculate extension |
| `document.status` | Uploaded, Pending Review, Current | Document metadata/status | Direct Data if scoped rows exist | `ecbs_os.documents.status` | Wire |
| `document.uploaded_by` | Uploaded By | Document metadata/tables | Direct Data if stored | `ecbs_os.documents.uploaded_by`; otherwise no user model | Wire or No Data |
| `document.uploaded_at` | Uploaded On/Date Uploaded | Document metadata/tables | Direct Data if stored | Current `DocumentMetadata` does not clearly expose created/upload timestamp in DTO audit pending | Wire or No Data |
| `document.storage_uri` | Download link/source path | Download actions | Direct Data if stored | `ecbs_os.documents.storage_uri` | Do not download; show No Data if missing |
| `document.folder` | Folder, Engineering, folder counts | Folder views/package builder | No Data / Question | No approved folder entity/model in `ecbs_os` yet | Show No Data |
| `document.version_history` | Version 1/current/superseded rows | Version History | No Data / Question | No version table/model approved | Show No Data |
| `document.review_queue` | reviewer, priority, due date, review status | Review Queue | No Data / Question | No review workflow table/model approved | Show No Data |
| `document.permissions` | users, roles, access levels | Permissions | No Data / Question | No RBAC/document permissions model approved | Show No Data |
| `document.search_results` | search term/result count/highlights | Search Results | Calculated only after source rows exist | Filter `documentRows` by term when implemented; otherwise No Data | Wire minimal / No Data |
| `document.export_package` | selected items, package size/security | Export Package Builder | No Data / Question | No package/export model approved | Show No Data |
| `document.upload_wizard` | upload target/classification form | Upload Wizard | Manual input/write model not in scope | Needs write model and file-storage policy | Leave static form shell / No Data |

## API / Data Contract

- Read endpoint(s): planned `GET /api/v1/deployments/{deploymentId}/documentation`
- Write command endpoint(s): none in this batch.
- Existing shared endpoint reused: deployment identity/status pieces may reuse existing deployment completion data service patterns.
- New DTOs: planned documentation payload using shared rows: `documentRows`, `metadataRows`, `folderRows`, `permissionRows`, `reviewRows`, `searchRows`, `versionRows`, `message/state`.
- Existing DTOs extended: prefer not to extend `DeploymentCompletionData`; keep documentation contract separate.
- `tracking` tables queried: none unless audit finds a legacy document source. Default source is `ecbs_os`.
- `ecbs_os` tables queried/written: read `documents`, plus deployment/project/client/site context where available. No writes.

## Write Model Decision

Visible upload, package, permission, review, restore-version, and download actions exist in the screenshots, but this batch is read-only.

| Action | UI control | Endpoint | Target table(s) | Writes tracking? | Sync later? |
|---|---|---|---|---|---|
| Upload document | Upload Wizard `Upload` | Not implemented in this batch | Future `ecbs_os.documents` + storage policy | No | Yes |
| Export package | Export Package Builder actions | Not implemented in this batch | Future report/export package tables | No | Yes |
| Permission edits | Permissions `Save Changes` | Not implemented in this batch | Future document permissions model | No | Yes |
| Review/approval | Review Queue actions | Not implemented in this batch | Future review workflow model | No | Yes |
| Restore version | Version History action | Not implemented in this batch | Future document version table | No | Yes |

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Documentation parent | Document Viewer action | `/operations/deployments/1/documents/documentation-document-viewer-screen` | Pending audit |
| Documentation parent | Export Package Builder action | `/operations/deployments/1/documents/documentation-export-package-builder-screen` | Pending audit |
| Documentation parent | Folder Detail action | `/operations/deployments/1/documents/documentation-folder-detail-view-screen` | Pending audit |
| Documentation parent | Permissions / Access Control action | `/operations/deployments/1/documents/documentation-permissions-access-control-screen` | Pending audit |
| Documentation parent | Review Approval Queue action | `/operations/deployments/1/documents/documentation-review-approval-queue-screen` | Pending audit |
| Documentation parent | Search Results action | `/operations/deployments/1/documents/documentation-search-results-page-screen` | Pending audit |
| Documentation parent | Upload Wizard action | `/operations/deployments/1/documents/documentation-upload-wizard-screen` | Pending audit |
| Document Viewer | Version History action | `/operations/deployments/1/documents/documentation-version-history-screen` | Pending audit |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Real deployment GUID fixture | `deploymentId=1` is only a smoke-test route and returns No Data from ECBS API. | Real document rows for deployment-scoped screens | Need known deployment GUID with documents, or seed/write model decision |
| Folder model | No approved folder entity exists in current `ecbs_os` write model. | folder counts, folder tree, folder permissions, folder detail cards | Decide if folders are a first-class table or derived labels |
| Document versioning | No version table/model approved. | version history, restore version, current/superseded flags | Define version persistence model |
| Review workflow | No review/approval table approved. | reviewer, priority, due date, review status, queue metrics | Define document review workflow |
| Document permissions | No permissions/RBAC table approved for document folders. | access matrix, roles, audit trail, permission save | Define permissions model |
| Export package model | No package/export artifact table approved. | selected content counts, package size, audit/security options | Define report/export package model |
| Upload/file storage policy | No storage adapter or file-upload command approved. | upload wizard submission and file metadata writes | Define storage backend and command API |

## Verification Config

- Verification config path: planned `verification/deployment-documentation-children.json`
- Mutating checks required? No
- Browser click checks required? Yes, one documentation route plus one action-link/href smoke check.

Required before deploy:

- [ ] `dotnet build ECBS.sln`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/deployment-documentation-children.json`
- [ ] Browser click check for interactive flows, if applicable
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Quote `[deploymentId]` paths in shell commands. | Always quote dynamic route paths. |
| `deploymentId=1` is route smoke data only. | Expect explicit `No Data` unless a real deployment GUID is provided/found. |
| Browser refs go stale after navigation. | Take a fresh snapshot after every click. |
| Browser link checks can disagree with DOM/URL output. | Verify routes with HTTP checks plus targeted snapshots. |
| Shared row types are narrow. | Check TypeScript DTOs before assuming row properties like `detail`. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

