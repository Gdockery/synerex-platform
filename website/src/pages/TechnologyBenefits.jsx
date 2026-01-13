import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function TechnologyBenefits() {
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
        title="Patented Technology & Benefits" 
        subtitle="Network-wide current balancing for improved power quality, stability, and efficiency across electrical facilities." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/power-quality-improvement" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Power Quality Improvement</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">ECBS technology significantly improves power quality by balancing electrical current across all phases, network-wide, reducing harmonics, voltage fluctuations, and power factor issues that can damage equipment and reduce efficiency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/network-stability" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Network Stability</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Provides enhanced electrical network stability through real-time current balancing, preventing power outages, equipment failures, and system-wide disruptions that can impact operations and productivity.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/energy-efficiency" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Energy Efficiency</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Optimizes energy consumption by eliminating current imbalances that cause unnecessary power losses, resulting in reduced energy costs and improved overall system efficiency across the entire electrical network.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/equipment-protection" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Equipment Protection</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Protects electrical equipment from damage caused by current imbalances, voltage spikes, and power quality issues, extending equipment lifespan and reducing maintenance costs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/scalable-implementation" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Scalable Implementation</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Network-wide deployment capability allows for comprehensive current balancing across entire facilities, from small installations to large industrial complexes, providing consistent benefits at any scale.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/real-time-monitoring" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Real-time Monitoring</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Advanced monitoring and control systems provide real-time visibility into power quality metrics, enabling proactive management and optimization of electrical network performance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/compliance-standards" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Compliance & Standards</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Helps facilities meet and exceed electrical power quality standards and regulations, ensuring compliance with industry requirements and avoiding potential penalties or operational restrictions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/cost-savings" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Cost Savings</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Delivers significant cost savings through reduced energy consumption, lower maintenance requirements, extended equipment life, and improved operational efficiency across the entire electrical infrastructure.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

