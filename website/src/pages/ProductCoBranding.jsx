export default function ProductCoBranding() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Product Co-Branding and Authorized Brand Integration</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured co-branding programs enabling approved partners to reference SYNEREX trademarks and technology identifiers on qualified products and solutions, under defined brand-use, quality-control, and approval guidelines.
            </p>
            <p className="text-lg text-gray-200">
              A platform-level co-branding framework designed to support consistent representation across integrated, network-level technology offerings.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Joint Branding Programs</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative branding programs that combine Synerex trademarks with licensee brands to create powerful co-branded products and services in the power quality market.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Integration Guidelines</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive guidelines for integrating Synerex trademarks with licensee brands, ensuring consistent visual presentation and maintaining brand equity for both parties.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Co-Branded Product Development</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative product development processes that leverage both Synerex technology and licensee expertise to create innovative co-branded solutions for the market.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Marketing Collaboration</h3>
            <p className="text-sm mt-2 text-gray-300">Joint marketing initiatives and promotional campaigns that showcase co-branded products while maintaining consistent messaging and brand positioning across all channels.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Quality Assurance Standards</h3>
            <p className="text-sm mt-2 text-gray-300">Rigorous quality standards and approval processes to ensure that all co-branded products meet Synerex quality expectations and maintain brand reputation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Protection Measures</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive brand protection measures to safeguard both Synerex and licensee brand assets while enabling successful co-branding partnerships.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

