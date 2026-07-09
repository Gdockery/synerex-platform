type PortfolioMapSite = {
  annualSavings: string;
  lat?: number;
  lng?: number;
  location: string;
  site: string;
  status: "Healthy" | "Warning";
};

export function LeafletPortfolioMap({ sites }: { sites: PortfolioMapSite[] }) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-md bg-[#03111d] shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute left-[8%] top-[32%] h-10 w-20 rounded-[55%] bg-[#0b3148]/80 blur-[1px]" />
        <div className="absolute left-[20%] top-[48%] h-8 w-10 rounded-[50%] bg-[#0b3148]/80 blur-[1px]" />
        <div className="absolute left-[39%] top-[27%] h-9 w-16 rounded-[55%] bg-[#0b3148]/80 blur-[1px]" />
        <div className="absolute left-[48%] top-[44%] h-12 w-14 rounded-[55%] bg-[#0b3148]/80 blur-[1px]" />
        <div className="absolute left-[66%] top-[34%] h-10 w-20 rounded-[55%] bg-[#0b3148]/80 blur-[1px]" />
        <div className="absolute left-[77%] top-[54%] h-7 w-12 rounded-[55%] bg-[#0b3148]/80 blur-[1px]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,125,255,0.18),transparent_58%)]" />
      <div className="absolute left-2 top-2 grid gap-1">
        <button className="grid size-6 place-items-center rounded border border-cyan-300/20 bg-[#061421] text-xs text-slate-300">+</button>
        <button className="grid size-6 place-items-center rounded border border-cyan-300/20 bg-[#061421] text-xs text-slate-300">−</button>
        <button className="grid size-6 place-items-center rounded border border-cyan-300/20 bg-[#061421] text-[10px] text-slate-300">⌖</button>
      </div>
      {sites.map((site, index) => {
        const position = markerPosition(site, index);
        const color = site.status === "Healthy" ? "#05ff5e" : "#ffd740";
        return <div className="absolute size-3 rounded-full border-2 border-white/70 shadow-[0_0_12px_currentColor]" key={site.site} style={{ background: color, color, left: `${position.x}%`, top: `${position.y}%` }} title={`${site.site}: ${site.annualSavings}`} />;
      })}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#03111d] to-transparent" />
    </div>
  );
}

function markerPosition(site: PortfolioMapSite, index: number) {
  if (site.lat != null && site.lng != null) {
    return {
      x: Math.max(8, Math.min(88, ((site.lng + 180) / 360) * 100)),
      y: Math.max(14, Math.min(70, ((90 - site.lat) / 180) * 100)),
    };
  }

  const fallback = [
    { x: 31, y: 52 },
    { x: 35, y: 48 },
    { x: 39, y: 46 },
    { x: 68, y: 42 },
    { x: 74, y: 52 },
  ];

  return fallback[index % fallback.length];
}
