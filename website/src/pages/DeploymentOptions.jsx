import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function DeploymentOptions() {
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
        title="Deployment Options" 
        subtitle="On-premise or cloud-based solutions with flexible licensing models for organizations of all sizes." 
      />
      <LicenseSeal />
      
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">On-Premise Deployment</h3>
            <p className="text-sm text-gray-300">Complete control with local installation on your infrastructure, ensuring data sovereignty and compliance requirements.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Cloud-Based Solutions</h3>
            <p className="text-sm text-gray-300">Scalable cloud deployment with managed infrastructure, automatic updates, and global accessibility.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Hybrid Architecture</h3>
            <p className="text-sm text-gray-300">Flexible hybrid deployment combining on-premise data collection with cloud-based analytics and storage.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Edge Computing</h3>
            <p className="text-sm text-gray-300">Local processing at the edge for real-time analysis and reduced latency in critical applications.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Containerized Deployment</h3>
            <p className="text-sm text-gray-300">Docker and Kubernetes support for easy deployment, scaling, and management across different environments.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Virtual Machine Support</h3>
            <p className="text-sm text-gray-300">Full support for virtualized environments including VMware, Hyper-V, and cloud-based VMs.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">Multi-Tenant Architecture</h3>
            <p className="text-sm text-gray-300">Secure multi-tenant deployment for service providers and organizations managing multiple sites.</p>
          </div>
          
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-400 mb-3">High Availability</h3>
            <p className="text-sm text-gray-300">Redundant deployment options with failover capabilities and disaster recovery support.</p>
          </div>
        </div>
        
        <div className="mt-12 p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Deployment Models</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">On-Premise Benefits</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Complete data control and sovereignty</li>
                <li>• Custom security and compliance</li>
                <li>• No internet dependency</li>
                <li>• Predictable operational costs</li>
                <li>• Custom integration capabilities</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Cloud Benefits</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Rapid deployment and scaling</li>
                <li>• Automatic updates and maintenance</li>
                <li>• Global accessibility</li>
                <li>• Pay-as-you-scale pricing</li>
                <li>• Built-in disaster recovery</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="font-bold text-purple-400 mb-3">Licensing Models</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Perpetual License</h4>
              <p className="text-sm text-gray-400">One-time purchase with optional maintenance and support contracts for long-term deployments.</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Subscription Model</h4>
              <p className="text-sm text-gray-400">Flexible monthly or annual subscriptions with automatic updates and support included.</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Usage-Based Pricing</h4>
              <p className="text-sm text-gray-400">Pay-per-use or pay-per-device models for variable workloads and pilot projects.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="font-bold text-purple-400 mb-3">System Requirements</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Minimum Requirements</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• CPU: 4 cores, 2.4 GHz</li>
                <li>• RAM: 8 GB</li>
                <li>• Storage: 100 GB SSD</li>
                <li>• OS: Windows Server 2016+, Linux (Ubuntu 18.04+)</li>
                <li>• Network: 1 Gbps Ethernet</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Recommended Requirements</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• CPU: 8+ cores, 3.0 GHz</li>
                <li>• RAM: 16+ GB</li>
                <li>• Storage: 500+ GB NVMe SSD</li>
                <li>• OS: Latest Windows Server or Linux</li>
                <li>• Network: 10 Gbps Ethernet</li>
              </ul>
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

