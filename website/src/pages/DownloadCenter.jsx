import DocCard from "../components/DocCard.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";
export default function DownloadCenter(){
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
            backgroundImage: 'url(/images/Synerex_Documents.jpeg)',
            zIndex: 0
          }}
        />
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in relative" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-4 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <h1 className="text-3xl font-bold text-purple-300 mb-6">Download Center</h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-200 mb-6">
              <strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution (<strong>SYNEREX</strong>) Download Center provides authorized access to technical documentation, engineering resources, and validated materials supporting ECBS technology, SYNEREX software, and associated licensing and deployment programs. Content is curated to support utility review, OEM integration, and engineering evaluation.
            </p>
            <div className="text-lg text-gray-200 mb-6">
              <p className="mb-4">Downloadable resources may include:</p>
              <ul className="list-disc list-inside text-left space-y-2">
                <li>Technical overviews and engineering briefs</li>
                <li>ECBS system architecture and application notes</li>
                <li>Measurement and verification methodologies</li>
                <li>Sample reports and validation documentation</li>
                <li>Licensing, OEM, and program reference materials</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <LicenseSeal />
    <section className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
      <DocCard title="Engineering Brief" href="/docs/IP Engineering Brief.pdf" />
      <DocCard title="SOW Template" href="/docs/Synerex_SOW_Template_(Demo).pdf" />
      <DocCard title="ECBS Patent" href="/docs/USPTO Dockery Patent 12375324B2.pdf">
        Complete intellectual property portfolio covering ECBS technology and related innovations.
      </DocCard>
      <DocCard title="Technology Brochure" href="/docs/Synerex_Technology_Brochure.pdf">
        Comprehensive overview of ECBS technology, benefits, and implementation capabilities.
      </DocCard>
      <DocCard title="OEM Program Overview" href="/docs/OEM_Program_Overview.pdf">
        Detailed information about OEM/ODM licensing programs and manufacturing partnerships.
      </DocCard>
      <DocCard title="Custom Engineering Brief" href="/docs/Synerex_Custom_Engineering_Brief_(Demo).pdf">
        Overview of custom engineering services and application-specific system design capabilities.
      </DocCard>
      <DocCard title="Due Diligence Instructions" href="/docs/Synerex_Due_Diligence_Instructions.pdf">
        Guidelines and instructions for conducting due diligence on ECBS technology and licensing opportunities.
      </DocCard>
      <DocCard title="Mutual NDA Sample" href="/docs/Synerex_Mutual_NDA_Sample_(Demo).pdf">
        Sample mutual non-disclosure agreement template for partnership and licensing discussions.
      </DocCard>
    </section>
  </div>);
}
