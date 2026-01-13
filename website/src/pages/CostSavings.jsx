import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function CostSavings() {
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
      <Hero 
        title="Cost Savings" 
        subtitle="Delivers significant cost savings through reduced energy consumption, lower maintenance requirements, extended equipment life, and improved operational efficiency across the entire electrical infrastructure." 
      />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Energy Cost Reduction</h3>
            <p className="text-sm mt-2 text-gray-300">Significant reduction in energy consumption through improved power factor and elimination of current imbalances, resulting in lower electricity bills and reduced demand charges across the entire facility.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Maintenance Cost Savings</h3>
            <p className="text-sm mt-2 text-gray-300">Reduced maintenance requirements due to improved power quality conditions, extending equipment life and minimizing the need for frequent repairs, replacements, and maintenance interventions.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Equipment Life Extension</h3>
            <p className="text-sm mt-2 text-gray-300">Extended equipment lifespan through protection from power quality issues, reducing capital expenditure on equipment replacement and providing long-term cost benefits through improved reliability.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Operational Efficiency Gains</h3>
            <p className="text-sm mt-2 text-gray-300">Improved operational efficiency across all electrical systems reduces downtime, increases productivity, and minimizes production losses, resulting in substantial cost savings and revenue protection.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Demand Charge Optimization</h3>
            <p className="text-sm mt-2 text-gray-300">Optimized power consumption patterns reduce peak demand charges and improve load factor, resulting in significant savings on utility bills and improved cost predictability.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Power Factor Correction</h3>
            <p className="text-sm mt-2 text-gray-300">Automatic power factor correction eliminates power factor penalties and reduces reactive power charges, providing immediate cost savings and improved electrical system efficiency.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">Insurance Premium Reduction</h3>
            <p className="text-sm mt-2 text-gray-300">Improved power quality and reduced equipment failure risk may qualify for reduced insurance premiums, providing additional cost savings through enhanced risk management and system reliability.</p>
          </div>
          <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl">
            <h3 className="font-bold text-purple-400">ROI and Payback Analysis</h3>
            <p className="text-sm mt-2 text-gray-300">Comprehensive return on investment analysis demonstrates rapid payback periods through multiple cost savings streams, making ECBS technology a highly attractive investment with measurable financial benefits.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

