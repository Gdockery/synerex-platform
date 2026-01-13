export default function SoftwareControlsSensors() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Advanced Software Controls and Intelligent Sensing Systems</h2>
            <p className="text-lg text-gray-200 mb-4">
              High-precision current and voltage sensing combined with intelligent software controls to enable real-time visibility, coordination, and optimization of power quality across three-phase electrical networks.
            </p>
            <p className="text-lg text-gray-200">
              A network-level sensing and control architecture designed to support system-wide optimization rather than isolated, circuit-specific monitoring.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Intelligent Sensor Networks</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced sensor arrays that provide comprehensive monitoring of current, voltage, frequency, and power quality parameters across entire electrical networks with real-time data collection and analysis.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Adaptive Control Algorithms</h3>
            <p className="text-sm mt-2 text-gray-300">Smart software controls that automatically adjust system parameters based on real-time sensor data, optimizing power quality and system performance through machine learning and predictive analytics.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-Time Data Processing</h3>
            <p className="text-sm mt-2 text-gray-300">High-speed data processing systems that analyze sensor inputs in real-time, providing instant feedback and control adjustments to maintain optimal power quality conditions across all connected equipment.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Predictive Maintenance</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced analytics that predict equipment failures and maintenance needs based on sensor data patterns, enabling proactive maintenance scheduling and reducing unexpected downtime.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Remote Monitoring & Control</h3>
            <p className="text-sm mt-2 text-gray-300">Cloud-based monitoring platforms that allow remote access to sensor data and control systems, enabling 24/7 monitoring and management from anywhere in the world.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Integration & Scalability</h3>
            <p className="text-sm mt-2 text-gray-300">Modular software architecture that seamlessly integrates with existing SCADA, BMS, and enterprise systems while supporting scalable expansion from single-site to multi-facility deployments.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

