import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function ApplicationSpecific() {
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
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
        </div>
      </section>
      <LicenseSeal />
      <Hero 
        title="Application-Specific" 
        subtitle="Specialized patents covering ECBS applications in specific industries, including manufacturing, data centers, healthcare facilities, and renewable energy systems, with tailored solutions for unique power quality challenges." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Manufacturing Facilities</h3>
            <p className="text-sm mt-2 text-gray-300">Specialized ECBS solutions for manufacturing environments, addressing unique power quality challenges including motor starting currents, variable frequency drives, and production line power requirements with tailored current balancing strategies.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Data Centers</h3>
            <p className="text-sm mt-2 text-gray-300">High-reliability ECBS implementations for data centers, focusing on critical power quality requirements, UPS integration, server farm power distribution, and redundancy systems to ensure continuous operation and data protection.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Healthcare Facilities</h3>
            <p className="text-sm mt-2 text-gray-300">Medical-grade ECBS solutions for hospitals and healthcare facilities, addressing sensitive medical equipment requirements, life safety systems, and critical power quality standards essential for patient care and safety.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Renewable Energy Systems</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced ECBS integration with renewable energy systems, including solar farms, wind installations, and energy storage systems, optimizing power quality and grid integration for sustainable energy applications.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Commercial Buildings</h3>
            <p className="text-sm mt-2 text-gray-300">Tailored ECBS solutions for commercial buildings, addressing HVAC systems, lighting loads, elevator operations, and office equipment power requirements while optimizing energy efficiency and reducing operational costs.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Industrial Complexes</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive ECBS deployment for large industrial complexes, managing complex power distribution networks, heavy machinery loads, and multiple facility integration with centralized monitoring and control systems.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Educational Institutions</h3>
            <p className="text-sm mt-2 text-gray-300">Specialized ECBS solutions for schools and universities, addressing laboratory equipment, computer systems, research facilities, and campus-wide power quality requirements with educational institution-specific considerations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Retail & Hospitality</h3>
            <p className="text-sm mt-2 text-gray-300">Customized ECBS implementations for retail stores, restaurants, hotels, and hospitality venues, focusing on customer comfort, equipment reliability, and energy cost optimization in customer-facing environments.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Application-Specific Patent Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Manufacturing facility power quality solutions</li>
            <li>• Data center critical power systems</li>
            <li>• Healthcare facility medical-grade implementations</li>
            <li>• Renewable energy system integration</li>
            <li>• Commercial building optimization systems</li>
            <li>• Industrial complex management solutions</li>
            <li>• Educational institution specialized applications</li>
            <li>• Retail and hospitality custom implementations</li>
            <li>• Additional application-specific patents are pending and in development</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list represents our application-specific patent portfolio. For complete patent information and licensing opportunities, please contact our legal team.</p>
        </div>
      </section>
    </div>
  );
}

