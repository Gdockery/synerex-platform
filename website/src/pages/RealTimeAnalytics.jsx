import LicenseSeal from "../components/LicenseSeal.jsx";

export default function RealTimeAnalytics() {
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
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Real-Time Power Quality Analytics Platform</h2>
            <p className="text-lg text-gray-200 mb-4">
              Live analytics delivering continuous assessment of current, voltage, harmonics, and system behavior with event detection and trend analysis across complex electrical networks.
            </p>
            <p className="text-lg text-gray-200">
              Designed for network-wide analysis, enabling insight beyond single-circuit instrumentation.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
      
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Live Monitoring</h3>
            <p className="text-sm text-gray-300">Continuous real-time monitoring of power quality parameters including voltage, current, harmonics, and power factor across all network nodes.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Instant Alerts</h3>
            <p className="text-sm text-gray-300">Immediate notification system for power quality anomalies, voltage sags, harmonic distortions, and equipment performance issues.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Trend Analysis</h3>
            <p className="text-sm text-gray-300">Advanced pattern recognition and trend analysis to predict potential issues before they impact system performance.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Network Visualization</h3>
            <p className="text-sm text-gray-300">Interactive network topology maps showing real-time power quality status across all connected devices and circuits.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Performance Metrics</h3>
            <p className="text-sm text-gray-300">Comprehensive KPIs including power quality indices, energy efficiency metrics, and equipment health indicators.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Data Streaming</h3>
            <p className="text-sm text-gray-300">High-speed data streaming capabilities with sub-second latency for critical power quality monitoring applications.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Custom Dashboards</h3>
            <p className="text-sm text-gray-300">Configurable real-time dashboards tailored to specific operational requirements and user roles.</p>
          </div>
          
          <div className="p-6 border bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">API Integration</h3>
            <p className="text-sm text-gray-300">RESTful APIs and webhook support for seamless integration with existing SCADA, EMS, and enterprise systems.</p>
          </div>
        </div>
        
        <div className="mt-12 p-8 bg-gradient-to-r from-purple-950/50 to-gray-900/50 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Real-Time Analytics Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Operational Excellence</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Immediate detection of power quality issues</li>
                <li>• Proactive maintenance scheduling</li>
                <li>• Reduced downtime and equipment failures</li>
                <li>• Optimized energy consumption</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Business Intelligence</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Data-driven decision making</li>
                <li>• Performance benchmarking</li>
                <li>• Cost optimization insights</li>
                <li>• Regulatory compliance monitoring</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/real-time-analytics" 
            className="inline-flex items-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-400 transition-colors"
          >
            Learn More About Power Analysis
          </a>
        </div>
      </section>
    </div>
  );
}

