// Additional sections for the comprehensive User's Guide
const additionalSections = {
    dashboardOverview: `
        <div class="section" id="dashboard-overview">
            <h2>4. Dashboard Overview</h2>
            
            <h3>4.1 Main Dashboard Interface</h3>
            <p>The SYNEREX dashboard is the central control center for all system operations. It provides organized access to key functionalities through clearly defined sections.</p>

            <h3>4.2 Raw Meter File Storage Section</h3>
            <div class="feature-card">
                <h4>📤 Upload Raw Data Files</h4>
                <p><strong>Purpose:</strong> Upload CSV meter data files for analysis</p>
                <p><strong>Supported Formats:</strong> CSV files with timestamp, power, voltage, current data</p>
                <p><strong>File Requirements:</strong> Minimum 1-minute interval data, 14+ days duration</p>
                <div class="step">
                    <span class="step-number">1</span>
                    Click "Upload Raw Data" button
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    Select multiple CSV files (drag & drop supported)
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    Files are automatically processed and fingerprinted
                </div>
                <div class="step">
                    <span class="step-number">4</span>
                    Review upload confirmation and file details
                </div>
            </div>

            <div class="feature-card">
                <h4>📊 Raw Meter Data Statistics</h4>
                <p><strong>Purpose:</strong> View comprehensive statistics and metadata for uploaded files</p>
                <p><strong>Information Provided:</strong></p>
                <ul>
                    <li>File size, record count, and date ranges</li>
                    <li>Data completeness and quality metrics</li>
                    <li>Power quality parameters (THD, power factor, etc.)</li>
                    <li>Statistical analysis (mean, standard deviation, CV)</li>
                </ul>
            </div>

            <div class="feature-card">
                <h4>🔍 View Fingerprints</h4>
                <p><strong>Purpose:</strong> View cryptographic fingerprints for data integrity verification</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>SHA-256 hash values for each file</li>
                    <li>File modification timestamps</li>
                    <li>Integrity verification status</li>
                    <li>Chain of custody documentation</li>
                </ul>
            </div>

            <h3>4.3 CSV File Review Section</h3>
            <div class="feature-card">
                <h4>✅ Verify Integrity</h4>
                <p><strong>Purpose:</strong> Comprehensive data integrity verification process</p>
                <div class="warning">
                    <strong>Important:</strong> This process is critical for audit compliance and should be run before any analysis.
                </div>
                <p><strong>Verification Process:</strong></p>
                <ul>
                    <li>File fingerprint validation</li>
                    <li>Data structure verification</li>
                    <li>Completeness analysis</li>
                    <li>Quality assessment</li>
                    <li>Standards compliance check</li>
                </ul>
            </div>

            <h3>4.4 Project Management Section</h3>
            <div class="feature-card">
                <h4>📁 Access Project</h4>
                <p><strong>Purpose:</strong> Load existing projects and continue analysis work</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>Project selection from dropdown list</li>
                    <li>Automatic form population with saved data</li>
                    <li>File assignment restoration</li>
                    <li>Configuration parameter loading</li>
                </ul>
            </div>

            <div class="feature-card">
                <h4>📋 Templates</h4>
                <p><strong>Purpose:</strong> Use pre-configured project templates for common analysis types</p>
                <p><strong>Available Templates:</strong></p>
                <ul>
                    <li>Standard Power Quality Analysis</li>
                    <li>Energy Savings Measurement & Verification</li>
                    <li>Harmonic Distortion Analysis</li>
                    <li>Three-Phase Motor Analysis</li>
                    <li>Custom template creation</li>
                </ul>
            </div>

            <div class="feature-card">
                <h4>➕ Create New Project</h4>
                <p><strong>Purpose:</strong> Create new analysis projects with custom configurations</p>
                <p><strong>Configuration Options:</strong></p>
                <ul>
                    <li>Project name and description</li>
                    <li>Analysis type selection</li>
                    <li>Standards compliance settings</li>
                    <li>Client information setup</li>
                    <li>File assignment</li>
                </ul>
            </div>

            <h3>4.5 Professional Engineer Management Section</h3>
            <div class="feature-card">
                <h4>👨‍💼 PE Review Management</h4>
                <p><strong>Purpose:</strong> Manage professional engineering reviews and certifications</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>PE reviewer assignment</li>
                    <li>Review checklist management</li>
                    <li>Certification tracking</li>
                    <li>Signature capture</li>
                    <li>Compliance verification</li>
                </ul>
            </div>

            <h3>4.6 Facility-Specific Analysis Section</h3>
            <div class="feature-card">
                <h4>🏭 Facility-Specific Analysis</h4>
                <p><strong>Purpose:</strong> Access specialized analysis interfaces optimized for different facility types</p>
                <p><strong>Location:</strong> Main Dashboard → Facility-Specific Analysis section</p>
                <p><strong>Available Facility Types:</strong></p>
                <ul>
                    <li><strong>⚙️ General Energy Analysis:</strong> Standard power quality and energy analysis for general industrial facilities</li>
                    <li><strong>❄️ Cold Storage:</strong> Energy intensity per unit of product (kWh/lb, kWh/ton) for cold storage facilities</li>
                    <li><strong>🖥️ Data Center/GPU:</strong> PUE, ITE, CLF, and compute efficiency metrics for data centers and GPU facilities</li>
                    <li><strong>🏥 Healthcare:</strong> Energy per patient day, per bed, OR efficiency for healthcare facilities</li>
                    <li><strong>🏨 Hospitality:</strong> Energy per room-night, per guest, per meal for hotels and restaurants</li>
                    <li><strong>🏭 Manufacturing & Industrial:</strong> Energy per unit produced, compressed air efficiency, motor efficiency for manufacturing facilities</li>
                </ul>
                <div class="step">
                    <span class="step-number">1</span>
                    Navigate to "Facility-Specific Analysis" section on main dashboard
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    Click on the facility type card that matches your facility
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    Enter facility-specific information in the dedicated form
                </div>
                <div class="step">
                    <span class="step-number">4</span>
                    Upload CSV meter data files (before/after periods)
                </div>
                <div class="step">
                    <span class="step-number">5</span>
                    Run analysis to get facility-specific metrics and reports
                </div>
                <div class="info" style="margin-top: 15px;">
                    <h4>💡 Facility Selection Tips:</h4>
                    <ul>
                        <li><strong>Choose the Right Facility Type:</strong> Each facility type has specialized metrics and calculations</li>
                        <li><strong>Complete All Fields:</strong> Facility-specific fields are required for accurate analysis</li>
                        <li><strong>Use Appropriate Units:</strong> Pay attention to unit requirements (lbs, tons, sqft, etc.)</li>
                        <li><strong>Benchmark Comparison:</strong> Results include industry benchmarks for comparison</li>
                    </ul>
                </div>
            </div>

            <h3>4.7 Navigation Tips</h3>
            <div class="info">
                <h4>💡 Dashboard Navigation Tips:</h4>
                <ul>
                    <li><strong>Status Indicators:</strong> Green indicators show successful operations, red indicates issues</li>
                    <li><strong>Progress Bars:</strong> Show completion status for long-running operations</li>
                    <li><strong>Tooltips:</strong> Hover over buttons and icons for additional information</li>
                    <li><strong>Keyboard Shortcuts:</strong> Use Ctrl+S to save, Ctrl+Z to undo, F5 to refresh</li>
                    <li><strong>Responsive Design:</strong> Dashboard adapts to different screen sizes</li>
                </ul>
            </div>
        </div>
    `,

    facilitySpecificAnalysis: `
        <div class="section" id="facility-specific-analysis">
            <h2>6. Facility-Specific Analysis</h2>
            
            <h3>6.1 Overview</h3>
            <p>SYNEREX provides specialized analysis interfaces for five distinct facility types, each optimized with industry-specific metrics, calculations, and compliance standards. Facility-specific analysis ensures that energy efficiency metrics are normalized appropriately for each industry, providing meaningful benchmarks and actionable insights.</p>

            <div class="info">
                <h4>🎯 Why Facility-Specific Analysis?</h4>
                <ul>
                    <li><strong>Industry-Appropriate Metrics:</strong> Each facility type has unique energy intensity metrics (kWh/unit, kWh/patient-day, PUE, etc.)</li>
                    <li><strong>Accurate Benchmarking:</strong> Compare your facility against industry-specific benchmarks</li>
                    <li><strong>Compliance Standards:</strong> Each facility type has specific regulatory standards (ASHRAE 90.4 for data centers, ISO 50001 for manufacturing, etc.)</li>
                    <li><strong>Normalized Reporting:</strong> Energy metrics are normalized for facility-specific variables (occupancy, production, patient days, etc.)</li>
                    <li><strong>Actionable Insights:</strong> Facility-specific recommendations based on industry best practices</li>
                </ul>
            </div>

            <h3>6.2 Cold Storage Facilities</h3>
            <div class="feature-card">
                <h4>❄️ Cold Storage Facility Analysis</h4>
                <p><strong>Purpose:</strong> Analyze energy consumption per unit of product stored (e.g., kWh per pound of meat)</p>
                <p><strong>Route:</strong> <code>/cold-storage</code></p>
                
                <h4>Key Metrics Calculated:</h4>
                <ul>
                    <li><strong>Energy Intensity:</strong> kWh per unit of product (kWh/lb, kWh/kg, kWh/ton)</li>
                    <li><strong>Storage Efficiency:</strong> Product weight vs. storage capacity utilization</li>
                    <li><strong>Savings per Unit:</strong> Cost savings per unit of product</li>
                    <li><strong>Annual Savings:</strong> Projected annual savings based on turnover rate</li>
                </ul>

                <h4>Required Input Fields:</h4>
                <ul>
                    <li>Product type (meat, produce, frozen foods, etc.)</li>
                    <li>Product weight (before/after periods) in lbs, kg, or tons</li>
                    <li>Storage capacity</li>
                    <li>Storage temperature setpoint</li>
                    <li>Storage utilization percentage</li>
                    <li>Storage duration (days)</li>
                    <li>Turnover rate (per year)</li>
                </ul>

                <h4>Industry Standards:</h4>
                <ul>
                    <li>ASHRAE Standard 15 (Refrigeration Safety)</li>
                    <li>ASHRAE Standard 34 (Refrigerant Classification)</li>
                    <li>ASHRAE Guideline 14 (M&V)</li>
                    <li>ENERGY STAR Commercial Refrigeration</li>
                </ul>

                <h4>Industry Types & Use Cases:</h4>
                <ul>
                    <li><strong>Cold Storage Warehouses:</strong> General cold storage facilities</li>
                    <li><strong>Food Processing Facilities:</strong> Facilities with refrigeration for food processing</li>
                    <li><strong>Distribution Centers:</strong> Distribution centers with cold storage sections</li>
                    <li><strong>Refrigerated Transportation:</strong> Analysis of refrigerated transportation systems</li>
                </ul>
                
                <h4>Product Types Supported:</h4>
                <ul>
                    <li>Meat (Beef, Pork, Poultry)</li>
                    <li>Seafood</li>
                    <li>Dairy Products</li>
                    <li>Produce (Fruits, Vegetables)</li>
                    <li>Frozen Foods</li>
                    <li>Pharmaceuticals</li>
                    <li>Other (custom product types)</li>
                </ul>
                
                <h4>Field Form:</h4>
                <p>Download <strong>cold_storage_field_form.pdf</strong> from the Cold Storage Analysis page to collect all required data on-site.</p>
            </div>

            <h3>6.3 Data Center / GPU Facilities</h3>
            <div class="feature-card">
                <h4>🖥️ Data Center / GPU Facility Analysis</h4>
                <p><strong>Purpose:</strong> Analyze data center efficiency using PUE, ITE, CLF, and compute efficiency metrics</p>
                <p><strong>Route:</strong> <code>/data-center</code></p>
                
                <h4>Key Metrics Calculated:</h4>
                <ul>
                    <li><strong>PUE (Power Usage Effectiveness):</strong> Total facility power / IT equipment power</li>
                    <li><strong>ITE (IT Equipment Efficiency):</strong> Inverse of PUE (percentage of power used by IT)</li>
                    <li><strong>CLF (Cooling Load Factor):</strong> Cooling power / IT equipment power</li>
                    <li><strong>Power Density:</strong> kW per rack, kW per sqft, kW per GPU</li>
                    <li><strong>Compute Efficiency:</strong> kWh per GPU-hour, kWh per teraflop</li>
                    <li><strong>UPS Efficiency:</strong> UPS losses and efficiency analysis</li>
                </ul>

                <h4>Required Input Fields:</h4>
                <ul>
                    <li>Data center type (traditional, GPU facility, hybrid, colocation, edge)</li>
                    <li>Facility area (sqft)</li>
                    <li>Number of server racks</li>
                    <li>Number of GPUs (if applicable)</li>
                    <li>IT equipment power (before/after)</li>
                    <li>Cooling power (before/after)</li>
                    <li>UPS capacity (kVA) and efficiency (%)</li>
                    <li>Lighting and other loads</li>
                    <li>Compute capacity (teraflops) and GPU utilization (%)</li>
                    <li>Workload type (training, inference, mixed)</li>
                </ul>

                <h4>Industry Standards:</h4>
                <ul>
                    <li>ASHRAE Standard 90.4 (Data Center Energy Standard)</li>
                    <li>ASHRAE TC 9.9 (Thermal Guidelines)</li>
                    <li>The Green Grid PUE</li>
                    <li>ISO/IEC 30134 (Data Center Resource Efficiency)</li>
                    <li>Uptime Institute Tier Classification</li>
                    <li>ENERGY STAR Data Center Program</li>
                </ul>

                <h4>Industry Types & Use Cases:</h4>
                <ul>
                    <li><strong>Data Center (Traditional):</strong> Standard enterprise data centers</li>
                    <li><strong>GPU Facility (AI/ML Training):</strong> Facilities dedicated to AI/ML training workloads</li>
                    <li><strong>Hybrid (Mixed Workload):</strong> Facilities with both traditional and GPU workloads</li>
                    <li><strong>Colocation Facility:</strong> Multi-tenant data center facilities</li>
                    <li><strong>Edge Data Center:</strong> Edge computing facilities</li>
                </ul>
                
                <h4>Field Form:</h4>
                <p>Download <strong>data_center_field_form.pdf</strong> from the Data Center Analysis page to collect all required data on-site.</p>
            </div>

            <h3>6.4 Healthcare Facilities</h3>
            <div class="feature-card">
                <h4>🏥 Healthcare Facility Analysis</h4>
                <p><strong>Purpose:</strong> Analyze energy consumption per patient day, per bed, and OR efficiency</p>
                <p><strong>Route:</strong> <code>/healthcare</code></p>
                
                <h4>Key Metrics Calculated:</h4>
                <ul>
                    <li><strong>Energy per Patient Day:</strong> Total energy / patient days (kWh/patient-day)</li>
                    <li><strong>Energy per Bed:</strong> Annual energy per bed (kWh/bed/year)</li>
                    <li><strong>EUI (Energy Use Intensity):</strong> kWh/sqft/year</li>
                    <li><strong>Medical Equipment Power Density:</strong> kW/sqft for imaging, lab, surgical equipment</li>
                    <li><strong>Operating Room Energy Intensity:</strong> kWh/OR/year</li>
                    <li><strong>Critical Power Redundancy:</strong> Backup capacity vs. critical loads</li>
                    <li><strong>HVAC Efficiency:</strong> HVAC power improvement metrics</li>
                </ul>

                <h4>Required Input Fields:</h4>
                <ul>
                    <li>Healthcare facility type (hospital, clinic, medical center, surgical center, etc.)</li>
                    <li>Facility area (sqft)</li>
                    <li>Number of beds</li>
                    <li>Number of operating rooms</li>
                    <li>Patient days (before/after periods)</li>
                    <li>Average occupancy rate (before/after)</li>
                    <li>Medical equipment power (imaging, lab, surgical)</li>
                    <li>HVAC power (before/after)</li>
                    <li>Ventilation air changes per hour</li>
                    <li>Backup generator capacity (kVA)</li>
                    <li>UPS capacity (kVA)</li>
                    <li>Critical load power</li>
                </ul>

                <h4>Industry Standards:</h4>
                <ul>
                    <li>ASHRAE Standard 170 (Ventilation of Health Care Facilities)</li>
                    <li>ASHRAE Standard 90.1 (Energy Standard)</li>
                    <li>FGI Guidelines (Facility Guidelines Institute)</li>
                    <li>Joint Commission Environment of Care</li>
                    <li>ENERGY STAR Portfolio Manager Healthcare</li>
                </ul>

                <h4>Industry Types & Use Cases:</h4>
                <ul>
                    <li><strong>Hospital (Full Service):</strong> Full-service hospitals with emergency, surgery, and inpatient care</li>
                    <li><strong>Clinic (Outpatient):</strong> Outpatient clinics and medical offices</li>
                    <li><strong>Medical Center:</strong> Large medical centers with multiple specialties</li>
                    <li><strong>Surgical Center:</strong> Ambulatory surgical centers</li>
                    <li><strong>Urgent Care:</strong> Urgent care facilities</li>
                    <li><strong>Nursing Home / Long-term Care:</strong> Long-term care and skilled nursing facilities</li>
                </ul>
                
                <h4>Field Form:</h4>
                <p>Download <strong>healthcare_field_form.pdf</strong> from the Healthcare Analysis page to collect all required data on-site.</p>
            </div>

            <h3>6.5 Hospitality Facilities</h3>
            <div class="feature-card">
                <h4>🏨 Hospitality Facility Analysis</h4>
                <p><strong>Purpose:</strong> Analyze energy consumption per room-night, per guest, and per meal</p>
                <p><strong>Route:</strong> <code>/hospitality</code></p>
                
                <h4>Key Metrics Calculated:</h4>
                <ul>
                    <li><strong>Energy per Occupied Room-Night:</strong> Total energy / occupied room-nights (kWh/room-night)</li>
                    <li><strong>Energy per Guest:</strong> Total energy / guest count (kWh/guest)</li>
                    <li><strong>Energy per Meal:</strong> Total energy / meals served (kWh/meal) - for restaurants</li>
                    <li><strong>EUI (Energy Use Intensity):</strong> kWh/sqft/year</li>
                    <li><strong>Kitchen Energy Intensity:</strong> kWh/meal for restaurant kitchens</li>
                    <li><strong>Laundry Efficiency:</strong> kWh per laundry load</li>
                    <li><strong>Pool/Spa Energy Intensity:</strong> kWh/sqft for recreation facilities</li>
                    <li><strong>Occupancy-Adjusted Energy:</strong> Normalized for occupancy variations</li>
                </ul>

                <h4>Required Input Fields:</h4>
                <ul>
                    <li>Hospitality facility type (hotel, restaurant, resort, banquet hall, casino, etc.)</li>
                    <li>Facility area (sqft)</li>
                    <li>Number of rooms (if applicable)</li>
                    <li>Number of seats (for restaurants)</li>
                    <li>Occupied room-nights (before/after)</li>
                    <li>Guest count (before/after)</li>
                    <li>Average occupancy rate (before/after)</li>
                    <li>Meals served (before/after) - for restaurants</li>
                    <li>Kitchen equipment power (before/after)</li>
                    <li>Laundry power and loads (before/after)</li>
                    <li>Pool/spa power and area</li>
                    <li>Fitness center power and area</li>
                    <li>HVAC power (before/after)</li>
                    <li>Lighting, elevator, and other building loads</li>
                    <li>Peak/off-season occupancy rates</li>
                </ul>

                <h4>Industry Standards:</h4>
                <ul>
                    <li>ASHRAE Standard 90.1 (Energy Standard)</li>
                    <li>ENERGY STAR Portfolio Manager (Hotels & Restaurants)</li>
                    <li>IPMVP Volume I (Option B - Whole Building)</li>
                    <li>AHLA Guidelines (American Hotel & Lodging Association)</li>
                </ul>

                <h4>Industry Types & Use Cases:</h4>
                <ul>
                    <li><strong>Hotel (Full Service):</strong> Full-service hotels with restaurants, meeting spaces, and amenities</li>
                    <li><strong>Hotel (Limited Service):</strong> Limited-service hotels with basic amenities</li>
                    <li><strong>Resort:</strong> Resort properties with extensive amenities</li>
                    <li><strong>Restaurant:</strong> Standalone restaurants and dining establishments</li>
                    <li><strong>Banquet Hall:</strong> Event and banquet facilities</li>
                    <li><strong>Casino:</strong> Casino and gaming facilities</li>
                    <li><strong>Other:</strong> Other hospitality facility types</li>
                </ul>
                
                <h4>Field Form:</h4>
                <p>Download <strong>hospitality_field_form.pdf</strong> from the Hospitality Analysis page to collect all required data on-site.</p>
            </div>

            <h3>6.6 Manufacturing & Industrial Facilities</h3>
            <div class="feature-card">
                <h4>🏭 Manufacturing & Industrial Facility Analysis</h4>
                <p><strong>Purpose:</strong> Analyze energy per unit produced, process efficiency, and equipment utilization</p>
                <p><strong>Route:</strong> <code>/manufacturing</code></p>
                
                <h4>Key Metrics Calculated:</h4>
                <ul>
                    <li><strong>Energy per Unit Produced:</strong> Total energy / units produced (kWh/unit) - PRIMARY METRIC</li>
                    <li><strong>Energy per Machine Hour:</strong> Total energy / machine hours (kWh/machine-hour)</li>
                    <li><strong>Production Efficiency Index:</strong> Overall improvement in energy efficiency per unit</li>
                    <li><strong>Equipment Utilization:</strong> Machine hours vs. available hours (%)</li>
                    <li><strong>Compressed Air Efficiency:</strong> kWh/(CFM-psi-hour) per ASME EA-2</li>
                    <li><strong>Motor Efficiency:</strong> kWh/HP-hour per NEMA MG1</li>
                    <li><strong>Process Heating Efficiency:</strong> Process heating power improvement</li>
                    <li><strong>Power Factor Improvement:</strong> Power quality improvement</li>
                    <li><strong>Demand Reduction:</strong> Peak demand reduction (kW) and cost savings</li>
                    <li><strong>Load Factor:</strong> Average load / peak demand (%)</li>
                    <li><strong>EUI (Energy Use Intensity):</strong> kWh/sqft/year</li>
                </ul>

                <h4>Required Input Fields:</h4>
                <ul>
                    <li>Manufacturing facility type (plant, assembly, processing, foundry, chemical, food, textile, automotive, electronics, pharmaceutical, paper/pulp, etc.)</li>
                    <li>Facility area (sqft)</li>
                    <li>Number of production lines</li>
                    <li>Number of machines/equipment</li>
                    <li>Operating hours per day</li>
                    <li>Number of shifts per day</li>
                    <li>Units produced (before/after)</li>
                    <li>Machine hours (before/after)</li>
                    <li>Production rate (units/hour)</li>
                    <li>Product type / industry</li>
                    <li>Compressed air system (power, flow CFM, pressure psi)</li>
                    <li>Total motor horsepower (HP)</li>
                    <li>Process heating power (before/after)</li>
                    <li>Pump, welding, conveyor, material handling, process cooling, water treatment power</li>
                    <li>Ventilation power</li>
                    <li>HVAC power (before/after)</li>
                    <li>Lighting and other process loads</li>
                    <li>Power factor (before/after)</li>
                    <li>Peak demand (before/after)</li>
                    <li>Demand charge rate ($/kW)</li>
                </ul>

                <h4>Industry Standards:</h4>
                <ul>
                    <li>ISO 50001 (Energy Management Systems)</li>
                    <li>ASME EA-2 (Compressed Air Systems)</li>
                    <li>NEMA MG1-2016 (Motor Efficiency)</li>
                    <li>ASHRAE Standard 90.1 (Energy Standard)</li>
                    <li>EPA ENERGY STAR Industrial Facilities</li>
                    <li>IPMVP Volume I (Option A - Retrofit Isolation)</li>
                </ul>

                <h4>Industry Types & Use Cases:</h4>
                <ul>
                    <li><strong>Manufacturing Plant (General):</strong> General manufacturing facilities</li>
                    <li><strong>Assembly Plant:</strong> Product assembly facilities</li>
                    <li><strong>Processing Facility:</strong> Material processing facilities</li>
                    <li><strong>Foundry / Metalworking:</strong> Metal casting and metalworking facilities</li>
                    <li><strong>Chemical Processing:</strong> Chemical manufacturing and processing plants</li>
                    <li><strong>Food Processing:</strong> Food manufacturing and processing facilities</li>
                    <li><strong>Textile Manufacturing:</strong> Textile and fabric manufacturing facilities</li>
                    <li><strong>Automotive Manufacturing:</strong> Automotive production facilities</li>
                    <li><strong>Electronics Manufacturing:</strong> Electronics and semiconductor manufacturing</li>
                    <li><strong>Pharmaceutical Manufacturing:</strong> Pharmaceutical production facilities</li>
                    <li><strong>Paper / Pulp Processing:</strong> Paper and pulp manufacturing facilities</li>
                    <li><strong>Other:</strong> Other manufacturing and industrial facility types</li>
                </ul>
                
                <h4>Field Form:</h4>
                <p>Download <strong>manufacturing_field_form.pdf</strong> from the Manufacturing Analysis page to collect all required data on-site.</p>
            </div>

            <h3>6.7 General Energy Analysis</h3>
            <div class="feature-card">
                <h4>⚙️ General Energy Analysis</h4>
                <p><strong>Purpose:</strong> Standard power quality and energy analysis for general industrial facilities</p>
                <p><strong>Route:</strong> <code>/legacy</code></p>
                
                <h4>Key Metrics Calculated:</h4>
                <ul>
                    <li>Power quality metrics (IEEE 519 compliance)</li>
                    <li>Harmonic distortion analysis</li>
                    <li>Three-phase balance (NEMA MG1)</li>
                    <li>Network losses</li>
                    <li>Demand reduction</li>
                    <li>Energy savings (IPMVP)</li>
                    <li>Statistical validation (ASHRAE Guideline 14)</li>
                </ul>

                <h4>Use Cases:</h4>
                <ul>
                    <li>General industrial facilities</li>
                    <li>Facilities without specific facility type</li>
                    <li>Standard power quality analysis</li>
                    <li>Baseline energy analysis</li>
                </ul>
                
                <h4>Field Form:</h4>
                <p>Download <strong>general_field_form.pdf</strong> from the General Energy Analysis page to collect all required data on-site.</p>
            </div>

            <h3>6.8 Facility Selection Guide</h3>
            <div class="warning">
                <h4>📋 How to Choose the Right Facility Type:</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Your Facility Type</th>
                            <th>Select This Analysis</th>
                            <th>Key Metric</th>
                            <th>Field Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Cold storage warehouse, food processing with refrigeration</td>
                            <td>Cold Storage</td>
                            <td>kWh per pound/ton of product</td>
                            <td>cold_storage_field_form.pdf</td>
                        </tr>
                        <tr>
                            <td>Data center, server room, GPU/AI training facility</td>
                            <td>Data Center / GPU</td>
                            <td>PUE (Power Usage Effectiveness)</td>
                            <td>data_center_field_form.pdf</td>
                        </tr>
                        <tr>
                            <td>Hospital, clinic, medical center, nursing home</td>
                            <td>Healthcare</td>
                            <td>kWh per patient day</td>
                            <td>healthcare_field_form.pdf</td>
                        </tr>
                        <tr>
                            <td>Hotel, resort, restaurant, banquet hall, casino</td>
                            <td>Hospitality</td>
                            <td>kWh per room-night (hotels) or kWh per meal (restaurants)</td>
                            <td>hospitality_field_form.pdf</td>
                        </tr>
                        <tr>
                            <td>Manufacturing plant, factory, industrial facility</td>
                            <td>Manufacturing & Industrial</td>
                            <td>kWh per unit produced</td>
                            <td>manufacturing_field_form.pdf</td>
                        </tr>
                        <tr>
                            <td>General industrial, unknown facility type</td>
                            <td>General Energy Analysis</td>
                            <td>Standard power quality metrics</td>
                            <td>general_field_form.pdf</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>6.9 Facility-Specific Workflow</h3>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Select Facility Type:</strong> Navigate to main dashboard and click on the appropriate facility type card
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Download Field Form (Recommended):</strong> Click the "📄 Download Field Form" button to get the PDF form for on-site data collection
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Collect Data On-Site:</strong> Use the field form to systematically collect all required facility information during your site visit
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Enter Facility Information:</strong> Complete all facility-specific input fields in the dedicated form using data from your field form
            </div>
            <div class="step">
                <span class="step-number">5</span>
                <strong>Upload Meter Data:</strong> Upload CSV files for before and after periods
            </div>
            <div class="step">
                <span class="step-number">6</span>
                <strong>Set Test Parameters:</strong> Configure test type, circuit, period, duration, and meter specifications
            </div>
            <div class="step">
                <span class="step-number">7</span>
                <strong>Run Analysis:</strong> Click "Run Engineering Report" to execute facility-specific analysis
            </div>
            <div class="step">
                <span class="step-number">8</span>
                <strong>Review Results:</strong> View facility-specific metrics in the UI HTML Report
            </div>
            <div class="step">
                <span class="step-number">9</span>
                <strong>Generate Client Report:</strong> Export Client HTML Report with facility-specific sections
            </div>

            <div class="info" style="margin-top: 20px;">
                <h4>💡 Best Practices for Facility-Specific Analysis:</h4>
                <ul>
                    <li><strong>Accurate Data Entry:</strong> Ensure all facility-specific fields are accurately filled</li>
                    <li><strong>Consistent Units:</strong> Use consistent units throughout (e.g., all weights in lbs or all in kg)</li>
                    <li><strong>Complete Information:</strong> More complete facility information leads to more accurate analysis</li>
                    <li><strong>Benchmark Comparison:</strong> Compare your results against industry benchmarks provided in the report</li>
                    <li><strong>Period Matching:</strong> Ensure before/after periods are comparable (same season, similar operations)</li>
                </ul>
            </div>
        </div>
    `,

    dataManagement: `
        <div class="section" id="data-management">
            <h2>7. Data Management & File Handling</h2>
            
            <h3>7.1 File Upload Process</h3>
            <p>The SYNEREX system provides robust file upload capabilities with automatic processing and verification.</p>

            <h4>7.1.1 Supported File Formats</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Format</th>
                        <th>Extension</th>
                        <th>Description</th>
                        <th>Requirements</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>CSV</td>
                        <td>.csv</td>
                        <td>Comma-separated values</td>
                        <td>UTF-8 encoding, header row</td>
                    </tr>
                    <tr>
                        <td>Excel</td>
                        <td>.xlsx, .xls</td>
                        <td>Microsoft Excel format</td>
                        <td>First sheet, header row</td>
                    </tr>
                    <tr>
                        <td>Text</td>
                        <td>.txt</td>
                        <td>Tab-delimited text</td>
                        <td>UTF-8 encoding, consistent delimiters</td>
                    </tr>
                </tbody>
            </table>

            <h4>7.1.2 Required Data Columns</h4>
            <div class="warning">
                <h4>📋 Minimum Required Columns:</h4>
                <ul>
                    <li><strong>Timestamp:</strong> Date and time for each measurement</li>
                    <li><strong>Power (kW):</strong> Real power measurements</li>
                    <li><strong>Voltage (V):</strong> Voltage measurements (L-N or L-L)</li>
                    <li><strong>Current (A):</strong> Current measurements</li>
                </ul>
            </div>

            <h4>7.1.3 Optional Data Columns</h4>
            <div class="info">
                <h4>📊 Enhanced Analysis Columns:</h4>
                <ul>
                    <li><strong>Apparent Power (kVA):</strong> For power factor calculations</li>
                    <li><strong>Reactive Power (kVAR):</strong> For power quality analysis</li>
                    <li><strong>Power Factor:</strong> For efficiency analysis</li>
                    <li><strong>THD (%):</strong> For harmonic distortion analysis</li>
                    <li><strong>Frequency (Hz):</strong> For frequency analysis</li>
                    <li><strong>Temperature (°F/°C):</strong> For weather normalization</li>
                </ul>
            </div>

            <h3>7.2 Data Validation & Quality Control</h3>
            
            <h4>7.2.1 Automatic Data Validation</h4>
            <p>The system performs comprehensive data validation during upload:</p>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Format Validation:</strong> Check file format and structure
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Column Verification:</strong> Verify required columns are present
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Data Type Checking:</strong> Validate data types and ranges
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Completeness Analysis:</strong> Check for missing or null values
            </div>
            <div class="step">
                <span class="step-number">5</span>
                <strong>Outlier Detection:</strong> Identify potentially erroneous data points
            </div>

            <h4>7.2.2 Data Quality Metrics</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Description</th>
                        <th>Acceptable Range</th>
                        <th>Action if Failed</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data Completeness</td>
                        <td>Percentage of non-null values</td>
                        <td>> 95%</td>
                        <td>Warning issued</td>
                    </tr>
                    <tr>
                        <td>Timestamp Continuity</td>
                        <td>Consistent time intervals</td>
                        <td>± 5% of expected interval</td>
                        <td>Gap analysis performed</td>
                    </tr>
                    <tr>
                        <td>Value Range</td>
                        <td>Values within expected ranges</td>
                        <td>0 < Power < 10,000 kW</td>
                        <td>Outlier flagging</td>
                    </tr>
                    <tr>
                        <td>Data Consistency</td>
                        <td>Logical relationships between values</td>
                        <td>PF = P/S within ±5%</td>
                        <td>Validation warning</td>
                    </tr>
                </tbody>
            </table>

            <h3>7.3 File Integrity & Security</h3>
            
            <h4>7.3.1 Cryptographic Fingerprinting</h4>
            <p>Each uploaded file receives a unique SHA-256 cryptographic fingerprint:</p>
            <div class="code-block">
File: meter_data_before.csv
SHA-256: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
Upload Date: 2025-10-06 19:45:23
File Size: 2,456,789 bytes
Record Count: 38,880
            </div>

            <div class="warning" style="margin-top: 15px;">
                <h4>⚠️ IMPORTANT: CSV File Tracking & Monitoring</h4>
                <p><strong>All fingerprinted CSV files are automatically tracked by the SYNEREX system:</strong></p>
                <ul>
                    <li><strong>Tracking Begins at Verification:</strong> Once a CSV file is verified and fingerprinted, all subsequent access and interactions are automatically logged</li>
                    <li><strong>File Opening is Tracked:</strong> Every time any user opens a CSV file (for viewing or editing), the system records:
                        <ul>
                            <li>User identity (name, email, user ID)</li>
                            <li>Exact timestamp of access</li>
                            <li>File fingerprint verification status</li>
                            <li>Access type (view, edit, download)</li>
                        </ul>
                    </li>
                    <li><strong>Cell-Level Tracking:</strong> When users click on individual cells in the CSV editor, the system tracks:
                        <ul>
                            <li>Which cell was clicked (row and column)</li>
                            <li>User who clicked the cell</li>
                            <li>Explanation provided for the click</li>
                            <li>Color-coded visual indicators</li>
                        </ul>
                    </li>
                    <li><strong>Complete Audit Trail:</strong> All tracking information is permanently stored and included in audit packages for regulatory compliance</li>
                </ul>
                <p><strong>Privacy Notice:</strong> By using the SYNEREX system, users acknowledge that all interactions with fingerprinted CSV files are logged for data integrity and audit compliance purposes.</p>
            </div>

            <h4>7.3.2 Tamper Detection</h4>
            <div class="warning">
                <h4>🔒 Security Features:</h4>
                <ul>
                    <li><strong>Hash Verification:</strong> Continuous verification of file integrity</li>
                    <li><strong>Modification Detection:</strong> Automatic detection of file changes</li>
                    <li><strong>Access Logging:</strong> Complete audit trail of file access</li>
                    <li><strong>Version Control:</strong> Automatic backup of original files</li>
                </ul>
            </div>

            <h3>7.4 Project File Management</h3>
            
            <h4>7.4.1 File Assignment Process</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Select Project:</strong> Choose target project from dropdown
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Assign Files:</strong> Select "Before" and "After" period files
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Verify Assignment:</strong> Confirm file assignments are correct
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Save Configuration:</strong> Store project configuration
            </div>

            <h4>7.4.2 File Organization</h4>
            <div class="code-block">
uploads/
├── projects/
│   ├── project_001/
│   │   ├── before_period/
│   │   │   └── meter_data_before.csv
│   │   └── after_period/
│   │       └── meter_data_after.csv
│   └── project_002/
│       ├── before_period/
│       └── after_period/
└── raw/
    ├── verified_files/
    └── pending_verification/
            </div>

            <h3>7.5 CSV File Modification & Clipping</h3>
            
            <div class="info" style="margin-bottom: 20px; padding: 15px; background: #e7f3ff; border-left: 4px solid #2c5aa0; border-radius: 4px;">
                <h4>📖 CSV Editor Guide:</h4>
                <p>For comprehensive instructions on CSV editing, including recommended editors, installation guides, and best practices, see the <a href="/csv-editor-guide" target="_blank" style="color: #2c5aa0; font-weight: 600; text-decoration: underline;">CSV Editor Guide</a>.</p>
            </div>
            
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

            <h4>7.5.4 File Access Logging</h4>
            <div class="warning">
                <h4>📊 Comprehensive Access Tracking:</h4>
                <p><strong>IMPORTANT:</strong> All fingerprinted CSV files are subject to automatic tracking. The system logs every file access event:</p>
                <ul>
                    <li><strong>User Information:</strong> Who accessed the file (name, email, user ID, role)</li>
                    <li><strong>Timestamp:</strong> Precise date and time of access (down to the second)</li>
                    <li><strong>Integrity Check:</strong> Whether the file's fingerprint matches the stored fingerprint at time of access</li>
                    <li><strong>Access Type:</strong> View, edit, download, or annotation</li>
                    <li><strong>IP Address:</strong> Network location from which access occurred</li>
                    <li><strong>User Agent:</strong> Browser and device information</li>
                </ul>
                <p><strong>Tracking Points:</strong></p>
                <ol>
                    <li><strong>File Verification:</strong> When a CSV file is first verified, it receives a cryptographic fingerprint and tracking begins immediately</li>
                    <li><strong>File Opening:</strong> Every time a file is opened in the CSV editor, an access log entry is created</li>
                    <li><strong>Cell Interactions:</strong> Individual cell clicks and annotations are tracked with user attribution</li>
                    <li><strong>File Modifications:</strong> Any changes to file content are logged with before/after fingerprints</li>
                </ol>
                <p>This information is included in the Complete Audit Trail PDF for complete chain of custody documentation and regulatory compliance.</p>
            </div>

            <h4>7.5.5 Cell Annotation & Tracking</h4>
            <div class="feature-card">
                <h4>🔍 Cell-Level Annotation System:</h4>
                <p>The SYNEREX system includes a comprehensive cell annotation feature that tracks user interactions at the individual cell level:</p>
                
                <h5>How Cell Annotations Work:</h5>
                <div class="step">
                    <span class="step-number">1</span>
                    <strong>Click a Cell:</strong> When you click on any cell in the CSV editor, an annotation modal appears
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    <strong>Provide Explanation:</strong> Enter a reason for clicking the cell (e.g., "Outlier detected", "Data correction needed", "Verified value")
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    <strong>Automatic Tracking:</strong> The system automatically records:
                    <ul>
                        <li>Your user identity (name, email, user ID)</li>
                        <li>Exact cell location (row index, column name)</li>
                        <li>Your explanation text</li>
                        <li>Timestamp of the annotation</li>
                        <li>Color code for visual identification</li>
                    </ul>
                </div>
                <div class="step">
                    <span class="step-number">4</span>
                    <strong>Visual Indicators:</strong> Annotated cells are:
                    <ul>
                        <li>Color-coded with a unique background color</li>
                        <li>Marked with a blue left border</li>
                        <li>Display a tooltip showing annotation details on hover</li>
                    </ul>
                </div>
                
                <div class="warning" style="margin-top: 15px;">
                    <h4>⚠️ Tracking & Privacy Notice:</h4>
                    <p><strong>All cell annotations are permanently tracked and stored:</strong></p>
                    <ul>
                        <li>Every cell click and annotation is logged with your user identity</li>
                        <li>Annotations are linked to the file's fingerprint for audit trail purposes</li>
                        <li>All annotation data is included in audit packages and compliance reports</li>
                        <li>Annotations persist across sessions and are visible to all users with file access</li>
                    </ul>
                    <p><strong>Purpose:</strong> Cell annotations provide a complete audit trail of data review activities, supporting regulatory compliance and data integrity verification.</p>
                </div>
                
                <h5>Best Practices for Cell Annotations:</h5>
                <ul>
                    <li>✅ Use clear, descriptive explanations (e.g., "Outlier: value exceeds 3 standard deviations")</li>
                    <li>✅ Annotate cells that require follow-up or verification</li>
                    <li>✅ Document data quality issues for audit purposes</li>
                    <li>✅ Coordinate with team members on annotation conventions</li>
                </ul>
            </div>

            <h3>7.6 Data Backup & Recovery</h3>
            
            <h4>7.5.1 Automatic Backup System</h4>
            <div class="info">
                <h4>💾 Backup Features:</h4>
                <ul>
                    <li><strong>Daily Backups:</strong> Automatic daily backup of all data</li>
                    <li><strong>Version History:</strong> Maintains multiple versions of files</li>
                    <li><strong>Incremental Backups:</strong> Efficient storage of changes only</li>
                    <li><strong>Recovery Tools:</strong> Easy restoration of previous versions</li>
                </ul>
            </div>

            <h4>7.5.2 Manual Backup Procedures</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Export Project Data:</strong> Use the export function to create backup files
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Database Backup:</strong> Copy the SQLite database file</li>
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>File Archive:</strong> Create compressed archive of uploads directory
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Verification:</strong> Test backup integrity before storage
            </div>
        </div>
    `,

    fieldFormsGuide: `
        <div class="section" id="field-forms-guide">
            <h2>9. Field Data Collection Forms</h2>
            
            <h3>9.1 Overview</h3>
            <p>SYNEREX provides printable PDF field forms for each facility type to help field workers collect facility-specific data on-site before entering it into the SYNEREX UI. These forms ensure all required information is gathered systematically and accurately.</p>

            <div class="info">
                <h4>📄 What Are Field Forms?</h4>
                <ul>
                    <li><strong>Purpose:</strong> Printable PDF forms designed for on-site data collection</li>
                    <li><strong>Format:</strong> Professional PDF documents optimized for 8.5" x 11" paper</li>
                    <li><strong>Content:</strong> All required fields for each facility type, organized by section</li>
                    <li><strong>Features:</strong> Before/After comparison columns, notes sections, automatic page numbering</li>
                </ul>
            </div>

            <h3>9.2 Available Field Forms</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Facility Type</th>
                        <th>Form Name</th>
                        <th>Download Location</th>
                        <th>Use For</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>❄️ Cold Storage</strong></td>
                        <td>cold_storage_field_form.pdf</td>
                        <td>Cold Storage Analysis page → "📄 Download Field Form" button</td>
                        <td>Cold storage warehouses, food processing facilities with refrigeration</td>
                    </tr>
                    <tr>
                        <td><strong>🖥️ Data Center / GPU</strong></td>
                        <td>data_center_field_form.pdf</td>
                        <td>Data Center Analysis page → "📄 Download Field Form" button</td>
                        <td>Data centers, GPU facilities, server rooms, colocation facilities</td>
                    </tr>
                    <tr>
                        <td><strong>🏥 Healthcare</strong></td>
                        <td>healthcare_field_form.pdf</td>
                        <td>Healthcare Analysis page → "📄 Download Field Form" button</td>
                        <td>Hospitals, clinics, medical centers, surgical centers, nursing homes</td>
                    </tr>
                    <tr>
                        <td><strong>🏨 Hospitality</strong></td>
                        <td>hospitality_field_form.pdf</td>
                        <td>Hospitality Analysis page → "📄 Download Field Form" button</td>
                        <td>Hotels, resorts, restaurants, banquet halls, casinos</td>
                    </tr>
                    <tr>
                        <td><strong>🏭 Manufacturing & Industrial</strong></td>
                        <td>manufacturing_field_form.pdf</td>
                        <td>Manufacturing Analysis page → "📄 Download Field Form" button</td>
                        <td>Manufacturing plants, assembly plants, processing facilities, foundries</td>
                    </tr>
                    <tr>
                        <td><strong>⚙️ General Energy Analysis</strong></td>
                        <td>general_field_form.pdf</td>
                        <td>General Energy Analysis page → "📄 Download Field Form" button</td>
                        <td>General industrial facilities without specific facility type</td>
                    </tr>
                </tbody>
            </table>

            <h3>9.3 How to Download Field Forms</h3>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Navigate to Facility-Specific Analysis Page:</strong> Go to Main Dashboard → Facility-Specific Analysis section → Click on the appropriate facility type card
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Locate Download Button:</strong> Look for the green "📄 Download Field Form" button in the top-right area of the page (next to "Back to Dashboard" and "Ask SynerexAI" buttons)
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Click to Download:</strong> Click the button to open the PDF form in a new browser tab
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Save or Print:</strong> Save the PDF to your computer or print directly from your browser
            </div>

            <div class="warning" style="margin-top: 20px;">
                <h4>💡 Tip:</h4>
                <p>Each facility-specific analysis page has its own field form. Make sure you download the form that matches your facility type for accurate data collection.</p>
            </div>

            <h3>9.4 How to Use Field Forms</h3>
            
            <h4>9.4.1 Before Site Visit</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Download the Appropriate Form:</strong> Select and download the field form that matches your facility type
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Print Multiple Copies:</strong> Print enough copies for your site visit (consider printing extras for backup)
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Review Form Sections:</strong> Familiarize yourself with the form sections and required fields before visiting the site
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Prepare Equipment:</strong> Bring necessary measurement tools (tape measure, calculator, camera for documentation)
            </div>

            <h4>9.4.2 During Site Visit</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Complete Project Information Section:</strong> Fill in client name, facility address, contact information, and project details
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Record Facility-Specific Data:</strong> Complete all facility-specific sections with accurate measurements and values
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Document Before/After Periods:</strong> Use the side-by-side columns to record data for both baseline and measurement periods
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Add Notes:</strong> Use the notes section to document any observations, special conditions, or additional information
            </div>
            <div class="step">
                <span class="step-number">5</span>
                <strong>Verify Completeness:</strong> Review the form to ensure all required fields are completed before leaving the site
            </div>

            <h4>9.4.3 After Site Visit</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Return to SYNEREX UI:</strong> Navigate to the appropriate facility-specific analysis page in SYNEREX
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Enter Data from Form:</strong> Use the completed field form as a reference to enter data into the corresponding UI fields
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Verify Accuracy:</strong> Double-check that all values from the form are entered correctly into the UI
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Store Form:</strong> Keep the completed field form as a backup record for audit purposes
            </div>

            <h3>9.5 Form Sections Overview</h3>
            
            <h4>9.5.1 Common Sections (All Forms)</h4>
            <div class="feature-card">
                <h4>📋 Standard Sections Included in Every Form:</h4>
                <ul>
                    <li><strong>Project Information:</strong> Client name, facility address, contact information, project dates</li>
                    <li><strong>Test Parameters:</strong> Test type, circuit identifier, before/after periods, meter specifications</li>
                    <li><strong>Weather Data:</strong> Temperature and humidity for before/after periods (if available on-site)</li>
                    <li><strong>Billing Information:</strong> Utility company, account number, rate information</li>
                    <li><strong>Notes Section:</strong> Space for additional observations and comments</li>
                </ul>
            </div>

            <h4>9.5.2 Facility-Specific Sections</h4>
            <div class="info">
                <h4>🏭 Each Form Includes Unique Sections:</h4>
                <ul>
                    <li><strong>Cold Storage:</strong> Product type, product weight (before/after), storage capacity, temperature setpoint, turnover rate</li>
                    <li><strong>Data Center:</strong> Facility type, number of racks, number of GPUs, IT equipment power, cooling power, UPS capacity</li>
                    <li><strong>Healthcare:</strong> Facility type, number of beds, number of ORs, patient days, occupancy rate, medical equipment power</li>
                    <li><strong>Hospitality:</strong> Facility type, number of rooms, occupied room-nights, guest count, meals served, kitchen equipment power</li>
                    <li><strong>Manufacturing:</strong> Facility type, production lines, units produced, machine hours, compressed air system, motor horsepower</li>
                </ul>
            </div>

            <h3>9.6 Best Practices for Field Form Usage</h3>
            <div class="warning">
                <h4>✅ Best Practices:</h4>
                <ul>
                    <li><strong>Use the Correct Form:</strong> Always use the field form that matches your facility type</li>
                    <li><strong>Complete All Fields:</strong> Fill in all applicable fields to ensure complete data collection</li>
                    <li><strong>Use Clear Handwriting:</strong> Write legibly to avoid errors when entering data into the UI</li>
                    <li><strong>Document Everything:</strong> Use the notes section liberally to capture important details</li>
                    <li><strong>Take Photos:</strong> Consider taking photos of equipment nameplates, meters, and facility areas for reference</li>
                    <li><strong>Verify Measurements:</strong> Double-check all measurements and calculations before leaving the site</li>
                    <li><strong>Keep Forms Organized:</strong> Store completed forms in a project folder for easy reference</li>
                </ul>
            </div>
        </div>
    `,

    analysisWorkflow: `
        <div class="section" id="analysis-workflow">
            <h2>8. Analysis Workflow & Process</h2>

            <h3>8.1 Comprehensive Analysis Overview</h3>
            <p>The SYNEREX analysis workflow is a sophisticated, multi-stage process that provides comprehensive power quality and energy analysis with full regulatory compliance.</p>

            <h3>8.2 Pre-Analysis Setup</h3>
            
            <h4>8.2.1 Facility Type Selection</h4>
            <div class="info">
                <h4>🏭 Facility-Specific Setup:</h4>
                <p>For facility-specific analysis, you must first select the appropriate facility type from the main dashboard:</p>
                <ul>
                    <li><strong>Cold Storage:</strong> Select if analyzing cold storage or food processing facilities</li>
                    <li><strong>Data Center/GPU:</strong> Select for data centers, server rooms, or GPU facilities</li>
                    <li><strong>Healthcare:</strong> Select for hospitals, clinics, or medical centers</li>
                    <li><strong>Hospitality:</strong> Select for hotels, restaurants, or resorts</li>
                    <li><strong>Manufacturing & Industrial:</strong> Select for manufacturing plants or industrial facilities</li>
                    <li><strong>General Energy Analysis:</strong> Select for standard power quality analysis</li>
                </ul>
                <p>Each facility type has a dedicated interface with facility-specific input fields and calculations.</p>
            </div>

            <h4>8.2.2 Client Information Configuration</h4>
            <div class="feature-card">
                <h4>📋 Required Client Information</h4>
                <ul>
                    <li><strong>Company Name:</strong> Client organization name</li>
                    <li><strong>Facility Address:</strong> Physical location of the facility</li>
                    <li><strong>Contact Information:</strong> Primary contact details</li>
                    <li><strong>Utility Information:</strong> Utility company and account details</li>
                    <li><strong>Meter Information:</strong> Meter specifications and identification</li>
                </ul>
            </div>

            <h4>8.2.3 Facility-Specific Information Entry</h4>
            <div class="warning">
                <h4>📋 Facility-Specific Fields:</h4>
                <p>Depending on the selected facility type, you will need to enter additional facility-specific information:</p>
                <ul>
                    <li><strong>Cold Storage:</strong> Product type, product weight, storage capacity, temperature setpoint, turnover rate</li>
                    <li><strong>Data Center:</strong> Facility area, number of racks, number of GPUs, IT equipment power, cooling power, UPS capacity</li>
                    <li><strong>Healthcare:</strong> Number of beds, number of ORs, patient days, occupancy rate, medical equipment power</li>
                    <li><strong>Hospitality:</strong> Number of rooms, occupied room-nights, guest count, meals served, kitchen equipment power</li>
                    <li><strong>Manufacturing:</strong> Production lines, units produced, machine hours, compressed air system, motor horsepower</li>
                </ul>
                <p><strong>Important:</strong> Complete all facility-specific fields accurately for meaningful analysis results.</p>
            </div>

            <h4>8.2.4 Test Parameters Configuration</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                        <th>Options</th>
                        <th>Default</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Test Type</td>
                        <td>Type of analysis to perform</td>
                        <td>Power Quality, Energy Savings, Harmonic Analysis</td>
                        <td>Power Quality</td>
                    </tr>
                    <tr>
                        <td>Circuit</td>
                        <td>Electrical circuit identifier</td>
                        <td>Free text</td>
                        <td>Main</td>
                    </tr>
                    <tr>
                        <td>Test Period</td>
                        <td>Analysis time period</td>
                        <td>Before/After dates</td>
                        <td>Auto-detect</td>
                    </tr>
                    <tr>
                        <td>Meter Specification</td>
                        <td>Meter accuracy class</td>
                        <td>Class 0.2, 0.5, 1.0, 2.0</td>
                        <td>Class 0.2</td>
                    </tr>
                    <tr>
                        <td>Interval Data</td>
                        <td>Data collection interval</td>
                        <td>1-minute, 15-minute, hourly</td>
                        <td>1-minute</td>
                    </tr>
                </tbody>
            </table>

            <h3>8.3 Analysis Execution Process</h3>
            
            <h4>8.3.1 Stage 1: Data Preprocessing</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Data Validation:</strong> Verify data integrity and completeness
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Gap Analysis:</strong> Identify and handle missing data points
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Outlier Detection:</strong> Identify and flag anomalous data
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Data Normalization:</strong> Standardize data formats and units
            </div>

            <h4>8.3.2 Stage 2: Key Metrics Extraction</h4>
            <div class="info">
                <h4>📊 Extracted Metrics:</h4>
                <ul>
                    <li><strong>Power Parameters:</strong> kW, kVA, kVAR, Power Factor</li>
                    <li><strong>Voltage Parameters:</strong> RMS voltage, voltage unbalance</li>
                    <li><strong>Current Parameters:</strong> RMS current, current unbalance</li>
                    <li><strong>Harmonic Parameters:</strong> THD, individual harmonics</li>
                    <li><strong>Frequency Parameters:</strong> System frequency, frequency deviation</li>
                </ul>
            </div>

            <h4>8.3.3 Stage 3: Power Quality Analysis</h4>
            <div class="feature-card">
                <h4>⚡ IEEE 519 Compliance Analysis</h4>
                <p><strong>Harmonic Distortion Analysis:</strong></p>
                <ul>
                    <li>Total Harmonic Distortion (THD) calculation</li>
                    <li>Individual harmonic component analysis</li>
                    <li>IEEE 519 limit compliance verification</li>
                    <li>Harmonic spectrum generation</li>
                </ul>
            </div>

            <div class="feature-card">
                <h4>🔄 Three-Phase Analysis (NEMA MG1)</h4>
                <p><strong>Phase Balance Analysis:</strong></p>
                <ul>
                    <li>Voltage unbalance calculation</li>
                    <li>Current unbalance analysis</li>
                    <li>NEMA MG1 compliance verification</li>
                    <li>Efficiency impact assessment</li>
                </ul>
            </div>

            <h4>8.3.4 Stage 4: Statistical Analysis (ASHRAE Guideline 14)</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Coefficient of Variation:</strong> Calculate CV for data quality assessment
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Relative Precision:</strong> Determine measurement precision
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Confidence Intervals:</strong> Calculate 95% confidence intervals
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Statistical Significance:</strong> Perform t-test analysis
            </div>

            <h4>8.3.5 Stage 5: Weather Normalization</h4>
            <div class="feature-card">
                <h4>🌤️ ASHRAE Baseline Model</h4>
                <p><strong>Weather Normalization Process:</strong></p>
                <ul>
                    <li>Temperature data acquisition from NOAA</li>
                    <li>Baseline model development</li>
                    <li>Weather-adjusted savings calculation</li>
                    <li>Uncertainty analysis</li>
                </ul>
            </div>

            <h4>8.3.6 Stage 6: Facility-Specific Metrics Calculation</h4>
            <div class="info">
                <h4>🏭 Facility-Specific Calculations:</h4>
                <p>For facility-specific analysis, the system calculates industry-specific metrics:</p>
                <ul>
                    <li><strong>Cold Storage:</strong> Energy per unit of product (kWh/lb, kWh/ton), storage efficiency, savings per unit</li>
                    <li><strong>Data Center:</strong> PUE, ITE, CLF, power density, compute efficiency, UPS efficiency</li>
                    <li><strong>Healthcare:</strong> Energy per patient day, energy per bed, OR efficiency, medical equipment power density</li>
                    <li><strong>Hospitality:</strong> Energy per room-night, energy per guest, energy per meal, kitchen efficiency</li>
                    <li><strong>Manufacturing:</strong> Energy per unit produced, energy per machine hour, compressed air efficiency, motor efficiency</li>
                </ul>
                <p>These metrics are normalized for facility-specific variables (occupancy, production, patient days, etc.) to provide meaningful comparisons.</p>
            </div>

            <h4>8.3.7 Stage 7: Energy Savings Analysis (IPMVP)</h4>
            <div class="step">
                <span class="step-number">1</span>
                <strong>Baseline Establishment:</strong> Develop pre-installation baseline
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <strong>Post-Installation Analysis:</strong> Analyze post-installation data
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <strong>Savings Calculation:</strong> Calculate energy and demand savings
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <strong>Attribution Analysis:</strong> Attribute savings to specific measures
            </div>

            <h3>8.4 Advanced Analysis Features</h3>
            
            <h4>8.4.1 Network Envelope Analysis</h4>
            <div class="info">
                <h4>📈 Envelope Analysis Features:</h4>
                <ul>
                    <li><strong>Load Profile Analysis:</strong> Detailed load profile characterization</li>
                    <li><strong>Peak Demand Analysis:</strong> Peak demand identification and analysis</li>
                    <li><strong>Load Factor Calculation:</strong> System load factor determination</li>
                    <li><strong>Demand Response Analysis:</strong> Demand response potential assessment</li>
                </ul>
            </div>

            <h4>8.4.2 Harmonic Analysis</h4>
            <div class="feature-card">
                <h4>🎵 Advanced Harmonic Analysis</h4>
                <p><strong>Harmonic Analysis Capabilities:</strong></p>
                <ul>
                    <li>FFT-based harmonic decomposition</li>
                    <li>Individual harmonic component analysis</li>
                    <li>Harmonic power flow analysis</li>
                    <li>Harmonic distortion impact assessment</li>
                </ul>
            </div>

            <h3>8.5 Analysis Results & Outputs</h3>
            
            <h4>8.5.1 Comprehensive Results Structure</h4>
            <div class="code-block">
Analysis Results:
├── Power Quality Analysis
│   ├── IEEE 519 Compliance
│   ├── Harmonic Analysis
│   └── Three-Phase Analysis
├── Statistical Analysis
│   ├── ASHRAE Guideline 14 Compliance
│   ├── Data Quality Metrics
│   └── Confidence Intervals
├── Energy Savings Analysis
│   ├── IPMVP Compliance
│   ├── Savings Attribution
│   └── Financial Impact
├── Weather Normalization
│   ├── Baseline Model
│   ├── Weather-Adjusted Savings
│   └── Uncertainty Analysis
└── Audit Trail
    ├── Calculation Log
    ├── Compliance Checks
    └── Data Quality Verification
            </div>

            <h4>8.5.2 Facility-Specific Results</h4>
            <div class="feature-card">
                <h4>📊 Facility-Specific Report Sections:</h4>
                <p>When using facility-specific analysis, the results include dedicated sections for facility-specific metrics:</p>
                <ul>
                    <li><strong>Cold Storage Analysis:</strong> Energy intensity metrics, storage efficiency, product-based savings</li>
                    <li><strong>Data Center Analysis:</strong> PUE metrics, power density, compute efficiency, UPS analysis</li>
                    <li><strong>Healthcare Analysis:</strong> Patient-day metrics, bed-based metrics, OR efficiency, medical equipment analysis</li>
                    <li><strong>Hospitality Analysis:</strong> Room-night metrics, guest-based metrics, meal-based metrics, kitchen efficiency</li>
                    <li><strong>Manufacturing Analysis:</strong> Production efficiency, machine-hour metrics, compressed air efficiency, motor efficiency</li>
                </ul>
                <p>These sections appear in both the UI HTML Report and the Client HTML Report, providing comprehensive facility-specific insights.</p>
            </div>

            <h4>8.5.3 Quality Assurance & Validation</h4>
            <div class="warning">
                <h4>✅ Quality Assurance Process:</h4>
                <ul>
                    <li><strong>Cross-Validation:</strong> Multiple calculation methods verification</li>
                    <li><strong>Range Checking:</strong> Results within expected ranges</li>
                    <li><strong>Consistency Verification:</strong> Logical relationship validation</li>
                    <li><strong>Standards Compliance:</strong> Regulatory requirement verification</li>
                </ul>
            </div>
        </div>
    `
};

// Function to load additional sections
function loadAdditionalSections() {
    const container = document.querySelector('.container');
    
    // Add dashboard overview section
    container.insertAdjacentHTML('beforeend', additionalSections.dashboardOverview);
    
    // Add facility-specific analysis section
    container.insertAdjacentHTML('beforeend', additionalSections.facilitySpecificAnalysis);
    
    // Add data management section
    container.insertAdjacentHTML('beforeend', additionalSections.dataManagement);
    
    // Add field forms guide section
    container.insertAdjacentHTML('beforeend', additionalSections.fieldFormsGuide);
    
    // Add analysis workflow section
    container.insertAdjacentHTML('beforeend', additionalSections.analysisWorkflow);
}

// Auto-load sections when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAdditionalSections();
    // Re-setup smooth scrolling after content is loaded
    if (typeof setupSmoothScrolling === 'function') {
        setupSmoothScrolling();
    }
});
