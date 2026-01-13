export default function PatentTechnologyLicensing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-purple-300 mb-4">Patented Technology Licensing Programs</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured licensing opportunities for the ECBS patented technology, supporting defined fields of use, OEM integration, and scalable deployment with technical and implementation support.
            </p>
            <p className="text-lg text-gray-200">
              A network-level technology licensing model designed to enable system-wide electrical optimization rather than circuit-specific solutions.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/intellectual-properties-portfolio" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">ECBS Patent Portfolio</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Comprehensive patent portfolio covering Electrical Current Balancing System (ECBS) technology, including core patents for current balancing algorithms, control systems, and implementation methods across various applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/field-of-use-flexibility" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Field-of-Use Flexibility</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Flexible licensing agreements that allow implementation across different industries and applications, including industrial, commercial, utility, and specialized power quality applications with tailored terms and conditions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/technology-transfer-support" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Technology Transfer Support</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Comprehensive technology transfer services including detailed technical documentation, implementation guidance, training programs, and ongoing technical support to ensure successful deployment of licensed technology.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/licensing-models" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Licensing Models</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Multiple licensing models including exclusive, non-exclusive, and cross-licensing agreements designed to meet different business needs, market requirements, and strategic objectives for technology implementation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/patent-enforcement" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Patent Enforcement</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Strong patent enforcement program that protects licensed technology and ensures compliance with licensing terms, providing security and confidence for licensees investing in ECBS technology implementation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/strategic-partnerships" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Strategic Partnerships</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Opportunities for strategic partnerships and joint development programs that combine Synerex's patented technology with licensee expertise to create innovative solutions and expand market reach.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

