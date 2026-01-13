import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function PowerQualityImprovement() {
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
        title="Power Quality Improvement" 
        subtitle="ECBS technology significantly improves power quality by balancing electrical current across all phases, network-wide, reducing harmonics, voltage fluctuations, and power factor issues that can damage equipment and reduce efficiency." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Current Balancing</h3>
            <p className="text-sm mt-2 text-gray-300">Network-wide electrical current balancing across all phases ensures optimal power distribution, eliminating imbalances that cause power quality degradation and system inefficiencies.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Harmonic Reduction</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced filtering and balancing technology significantly reduces harmonic distortion, preventing interference with sensitive equipment and improving overall power quality metrics.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Voltage Stability</h3>
            <p className="text-sm mt-2 text-gray-300">Maintains consistent voltage levels across the entire electrical network, preventing voltage fluctuations and sags that can disrupt operations and damage equipment.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Factor Correction</h3>
            <p className="text-sm mt-2 text-gray-300">Automatically corrects power factor issues by balancing reactive power, improving energy efficiency and reducing utility penalties associated with poor power factor.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-time Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous monitoring of power quality parameters provides real-time visibility into system performance, enabling proactive management and optimization of electrical networks.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Equipment Protection</h3>
            <p className="text-sm mt-2 text-gray-300">Protects electrical equipment from power quality issues that can cause premature failure, reducing maintenance costs and extending equipment lifespan across the facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Compliance Standards</h3>
            <p className="text-sm mt-2 text-gray-300">Helps facilities meet IEEE, IEC, and other power quality standards, ensuring compliance with industry regulations and avoiding potential operational restrictions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Energy Efficiency</h3>
            <p className="text-sm mt-2 text-gray-300">Optimizes energy consumption by eliminating power quality issues that cause unnecessary energy losses, resulting in significant cost savings and improved system efficiency.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

