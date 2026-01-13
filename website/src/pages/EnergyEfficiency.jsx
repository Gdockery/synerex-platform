import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function EnergyEfficiency() {
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
        title="Energy Efficiency" 
        subtitle="Optimizes energy consumption by eliminating current imbalances that cause unnecessary power losses, resulting in reduced energy costs and improved overall system efficiency across the entire electrical network." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Current Imbalance Elimination</h3>
            <p className="text-sm mt-2 text-gray-300">Network-wide current balancing eliminates phase imbalances that cause significant energy losses, ensuring optimal power distribution and reducing overall energy consumption across the facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Loss Reduction</h3>
            <p className="text-sm mt-2 text-gray-300">Minimizes power losses through balanced current distribution, preventing energy waste that occurs when electrical systems operate with imbalanced loads and inefficient power flow.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Cost Savings</h3>
            <p className="text-sm mt-2 text-gray-300">Delivers substantial cost savings through reduced energy consumption, lower utility bills, and improved power factor, providing measurable return on investment for facility operations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">System Optimization</h3>
            <p className="text-sm mt-2 text-gray-300">Optimizes entire electrical system performance by ensuring balanced loads across all phases, maximizing efficiency and minimizing energy waste throughout the network.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Factor Improvement</h3>
            <p className="text-sm mt-2 text-gray-300">Automatically improves power factor by balancing reactive power, reducing utility penalties and improving overall electrical system efficiency and energy utilization.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Load Balancing</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent load balancing distributes electrical demand evenly across all phases, preventing overload conditions and ensuring optimal energy utilization throughout the facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-time Optimization</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous real-time optimization of electrical parameters ensures maximum energy efficiency at all times, adapting to changing load conditions and operational requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Environmental Impact</h3>
            <p className="text-sm mt-2 text-gray-300">Reduces environmental impact through lower energy consumption, supporting sustainability goals and helping facilities meet energy efficiency standards and environmental regulations.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

