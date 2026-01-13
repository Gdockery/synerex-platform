export default function CustomEngineeringDesignLicensing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-purple-300 mb-4">Custom Engineering Design and Technology Licensing</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured collaboration programs enabling co-development of ECBS-based hardware and software solutions through defined scopes of work, milestone-driven execution, and clear intellectual property frameworks.
            </p>
            <p className="text-lg text-gray-200">
              A network-level design approach supporting system-wide electrical optimization rather than isolated, circuit-specific implementations.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Co-Design Partnerships</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative engineering partnerships where Synerex works closely with your team to co-design custom hardware and software solutions that integrate ECBS technology with your specific requirements and market needs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">SOW-Driven Milestones</h3>
            <p className="text-sm mt-2 text-gray-300">Structured Statement of Work (SOW) agreements with clearly defined milestones, deliverables, and timelines to ensure transparent project management and successful completion of custom engineering projects.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Hardware Customization</h3>
            <p className="text-sm mt-2 text-gray-300">Custom hardware design and development services that adapt ECBS technology to your specific form factors, power requirements, environmental conditions, and integration needs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Software Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Custom software development and integration services that seamlessly incorporate ECBS control algorithms and monitoring capabilities into your existing systems and platforms.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Prototype Development</h3>
            <p className="text-sm mt-2 text-gray-300">Rapid prototyping and iterative development processes that allow for quick validation of concepts, testing of functionality, and refinement of designs before full-scale production.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Technical Transfer</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive technical transfer programs that provide your team with the knowledge, documentation, and training necessary to maintain, support, and further develop the custom solutions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

