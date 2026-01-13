import LicenseSeal from "../components/LicenseSeal.jsx";

export default function StrategicPartnerships() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Strategic Partnerships and Joint Development Programs</h2>
            <p className="text-lg text-gray-200 mb-4">
              Collaborative partnership frameworks supporting joint development, integration, and deployment of SYNEREX patented technologies in combination with partner expertise to address defined market needs and application requirements.
            </p>
            <p className="text-lg text-gray-200">
              A platform-level collaboration model designed to enable coordinated, network-level solutions across diverse markets.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Joint Development Programs</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative development initiatives that combine Synerex's patented ECBS technology with partner expertise to create innovative solutions and accelerate time-to-market for new products.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Technology Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Strategic partnerships focused on integrating Synerex technology into existing product lines and systems, creating enhanced solutions that leverage both companies' strengths.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Market Expansion</h3>
            <p className="text-sm mt-2 text-gray-300">Partnership opportunities that enable market expansion into new geographic regions, industry verticals, and customer segments through combined resources and expertise.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Innovation Collaboration</h3>
            <p className="text-sm mt-2 text-gray-300">Collaborative innovation programs that bring together Synerex's research capabilities with partner organizations to develop next-generation power quality solutions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Resource Sharing</h3>
            <p className="text-sm mt-2 text-gray-300">Strategic partnerships that enable sharing of resources, expertise, and infrastructure to accelerate development and reduce costs for both parties.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Long-term Relationships</h3>
            <p className="text-sm mt-2 text-gray-300">Building long-term strategic relationships that create mutual value through sustained collaboration, shared success, and continuous innovation in power quality technology.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

