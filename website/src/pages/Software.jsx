import { Link } from "react-router-dom";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient {
          background-size: 400% 400%;
          animation: gradientMove 15s ease infinite;
        }
        .fade-in {
          opacity: 0;
          transform: translateY(15px);
          animation: fadeIn 1.5s ease forwards;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .logo-glow {
          filter: brightness(0) invert(1) drop-shadow(0 0 8px rgba(126,34,206,0.6)) drop-shadow(0 0 16px rgba(59,130,246,0.4));
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/images/Synerex_Software_Programming.jpeg)',
            zIndex: 0
          }}
        />
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in relative" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl" style={{ fontSize: '2.4rem', textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>Tamper-Proof Energy Metering Platform</h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution (<strong>SYNEREX</strong>) is a comprehensive, professional-grade power quality and energy analysis platform designed for utility companies, engineering consultants, and energy professionals. The system provides advanced measurement and verification (M&V) capabilities, regulatory compliance verification, and detailed energy savings analysis.
            </p>
            <p className="text-lg text-gray-200 mb-8">The Gold Standard in Utility-Grade Power Analysis — delivering absolute data integrity, real-time power quality visibility, and an impenetrable chain of custody.</p>
          </div>
          <a href="#integration" className="bg-purple-600 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-200/40">Request Integration Proposal</a>
        </div>
      </section>

      {/* Integration Options */}
      <section id="integration" className="py-20 px-3 bg-gray-900 fade-in">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-purple-400 mb-8 text-center">Three Seamless Integration Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-purple-200/20 transition-all duration-500">
              <h3 className="text-xl font-semibold mb-3 text-purple-300">Direct Serial / USB Integration</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>RS-485, Modbus RTU, or USB connection</li>
                <li>Encrypted local storage with tamper detection</li>
                <li>Dedicated or VPN-secured network</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-purple-200/20 transition-all duration-500">
              <h3 className="text-xl font-semibold mb-3 text-purple-300">Network-Connected Meters</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Native Ethernet interface</li>
                <li>VPN tunnel & PKI authentication</li>
                <li>Firewall-restricted access control</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-purple-200/20 transition-all duration-500">
              <h3 className="text-xl font-semibold mb-3 text-purple-300">Wireless Metering</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>AES-256 encrypted protocol</li>
                <li>Frequency hopping & spread spectrum</li>
                <li>Certificate-based mutual authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Section */}
      <section id="deep-dive" className="py-20 bg-gradient-to-r from-gray-950 via-purple-900 to-gray-900 px-3">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-purple-400 mb-10 text-center">Deep-Dive: Military-Grade Security & Global Standards Compliance</h2>
          <div className="grid md:grid-cols-2 gap-10 text-gray-300 text-sm">
            <div>
              <h3 className="text-xl text-purple-300 mb-3 font-semibold">Military-Grade Cryptographic Security</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>SHA-256 File Fingerprinting System</li>
                <li>HMAC-SHA256 Authentication</li>
                <li>Digital Signatures with Timestamps</li>
                <li>Complete Chain of Custody</li>
                <li>Real-Time Integrity Monitoring</li>
                <li>Automatic Tamper Detection</li>
                <li>Blockchain-Style Audit Trail</li>
                <li>Hardware & Software Tamper Detection</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl text-purple-300 mb-3 font-semibold">Comprehensive Standards Compliance</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>IEEE 519-2014/2022 Harmonic Analysis (TDD, PCC, 50th order)</li>
                <li>ASHRAE Guideline 14 (CVRMSE, NMBE, R², Precision)</li>
                <li>NEMA MG1 (Phase Balance & Efficiency Classes)</li>
                <li>IEC 61000 Series (Class A Instrumentation, Harmonic Limits)</li>
                <li>ANSI C12.1/C12.20 (Meter Accuracy Classes 0.1–2.0)</li>
                <li>IPMVP Statistical Validation (p-value, Effect Size, CI)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Flow Architecture & Utility Compliance */}
      <section id="dataflow" className="py-20 bg-gradient-to-r from-gray-950 via-purple-900 to-gray-900 px-3">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-purple-400 mb-10 text-center">Complete Data Flow Architecture & Utility-Grade Compliance</h2>
          <p className="text-gray-300 text-center mb-12 ">SYNEREX integrates complete data lifecycle management, real-time verification, and utility-grade compliance—ensuring end-to-end trust, traceability, and regulatory acceptance.</p>
          {/* Stage Cards */}
          <div className="grid md:grid-cols-3 gap-8 text-gray-300 text-sm mb-12">
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Stage 1: Raw Data Acquisition</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Multi-Source Data Collection: Meters, CSV, API, SCADA</li>
                <li>Immediate Integrity Verification</li>
                <li>Cryptographic Fingerprinting with SHA-256</li>
                <li>Protocol Validation: Modbus, OPC UA/DA, REST</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Stage 2: Data Preprocessing & Validation</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Multi-Layer Validation: Format, range, consistency</li>
                <li>Quality Score Calculation & Outlier Detection</li>
                <li>Gap Analysis & Data Completion</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Stage 3: Analysis Engine Processing</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Comprehensive Power Quality Analysis</li>
                <li>Audit Trail Integration & Standards Compliance</li>
                <li>Real-Time Verification & Traceability</li>
              </ul>
            </div>
          </div>

          <h3 className="text-2xl text-purple-300 font-semibold mb-4">Comprehensive Verification Processes</h3>
          <div className="grid md:grid-cols-3 gap-8 text-gray-300 text-sm mb-12">
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Data Integrity Verification</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Chain of Custody Tracking</li>
                <li>Cryptographic Verification (SHA-256)</li>
                <li>Tamper Detection and Integrity Monitoring</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Calculation Verification System</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>IEEE 519 & ASHRAE 14 Verification</li>
                <li>IPMVP Statistical Testing (p-value validation)</li>
                <li>Real-Time Standards Compliance</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Quality Assurance</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Data Quality Metrics & Cross-Validation</li>
                <li>Continuous Monitoring & Reporting</li>
              </ul>
            </div>
          </div>

          <h3 className="text-2xl text-purple-300 font-semibold mb-4">Utility-Grade Audit Capabilities</h3>
          <p className="text-gray-300 text-sm mb-4">Comprehensive workflows supporting utility-specific verification and PE certification.</p>
          <ul className="list-disc list-inside text-gray-300 text-sm mb-12">
            <li>Utility Requirements: Oncor, CenterPoint, AEP, Entergy, Duke Energy</li>
            <li>PE Review Workflow & Certification Validation</li>
            <li>Submission Timeline & Milestone Tracking</li>
            <li>Real-Time Progress and Deadline Monitoring</li>
          </ul>

          <h3 className="text-2xl text-purple-300 font-semibold mb-4">Utility Incentive Program Success Factors</h3>
          <div className="grid md:grid-cols-2 gap-8 text-gray-300 text-sm mb-12">
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Key Success Metrics</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>100% First-Time Approval Rate</li>
                <li>Zero Rejections and 100% Compliance</li>
                <li>Fast-Track Approval and Utility Satisfaction</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Utility Satisfaction Metrics</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>100% Utility Approval and Retention</li>
                <li>50% Reduction in Review Time</li>
                <li>Zero Follow-Up Requests</li>
              </ul>
            </div>
          </div>

          <h3 className="text-2xl text-purple-300 font-semibold mb-4">Competitive Advantages</h3>
          <ul className="list-disc list-inside text-gray-300 text-sm mb-8">
            <li>Only System with Complete Utility Compliance and 18-Document Audit Package</li>
            <li>Real-Time Compliance Checking and Tamper-Proof Data</li>
            <li>Professional Engineering Integration and PE Certification</li>
            <li>Continuous Real-Time Audit Trail and Verification</li>
          </ul>

          <p className="text-gray-300 text-lg text-center ">SYNEREX is not just a power analysis system — it&apos;s the gold standard for utility incentive programs. With its complete data flow management, verification processes, and 100% compliance rate, SYNEREX delivers the most comprehensive, secure, and utility-ready platform available today.</p>
        </div>
      </section>

      {/* Software Programs */}
      <section className="py-20 bg-gray-900 px-4 fade-in">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-purple-400 mb-8 text-center">Software Programs</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link 
              to="/emv-program"
              className="block bg-gradient-to-br from-purple-700/50 to-blue-900/50 rounded-xl p-8 border border-purple-700/50 hover:border-purple-200 transition-all hover:shadow-lg hover:shadow-purple-200/20"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-purple-400">EM&V Program</h3>
                <span className="text-purple-400">→</span>
              </div>
              <p className="text-gray-300 mb-4">
                Energy Measurement & Verification - Comprehensive, audit-grade software solution for 
                accurate power quality analysis, energy savings measurement, and utility-grade verification.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Power Quality Analysis</li>
                <li>• Energy Savings Measurement</li>
                <li>• Regulatory Compliance</li>
                <li>• Utility-Grade Submission Package</li>
              </ul>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities & Competitive Advantages */}
      <section className="py-20 bg-gray-900 px-4 fade-in">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-purple-400 mb-8">Industry-Leading Capabilities & Competitive Advantages</h2>
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div>
              <h3 className="text-lg text-purple-300 font-semibold mb-2">Technical Excellence</h3>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                <li>±0.01% Calculation Accuracy</li>
                <li>±0.5% Measurement Accuracy (IEC 61000-4-30)</li>
                <li>1,000 Records/Second Data Processing</li>
                <li>99.9% System Uptime</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg text-purple-300 font-semibold mb-2">Unique Differentiators</h3>
              <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                <li>Complete Audit Trail of Every Calculation</li>
                <li>Tamper-Proof Cryptographic Data Protection</li>
                <li>18-Document Comprehensive Audit Package</li>
                <li>Professional Engineering Oversight</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="py-20 bg-gradient-to-br from-purple-950 to-gray-950 px-4 text-center fade-in">
        <div className="">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">The Bottom Line</h2>
          <p className="text-gray-300 text-lg mb-8">SYNEREX is not just a power analysis system — it is the gold standard for global energy data integrity. With its military-grade cryptographic security, comprehensive standards compliance, and world-class audit trail, SYNEREX represents the pinnacle of power analysis technology — delivering the most secure, verifiable, and auditable energy metering system in existence.</p>
          <a href="#integration" className="inline-block bg-purple-600 hover:bg-purple-400 text-white font-semibold py-3 px-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-400/30">Explore the Technology</a>
        </div>
      </section>
    </div>
  );
}

