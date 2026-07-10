# ECBS Browser Click-Check Workflow

## Goal

Verify that deployed ECBS screens behave like the approved screen flow map when a user actually clicks through them.

Static route checks catch broken pages. Browser click checks catch broken buttons, missing forms, bad navigation, disabled controls, and submit flows that only fail in the browser.

## When Required

Run browser click checks for every batch that includes:

- Navigation buttons or table-row drilldowns.
- Form submit buttons.
- Save / generate / configure actions.
- Screens whose next screen is reached only through an in-page click.

## Tool

Use Cursor browser automation against the deployed dev URL after deployment.

Default dev base URL:

```text
http://100.91.109.59:8080
```

## Click-Check Matrix

Add this matrix to each batch checklist.

| Start URL | Action | Expected URL / State | Evidence |
|---|---|---|---|
|  | Click  |  | Snapshot / screenshot |
|  | Fill + submit  |  | Snapshot / API response / DB count |

## Standard Browser Sequence

1. List open browser tabs.
2. Navigate to the start URL.
3. Lock the browser tab for the check.
4. Take an accessibility snapshot.
5. Click the target control using its snapshot ref.
6. Verify the resulting URL/state with a fresh snapshot.
7. Take a screenshot only when visual evidence is needed.
8. Unlock the tab.

## Failure Rule

Do not repeat the same failing click more than once without new evidence.

If a click fails:

- Take a fresh snapshot.
- Check whether the control is a link, button, disabled element, form submit, or hidden overlay.
- Inspect the route/component source if needed.
- Fix the route/action in code, redeploy, and rerun the click check.

## Client Management Baseline Checks

Use this set as the default pattern for interactive ECBS batches:

| Start URL | Action | Expected URL / State |
|---|---|---|
| `/client-management/clients` | Click `+ Add New Client` | `/client-management/clients/new` |
| `/client-management/clients` | Click first client row | `/client-management/clients/<clientId>` |
| `/client-management/clients/<clientId>` | Click `Projects` | `/client-management/clients/<clientId>/projects` |
| `/client-management/clients/<clientId>/projects` | Click `+ New Project` | `/client-management/clients?workflow=new-project-scanning` |
| `/client-management/clients?workflow=new-project-scanning` | Click `Generate Reports` | `/client-management/clients?workflow=new-project-generate-reports` |

## Reporting Format

Use this concise checkpoint format:

```text
Browser click checks:
- PASS: /source -> action -> /target
- PASS: /source -> form submit -> success state
- FAIL: /source -> action -> observed blocker
```

## Relationship To Batch Verifier

The Python verifier remains the first-line check for fast route/API/build validation.

Browser click checks are the final interaction gate before a batch is considered deployed and usable.

