export default function TechnologyTransferSupport() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">ECBS Technology Transfer and Integration Support</h2>
            <p className="text-lg text-gray-200 mb-4">
              Technology transfer services supporting partner implementation of ECBS architectures, including reference documentation, system integration guidance, validation procedures, and technical enablement resources.
            </p>
            <p className="text-lg text-gray-200">
              Designed to support network-wide system integration rather than isolated component deployment.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Technical Documentation</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive technical documentation packages including design specifications, implementation guides, system architecture details, and operational procedures for successful technology deployment.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Implementation Guidance</h3>
            <p className="text-sm mt-2 text-gray-300">Expert implementation guidance and project management support to ensure smooth deployment of licensed ECBS technology with minimal disruption to existing operations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Training Programs</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive training programs for technical teams, operators, and maintenance personnel to ensure proper understanding and operation of licensed technology systems.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Ongoing Technical Support</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous technical support and maintenance services to ensure optimal performance, troubleshooting assistance, and system optimization for licensed technology implementations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">System Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Expert system integration services to seamlessly incorporate licensed ECBS technology into existing infrastructure and operational systems with minimal compatibility issues.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Performance Optimization</h3>
            <p className="text-sm mt-2 text-gray-300">Performance optimization services to maximize the efficiency and effectiveness of licensed technology implementations, ensuring optimal return on investment and operational benefits.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

