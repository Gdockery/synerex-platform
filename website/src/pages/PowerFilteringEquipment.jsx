export default function PowerFilteringEquipment() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Advanced Power Quality and Network-Level Optimization Systems</h2>
            <p className="text-lg text-gray-200 mb-4">
              High-performance electrical conditioning and current-balancing hardware engineered to improve efficiency, stability, and performance across commercial and industrial power networks.
            </p>
            <p className="text-lg text-gray-200">
              Designed to operate at the electrical network level, ECBS hardware applies coordinated correction of imbalance, harmonics, and reactive power—addressing system-wide electrical behavior rather than isolated, single-circuit correction.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Advanced Power Filters</h3>
            <p className="text-sm mt-2 text-gray-300">Specialized filtering equipment designed to eliminate harmonic distortion and maintain clean 60Hz power quality in industrial and commercial electrical systems.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Conditioning Units</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced power conditioning systems that stabilize voltage levels, reduce electrical noise, and ensure consistent power quality across all connected equipment.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Active Power Filters</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent filtering systems that actively monitor and correct power quality issues in real-time, providing dynamic compensation for voltage fluctuations and harmonic distortion.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Passive Filter Networks</h3>
            <p className="text-sm mt-2 text-gray-300">Reliable passive filtering solutions using capacitors, inductors, and resistors to provide cost-effective power quality improvement for standard industrial applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Frequency Conversion Systems</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced frequency conversion equipment that ensures optimal 60Hz operation while providing flexibility for international applications and specialized industrial requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Custom PQ Software Tuning Solutions</h3>
            <p className="text-sm mt-2 text-gray-300">Tailored filtering equipment designed to meet specific power quality requirements, including custom frequency responses, power ratings, and environmental specifications.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

