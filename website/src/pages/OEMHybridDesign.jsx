export default function OEMHybridDesign() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">OEM Hybrid Component and Subsystem Architecture</h2>
            <p className="text-lg text-gray-200 mb-4">
              Engineered hybrid components and modular hardware subsystems designed to integrate current balancing, power conditioning, and control functions into complex electrical systems and OEM applications.
            </p>
            <p className="text-lg text-gray-200">
              Designed for system-wide integration, enabling coordinated electrical performance beyond circuit-specific devices.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Hybrid Power Modules</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced hybrid power modules that combine multiple technologies including ECBS control, power filtering, and sensor integration in compact, production-ready packages for OEM integration.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Custom Component Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Tailored component designs that seamlessly integrate with existing OEM products, providing enhanced power quality capabilities while maintaining compatibility with current system architectures.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Modular Design Architecture</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible modular design approach that allows OEMs to select and combine specific components based on their application requirements, enabling scalable and customizable power quality solutions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Production-Ready Solutions</h3>
            <p className="text-sm mt-2 text-gray-300">Fully tested and validated hardware modules that meet industrial standards and are ready for immediate production integration, reducing development time and ensuring reliable performance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">White-Label Options</h3>
            <p className="text-sm mt-2 text-gray-300">Complete white-label solutions that allow OEMs to brand and market power quality components under their own name while leveraging Synerex's advanced technology and manufacturing capabilities.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Technical Support & Documentation</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive technical documentation, integration guides, and ongoing support services to ensure successful implementation and long-term reliability of hybrid component solutions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

