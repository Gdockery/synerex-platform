// Final comprehensive sections for the User's Guide
const finalSections = {
    troubleshooting: `
        <div class="section" id="troubleshooting">
            <h2>13. Troubleshooting & FAQ</h2>
            
            <h3>13.1 Common Issues & Solutions</h3>
            
            <h4>13.1.1 File Upload Issues</h4>
            <div class="warning">
                <h4>❌ Problem: "File upload failed" or "400 Bad Request"</h4>
                <p><strong>Possible Causes & Solutions:</strong></p>
                <ul>
                    <li><strong>File Format:</strong> Ensure file is CSV, XLSX, or TXT format</li>
                    <li><strong>File Size:</strong> Check file size is under 100MB limit</li>
                    <li><strong>File Encoding:</strong> Ensure file is UTF-8 encoded</li>
                    <li><strong>Required Columns:</strong> Verify all required columns are present</li>
                    <li><strong>Data Format:</strong> Check timestamp and numeric data formats</li>
                </ul>
            </div>

            <div class="info">
                <h4>✅ Solution Steps:</h4>
                <ol>
                    <li>Verify file format and encoding</li>
                    <li>Check file size and structure</li>
                    <li>Ensure required columns are present</li>
                    <li>Validate data formats and ranges</li>
                    <li>Try uploading a smaller test file first</li>
                </ol>
            </div>

            <h4>13.1.2 Analysis Execution Issues</h4>
            <div class="warning">
                <h4>❌ Problem: "Analysis failed" or "500 Internal Server Error"</h4>
                <p><strong>Common Causes:</strong></p>
                <ul>
                    <li><strong>Missing Files:</strong> Before/after files not properly assigned</li>
                    <li><strong>Data Quality:</strong> Insufficient data quality for analysis</li>
                    <li><strong>Configuration:</strong> Invalid analysis parameters</li>
                    <li><strong>System Resources:</strong> Insufficient memory or processing power</li>
                </ul>
            </div>

            <div class="info">
                <h4>✅ Solution Steps:</h4>
                <ol>
                    <li>Verify file assignments in project</li>
                    <li>Check data quality and completeness</li>
                    <li>Validate analysis parameters</li>
                    <li>Restart system if resource issues</li>
                    <li>Check system logs for detailed errors</li>
                </ol>
            </div>

            <h4>10.1.3 Report Generation Issues</h4>
            <div class="warning">
                <h4>❌ Problem: "Report generation failed" or missing data in reports</h4>
                <p><strong>Common Causes:</strong></p>
                <ul>
                    <li><strong>Analysis Results:</strong> No analysis results available</li>
                    <li><strong>Client Information:</strong> Missing required client data</li>
                    <li><strong>Template Issues:</strong> Report template errors</li>
                    <li><strong>Data Mapping:</strong> Incorrect data field mapping</li>
                </ul>
            </div>

            <h3>13.2 System Performance Issues</h3>
            
            <h4>13.2.1 Slow Performance</h4>
            <div class="feature-card">
                <h4>🐌 Performance Optimization Tips:</h4>
                <ul>
                    <li><strong>File Size:</strong> Use smaller files or split large datasets</li>
                    <li><strong>Browser Cache:</strong> Clear browser cache and cookies</li>
                    <li><strong>System Resources:</strong> Close unnecessary applications</li>
                    <li><strong>Network:</strong> Check internet connection stability</li>
                    <li><strong>Database:</strong> Regular database maintenance and cleanup</li>
                </ul>
            </div>

            <h4>13.2.2 Memory Issues</h4>
            <div class="info">
                <h4>💾 Memory Management:</h4>
                <ul>
                    <li><strong>Minimum RAM:</strong> 8 GB required, 16 GB recommended</li>
                    <li><strong>Browser Memory:</strong> Restart browser if memory issues occur</li>
                    <li><strong>System Memory:</strong> Monitor system memory usage</li>
                    <li><strong>File Processing:</strong> Process files in smaller batches</li>
                </ul>
            </div>

            <h3>13.3 Data Quality Issues</h3>
            
            <h4>13.3.1 Data Validation Failures</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Issue</th>
                        <th>Cause</th>
                        <th>Solution</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Missing Timestamps</td>
                        <td>Incomplete time series data</td>
                        <td>Fill gaps or use interpolation</td>
                    </tr>
                    <tr>
                        <td>Invalid Power Values</td>
                        <td>Negative or zero power readings</td>
                        <td>Review and correct data source</td>
                    </tr>
                    <tr>
                        <td>Inconsistent Intervals</td>
                        <td>Variable time intervals</td>
                        <td>Resample to consistent intervals</td>
                    </tr>
                    <tr>
                        <td>Outlier Values</td>
                        <td>Erroneous measurements</td>
                        <td>Apply outlier detection and removal</td>
                    </tr>
                </tbody>
            </table>

            <h4>13.3.2 Standards Compliance Issues</h4>
            <div class="warning">
                <h4>⚠️ Compliance Warnings:</h4>
                <ul>
                    <li><strong>ASHRAE CV > 10%:</strong> Data quality below acceptable threshold</li>
                    <li><strong>IEEE 519 Non-Compliance:</strong> Harmonic distortion exceeds limits</li>
                    <li><strong>NEMA MG1 Issues:</strong> Three-phase unbalance problems</li>
                    <li><strong>IPMVP Violations:</strong> Measurement and verification issues</li>
                </ul>
            </div>

            <h3>13.4 Frequently Asked Questions</h3>
            
            <h4>13.4.1 General Questions</h4>
            <div class="feature-card">
                <h4>❓ Q: What file formats are supported?</h4>
                <p><strong>A:</strong> The system supports CSV, XLSX, and TXT files with UTF-8 encoding. Files must contain timestamp and power measurement data.</p>
            </div>

            <div class="feature-card">
                <h4>❓ Q: How much data do I need for analysis?</h4>
                <p><strong>A:</strong> Minimum 14 days of data is required for ASHRAE compliance. 30+ days is recommended for better statistical accuracy.</p>
            </div>

            <div class="feature-card">
                <h4>❓ Q: Can I analyze multiple circuits simultaneously?</h4>
                <p><strong>A:</strong> Yes, you can create separate projects for different circuits and compare results across projects.</p>
            </div>

            <h4>13.4.2 Technical Questions</h4>
            <div class="feature-card">
                <h4>❓ Q: What standards does the system comply with?</h4>
                <p><strong>A:</strong> IEEE 519, ASHRAE Guideline 14, NEMA MG1, IPMVP Volume I, ANSI C12.1, and IEC 61000 series standards.</p>
            </div>

            <div class="feature-card">
                <h4>❓ Q: How accurate are the calculations?</h4>
                <p><strong>A:</strong> All calculations follow industry-standard methodologies with measurement uncertainties typically < 3%.</p>
            </div>

            <div class="feature-card">
                <h4>❓ Q: Can I export data for external analysis?</h4>
                <p><strong>A:</strong> Yes, the system provides comprehensive Excel exports and API access for data integration.</p>
            </div>

            <h3>13.5 Support & Contact Information</h3>
            
            <h4>13.5.1 Getting Help</h4>
            <div class="info">
                <h4>📞 Support Channels:</h4>
                <ul>
                    <li><strong>User's Guide:</strong> Comprehensive documentation (this document)</li>
                    <li><strong>System Logs:</strong> Check application logs for detailed error information</li>
                    <li><strong>Technical Support:</strong> Contact system administrator for technical issues</li>
                    <li><strong>Training:</strong> Request training sessions for advanced features</li>
                </ul>
            </div>

            <h4>13.5.2 System Logs</h4>
            <div class="code-block">
# Check system logs for detailed error information
# Log files are located in the application directory
# Look for entries with ERROR or WARNING levels
# Include log entries when reporting issues
            </div>
        </div>
    `,

    bestPractices: `
        <div class="section" id="best-practices">
            <h2>14. Best Practices & Recommendations</h2>
            
            <h3>14.1 Data Collection Best Practices</h3>
            
            <h4>14.1.1 Meter Data Collection</h4>
            <div class="success">
                <h4>✅ Recommended Practices:</h4>
                <ul>
                    <li><strong>Data Frequency:</strong> Use 1-minute interval data for best accuracy</li>
                    <li><strong>Collection Period:</strong> Collect 30+ days of data for statistical validity</li>
                    <li><strong>Data Quality:</strong> Ensure >95% data completeness</li>
                    <li><strong>Calibration:</strong> Use calibrated meters with known accuracy</li>
                    <li><strong>Documentation:</strong> Document all measurement conditions</li>
                </ul>
            </div>

            <h4>14.1.2 File Organization</h4>
            <div class="feature-card">
                <h4>📁 File Naming Convention:</h4>
                <p><strong>Recommended Format:</strong></p>
                <ul>
                    <li><code>FacilityName_CircuitID_Period_YYYYMMDD.csv</code></li>
                    <li><strong>Example:</strong> <code>PlantA_Main_Before_20250301.csv</code></li>
                    <li><strong>Benefits:</strong> Easy identification and organization</li>
                </ul>
            </div>

            <h3>14.2 Analysis Configuration Best Practices</h3>
            
            <h4>14.2.1 Project Setup</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Define Clear Objectives:</strong> Establish specific analysis goals and requirements
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Select Appropriate Standards:</strong> Choose relevant standards for your application
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Configure Analysis Parameters:</strong> Set appropriate thresholds and limits
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Document Assumptions:</strong> Record all assumptions and limitations
            </div>

            <h4>14.2.2 Client Information Management</h4>
            <div class="info">
                <h4>📋 Information Requirements:</h4>
                <ul>
                    <li><strong>Complete Contact Information:</strong> Ensure all contact details are current</li>
                    <li><strong>Facility Details:</strong> Accurate facility address and location</li>
                    <li><strong>Utility Information:</strong> Correct utility company and account details</li>
                    <li><strong>Meter Specifications:</strong> Accurate meter model and accuracy class</li>
                </ul>
            </div>

            <h3>14.3 Quality Assurance Best Practices</h3>
            
            <h4>14.3.1 Data Validation</h4>
            <div class="warning">
                <h4>🔍 Validation Checklist:</h4>
                <ul>
                    <li><strong>File Integrity:</strong> Verify file fingerprints and checksums</li>
                    <li><strong>Data Completeness:</strong> Check for missing or null values</li>
                    <li><strong>Range Validation:</strong> Verify data within expected ranges</li>
                    <li><strong>Consistency Checks:</strong> Validate logical relationships</li>
                    <li><strong>Outlier Detection:</strong> Identify and investigate anomalies</li>
                </ul>
            </div>

            <h4>14.3.2 Analysis Review</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Review Input Data:</strong> Verify all input parameters are correct
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Check Intermediate Results:</strong> Validate calculation steps
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Verify Final Results:</strong> Ensure results are reasonable and consistent
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Document Review Process:</strong> Record review findings and decisions
            </div>

            <h3>14.4 Professional Engineering Best Practices</h3>
            
            <h4>14.4.1 PE Review Process</h4>
            <div class="success">
                <h4>👨‍💼 PE Review Checklist:</h4>
                <ul>
                    <li><strong>Calculation Verification:</strong> Review all calculation methodologies</li>
                    <li><strong>Standards Compliance:</strong> Verify compliance with applicable standards</li>
                    <li><strong>Data Quality Assessment:</strong> Evaluate data quality and uncertainty</li>
                    <li><strong>Results Validation:</strong> Confirm results are reasonable and accurate</li>
                    <li><strong>Documentation Review:</strong> Ensure complete and accurate documentation</li>
                </ul>
            </div>

            <h4>14.4.2 Certification Requirements</h4>
            <div class="feature-card">
                <h4>📜 Certification Process:</h4>
                <ul>
                    <li><strong>PE License Verification:</strong> Confirm valid PE license</li>
                    <li><strong>State Registration:</strong> Verify state registration status</li>
                    <li><strong>Review Documentation:</strong> Complete review checklist</li>
                    <li><strong>Signature Capture:</strong> Provide digital signature</li>
                    <li><strong>Seal Application:</strong> Apply PE seal to documents</li>
                </ul>
            </div>

            <h3>14.5 Utility Submission Best Practices</h3>
            
            <h4>14.5.1 Submission Preparation</h4>
            <div class="info">
                <h4>📤 Submission Checklist:</h4>
                <ul>
                    <li><strong>Complete Documentation:</strong> Ensure all required documents are included</li>
                    <li><strong>PE Certification:</strong> Verify PE review and certification</li>
                    <li><strong>Standards Compliance:</strong> Confirm all standards are met</li>
                    <li><strong>Data Quality:</strong> Validate data quality meets requirements</li>
                    <li><strong>Timeline Compliance:</strong> Submit within required timeframe</li>
                </ul>
            </div>

            <h4>14.5.2 Utility-Specific Requirements</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Utility</th>
                        <th>Special Requirements</th>
                        <th>Timeline</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Oncor</td>
                        <td>PE Stamp Required</td>
                        <td>30 days</td>
                        <td>Professional Engineer seal mandatory</td>
                    </tr>
                    <tr>
                        <td>CenterPoint</td>
                        <td>Meter Certification</td>
                        <td>45 days</td>
                        <td>Meter calibration certificate required</td>
                    </tr>
                    <tr>
                        <td>AEP</td>
                        <td>Statistical Validation</td>
                        <td>60 days</td>
                        <td>ASHRAE 14 compliance required</td>
                    </tr>
                    <tr>
                        <td>Entergy</td>
                        <td>Harmonic Analysis</td>
                        <td>30 days</td>
                        <td>IEEE 519 compliance verification</td>
                    </tr>
                </tbody>
            </table>

            <h3>14.6 System Maintenance Best Practices</h3>
            
            <h4>14.6.1 Regular Maintenance</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Database Maintenance:</strong> Regular database cleanup and optimization
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>File Cleanup:</strong> Remove temporary and obsolete files
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Log Management:</strong> Archive and clean up log files
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Backup Verification:</strong> Test backup and recovery procedures
            </div>

            <h4>14.6.2 Security Best Practices</h4>
            <div class="warning">
                <h4>🔒 Security Recommendations:</h4>
                <ul>
                    <li><strong>Access Control:</strong> Implement proper user access controls</li>
                    <li><strong>Data Encryption:</strong> Encrypt sensitive data at rest and in transit</li>
                    <li><strong>Audit Logging:</strong> Maintain comprehensive audit trails</li>
                    <li><strong>Regular Updates:</strong> Keep system and dependencies updated</li>
                    <li><strong>Backup Security:</strong> Secure backup storage and access</li>
                </ul>
            </div>
        </div>
    `,

    appendix: `
        <div class="section" id="appendix">
            <h2>15. Appendix & Reference Materials</h2>
            
            <h3>15.1 Standards Reference</h3>
            
            <h4>15.1.1 IEEE Standards</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Standard</th>
                        <th>Title</th>
                        <th>Application</th>
                        <th>Key Requirements</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>IEEE 519-2014/2022</td>
                        <td>Recommended Practice for Harmonic Control</td>
                        <td>Harmonic Distortion Limits</td>
                        <td>THD Voltage ≤5%, THD Current ≤8%</td>
                    </tr>
                    <tr>
                        <td>IEEE 1459-2010</td>
                        <td>Standard for Power Definitions</td>
                        <td>Power Quality Definitions</td>
                        <td>Power factor, apparent power definitions</td>
                    </tr>
                    <tr>
                        <td>IEEE 1159-2019</td>
                        <td>Recommended Practice for Monitoring</td>
                        <td>Power Quality Monitoring</td>
                        <td>Monitoring procedures and equipment</td>
                    </tr>
                </tbody>
            </table>

            <h4>15.1.2 ASHRAE Standards</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Standard</th>
                        <th>Title</th>
                        <th>Application</th>
                        <th>Key Requirements</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>ASHRAE Guideline 14-2014</td>
                        <td>Measurement of Energy and Demand Savings</td>
                        <td>M&V Protocols</td>
                        <td>CV <10%, RP <5%, >95% completeness</td>
                    </tr>
                    <tr>
                        <td>ASHRAE Standard 90.1-2019</td>
                        <td>Energy Standard for Buildings</td>
                        <td>Energy Efficiency</td>
                        <td>Baseline energy performance</td>
                    </tr>
                </tbody>
            </table>

            <h3>15.2 Technical Specifications</h3>
            
            <h4>15.2.1 System Requirements</h4>
            <div class="info">
                <h4>💻 Hardware Requirements:</h4>
                <ul>
                    <li><strong>CPU:</strong> Intel i5 or AMD Ryzen 5 (minimum)</li>
                    <li><strong>RAM:</strong> 8 GB (16 GB recommended)</li>
                    <li><strong>Storage:</strong> 2 GB available space</li>
                    <li><strong>Network:</strong> Broadband internet connection</li>
                    <li><strong>Display:</strong> 1920x1080 resolution (minimum)</li>
                </ul>
            </div>

            <h4>15.2.2 Software Dependencies</h4>
            <div class="code-block">
# Python Dependencies
Flask==2.3.3
openpyxl==3.1.2
pandas==2.0.3
numpy==1.24.3
scipy==1.11.1
requests==2.31.0
sqlite3 (built-in)

# Browser Requirements
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
JavaScript enabled
Cookies enabled
            </div>

            <h3>15.3 Data Format Specifications</h3>
            
            <h4>15.3.1 CSV Format Requirements</h4>
            <div class="code-block">
# Required Columns (minimum)
Timestamp,Power_kW,Voltage_V,Current_A

# Optional Columns (enhanced analysis)
Apparent_Power_kVA,Reactive_Power_kVAR,Power_Factor,THD_Percent,Frequency_Hz,Temperature_F

# Example CSV Structure
Timestamp,Power_kW,Voltage_V,Current_A,Power_Factor,THD_Percent
2025-01-01 00:00:00,179.35,277.2,647.8,0.89,2.9
2025-01-01 00:01:00,180.12,277.1,648.2,0.89,2.8
2025-01-01 00:02:00,178.95,277.3,647.5,0.90,2.9
            </div>

            <h4>15.3.2 Data Quality Requirements</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Minimum Value</th>
                        <th>Maximum Value</th>
                        <th>Units</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Power</td>
                        <td>0.1</td>
                        <td>10,000</td>
                        <td>kW</td>
                    </tr>
                    <tr>
                        <td>Voltage</td>
                        <td>100</td>
                        <td>500</td>
                        <td>V</td>
                    </tr>
                    <tr>
                        <td>Current</td>
                        <td>0.1</td>
                        <td>5,000</td>
                        <td>A</td>
                    </tr>
                    <tr>
                        <td>Power Factor</td>
                        <td>0.1</td>
                        <td>1.0</td>
                        <td>pu</td>
                    </tr>
                    <tr>
                        <td>THD</td>
                        <td>0.0</td>
                        <td>50.0</td>
                        <td>%</td>
                    </tr>
                </tbody>
            </table>

            <h3>15.4 Error Codes Reference</h3>
            
            <h4>15.4.1 System Error Codes</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Error Code</th>
                        <th>Description</th>
                        <th>Cause</th>
                        <th>Solution</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>FILE_UPLOAD_FAILED</td>
                        <td>File upload unsuccessful</td>
                        <td>Invalid format or size</td>
                        <td>Check file format and size</td>
                    </tr>
                    <tr>
                        <td>DATA_VALIDATION_ERROR</td>
                        <td>Data validation failed</td>
                        <td>Missing required columns</td>
                        <td>Verify data structure</td>
                    </tr>
                    <tr>
                        <td>ANALYSIS_TIMEOUT</td>
                        <td>Analysis execution timeout</td>
                        <td>Large dataset or system load</td>
                        <td>Reduce data size or retry</td>
                    </tr>
                    <tr>
                        <td>STANDARDS_NON_COMPLIANT</td>
                        <td>Standards compliance failure</td>
                        <td>Data quality below threshold</td>
                        <td>Improve data quality</td>
                    </tr>
                </tbody>
            </table>

            <h3>15.5 Glossary of Terms</h3>
            
            <h4>15.5.1 Technical Terms</h4>
            <div class="feature-card">
                <h4>📚 Key Definitions:</h4>
                <ul>
                    <li><strong>THD (Total Harmonic Distortion):</strong> Measure of harmonic distortion in electrical systems</li>
                    <li><strong>CV (Coefficient of Variation):</strong> Statistical measure of data variability</li>
                    <li><strong>IPMVP (International Performance Measurement and Verification Protocol):</strong> Standard for energy savings measurement</li>
                    <li><strong>ASHRAE (American Society of Heating, Refrigerating and Air-Conditioning Engineers):</strong> Professional organization setting HVAC standards</li>
                    <li><strong>IEEE (Institute of Electrical and Electronics Engineers):</strong> Professional organization setting electrical standards</li>
                    <li><strong>NEMA (National Electrical Manufacturers Association):</strong> Trade association for electrical equipment standards</li>
                </ul>
            </div>

            <h3>15.6 Version History</h3>
            
            <h4>15.6.1 System Versions</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Version</th>
                        <th>Release Date</th>
                        <th>Key Features</th>
                        <th>Changes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>3.0</td>
                        <td>October 2025</td>
                        <td>Comprehensive Audit System</td>
                        <td>World-class Excel audit, 9-sheet workbook</td>
                    </tr>
                    <tr>
                        <td>2.1</td>
                        <td>September 2025</td>
                        <td>Enhanced Analysis</td>
                        <td>Improved statistical analysis, weather normalization</td>
                    </tr>
                    <tr>
                        <td>2.0</td>
                        <td>August 2025</td>
                        <td>Standards Compliance</td>
                        <td>IEEE 519, ASHRAE 14, NEMA MG1 compliance</td>
                    </tr>
                    <tr>
                        <td>1.0</td>
                        <td>July 2025</td>
                        <td>Initial Release</td>
                        <td>Basic power quality analysis</td>
                    </tr>
                </tbody>
            </table>

            <h3>15.7 Contact Information</h3>
            
            <h4>15.7.1 Support Resources</h4>
            <div class="info">
                <h4>📞 Support Information:</h4>
                <ul>
                    <li><strong>User's Guide:</strong> This comprehensive documentation</li>
                    <li><strong>System Administrator:</strong> Contact for technical support</li>
                    <li><strong>Training:</strong> Available for advanced features</li>
                    <li><strong>Updates:</strong> Regular system updates and improvements</li>
                </ul>
            </div>

            <div class="success">
                <h4>🎉 Congratulations!</h4>
                <p>You have completed the comprehensive SYNEREX User's Guide. This guide provides detailed information about all aspects of the system, from basic usage to advanced features and best practices.</p>
                <p>For the most up-to-date information and additional resources, please refer to the system documentation and contact your system administrator.</p>
            </div>
        </div>
    `
};

// Function to load final sections
function loadFinalSections() {
    const container = document.querySelector('.container');
    
    // Add troubleshooting section
    container.insertAdjacentHTML('beforeend', finalSections.troubleshooting);
    
    // Add best practices section
    container.insertAdjacentHTML('beforeend', finalSections.bestPractices);
    
    // Add appendix section
    container.insertAdjacentHTML('beforeend', finalSections.appendix);
}

// Auto-load final sections when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadFinalSections();
    // Re-setup smooth scrolling after content is loaded
    if (typeof setupSmoothScrolling === 'function') {
        setupSmoothScrolling();
    }
});
