# Design: Scan Bill First → Create Client + Project + Bill Analytic

## Overview

This document describes a new flow where users can **scan an electric bill first**, then be guided to create a Client and Project from the extracted data, and run a Bill Analytic—rather than requiring Client and Project to exist before scanning.

### Goals

- Enable document-first onboarding (bill in hand → system setup)
- Reduce upfront data entry and typos by extracting from the bill
- Keep the existing create-first flow as an alternative
- Single bill upload populates Client profile, Project, and Bill Analytic from one source

**Stack:** All implementation is in Flask / Python. Sails is deprecated; this feature does not use any Node/Sails code.

---

## Current State

### Flow Today

1. **Create Client** – Admin creates client with name, address, etc. (often placeholder data).
2. **Create Project** – Admin creates project linked to client; project requires `client` FK.
3. **Enter Bill Analytic** – User manually enters bill data via form; optionally uses `analyze-electric-bill` if exposed (currently not in routes).

### Constraints

- `analyze-electric-bill` (Sails) requires `project` as a required input.
- Project creation requires an existing `client` (Project.client FK, nullable=False).
- Bill scan extracts data but has no endpoint that works without a project.
- Bill Analytic form is project-scoped; no "scan first, create later" path.

### Bill Parser Output (reference: electric-bill-parser.js)

The existing Node parser extracts these fields; logic will be ported to Python for the Flask implementation:

| Parser output           | Maps to Bill Analytic        | Maps to Client                  |
|-------------------------|------------------------------|---------------------------------|
| `serviceAddress`        | (service location)           | `Client.address`               |
| `serviceCity`           | —                            | `Client.city`                  |
| `serviceState`          | —                            | `Client.state`                 |
| `serviceZip`            | —                            | `Client.zip`                   |
| `electricCompanyName`   | `electricCompanyName`        | —                              |
| `electricCompanyAddress`| `electricCompanyAddress`     | —                              |
| `electricCompanyCity`   | `electricCompanyCity`        | —                              |
| `electricCompanyState`  | `electricCompanyState`       | —                              |
| `electricCompanyZip`    | `electricCompanyZip`         | —                              |
| `accountNumber`         | `accountNumber`              | —                              |
| `meterNumber`           | `meterNumber`                | —                              |
| `totalKwh`              | `totalKwh`                   | —                              |
| `kwPeak`                | `kwPeak`                     | —                              |
| `billAmount`            | `billAmount`                 | —                              |
| `daysBilled`            | `daysBilled`                 | —                              |
| `voltage`               | `voltage`                    | —                              |
| `billDate` / `billReference` | `billDate` / `billReference` | — |

---

## Proposed Flow

### User Journey

1. **Upload bill PDF** – User chooses "New from bill" (or equivalent) and uploads a PDF.
2. **Scan runs** – Standalone endpoint processes PDF (form fields → text → OCR) and returns extracted data.
3. **Review pre-filled data** – User sees:
   - **Client section**: name (derived or placeholder), address, city, state, zip.
   - **Project section**: name/slug (e.g., from address or manual), timezone (default).
   - **Bill Analytic section**: kWh, kW peak, bill amount, dates, utility info, line items.
4. **Edit and confirm** – User corrects any extraction errors, fills gaps, then submits.
5. **Create records** – Backend creates Client → Project → saves electricBillAnalysis in one transaction.
6. **Continue** – User lands on the new project with Bill Analytic ready.

### Optional: "Add to existing client"

- If user selects "Add to existing project" or "Link to existing client", skip Client creation.
- Use existing Client + create new Project (or attach bill to existing Project).
- Same scan endpoint; only the post-scan wizard differs.

---

## Technical Design

### 1. Standalone Bill Scan Endpoint

**Route:** `POST /api/bill/analyze`  
**Auth:** Login required, license check.  
**Input:** Multipart file upload (`bill` PDF).  
**Output:** Same shape as current `analyze-electric-bill` success response:

```json
{
  "success": true,
  "data": {
    "totalKwh": "12345",
    "kwPeak": "120",
    "billAmount": "5432.10",
    "daysBilled": "30",
    "serviceAddress": "123 Main St",
    "serviceCity": "Austin",
    "serviceState": "TX",
    "serviceZip": "78701",
    "electricCompanyName": "Austin Energy",
    "accountNumber": "12345-67890",
    "meterNumber": "987654",
    "billDate": 1234567890000,
    "billReference": "December 2024",
    "lineItems": [...],
    ...
  },
  "partial": false
}
```

**Implementation (Flask / Python):**

All logic lives in Flask. Sails is deprecated; no Sails endpoints or Node dependencies.

- **PDF extraction pipeline** (Python port of `analyze-electric-bill.js` logic):
  - PDF form fields (AcroForm) → PyMuPDF or PyPDF2
  - Text extraction → PyMuPDF (`fitz`) or pdfplumber
  - OCR fallback (for scanned/image PDFs) → `pdf2image` + `pytesseract`
- **Text parser** – Port `electric-bill-parser.js` regex rules to a Python module (e.g. `app/services/electric_bill_parser.py`)
- No project ID; use temp file name like `analyze-bill-standalone-{timestamp}.pdf`

### 2. "Create from Bill" Endpoint

**Route:** `POST /api/project/create-from-bill`  
**Auth:** Login required, license check, admin or create-project permission.  
**Input:** JSON body:

```json
{
  "client": {
    "name": "Acme Corp",
    "address": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "contactName": "",
    "contactPhone": ""
  },
  "project": {
    "name": "Acme - 123 Main St",
    "location": "123 Main St, Austin, TX",
    "timeZoneId": "America/Chicago"
  },
  "electricBillAnalysis": {
    "totalKwh": "12345",
    "kwPeak": "120",
    "billAmount": "5432.10",
    ...
  }
}
```

**Behavior:**

1. Create `Client` from `client` payload (validate required fields).
2. Create `Project` with `client` FK, `project` payload, `electricBillAnalysis`.
3. Create ReportData entries for the new project (same as `create_project`).
4. Optionally assign current user to project.
5. Return created project (with client, electricBillAnalysis).

**Validations:**

- Client: `name` required; address fields recommended.
- Project: `name`, `slug`, `client`, `timeZoneId` required.
- electricBillAnalysis: same validations as `PUT /api/project/:id/electric-bill-analysis`.

### 3. Field Mapping

**Bill scan → Client:**

| Scan field       | Client field   | Notes                                   |
|------------------|----------------|-----------------------------------------|
| serviceAddress   | address        | Primary service location                |
| serviceCity      | city           |                                         |
| serviceState     | state          |                                         |
| serviceZip       | zip            |                                         |
| electricCompanyName | (optional)  | Can store in notes if desired           |

**Client name:** If not parsed, suggest from address (e.g., "Client - 123 Main St") or require user to type.

**Bill scan → Project:**

| Scan field       | Project field   | Notes                     |
|------------------|-----------------|---------------------------|
| serviceAddress   | location        | Service location          |
| —                | name            | User-provided or derived  |

**Bill scan → electricBillAnalysis:**

Direct mapping; parser output keys align with `electricBillAnalysis` schema.

---

## UI Design

### Entry Points

1. **"New from bill"** – In project selector, admin dashboard, or billing area.
2. **Bill Analytic "Scan bill"** – When no project is selected, offer "Create project from bill" instead of error.

### Wizard Flow (4 steps)

| Step | Title       | Content                                                                 |
|------|-------------|-------------------------------------------------------------------------|
| 1    | Upload bill | File upload; call `POST /api/bill/analyze`; show spinner then results.  |
| 2    | Client      | Form pre-filled from scan (address, city, state, zip); user adds name.  |
| 3    | Project     | Form pre-filled (location, name); user sets timezone, name.             |
| 4    | Bill Analytic | Form pre-filled; user reviews and corrects.                           |
| 5    | Summary     | Summary of Client, Project, Bill Analytic; "Create" button.             |

**Error handling:**

- Scan failed → "Could not extract data; please enter manually" + link to create Client/Project the standard way.
- Partial scan → Show extracted fields; gray out or mark "from scan" for clarity.

### Angular / React

- New route: `/project/create-from-bill` or `/billing/new-from-bill`.
- New component: `CreateFromBillWizardComponent` (or equivalent).
- Reuse `billAnalytic-form` for step 4, with pre-filled `electricBillAnalysis`.

---

## Edge Cases

| Scenario                    | Handling                                                                 |
|----------------------------|---------------------------------------------------------------------------|
| Scan returns no useful data| Offer manual Client + Project creation; optionally still save empty Bill Analytic. |
| Partial extraction         | Pre-fill what's available; user fills the rest.                           |
| User cancels mid-wizard    | No records created; no side effects.                                      |
| Duplicate client           | Optional: "Use existing client" with search/select; then create Project only. |
| Multiple sites per client  | Each bill scan creates a new Project; user can select existing Client.    |

---

## Implementation Phases

### Phase 1: Standalone scan endpoint

- Add `POST /api/bill/analyze` in Flask (new blueprint or phase routes).
- Port PDF extraction + parser to Python (no Sails/Node).
- No project required; return extracted data only.
- Frontend: minimal test page to upload and display results.

### Phase 2: Create-from-bill endpoint

- Add `POST /api/project/create-from-bill`.
- Accept client, project, electricBillAnalysis; create all in one transaction.
- Add ReportData creation for new project.

### Phase 3: Wizard UI

- Create wizard component.
- Step 1: Upload → call scan → show results.
- Steps 2–4: Pre-filled forms for Client, Project, Bill Analytic.
- Step 5: Submit to create-from-bill; redirect to new project.

### Phase 4: Polish

- "Add to existing client" option.
- Validation and error messages.
- Accessibility and mobile layout.

---

## Dependencies (Python / Flask)

| Purpose | Python package |
|---------|----------------|
| PDF form fields (AcroForm) | PyMuPDF (`fitz`) |
| PDF text extraction | PyMuPDF |
| PDF → images (for OCR) | pdf2image |
| OCR | pytesseract (Tesseract must be installed) |

Parser logic is ported from `electric-bill-parser.js` to Python `re`; no Node dependencies.

### OCR Deployment Notes

For **scanned/image PDFs** (no embedded text), OCR is used. Install system dependencies:

- **Ubuntu/Debian:**  
  `sudo apt-get install tesseract-ocr poppler-utils`
- **macOS:**  
  `brew install tesseract poppler`
- **RHEL/CentOS:**  
  `sudo yum install tesseract poppler-utils`

Without these, text extraction from PDFs with embedded text and AcroForm fields still works; only scanned PDFs will fail to extract.

---

## Success Criteria

- User can upload a bill PDF without an existing Client or Project.
- Extracted data pre-fills Client, Project, and Bill Analytic forms.
- One submit creates Client + Project + electricBillAnalysis.
- Existing "create Client → create Project → enter Bill Analytic" flow remains unchanged.

---

## Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Standalone scan | Done | `POST /api/bill/analyze`, Flask + PyMuPDF + electric_bill_parser.py |
| 2. Create-from-bill | Done | `POST /api/project/create-from-bill`, supports `clientId` for existing client |
| 3. Wizard UI | Done | 5-step wizard at `/project/create-from-bill`, "New from bill" on project selector |
| 4. Polish | Done | "Add to existing client" toggle, validation, responsive layout, admins see button |

---

## EM&V Integration

### Push to Tracking (EM&V → Tracking)

- **Client HTML Report** is generated by EM&V after analysis (`generate_exact_template_html.py`).
- The report embeds `<script type="application/json" id="emv-bill-import-data">` with electricBillAnalysis-shaped data (totalKwh, kwPeak, billAmount, utility info, etc.) for Tracking to parse.
- **"Push to Tracking" button**: Not found in current EM&V codebase. The data payload is prepared (`_build_bill_import_from_results`), but no button/endpoint exists to send the full HTML report to Tracking. To implement:
  1. Add a "Push to Tracking" button in EM&V (e.g. after analysis results or in the Client HTML Report window).
  2. On click: send the full Client HTML Report to Tracking (`POST /api/emv/import-report` or similar).
  3. Tracking: parse HTML for `emv-bill-import-data` JSON and baseline % values, store report, create/update Bill Analytic.

### Weather Fetch (EM&V Legacy Page)

- Weather fetch uses `POST /api/fetch_weather` with `facility_address`, `before_file_id`, `after_file_id`.
- **Fixes applied** (Feb 2025):
  - `WEATHER_SERVICE_URL` default: `http://127.0.0.1:8200` when env not set.
  - `credentials: 'same-origin'` on fetch to ensure session cookies are sent (org_id required).
  - File ID fallback: use `sessionStorage` (`selected_before_file_id`, `selected_after_file_id`) when hidden inputs are empty (e.g. after dashboard redirect).
  - Address field fallback: try both `input[name="facility_address"]` and `#facility_address`.
- **Requirements**: User must be logged in (org_id), weather service on 8200 running, facility address filled, both CSV files selected.

---

## Related

- `tracking-program/8087/api/controllers/web/project/analyze-electric-bill.js` – **reference for porting** (Sails, deprecated)
- `tracking-program/8087/api/services/utilities/electric-bill-parser.js` – **reference for porting** regex rules to Python
- `tracking-program/8087/flask_app/app/models/client.py` – Client schema
- `tracking-program/8087/flask_app/app/models/project.py` – Project schema, electricBillAnalysis JSON
- `tracking-program/8087/flask_app/app/api/phase7_routes.py` – PUT electric-bill-analysis
