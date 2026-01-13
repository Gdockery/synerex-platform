import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function ThankYou(){
  const p = new URLSearchParams(window.location.search);
  const topic = p.get('topic') || '';
  const source = p.get('source') || '';
  
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
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="fade-in" style={{ zIndex: 1 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow" />
        </div>
      </section>
      <LicenseSeal />
    <Hero title="Thank You — Message Received!" subtitle="We've received your inquiry and will respond within 24 hours." />
    <section className="max-w-7xl mx-auto px-4 py-10 text-center">
      <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 mb-8">
        <div className="text-green-400 text-lg font-semibold mb-2">✓ Your message has been sent successfully</div>
        <div className="text-green-300">
          <p className="mb-2">We've received your inquiry about <strong>{topic}</strong> and will get back to you shortly.</p>
          <p className="text-sm">Our team typically responds within 24 hours during business days.</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-300 mb-6">
        <div>Inquiry Topic: {topic}</div>
        <div>Source: {source}</div>
        {p.get('utm_campaign') && <div>Campaign: {p.get('utm_campaign')}</div>}
      </div>
      
      <div className="flex gap-3 justify-center">
        <a className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-400" href="/">Return Home</a>
        <a className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300" href="/downloads">View Downloads</a>
        <a className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300" href="/contact">Contact Us Again</a>
      </div>
    </section>
  </div>);
}
