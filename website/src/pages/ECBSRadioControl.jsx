export default function ECBSRadioControl() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">ECBS Network Control and Coordination Hardware</h2>
            <p className="text-lg text-gray-200 mb-4">
              Advanced control and coordination devices engineered to manage electrical current balancing and power quality functions across three-phase electrical networks, supporting synchronized, system-level operation.
            </p>
            <p className="text-lg text-gray-200">
              A network-level control architecture designed to coordinate electrical correction across the distribution system rather than at individual circuits.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Wireless Control Systems</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced radio frequency control systems that enable remote monitoring and adjustment of ECBS devices across large industrial facilities without physical wiring constraints.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Intelligent Scheduling</h3>
            <p className="text-sm mt-2 text-gray-300">Smart scheduling algorithms that automatically optimize power balancing operations based on real-time load conditions, energy demand patterns, and system performance metrics.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Multi-Device Coordination</h3>
            <p className="text-sm mt-2 text-gray-300">Centralized control platform that coordinates multiple ECBS devices across different phases and locations to ensure optimal network-wide current balancing performance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-Time Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Continuous monitoring capabilities that provide instant feedback on system performance, power quality metrics, and device status through wireless communication networks.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Fault Detection & Response</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced diagnostic systems that automatically detect power quality issues, equipment malfunctions, and network imbalances, with immediate response protocols to maintain system stability.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Scalable Architecture</h3>
            <p className="text-sm mt-2 text-gray-300">Modular design that supports expansion from single-device installations to large-scale industrial networks with hundreds of coordinated ECBS control units.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

