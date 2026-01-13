import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function RealTimeMonitoring() {
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
        title="Real-time Monitoring" 
        subtitle="Advanced monitoring and control systems provide real-time visibility into power quality metrics, enabling proactive management and optimization of electrical network performance." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Live Power Quality Metrics</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous monitoring of voltage, current, frequency, harmonics, and power factor across all phases provides instant visibility into electrical system performance and identifies issues as they develop.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Network-wide Visibility</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive monitoring across the entire electrical network enables operators to track power quality conditions at every point, ensuring consistent performance throughout the facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Predictive Analytics</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced analytics algorithms analyze historical data and current trends to predict potential power quality issues before they occur, enabling proactive maintenance and preventing equipment damage.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Automated Alerts</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent alerting system notifies operators immediately when power quality parameters exceed acceptable thresholds, ensuring rapid response to potential issues and minimizing downtime.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Performance Dashboards</h3>
            <p className="text-sm mt-2 text-gray-300">Interactive dashboards provide intuitive visualization of power quality data, trends, and system performance, making it easy for operators to understand and manage electrical network conditions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Historical Data Analysis</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive data logging and storage enables detailed analysis of power quality trends over time, supporting long-term optimization and compliance reporting requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Remote Access & Control</h3>
            <p className="text-sm mt-2 text-gray-300">Secure remote access capabilities allow authorized personnel to monitor and control ECBS systems from anywhere, providing flexibility and ensuring continuous system management.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Integration Capabilities</h3>
            <p className="text-sm mt-2 text-gray-300">Seamless integration with existing SCADA systems, building management systems, and other monitoring platforms ensures comprehensive facility management and operational efficiency.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

