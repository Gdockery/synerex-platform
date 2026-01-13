export default function Hero({ title, subtitle="", badge="", watermark=true }){
  return (
    <section className="relative min-h-[22rem] text-white flex items-start bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="relative max-w-6xl mx-auto px-3 py-16 w-full">
        {badge && (<div className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-3 py-1.5 text-white shadow-lg ring-1 ring-purple-400/40">{badge}</div>)}
        <h1 className="mt-4 text-3xl md:text-4xl font-bold italic text-left" style={{fontFamily: 'Times New Roman, serif', textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.6), 1px 1px 2px rgba(0, 0, 0, 0.4)'}}>{title}</h1>
        {subtitle && (<p className="mt-3 text-lg text-white/90 text-left">{subtitle}</p>)}
      </div>
      <div className="absolute right-8 text-white" style={{bottom: '52px'}}>
        <div className="text-[1.875rem] md:text-[2.25rem] font-bold italic" style={{fontFamily: 'Times New Roman, serif', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 0.7)'}}>The &quot;Network-wide&quot; Solution for making Single-Circuit Applications Obsolete.</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-gray-950"></div>
    </section>
  );
}