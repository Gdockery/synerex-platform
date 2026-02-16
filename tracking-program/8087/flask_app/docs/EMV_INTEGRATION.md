# EM&V ↔ Tracking Integration

## Overview

This document describes the EM&V integration endpoints and flows implemented in the Tracking program.

## API Endpoints

### 1. Project List (for EMV analysis setup)

**GET /api/emv/projects?orgId=X&clientId=Y**

- **Auth:** Login required, license required
- **orgId:** Required – filter by organization
- **clientId:** Optional – filter by client
- **Response:** `{ "response": { "projects": [{ "orgId", "clientId", "clientName", "projectId", "projectName", "location" }, ...] } }`

### 2. Bill Analytic Export (Import from Bill Analytic)

**GET /api/emv/project/bill-analytic?orgId=X&clientId=Y&projectId=Z**

- **Auth:** Login required, license required
- **orgId, projectId:** Required
- **clientId:** Optional
- **Response:** `{ "response": { "electricBillAnalysis": {...}, "reportFields": {...} } }`
- **Note:** EMV should only map fields that exist in its UI; ignore others.

### 3. Push Baseline (Push Analysis to Tracking)

**POST /api/emv/push-baseline**

- **Auth:** Login required, license required
- **Body:**
  ```json
  {
    "orgId": "org-abc",
    "clientId": 45,
    "projectId": 123,
    "kwhSavings": 0.0523,
    "kwPeakSavings": 0.0412,
    "pfSavings": 0.018,
    "kvarSavings": 0.038,
    "kvaSavings": 0.045,
    "reportHtml": "<html>...</html>",
    "analysisDate": "2026-02-15",
    "offPeriod": { "start": "...", "end": "..." },
    "onPeriod": { "start": "...", "end": "..." }
  }
  ```
- **Response:** `{ "response": { "success": true, "emvAnalysisId": 1, "reportToken": "...", "reportUrl": "/secure/emv-report?token=..." } }`
- **Effect:** Updates `project.kwhSavings`, `kwPeakSavings`, etc. and stores the HTML report. Latest analysis supersedes; previous ones are kept for reference.

### 4. Client HTML Report (logged-in)

**GET /api/project/:id/emv-report**

- **Auth:** Login required, project access required
- **Response:** HTML document (EM&V report)

### 5. Client HTML Report (token-based, no login)

**GET /secure/emv-report?token=XXX**

- **Auth:** None – token in URL
- **Response:** HTML document (EM&V report)
- **Use:** Share link with client for viewing report

### 6. List EM&V Analyses (for test selection dropdown)

**GET /api/project/:id/emv-analyses**

- **Auth:** Login required
- **Response:** `{ "response": { "analyses": [{ id, analysisDate, offPeriod, onPeriod, createdAt, isActive }], "activeId": N } }`

### 7. Set Active EM&V Analysis (test selection)

**PUT /api/project/:id/emv-analysis/active**

- **Auth:** Login required
- **Body:** `{ "analysisId": 5 }`
- **Effect:** Sets `project.active_emv_analysis_id`, copies that analysis's savings to project (kwhSavings, kwPeakSavings, etc.)

### 8. Report with Analysis Selection

**GET /api/project/:id/emv-report?analysisId=5**

- If `analysisId` given: serve that specific analysis
- Else if `project.active_emv_analysis_id` set: serve that one
- Else: serve latest analysis

## Database

**Table: emv_analysis**

- `id`, `project_id`, `org_id`, `client_id`

**Project column: active_emv_analysis_id**

- References which EmvAnalysis is the active baseline (for report default, savings display)
- `kwh_savings`, `kw_peak_savings`, `pf_savings`, `kvar_savings`, `kva_savings`
- `report_html`, `share_token`
- `analysis_date`, `off_period_*`, `on_period_*`
- `createdAt`, `updatedAt`

**Migration:** Run `flask emv-analysis-migrate` to create the table.

## Service-to-Service Auth (EMV Backend → Tracking)

When EMV backend proxies requests to Tracking (user logged into EMV, not Tracking):

- **Tracking:** Set `EMV_API_KEY` in environment (shared secret)
- **EMV:** Set `EMV_API_KEY` or `TRACKING_API_KEY` (same value) and `TRACKING_URL` (or `TRACKING_BASE_URL`)
- EMV backend sends `X-EMV-API-Key` when calling Tracking; if key matches, request is allowed without user login

## How Baseline Drives Ongoing Tracking

When EMV pushes baseline, `project.kwhSavings`, `project.kwPeakSavings`, etc. are updated. These drive:

- **Rollups:** `accumulate-savings`, `calculate_savings_service` use these percentages
- **Dashboard:** `get-current-savings`, `get-carbon-savings` compute savings from ReportData × project savings %
- **Cost tracking:** `monthSavings = monthKwh * kwhSavings * avgRate + monthPeak * kwPeakSavings * billingRate`

## Service-to-Service Auth (EMV Backend → Tracking)

When EMV backend proxies requests to Tracking (user is logged into EMV, not Tracking), use API key auth:

- **Tracking:** Set `EMV_API_KEY` in environment (shared secret).
- **EMV:** Set `EMV_API_KEY` or `TRACKING_API_KEY` (same value) and `TRACKING_URL` (or `TRACKING_BASE_URL`).
- EMV backend sends `X-EMV-API-Key: <value>` when calling Tracking. If key matches, Tracking allows the request without user login.

## Flow Summary

1. **EMV setup:** Fetch projects via GET /api/emv/projects (or EMV proxy /api/tracking/projects)
2. **Import Bill Analytic:** Fetch via GET /api/emv/project/bill-analytic (or EMV proxy /api/tracking/bill-analytic), pre-fill EMV form
3. **Run analysis** in EMV (CSV, OFF vs ON)
4. **Push:** POST /api/emv/push-baseline (or EMV proxy /api/tracking/push-baseline) with savings % and report HTML
5. **Client views report:** Via /api/project/:id/emv-report (logged-in) or /secure/emv-report?token=... (shared link)
