import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function ScalableImplementation() {
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
        title="Scalable Implementation" 
        subtitle="Network-wide deployment capability allows for comprehensive current balancing across entire facilities, from small installations to large industrial complexes, providing consistent benefits at any scale." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Small Scale Deployment</h3>
            <p className="text-sm mt-2 text-gray-300">Perfect for small facilities, single buildings, or specific equipment installations. ECBS technology can be implemented with minimal infrastructure changes while delivering immediate power quality improvements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Medium Scale Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Ideal for multi-building facilities, manufacturing plants, and commercial complexes. Seamless integration across multiple electrical circuits provides comprehensive current balancing throughout the facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Large Scale Network Deployment</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive implementation across entire industrial complexes, utility networks, and large-scale facilities. Network-wide deployment ensures consistent power quality benefits across all connected systems.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Modular Architecture</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible, modular design allows for incremental implementation and expansion. Start with critical areas and gradually expand coverage as needed, ensuring cost-effective deployment and minimal disruption.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Centralized Control</h3>
            <p className="text-sm mt-2 text-gray-300">Unified control system manages all ECBS units across the network, providing centralized monitoring, configuration, and optimization of power quality parameters throughout the entire facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Distributed Processing</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent distributed processing ensures optimal performance at each location while maintaining network-wide coordination. Each unit operates independently while contributing to overall system optimization.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Scalable Infrastructure</h3>
            <p className="text-sm mt-2 text-gray-300">Infrastructure design supports seamless scaling from single units to complex network deployments. Communication protocols and control systems adapt automatically to network size and complexity.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Future Expansion Ready</h3>
            <p className="text-sm mt-2 text-gray-300">Built-in expansion capabilities ensure the system can grow with your facility. Easy addition of new units and integration with existing infrastructure provides long-term scalability and investment protection.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

