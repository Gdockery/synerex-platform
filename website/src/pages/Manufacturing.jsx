import LicenseSeal from "../components/LicenseSeal.jsx";

export default function Manufacturing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Production-Ready Manufacturing and Integration</h2>
            <p className="text-lg text-gray-200 mb-4">
              Manufacturing-ready designs and hybrid hardware architectures developed to support large-scale production, system integration, and deployment across commercial and industrial power systems.
            </p>
            <p className="text-lg text-gray-200">
              Designed for network-wide system execution, not isolated device manufacturing.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Production-Ready Designs</h3>
            <p className="text-sm mt-2 text-gray-300">Complete manufacturing solutions with tested designs, quality control processes, and scalable production capabilities for ECBS hardware and power electronics.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Compliance & Certification</h3>
            <p className="text-sm mt-2 text-gray-300">Full regulatory compliance support including UL, ETL, TUV, CE, FCC, and other industry certifications to ensure your products meet all safety and performance standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">OEM/ODM Partnerships</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative manufacturing partnerships with white-label options, custom branding, and co-development opportunities for power quality solutions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Supply Chain Management</h3>
            <p className="text-sm mt-2 text-gray-300">End-to-end supply chain solutions including component sourcing, inventory management, and logistics support for reliable product delivery.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Quality Assurance</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive testing protocols, quality control systems, and performance validation to ensure consistent product reliability and customer satisfaction.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Scalable Production</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible manufacturing capabilities that can scale from prototype quantities to high-volume production runs based on your business requirements.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

