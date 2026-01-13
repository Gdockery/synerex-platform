export default function TrademarkLicensing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-purple-300 mb-4">Trademark and Brand Asset Licensing Programs</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured licensing opportunities for authorized use of SYNEREX trademarks, trade names, and brand assets in connection with approved products, services, and technology offerings under defined usage and quality-control guidelines.
            </p>
            <p className="text-lg text-gray-200">
              A platform-level brand licensing framework designed to support consistent representation across integrated, network-level solutions.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/brand-asset-licensing" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Brand Asset Licensing</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Licensing of Synerex brand assets including logos, trademarks, and visual identity elements for authorized use in licensed products and marketing materials.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/product-co-branding" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Product Co-Branding</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Collaborative branding opportunities that allow licensees to co-brand products with Synerex trademarks while maintaining brand integrity and quality standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/quality-control-standards" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Quality Control Standards</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Comprehensive quality control and brand protection measures to ensure that all licensed use of Synerex trademarks meets established standards and maintains brand reputation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/marketing-authorization" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Marketing Authorization</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Authorized use of Synerex trademarks in marketing materials, advertising campaigns, and promotional activities with approved messaging and visual guidelines.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/territorial-rights" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Territorial Rights</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Flexible territorial licensing agreements that allow for regional or global use of Synerex trademarks based on market needs and business objectives.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/brand-protection" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Brand Protection</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Active brand protection and enforcement measures to prevent unauthorized use of Synerex trademarks and maintain the integrity of the brand in the marketplace.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

