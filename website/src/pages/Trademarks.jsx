export default function Page(){ 
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
        </div>
      </section>
      
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Trademarks</h1>
          <h2 className="text-2xl font-bold text-gray-200 mb-6">Synerex® Trademark Usage Guidelines</h2>
          
          <p className="text-gray-300 mb-6">
            Synerex® is a registered trademark and represents proprietary, patented technology delivering a network-wide power quality and energy optimization solution designed to make single-circuit applications obsolete. Proper use of Synerex trademarks preserves brand integrity, protects intellectual property, and ensures consistent market representation.
          </p>
          
          <p className="text-gray-300 mb-8">
            Licensees, partners, and authorized users are permitted to use Synerex trademarks only in accordance with these guidelines and solely in connection with authorized Synerex products and services.
          </p>

          <h2 className="text-2xl font-bold text-gray-200 mb-4 mt-8">Approved Use of Synerex Marks</h2>
          <ul className="text-gray-300 mb-6 space-y-3 list-disc list-inside">
            <li>Use the Synerex® name, logos, and wordmarks only as provided by Synerex.</li>
            <li>Do not modify, stylize, abbreviate, translate, animate, or alter the marks in any way.</li>
            <li>Always include the appropriate trademark designation (® or ™) on first and most prominent use in any document, presentation, marketing material, software interface, or report.</li>
            <li>Ensure Synerex marks are clearly distinguishable from surrounding text and graphics.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-200 mb-4 mt-8">Brand Positioning Requirement</h2>
          <p className="text-gray-300 mb-4">
            When referencing Synerex technology, communications should reflect its defining distinction:
          </p>
          <p className="text-gray-300 mb-4 italic pl-4 border-l-4 border-purple-500">
            Synerex delivers a network-wide solution that replaces fragmented, single-circuit approaches with a unified, system-level power optimization architecture.
          </p>
          <p className="text-gray-300 mb-4">Synerex marks must not be used in a manner that:</p>
          <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
            <li>implies compatibility with single-circuit, point-of-use, or standalone solutions as equivalents</li>
            <li>suggests partial deployment represents the full Synerex system</li>
            <li>diminishes or misrepresents the network-wide nature of the technology</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-200 mb-4 mt-8">Prohibited Uses</h2>
          <p className="text-gray-300 mb-4">The following uses are strictly prohibited without prior written authorization:</p>
          <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
            <li>Altering the Synerex logo, colors, proportions, or typography</li>
            <li>Combining Synerex marks with other logos or product names</li>
            <li>Using Synerex marks in a company name, product name, domain name, or trademark</li>
            <li>Representing non-Synerex products or analyses as &quot;Synerex-certified&quot;</li>
            <li>Using Synerex marks in a way that suggests ownership, endorsement, or partnership beyond the scope of the applicable license</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-200 mb-4 mt-8">Ownership and Rights</h2>
          <p className="text-gray-300 mb-4">
            All Synerex trademarks, logos, service marks, and brand assets are and shall remain the exclusive property of Synerex. No rights, title, or interest in the Synerex marks are transferred or granted except for the limited, revocable right to use the marks as expressly permitted under an applicable license agreement.
          </p>
          <p className="text-gray-300 mb-4">Unauthorized or improper use of Synerex trademarks may result in:</p>
          <ul className="text-gray-300 mb-6 space-y-2 list-disc list-inside">
            <li>immediate revocation of trademark usage rights</li>
            <li>suspension or termination of licenses</li>
            <li>legal action to protect Synerex intellectual property</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-200 mb-4 mt-8">Attribution Statement (Recommended)</h2>
          <p className="text-gray-300 mb-6">
            Include the following attribution where appropriate:
          </p>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-300 italic">
              Synerex® is a registered trademark of Synerex Laboratories, LLC. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  ); 
}
