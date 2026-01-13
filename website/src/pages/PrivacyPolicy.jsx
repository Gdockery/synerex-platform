import LicenseSeal from "../components/LicenseSeal.jsx";

export default function PrivacyPolicy() {
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
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Information We Collect</h2>
          <p className="text-gray-300 mb-6">
            We collect information you provide directly to us, such as when you create an account, 
            make a purchase, request technical support, or contact us. This may include your name, 
            email address, phone number, company information, and other details you choose to provide.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">How We Use Your Information</h2>
          <p className="text-gray-300 mb-6">
            We use the information we collect to provide, maintain, and improve our services, 
            process transactions, send technical communications, respond to your inquiries, 
            and comply with legal obligations.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Information Sharing</h2>
          <p className="text-gray-300 mb-6">
            We do not sell, trade, or otherwise transfer your personal information to third parties 
            without your consent, except as described in this policy or as required by law.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Data Security</h2>
          <p className="text-gray-300 mb-6">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Cookies and Tracking</h2>
          <p className="text-gray-300 mb-6">
            We may use cookies and similar tracking technologies to enhance your experience on our 
            website and analyze usage patterns.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Your Rights</h2>
          <p className="text-gray-300 mb-6">
            You have the right to access, update, or delete your personal information. You may also 
            opt out of certain communications from us.
          </p>

          <h2 className="text-2xl font-bold text-gray-300 mb-4">Contact Us</h2>
          <p className="text-gray-300 mb-6">
            If you have any questions about this Privacy Policy, please contact us at 
            <a href="/contact" className="text-purple-400 hover:text-purple-300"> our contact page</a>.
          </p>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

