import LicenseSeal from "../components/LicenseSeal.jsx";

export default function CoreECBSPatents() {
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
          <h1 className="text-4xl font-bold mb-4 drop-shadow-2xl" style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>ECBS Patented Technology</h1>
        </div>
      </section>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Current Balancing Algorithms</h3>
            <p className="text-sm mt-2 text-gray-300">Core patent-protected algorithms that enable real-time current balancing across all three phases of electrical networks, ensuring optimal power distribution and eliminating phase imbalances that cause equipment damage and energy waste.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Control Methodologies</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced control system patents covering intelligent scheduling, adaptive algorithms, and real-time decision-making processes that optimize ECBS performance across varying network conditions and load requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">System Architectures</h3>
            <p className="text-sm mt-2 text-gray-300">Patented system architectures that define the fundamental structure and integration methods for ECBS technology, including modular designs, scalability frameworks, and network-wide deployment strategies.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Three-Phase Network Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Specialized patents covering the integration of ECBS technology with three-phase electrical networks, including connection methods, safety protocols, and compatibility with existing electrical infrastructure.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Quality Optimization</h3>
            <p className="text-sm mt-2 text-gray-300">Core patents covering power quality improvement methods, including harmonic reduction, voltage stabilization, and power factor correction techniques that enhance overall electrical system performance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-Time Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Patented monitoring and measurement technologies that provide continuous real-time assessment of electrical network conditions, enabling proactive management and optimization of ECBS performance.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Adaptive Control Systems</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent control system patents that enable ECBS technology to automatically adapt to changing network conditions, load variations, and power quality requirements without manual intervention.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Network-Wide Deployment</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive patents covering the deployment of ECBS technology across entire electrical networks, including coordination methods, communication protocols, and system-wide optimization strategies.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Core ECBS Patent Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <a href="https://patents.google.com/patent/US12375324B2" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">US 12375324B2 — Advanced ECBS Technology</a></li>
            <li>• Additional core ECBS patents are pending and in development</li>
            <li>• International patent applications covering core technology</li>
            <li>• Continuation-in-part (CIP) applications expanding core patent coverage</li>
            <li>• Trade secrets for core algorithms and control methodologies</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list represents our core ECBS patent portfolio. For complete patent information and licensing opportunities, please contact our legal team.</p>
        </div>
      </section>
    </div>
  );
}

