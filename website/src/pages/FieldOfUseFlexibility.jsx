export default function FieldOfUseFlexibility() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Defined Field-of-Use Licensing Programs</h2>
            <p className="text-lg text-gray-200 mb-4">
              Licensing agreements establishing clear field-of-use rights for ECBS technologies and SYNEREX platforms across designated industries and applications, subject to scope, performance, and compliance provisions.
            </p>
            <p className="text-lg text-gray-200">
              Designed to support controlled expansion while preserving intellectual property protections.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Industrial Applications</h3>
            <p className="text-sm mt-2 text-gray-300">Licensing agreements tailored for industrial applications including manufacturing facilities, processing plants, and heavy industrial operations with specialized power quality requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Commercial Applications</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible licensing for commercial applications including office buildings, retail centers, healthcare facilities, and data centers with varying power quality needs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Utility Applications</h3>
            <p className="text-sm mt-2 text-gray-300">Specialized licensing agreements for utility applications including power generation, transmission, distribution, and grid management systems.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Specialized Power Quality</h3>
            <p className="text-sm mt-2 text-gray-300">Custom licensing for specialized power quality applications including renewable energy systems, electric vehicle charging, and critical infrastructure protection.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Tailored Terms & Conditions</h3>
            <p className="text-sm mt-2 text-gray-300">Customized licensing terms and conditions that align with specific industry requirements, regulatory compliance, and business objectives for each field of use.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Multi-Industry Licensing</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive licensing agreements that allow implementation across multiple industries and applications, providing maximum flexibility and market reach for licensees.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

