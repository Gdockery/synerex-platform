# SYNEREX OneForm System - Version 3.8

**STATUS**: Production-ready, all services running successfully  
**LAST UPDATED**: 2025-11-24  

### ✅ Windows Compatibility Achieved
- **Windows Batch Scripts**: `start_services.bat` (Windows) and `start_services.sh` (Linux/macOS) working perfectly
- **Dependencies Installed**: All Python packages (numpy, pandas, matplotlib, flask, etc.) properly installed
- **Services Running**: Main App (8082), HTML Reports (8084), Chart Service (8086), PDF Generator (8083), Weather Service (8200)
- **Virtual Environment**: Python venv with all required dependencies
- **Cross-Platform**: Works on Windows, Linux, and macOS

## 🎯 OPTIMIZED PORT ARCHITECTURE

**CLEAN 5-PORT STRUCTURE:**
- **Port 8082**: Main SYNEREX Application
- **Port 8083**: PDF Generator Service
- **Port 8084**: HTML Report Service  
- **Port 8086**: Chart Service
- **Port 8200**: Weather Service

## 🏢 FACILITY-SPECIFIC ANALYSIS (Version 3.8)

SYNEREX now supports specialized analysis for five distinct facility types, each with industry-specific metrics, calculations, and compliance standards:

### ❄️ Cold Storage Facilities
- **Energy Intensity Metrics**: kWh per unit of product (kWh/lb, kWh/ton)
- **Storage Efficiency**: Product weight vs. storage capacity utilization
- **Standards**: ASHRAE Standard 15, ASHRAE Standard 34, ENERGY STAR Commercial Refrigeration
- **Use Cases**: Cold storage warehouses, food processing facilities, distribution centers

### 🖥️ Data Center / GPU Facilities
- **PUE (Power Usage Effectiveness)**: Total facility power / IT equipment power
- **Compute Efficiency**: kWh per GPU-hour, kWh per teraflop
- **Power Density**: kW per rack, kW per sqft, kW per GPU
- **Standards**: ASHRAE Standard 90.4, ASHRAE TC 9.9, The Green Grid PUE, ISO/IEC 30134
- **Use Cases**: Traditional data centers, GPU/AI training facilities, colocation facilities, edge computing centers

### 🏥 Healthcare Facilities
- **Energy per Patient Day**: Total energy / patient days (kWh/patient-day)
- **Energy per Bed**: Annual energy per bed (kWh/bed/year)
- **OR Efficiency**: Operating room energy intensity
- **Standards**: ASHRAE Standard 170, FGI Guidelines, Joint Commission Environment of Care
- **Use Cases**: Hospitals, clinics, medical centers, surgical centers, nursing homes

### 🏨 Hospitality Facilities
- **Energy per Room-Night**: Total energy / occupied room-nights (kWh/room-night)
- **Energy per Guest**: Total energy / guest count (kWh/guest)
- **Energy per Meal**: Total energy / meals served (kWh/meal) - for restaurants
- **Standards**: ASHRAE Standard 90.1, ENERGY STAR Portfolio Manager, AHLA Guidelines
- **Use Cases**: Hotels, resorts, restaurants, banquet halls, casinos

### 🏭 Manufacturing & Industrial Facilities
- **Energy per Unit Produced**: Total energy / units produced (kWh/unit) - PRIMARY METRIC
- **Energy per Machine Hour**: Total energy / machine hours (kWh/machine-hour)
- **Compressed Air Efficiency**: kWh/(CFM-psi-hour) per ASME EA-2
- **Motor Efficiency**: kWh/HP-hour per NEMA MG1
- **Standards**: ISO 50001, ASME EA-2, NEMA MG1-2016, EPA ENERGY STAR Industrial Facilities
- **Use Cases**: Manufacturing plants, assembly plants, processing facilities, foundries, chemical processing

### ⚙️ General Energy Analysis
- Standard power quality and energy analysis for general industrial facilities
- IEEE 519 compliance, harmonic distortion analysis, three-phase balance
- Use Cases: General industrial facilities, facilities without specific facility type

**Access**: Navigate to Main Dashboard → Facility-Specific Analysis section → Select facility type card

## 🌡️ ASHRAE-COMPLIANT WEATHER NORMALIZATION (Version 3.8+)

SYNEREX implements fully ASHRAE Guideline 14-2014 compliant weather normalization with advanced features:

### Key Features

- **Base Temperature Optimization**: Automatically calculates optimal base temperature from baseline data (building-specific, not fixed 18.3°C)
- **Regression-Based Sensitivity Factors**: Calculated from actual baseline meter data via regression analysis, not fixed values
- **Timestamp-by-Timestamp Normalization**: Individual normalization for each timestamp in "after" period for improved accuracy
- **15-Minute Interval Matching**: Automatically detects meter intervals and matches weather data at exact timestamps
- **Weather Data Interpolation**: Interpolates hourly weather data to 15-minute intervals for precise matching
- **R² Validation**: Requires R² > 0.7 for ASHRAE compliance
- **Building-Specific Calibration**: Sensitivity factors and base temperature calibrated to specific building/equipment
- **Equipment-Specific Factors**: Uses equipment-specific sensitivity factors (e.g., 3.6% per °C for chillers)

### How It Works

1. **Base Temperature Optimization**: Grid search finds optimal base temperature (10-25°C) that maximizes R² from baseline data
2. **Interval Detection**: System analyzes meter timestamps to detect data interval (typically 15 minutes)
3. **Weather Interpolation**: Hourly weather from Open-Meteo is interpolated to 15-minute intervals using linear interpolation
4. **Exact Matching**: Meter timestamps matched to weather data at exact intervals (e.g., Day 1 12:00 → Day 1 12:00)
5. **Regression Analysis**: Linear regression on matched baseline data points to calculate sensitivity factors
6. **Timestamp Normalization**: Each timestamp in "after" period normalized individually using baseline regression model
7. **Aggregation**: Normalized timestamps averaged to get final normalized consumption

### Benefits

- **Building-Specific Accuracy**: Optimized base temperature reflects actual balance point for each building
- **4x More Data Points**: 96/day (15-min) vs 24/day (hourly) for regression
- **Better Accuracy**: Captures short-term temperature variations and intraday weather changes
- **ASHRAE Compliance**: Fully meets ASHRAE Guideline 14-2014 requirements
- **Utility Standard Alignment**: Matches typical 15-minute demand intervals
- **Time-of-Day Preservation**: Exact timestamp matching preserves relationships between temperature and energy at specific times
- **Enhanced Precision**: Timestamp-by-timestamp normalization provides more accurate results than average-based methods

### Technical Details

- **Weather Service**: Fetches hourly data from Open-Meteo Archive API
- **Interpolation Method**: Linear interpolation between hourly weather points
- **Matching Algorithm**: Exact timestamp matching with fallback to closest match within interval window
- **Regression Model**: `Energy = β₀ + β₁ × CDD + β₂ × HDD` (temperature + dewpoint model)
- **Base Temperature**: Optimized from baseline data (grid search, 10-25°C range, 0.5°C steps)
- **Sensitivity Factors**: Calculated from regression coefficients (equipment-specific, not fixed)
- **Validation**: R² > 0.7 required for ASHRAE compliance, falls back to equipment-specific fixed factors if validation fails
- **Normalization Method**: Timestamp-by-timestamp (if time series available) or average-based (fallback)

## 🚀 NEW FEATURES IN VERSION 3.1

### ✅ Chart Selection System
- **Customizable Reports**: Users can select which charts to include in HTML reports
- **Chart Checkboxes**: AVGKW, AVGKVA, Smoothing Index, Variance Reduction, CV Reduction
- **Smaller File Sizes**: Fewer charts = smaller PDF files
- **Client-Specific**: Different clients can choose different chart sets

### ✅ Enhanced Admin Panel
- **Loading Gauge**: Visual feedback with spinner and progress bar for all operations
- **Service Management**: Start, restart, stop, and check all 5 services
- **Real-time Status**: LED indicators and health checks for all services
- **Individual Controls**: Restart individual services with visual feedback

### ✅ Cross-Platform Compatibility
- **Pure Python/Batch System**: Eliminated all PowerShell dependencies
- **Native Commands**: Uses batch files (Windows) and shell scripts (Linux/macOS)
- **Cross-Platform**: Works on Windows, Linux, macOS
- **Service Management**: Use `start_services.sh` (Linux/macOS) or `start_services.bat` (Windows)

### ✅ Service Architecture
- **5 Services**: All services properly integrated and tested
- **Health Endpoints**: All services have `/health` endpoints for monitoring
- **Admin Panel Integration**: Complete service management through web interface

### Tracking Integration (EM&V ↔ Tracking)

EMV can import Bill Analytic data from Tracking projects and push analysis results back to Tracking:

- **Project selector:** Choose a Tracking project from the analysis form
- **Import from Bill Analytic:** Pre-fill form fields from the project's electricBillAnalysis (totalKwh, kwPeak, electricCompanyName, etc.)
- **Push Analysis to Tracking:** After running analysis, push savings % and HTML report to update the project baseline

**Setup:** Set `TRACKING_URL` (or `TRACKING_BASE_URL`), `EMV_API_KEY` (or `TRACKING_API_KEY`) in both EMV and Tracking. Use the same API key value. See `tracking-program/8087/flask_app/docs/EMV_INTEGRATION.md` for details.

### Admin "Start All" with Docker
When the main app (8082) runs **inside Docker**, the Admin Panel **Start All** button runs `docker compose up -d` so the whole stack starts. The `emv-program` container needs:
- **Volumes**: repo root at `/workspace`, Docker socket at `/var/run/docker.sock` (already set in `docker-compose.yml`).
- **Env**: `COMPOSE_PROJECT_DIR=/workspace` (already set).
- **Docker CLI in image** (optional): if the 8082 image does not include the `docker` command, Start All falls back to the Service Manager (host processes). To have Start All use Docker, extend the image with `apt-get install -y docker.io` (or install Docker Compose v2) so `docker compose up -d` runs inside the container.

### Weather service (port 8200) – "Connection refused" or fetch failed
If you see **"Weather fetch failed: ... Connection refused"** or **"Weather service error: ... port=8200"**, the Weather Service is not running or not reachable.

1. **Start only the weather service** (from the `emv-program` directory):
   ```bash
   ./8085/start_weather_service.sh
   ```
   Logs go to `logs/weather_service.log`.

2. **Or start all services** (stops existing ones first):
   ```bash
   ./start_services.sh
   ```

3. **Check that something is listening on 8200:**
   ```bash
   # Linux/macOS
   lsof -i :8200
   # or
   curl -s http://127.0.0.1:8200/health
   ```
   If `curl` returns `{"status":"healthy",...}`, the service is up.

4. **If it still fails:** Inspect the log for startup errors (e.g. missing `flask-cors` or port in use):
   ```bash
   tail -50 logs/weather_service.log
   ```
   Ensure you run the start script from the **emv-program** directory so paths and venv are correct.
- **Error Handling**: Robust error handling and status reporting

### ⚠️ Important: Service Startup Timing
- **Startup Duration**: The `start_services.sh` script takes approximately **60 seconds** to complete fully
- **Wait Before Checking**: Always wait at least **60 seconds** after starting services before checking status or running additional commands
- **Avoid Duplicate Starts**: Do not run the startup script multiple times - wait for the initial process to complete
- **Recommendation**: Use `./check_services.sh` to verify services are running instead of restarting

### ✅ HTTP Testing Strategy
- **Python Scripts**: Use for multiple commands, complex operations, and service management
- **Curl Commands**: Use for single API calls and quick testing
- **Cross-Platform**: Works on Windows, Linux, macOS without shell differences
- **No PowerShell**: Completely eliminated PowerShell dependencies

#### Starting Services
```bash
# Linux/macOS
./start_services.sh

# Windows
start_services.bat

# Stop services
./stop_services.sh  # Linux/macOS
stop_services.bat   # Windows
```

#### Testing Examples
```bash
# Single API calls - use curl
curl -s ${EMV_BASE_URL}/health
curl -s -X POST -H "Content-Type: application/json" -d "{\"manual_mode\": true, \"before_file_id\": 1, \"after_file_id\": 2}" ${EMV_BASE_URL}/api/analyze

# Check service status
./check_services.sh  # Linux/macOS
```

## HTML Report Generation - DIRECT GET APPROACH

**IMPORTANT: We use the direct GET approach for HTML report generation to ensure consistency and eliminate duplicate calculations.**

### Direct GET Approach

The system uses a **direct GET approach** for HTML report generation that ensures complete consistency:

1. **Service**: `8084/html_report_service.py` (port 8084)
2. **Function**: `generate_exact_template_html()` from `8084/generate_exact_template_html.py`
3. **Method**: GET requests for Client HTML Report
4. **Template**: `8082/report_template.html` with lowercase variables
5. **Approach**: **Direct GET from UI HTML Report generator** - no duplicate calculations
6. **Architecture**: Single source of truth for all calculations

### Direct GET Benefits

✅ **Single Source of Truth** - Only Main App (8082) does calculations (Python + JavaScript)  
✅ **Complete Consistency** - Same values in UI and Client HTML Reports  
✅ **Scalable Architecture** - Easy to add new calculations  
✅ **Maintainable Code** - Fix calculations in one place only  
✅ **No Duplicate Work** - No repeated calculation logic anywhere  
✅ **Reduced Complexity** - Fewer moving parts, less chance of errors  

### What We DON'T Use

- ❌ Duplicate calculations in HTML service (8084)
- ❌ Complex `_generate_report()` function from main app
- ❌ POST requests for Client HTML Report  
- ❌ Complex data processing with Unicode issues
- ❌ Port 8088 services
- ❌ Complex debug printing that causes encoding errors

### Architecture

```
Main App (8082) → HTML Report Service (8084) → generate_exact_template_html()
```

**Data Flow**: Main app calculates (Python + JavaScript) → HTML service displays pre-calculated values

### Template Variables

All template variables in `8082/report_template.html` are **lowercase**:
- `{{test_name}}` (not `{{TEST_NAME}}`)
- `{{circuit_name}}` (not `{{CIRCUIT_NAME}}`)
- `{{company}}` (not `{{COMPANY}}`)
- `{{kw_before}}` (not `{{KW_BEFORE}}`)
- `{{kw_after}}` (not `{{KW_AFTER}}`)
- `{{kva_before}}` (not `{{KVA_BEFORE}}`)

### Key Files & Service Responsibilities

- **Main App (8082)**: `main_hardened_ready_refactored.py` - Handles all calculations and template placeholder population (production version)
  - **Note**: `main_hardened_ready_fixed.py` is kept as a legacy reference file for backup purposes only
- **HTML Service (8084)**: `html_report_service.py` - Serves HTML reports via GET requests
- **Template Processor (8084)**: `generate_exact_template_html.py` - Processes template replacements
- **Template File**: `8082/report_template.html` - Contains lowercase template variables

### Error Prevention

- No Unicode encoding issues in debug printing
- No complex data structure processing
- Simple string replacement only
- No `TypeError: replace() argument 2 must be str, not int`
- No duplicate calculations causing inconsistencies
- No sign errors from multiple calculation sources

### Implementation Details

**All calculations use the direct GET approach:**
- Voltage improvement - GET from UI HTML Report generator
- kW improvement - GET from UI HTML Report generator  
- kVA improvement - GET from UI HTML Report generator
- kVAR improvement - GET from UI HTML Report generator
- Power Factor improvement - GET from UI HTML Report generator
- THD improvement - GET from UI HTML Report generator
- Current improvement - GET from UI HTML Report generator
- IEEE kW normalized improvement - GET from UI HTML Report generator
- IEEE voltage improvement - GET from UI HTML Report generator

## 🔒 AUDIT COMPLIANCE - HARDCODED VALUES ELIMINATION

### Critical Fix: Template Placeholders

**ISSUE RESOLVED**: The "Raw Meter Test Data" section was showing identical values for before and after data due to missing template placeholders.

### What Was Fixed

1. **Missing Template Placeholders**: Added missing placeholders in `8082/main_hardened_ready_refactored.py` (production version):
   ```python
   # CRITICAL FIX: Add basic template placeholders for Raw Meter Test Data section
   replacements['{{kw_before}}'] = f"{kw_before:.1f} kW"
   replacements['{{kw_after}}'] = f"{kw_after:.1f} kW"
   replacements['{{kva_before}}'] = f"{kva_before:.1f} kVA"
   replacements['{{kva_after}}'] = f"{kva_after:.1f} kVA"
   replacements['{{kvar_before}}'] = f"{kvar_before:.1f} kVAR"
   replacements['{{kvar_after}}'] = f"{kvar_after:.1f} kVAR"
   replacements['{{pf_before}}'] = f"{pf_before:.2f}"
   replacements['{{pf_after}}'] = f"{pf_after:.2f}"
   replacements['{{thd_before}}'] = f"{thd_before:.1f}%"
   replacements['{{thd_after}}'] = f"{thd_after:.1f}%"
   replacements['{{amps_before}}'] = f"{current_before:.1f} A"
   replacements['{{amps_after}}'] = f"{current_after:.1f} A"
   replacements['{{volts_before}}'] = f"{voltage_before:.1f} V"
   replacements['{{volts_after}}'] = f"{voltage_after:.1f} V"
   ```

2. **Hardcoded Fallback Values Removed**: All hardcoded fallback values eliminated:
   - Changed `pq.get('tdd_before', 2.9)` to `pq.get('tdd_before', 0.0)`
   - Changed `pq.get('kw_before', 246.8)` to `pq.get('kw_before', 0.0)`
   - Error handling now uses "N/A" instead of hardcoded values

3. **Audit Compliance**: System now uses only actual CSV data:
   - ✅ No hardcoded values that would fail an audit
   - ✅ All values traceable to source CSV files
   - ✅ Proper error handling with "N/A" for missing data
   - ✅ Full audit trail for all calculations

### Template Structure

The `8082/report_template.html` uses these placeholders for the "Raw Meter Test Data" section:
```html
<tr><td><strong>kW</strong></td>
    <td class="value-cell" style="text-align: center;">{{kw_before}}</td>
    <td class="value-cell" style="text-align: center;">{{kw_after}}</td>
    <td class="value-cell" style="text-align: center;">{{kw_improvement}}</td>
</tr>
```

### Audit Requirements Met

- **No Hardcoded Values**: All values come from actual CSV data
- **Traceability**: Every value can be traced back to source files
- **Consistency**: Before/after values are properly differentiated
- **Error Handling**: Missing data shows "N/A" instead of fake values
- **Standards Compliance**: Meets IEEE 519, ASHRAE, and IPMVP requirements

---

**Last Updated**: 2025-10-21  
**Status**: Direct GET approach implemented - complete consistency achieved  
**Audit Compliance**: Hardcoded values eliminated - full audit compliance achieved

---

## 📦 UTILITY SUBMISSION PACKAGE

The SYNEREX system generates comprehensive utility submission packages that meet the highest standards for utility rebate applications and regulatory compliance.

### Package Structure

The utility submission package is organized into 12 main sections:

#### 01_Cover_Letter_Application/
- Cover letter and application information

#### 02_Executive_Summary/
- Executive summary with key metrics and compliance status

#### 03_Technical_Analysis/
- Complete HTML Report
- Complete Technical Analysis Report (PDF)

#### 04_Standards_Compliance/
- Individual compliance reports for each standard (IEEE 519, ASHRAE, NEMA MG1, etc.)

#### 05_PE_Documentation/
- Professional Engineering review workflow documentation

#### 06_Data_Quality/
- Data Quality Assessment (PDF)
- CSV Data Integrity Protection System (PDF) - User-friendly explanation of fingerprint system
- Source_Data_Files/
  - before_verified_data.csv and fingerprint
  - after_verified_data.csv and fingerprint
  - Original raw files (if available) with fingerprints

#### 07_Audit_Trail/
- Complete_Audit_Trail.pdf - Complete audit trail including calculations, data access, and modifications
- Calculation_Audit_Trail.xlsx - Detailed Excel workbook with 9 professional sheets
- Analysis_Session_Log.json - Complete session log in JSON format
- NEMA_MG1_Calculation_Methodology.pdf - NEMA MG1 voltage unbalance calculation methodology
- CSV_Fingerprint_System_Methodology.pdf - Technical methodology for CSV fingerprint system
- Data_Modification_History.pdf - Complete history of all data file modifications with reasons and chain of custody

#### 08_Financial_Analysis/
- Financial Analysis Report (PDF)

#### 09_Weather_Normalization/
- Weather Normalization Report (PDF)
- Weather Data Audit Trail (JSON)
- Weather Data Detailed (Excel)

#### 10_Equipment_Health/
- Equipment Health Predictive Failure Report (PDF)
- Equipment Health Data (JSON)

#### 11_Supporting_Documentation/
- Project Information
- System Configuration
- SYNEREX User Guide (PDF) - Complete user guide with all features, facility types, and field forms

#### 12_Verification_Certificate/
- Data Integrity & Analysis Verification Certificate

### Data Modification Tracking

**Important:** All CSV file modifications are tracked and documented:

- **Modification Form:** Required when saving changes to CSV files in the Clipping Interface
- **Reason Tracking:** Modification reason and details are recorded in the database
- **Chain of Custody:** Complete history of who modified what, when, and why
- **Fingerprint Tracking:** Before/after fingerprints for all modifications
- **Audit Inclusion:** Modification history included in Data Modification History PDF in audit trail
- **Utility Compliance:** All modification records included in utility submission packages

### Audit Trail Contents

The audit trail (07_Audit_Trail) includes:

1. **Complete Audit Trail PDF** - All calculation steps, data access events, and modifications
2. **Calculation Audit Trail Excel** - 9-sheet professional workbook with dedicated Data Modifications worksheet
3. **Data Modification History PDF** - Standalone document tracking all file modifications with:
   - Timestamp of each modification
   - User who made the modification
   - File name and ID
   - Modification reason and details
   - Fingerprints before and after
4. **Methodology Documents** - NEMA MG1 and CSV Fingerprint System methodologies
5. **Session Log JSON** - Machine-readable complete session log

### Utility Compliance

The package meets all requirements for:
- Utility rebate submissions
- Regulatory compliance audits
- Professional engineering review
- Data integrity verification
- Chain of custody documentation
- Complete modification history tracking

---

## 📚 **ADDITIONAL DOCUMENTATION**

### **Technical Documentation**
- **[SYNEREX Architecture Overview](SYNEREX_ARCHITECTURE_OVERVIEW.md)** - Complete system architecture and design
- **[Standards Compliance Analysis](SYNEREX_STANDARDS_COMPLIANCE_ANALYSIS.md)** - Detailed compliance verification
- **[Comprehensive Standards Audit Report](COMPREHENSIVE_STANDARDS_AUDIT_REPORT.md)** - Full audit documentation
- **[100% Compliance Summary](SYNEREX_100_PERCENT_COMPLIANCE_SUMMARY.md)** - Compliance achievement summary
- **[Normalization Implementation](NORMALIZATION_IMPLEMENTATION_SUMMARY.md)** - Normalization methodology

### **User Guides**
- **[CSV Editor Guide](8082/CSV_EDITOR_GUIDE.md)** - Professional CSV editing instructions
- **[Launcher Guide](8082/README_LAUNCHER.md)** - System startup and service management

