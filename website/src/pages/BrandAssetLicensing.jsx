export default function BrandAssetLicensing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">SYNEREX Brand Asset Licensing</h2>
            <p className="text-lg text-gray-200 mb-4">
              Licensing programs governing the authorized use of SYNEREX logos, trademarks, and visual identity assets in accordance with established brand standards, quality controls, and intellectual property protections.
            </p>
            <p className="text-lg text-gray-200">
              Designed to ensure consistent and compliant brand representation.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Logo Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Authorized use of Synerex logos and visual identity elements in licensed products, packaging, and marketing materials with approved guidelines and quality standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Trademark Usage Rights</h3>
            <p className="text-sm mt-2 text-gray-300">Licensing of Synerex trademarks for use in product names, service offerings, and marketing communications with proper attribution and brand protection measures.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Visual Identity Elements</h3>
            <p className="text-sm mt-2 text-gray-300">Access to Synerex visual identity elements including color palettes, typography, design patterns, and brand graphics for consistent brand representation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Guidelines</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive brand guidelines and usage standards to ensure proper implementation of Synerex brand assets across all licensed applications and materials.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Quality Assurance</h3>
            <p className="text-sm mt-2 text-gray-300">Quality control processes and approval workflows to maintain brand integrity and ensure all licensed use of Synerex brand assets meets established standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Usage Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Ongoing monitoring and compliance tracking to ensure proper use of licensed brand assets and maintain brand consistency across all applications.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

