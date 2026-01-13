import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function HardwareImplementation() {
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
        title="Hardware Implementation" 
        subtitle="Patents covering hardware implementations, power electronics designs, sensor technologies, and component architectures that enable efficient and reliable ECBS operation in industrial and commercial environments." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Electronics Designs</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced power electronics architectures that enable efficient current balancing operations, including high-frequency switching circuits, power conversion systems, and energy management components optimized for ECBS applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Sensor Technologies</h3>
            <p className="text-sm mt-2 text-gray-300">Precision sensor systems for real-time monitoring of electrical parameters, including current sensors, voltage monitors, power quality analyzers, and environmental sensors that provide accurate data for ECBS control algorithms.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Component Architectures</h3>
            <p className="text-sm mt-2 text-gray-300">Modular component designs that enable scalable ECBS implementation, including standardized interfaces, plug-and-play modules, and flexible configuration options for various industrial and commercial applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Industrial Environments</h3>
            <p className="text-sm mt-2 text-gray-300">Hardware designs specifically optimized for harsh industrial environments, including rugged enclosures, temperature-resistant components, vibration protection, and electromagnetic interference shielding for reliable operation.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Commercial Applications</h3>
            <p className="text-sm mt-2 text-gray-300">Compact and efficient hardware implementations designed for commercial buildings, data centers, and retail facilities, focusing on space efficiency, energy conservation, and seamless integration with existing infrastructure.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Thermal Management</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced thermal management systems that ensure optimal operating temperatures for ECBS hardware, including heat sinks, cooling fans, thermal monitoring, and adaptive cooling control for maximum reliability and efficiency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Communication Interfaces</h3>
            <p className="text-sm mt-2 text-gray-300">Hardware communication interfaces that enable seamless integration with existing electrical systems, including Ethernet ports, wireless modules, serial interfaces, and protocol converters for comprehensive system connectivity.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Safety & Protection</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive safety and protection systems including circuit breakers, surge protectors, ground fault detection, arc fault protection, and emergency shutdown mechanisms to ensure safe ECBS operation in all environments.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Hardware Implementation Patent Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Power electronics and conversion system designs</li>
            <li>• Advanced sensor and monitoring technologies</li>
            <li>• Modular component and interface architectures</li>
            <li>• Industrial and commercial environment optimizations</li>
            <li>• Thermal management and cooling systems</li>
            <li>• Communication and connectivity interfaces</li>
            <li>• Safety and protection mechanisms</li>
            <li>• Additional hardware implementation patents are pending and in development</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list represents our hardware implementation patent portfolio. For complete patent information and licensing opportunities, please contact our legal team.</p>
        </div>
      </section>
    </div>
  );
}

