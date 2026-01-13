export default function Hardware() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`
        @keyframes gradientMove {
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
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/images/Synerex_Hardware_Patented_Technology.jpeg)',
            zIndex: 0
          }}
        />
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in relative" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl" style={{ fontSize: '1.92rem', textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>Patented Network-Wide Power Optimization Platform</h1>
          <h2 className="text-2xl font-bold mb-4 text-purple-300">U.S. Patented (#12,375,324 B2) ECBS Hardware Technology</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution (<strong>SYNEREX</strong>), as implemented through the ECBS (Electrical Current Balancing System) hardware platform, is a utility-grade, network-level power optimization system engineered to physically correct electrical inefficiencies across three-phase power networks.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Designed for large commercial, industrial, and mission-critical environments, ECBS hardware operates as an engineered layer within the electrical distribution system—executing data-driven corrections derived from measured network behavior. When deployed in conjunction with SYNEREX analytical software, the hardware enables closed-loop optimization with continuous validation, audit-ready performance reporting, and sustained power-quality improvements beyond the capability of conventional point-solution devices.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/ecbs-radio-control" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">ECBS Radio Control & Scheduling Devices</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Advanced control systems for electrical current balancing across three-phase networks.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/power-filtering-equipment" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Advanced 50/60Hz and Power Filtering Equipment</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">High-efficiency power conversion and conditioning components for industrial applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/software-controls-sensors" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">Advanced Software Controls & Sensors</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Precision current and voltage sensors for real-time power quality monitoring.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <a href="/oem-hybrid-design" className="hover:text-purple-400">
              <h3 className="font-bold text-purple-400">OEM Hybrid Component Design</h3>
            </a>
            <p className="text-sm mt-2 text-gray-300">Production-ready hardware modules for integration into larger power systems.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

