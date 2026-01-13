import LicenseSeal from "../components/LicenseSeal.jsx";

export default function CopyrightNotice() {
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
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Copyright Protection</h2>
          <p className="text-gray-300 mb-6">
            All content on this website, including but not limited to text, graphics, logos, images, 
            software, and documentation, is the property of Synerex Laboratories, LLC and is protected 
            by United States and international copyright laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Trademark Rights</h2>
          <p className="text-gray-300 mb-6">
            The Synerex name, logo, and related trademarks are the exclusive property of Synerex 
            Laboratories, LLC. Unauthorized use of these trademarks is strictly prohibited.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Patent Rights</h2>
          <p className="text-gray-300 mb-6">
            Synerex Laboratories, LLC holds numerous patents related to Electrical Current Balancing 
            System (ECBS) technology and power quality solutions. These patents are protected under 
            United States and international patent laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Permitted Use</h2>
          <p className="text-gray-300 mb-6">
            You may view, download, and print content from this website for personal, non-commercial 
            use only. Any other use, including reproduction, distribution, or modification, requires 
            prior written permission from Synerex Laboratories, LLC.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Prohibited Uses</h2>
          <p className="text-gray-300 mb-6">
            You may not use our content for commercial purposes, create derivative works, or remove 
            any copyright or proprietary notices without explicit written permission.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Third-Party Content</h2>
          <p className="text-gray-300 mb-6">
            Some content on this website may be owned by third parties. We respect their intellectual 
            property rights and expect users to do the same.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">DMCA Compliance</h2>
          <p className="text-gray-300 mb-6">
            If you believe your copyright has been infringed, please contact us immediately. We will 
            respond to valid DMCA takedown notices in accordance with applicable law.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Contact Information</h2>
          <p className="text-gray-300 mb-6">
            For copyright-related inquiries or permission requests, please contact us at 
            <a href="/contact" className="text-purple-400 hover:text-purple-300"> our contact page</a>.
          </p>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Copyright © {new Date().getFullYear()} Synerex Laboratories, LLC. All rights reserved.</strong>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

