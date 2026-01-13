import LicenseSeal from "../components/LicenseSeal.jsx";

export default function PatentedTechnology() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Patented Electrical Current Balancing Technology</h2>
            <p className="text-lg text-gray-200 mb-4">
              Advanced ECBS technology engineered to improve electrical stability, efficiency, and performance across three-phase power networks through coordinated, system-level current balancing.
            </p>
            <p className="text-lg text-gray-200">
              A network-level execution approach designed to address electrical behavior across the distribution system rather than at individual circuits.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="space-y-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/intellectual-properties-portfolio" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Patent Portfolio</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">US 12375324B2 - Advanced ECBS Technology covering electrical current balancing systems and methods.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
              <a href="/technology-benefits" className="hover:text-purple-400">
                <h3 className="font-bold text-purple-400">Technology Benefits</h3>
              </a>
              <p className="text-sm mt-2 text-gray-300">Network-wide current balancing for improved power quality, stability, and efficiency across electrical facilities.</p>
            </div>
            <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
              <h3 className="font-bold text-purple-400">Implementation</h3>
              <p className="text-sm mt-2 text-gray-300">Full-scale deployment capabilities with real-time monitoring and control systems for industrial applications.</p>
            </div>
            <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
              <h3 className="font-bold text-purple-400">Licensing Opportunities</h3>
              <p className="text-sm mt-2 text-gray-300">Patent licensing available for field-of-use flexibility and commercial implementation partnerships.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

