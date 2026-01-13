import Hero from "../components/Hero.jsx";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        .scientific-grid {
          background-image: 
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .circuit-line {
          position: relative;
        }
        .circuit-line::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
          animation: pulse 2s ease-in-out infinite;
        }
        .data-visualization {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
        .stat-card {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          backdrop-filter: blur(10px);
          opacity: 0.9;
        }
        .wave-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30, 50 50 T100 50' stroke='rgba(126,34,206,0.2)' fill='none' stroke-width='1'/%3E%3C/svg%3E");
          background-size: 100px 100px;
        }
      `}</style>

      {/* Hero Section - Scientific Laboratory Focus */}
      <section className="relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-32 px-4 text-center text-white overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0, opacity: 0.37 }}
          onError={(e) => console.error('Video error:', e)}
          onLoadedData={() => console.log('Video loaded successfully')}
        >
          <source src="/videos/14683955_3840_2160_30fps.mp4" type="video/mp4" />
        </video>
        {/* Gradient Overlay - Blue shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60" style={{ zIndex: 0.5 }}></div>
        <div className="absolute inset-0 scientific-grid opacity-30" style={{ zIndex: 1 }}></div>
        <div className="absolute inset-0 wave-pattern opacity-20" style={{ zIndex: 1 }}></div>
        <div className="relative fade-in z-10" style={{ zIndex: 2 }}>
          <img src="/images/SynerexLogo.png" alt="Synerex Logo" className="mx-auto mb-8 w-[13.2rem] md:w-[16.5rem] logo-glow" />
          <p className="text-gray-200 mb-6 text-[1.6875rem] md:text-[2.025rem] font-bold" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 0.7)' }}>The &quot;Network-wide&quot; Solution for making Single-Circuit Applications Obsolete.</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl" style={{ fontSize: '2.4rem', textShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)' }}>
            <strong className="text-purple-300">SYN</strong>ergistic <strong className="text-purple-300">E</strong>nergy <strong className="text-purple-300">R</strong>esearch and <strong className="text-purple-300">EX</strong>ecution
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-4 font-light">
            A Research & Development Laboratory Advancing Power Quality Science
          </p>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-300 mb-8">
              Pioneering infrastructure-level electrical optimization through patented "real-time" ECBS technology, 
              combining rigorous scientific research with advanced engineering to solve complex three-phase power network challenges.
            </p>
          </div>
        </div>
      </section>

      <LicenseSeal />

      {/* Scientific Mission Section */}
      <section className="relative bg-gradient-to-b from-gray-950 via-purple-900/20 to-gray-950 py-20 px-3">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: 'url(/images/Synerex_Laboratory.jpeg)',
            zIndex: 0
          }}
        />
        <div className="max-w-7xl mx-auto px-4 fade-in relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Scientific Excellence in Power Quality Research</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-gray-300 ">
                SYNEREX Laboratories, LLC operates at the intersection of electrical engineering, 
                materials science, and computational analytics to deliver breakthrough solutions.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="stat-card rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">U.S. Patent</div>
              <div className="text-2xl text-gray-300 mb-2">#12,375,324 B2</div>
              <p className="text-gray-400">ECBS Hardware Technology</p>
            </div>
            <div className="stat-card rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">Network-Wide</div>
              <div className="text-2xl text-gray-300 mb-2">Optimization</div>
              <p className="text-gray-400">Beyond Point Solutions</p>
            </div>
            <div className="stat-card rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">Utility-Grade</div>
              <div className="text-2xl text-gray-300 mb-2">Performance</div>
              <p className="text-gray-400">Verifiable Results</p>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Development Focus */}
      <section className="py-20 px-3 bg-gray-900 fade-in">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-purple-400 mb-12 text-center">Our Scientific Approach</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="data-visualization rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-300">Research Laboratory</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Our laboratory conducts fundamental research into three-phase power network behavior, 
                developing novel algorithms and control strategies that address electrical inefficiencies 
                at the infrastructure level. We combine theoretical modeling with empirical validation 
                to create defensible, peer-reviewable scientific contributions.
              </p>
            </div>

            <div className="data-visualization rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-300">Technology Development</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We transform research insights into patented hardware and software solutions. Our ECBS 
                (Electrical Current Balancing System) technology represents years of scientific development, 
                combining precision engineering with advanced control algorithms to deliver measurable, 
                verifiable improvements in power quality across commercial and industrial facilities.
              </p>
            </div>

            <div className="data-visualization rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-300">Data-Driven Validation</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Every solution we develop undergoes rigorous testing and validation using utility-grade 
                measurement and verification protocols. Our analytical software platform provides 
                tamper-proof data collection, enabling defensible performance claims backed by 
                scientific evidence and regulatory compliance.
              </p>
            </div>

            <div className="data-visualization rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-300">Engineering Excellence</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We recruit and collaborate with advanced engineering professionals who specialize in 
                power quality technology advancement. Our team combines deep theoretical knowledge 
                with practical implementation expertise to solve real-world infrastructure challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Technology Solutions */}
      <section className="relative py-20 px-3 bg-gray-950 fade-in">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat opacity-20"
          style={{
            backgroundImage: 'url(/images/Synerex_Hardware_Software_Development.jpeg)',
            backgroundPosition: 'left center',
            zIndex: 0
          }}
        />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">A Unified Hardware and Software Solution</h2>
          <p className="text-xl text-gray-300 text-center mb-12 ">
            For Electrical Network Optimization
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl hover:border-purple-200 transition-all duration-300">
              <a href="/patented-technology" className="hover:text-purple-400">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-purple-400 text-lg">Patented ECBS Technology</h3>
                </div>
              </a>
              <p className="text-sm mt-2 text-gray-300">
                U.S. Patent #12,375,324 B2 - A full-scale, network-wide technology that current balances 
                a facility's electrical network for stability and efficiency, improving overall power quality conditions.
              </p>
            </div>
            
            <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl hover:border-purple-200 transition-all duration-300">
              <a href="/real-time-analytics" className="hover:text-purple-400">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-purple-400 text-lg">Advanced PQ Analytics</h3>
                </div>
              </a>
              <p className="text-sm mt-2 text-gray-300">
                Tamper-proof energy metering platform with real-time power quality monitoring, 
                comprehensive testing protocols, and utility-grade compliance verification.
              </p>
            </div>
            
            <div className="p-6 border border-gray-700 bg-gray-800 rounded-xl hover:border-purple-200 transition-all duration-300">
              <a href="/manufacturing" className="hover:text-purple-400">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-purple-400 text-lg">Full-Scale Manufacturing</h3>
                </div>
              </a>
              <p className="text-sm mt-2 text-gray-300">
                Production-ready designs, compliance guidance, and OEM/ODM partnerships for 
                scalable deployment of power quality solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Impact Section */}
      <section className="py-20 px-3 bg-gradient-to-br from-purple-950/30 via-gray-950 to-blue-950/30 fade-in">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-purple-400 mb-4">Advancing Power Quality Science</h2>
            <p className="text-xl text-gray-300 ">
              Our research addresses fundamental challenges in three-phase power network optimization, 
              contributing to the scientific understanding of electrical infrastructure efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 rounded-xl p-8 border border-purple-500/30">
              <h3 className="text-2xl font-bold text-purple-300 mb-4">Research Contributions</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Novel current balancing algorithms for three-phase networks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Advanced harmonic attenuation methodologies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Network-wide optimization control strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Utility-grade measurement and verification protocols</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Tamper-proof data integrity systems</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-8 border border-blue-500/30">
              <h3 className="text-2xl font-bold text-purple-300 mb-4">Scientific Applications</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Commercial and industrial facility optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Data center power quality management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Healthcare facility electrical systems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Renewable energy integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Manufacturing and industrial complexes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-3 bg-gray-900 fade-in">
        <div className=" text-center">
          <h2 className="text-4xl font-bold text-purple-400 mb-6">Join the Future of Power Quality Science</h2>
          <p className="text-xl text-gray-300 mb-8">
            Explore our patented technology, research capabilities, and partnership opportunities 
            to advance electrical network optimization.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/hardware" className="bg-purple-600 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-200/40">
              Explore Hardware Technology
            </a>
            <a href="/software" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/40">
              Discover Analytics Platform
            </a>
            <a href="/licensing" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg">
              Licensing Opportunities
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

