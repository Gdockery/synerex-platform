// Additional comprehensive sections for the User's Guide
const comprehensiveSections = {
    reporting: `
        <div class="section" id="reporting">
            <h2>7. Reporting & Documentation</h2>
            
            <h3>7.1 HTML Report Generation</h3>
            <p>The SYNEREX system generates comprehensive, professional-grade HTML reports suitable for utility submissions and regulatory compliance.</p>

            <h4>7.1.1 Report Structure</h4>
            <div class="feature-card">
                <h4>📋 Report Sections</h4>
                <ul>
                    <li><strong>Executive Summary:</strong> High-level overview of analysis results</li>
                    <li><strong>Project Information:</strong> Client details, facility information, and test parameters</li>
                    <li><strong>Test Parameters:</strong> Detailed analysis configuration and settings</li>
                    <li><strong>Engineering Results:</strong> Comprehensive electrical parameter analysis</li>
                    <li><strong>Statistical Significance:</strong> ASHRAE Guideline 14 compliance verification</li>
                    <li><strong>Savings Attribution:</strong> IPMVP-compliant energy savings analysis</li>
                    <li><strong>Standards Compliance:</strong> Regulatory compliance verification</li>
                    <li><strong>Technical Appendices:</strong> Detailed calculations and methodologies</li>
                </ul>
            </div>

            <h4>7.1.2 Dynamic Data Integration</h4>
            <div class="info">
                <h4>🔄 Real-Time Data Integration:</h4>
                <p>All report values are dynamically populated from actual analysis results:</p>
                <ul>
                    <li><strong>Client Information:</strong> Automatically populated from form inputs</li>
                    <li><strong>Test Parameters:</strong> Pulled from analysis configuration</li>
                    <li><strong>Engineering Results:</strong> Calculated from actual meter data</li>
                    <li><strong>Statistical Data:</strong> Generated from statistical analysis</li>
                    <li><strong>Compliance Status:</strong> Verified against regulatory standards</li>
                </ul>
            </div>

            <h3>7.2 Report Customization</h3>
            
            <h4>7.2.1 Client Information Section</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Source</th>
                        <th>Description</th>
                        <th>Required</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Company</td>
                        <td>Project Name</td>
                        <td>Client organization name</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Facility</td>
                        <td>Facility Address</td>
                        <td>Physical facility location</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Location</td>
                        <td>City, State Zip Code</td>
                        <td>Geographic location</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Contact</td>
                        <td>Point of Contact</td>
                        <td>Primary contact person</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>Email</td>
                        <td>Contact email address</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Phone</td>
                        <td>Phone</td>
                        <td>Contact phone number</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Utility</td>
                        <td>Utility</td>
                        <td>Utility company name</td>
                        <td>Yes</td>
                    </tr>
                    <tr>
                        <td>Account</td>
                        <td>Account #</td>
                        <td>Utility account number</td>
                        <td>Optional</td>
                    </tr>
                </tbody>
            </table>

            <h4>7.2.2 Test Parameters Configuration</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Test Type:</strong> Select analysis type (Power Quality, Energy Savings, etc.)
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Circuit:</strong> Specify electrical circuit identifier
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Period:</strong> Define before/after analysis periods
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Duration:</strong> Specify analysis duration
            </div>
            <div class="step">
                <span class="step-number">5</span>
                <strong>Meter Spec:</strong> Define meter specifications and accuracy
            </div>

            <h3>7.3 Report Storage & Management</h3>
            
            <h4>7.3.1 Automatic Report Storage</h4>
            <div class="info">
                <h4>💾 Storage Features:</h4>
                <ul>
                    <li><strong>Database Storage:</strong> Reports stored in html_reports table</li>
                    <li><strong>File System Storage:</strong> Physical files stored in reports/ directory</li>
                    <li><strong>Metadata Tracking:</strong> Complete metadata and audit trail</li>
                    <li><strong>Version Control:</strong> Automatic versioning and backup</li>
                </ul>
            </div>

            <h4>7.3.2 Report Access & Retrieval</h4>
            <div class="feature-card">
                <h4>📁 Report Management</h4>
                <p><strong>Available Operations:</strong></p>
                <ul>
                    <li><strong>View Reports:</strong> Browse and view stored reports</li>
                    <li><strong>Download Reports:</strong> Download reports in various formats</li>
                    <li><strong>Report History:</strong> View report generation history</li>
                    <li><strong>Report Comparison:</strong> Compare multiple reports</li>
                </ul>
            </div>

            <h3>7.4 Professional Report Features</h3>
            
            <h4>7.4.1 Regulatory Compliance</h4>
            <div class="warning">
                <h4>📋 Compliance Features:</h4>
                <ul>
                    <li><strong>IEEE 519 Compliance:</strong> Harmonic distortion limit verification</li>
                    <li><strong>ASHRAE Guideline 14:</strong> Statistical validation compliance</li>
                    <li><strong>NEMA MG1 Standards:</strong> Three-phase motor compliance</li>
                    <li><strong>IPMVP Volume I:</strong> Measurement and verification protocol</li>
                </ul>
            </div>

            <h4>7.4.2 Professional Engineering Integration</h4>
            <div class="feature-card">
                <h4>👨‍💼 PE Integration Features:</h4>
                <ul>
                    <li><strong>PE Review Sections:</strong> Dedicated PE review areas</li>
                    <li><strong>Certification Tracking:</strong> PE certification status</li>
                    <li><strong>Signature Capture:</strong> Digital signature integration</li>
                    <li><strong>Compliance Verification:</strong> PE compliance checklist</li>
                </ul>
            </div>

            <h3>7.5 CSV File Modification & Clipping</h3>
            
            <h4>7.5.1 Clipping Interface</h4>
            <div class="info">
                <h4>✂️ CSV Editing Features:</h4>
                <ul>
                    <li><strong>Cell Editing:</strong> Click any cell to edit values directly</li>
                    <li><strong>Range Selection:</strong> Select specific row ranges for analysis</li>
                    <li><strong>Row Deletion:</strong> Remove unwanted data rows</li>
                    <li><strong>Data Validation:</strong> Automatic validation of edited values</li>
                </ul>
            </div>

            <h4>7.5.2 Modification Reason Form</h4>
            <div class="warning">
                <h4>📝 Required When Saving Changes:</h4>
                <p>When you click "Save Changes" after editing a CSV file, a form will appear requiring you to:</p>
                <ol>
                    <li><strong>Select Modification Reason:</strong> Choose from:
                        <ul>
                            <li>Data Correction</li>
                            <li>Outlier Removal</li>
                            <li>Range Clipping (Time Period Selection)</li>
                            <li>Data Cleaning</li>
                            <li>Format Standardization</li>
                            <li>Missing Data Handling</li>
                            <li>Calibration Adjustment</li>
                            <li>Other (requires details)</li>
                        </ul>
                    </li>
                    <li><strong>Provide Modification Details (Optional):</strong> Add specific information about what was changed</li>
                    <li><strong>Review Audit Notice:</strong> Understand that the modification will be permanently recorded</li>
                </ol>
                <p><strong>Why This Matters:</strong> This information is included in the Data Modification History document in the audit trail, providing complete transparency for utility submissions and regulatory compliance.</p>
            </div>

            <h4>7.5.3 Modification Tracking</h4>
            <div class="feature-card">
                <h4>📋 What Gets Tracked:</h4>
                <ul>
                    <li><strong>Who:</strong> User name and email who made the modification</li>
                    <li><strong>When:</strong> Exact timestamp of the modification</li>
                    <li><strong>What:</strong> File name and ID that was modified</li>
                    <li><strong>Why:</strong> Modification reason and details from the form</li>
                    <li><strong>How:</strong> Fingerprint before and after modification</li>
                </ul>
            </div>
        </div>
    `,

    auditCompliance: `
        <div class="section" id="audit-compliance">
            <h2>8. Audit Compliance & Documentation</h2>
            
            <h3>8.1 Comprehensive Audit System</h3>
            <p>The SYNEREX system provides the most comprehensive audit compliance system in the industry, designed to meet the highest standards for utility submissions and regulatory compliance.</p>

            <h3>8.2 Excel Calculation Audit</h3>
            
            <h4>8.2.1 World-Class Excel Workbook</h4>
            <div class="success">
                <h4>📊 9 Professional Excel Sheets:</h4>
                <ul>
                    <li><strong>Executive Summary:</strong> High-level overview with key metrics</li>
                    <li><strong>Regulatory Compliance:</strong> IEEE 519, ASHRAE 14, NEMA MG1 compliance verification</li>
                    <li><strong>Calculation Methodology:</strong> Detailed mathematical formulas and procedures</li>
                    <li><strong>Step-by-Step Calculations:</strong> Complete calculation breakdown with verification</li>
                    <li><strong>Standards Compliance:</strong> Comprehensive standards verification matrix</li>
                    <li><strong>Data Quality Analysis:</strong> Measurement uncertainty and statistical validation</li>
                    <li><strong>PE Review & Certification:</strong> Professional engineering review checklist and certification</li>
                    <li><strong>Utility Submission Checklist:</strong> Complete utility submission requirements and timeline</li>
                    <li><strong>Technical Appendices:</strong> Equipment calibration, data sources, and reference materials</li>
                </ul>
            </div>

            <h4>8.2.2 Professional Styling & Formatting</h4>
            <div class="feature-card">
                <h4>🎨 Professional Features:</h4>
                <ul>
                    <li><strong>Corporate Styling:</strong> Professional colors, fonts, and formatting</li>
                    <li><strong>Conditional Formatting:</strong> Color-coded compliance status</li>
                    <li><strong>Data Validation:</strong> Built-in data validation rules</li>
                    <li><strong>Print Optimization:</strong> Print-ready formatting</li>
                </ul>
            </div>

            <h3>8.3 Audit Package Generation</h3>
            
            <h4>8.3.1 Complete Audit Package</h4>
            <div class="info">
                <h4>📦 Comprehensive Audit Package Contents:</h4>
                <p><strong>07_Audit_Trail Folder Includes:</strong></p>
                <ul>
                    <li>Complete_Audit_Trail.pdf - All calculation steps, data access, and modifications</li>
                    <li>Calculation_Audit_Trail.xlsx - 9-sheet professional Excel workbook</li>
                    <li>Analysis_Session_Log.json - Complete session log in JSON format</li>
                    <li>NEMA_MG1_Calculation_Methodology.pdf - NEMA MG1 voltage unbalance methodology</li>
                    <li>CSV_Fingerprint_System_Methodology.pdf - Technical fingerprint system documentation</li>
                    <li>Data_Modification_History.pdf - Complete history of all file modifications with reasons and chain of custody</li>
                </ul>
                <p><strong>06_Data_Quality Folder Includes:</strong></p>
                <ul>
                    <li>Data_Quality_Assessment.pdf - Data quality assessment report</li>
                    <li>CSV_Data_Integrity_Protection_System.pdf - User-friendly fingerprint system explanation</li>
                    <li>Source_Data_Files/ - All CSV files with fingerprints</li>
                </ul>
            </div>

            <h4>8.3.2 Utility Submission Ready</h4>
            <div class="warning">
                <h4>🏢 Utility Company Requirements:</h4>
                <ul>
                    <li><strong>Professional Engineer Review:</strong> PE certification and signature</li>
                    <li><strong>Regulatory Compliance:</strong> All applicable standards verified</li>
                    <li><strong>Data Quality Documentation:</strong> Measurement uncertainty analysis</li>
                    <li><strong>Statistical Validation:</strong> ASHRAE 14 compliance</li>
                    <li><strong>Calculation Transparency:</strong> Complete calculation documentation</li>
                </ul>
            </div>

            <h3>8.4 Data Integrity & Chain of Custody</h3>
            
            <h4>8.4.1 Cryptographic Security</h4>
            <div class="feature-card">
                <h4>🔒 Security Features:</h4>
                <ul>
                    <li><strong>SHA-256 Fingerprinting:</strong> Cryptographic file integrity verification</li>
                    <li><strong>Tamper Detection:</strong> Automatic detection of file modifications</li>
                    <li><strong>Audit Trails:</strong> Complete activity logging</li>
                    <li><strong>Chain of Custody:</strong> Documented data handling procedures</li>
                    <li><strong>Data Modification Tracking:</strong> Complete history of all file modifications with reasons and details</li>
                </ul>
            </div>

            <h4>8.4.2 Data Modification Requirements</h4>
            <div class="warning">
                <h4>⚠️ Modification Form Requirement:</h4>
                <p>When modifying CSV files in the Clipping Interface, you <strong>must</strong> complete the Modification Reason form that appears when saving changes:</p>
                <ul>
                    <li><strong>Modification Reason (Required):</strong> Select from predefined reasons (Data Correction, Outlier Removal, Range Clipping, etc.)</li>
                    <li><strong>Modification Details (Optional):</strong> Provide specific details about what was changed and why</li>
                    <li><strong>Audit Trail:</strong> All modifications are permanently recorded with your user information, timestamp, and reason</li>
                    <li><strong>Fingerprint Tracking:</strong> New fingerprints are generated for modified files, with before/after fingerprints tracked</li>
                </ul>
                <p><strong>Important:</strong> This information is included in the audit trail and utility submission packages for compliance purposes.</p>
            </div>

            <h4>8.4.3 Professional Engineering Oversight</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>PE Assignment:</strong> Assign professional engineer to project
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Review Process:</strong> PE reviews all calculations and methodologies
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Certification:</strong> PE certifies compliance and accuracy
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Signature:</strong> Digital signature capture and verification
            </div>

            <h3>8.5 Regulatory Standards Compliance</h3>
            
            <h4>8.5.1 IEEE 519-2014/2022 Compliance</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>IEEE Limit</th>
                        <th>Verification Method</th>
                        <th>Compliance Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>THD Voltage</td>
                        <td>5.0%</td>
                        <td>FFT Analysis</td>
                        <td>✅ Compliant</td>
                    </tr>
                    <tr>
                        <td>THD Current</td>
                        <td>8.0%</td>
                        <td>FFT Analysis</td>
                        <td>✅ Compliant</td>
                    </tr>
                    <tr>
                        <td>Individual Harmonics</td>
                        <td>IEEE Table 1</td>
                        <td>Harmonic Spectrum</td>
                        <td>✅ Compliant</td>
                    </tr>
                </tbody>
            </table>

            <h4>8.5.2 ASHRAE Guideline 14 Compliance</h4>
            <div class="info">
                <h4>📊 Statistical Validation:</h4>
                <ul>
                    <li><strong>Coefficient of Variation:</strong> CV < 10% requirement</li>
                    <li><strong>Relative Precision:</strong> RP < 5% requirement</li>
                    <li><strong>Data Completeness:</strong> > 95% requirement</li>
                    <li><strong>Measurement Period:</strong> ≥ 14 days requirement</li>
                </ul>
            </div>
        </div>
    `,

    apiReference: `
        <div class="section" id="api-reference">
            <h2>9. API Reference & Technical Details</h2>
            
            <h3>9.1 REST API Endpoints</h3>
            <p>The SYNEREX system provides a comprehensive REST API for programmatic access and integration.</p>

            <h4>9.1.1 File Management Endpoints</h4>
            <div class="api-endpoint">
                <strong>POST /api/raw-meter-data/upload</strong><br>
                Upload raw meter data files for analysis<br>
                <em>Content-Type: multipart/form-data</em>
            </div>

            <div class="api-endpoint">
                <strong>GET /api/verified-files</strong><br>
                Retrieve list of verified files with metadata<br>
                <em>Returns: JSON array of file objects</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/verify-and-protect-file</strong><br>
                Verify file integrity and apply protection<br>
                <em>Parameters: file_id, verification_type</em>
            </div>

            <h4>9.1.2 Analysis Endpoints</h4>
            <div class="api-endpoint">
                <strong>POST /api/analyze</strong><br>
                Execute comprehensive analysis workflow<br>
                <em>Content-Type: application/x-www-form-urlencoded</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/fetch_weather</strong><br>
                Fetch weather data for normalization<br>
                <em>Parameters: before_file_id, after_file_id</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/generate-report</strong><br>
                Generate HTML report from analysis results<br>
                <em>Content-Type: application/json</em>
            </div>

            <h4>9.1.3 Project Management Endpoints</h4>
            <div class="api-endpoint">
                <strong>GET /api/projects</strong><br>
                List all available projects<br>
                <em>Returns: JSON array of project objects</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/projects/load</strong><br>
                Load project configuration and data<br>
                <em>Parameters: project_name</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/projects/save</strong><br>
                Save project configuration and analysis results<br>
                <em>Content-Type: application/json</em>
            </div>

            <h4>9.1.4 Audit & Compliance Endpoints</h4>
            <div class="api-endpoint">
                <strong>GET /api/audit-logs</strong><br>
                Retrieve comprehensive audit trail<br>
                <em>Returns: JSON array of audit log entries</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/generate-audit-package</strong><br>
                Generate complete audit package ZIP file<br>
                <em>Content-Type: application/json</em>
            </div>

            <div class="api-endpoint">
                <strong>POST /api/export/calculation-audit</strong><br>
                Export calculation audit to Excel<br>
                <em>Content-Type: application/json</em>
            </div>

            <h3>9.2 Data Structures</h3>
            
            <h4>9.2.1 Analysis Results Structure</h4>
            <div class="code-block">
{
  "power_quality": {
    "ieee_519_compliant": true,
    "thd_voltage_before": 2.9,
    "thd_voltage_after": 1.9,
    "thd_current_before": 3.2,
    "thd_current_after": 2.3,
    "harmonic_analysis": {...}
  },
  "statistical_analysis": {
    "ashrae_compliant": true,
    "cv_before": 8.22,
    "cv_after": 6.10,
    "relative_precision": 1.8,
    "confidence_intervals": {...}
  },
  "energy_savings": {
    "ipmvp_compliant": true,
    "annual_kwh_savings": 281748,
    "demand_savings": 32.15,
    "total_annual_savings": 45000.0
  },
  "audit_trail": {
    "calculation_log": [...],
    "compliance_checks": [...],
    "data_quality_metrics": {...}
  }
}
            </div>

            <h4>9.2.2 File Metadata Structure</h4>
            <div class="code-block">
{
  "id": 123,
  "filename": "meter_data_before.csv",
  "file_path": "/uploads/raw/meter_data_before.csv",
  "fingerprint": "a1b2c3d4e5f6...",
  "file_size": 2456789,
  "upload_date": "2025-10-06T19:45:23Z",
  "verification_status": "verified",
  "project_assignments": [...]
}
            </div>

            <h3>9.3 Error Handling</h3>
            
            <h4>9.3.1 HTTP Status Codes</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Status Code</th>
                        <th>Description</th>
                        <th>Common Causes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>200</td>
                        <td>Success</td>
                        <td>Request completed successfully</td>
                    </tr>
                    <tr>
                        <td>400</td>
                        <td>Bad Request</td>
                        <td>Invalid parameters or malformed request</td>
                    </tr>
                    <tr>
                        <td>404</td>
                        <td>Not Found</td>
                        <td>Resource not found or file missing</td>
                    </tr>
                    <tr>
                        <td>500</td>
                        <td>Internal Server Error</td>
                        <td>Server-side processing error</td>
                    </tr>
                </tbody>
            </table>

            <h4>9.3.2 Error Response Format</h4>
            <div class="code-block">
{
  "status": "error",
  "error": "Detailed error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2025-10-06T19:45:23Z",
  "request_id": "req_123456789"
}
            </div>

            <h3>9.4 Integration Examples</h3>
            
            <h4>9.4.1 Python Integration</h4>
            <div class="code-block">
import requests
import json

# Upload file
with open('meter_data.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8082/api/raw-meter-data/upload', files=files)

# Run analysis
analysis_data = {
    'before_file_id': 123,
    'after_file_id': 124,
    'test_type': 'Power Quality',
    'client_info': {...}
}
response = requests.post('http://localhost:8082/api/analyze', data=analysis_data)

# Generate report
report_data = {
    'project_name': 'Test Project',
    'client_info': {...},
    'analysis_results': response.json()
}
response = requests.post('http://localhost:8082/api/generate-report', json=report_data)
            </div>

            <h4>9.4.2 JavaScript Integration</h4>
            <div class="code-block">
// Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/raw-meter-data/upload', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => console.log('Upload successful:', data));

// Run analysis
const analysisData = {
    before_file_id: 123,
    after_file_id: 124,
    test_type: 'Power Quality'
};

fetch('/api/analyze', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(analysisData)
})
.then(response => response.json())
.then(data => console.log('Analysis complete:', data));
            </div>
        </div>
    `
};

// Function to load comprehensive sections
function loadComprehensiveSections() {
    const container = document.querySelector('.container');
    
    // Add reporting section
    container.insertAdjacentHTML('beforeend', comprehensiveSections.reporting);
    
    // Add audit compliance section
    container.insertAdjacentHTML('beforeend', comprehensiveSections.auditCompliance);
    
    // Add API reference section
    container.insertAdjacentHTML('beforeend', comprehensiveSections.apiReference);
}

// Auto-load comprehensive sections when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadComprehensiveSections();
    // Re-setup smooth scrolling after content is loaded
    if (typeof setupSmoothScrolling === 'function') {
        setupSmoothScrolling();
    }
});

