import LicenseRegistration from "../components/LicenseRegistration.jsx";

export default function CopyrightSoftwareLicensing() {
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
            <h2 className="text-2xl md:text-3xl font-bold text-purple-300 mb-4">Copyrighted Software Licensing Programs</h2>
            <p className="text-lg text-gray-200 mb-4">
              Structured licensing opportunities for SYNEREX proprietary software platforms supporting advanced power quality analytics, monitoring, and network-level visibility. The software is designed to align with applicable industry standards and accepted engineering practices used in utility, commercial, and industrial power quality analysis.
            </p>
            <p className="text-lg text-gray-200">
              A system-wide software architecture supporting coordinated measurement, verification, and analysis across electrical networks rather than isolated circuit monitoring.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Advanced Power Quality Analytics</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive power quality analytics software with real-time monitoring, trend detection, custom dashboards, and advanced reporting capabilities for industrial and commercial power quality management.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Synerex PQ Monitoring™</h3>
            <p className="text-sm mt-2 text-gray-300">Enterprise-scale monitoring platform with cloud infrastructure, multi-tenant architecture, SSO/RBAC integration, and comprehensive fleet management for large-scale power quality monitoring deployments.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Software Licensing Models</h3>
            <p className="text-sm mt-2 text-gray-300">Flexible licensing options including perpetual licenses, subscription-based models, and usage-based pricing designed to meet different organizational needs and budget requirements.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Deployment Options</h3>
            <p className="text-sm mt-2 text-gray-300">Multiple deployment options including on-premise installations, cloud-based solutions, and hybrid deployments with full technical support and implementation guidance for each deployment model.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">API & Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive API frameworks and integration tools that enable seamless connectivity with existing SCADA, BMS, and enterprise systems for unified data management and analysis.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Support & Maintenance</h3>
            <p className="text-sm mt-2 text-gray-300">Ongoing technical support, software updates, maintenance services, and training programs to ensure optimal performance and continued value from licensed software solutions.</p>
          </div>
        </div>
        <div className="md:col-span-2 mt-6">
          <LicenseRegistration program="emv" plan="annual" />
        </div>
      </section>
    </div>
  );
}

