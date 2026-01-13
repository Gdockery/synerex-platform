export default function QualityControlStandards() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Quality Control and Brand Protection Standards</h2>
            <p className="text-lg text-gray-200 mb-4">
              Standards and procedures governing the licensed use of SYNEREX trademarks and branded technologies, including quality requirements, usage controls, and ongoing compliance measures.
            </p>
            <p className="text-lg text-gray-200">
              Designed to preserve brand integrity and intellectual property protections.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Compliance Review</h3>
            <p className="text-sm mt-2 text-gray-300">Systematic review processes to ensure all licensed use of Synerex trademarks complies with established brand guidelines, visual standards, and usage requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Pre-Approval Workflows</h3>
            <p className="text-sm mt-2 text-gray-300">Mandatory pre-approval processes for all trademark usage to ensure quality standards are met before materials are published or products are launched.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Visual Standards Enforcement</h3>
            <p className="text-sm mt-2 text-gray-300">Strict enforcement of visual standards including logo usage, color specifications, typography, and spacing requirements to maintain brand consistency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Quality Assurance Testing</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive testing and validation procedures to ensure that all licensed products and materials meet Synerex quality standards and brand expectations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Protection Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous monitoring and surveillance to detect unauthorized use of Synerex trademarks and ensure proper brand protection across all markets.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Corrective Action Procedures</h3>
            <p className="text-sm mt-2 text-gray-300">Established procedures for addressing quality issues, brand violations, and non-compliance with licensing agreements to maintain brand integrity.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

