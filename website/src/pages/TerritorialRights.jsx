export default function TerritorialRights() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Territorial and Market Scope Licensing</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured licensing provisions defining authorized geographic and market scope for the use of SYNEREX trademarks, technologies, and licensed assets, supporting regional, multi-regional, or global deployment based on defined business objectives.
            </p>
            <p className="text-lg text-gray-200">
              A scalable territorial framework designed to support coordinated platform-level deployment across markets.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Regional Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Territorial licensing agreements for specific geographic regions, allowing licensees to use Synerex trademarks within defined boundaries while maintaining market exclusivity.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Global Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Worldwide licensing agreements that provide comprehensive territorial rights for global use of Synerex trademarks across all markets and jurisdictions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Market-Specific Rights</h3>
            <p className="text-sm mt-2 text-gray-300">Tailored territorial rights for specific markets, industries, or customer segments, allowing for focused licensing strategies and targeted brand expansion.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Exclusive Territories</h3>
            <p className="text-sm mt-2 text-gray-300">Exclusive territorial licensing agreements that grant sole rights to use Synerex trademarks within specific geographic areas or market segments.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Non-Exclusive Territories</h3>
            <p className="text-sm mt-2 text-gray-300">Non-exclusive territorial rights that allow multiple licensees to use Synerex trademarks within the same geographic areas, fostering competition and market growth.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Territory Expansion</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible agreements that allow for territory expansion and modification based on business growth, market opportunities, and licensee performance.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

