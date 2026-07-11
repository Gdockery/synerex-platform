# ECBS Screen Batch Checklist: Deployment Field Workflow

## Batch Identity

- Batch name: Deployment Field Workflow
- Date: 2026-07-10
- Module / route family: Deployment App / Field Data Entry
- Source flow map section: `ECBS Software Development Project/analysis/ecbs_screen_flow_ascii_map.md`
- Validation-approved screenshots: validation sequence 47-54.

## Screens In Batch

| Order | Screen | Route | Screenshot / HTML reference | Status |
|---:|---|---|---|---|
| 1 | Documentation | `/operations/deployments/1/documents/documentation-screen` | `ECBS_Deployment App - Documentation screen.png` | Wired / local build passed |
| 2 | Add Equipment | `/operations/deployments/1/equipment?mode=add` | `ECBS_Deployment App - Equipment Inventory & Readings - Add Equipment screen.png` | Wired / local build passed |
| 3 | Equipment Inventory & Readings | `/operations/deployments/1/equipment` | `ECBS_Deployment App - Equipment Inventory & Readings screen.png` | Wired / local build passed |
| 4 | Installation Details | `/operations/deployments/1/installation-details-screen` | `ECBS_Deployment App - Installation Details screen.png` | Wired / local build passed |
| 5 | Photo & Document System | `/operations/deployments/1/documents/photo-and-document-system-screen` | `ECBS_Deployment App - Photo & Document System screen.png` | Wired / local build passed |
| 6 | Post-Installation Readings | `/operations/deployments/1/post-installation-readings` | `ECBS_Deployment App - Post-Installation Readings screen.png` | Wired / local build passed |
| 7 | Pre-Installation Readings | `/operations/deployments/1/pre-installation-readings` | `ECBS_Deployment App - Pre-Installation Readings Screen.png` | Wired / local build passed |
| 8 | Site & Installation Details | `/operations/deployments/1/site-and-installation-details-screen` | `ECBS_Deployment App - Site & Installation Details Screen.png` | Wired / local build passed |

## Constitution Gates

- [x] `SITE != PROJECT != DEPLOYMENT` checked.
- [x] Deployment screens are scoped to one deployment/project.
- [x] No UI invented beyond approved screenshots.
- [x] Existing TSX look and feel preserved.
- [x] Missing/unclear fields are stopped or marked `No Data / Question`.

## Field Classification

Classify reusable field families, not every duplicate label.

| Field key | Screen label(s) | Component/panel | Classification | Source / rule | Action |
|---|---|---|---|---|---|
| `deployment.name` | Deployment ID/name | headers/sidebar/meta | Direct Data if present | `ecbs_os.deployments.name` | Wire |
| `deployment.status` | deployment status / install status | headers/status cards | Direct Data if present | `ecbs_os.deployments.status` | Wire |
| `deployment.commissioned_on` | commissioned on / completion date | meta/footer | Direct Data if present | `ecbs_os.deployments.commissioned_on` | Wire |
| `project.name` | project/facility | headers/meta | Direct Data if present | `ecbs_os.projects.name` | Wire |
| `site.name` | site/facility/location | site details/header | Direct Data if present | `ecbs_os.sites.name` or project fallback | Wire |
| `site.address` | address fields | Site Details | Direct Data if present | `ecbs_os.sites.*` or project address fields | Wire |
| `device.name` | equipment name/tag | Equipment tables/cards | Direct Data if rows exist | `ecbs_os.devices.name` | Wire |
| `device.kind` | equipment type | Equipment tables/cards | Direct Data if rows exist | `ecbs_os.devices.kind` | Wire |
| `device.serial_number` | serial number | Equipment details | Direct Data if rows exist | `ecbs_os.devices.serial_number` | Wire |
| `device.rating` | rating/capacity/voltage | Equipment panels | No Data / Question | no approved rating fields on current `Device` entity | Show No Data |
| `device.location` | location/panel | Equipment panels | No Data / Question | no approved device location field | Show No Data |
| `telemetry.interval_values` | pre/post readings, kW/kVA/kWh/PF | Reading cards/tables | Direct Data if scoped telemetry exists | `ecbs_os.telemetry_intervals` latest/earliest scoped rows | Wire |
| `telemetry.voltage_frequency_thd` | voltage/frequency/THD readings | Reading summary | No Data / Question | not present in current `TelemetryInterval` entity | Show No Data |
| `documents.name/type/status` | photo/document rows | Documentation and Photo Docs | Direct Data if scoped rows exist | `ecbs_os.documents` | Wire |
| `deployment.photos` | photos/gallery/captured photos | Photo & Document System | No Data / Question | no approved photo metadata/source separate from documents | Show No Data |
| `deployment.installation_checklist` | checklist rows/progress | Installation Details | No Data / Question | no approved checklist schema | Show No Data |
| `deployment.technician` | installer/technician/verified by | Installation Details | No Data / Question | no approved technician assignment field | Show No Data |
| `form.add_equipment_input` | add equipment fields | Add Equipment | Manual input / write model required | write not approved in this read-only batch | Leave shell / No Data |

## API / Data Contract

- Read endpoint(s): planned `GET /api/v1/deployments/{deploymentId}/field-workflow`
- Write command endpoint(s): none in this batch.
- Existing shared endpoint reused: documentation payload can reuse `/documentation`; new field workflow payload should remain separate.
- New DTOs: planned `DeploymentFieldWorkflowData` with `summaryRows`, `siteRows`, `equipmentRows`, `readingRows`, `documentRows`, `message/state`.
- Existing DTOs extended: avoid extending completion DTO; keep field workflow contract separate.
- `tracking` tables queried: none unless audit finds a directly applicable approved legacy source.
- `ecbs_os` tables queried/written: read `deployments`, `projects`, `sites`, `devices`, `documents`, `telemetry_intervals`. No writes.

## Write Model Decision

Visible add/save/upload/capture actions exist, but this batch is read-only.

| Action | UI control | Endpoint | Target table(s) | Writes tracking? | Sync later? |
|---|---|---|---|---|---|
| Add equipment | Add Equipment `Save & Add to Inventory` | Not implemented | Future `ecbs_os.devices` command | No | Yes |
| Installation details save | Save Draft / Next | Not implemented | Future deployment workflow/checklist tables | No | Yes |
| Capture readings | Capture / manual entry | Not implemented | Future reading capture command | No | Yes |
| Photo/document upload | Upload Files / Take Photo | Not implemented | Future document/photo storage model | No | Yes |

## Route / Action Map

| Source screen | User action | Expected target route | Implemented as link/form/action? |
|---|---|---|---|
| Site & Installation Details | Next: Equipment Inventory | `/operations/deployments/1/equipment` | Route exists / pending deployed check |
| Equipment Inventory | Add Equipment | `/operations/deployments/1/equipment?mode=add` | Implemented as link / pending deployed check |
| Equipment Inventory | Next: Pre-Installation Readings | `/operations/deployments/1/pre-installation-readings` | Route exists / pending deployed check |
| Pre-Installation Readings | Next: Installation Details | `/operations/deployments/1/installation-details-screen` | Route exists / pending deployed check |
| Installation Details | Next: Post-Installation Readings | `/operations/deployments/1/post-installation-readings` | Route exists / pending deployed check |
| Post-Installation Readings | Next: Testing & Verification | `/operations/deployments/1/testing-verification` | Route exists / not wired in this batch |
| Photo & Document System | Next: Documentation | `/operations/deployments/1/documents/documentation-screen` | Route exists / pending deployed check |
| Documentation | child actions | documentation child routes from previous batch | Route exists / pending deployed check |

## No Data / Question Queue

| Field/model | Why blocked | Derivative fields blocked | Question owner / next decision |
|---|---|---|---|
| Real deployment GUID fixture | `deploymentId=1` is route smoke data only and returns No Data. | Real field workflow data validation | Need known deployment GUID with devices/documents/telemetry rows |
| Device installation/rating/location schema | Current `Device` entity has name/kind/serial but not all installation detail fields. | equipment rating, location, manufacturer, model, install status | Define device/equipment write model extensions |
| Deployment checklist/workflow state | No approved checklist table. | checklist rows, progress, validation counts | Define deployment workflow state model |
| Technician/user assignment | No approved technician/user assignment field. | installer, verified by, captured by | Define assignment/user model |
| Photo metadata/storage | No approved photo metadata/storage model. | photo gallery, captured-on/captured-by, photo counts | Define photo storage policy |
| Voltage/frequency/THD readings | Not present on current `TelemetryInterval`. | voltage cards, frequency cards, THD cards | Define telemetry fields/source or show No Data |

## Verification Config

- Verification config path: planned `verification/deployment-field-workflow.json`
- Mutating checks required? No
- Browser click checks required? Yes, one route plus one next-link/action smoke check.

Required before deploy:

- [x] `dotnet build backend/src/ECBS.Api/ECBS.Api.csproj`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] `python3 scripts/ecbs_batch_verify.py verification/deployment-field-workflow.json`
- [ ] Browser smoke check
- [ ] Dev deploy completed
- [ ] Deployed verifier passed

## Quirks To Carry Forward

| Quirk | Rule for this batch |
|---|---|
| Quote `[deploymentId]` paths in shell commands. | Always quote dynamic route paths. |
| `deploymentId=1` is route smoke data only. | Expect explicit `No Data` unless a real deployment GUID is provided/found. |
| Browser refs/screenshots can go stale. | Take a fresh snapshot after navigation before judging UI. |
| Shared row types are narrow. | Check TypeScript DTOs before assuming fields. |
| Browser route checks are secondary. | Use HTTP route/API verifier as source of truth, then one browser smoke check. |

## Checkpoint Summary

- Screens completed:
- Direct/Calculated fields wired:
- Explicit `No Data` decisions:
- Write actions implemented:
- Verification results:
- Dev URL(s):
- Remaining questions:

