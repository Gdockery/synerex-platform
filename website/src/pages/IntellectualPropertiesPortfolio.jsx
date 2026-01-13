import LicenseSeal from "../components/LicenseSeal.jsx";

export default function IntellectualPropertiesPortfolio() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">ECBS Intellectual Property Portfolio</h2>
            <p className="text-lg text-gray-200 mb-4">
              A portfolio of issued patents, pending applications, and proprietary technologies protecting ECBS architectures, methods, and system-level electrical optimization techniques.
            </p>
            <p className="text-lg text-gray-200">
              Structured to support network-wide deployment, licensing, and long-term technology protection.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/core-ecbs-patents" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Core ECBS Patents</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Fundamental patents covering the core Electrical Current Balancing System technology, including current balancing algorithms, control methodologies, and system architectures for three-phase electrical networks.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/control-systems" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Control Systems</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Advanced control system patents covering intelligent scheduling, real-time monitoring, wireless communication protocols, and adaptive algorithms for optimal ECBS performance across various network conditions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/hardware-implementation" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Hardware Implementation</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Patents covering hardware implementations, power electronics designs, sensor technologies, and component architectures that enable efficient and reliable ECBS operation in industrial and commercial environments.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/software-analytics" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Software & Analytics</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Intellectual property covering software algorithms, data analytics methods, predictive maintenance systems, and user interface technologies that enhance ECBS monitoring and management capabilities.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/application-specific" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Application-Specific</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Specialized patents covering ECBS applications in specific industries, including manufacturing, data centers, healthcare facilities, and renewable energy systems, with tailored solutions for unique power quality challenges.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/licensing-commercialization" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Licensing & Commercialization</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Strategic licensing opportunities for our patent portfolio, including field-of-use agreements, technology transfer programs, and collaborative development partnerships to bring ECBS innovations to market.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Intellectual Properties Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <a href="https://patents.google.com/patent/US12375324B2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">US 12375324B2 — Advanced ECBS Technology</a></li>
            <li>• Additional CIP patents are pending and additional CIP's in development</li>
            <li>• International patent applications in progress</li>
            <li>• Trade secrets for production and manufacturing processes maintain it's proprietary status and will not be shared with Licensees for its own manufactured products.</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list is provided for informational purposes and may not be exhaustive. For complete patent information, please contact our legal team.</p>
        </div>
        
        <div className="mt-8 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Portfolio Overview</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Patent Categories</h4>
              <ul className="space-y-1">
                <li>• Core ECBS Technology</li>
                <li>• Control Systems</li>
                <li>• Hardware Implementation</li>
                <li>• Software & Analytics</li>
                <li>• Application-Specific</li>
                <li>• Licensing & Commercialization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Patent Status</h4>
              <ul className="space-y-1">
                <li>• Issued Patents</li>
                <li>• Pending Applications</li>
                <li>• Continuation-in-Part (CIP)</li>
                <li>• International Applications</li>
                <li>• Trade Secrets</li>
                <li>• Proprietary Processes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Licensing Options</h4>
              <ul className="space-y-1">
                <li>• Field-of-Use Agreements</li>
                <li>• Technology Transfer</li>
                <li>• Collaborative Development</li>
                <li>• Exclusive Licensing</li>
                <li>• Non-Exclusive Licensing</li>
                <li>• Cross-Licensing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
