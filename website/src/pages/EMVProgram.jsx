import { Link } from "react-router-dom";
import { useState } from "react";
import LicenseRegistration from "../components/LicenseRegistration.jsx";

export default function EMVProgram() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://localhost:3001/api/pdf/generate-emv-program-pdf?url=' + encodeURIComponent(window.location.href), {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EMV-Program-Overview.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to generate PDF. Please try again or use the browser print function (Ctrl+P / Cmd+P).');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-100 pt-16" style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientMove 15s ease infinite'
    }}>
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Print Styles - Comprehensive formatting for PDF */
        @media print {
          @page {
            size: A4;
            margin: 0.75in;
          }
          
          /* Reset all backgrounds and colors for print */
          * {
            background: white !important;
            color: #000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          body {
            background: white !important;
            font-size: 11pt;
            line-height: 1.5;
            color: #000 !important;
            padding: 0 !important;
          }
          
          /* Hide interactive elements */
          button, a[href], .no-print {
            display: none !important;
          }
          
          /* Container adjustments */
          .max-w-7xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          /* Hero section - make it compact for print */
          section:first-child {
            page-break-after: avoid;
            margin-bottom: 20pt !important;
            padding: 15pt 0 !important;
          }
          
          h1 {
            font-size: 24pt !important;
            margin-bottom: 10pt !important;
            page-break-after: avoid;
          }
          
          h2 {
            font-size: 18pt !important;
            margin-top: 20pt !important;
            margin-bottom: 12pt !important;
            page-break-after: avoid;
            border-bottom: 2pt solid #000 !important;
            padding-bottom: 6pt !important;
          }
          
          h3 {
            font-size: 14pt !important;
            margin-top: 15pt !important;
            margin-bottom: 8pt !important;
            page-break-after: avoid;
            font-weight: bold !important;
          }
          
          /* Text sizing for readability */
          p, li, span {
            font-size: 10pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }
          
          /* Sections - prevent awkward breaks */
          section {
            page-break-inside: avoid;
            margin-bottom: 20pt !important;
            padding: 0 !important;
          }
          
          /* Cards and boxes - convert to simple bordered boxes */
          .bg-gray-900\\/50, .bg-gray-800\\/50, 
          .bg-gradient-to-br, .bg-gradient-to-r,
          .backdrop-blur-sm {
            background: white !important;
            border: 1pt solid #ccc !important;
            border-radius: 0 !important;
            padding: 12pt !important;
            margin-bottom: 12pt !important;
            page-break-inside: avoid;
          }
          
          /* Grid layouts - stack vertically for print */
          .grid {
            display: block !important;
          }
          
          .grid > * {
            width: 100% !important;
            margin-bottom: 15pt !important;
            page-break-inside: avoid;
          }
          
          /* Lists - better spacing */
          ul {
            margin: 8pt 0 !important;
            padding-left: 20pt !important;
          }
          
          li {
            margin-bottom: 6pt !important;
            line-height: 1.4 !important;
          }
          
          /* Images - ensure they print */
          img {
            max-width: 200pt !important;
            height: auto !important;
            filter: none !important;
            -webkit-filter: none !important;
          }
          
          /* Logo in header */
          section:first-child img {
            max-width: 150pt !important;
          }
          
          /* Spacing adjustments */
          .mb-16, .mb-8, .mb-6, .mb-4 {
            margin-bottom: 12pt !important;
          }
          
          .mt-8 {
            margin-top: 12pt !important;
          }
          
          /* Text colors - convert to black/gray for print */
          .text-purple-400, .text-blue-400 {
            color: #000 !important;
            font-weight: bold !important;
          }
          
          .text-gray-300, .text-gray-400, .text-gray-100 {
            color: #333 !important;
          }
          
          .text-white {
            color: #000 !important;
          }
          
          /* Bullet points and checkmarks */
          .text-purple-400.mr-2 {
            color: #000 !important;
            font-weight: bold !important;
          }
          
          /* Ensure proper page breaks between major sections */
          section:nth-child(even) {
            page-break-before: auto;
          }
          
          /* Prevent orphaned headings */
          h2 + div, h3 + ul, h3 + p {
            page-break-before: avoid;
          }
          
          /* Table-like content (if any) */
          .grid.md\\:grid-cols-3,
          .grid.md\\:grid-cols-2 {
            display: block !important;
          }
          
          /* License registration component - hide or simplify */
          .bg-gradient-to-r {
            border: 1pt solid #000 !important;
            padding: 15pt !important;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-[2.025rem] md:text-[2.7rem] font-bold mb-6 flex items-center justify-center gap-3">
            <img 
              src="/images/synerex_logo.PNG" 
              alt="Synerex" 
              className="h-11 md:h-14 w-auto brightness-0 invert"
            />
            <span className="text-white">
              &quot;One-form&quot; EM&V Program
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Energy Measurement & Verification - Utility-grade power analysis and energy savings verification
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/copyright-software-licensing"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-400 rounded-lg font-semibold transition-colors"
            >
              Get Licensed
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors border border-gray-700"
            >
              Contact Sales
            </Link>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed no-print"
            >
              {isExporting ? 'Generating PDF...' : '📄 Export as PDF'}
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors no-print"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </section>

        {/* Overview Section */}
        <section className="mb-16">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Program Overview</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              The Synerex One-Form EM&V (Energy Measurement & Verification) Program is a comprehensive, 
              audit-grade software solution designed for accurate power quality analysis, energy 
              savings measurement, and utility-grade verification. Built to meet the highest 
              industry standards, it provides the precision and reliability required for 
              regulatory compliance and investment-grade energy savings documentation.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-200 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-purple-400">Real-Time Analysis</h3>
                <p className="text-gray-400">Continuous monitoring and analysis of power quality metrics</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-200 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-purple-400">Audit-Grade Accuracy</h3>
                <p className="text-gray-400">Meets IEEE, ASHRAE, and IEC standards for measurement precision</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-200 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-purple-400">Utility-Grade Submission</h3>
                <p className="text-gray-400">Complete audit trail and submission-ready documentation packages for applying for rebate programs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Comprehensive Standards Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-100">Industry Standards Compliance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* IEEE Standards */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-purple-400">IEEE Standards</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IEEE 519-2014/2022:</strong> Harmonic distortion limits and compliance verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IEEE C57.12.00:</strong> Transformer efficiency and power factor analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IEEE C57.110:</strong> Harmonic loss evaluation methodology</span>
                </li>
              </ul>
            </div>

            {/* ASHRAE Standards */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-purple-400">ASHRAE Standards</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>ASHRAE Guideline 14:</strong> Measurement of Energy and Demand Savings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Statistical validation (CVRMSE, NMBE, R²)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Precision requirements (≤10% CVRMSE, ≤5% NMBE)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Baseline model development and validation</span>
                </li>
              </ul>
            </div>

            {/* IEC Standards */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-purple-400">IEC Standards</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IEC 62053-22:</strong> Class 0.2s meter accuracy (±0.2%)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IEC 61000-4-7:</strong> Harmonic measurement methodology</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IEC 61000-2-2:</strong> Voltage variation limits (±10%)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Up to 50th harmonic analysis</span>
                </li>
              </ul>
            </div>

            {/* ANSI Standards */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-purple-400">ANSI Standards</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>ANSI C12.1:</strong> Electric meter code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>ANSI C12.20:</strong> Meter accuracy classes (0.1, 0.2, 0.5, 1.0)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Class 0.2 expanded uncertainty verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Meter uncertainty calculations</span>
                </li>
              </ul>
            </div>

            {/* NEMA Standards */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-purple-400">NEMA Standards</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>NEMA MG1:</strong> Motor and generator standards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Voltage unbalance limit (1%)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Phase balance analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Three-phase system evaluation</span>
                </li>
              </ul>
            </div>

            {/* IPMVP & Other Standards */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-purple-400">IPMVP & Other Standards</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>IPMVP:</strong> International Performance Measurement & Verification Protocol</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Options A, B, C, and D support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span><strong>AHRI 550/590:</strong> Chiller efficiency standards (COP, IPLV)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Statistical significance testing (p &lt; 0.05)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-100">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Power Quality Analysis</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Total Harmonic Distortion (THD) analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Individual harmonic analysis (up to 50th harmonic)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Voltage and current unbalance detection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Power factor measurement and correction analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Voltage variation and flicker analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Real-time power quality monitoring</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Energy Savings Measurement</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Before/after energy consumption comparison</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Baseline creation and sealing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Statistical validation (CVRMSE, NMBE, R²)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Time-series normalization and adjustment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Energy savings calculation and verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Investment-grade savings documentation</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Advanced Metering & Data Quality</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Multi-meter data aggregation and analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Data quality validation and completeness checks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Outlier detection and handling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Data resolution verification (1-minute intervals)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Historical data trending and reporting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Meter accuracy class verification</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Compliance & Statistical Analysis</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Automated compliance checking across all standards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Statistical significance testing (p-value analysis)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Baseline model R² validation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Precision and accuracy calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Transformer efficiency analysis (IEEE C57.12.00)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✓</span>
                  <span>Chiller efficiency ratings (AHRI 550/590)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Audit Trail & Utility-Grade Submission Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-100">Audit Trail & Utility-Grade Submission Package</h2>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Complete Audit Trail</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Comprehensive logging:</strong> All calculations, validations, and compliance checks are logged with timestamps</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Input/output tracking:</strong> Complete record of all data inputs and analysis outputs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Standards reference:</strong> Every compliance check references the specific standard and methodology used</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Before/after analysis:</strong> Separate compliance analysis for baseline and post-implementation periods</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Data quality audit:</strong> Data completeness, resolution, and outlier percentage tracking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>No estimations policy:</strong> Utility-grade requirements - all values marked as 'N/A' when data is unavailable (no estimations allowed)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Submission-Ready Documentation</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Automated report generation:</strong> Complete analysis reports ready for utility submission</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Compliance certificates:</strong> Standards compliance verification for each applicable standard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Baseline sealing:</strong> Immutable baseline creation with cryptographic sealing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Statistical validation reports:</strong> CVRMSE, NMBE, R², and p-value documentation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Meter accuracy documentation:</strong> Class verification and uncertainty calculations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">✓</span>
                    <span><strong>Energy savings calculation package:</strong> Complete before/after comparison with all supporting data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-100">Key Benefits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-950/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Utility-Grade Precision</h3>
              <p className="text-gray-300 leading-relaxed">
                Meets the highest industry standards for accuracy and reliability. Trusted by utilities, 
                regulators, and energy service companies for investment-grade energy savings documentation.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-950/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Complete Regulatory Compliance</h3>
              <p className="text-gray-300 leading-relaxed">
                Built-in compliance with IEEE, ASHRAE, IEC, NEMA, ANSI, IPMVP, and AHRI standards. 
                Your reports meet regulatory requirements without additional verification or manual calculations.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-950/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Investment-Grade Documentation</h3>
              <p className="text-gray-300 leading-relaxed">
                Generate submission-ready reports that meet the standards required for financing, 
                incentives, regulatory submissions, and utility programs. Your data is audit-ready.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-950/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Comprehensive Audit Trail</h3>
              <p className="text-gray-300 leading-relaxed">
                Complete logging of all calculations, validations, and compliance checks. Every 
                analysis includes full traceability for regulatory review and verification.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-950/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Time & Cost Savings</h3>
              <p className="text-gray-300 leading-relaxed">
                Automated analysis and reporting reduce manual calculation time by up to 80%, 
                allowing you to focus on implementation rather than documentation. Eliminate costly 
                third-party verification delays.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-950/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Single Platform Solution</h3>
              <p className="text-gray-300 leading-relaxed">
                One comprehensive platform for power quality analysis, energy savings measurement, 
                compliance verification, and utility submission. No need for multiple tools or software packages.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-100">Use Cases</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Energy Service Companies (ESCOs)</h3>
              <p className="text-gray-300 mb-4">
                Verify energy savings for performance contracts and guarantee compliance with 
                client requirements and regulatory standards. Generate utility-grade submission 
                packages for incentive programs and utility rebates.
              </p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Utilities</h3>
              <p className="text-gray-300 mb-4">
                Measure and verify demand response programs, energy efficiency initiatives, 
                and power quality compliance across service territories. Audit-grade documentation 
                for regulatory reporting and program evaluation.
              </p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Facility Managers</h3>
              <p className="text-gray-300 mb-4">
                Monitor power quality, identify energy waste, and document savings for 
                management reporting and budget justification. Generate reports for utility 
                incentive program submissions.
              </p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800 hover:border-purple-200/50 transition-colors">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Consultants & Engineers</h3>
              <p className="text-gray-300 mb-4">
                Provide clients with audit-grade energy analysis and compliance verification 
                reports that meet regulatory and financing requirements. Complete utility-grade 
                submission packages ready for review.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="mb-16">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Technical Specifications</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-200">Measurement Standards</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• IEEE 519-2014/2022 Harmonic Limits</li>
                  <li>• IEEE C57.12.00 Transformer Efficiency</li>
                  <li>• IEEE C57.110 Harmonic Loss Evaluation</li>
                  <li>• ASHRAE Guideline 14 M&V Protocol</li>
                  <li>• IPMVP Option A, B, C, D</li>
                  <li>• IEC 62053-22 Class 0.2s Accuracy</li>
                  <li>• IEC 61000-4-7 Harmonic Measurement</li>
                  <li>• IEC 61000-2-2 Voltage Variation</li>
                  <li>• ANSI C12.1 & C12.20 Standards</li>
                  <li>• NEMA MG1 Phase Balance</li>
                  <li>• AHRI 550/590 Chiller Efficiency</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-200">Analysis Capabilities</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Real-time power quality monitoring</li>
                  <li>• Harmonic distortion analysis (up to 50th harmonic)</li>
                  <li>• Statistical validation (CVRMSE, NMBE, R²)</li>
                  <li>• Before/after energy comparison</li>
                  <li>• Baseline creation and cryptographic sealing</li>
                  <li>• Multi-meter data aggregation</li>
                  <li>• Automated report generation</li>
                  <li>• Complete audit trail logging</li>
                  <li>• Utility-grade submission package generation</li>
                  <li>• Data quality validation and completeness checks</li>
                  <li>• Statistical significance testing (p-value)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Licensing Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-700/50 to-blue-900/50 rounded-xl p-8 border border-purple-700/50 text-center">
            <h2 className="text-3xl font-bold mb-4 text-purple-400">Ready to Get Started?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Choose from our flexible licensing options to get access to the EM&V program. 
              Single report licenses available for one-time projects, or annual licenses for 
              unlimited use.
            </p>
            <LicenseRegistration program="emv" plan="annual" />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
            <h2 className="text-3xl font-bold mb-4 text-purple-400">Have Questions?</h2>
            <p className="text-lg text-gray-300 mb-6">
              Our team is ready to help you understand how the EM&V program can meet your specific needs.
            </p>
            <Link
              to="/contact"
              className="inline-block px-5 py-3 bg-purple-600 hover:bg-purple-400 rounded-lg font-semibold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
