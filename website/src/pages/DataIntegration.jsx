import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function DataIntegration() {
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
      <Hero 
        title="Data Integration" 
        subtitle="Comprehensive exports, APIs, and automated reports for seamless integration with existing enterprise systems." 
      />
      <LicenseSeal />
      
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">RESTful APIs</h3>
            <p className="text-sm text-gray-300">Comprehensive REST API for accessing power quality data, configuration management, and system control functions.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Database Connectivity</h3>
            <p className="text-sm text-gray-300">Direct integration with popular databases including SQL Server, Oracle, MySQL, and PostgreSQL for data storage and retrieval.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">SCADA Integration</h3>
            <p className="text-sm text-gray-300">Seamless integration with SCADA systems using standard protocols including Modbus, DNP3, and OPC UA.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Data Export</h3>
            <p className="text-sm text-gray-300">Flexible data export capabilities in multiple formats including CSV, Excel, JSON, and XML for analysis and reporting.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Webhook Support</h3>
            <p className="text-sm text-gray-300">Real-time event notifications via webhooks for alerts, alarms, and system status changes.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Enterprise Systems</h3>
            <p className="text-sm text-gray-300">Integration with enterprise resource planning (ERP) and asset management systems for comprehensive data flow.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Cloud Platforms</h3>
            <p className="text-sm text-gray-300">Native integration with cloud platforms including AWS, Azure, and Google Cloud for scalable data processing.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Automated Reports</h3>
            <p className="text-sm text-gray-300">Scheduled and event-driven report generation with customizable templates and delivery options.</p>
          </div>
        </div>
        
        <div className="mt-12 p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Integration Protocols & Standards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Communication Protocols</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Modbus TCP/RTU</li>
                <li>• DNP3 (Distributed Network Protocol)</li>
                <li>• OPC UA (Unified Architecture)</li>
                <li>• IEC 61850 (Substation Communication)</li>
                <li>• MQTT (Message Queuing Telemetry Transport)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Data Formats</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• JSON (JavaScript Object Notation)</li>
                <li>• XML (eXtensible Markup Language)</li>
                <li>• CSV (Comma-Separated Values)</li>
                <li>• Excel/OpenXML</li>
                <li>• Binary protocols for real-time data</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="font-bold text-purple-400 mb-3">Integration Use Cases</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Energy Management</h4>
              <p className="text-sm text-gray-400">Integration with energy management systems for load monitoring, demand response, and energy optimization.</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Asset Management</h4>
              <p className="text-sm text-gray-400">Connection to asset management platforms for equipment health monitoring and predictive maintenance.</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Business Intelligence</h4>
              <p className="text-sm text-gray-400">Data feeds to BI platforms for comprehensive analytics, reporting, and decision support systems.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/real-time-analytics" 
            className="inline-flex items-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-400 transition-colors"
          >
            Learn More About Power Analysis
          </a>
        </div>
      </section>
    </div>
  );
}

