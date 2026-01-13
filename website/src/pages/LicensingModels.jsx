export default function LicensingModels() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">ECBS Licensing Models and Commercial Structures</h2>
            <p className="text-lg text-gray-200 mb-4">
              Licensing agreements offering defined options and cross-licensing options, structured to address market scope, performance considerations, and intellectual property governance.
            </p>
            <p className="text-lg text-gray-200">
              Designed to support controlled, system-wide deployment while preserving IP protections.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Exclusive Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Exclusive licensing agreements that grant sole rights to use Synerex technology within specific fields of use, territories, or market segments, providing competitive advantages and market exclusivity.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Non-Exclusive Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Non-exclusive licensing agreements that allow multiple licensees to use Synerex technology simultaneously, fostering market competition and broader technology adoption across industries.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Cross-Licensing Agreements</h3>
            <p className="text-sm mt-2 text-gray-300">Mutual cross-licensing agreements that enable technology exchange between Synerex and licensees, creating collaborative innovation opportunities and shared intellectual property benefits.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Field-of-Use Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Specialized field-of-use licensing agreements that restrict technology use to specific applications, industries, or market segments, allowing for targeted market penetration and focused development.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Territorial Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Territorial licensing agreements that define geographic boundaries for technology use, enabling regional market development and localized business strategies.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Hybrid Licensing Models</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible hybrid licensing models that combine multiple licensing approaches to create customized agreements that meet specific business objectives and market requirements.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

