import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function NetworkStability() {
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
        title="Network Stability" 
        subtitle="Provides enhanced electrical network stability through real-time current balancing, preventing power outages, equipment failures, and system-wide disruptions that can impact operations and productivity." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-time Current Balancing</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous monitoring and adjustment of electrical current across all phases ensures optimal network stability, preventing imbalances that can lead to system instability and power quality issues.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Outage Prevention</h3>
            <p className="text-sm mt-2 text-gray-300">Proactive current balancing prevents power outages by maintaining stable electrical conditions, reducing the risk of cascading failures and system-wide disruptions that can halt operations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Equipment Protection</h3>
            <p className="text-sm mt-2 text-gray-300">Stable electrical conditions protect equipment from damage caused by current imbalances, voltage spikes, and power quality issues, extending equipment life and reducing maintenance costs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">System-wide Coordination</h3>
            <p className="text-sm mt-2 text-gray-300">Network-wide current balancing coordinates all electrical systems to work together harmoniously, preventing localized issues from affecting the entire facility's electrical infrastructure.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Load Distribution</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent load distribution across all phases ensures balanced electrical demand, preventing overload conditions that can cause equipment failures and system instability.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Fault Tolerance</h3>
            <p className="text-sm mt-2 text-gray-300">Enhanced fault tolerance through balanced current distribution allows the system to maintain stability even when individual components experience issues or failures.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Predictive Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced monitoring systems provide predictive insights into potential stability issues, enabling proactive measures to prevent disruptions before they occur.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Operational Continuity</h3>
            <p className="text-sm mt-2 text-gray-300">Maintains continuous operations by ensuring stable electrical conditions that support critical systems and processes, minimizing downtime and productivity losses.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

