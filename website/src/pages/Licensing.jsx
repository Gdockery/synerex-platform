import { useState } from "react";
import NDAModal from "../components/NDAModal.jsx";
import InquiryForm from "../components/InquiryForm.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";
export default function Licensing(){
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
            backgroundImage: 'url(/images/Synerex_Licensing.jpeg)',
            zIndex: 0
          }}
        />
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in relative" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <h1 className="text-5xl font-bold mb-4 drop-shadow-2xl" style={{ fontSize: '1.92rem', textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>OEM/ODM manufacturing and system integration under patented and licensed architectures.</h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong>SYNEREX</strong> (<strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution) licensing platform enables qualified partners to access patented systems, proprietary software, and validated engineering methodologies through structured licensing and OEM/ODM programs.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              Licensing offerings are built around the ECBS (Electrical Current Balancing System) patented technology and the SYNEREX analytical software platform. These programs are designed to support direct patent licensing, software licensing, private-label integration, and OEM/ODM manufacturing, while preserving technical integrity, performance consistency, and utility-grade verification standards.
            </p>
            <p className="text-lg text-gray-200 mb-6">
              SYNEREX licensing engagements may include access to patented architectures, firmware and analytics software, reference designs, engineering documentation, and custom development services. All licensing programs are structured to support scalable deployment, regulatory alignment, and defensible performance outcomes across commercial and industrial power systems.
            </p>
          </div>
        </div>
      </section>
      <LicenseSeal />
    <section className="max-w-7xl mx-auto px-4 py-10 space-y-6 fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><a href="/patent-technology-licensing" className="hover:text-purple-400"><h3 className="font-bold text-purple-300">Patented Technology Licensing</h3></a><p className="text-sm mt-2 text-gray-300">Implement ECBS with field-of-use flexibility.</p></div>
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><a href="/copyright-software-licensing" className="hover:text-purple-400"><h3 className="font-bold text-purple-300">Copyright Software Licensing</h3></a><p className="text-sm mt-2 text-gray-300">Advanced Power Quality Analytics and Synerex PQ Monitoring™.</p></div>
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><a href="/oem-odm-equipment-licensing" className="hover:text-purple-400"><h3 className="font-bold text-purple-300">OEM / ODM Equipment Licensing</h3></a><p className="text-sm mt-2 text-gray-300">White-label or co-develop. Manufacturing support included.</p></div>
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><a href="/custom-engineering-design-licensing" className="hover:text-purple-400"><h3 className="font-bold text-purple-300">Custom Engineering Design Licensing</h3></a><p className="text-sm mt-2 text-gray-300">Co-design hardware/software with SOW-driven milestones.</p></div>
        <div className="p-6 rounded-xl border border-gray-700 bg-gray-800"><a href="/trademark-licensing" className="hover:text-purple-400"><h3 className="font-bold text-purple-300">Trademark Licensing</h3></a><p className="text-sm mt-2 text-gray-300">Licensing of Synerex trademarks and brand assets for authorized use in products and services.</p></div>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>setNdaOpen(true)} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-400 text-white">Request NDA</button>
        <a className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800" href="/legal-resources">Legal Resources</a>
      </div>
      <div className="mt-6"><InquiryForm variant="licensing"/></div>
    </section>
    <NDAModal open={ndaOpen} onClose={()=>setNdaOpen(false)}/>
  </div>);
}
