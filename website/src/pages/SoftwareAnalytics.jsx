import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function SoftwareAnalytics() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">      {/* Hero Section with Logo */}
      <section className="relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white">
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
        </div>
      </section>
      <LicenseSeal />
      <Hero 
        title="Software & Analytics" 
        subtitle="Intellectual property covering software algorithms, data analytics methods, predictive maintenance systems, and user interface technologies that enhance ECBS monitoring and management capabilities." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Software Algorithms</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced software algorithms that power ECBS operations, including current balancing calculations, optimization routines, control logic, and real-time processing algorithms that ensure optimal system performance and efficiency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Data Analytics Methods</h3>
            <p className="text-sm mt-2 text-gray-300">Sophisticated data analytics techniques that process electrical network data, identify patterns, detect anomalies, and provide actionable insights for power quality improvement and system optimization.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Predictive Maintenance Systems</h3>
            <p className="text-sm mt-2 text-gray-300">Intelligent predictive maintenance algorithms that analyze system performance data to predict potential failures, schedule maintenance activities, and optimize equipment lifespan through proactive intervention strategies.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">User Interface Technologies</h3>
            <p className="text-sm mt-2 text-gray-300">Intuitive user interface designs that provide operators with clear visualization of system status, performance metrics, and control options, enabling effective monitoring and management of ECBS operations.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Machine Learning Integration</h3>
            <p className="text-sm mt-2 text-gray-300">Advanced machine learning algorithms that continuously improve ECBS performance through pattern recognition, adaptive learning, and optimization based on historical data and real-time feedback.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Real-Time Processing</h3>
            <p className="text-sm mt-2 text-gray-300">High-performance real-time processing systems that handle continuous data streams, perform instant calculations, and execute control decisions with minimal latency for optimal ECBS responsiveness.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Cloud Analytics Platform</h3>
            <p className="text-sm mt-2 text-gray-300">Scalable cloud-based analytics platform that enables remote monitoring, data storage, advanced analytics, and system management across multiple ECBS installations with centralized control and reporting.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Reporting & Visualization</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive reporting and visualization tools that transform complex electrical data into clear, actionable reports, charts, and dashboards for stakeholders, maintenance teams, and management decision-making.</p>
          </div>
        </div>
        
        <div className="mt-12 p-6 border bg-gray-800">
          <h3 className="font-bold text-purple-400 mb-4">Software & Analytics Patent Portfolio</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Advanced software algorithms and processing methods</li>
            <li>• Data analytics and pattern recognition technologies</li>
            <li>• Predictive maintenance and optimization systems</li>
            <li>• User interface and visualization technologies</li>
            <li>• Machine learning and artificial intelligence integration</li>
            <li>• Real-time processing and control algorithms</li>
            <li>• Cloud-based analytics and management platforms</li>
            <li>• Reporting and data visualization systems</li>
            <li>• Additional software and analytics patents are pending and in development</li>
          </ul>
          <p className="text-xs mt-4 text-gray-400">This list represents our software and analytics patent portfolio. For complete patent information and licensing opportunities, please contact our legal team.</p>
        </div>
      </section>
    </div>
  );
}

