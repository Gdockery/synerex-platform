export default function PatentEnforcement() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">ECBS Patent Protection and Enforcement Governance</h2>
            <p className="text-lg text-gray-200 mb-4">
              A formal governance framework supporting the protection of ECBS patented technologies through monitoring, compliance oversight, and enforcement mechanisms consistent with licensing agreements.
            </p>
            <p className="text-lg text-gray-200">
              Designed to maintain intellectual property integrity while providing confidence to authorized licensees.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800">
            <h3 className="font-bold text-purple-400">Infringement Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive monitoring and surveillance systems to detect potential patent infringements across all markets, ensuring proactive protection of Synerex intellectual property rights.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800">
            <h3 className="font-bold text-purple-400">Legal Enforcement Actions</h3>
            <p className="text-sm mt-2 text-gray-300">Aggressive legal enforcement actions including cease and desist notices, litigation, and court proceedings to protect patent rights and ensure compliance with licensing agreements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800">
            <h3 className="font-bold text-purple-400">Licensing Compliance</h3>
            <p className="text-sm mt-2 text-gray-300">Rigorous compliance monitoring to ensure all licensees adhere to licensing terms and conditions, maintaining the integrity of Synerex patent portfolio and licensing programs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800">
            <h3 className="font-bold text-purple-400">Licensee Security</h3>
            <p className="text-sm mt-2 text-gray-300">Strong enforcement program that provides security and confidence for licensees, ensuring their investment in Synerex technology is protected from unauthorized use and competition.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800">
            <h3 className="font-bold text-purple-400">Strategic Enforcement</h3>
            <p className="text-sm mt-2 text-gray-300">Strategic enforcement approach that balances protection of intellectual property rights with business objectives, ensuring optimal outcomes for both Synerex and its licensees.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

