import Hero from "../components/Hero.jsx";

export default function SynerexPQMonitoring() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">      {/* Hero Section with Logo */}
      <section className="relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white">
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
        </div>
      </section>
      <Hero 
        title="Synerex PQ Monitoring™" 
        subtitle="Cloud and server-based power quality monitoring platform designed for enterprise-scale deployments with multi-tenant architecture and comprehensive fleet management capabilities." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Cloud-Based Monitoring</h3>
            <p className="text-sm mt-2 text-gray-300">Scalable cloud infrastructure that provides reliable power quality monitoring across multiple sites with automatic data backup, redundancy, and global accessibility for enterprise organizations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Multi-Tenant Architecture</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced multi-tenant platform that allows multiple organizations to securely share infrastructure while maintaining complete data isolation, custom branding, and independent configuration management.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">SSO & RBAC Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Enterprise-grade security with Single Sign-On (SSO) integration and Role-Based Access Control (RBAC) that ensures secure access management and compliance with corporate security policies.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Comprehensive Audit Logs</h3>
            <p className="text-sm mt-2 text-gray-300">Detailed audit logging system that tracks all user activities, system changes, and data access for compliance reporting, security monitoring, and operational transparency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Device & Site Fleet Management</h3>
            <p className="text-sm mt-2 text-gray-300">Centralized fleet management interface that provides real-time visibility into device status, site performance, and system health across hundreds of monitoring points and multiple locations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Enterprise Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Seamless integration with existing enterprise systems including SCADA, BMS, ERP, and business intelligence platforms through robust APIs and standardized data exchange protocols.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

