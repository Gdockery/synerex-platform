import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function ComprehensiveEnergySavingsTesting() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`        @keyframes gradientMove {
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
      {/* Hero Section with Logo */}
      <section className="relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white">
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
        </div>
      </section>
      <LicenseSeal />
      <Hero 
        title="Comprehensive Energy Savings/Testing Software" 
        subtitle="Advanced energy efficiency analysis, optimization, and comprehensive testing tools for utility incentives and performance measurement."
      />
      
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Energy Efficiency Analysis */}
          <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Energy Efficiency Analysis</h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• Real-time energy consumption monitoring</li>
              <li>• Baseline energy usage establishment</li>
              <li>• Energy efficiency ratio calculations</li>
              <li>• Load profile analysis and optimization</li>
              <li>• Energy waste identification and reporting</li>
              <li>• Comparative analysis across time periods</li>
              <li>• Energy intensity metrics and benchmarking</li>
              <li>• Predictive energy modeling and forecasting</li>
            </ul>
          </div>

          {/* Optimization Tools */}
          <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Optimization & Normalization</h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• Automated optimization recommendations</li>
              <li>• Weather normalization algorithms</li>
              <li>• Load factor optimization strategies</li>
              <li>• Power factor correction analysis</li>
              <li>• Harmonic distortion reduction planning</li>
              <li>• Voltage optimization recommendations</li>
              <li>• Equipment efficiency improvement plans</li>
              <li>• Energy conservation measure prioritization</li>
            </ul>
          </div>

          {/* Comprehensive Testing */}
          <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Comprehensive Testing</h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• Pre and post-installation testing protocols</li>
              <li>• Energy savings measurement and verification</li>
              <li>• Equipment performance validation</li>
              <li>• System integration testing procedures</li>
              <li>• Load testing and stress analysis</li>
              <li>• Power quality impact assessment</li>
              <li>• Efficiency improvement verification</li>
              <li>• Compliance testing and certification</li>
            </ul>
          </div>

          {/* Validation Tools */}
          <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Validation & Audit Tools</h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• Third-party validation protocols</li>
              <li>• Audit trail documentation and reporting</li>
              <li>• Data integrity verification systems</li>
              <li>• Measurement uncertainty analysis</li>
              <li>• Statistical significance testing</li>
              <li>• Quality assurance and control procedures</li>
              <li>• Regulatory compliance verification</li>
              <li>• Performance guarantee validation</li>
            </ul>
          </div>

          {/* Utility Incentives */}
          <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Utility Incentives</h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• Utility rebate program qualification</li>
              <li>• Energy efficiency incentive applications</li>
              <li>• Demand response program participation</li>
              <li>• Time-of-use optimization strategies</li>
              <li>• Peak demand reduction programs</li>
              <li>• Renewable energy credit tracking</li>
              <li>• Carbon footprint reduction reporting</li>
              <li>• Sustainability goal achievement tracking</li>
            </ul>
          </div>

          {/* Performance Measurement */}
          <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Performance Measurement</h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• Real-time performance monitoring</li>
              <li>• Key performance indicator (KPI) tracking</li>
              <li>• Energy savings quantification</li>
              <li>• Return on investment (ROI) calculations</li>
              <li>• Payback period analysis</li>
              <li>• Cost-benefit analysis reporting</li>
              <li>• Performance degradation detection</li>
              <li>• Maintenance scheduling optimization</li>
            </ul>
          </div>

        </div>

        {/* Key Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-300 text-center mb-8">Key Software Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-300 mb-3">Advanced Analytics Engine</h3>
                <p className="text-gray-300">
                  Sophisticated algorithms for energy data analysis, pattern recognition, and predictive modeling 
                  to identify optimization opportunities and validate energy savings.
                </p>
              </div>
              
              <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-300 mb-3">Utility Billing Integration</h3>
                <p className="text-gray-300">
                  Seamless integration with utility billing systems to align performance measurements with 
                  actual utility costs and provide accurate financial impact analysis.
                </p>
              </div>
              
              <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-300 mb-3">Regulatory Compliance</h3>
                <p className="text-gray-300">
                  Built-in compliance frameworks for various utility incentive programs, energy efficiency 
                  standards, and regulatory requirements across different jurisdictions.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-300 mb-3">Custom Reporting Suite</h3>
                <p className="text-gray-300">
                  Comprehensive reporting tools that generate detailed energy savings reports, utility 
                  incentive applications, and performance validation documentation.
                </p>
              </div>
              
              <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-300 mb-3">Multi-Site Management</h3>
                <p className="text-gray-300">
                  Enterprise-level capabilities for managing energy efficiency programs across multiple 
                  facilities, sites, and geographic locations with centralized reporting and control.
                </p>
              </div>
              
              <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-bold text-gray-300 mb-3">API Integration</h3>
                <p className="text-gray-300">
                  Robust API framework for integrating with existing building management systems, 
                  utility data platforms, and third-party energy management tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-300 text-center mb-8">Software Benefits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 text-center">
              <h3 className="text-xl font-bold text-gray-300 mb-3">Maximize Utility Incentives</h3>
              <p className="text-gray-300">
                Qualify for and maximize utility rebates, incentives, and demand response programs 
                through comprehensive testing and validation protocols.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 text-center">
              <h3 className="text-xl font-bold text-gray-300 mb-3">Accurate Energy Savings</h3>
              <p className="text-gray-300">
                Precise measurement and verification of energy savings with industry-standard 
                protocols and statistical analysis methods.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800 text-center">
              <h3 className="text-xl font-bold text-gray-300 mb-3">Streamlined Operations</h3>
              <p className="text-gray-300">
                Automated testing, reporting, and compliance processes that reduce manual effort 
                and ensure consistent, reliable results.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="p-8 rounded-xl border border-gray-700 bg-gray-800 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Ready to Optimize Your Energy Efficiency?</h2>
            <p className="text-gray-300 mb-6">
              Contact us to learn more about our Comprehensive Energy Savings/Testing Software and how it can 
              help you maximize utility incentives and achieve measurable energy savings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-400 transition-colors"
              >
                Contact Us
              </a>
              <a 
                href="/downloads" 
                className="px-6 py-3 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-400/30 transition-colors"
              >
                Download Resources
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

