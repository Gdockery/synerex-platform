export default function OEMODMEquipmentLicensing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-purple-300 mb-4">OEM / ODM Equipment Licensing Programs</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured OEM and ODM licensing opportunities for ECBS hardware platforms, supporting private-label deployment, co-development, and integration into existing product lines with defined manufacturing and licensing frameworks.
            </p>
            <p className="text-lg text-gray-200">
              A network-level equipment strategy designed to support coordinated electrical performance across power systems rather than isolated, circuit-specific devices.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">White-Label Solutions</h3>
            <p className="text-sm mt-2 text-gray-300">Complete white-label ECBS equipment solutions that allow OEM partners to brand and market power quality equipment under their own name while leveraging Synerex's proven technology and manufacturing capabilities.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Co-Development Programs</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative development programs that combine Synerex's ECBS technology with OEM expertise to create customized solutions for specific market segments and application requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Manufacturing Support</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive manufacturing support including production planning, quality control, supply chain management, and logistics coordination to ensure reliable delivery of licensed equipment.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Technical Documentation</h3>
            <p className="text-sm mt-2 text-gray-300">Complete technical documentation packages including design specifications, manufacturing procedures, testing protocols, and compliance documentation to support successful equipment production and certification.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Quality Assurance</h3>
            <p className="text-sm mt-2 text-gray-300">Rigorous quality assurance programs with standardized testing procedures, performance validation, and compliance verification to ensure all licensed equipment meets Synerex's high quality standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Market Support</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive market support including sales training, marketing materials, technical support, and customer service programs to help OEM partners successfully launch and support licensed equipment.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

