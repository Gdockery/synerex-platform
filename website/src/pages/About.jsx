import LicenseSeal from "../components/LicenseSeal.jsx";

export default function About() {
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
          <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl" style={{ fontSize: '1.92rem', textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>A Unified Hardware and Software Solution for Electrical Network Optimization</h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution (<strong>SYNEREX</strong>) laboratories, LLC is focused on recruiting and working with advanced engineering professionals specializing in the advancement of power quality technology platforms,  focused on solving infrastructure-level electrical inefficiencies in three-phase power networks. The company combines patented hardware execution with analytical software to deliver measurable, verifiable electrical performance improvements across large commercial and industrial facilities.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Powered by the ECBS (Electrical Current Balancing System) patented technology, SYNEREX addresses demand inefficiencies, energy loss, equipment stress, and reliability risks that traditional point-solution devices fail to resolve. Its research-driven approach enables defensible performance claims supported by utility-grade data.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              SYNEREX is positioned for scalable growth through hardware deployment, software subscriptions, OEM licensing, and strategic partnerships in the global power quality and energy optimization market.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-6">
              Synerex Laboratories, LLC is dedicated to revolutionizing power quality through innovative 
              Electrical Current Balancing System (ECBS™) technology. We develop, manufacture, and license 
              advanced solutions that improve electrical network stability and efficiency.
            </p>
            <p className="text-gray-300 mb-6">
              Our mission extends to forging strategic partnerships with global power quality companies to 
              accelerate the transformation of the market toward advanced, network-wide solutions for commercial 
              and industrial facilities worldwide. By aligning with manufacturers, utilities, and engineering 
              leaders, we aim to deliver a scalable platform that tackles challenges in power factor correction, 
              harmonic distortion, energy efficiency, and electrical reliability—ultimately enabling the next 
              generation of intelligent power quality networks.
            </p>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Our Technology</h2>
            <p className="text-gray-300 mb-6">
              Our patented Electrical Current Balancing System (ECBS™) technology is designed to create a 
              reliable, network-wide platform for optimizing electrical systems across commercial and 
              industrial environments. By balancing current throughout entire facilities, the ECBS™ improves 
              power quality conditions—reducing harmonics, stabilizing voltage, correcting power factor, 
              and minimizing energy losses.
            </p>
            <p className="text-gray-300 mb-6">
              Built on advanced engineering platforms, the technology integrates precision hardware controls, 
              intelligent software analytics, and world-class manufacturing expertise. Importantly, ECBS™ can 
              also be deployed in combination with other manufacturers' products—including power filters, 
              VFDs, switchgear, and monitoring systems—to create seamless, comprehensive, and cost-effective 
              network-wide solutions.
            </p>
            <p className="text-gray-300">
              This flexibility ensures that our solutions not only enhance standalone performance but also 
              expand the capabilities of existing systems, empowering organizations to achieve greater 
              efficiency, reliability, and sustainability across their entire electrical infrastructure.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">What We Offer</h2>
            <ul className="text-gray-300 space-y-2">
              <li>• Patented ECBS technology licensing</li>
              <li>• Advanced Power Quality Analytics software</li>
              <li>• Synerex PQ Monitoring™ platforms</li>
              <li>• Full-scale manufacturing services</li>
              <li>• OEM/ODM partnership opportunities</li>
              <li>• Custom engineering solutions</li>
            </ul>
            <h2 className="text-2xl font-bold text-purple-400 mb-4 mt-8">Our Commitment</h2>
            <p className="text-gray-300 mb-6">
              We are committed to providing cutting-edge power quality solutions that help organizations 
              optimize their electrical systems, reduce energy waste, and improve overall operational 
              efficiency through advanced technology and expert support.
            </p>
            <p className="text-gray-300 mb-6">
              Beyond delivering innovation, our commitment extends to working hand-in-hand with global 
              companies to expand the scope of their products and applications. By embedding our patented 
              ECBS™ technology and analytics into partner platforms, we enable manufacturers and solution 
              providers to deliver next-generation offerings that reach new markets, address broader customer 
              challenges, and create measurable value across commercial, industrial, and utility sectors.
            </p>
            <p className="text-gray-300">
              Through these collaborations, we aim to foster a worldwide ecosystem of power quality 
              solutions that drive network-wide reliability, efficiency, and sustainability.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
