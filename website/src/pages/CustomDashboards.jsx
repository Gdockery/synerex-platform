import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function CustomDashboards() {
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
        title="Custom Dashboards" 
        subtitle="Configurable rules, alerts, and visual dashboards tailored to your specific power quality requirements and KPIs." 
      />
      <LicenseSeal />
      
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Custom Alerts</h3>
            <p className="text-sm text-gray-300">Configurable alert rules with multiple notification channels including email, SMS, and webhook integrations.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Role-Based Views</h3>
            <p className="text-sm text-gray-300">Customized dashboard views for different user roles including operators, engineers, and management.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">KPI Tracking</h3>
            <p className="text-sm text-gray-300">Key performance indicators and metrics tracking with customizable thresholds and trend analysis.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Historical Analysis</h3>
            <p className="text-sm text-gray-300">Historical data visualization with time-series charts and comparative analysis tools.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Mobile Responsive</h3>
            <p className="text-sm text-gray-300">Fully responsive dashboards that work seamlessly across desktop, tablet, and mobile devices.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Export & Sharing</h3>
            <p className="text-sm text-gray-300">Export dashboard data and share custom views with team members and stakeholders.</p>
          </div>
        </div>
        
        <div className="mt-12 p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Dashboard Customization Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Visual Components</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Interactive charts and graphs</li>
                <li>• Real-time gauges and meters</li>
                <li>• Data tables and grids</li>
                <li>• Status indicators and badges</li>
                <li>• Geographic maps and network topology</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Configuration Options</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Custom color schemes and themes</li>
                <li>• Flexible layout arrangements</li>
                <li>• Configurable refresh intervals</li>
                <li>• User permission controls</li>
                <li>• Multi-language support</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="font-bold text-purple-400 mb-3">Dashboard Templates</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Operations Dashboard</h4>
              <p className="text-sm text-gray-400">Real-time monitoring of power quality parameters, system status, and operational alerts.</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Management Dashboard</h4>
              <p className="text-sm text-gray-400">High-level KPIs, cost analysis, and performance metrics for executive reporting.</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Engineering Dashboard</h4>
              <p className="text-sm text-gray-400">Detailed technical analysis, harmonic content, and equipment performance data.</p>
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

