import DocCard from "../components/DocCard.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";
export default function CustomEngineering(){
  return (<div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
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
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/images/Synerex_Custom_PCB_Design.jpeg)',
            zIndex: 0
          }}
        />
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in relative" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <h2 className="text-3xl font-bold mb-4 text-white">Custom Engineering, Testing and Application-specific System Design.</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong>SYNEREX</strong> (<strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution) operates as a research and development laboratory specializing in advanced power quality technologies and infrastructure-level electrical optimization. Through its custom engineering and testing services, SYNEREX supports qualified partners, utilities, and facility owners in the development, adaptation, and validation of ECBS-based solutions for specific applications and operating environments.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Custom engineering engagements are driven by measured electrical behavior and system-level requirements. SYNEREX applies a research-first methodology that includes network assessment, design modeling, engineered configuration of ECBS hardware, and integration with existing electrical infrastructure. Solutions are developed to align with defined performance objectives, deployment constraints, and applicable utility or regulatory standards.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Testing and validation are performed using utility-grade instrumentation and statistically valid methodologies. SYNEREX supports baseline development, pre- and post-deployment analysis, and audit-ready documentation suitable for utility review, incentive qualification, and internal engineering validation. Where required, testing programs may be structured to support independent review or third-party verification.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Custom engineering and testing programs are structured to complement SYNEREX licensing, OEM/ODM manufacturing, and deployment activities—ensuring that engineered solutions remain aligned with patented architectures, performance expectations, and long-term system integrity.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
    <section className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><h3 className="font-bold text-gray-300">Hardware</h3><ul className="list-disc pl-5 text-sm space-y-1 text-gray-300"><li>Power electronics & control</li><li>Firmware & telemetry</li><li>Compliance pre-checks</li></ul></div>
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><h3 className="font-bold text-gray-300">Software</h3><ul className="list-disc pl-5 text-sm space-y-1 text-gray-300"><li>Power Analysis™ customization</li><li>Cloud PQ integrations & APIs</li><li>Dashboards & alerts</li></ul></div>
      </div>
      <div className="flex gap-3">
        <DocCard title="Engineering Brief" href="/docs/IP Engineering Brief.pdf" />
        <a href="/oem?topic=oem&source=custom_eng_cta&utm_source=site&utm_medium=cta&utm_campaign=custom_eng_to_oem" className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-400 text-white">Request a Design Review?</a>
      </div>
    </section>
  </div>);
}
