export default function BrandProtection() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Brand Protection and Enforcement Framework</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured brand protection measures governing the authorized use of SYNEREX trademarks, technologies, and brand assets, including monitoring, compliance oversight, and enforcement mechanisms designed to preserve brand integrity in the marketplace.
            </p>
            <p className="text-lg text-gray-200">
              A governance-level protection framework supporting consistent and compliant representation across licensed, platform-level deployments.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Trademark Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive monitoring and surveillance systems to detect unauthorized use of Synerex trademarks across all markets, channels, and platforms worldwide.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Infringement Detection</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced detection systems and legal expertise to identify trademark infringements, counterfeit products, and unauthorized brand usage in the marketplace.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Enforcement Actions</h3>
            <p className="text-sm mt-2 text-gray-300">Proactive enforcement measures including cease and desist notices, legal actions, and collaboration with law enforcement to protect Synerex brand assets.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Counterfeit Prevention</h3>
            <p className="text-sm mt-2 text-gray-300">Anti-counterfeiting measures and technologies to prevent the production and distribution of counterfeit Synerex products and protect brand reputation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Legal Compliance</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive legal compliance programs to ensure proper trademark registration, maintenance, and protection across all relevant jurisdictions and markets.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Integrity Management</h3>
            <p className="text-sm mt-2 text-gray-300">Ongoing brand integrity management to maintain the value, reputation, and distinctiveness of Synerex trademarks in the competitive marketplace.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

