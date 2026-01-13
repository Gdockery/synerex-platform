import { useState } from "react";
import NDAModal from "../components/NDAModal.jsx";
import DocCard from "../components/DocCard.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";
export default function OEM(){
  const [ndaOpen, setNdaOpen] = useState(false);
  return (<div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
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
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/images/Synerex_OEM_Manufacturing.jpeg)',
            zIndex: 0
          }}
        />
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in relative" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl" style={{ fontSize: '1.92rem', textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>Licensed OEM/ODM Manufacturing & Integration of ECBS Patented Technologies.</h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong>SYNEREX</strong> (<strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution), through its OEM/ODM licensing programs, enables qualified manufacturers and technology partners to integrate the ECBS (Electrical Current Balancing System) patented architecture into their own branded products and solutions.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              OEM and ODM partners may license ECBS technology for incorporation into existing product lines or for the development of new, application-specific offerings. SYNEREX works directly with partners to ensure that ECBS-based implementations align with performance objectives, regulatory expectations, and utility-grade verification requirements, while maintaining consistency with the underlying patented architecture.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              In addition to licensing existing ECBS platforms, SYNEREX provides custom engineering and design services to support specialized form factors, voltage classes, deployment environments, and integration constraints. These services allow ECBS technology to be adapted for seamless incorporation into a partner's current manufacturing processes, enclosures, control systems, and product ecosystems.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              OEM/ODM engagements may include access to patented designs, reference architectures, firmware and analytics interfaces, engineering documentation, and validation methodologies. All programs are structured to preserve intellectual property integrity while enabling scalable manufacturing, repeatable performance, and defensible deployment outcomes across commercial and industrial power systems.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
    <section className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <ol className="list-decimal pl-6 text-sm space-y-1 text-gray-300"><li>Scope & Brand</li><li>Compliance & Supply</li><li>Pilots & Acceptance</li><li>Production & Support</li></ol>
      <div className="flex gap-3">
        <a href="mailto:engineering@synerex.com?subject=Custom Engineering Inquiry&body=Hello, I'm interested in custom engineering services for ECBS technology. Please provide more information about your custom engineering capabilities." className="px-4 py-1.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Need custom engineering?</a>
        <button onClick={()=>setNdaOpen(true)} className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-400 text-white">Request NDA</button>
      </div>
      <DocCard title="OEM Program Overview" href="/docs/OEM_Program_Overview.pdf" />
    </section>
    <NDAModal open={ndaOpen} onClose={()=>setNdaOpen(false)}/>
  </div>);
}
