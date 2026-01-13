export default function MarketingAuthorization() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">SYNEREX Marketing Authorization and Brand Usage</h2>
            <p className="text-lg text-gray-200 mb-4">
              Marketing authorization programs governing the licensed use of SYNEREX trademarks and brand assets in external communications, including messaging standards, visual guidelines, and approval requirements.
            </p>
            <p className="text-lg text-gray-200">
              Designed to protect brand integrity while enabling aligned partner communications.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Marketing Material Approval</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive approval processes for marketing materials that use Synerex trademarks, ensuring consistent brand messaging and visual standards across all promotional content.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Advertising Campaign Authorization</h3>
            <p className="text-sm mt-2 text-gray-300">Authorization for advertising campaigns that feature Synerex trademarks, including digital, print, and broadcast media with approved messaging and brand guidelines.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Promotional Activities</h3>
            <p className="text-sm mt-2 text-gray-300">Approved use of Synerex trademarks in trade shows, conferences, webinars, and other promotional activities with consistent brand representation and messaging.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Digital Marketing Rights</h3>
            <p className="text-sm mt-2 text-gray-300">Authorized use of Synerex trademarks in digital marketing channels including websites, social media, email campaigns, and online advertising with brand compliance standards.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Content Guidelines</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive content guidelines and messaging standards to ensure that all marketing materials using Synerex trademarks maintain brand integrity and consistency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Brand Compliance Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Ongoing monitoring and compliance tracking to ensure that all authorized marketing activities using Synerex trademarks meet established standards and guidelines.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

