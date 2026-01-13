# HTML Reports Directory Structure

This directory contains HTML reports generated for each project in the Synerex CSV Tamper-Proofing System.

## Directory Structure

```
reports/
├── README.md                 # This documentation file
├── templates/               # Report templates and styles
├── archived/               # Archived/old reports
├── exports/                # Exported reports (PDF, etc.)
└── [project_name]/         # Project-specific reports
    ├── project_name_report_name_YYYYMMDD_HHMMSS.html
    ├── project_name_report_name_YYYYMMDD_HHMMSS.html
    └── ...
```

## Project Reports

Each project gets its own subdirectory under `reports/` with the project name. Reports are stored with project name, report name, and timestamps to ensure uniqueness:

- **Format**: `{project_name}_{report_name}_{YYYYMMDD}_{HHMMSS}.html`
- **Example**: `Energy_Analysis_2024_Compliance_Report_20241003_143022.html`
- **Special Characters**: Project names are cleaned (spaces become underscores, special characters removed)

## Report Types

- **Standard Reports**: Basic project analysis reports
- **Compliance Reports**: M&V compliance and audit reports
- **Technical Reports**: Detailed technical analysis
- **Summary Reports**: Executive summaries

## Database Tracking

All reports are tracked in the `html_reports` database table with:
- Project name and report name
- File path and size
- Generation timestamp and user
- PE review status and signatures
- Report status (draft, final, archived)

## API Endpoints

- `POST /api/reports/generate` - Generate new HTML report
- `GET /api/reports/list` - List all reports (optionally by project)
- `GET /api/reports/{id}/download` - Download specific report
- `DELETE /api/reports/{id}` - Delete report

## File Management

- Reports are automatically organized by project
- Timestamps prevent filename conflicts
- Database tracks all metadata and relationships
- PE review workflow integrated
- Automatic backup and archival support

## Security Features

- User authentication required for all operations
- PE digital signatures for approved reports
- File integrity verification
- Access logging and audit trails
- Tamper-proof report generation
