import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function EquipmentProtection() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
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
        title="Equipment Protection" 
        subtitle="Protects electrical equipment from damage caused by current imbalances, voltage spikes, and power quality issues, extending equipment lifespan and reducing maintenance costs." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Current Imbalance Protection</h3>
            <p className="text-sm mt-2 text-gray-300">Network-wide current balancing prevents equipment damage caused by phase imbalances, ensuring all electrical devices receive stable, balanced power that extends their operational life.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Voltage Spike Prevention</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced filtering and balancing technology protects sensitive equipment from voltage spikes and transients that can cause immediate damage or gradual degradation over time.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Harmonic Filtering</h3>
            <p className="text-sm mt-2 text-gray-300">Eliminates harmonic distortion that can cause overheating, vibration, and premature failure in motors, transformers, and other electrical equipment throughout the facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Quality Stabilization</h3>
            <p className="text-sm mt-2 text-gray-300">Maintains consistent power quality parameters that protect equipment from the cumulative effects of poor power quality, including voltage fluctuations and frequency variations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Thermal Protection</h3>
            <p className="text-sm mt-2 text-gray-300">Prevents equipment overheating by eliminating current imbalances that cause excessive heating in electrical components, reducing thermal stress and extending equipment life.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Mechanical Stress Reduction</h3>
            <p className="text-sm mt-2 text-gray-300">Reduces mechanical stress on rotating equipment by providing balanced electrical loads, preventing vibration and mechanical wear that can lead to equipment failure.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Predictive Maintenance</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous monitoring of power quality parameters enables predictive maintenance scheduling, identifying potential equipment issues before they cause failures or damage.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Cost Reduction</h3>
            <p className="text-sm mt-2 text-gray-300">Significantly reduces maintenance costs and equipment replacement expenses by preventing damage and extending equipment lifespan through improved power quality conditions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

