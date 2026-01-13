import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function ComplianceStandards() {
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
        </div>
      </section>
      <LicenseSeal />
      <Hero 
        title="Compliance & Standards" 
        subtitle="Helps facilities meet and exceed electrical power quality standards and regulations, ensuring compliance with industry requirements and avoiding potential penalties or operational restrictions." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">IEEE Standards Compliance</h3>
            <p className="text-sm mt-2 text-gray-300">Meets and exceeds IEEE 519, IEEE 1547, and other critical power quality standards, ensuring your facility operates within acceptable harmonic distortion limits and power quality parameters.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">IEC Standards Adherence</h3>
            <p className="text-sm mt-2 text-gray-300">Complies with IEC 61000 series standards for electromagnetic compatibility and power quality, ensuring international compliance and global market acceptance of your electrical systems.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">NERC Reliability Standards</h3>
            <p className="text-sm mt-2 text-gray-300">Supports compliance with North American Electric Reliability Corporation (NERC) standards, ensuring your facility meets critical infrastructure protection and reliability requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Utility Interconnection Standards</h3>
            <p className="text-sm mt-2 text-gray-300">Facilitates compliance with utility interconnection requirements, ensuring seamless integration with grid systems while maintaining power quality standards and avoiding interconnection penalties.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Environmental Regulations</h3>
            <p className="text-sm mt-2 text-gray-300">Helps meet environmental compliance requirements by reducing energy consumption and improving efficiency, supporting sustainability goals and regulatory environmental standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Industry-Specific Standards</h3>
            <p className="text-sm mt-2 text-gray-300">Supports compliance with industry-specific standards such as NFPA 70 (NEC), ASHRAE guidelines, and sector-specific electrical codes, ensuring comprehensive regulatory adherence.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Continuous Monitoring & Reporting</h3>
            <p className="text-sm mt-2 text-gray-300">Provides continuous monitoring and automated reporting capabilities to demonstrate ongoing compliance, supporting audit requirements and regulatory documentation needs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Future-Proof Compliance</h3>
            <p className="text-sm mt-2 text-gray-300">Designed to adapt to evolving regulatory requirements, ensuring long-term compliance as standards are updated and new regulations are implemented across the electrical industry.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

