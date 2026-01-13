import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function LicensingCommercialization() {
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
        title="Licensing & Commercialization" 
        subtitle="Strategic licensing opportunities for our patent portfolio, including field-of-use agreements, technology transfer programs, and collaborative development partnerships to bring ECBS innovations to market." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Field-of-Use Agreements</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible licensing agreements that allow licensees to use ECBS technology within specific industry sectors or applications, enabling targeted market entry while protecting intellectual property rights across different market segments.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Technology Transfer Programs</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive technology transfer initiatives that provide licensees with complete access to ECBS technology, including patents, know-how, technical documentation, and ongoing support for successful market implementation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Collaborative Development Partnerships</h3>
            <p className="text-sm mt-2 text-gray-300">Strategic partnerships that combine Synerex's patented ECBS technology with partner expertise, resources, and market access to accelerate innovation, product development, and market penetration in target industries.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Exclusive Licensing Opportunities</h3>
            <p className="text-sm mt-2 text-gray-300">Exclusive licensing arrangements for specific geographic regions, market segments, or applications, providing licensees with competitive advantages and market exclusivity for ECBS technology implementation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Non-Exclusive Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Non-exclusive licensing options that allow multiple licensees to access ECBS technology simultaneously, fostering market competition, innovation, and widespread adoption across various industries and applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Cross-Licensing Agreements</h3>
            <p className="text-sm mt-2 text-gray-300">Mutual licensing arrangements that enable technology exchange between Synerex and strategic partners, combining complementary technologies to create enhanced solutions and accelerate market development.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Joint Development Programs</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative research and development programs that combine Synerex's ECBS technology with partner capabilities to develop next-generation solutions, expand market applications, and create new intellectual property.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Market Development Support</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive support services for licensees including technical training, marketing assistance, regulatory guidance, and ongoing technical support to ensure successful commercialization and market adoption of ECBS technology.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Licensing & Commercialization Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Field-of-use licensing agreements</li>
            <li>• Technology transfer and know-how licensing</li>
            <li>• Collaborative development partnerships</li>
            <li>• Exclusive and non-exclusive licensing options</li>
            <li>• Cross-licensing and technology exchange programs</li>
            <li>• Joint development and research initiatives</li>
            <li>• Market development and commercialization support</li>
            <li>• Strategic partnership and alliance opportunities</li>
            <li>• Additional licensing opportunities are available</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list represents our licensing and commercialization portfolio. For complete licensing information and partnership opportunities, please contact our business development team.</p>
        </div>
      </section>
    </div>
  );
}

