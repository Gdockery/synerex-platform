import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function ControlSystems() {
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
        title="Control Systems" 
        subtitle="Advanced control system patents covering intelligent scheduling, real-time monitoring, wireless communication protocols, and adaptive algorithms for optimal ECBS performance across various network conditions." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Intelligent Scheduling</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced scheduling algorithms that optimize ECBS operation timing, load balancing sequences, and maintenance windows to maximize system efficiency while minimizing operational disruptions and energy consumption.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-Time Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive real-time monitoring systems that continuously track electrical network conditions, power quality metrics, and ECBS performance parameters, enabling immediate response to changing conditions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Wireless Communication Protocols</h3>
            <p className="text-sm mt-2 text-gray-300">Secure wireless communication systems that enable remote monitoring, control, and coordination of ECBS units across distributed networks, ensuring reliable data transmission and system coordination.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Adaptive Algorithms</h3>
            <p className="text-sm mt-2 text-gray-300">Self-learning algorithms that automatically adjust ECBS parameters based on historical data, current conditions, and performance feedback, continuously optimizing system operation for maximum efficiency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Predictive Control</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced predictive control systems that anticipate future network conditions and load changes, enabling proactive ECBS adjustments to maintain optimal power quality and prevent potential issues.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Fault Detection & Diagnostics</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent fault detection systems that identify potential issues before they cause system failures, providing early warning alerts and diagnostic information for preventive maintenance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Multi-Unit Coordination</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced coordination algorithms that manage multiple ECBS units working together, ensuring optimal load distribution and preventing conflicts while maximizing overall system performance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Network Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Seamless integration protocols that enable ECBS control systems to interface with existing electrical infrastructure, SCADA systems, and building management systems for unified operation.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Control Systems Patent Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Advanced scheduling and optimization algorithms</li>
            <li>• Real-time monitoring and control methodologies</li>
            <li>• Wireless communication and networking protocols</li>
            <li>• Adaptive and predictive control systems</li>
            <li>• Fault detection and diagnostic technologies</li>
            <li>• Multi-unit coordination and management systems</li>
            <li>• Network integration and compatibility protocols</li>
            <li>• Additional control system patents are pending and in development</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list represents our control systems patent portfolio. For complete patent information and licensing opportunities, please contact our legal team.</p>
        </div>
      </section>
    </div>
  );
}

