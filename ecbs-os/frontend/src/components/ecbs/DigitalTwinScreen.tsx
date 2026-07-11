import type { ReactNode } from "react";
import type { DigitalTwinAsset, DigitalTwinData, DigitalTwinRelationship } from "@/lib/trackingDashboardData";
import { DashboardFooter, DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

type PositionedAsset = DigitalTwinAsset & {
  badges: DigitalTwinAsset[];
  x: number;
  y: number;
};

const healthColor = {
  healthy: "#05ff5e",
  warning: "#ffd740",
  critical: "#ef4444",
  offline: "#94a3b8",
};

export type ElectricalNetworkVariant =
  | "overview"
  | "alertsDetail"
  | "healthEvents"
  | "healthDetail"
  | "peakEvents"
  | "peakFullAnalysis"
  | "loadDetail"
  | "lossesActionPlan"
  | "lossesOptimization"
  | "lossesDetail"
  | "optimizationDetail"
  | "optimizationRecommendations"
  | "fullNetworkExpanded"
  | "oneLineScanner"
  | "powerDetail"
  | "lowPfEvents"
  | "reactivePowerDetail";

export function DigitalTwinScreen({ data }: { data: DigitalTwinData }) {
  return <DigitalTwinReferenceScreen data={data} />;
}

function DigitalTwinReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[40px] items-center justify-between border-b border-cyan-300/10">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-200">XECO Energy Intelligence Portal</div>
            <div className="text-[10px] text-slate-400">Digital Twin</div>
          </div>
          <div className="flex items-center gap-3 text-[9px]">
            <button className="w-[140px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{siteLabel(data)}⌄</button>
            <button className="w-[180px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button>
            <span className="text-[#05ff5e]">● Live</span>
            <span className="text-slate-400">♧</span>
            <span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span>
            <span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span>
            <span>⌄</span>
          </div>
        </header>
        <div className="flex h-[64px] items-center justify-between">
          <div><h1 className="text-lg font-light">Digital Twin - Electrical Network</h1><p className="mt-1 text-[10px] text-slate-400">{siteLabel(data)} &nbsp; · &nbsp; Last updated: {data.updatedAt || "No Data"}</p></div>
          <div className="flex items-center gap-5 text-[9px]">
            <span>View:</span><button className="w-[164px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">Load Flow (kVA)⌄</button>
            <span>Overlay:</span><button className="w-[164px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">Utilization⌄</button>
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⛶ 3D View</button>
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">☰ List View</button>
          </div>
        </div>
        <section className="grid min-h-0 flex-1 grid-cols-[1fr_300px] gap-2">
          <div className="relative overflow-hidden rounded-lg border border-cyan-300/12 bg-[#03111d]">
            <DigitalTwinReferenceCanvas data={data} />
            <DigitalTwinLegend />
            <DigitalTwinZoomControls />
          </div>
          <aside className="grid min-h-0 grid-rows-[268px_152px_1fr] gap-2 overflow-hidden">
            <DashboardPanel title="Selected Asset" variant="enterprise"><DigitalTwinSelectedAsset data={data} /></DashboardPanel>
            <DashboardPanel title="Asset Summary" variant="enterprise"><DigitalTwinAssetSummary data={data} /></DashboardPanel>
            <DashboardPanel title="Capacity By Level" variant="enterprise"><DigitalTwinCapacityByLevel data={data} /></DashboardPanel>
          </aside>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function DigitalTwinReferenceCanvas({ data }: { data: DigitalTwinData }) {
  const assets = data.assets.slice(0, 12);

  if (assets.length === 0) {
    return <NoDataPanel message="No Digital Twin assets were returned from tracking." />;
  }

  return (
    <svg className="h-full w-full" viewBox="0 0 930 610" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="referenceGrid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(41,182,246,.075)" strokeWidth=".8" /></pattern>
        <filter id="greenGlow"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="930" height="610" fill="url(#referenceGrid)" />
      <line filter="url(#greenGlow)" stroke="#05ff5e" strokeWidth="3" x1="82" x2="838" y1="254" y2="254" />
      <text fill="#05ff5e" fontSize="10" fontWeight="700" textAnchor="middle" x="460" y="245">{data.twinLabel || "Digital Twin Asset Graph"}</text>
      {assets.map((asset, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = 92 + col * 202;
        const y = 88 + row * 132;
        const warning = asset.status.toLowerCase().includes("warning") || asset.status.toLowerCase().includes("critical");
        return <DigitalTwinAssetNode asset={asset} key={asset.id} warning={warning} x={x} y={y} />;
      })}
      <text fill="#94a3b8" fontSize="9" x="32" y="582">Asset layout coordinates: No Data. Rendering approved asset rows from tracking.</text>
    </svg>
  );
}

function DigitalTwinLine({ points }: { points: string }) {
  return <polyline fill="none" points={points} stroke="#05ff5e" strokeWidth="2" />;
}

function DigitalTwinAssetNode({ asset, warning, x, y }: { asset: DigitalTwinAsset; warning: boolean; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line stroke={warning ? "#ffd740" : "#05ff5e"} strokeWidth="2" x1="58" x2="58" y1="-28" y2="0" />
      <rect fill="#061521" height="76" rx="6" stroke={warning ? "#ffd740" : "#1e3a5f"} width="156" />
      <text fill="#e2e8f0" fontSize="8" fontWeight="700" x="12" y="18">{asset.name}</text>
      <text fill="#94a3b8" fontSize="7" x="12" y="34">{asset.type || "No Data"}</text>
      <text fill="#e2e8f0" fontSize="8" x="12" y="50">{formatKva(asset.kvaRating)}</text>
      <text fill="#94a3b8" fontSize="7" x="12" y="64">Status: {asset.status || "No Data"}</text>
      <circle cx="140" cy="18" fill={warning ? "#ffd740" : "#05ff5e"} r="5" />
    </g>
  );
}

function DigitalTwinNode({ h, icon = "", sub, title, value, w, x, y }: { h: number; icon?: string; sub: string; title: string; value: string; w: number; x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><rect fill="#061521" height={h} rx="6" stroke="#1e3a5f" width={w} /><text fill="#94a3b8" fontSize="22" x="14" y="34">{icon}</text><text fill="#e2e8f0" fontSize="9" fontWeight="700" x="52" y="18">{title}</text><text fill="#e2e8f0" fontSize="14" fontWeight="700" x="52" y="34">{sub}</text>{value ? <text fill="#94a3b8" fontSize="8" x="52" y="47">{value}</text> : null}<circle cx={w - 16} cy="18" fill="#05ff5e" r="5" /></g>;
}

function DigitalTwinFeeder({ load, status, title, warning = false, x, y }: { load: string; status: string; title: string; warning?: boolean; x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><line stroke="#05ff5e" strokeWidth="2" x1="45" x2="45" y1="-30" y2="0" /><circle cx="45" cy="-30" fill="#05ff5e" r="4" /><rect fill="#061521" height="62" rx="5" stroke={warning ? "#ffd740" : "#1e3a5f"} width="100" /><text fill="#e2e8f0" fontSize="8" fontWeight="700" x="10" y="16">{title}</text><text fill="#94a3b8" fontSize="7" x="10" y="31">Load</text><text fill="#e2e8f0" fontSize="7" x="45" y="31">{load}</text><text fill="#94a3b8" fontSize="7" x="10" y="48">Health</text><circle cx="47" cy="45" fill={warning ? "#ffd740" : "#05ff5e"} r="4" /><text fill={warning ? "#ffd740" : "#05ff5e"} fontSize="7" x="58" y="48">{status}</text></g>;
}

function DigitalTwinPanel({ load, title, warning = false, x, y }: { load: string; title: string; warning?: boolean; x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><line stroke={warning ? "#ffd740" : "#05ff5e"} strokeWidth="2" x1="35" x2="35" y1="-36" y2="0" /><rect fill="#061521" height="56" rx="5" stroke={warning ? "#ffd740" : "#1e3a5f"} width="72" /><text fill="#e2e8f0" fontSize="7.5" fontWeight="700" textAnchor="middle" x="36" y="16">{title}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x="36" y="29">Load</text><text fill="#e2e8f0" fontSize="7" textAnchor="middle" x="36" y="41">{load}</text><circle cx="12" cy="49" fill={warning ? "#ffd740" : "#05ff5e"} r="3.5" /></g>;
}

function DigitalTwinLoad({ label, load, x, y }: { label: string; load: string; x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><line stroke="#94a3b8" strokeDasharray="4 4" x1="0" x2="0" y1="-60" y2="-18" /><text fill="#94a3b8" fontSize="22" textAnchor="middle" y="-2">⌁</text>{label.split("\\n").map((part, index) => <text fill="#e2e8f0" fontSize="8" key={part} textAnchor="middle" y={18 + index * 10}>{part}</text>)}<text fill="#e2e8f0" fontSize="8" textAnchor="middle" y="44">{load}</text></g>;
}

function DigitalTwinLegend() {
  return <div className="absolute bottom-3 left-4 flex items-center gap-4 rounded border border-cyan-300/12 bg-[#061521]/90 px-4 py-2 text-[9px] text-slate-400"><b className="text-slate-300">LEGEND</b><LegendDot color="#05ff5e" label="Healthy" /><LegendDot color="#ffd740" label="Warning" /><LegendDot color="#ef4444" label="Critical" /><LegendDot color="#94a3b8" label="Offline" /></div>;
}

function DigitalTwinZoomControls() {
  return <div className="absolute bottom-3 right-4 flex items-end gap-4"><div className="rounded border border-cyan-300/12 bg-[#061521]/90 px-4 py-2 text-[9px] text-slate-400"><div className="mb-1 font-semibold text-slate-300">UTILIZATION SCALE (Load / Rating)</div><div className="h-2 w-64 rounded-full bg-gradient-to-r from-[#05ff5e] via-[#ffd740] to-[#ef4444]" /><div className="mt-1 flex justify-between"><span>0%</span><span>50%</span><span>80%</span><span>100%</span></div></div><div className="flex gap-2 text-[16px]"><button className="grid size-9 place-items-center rounded border border-cyan-300/12 bg-[#061421]">⌕</button><button className="grid size-9 place-items-center rounded border border-cyan-300/12 bg-[#061421]">⊕</button><button className="grid size-9 place-items-center rounded border border-cyan-300/12 bg-[#061421]">⛶</button></div></div>;
}

function DigitalTwinSelectedAsset({ data }: { data: DigitalTwinData }) {
  const asset = primaryAsset(data);
  const utilization = utilizationPct(data);
  return <div className="space-y-2 text-[9px]"><div className="flex items-start gap-3"><div className="grid size-10 place-items-center rounded border border-slate-600 bg-[#061421] text-xl">⚙</div><div><div className="text-[13px] font-semibold">{asset?.name ?? "No Data"}</div><div className="text-slate-400">{asset ? formatKva(asset.kvaRating) : "No Data"}</div></div><span className="ml-auto size-3 rounded-full bg-[#05ff5e]" /></div><div className="grid grid-cols-4 border-b border-[#05ff5e]/60 text-center text-[8px]"><span className="pb-1 text-[#05ff5e]">Overview</span><span>Measurements</span><span>Health</span><span>Events</span></div><DigitalTwinMetricLine label="Load" value={formatKva(data.currentLoadKva)} /><MeterBar value={utilization} /><DigitalTwinMetricLine label="Available Capacity" value={formatKva(data.headroomKva)} valueClass="text-[#29b6f6]" /><DigitalTwinMetricLine label="Recovered Capacity" value={formatKva(data.recoveredCapacityKva)} valueClass="text-[#05ff5e]" /><DigitalTwinMetricLine label="Utilization" value={data.transformerKva > 0 ? `${utilization}%` : "No Data"} /><DigitalTwinMetricLine label="Temperature" value="No Data" /><DigitalTwinMetricLine label="Health Status" value={data.cbiScore > 0 ? `● ${Math.round(data.cbiScore)}` : "No Data"} valueClass="text-[#05ff5e]" /></div>;
}

function DigitalTwinAssetSummary({ data }: { data: DigitalTwinData }) {
  return <div className="space-y-1 text-[9px]"><DigitalTwinMetricLine label="Total Connected Load" value={formatKva(data.currentLoadKva)} /><DigitalTwinMetricLine label="Total Available Capacity" value={formatKva(data.headroomKva)} /><DigitalTwinMetricLine label="Total Recovered Capacity" value={formatKva(data.recoveredCapacityKva)} /><DigitalTwinMetricLine label="Network Efficiency" value="No Data" /><DigitalTwinMetricLine label="Power Factor (Avg)" value="No Data" /><DigitalTwinMetricLine label="THD (I) (Avg)" value="No Data" /><DigitalTwinMetricLine label="Active Meters" value={data.activeMeters > 0 ? String(data.activeMeters) : "No Data"} /></div>;
}

function DigitalTwinMetricLine({ label, value, valueClass = "text-slate-100" }: { label: string; value: string; valueClass?: string }) {
  return <div className="flex justify-between gap-2 border-b border-white/5 pb-[3px]"><span className="text-slate-400">{label}</span><span className={`text-right font-semibold ${valueClass}`}>{value}</span></div>;
}

function DigitalTwinCapacityByLevel({ data }: { data: DigitalTwinData }) {
  const rows = assetCapacityRows(data);
  return <div className="space-y-3 text-[10px]"><div className="grid grid-cols-[88px_1fr] gap-2"><svg className="h-24 w-24" viewBox="0 0 80 80"><circle cx="40" cy="40" fill="none" r="24" stroke="#0f2533" strokeWidth="18" /><circle cx="40" cy="40" fill="none" r="24" stroke="#05ff5e" strokeDasharray="66 151" strokeWidth="18" transform="rotate(-90 40 40)" /></svg><div className="space-y-2">{rows.length > 0 ? rows.map(([label, value]) => <MetricLine key={label} label={label} value={value} />) : <MetricLine label="No Data" value="No asset ratings returned" />}</div></div><div className="flex items-center justify-between border-t border-white/10 pt-3"><span>Total Recovered Capacity</span><b className="text-xl text-[#05ff5e]">{formatKva(data.recoveredCapacityKva)}</b></div></div>;
}

export function ElectricalNetworkScreen({ data, variant }: { data?: DigitalTwinData; variant: ElectricalNetworkVariant }) {
  const payload = data ?? emptyDigitalTwinScreenData();
  if (variant === "overview") return <ElectricalNetworkReferenceScreen data={payload} />;
  if (variant === "alertsDetail") return <AlertsDetailReferenceScreen data={payload} />;
  if (variant === "healthDetail") return <HealthDetailReferenceScreen data={payload} />;
  if (variant === "healthEvents") return <HealthEventsReferenceScreen data={payload} />;
  if (variant === "peakEvents") return <PeakEventsReferenceScreen data={payload} />;
  if (variant === "peakFullAnalysis") return <PeakFullAnalysisReferenceScreen data={payload} />;
  if (variant === "loadDetail") return <LoadDetailReferenceScreen data={payload} />;
  if (variant === "lossesActionPlan") return <LossesActionPlanReferenceScreen data={payload} />;
  if (variant === "lossesOptimization") return <LossesOptimizationReferenceScreen data={payload} />;
  if (variant === "lossesDetail") return <LossesDetailReferenceScreen data={payload} />;
  if (variant === "optimizationDetail") return <OptimizationDetailReferenceScreen data={payload} />;
  if (variant === "lowPfEvents") return <LowPfEventsReferenceScreen data={payload} />;
  if (variant === "reactivePowerDetail") return <ReactivePowerDetailReferenceScreen data={payload} />;
  if (variant === "powerDetail") return <PowerDetailReferenceScreen data={payload} />;
  if (variant === "optimizationRecommendations") return <OptimizationRecommendationsReferenceScreen data={payload} />;
  if (variant === "fullNetworkExpanded") return <FullNetworkExpandedReferenceScreen data={payload} />;
  if (variant === "oneLineScanner") return <OneLineDrawingScannerReferenceScreen data={payload} />;

  const titles: Record<ElectricalNetworkVariant, string> = {
    alertsDetail: "Alerts Detail",
    healthDetail: "Network Health – Detail",
    healthEvents: "Recent Health Events",
    loadDetail: "Load Detail",
    lossesActionPlan: "Download Action Plan",
    lossesDetail: "Losses Detail",
    lossesOptimization: "Losses Optimization",
    lowPfEvents: "Low Power Factor Events",
    optimizationDetail: "Optimization Detail",
    optimizationRecommendations: "Electrical Network Optimization Recommendations",
    fullNetworkExpanded: "Full Network View",
    oneLineScanner: "Scan One-Line Drawing",
    overview: "Electrical Network",
    peakEvents: "Peak Events (7 Days)",
    peakFullAnalysis: "Full Event Analysis",
    powerDetail: "Power Detail",
    reactivePowerDetail: "Reactive Power Detail",
  };
  const subtitles: Record<ElectricalNetworkVariant, string> = {
    alertsDetail: "Detailed information and analysis for selected network alert.",
    healthDetail: "Comprehensive health analysis of your electrical distribution system.",
    healthEvents: "Real-time log of health related events and system conditions.",
    loadDetail: "Comprehensive view of connected load, demand trends, and consumption breakdown.",
    lossesActionPlan: "Comprehensive action plan to reduce losses, improve efficiency, and optimize system performance.",
    lossesDetail: "Comprehensive analysis of system losses and energy waste across the electrical network.",
    lossesOptimization: "Identify, prioritize, and implement actions to reduce system losses and energy waste.",
    lowPfEvents: "Detailed list of low power factor events detected across the network.",
    optimizationDetail: "Detailed analysis of selected optimization opportunity and implementation plan.",
    optimizationRecommendations: "Actionable recommendations to improve power quality, reduce demand and maximize energy savings.",
    fullNetworkExpanded: "Complete electrical network and power flow visualization.",
    oneLineScanner: "Upload or scan your facility one-line drawing to map your electrical system and enable network analysis.",
    overview: "Monitor your entire electrical distribution system in real time.",
    peakEvents: "Detailed list of peak demand events and system load spikes.",
    peakFullAnalysis: "Comprehensive analysis of peak demand event and system impact.",
    powerDetail: "Comprehensive analysis of apparent power, real power, reactive power, and power factor performance.",
    reactivePowerDetail: "In-depth analysis of reactive power, power factor, and VAR performance across the network.",
  };
  const title = titles[variant];
  const subtitle = subtitles[variant];

  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-[682px] flex-col overflow-hidden px-3 py-2">
        <NetworkTopbar />
        <div className="mt-2 flex h-[44px] items-start justify-between">
          <div>
            <div className="text-[10px] text-slate-400">
              Electrical Network {variant !== "overview" ? "›" : ""} <span className="text-[#05ff5e]">{variant !== "overview" ? title : ""}</span>
            </div>
            <h1 className="text-xl font-light">{title}</h1>
            <p className="text-[9px] text-slate-400">{subtitle}</p>
          </div>
          <div className="flex gap-2 text-[9px]">
            {variant !== "overview" ? <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">← Back to Electrical Network</button> : null}
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">Export Report</button>
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">Configure Alerts</button>
          </div>
        </div>
        {variant === "overview" ? <ElectricalNetworkOverview /> : null}
        {variant === "alertsDetail" ? <AlertsDetailScreen /> : null}
        {variant === "healthDetail" ? <HealthDetailScreen /> : null}
        {variant === "healthEvents" ? <HealthEventsScreen /> : null}
        {variant === "peakEvents" ? <PeakEventsScreen /> : null}
        {variant === "peakFullAnalysis" ? <PeakFullAnalysisScreen /> : null}
        {variant === "loadDetail" ? <LoadDetailScreen /> : null}
        {variant === "lossesActionPlan" ? <LossesActionPlanScreen /> : null}
        {variant === "lossesOptimization" ? <LossesOptimizationScreen /> : null}
        {variant === "lossesDetail" ? <LossesDetailScreen /> : null}
        {variant === "optimizationDetail" ? <OptimizationDetailScreen /> : null}
        {variant === "optimizationRecommendations" ? <OptimizationRecommendationsScreen /> : null}
        {variant === "powerDetail" ? <PowerDetailScreen /> : null}
        {variant === "lowPfEvents" ? <LowPfEventsScreen /> : null}
        {variant === "reactivePowerDetail" ? <ReactivePowerDetailScreen /> : null}
        <DashboardFooter updatedAt="May 18, 2025 10:15 AM" variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function ElectricalNetworkReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]">
            <button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button>
            <button className="w-[180px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button>
            <span className="text-[#05ff5e]">● Live</span>
            <span className="text-slate-400">♧</span>
            <span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span>
            <span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span>
            <span>⌄</span>
          </div>
        </header>
        <div className="flex h-[72px] items-center justify-between">
          <div><h1 className="text-xl font-light">Electrical Network</h1><p className="mt-1 text-[9px] text-slate-400">Monitor your entire electrical distribution system in real time.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Network View⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♢ Configure Alerts</button></div>
        </div>
        <section className="grid h-[94px] grid-cols-[1.05fr_1fr_1fr_1fr_1fr] gap-2">
          <ElectricalNetworkHealthKpi data={data} />
          <ReferenceKpi icon="∿" label="TOTAL CONNECTED LOAD ⓘ" value={formatMw(data.currentLoadKva)} detail="Latest capacity intelligence" tone="green" />
          <ReferenceKpi icon="⌁" label="TOTAL APPARENT POWER ⓘ" value="No Data" detail="No approved apparent-power source" tone="purple" />
          <ReferenceKpi icon="⚡" label="TOTAL LOSSES ⓘ" value="No Data" detail="No approved losses model" tone="red" />
          <ReferenceKpi icon="%" label="CAPACITY AVAILABLE ⓘ" value={formatMw(data.headroomKva)} detail="Installed minus used capacity" tone="blue" />
        </section>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.58fr_0.82fr] grid-rows-[1fr_178px] gap-2 overflow-hidden">
          <DashboardPanel className="min-h-0" title="NETWORK ONE-LINE DIAGRAM ⓘ" variant="enterprise"><ElectricalOneLineReference data={data} /></DashboardPanel>
          <div className="row-span-2 grid min-h-0 grid-rows-[148px_148px_126px_1fr] gap-2 overflow-hidden">
            <DashboardPanel action="View All Alerts ->" title="NETWORK ALERTS ⓘ" variant="enterprise"><MetricListSmall rows={noDataRows("No approved alert/event source")} /></DashboardPanel>
            <DashboardPanel action="View All Issues ->" title="TOP NETWORK ISSUES" variant="enterprise"><CompactNetworkTable headers={["Issue", "Location", "Impact", "Status"]} rows={noDataTableRows("No approved network issue source", 4)} /></DashboardPanel>
            <DashboardPanel title="NETWORK SUMMARY" variant="enterprise"><ElectricalNetworkSummary data={data} /></DashboardPanel>
            <DashboardPanel action="View Optimization Recommendations ->" title="NETWORK OPTIMIZATION POTENTIAL ⓘ" variant="enterprise"><ElectricalOptimizationPotential data={data} /></DashboardPanel>
          </div>
          <div className="grid min-h-0 grid-cols-[1.05fr_0.95fr] gap-2">
            <DashboardPanel title="VOLTAGE PROFILE (L-L) ⓘ" variant="enterprise"><NoDataPanel message="No approved feeder voltage source." /></DashboardPanel>
            <DashboardPanel title="FEEDER LOADING ⓘ" variant="enterprise"><ElectricalFeederLoading data={data} /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function ElectricalNetworkHealthKpi({ data }: { data: DigitalTwinData }) {
  const score = healthScore(data);
  return <article className="grid grid-cols-[86px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-16 place-items-center rounded-full" style={{ background: `conic-gradient(#05ff5e 0 ${score || 0}%, #0f2533 ${score || 0}% 100%)` }}><span className="grid size-12 place-items-center rounded-full bg-[#061521] text-center text-lg text-[#05ff5e]">{score ? String(score) : "No Data"}<br /><b className="text-[7px] font-normal text-slate-300">{score ? "CBI" : ""}</b></span></div><div className="space-y-1 text-[8px]"><div className="text-slate-400">NETWORK HEALTH ⓘ</div><div className="flex justify-between"><span>Components Online</span><b className="text-[#05ff5e]">No Data</b></div><div className="flex justify-between"><span>Issues Detected</span><b className="text-yellow-300">No Data</b></div><div className="flex justify-between"><span>Critical Alerts</span><b className="text-red-400">No Data</b></div></div></article>;
}

function ReferenceKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "green" | "purple" | "red"; value: string }) {
  const color = tone === "red" ? "text-red-400" : tone === "purple" ? "text-purple-400" : tone === "blue" ? "text-cyan-300" : "text-[#05ff5e]";
  return <article className="grid grid-cols-[58px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className={`grid size-12 place-items-center rounded-full border text-xl ${color}`}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className={`mt-1 text-2xl leading-none ${color}`}>{value}</div><div className="mt-1 text-[9px] text-slate-400">{detail}</div></div></article>;
}

function ElectricalOneLineReference({ data }: { data: DigitalTwinData }) {
  const assets = data.assets.slice(0, 10);
  if (assets.length === 0) {
    return <NoDataPanel message="No Digital Twin assets were returned from tracking." />;
  }

  return <div className="relative h-full overflow-hidden text-[8px]"><div className="absolute left-4 top-8 grid gap-2 text-center text-slate-400"><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421] text-lg">+</button><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421] text-lg">−</button><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421] text-lg">⛶</button></div><svg className="h-full w-full" viewBox="0 0 860 420" preserveAspectRatio="none"><line stroke="#05ff5e" strokeWidth="3" x1="112" x2="742" y1="210" y2="210" /><text fill="#cbd5e1" fontSize="8" textAnchor="middle" x="428" y="186">{data.twinLabel || "Digital Twin Assets"}</text>{assets.map((asset, index) => { const x = 112 + (index % 5) * 138; const y = index < 5 ? 236 : 332; const warning = asset.status.toLowerCase().includes("warning") || asset.status.toLowerCase().includes("critical"); const color = warning ? "#ffd740" : "#05ff5e"; return <g key={asset.id}><line stroke={color} strokeWidth="2" x1={x} x2={x} y1={index < 5 ? "210" : "306"} y2={y} /><circle cx={x} cy={index < 5 ? "210" : "306"} fill={color} r="4" /><rect fill="#061521" height="66" rx="5" stroke="#1e3a5f" width="104" x={x - 52} y={y} /><text fill={color} fontSize="7" fontWeight="700" textAnchor="middle" x={x} y={y + 16}>{asset.type || "Asset"}</text><text fill="#e2e8f0" fontSize="7" textAnchor="middle" x={x} y={y + 31}>{asset.name}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x} y={y + 46}>{formatKva(asset.kvaRating)}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x} y={y + 59}>{asset.status || "No Data"}</text></g>; })}<text fill="#94a3b8" fontSize="8" x="26" y="404">Layout coordinates: No Data. Rendering approved tracking asset rows.</text></svg></div>;
}

function ElectricalBox({ meta, title, value, w, x, y }: { meta?: string; title: string; value: string; w: number; x: number; y: number }) {
  return <g><rect fill="#061521" height="54" rx="5" stroke="#1e3a5f" width={w} x={x} y={y} /><text fill="#cbd5e1" fontSize="8" fontWeight="700" textAnchor="middle" x={x + w / 2} y={y + 16}>{title}</text><text fill="#e2e8f0" fontSize="10" fontWeight="700" textAnchor="middle" x={x + w / 2} y={y + 31}>{value}</text>{meta ? <text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x + w / 2} y={y + 44}>{meta}</text> : null}</g>;
}

function ElectricalNetworkAlerts() {
  return <div className="space-y-1.5 text-[8px]">{[["△","High load on Feeder 4","92% of capacity","May 18, 2025 10:12 AM"],["△","Harmonic distortion on Feeder 2","THD: 2.5%","May 18, 2025 09:48 AM"],["ⓘ","Capacitor bank switched off","Automatic","May 18, 2025 08:33 AM"]].map(([icon,title,detail,time], index) => <div className="grid grid-cols-[18px_1fr_auto] gap-2 border-b border-white/5 pb-1.5" key={title}><span className={index < 2 ? "text-yellow-300" : "text-cyan-300"}>{icon}</span><span><b className="block">{title}</b><span className="text-slate-400">{detail}</span></span><span className="text-slate-400">{time}</span></div>)}</div>;
}

function ElectricalTopIssues() {
  return <CompactNetworkTable headers={["Issue", "Location", "Impact", "Status"]} rows={[["High Loading", "Feeder 4", "High", "Active"], ["High Harmonics", "Feeder 2", "Medium", "Active"], ["Imbalance", "Building 3 Panel", "Medium", "Active"], ["Low Power Factor", "Feeder 2", "Low", "Monitoring"]]} />;
}

function ElectricalNetworkSummary({ data }: { data: DigitalTwinData }) {
  const counts = assetTypeCounts(data);
  return <MetricListSmall compact rows={[["Total Assets", data.assets.length > 0 ? String(data.assets.length) : "No Data"], ["Relationships", data.relationships.length > 0 ? String(data.relationships.length) : "No Data"], ["Active Meters", data.activeMeters > 0 ? String(data.activeMeters) : "No Data"], ["Transformer Capacity", formatKva(data.transformerKva)], ["System Voltage Levels", voltageLevels(data)], ["Digital Twin Version", data.version > 0 ? String(data.version) : "No Data"], ...counts.slice(0, 2)]} />;
}

function ElectricalOptimizationPotential({ data }: { data: DigitalTwinData }) {
  return <div className="space-y-2 text-[9px]">{[["◎","Capacity That Can Be Released",formatMw(data.recoveredCapacityKva)],["⚡","Losses That Can Be Reduced","No Data"],["◈","Power Factor Improvement Opportunity","No Data"],["⌁","Harmonic Reduction Potential","No Data"],["✣","Estimated Annual Savings","No Data"]].map(([icon,label,value]) => <div className="grid grid-cols-[22px_1fr_auto] border-b border-white/5 pb-1.5" key={label}><span className="text-[#05ff5e]">{icon}</span><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}</div>;
}

function ElectricalVoltageProfile() {
  return <div className="h-full"><div className="mb-1 flex justify-center gap-4 text-[8px]"><span className="text-[#05ff5e]">━ Avg Voltage</span><span className="text-yellow-300">● Phase A</span><span className="text-[#29b6f6]">● Phase B</span><span className="text-purple-400">● Phase C</span></div><svg className="h-[100px] w-full" viewBox="0 0 360 112"><g stroke="rgba(148,163,184,.18)">{[18,42,66,90].map((y)=><line key={y} x1="28" x2="350" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="20">520 V</text><text x="0" y="44">500 V</text><text x="0" y="68">480 V</text><text x="0" y="92">440 V</text></g>{["#05ff5e","#ffd740","#29b6f6","#a855f7"].map((color,index)=><polyline fill="none" key={color} points={`36,${50+index*5} 74,${49+index*4} 112,${51+index*4} 150,${50+index*5} 188,${52+index*3} 226,${49+index*4} 264,${51+index*4} 302,${50+index*4} 344,${49+index*4}`} stroke={color} strokeWidth="2"/>)}</svg><div className="flex justify-around text-[8px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div></div>;
}

function ElectricalFeederLoading({ data }: { data: DigitalTwinData }) {
  const rows = data.assets.filter((asset) => asset.type.toLowerCase().includes("feeder")).slice(0, 5).map((asset) => [asset.name, formatKva(asset.kvaRating), "green"] as [string, string, string]);
  return <div className="h-full"><div className="mb-2 flex justify-end gap-2 text-[8px]"><span className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">Asset Ratings</span><span className="rounded border border-cyan-300/12 px-3 py-1">No load trend</span></div>{rows.length > 0 ? <Bars rows={rows} /> : <NoDataPanel message="No feeder-level load source." />}<div className="mt-3 flex justify-between text-[8px] text-slate-500"><span>Load %: No Data</span><span>Trend: No Data</span></div></div>;
}

function AlertsDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[180px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-slate-400">♧</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[72px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Electrical Network &nbsp; › &nbsp; Alerts & Events &nbsp; › &nbsp; <span className="text-[#05ff5e]">Alerts Detail</span></div><h1 className="mt-1 text-xl font-light">Alerts Detail</h1><p className="mt-1 text-[9px] text-slate-400">Detailed information and analysis for selected network alert.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">◎ Acknowledge</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▣ Add Note</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Alerts</button></div>
        </div>
        <section className="grid h-[88px] grid-cols-[1fr_1fr_1fr_1fr_1fr_1.2fr] gap-2">
          <AlertSummaryCard icon="△" label="Critical Alerts" value="No Data" detail="No approved alert source" tone="red" />
          <AlertSummaryCard icon="△" label="High Alerts" value="No Data" detail="No approved alert source" tone="orange" />
          <AlertSummaryCard icon="△" label="Medium Alerts" value="No Data" detail="No approved alert source" tone="yellow" />
          <AlertSummaryCard icon="ⓘ" label="Low Alerts" value="No Data" detail="No approved alert source" tone="blue" />
          <AlertSummaryCard icon="♢" label="Total Active Alerts" value="No Data" detail="No approved alert source" tone="slate" />
          <div className="grid gap-1.5 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2 text-[9px]"><FieldLike label="Time Filter" value={data.dateRange || "No Data"} /><FieldLike label="Sort By" value="No Data⌄" /></div>
        </section>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.55fr_0.78fr] gap-2 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[236px_174px_1fr] gap-2 overflow-hidden">
            <DashboardPanel action="View All Alerts ->" title="ACTIVE ALERTS (No Data)" variant="enterprise"><AlertTable headers={["Severity", "Alert", "Location", "Asset / Feeder", "Triggered", "Value", "Threshold", "Status"]} rows={noDataTableRows("No approved alert/event source", 8)} /></DashboardPanel>
            <div className="grid min-h-0 grid-cols-[1fr_1fr] gap-2">
              <DashboardPanel title="ALERT TREND (Last 7 Days)" variant="enterprise"><NoDataPanel message="No approved alert trend source." /></DashboardPanel>
              <DashboardPanel action="View Location Map ->" title="ALERTS BY LOCATION" variant="enterprise"><NoDataPanel message="No approved alert location source." /></DashboardPanel>
            </div>
            <DashboardPanel action="View Full Alert History ->" title="ALERT HISTORY (Last 7 Days)" variant="enterprise"><AlertTable headers={["Cleared", "Severity", "Alert", "Location", "Asset / Feeder", "Duration", "Cleared By"]} rows={noDataTableRows("No approved alert history source", 7)} /></DashboardPanel>
          </div>
          <div className="grid min-h-0 grid-rows-[330px_88px_1fr] gap-2 overflow-hidden">
            <DashboardPanel title="ALERT INFORMATION" variant="enterprise"><MetricListSmall rows={noDataRows("No approved alert/event source")} /></DashboardPanel>
            <DashboardPanel title="ALERT ACTIONS" variant="enterprise"><AlertActions /></DashboardPanel>
            <DashboardPanel title="ALERT NOTES" variant="enterprise"><MetricListSmall rows={noDataRows("No approved alert note source")} /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function FieldLike({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-0.5 text-[7px] text-slate-500">{label}</div><div className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1 text-slate-300">{value}</div></div>;
}

function AlertSummaryCard({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "orange" | "red" | "slate" | "yellow"; value: string }) {
  const color = tone === "red" ? "text-red-400" : tone === "orange" ? "text-orange-400" : tone === "yellow" ? "text-yellow-300" : tone === "blue" ? "text-cyan-300" : "text-slate-300";
  return <article className="grid grid-cols-[52px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className={`text-4xl leading-none ${color}`}>{icon}</div><div><div className="text-[8px] text-slate-300">{label}</div><div className={`mt-1 text-2xl leading-none ${color}`}>{value}</div><div className="mt-1 text-[8px] text-slate-400">{detail}</div></div></article>;
}

function ActiveAlertsTable() {
  const rows = [["△ Critical", "High Load on Feeder 4", "Electrical Room", "Feeder 4", "May 18, 2025 10:12 AM", "92%", "> 90%", "Active"], ["△ High", "Harmonic Distortion on Feeder 2", "Electrical Room", "Feeder 2", "May 18, 2025 09:48 AM", "THD: 2.5%", "> 2.0%", "Active"], ["△ High", "Unbalanced Load", "Building 3 Panel", "Panel B3-P1", "May 18, 2025 09:32 AM", "18%", "> 15%", "Active"], ["△ Medium", "Capacitor Bank Switched Off", "Electrical Room", "Cap Bank 2", "May 18, 2025 08:33 AM", "Off", "Should be On", "Active"], ["△ Medium", "Low Power Factor", "Feeder 2", "Feeder 2", "May 18, 2025 07:59 AM", "0.87", "< 0.90", "Active"], ["△ Medium", "Transformer Temperature High", "Main Transformer", "TX-1", "May 18, 2025 07:41 AM", "78°C", "> 75°C", "Active"], ["ⓘ Low", "Gateway Communication", "IT Room", "Gateway-01", "May 18, 2025 06:22 AM", "Latency:120 ms", "> 200 ms", "Monitoring"]];
  return <AlertTable headers={["Severity", "Alert", "Location", "Asset / Feeder", "Triggered", "Value", "Threshold", "Status"]} rows={rows} />;
}

function AlertTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[8px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row.join("-")}>{row.map((cell, index) => <td className={cell.includes("Critical") || cell === "92%" || cell === "Active" ? "py-[6px] text-red-400" : cell.includes("High") || cell.includes("Medium") || cell === "THD: 2.5%" || cell === "78°C" ? "py-[6px] text-yellow-300" : cell.includes("Low") || cell === "Monitoring" ? "py-[6px] text-cyan-300" : "py-[6px] text-slate-300"} key={`${cell}-${index}`}>{index === row.length - 1 ? <span className="rounded border border-current px-2 py-0.5">{cell}</span> : cell}</td>)}</tr>)}</tbody></table>;
}

function AlertTrendChart() {
  return <div className="h-full"><div className="mb-1 flex justify-center gap-4 text-[8px]"><span className="text-red-400">━ Critical</span><span className="text-orange-400">━ High</span><span className="text-yellow-300">━ Medium</span><span className="text-cyan-300">━ Low</span></div><svg className="h-[116px] w-full" viewBox="0 0 420 120"><g stroke="rgba(148,163,184,.18)">{[20,44,68,92].map((y)=><line key={y} x1="24" x2="410" y1={y} y2={y}/>)}</g>{[["#ef4444","80 74 82 68 70 76 66"],["#ff8a00","58 50 62 56 54 66 58"],["#ffd740","36 28 42 32 30 46 36"],["#29b6f6","96 92 98 94 93 101 96"]].map(([color, ys]) => <polyline fill="none" key={color} points={String(ys).split(" ").map((y,i)=>`${38+i*58},${y}`).join(" ")} stroke={color} strokeWidth="2"/>)}</svg><div className="flex justify-around text-[8px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div><div className="mt-1 text-right text-[9px] text-[#05ff5e]">View Trend Analysis →</div></div>;
}

function AlertsByLocation() {
  return <div className="grid h-full grid-cols-[122px_1fr] items-center gap-4"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#ef4444 0 57%, #ff8a00 57% 71%, #ffd740 71% 85%, #29b6f6 85% 100%)" }}><div className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-2xl">7<br /><b className="text-[8px] font-normal text-slate-300">Total Alerts</b></div></div><div className="space-y-2 text-[8.5px]"><MetricLine label="Electrical Room" value="4 (57%)" /><MetricLine label="Building 3" value="1 (14%)" /><MetricLine label="Main Transformer" value="1 (14%)" /><MetricLine label="IT Room" value="1 (14%)" /></div></div>;
}

function AlertHistoryTable() {
  return <AlertTable headers={["Cleared", "Severity", "Alert", "Location", "Asset / Feeder", "Duration", "Cleared By"]} rows={[["May 17, 2025 06:45 PM", "△ Medium", "Power Factor Low", "Feeder 1", "Feeder 1", "1h 23m", "System Auto Clear"], ["May 17, 2025 02:30 PM", "△ High", "Harmonic Distortion High", "Feeder 5", "Feeder 5", "2h 05m", "John Martinez"], ["May 16, 2025 11:10 AM", "△ Medium", "Unbalanced Load", "Building 2 Panel", "Panel B2-P3", "3h 12m", "System Auto Clear"]]} />;
}

function AlertInformationDetail() {
  return <div className="space-y-[6px] text-[8.5px]"><div className="flex items-center gap-3"><span className="text-4xl text-red-400">△</span><b>High Load on Feeder 4</b><span className="ml-auto rounded border border-red-400 px-2 py-1 text-red-400">Critical</span></div><AlertInfoLine label="Location" value="Electrical Room" /><AlertInfoLine label="Asset / Feeder" value="Feeder 4" /><AlertInfoLine label="Triggered" value="May 18, 2025 10:12 AM" /><AlertInfoLine label="Duration" value="2h 15m" /><AlertInfoLine label="Current Value" value="92% of Capacity" valueClass="text-red-400" /><AlertInfoLine label="Threshold" value="> 90% of Capacity" /><div><div className="text-slate-400">Description</div><p className="mt-0.5 text-slate-300">Feeder 4 is operating at 92% load, exceeding the safe threshold.</p></div><div><div className="text-slate-400">Recommended Action</div><p className="mt-0.5 text-red-400">Reduce non-critical load or redistribute load to other feeders</p></div><div><div className="text-slate-400">Impact</div><p className="mt-0.5 text-slate-300">High risk of overload, potential equipment stress and downtime.</p></div></div>;
}

function AlertInfoLine({ label, value, valueClass = "text-slate-100" }: { label: string; value: string; valueClass?: string }) {
  return <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-white/5 pb-1"><span className="text-slate-400">{label}</span><span className={`text-right font-semibold ${valueClass}`}>{value}</span></div>;
}

function AlertActions() {
  return <div className="grid h-full grid-cols-4 gap-2 text-center text-[8px]"><button className="rounded bg-[#063b27] text-[#05ff5e]">▣<br />Acknowledge Alert</button><button className="rounded bg-[#3a2b05] text-yellow-300">◷<br />Snooze Alert⌄</button><button className="rounded bg-[#082544] text-cyan-300">♙<br />Assign To Team</button><button className="rounded bg-[#2b164a] text-purple-300">⚭<br />Create Work Order</button></div>;
}

function AlertNotes() {
  return <div className="flex h-full flex-col gap-2 text-[8.5px]"><div className="rounded border border-cyan-300/12 bg-[#061421] p-2"><div className="flex justify-between"><b>System</b><span className="text-slate-500">May 18, 2025 10:12 AM</span></div><div className="mt-1 text-slate-300">Alert triggered automatically by capacity monitoring system.</div></div><div className="rounded border border-cyan-300/12 bg-[#061421] p-2"><div className="flex justify-between"><b>Greg Dockery</b><span className="text-slate-500">May 18, 2025 10:15 AM</span></div><div className="mt-1 text-slate-300">Investigating load composition on Feeder 4.</div></div><div className="mt-auto grid grid-cols-[1fr_auto] gap-2"><div className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-slate-500">Add a note...</div><button className="rounded bg-[#087a35] px-4 text-[#05ff5e]">Add Note</button></div></div>;
}

function HealthEventsReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[94px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Network Health – Detail &nbsp; › &nbsp; <span className="text-[#05ff5e]">Recent Health Events</span></div><h1 className="mt-1 text-2xl font-light">Recent Health Events</h1><p className="mt-1 text-[10px] text-slate-300">Real-time log of health related events and system conditions.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Health Detail</button></div>
        </div>
        <section className="grid h-[94px] grid-cols-5 gap-3">
          <HealthEventKpi icon="△" label="Critical Events" value="No Data" detail="No approved event source" tone="red" />
          <HealthEventKpi icon="△" label="Warning Events" value="No Data" detail="No approved event source" tone="yellow" />
          <HealthEventKpi icon="ⓘ" label="Info Events" value="No Data" detail="No approved event source" tone="blue" />
          <HealthEventKpi icon="✓" label="Resolved Events" value="No Data" detail="No approved event source" tone="green" />
          <HealthEventKpi icon="▦" label="Total Events" value="No Data" detail="No approved event source" tone="slate" />
        </section>
        <section className="mt-3 grid h-[31px] grid-cols-[1.1fr_0.76fr_0.82fr_0.82fr_0.74fr_0.92fr_auto] gap-3 text-[9px]">
          <div className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-slate-500">⌕ &nbsp; Search events, assets, issues...</div>
          {["All Severities⌄", "All Event Types⌄", "All Assets⌄", "All Statuses⌄", "▣ May 12 - May 18, 2025⌄"].map((filter) => <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-300" key={filter}>{filter}</button>)}
          <button className="text-left text-slate-400">× Clear Filters</button>
        </section>
        <section className="mt-2 min-h-0 flex-1 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
          <HealthEventsReferenceTable rows={noDataTableRows("No approved health event source", 8)} />
        </section>
        <footer className="mt-2 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function HealthEventKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "green" | "red" | "slate" | "yellow"; value: string }) {
  const color = tone === "red" ? "text-red-400" : tone === "yellow" ? "text-yellow-300" : tone === "blue" ? "text-cyan-300" : tone === "green" ? "text-[#05ff5e]" : "text-slate-300";
  return <article className="grid grid-cols-[62px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4"><div className={`text-5xl leading-none ${color}`}>{icon}</div><div><div className="text-[9px] uppercase text-slate-300">{label}</div><div className={`mt-1 text-3xl leading-none ${color}`}>{value}</div><div className="mt-2 text-[9px] text-slate-400">{detail}</div></div></article>;
}

const healthEventRows = [
  ["May 18, 2025 10:12 AM", "Critical", "High load detected", "Load exceeds 92% capacity threshold", "Feeder C|115 kV", "Loading", "Active", "Ongoing|92% of capacity", "View Details"],
  ["May 18, 2025 09:48 AM", "Warning", "Harmonic distortion", "THD above 2.5% threshold", "Feeder B|115 kV", "Power Quality", "Active", "Ongoing|THD: 2.5%", "View Details"],
  ["May 18, 2025 08:33 AM", "Info", "Capacitor bank switched off automatically", "Reactive power correction system adjusted", "Main Switchgear|480 V", "System", "Resolved|08:36 AM", "3 min", "View Details"],
  ["May 18, 2025 07:15 AM", "Warning", "Power factor below target", "PF dropped below 0.90", "Building 3 Panel|480 V", "Power Quality", "Resolved|07:25 AM", "10 min|PF: 0.86", "View Details"],
  ["May 18, 2025 06:40 AM", "Warning", "Imbalance detected", "Phase imbalance above 2%", "Feeder 2|115 kV", "Power Quality", "Active", "Ongoing|Imbalance: 2.1%", "View Details"],
  ["May 17, 2025 11:22 PM", "Info", "Transformer temperature normal", "Temperature returned to normal range", "Main Transformer (T1)|69 kV / 480 V", "Thermal", "Resolved|11:28 PM", "6 min|Temp: 62°C", "View Details"],
  ["May 17, 2025 09:05 PM", "Warning", "High neutral current", "Neutral current above 80A", "Panel C2|480 V", "Power Quality", "Resolved|09:18 PM", "13 min|Peak: 92A", "View Details"],
  ["May 17, 2025 05:30 PM", "Info", "Demand response event started", "DR event started by utility signal", "Site Wide|All", "Demand Response", "Resolved|07:30 PM", "2 hrs", "View Details"],
  ["May 17, 2025 02:10 PM", "Warning", "Overvoltage condition", "Voltage above upper limit", "Feeder D|115 kV", "Voltage", "Resolved|02:18 PM", "8 min|Max: 1.07 pu", "View Details"],
  ["May 17, 2025 12:22 PM", "Info", "Load restored", "Load returned after breaker reset", "Panel A1|480 V", "System", "Resolved|11:24 PM", "2 min", "View Details"],
];

function HealthEventsReferenceTable({ rows = healthEventRows }: { rows?: string[][] }) {
  const headers = ["Time ↕", "Severity ↕", "Event ↕", "Asset", "Category ↕", "Status ↕", "Duration / Impact", "Actions"];
  return <div className="flex h-full flex-col"><table className="w-full table-fixed text-left text-[9px]"><colgroup><col className="w-[13%]" /><col className="w-[8%]" /><col className="w-[22%]" /><col className="w-[14%]" /><col className="w-[12%]" /><col className="w-[10%]" /><col className="w-[12%]" /><col className="w-[9%]" /></colgroup><thead className="text-slate-400"><tr>{headers.map((header) => <th className="pb-3 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <HealthEventRow key={row.join("-")} row={row} />)}</tbody></table><div className="mt-auto grid grid-cols-3 items-center pt-3 text-[9px] text-slate-400"><span>Showing No Data events</span><div className="flex justify-center gap-2"><button className="rounded border border-cyan-300/12 px-3 py-2">‹</button><button className="rounded bg-[#087a35] px-3 py-2 text-[#05ff5e]">1</button><button className="rounded border border-cyan-300/12 px-3 py-2">›</button></div><span className="justify-self-end">Rows per page: <b className="ml-2 rounded border border-cyan-300/12 px-4 py-2 text-slate-300">10⌄</b></span></div></div>;
}

function HealthEventRow({ row }: { row: string[] }) {
  const [time, severity, title, detail, asset, category, status, duration, action] = row;
  return <tr className="border-t border-white/7 align-top"><td className="py-[9px] text-slate-300">{time}</td><td className="py-[9px]"><HealthSeverity severity={severity} /></td><td className="py-[9px]"><b className="block text-slate-100">{title}</b><span className="text-slate-400">{detail}</span></td><td className="py-[9px] text-slate-200">{asset.split("|").map((part) => <span className="block" key={part}>{part}</span>)}</td><td className="py-[9px] text-slate-300">{category}</td><td className="py-[7px]"><HealthStatus status={status} /></td><td className="py-[9px] text-slate-300">{duration.split("|").map((part, index) => <span className={index === 0 && (part === "Ongoing" || part.includes("92%")) ? "block text-red-300" : "block"} key={part}>{index === 0 && part === "Ongoing" ? "• " : ""}{part}</span>)}</td><td className="py-[8px] text-right"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5 text-[8px] text-slate-200">{action}</button></td></tr>;
}

function HealthSeverity({ severity }: { severity: string }) {
  const color = severity === "Critical" ? "text-red-400" : severity === "Warning" ? "text-yellow-300" : "text-cyan-300";
  const icon = severity === "Critical" ? "ⓘ" : severity === "Warning" ? "△" : "ⓘ";
  return <span className={`font-semibold ${color}`}>{icon} &nbsp;{severity}</span>;
}

function HealthStatus({ status }: { status: string }) {
  const [state, time] = status.split("|");
  const active = state === "Active";
  return <span className={`inline-block min-w-[64px] rounded border px-2 py-1 text-center text-[8px] ${active ? "border-red-400 text-red-400" : "border-[#05ff5e]/50 bg-[#063b27]/60 text-[#05ff5e]"}`}>{state}{time ? <><br />{time}</> : null}</span>;
}

function HealthDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-full min-h-0 flex-col px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[66px] items-center justify-between">
          <div><h1 className="text-2xl font-light">Network Health – Detail</h1><p className="mt-1 text-[10px] text-slate-300">Comprehensive health analysis of your electrical distribution system</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div>
        </div>
        <section className="grid h-[720px] min-h-0 shrink-0 grid-cols-[0.74fr_2.08fr_1fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[180px_150px_128px_1fr] gap-3 overflow-hidden">
            <HealthBox title="HEALTH SCORE"><HealthScoreGauge data={data} /></HealthBox>
            <HealthBox title="HEALTH BREAKDOWN"><NoDataPanel message="No approved per-category health model." /></HealthBox>
            <HealthBox title="HEALTH TREND (30 DAYS)"><NoDataPanel message="No approved health trend source." /></HealthBox>
            <HealthBox title="STATUS LEGEND"><StatusLegend /></HealthBox>
          </div>
          <div className="grid min-h-0 grid-rows-[475px_1fr] gap-3 overflow-hidden">
            <HealthBox title="HEALTH BY ASSET HIERARCHY ⓘ  ⓘ"><HealthAssetHierarchy data={data} /></HealthBox>
            <HealthBox title="HEALTH SCORE OVER TIME (BY CATEGORY) ⓘ  ⓘ"><NoDataPanel message="No approved category health trend source." /></HealthBox>
          </div>
          <div className="grid min-h-0 grid-rows-[184px_210px_1fr] gap-3 overflow-hidden">
            <HealthBox title="TOP HEALTH RISK CONTRIBUTORS ⓘ"><NoDataPanel message="No approved health risk contributor source." /></HealthBox>
            <HealthBox title="HEALTH IMPACT MATRIX ⓘ"><NoDataPanel message="No approved health impact model." /></HealthBox>
            <HealthBox title="RECENT HEALTH EVENTS"><MetricListSmall rows={noDataRows("No approved health event source")} /></HealthBox>
          </div>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function HealthBox({ children, title }: { children: ReactNode; title: string }) {
  return <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h2 className="mb-2 shrink-0 text-[10px] font-semibold text-slate-100">{title}</h2><div className="min-h-0 flex-1 overflow-hidden">{children}</div></article>;
}

function HealthScoreGauge({ data }: { data: DigitalTwinData }) {
  const score = healthScore(data);
  return <div className="grid h-full place-items-center"><div className="relative grid size-32 place-items-center rounded-full" style={{ background: `conic-gradient(#05ff5e 0 ${score || 0}%, #0f2533 ${score || 0}% 100%)` }}><div className="grid size-24 place-items-center rounded-full bg-[#061521] text-center"><b className="text-3xl font-light">{score ? String(score) : "No Data"}</b><span className="-mt-6 text-[10px] font-semibold">{score ? "CBI" : ""}</span></div><span className="absolute bottom-2 left-5 text-[8px] text-slate-400">0</span><span className="absolute bottom-2 right-4 text-[8px] text-slate-400">100</span></div><div className="mt-1 text-center text-[10px] text-[#05ff5e]">No Data <span className="text-slate-400">trend source</span></div></div>;
}

function HealthBreakdown() {
  return <div className="space-y-2 text-[9px]">{[["Transformers", "97%"], ["Switchgear", "94%"], ["Feeders", "92%"], ["Panels", "90%"], ["Loads", "96%"], ["Power Quality", "93%"], ["Protection", "95%"]].map(([label, value]) => <div className="grid grid-cols-[82px_1fr_30px] items-center gap-2" key={label}><span>{label}</span><span className="h-2 rounded bg-slate-800"><span className="block h-2 rounded bg-[#05ff5e]" style={{ width: value }} /></span><b>{value}</b></div>)}</div>;
}

function HealthTrendMini() {
  return <div className="h-full"><svg className="h-[96px] w-full" viewBox="0 0 220 100"><g stroke="rgba(148,163,184,.18)">{[18,40,62,84].map((y)=><line key={y} x1="20" x2="214" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="20">100</text><text x="5" y="42">75</text><text x="5" y="64">50</text><text x="5" y="86">25</text></g><polyline fill="none" points="24,62 48,58 72,63 96,50 120,54 144,43 168,51 192,48 214,44" stroke="#05ff5e" strokeWidth="2"/>{[24,48,72,96,120,144,168,192,214].map((x,index)=><circle cx={x} cy={[62,58,63,50,54,43,51,48,44][index]} fill="#061521" key={x} r="3" stroke="#05ff5e" strokeWidth="2"/>)}<text fill="#05ff5e" fontSize="16" x="188" y="70">95</text></svg><div className="flex justify-between text-[7px] text-slate-500"><span>Apr 19</span><span>Apr 26</span><span>May 3</span><span>May 10</span><span>May 18</span></div></div>;
}

function StatusLegend() {
  return <div className="space-y-2 text-[9px]">{[["#05ff5e", "Excellent (90 – 100)"], ["#8bd63f", "Good (75 – 89)"], ["#ffd740", "Fair (50 – 74)"], ["#ff8a00", "Poor (25 – 49)"], ["#ef4444", "Critical (0 – 24)"], ["#94a3b8", "Offline"]].map(([color, label]) => <div className="flex items-center gap-2" key={label}><span className="size-2 rounded-full" style={{ backgroundColor: color }} /><span>{label}</span></div>)}</div>;
}

const healthAssets = [
  ["⌄", "♜", "Utility (Grid)", "98%", "Excellent", "0", "green"],
  ["⌄", "⚙", "Main Transformer (T1)", "97%", "Excellent", "0", "green"],
  ["⌄", "▣", "Main Switchgear", "95%", "Excellent", "1", "green"],
  ["›", "", "Feeder A", "96%", "Excellent", "0", "green"],
  ["›", "", "Feeder B", "87%", "Good", "2", "yellow"],
  ["›", "", "Feeder C", "64%", "Fair", "3", "red"],
  ["›", "", "Feeder D", "94%", "Excellent", "1", "green"],
  ["›", "", "Feeder E", "94%", "Excellent", "0", "green"],
  ["›", "▣", "Panels (Total 24)", "90%", "Good", "3", "yellow"],
  ["›", "⌂", "Loads (Total 312)", "96%", "Excellent", "2", "green"],
  ["›", "⌁", "Power Quality", "93%", "Excellent", "1", "yellow"],
  ["›", "◇", "Protection System", "95%", "Excellent", "0", "green"],
];

function HealthAssetHierarchy({ data }: { data: DigitalTwinData }) {
  const rows = data.assets.length > 0 ? data.assets.slice(0, 10).map((asset) => ["›", "▣", asset.name, data.cbiScore > 0 ? String(Math.round(data.cbiScore)) : "No Data", asset.status || "No Data", "No Data", "green"]) : [["›", "▣", "No Data", "No Data", "No Data", "No Data", "green"]];
  return <table className="w-full text-left text-[8.8px]"><thead className="text-slate-400"><tr>{["Asset", "Health Score", "Status", "Issues", "Trend (7 Days)", "Details"].map((h)=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([arrow, icon, asset, score, status, issues, tone], index) => <tr className="border-t border-white/6" key={`${asset}-${index}`}><td className="py-[7.8px]"><span className="mr-2 text-slate-400">{arrow}</span><span className="mr-2 text-cyan-300">{icon}</span><span>{asset}</span></td><td className="py-[7.8px] font-semibold text-[#05ff5e]">{score}</td><td className="py-[7.8px]"><span className="mr-1 text-[#05ff5e]">●</span>{status}</td><td className="py-[7.8px]">{issues}</td><td className="py-[7.8px]"><MiniSpark tone={tone} /></td><td className="py-[6.4px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-0.5 text-[8px] text-cyan-300">View</button></td></tr>)}</tbody></table>;
}

function MiniSpark({ tone }: { tone: string }) {
  const color = tone === "red" ? "#ef4444" : tone === "yellow" ? "#ff8a00" : "#05ff5e";
  return <svg className="h-4 w-28" viewBox="0 0 112 16"><polyline fill="none" points="0,8 14,9 28,7 42,8 56,5 70,9 84,6 98,8 112,5" stroke={color} strokeWidth="2" />{[0,14,28,42,56,70,84,98,112].map((x,index)=><circle cx={x} cy={[8,9,7,8,5,9,6,8,5][index]} fill={color} key={x} r="1.5"/> )}</svg>;
}

function HealthScoreOverTime() {
  const colors = ["#05ff5e", "#29b6f6", "#ffd740", "#ff00ff", "#00e5ff", "#ff8a00"];
  return <div className="h-full"><div className="mb-1 flex justify-center gap-4 text-[8px]">{["Transformers", "Switchgear", "Feeders", "Panels", "Loads", "Power Quality"].map((label, index)=><span key={label} style={{ color: colors[index] }}>━ {label}</span>)}</div><div className="grid h-[150px] grid-cols-[1fr_54px] gap-2"><svg className="h-full w-full" viewBox="0 0 620 150"><g stroke="rgba(148,163,184,.18)">{[20,50,80,110,140].map((y)=><line key={y} x1="30" x2="610" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="24">100</text><text x="8" y="54">75</text><text x="8" y="84">50</text><text x="8" y="114">25</text><text x="12" y="144">0</text></g>{colors.map((color,index)=><polyline fill="none" key={color} points={`34,${44+index*7} 86,${42+index*5} 138,${40+index*6} 190,${48+index*5} 242,${45+index*4} 294,${44+index*5} 346,${42+index*5} 398,${45+index*3} 450,${40+index*4} 502,${50+index*8} 554,${48+index*4} 606,${44+index*5}`} stroke={color} strokeWidth="2"/>)}</svg><div className="space-y-2 text-[11px]"><div className="text-slate-400">Current Score</div>{["97%", "96%", "92%", "90%", "96%", "93%"].map((score,index)=><div key={score} style={{ color: colors[index] }}>{score}</div>)}</div></div><div className="flex justify-between text-[8px] text-slate-500"><span>Apr 19</span><span>Apr 22</span><span>Apr 25</span><span>Apr 28</span><span>May 1</span><span>May 4</span><span>May 7</span><span>May 10</span><span>May 13</span><span>May 16</span><span>May 18</span></div></div>;
}

function TopRiskContributors() {
  return <div className="grid h-full grid-cols-[122px_1fr] items-center gap-4"><div className="grid size-28 place-items-center rounded-full" style={{ background: "conic-gradient(#ef4444 0 33%, #ff8a00 33% 66%, #ffd740 66% 83%, #29b6f6 83% 100%)" }}><div className="grid size-16 place-items-center rounded-full bg-[#061521] text-center text-sm">Total<br /><b className="text-xl">6</b><br /><span className="text-[8px]">Issues</span></div></div><div className="space-y-3 text-[9px]"><RiskLine color="#ef4444" label="High Loading" value="2 (33%)" /><RiskLine color="#ff8a00" label="Harmonics" value="2 (33%)" /><RiskLine color="#ffd740" label="Imbalance" value="1 (17%)" /><RiskLine color="#29b6f6" label="Low Power Factor" value="1 (17%)" /></div></div>;
}

function RiskLine({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="flex justify-between gap-2"><span><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><span>{value}</span></div>;
}

function HealthImpactMatrix() {
  const rows = [["High Impact", "0", "1", "2"], ["Medium Impact", "1", "1", "1"], ["Low Impact", "1", "0", "0"]];
  return <div className="grid h-full grid-rows-[22px_1fr]"><div className="ml-[78px] grid grid-cols-3 text-center text-[9px]"><span>Low</span><span>Medium</span><span>High</span></div><div className="grid grid-cols-[78px_1fr]"><div className="grid grid-rows-3 text-[9px]"><span className="pt-5">High Impact</span><span className="pt-5">Medium Impact</span><span className="pt-5">Low Impact</span></div><div className="grid grid-rows-3 overflow-hidden rounded">{rows.map((row) => <div className="grid grid-cols-3" key={row[0]}>{row.slice(1).map((value, index) => <div className={value === "2" ? "grid place-items-center border border-[#061521] bg-red-600 text-lg" : value === "1" && index === 1 ? "grid place-items-center border border-[#061521] bg-yellow-400 text-lg text-[#061421]" : value === "1" ? "grid place-items-center border border-[#061521] bg-green-700 text-lg" : "grid place-items-center border border-[#061521] bg-green-900 text-lg"} key={`${row[0]}-${index}`}>{value}</div>)}</div>)}</div></div></div>;
}

function RecentHealthEventsCard() {
  const rows = [["△", "High load detected on Feeder C", "May 18, 2025 10:12 AM", "text-red-400"], ["△", "Harmonic distortion on Feeder B", "May 18, 2025 09:48 AM", "text-yellow-300"], ["ⓘ", "Capacitor bank switched off automatically", "May 18, 2025 08:33 AM", "text-cyan-300"]];
  return <div className="flex h-full flex-col text-[9px]">{rows.map(([icon, title, time, color]) => <div className="grid grid-cols-[26px_1fr_auto] items-center gap-2 border-b border-white/6 py-3" key={title}><span className={`text-xl ${color}`}>{icon}</span><span>{title}<br /><span className="text-slate-400">{time}</span></span><span className="text-slate-400">›</span></div>)}<div className="mt-auto text-right text-[10px] text-[#05ff5e]">View All Events →</div></div>;
}

function PeakEventsReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[92px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Load Detail &nbsp; › &nbsp; <span className="text-[#05ff5e]">Peak Events</span></div><h1 className="mt-1 text-2xl font-light">Peak Events (7 Days)</h1><p className="mt-1 text-[10px] text-slate-300">Detailed list of peak demand events and system load spikes.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Load Detail</button></div>
        </div>
        <section className="grid h-[86px] grid-cols-5 gap-3">
          <PeakKpi icon="◌" label="Total Peak Events" value="No Data" detail="No approved peak-event source" tone="purple" />
          <PeakKpi icon="↗" label="Highest Peak Demand ⓘ" value="No Data" detail="No approved peak-event source" tone="purple" />
          <PeakKpi icon="⌁" label="Average Peak Demand ⓘ" value="No Data" detail="No approved trend source" tone="blue" />
          <PeakKpi icon="ϟ" label="Total Energy At Peak ⓘ" value="No Data" detail="No approved event energy source" tone="green" />
          <PeakKpi icon="◷" label="Avg Peak Duration ⓘ" value="No Data" detail="No approved event duration source" tone="orange" />
        </section>
        <PeakEventsFilterRow />
        <section className="mt-2 grid h-[544px] min-h-0 grid-cols-[1.46fr_0.52fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[206px_1fr] gap-3 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[1fr_1fr] gap-3">
              <PeakBox title="PEAK DEMAND TREND (7 DAYS)"><NoDataPanel message="No approved peak-demand trend source." /></PeakBox>
              <PeakBox title="PEAK EVENTS BY TIME OF DAY"><NoDataPanel message="No approved peak-event time source." /></PeakBox>
            </div>
            <PeakBox title="PEAK EVENTS LIST (No Data)"><PeakEventsReferenceList rows={noDataTableRows("No approved peak-event source", 10)} /></PeakBox>
          </div>
          <div className="grid min-h-0 grid-rows-[206px_1fr] gap-3 overflow-hidden">
            <PeakBox title="PEAK EVENT IMPACT (7 DAYS)"><MetricListSmall rows={noDataRows("No approved peak-event impact source")} /></PeakBox>
            <PeakBox title="EVENT DETAIL"><MetricListSmall rows={noDataRows("No approved peak-event detail source")} /></PeakBox>
          </div>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function PeakBox({ children, title }: { children: ReactNode; title: string }) {
  return <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h2 className="mb-2 shrink-0 text-[10px] font-semibold text-slate-100">{title}</h2><div className="min-h-0 flex-1 overflow-hidden">{children}</div></article>;
}

function PeakKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "green" | "orange" | "purple"; value: string }) {
  const color = tone === "green" ? "text-[#05ff5e]" : tone === "blue" ? "text-cyan-300" : tone === "orange" ? "text-orange-400" : "text-purple-400";
  return <article className="grid grid-cols-[54px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className={`grid size-10 place-items-center rounded-full border text-2xl ${color}`}>{icon}</div><div><div className="text-[8px] uppercase text-slate-300">{label}</div><div className={`mt-1 text-2xl leading-none ${color}`}>{value}</div><div className="mt-1 text-[9px] text-slate-400">{detail}</div></div></article>;
}

function PeakEventsFilterRow() {
  return <section className="mt-3 grid h-[32px] grid-cols-[1.1fr_0.62fr_0.62fr_0.72fr_0.86fr_34px_auto] gap-3 text-[9px]"><div className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-slate-500">⌕ &nbsp; Search events, feeders, assets...</div>{["All Feeders⌄", "All Severities⌄", "All Event Types⌄", "▣ May 12 - May 18, 2025⌄"].map((filter) => <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-300" key={filter}>{filter}</button>)}<button className="rounded border border-cyan-300/12 bg-[#061421] text-slate-300">↗</button><button className="text-left text-slate-400">× Clear Filters</button></section>;
}

function PeakDemandTrend() {
  const points = [[44,106],[94,98],[144,88],[194,61],[244,68],[294,42],[344,72],[394,82]];
  const labels = ["5.21", "5.43", "5.98", "5.81", "6.31", "5.77", "5.65"];
  return <div className="h-full"><div className="mb-1 flex justify-between text-[8px]"><span>MW</span><span className="text-purple-400">● Peak Demand (MW)</span></div><svg className="h-[140px] w-full" viewBox="0 0 430 150"><defs><linearGradient id="peakArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#7c3aed" stopOpacity=".48"/><stop offset="1" stopColor="#7c3aed" stopOpacity=".05"/></linearGradient></defs><g stroke="rgba(148,163,184,.18)">{[24,54,84,114,140].map((y)=><line key={y} x1="34" x2="420" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="5" y="28">7.0</text><text x="5" y="58">6.0</text><text x="5" y="88">5.0</text><text x="5" y="118">4.0</text><text x="5" y="143">3.0</text></g><polygon fill="url(#peakArea)" points={`44,106 ${points.map(([x,y])=>`${x},${y}`).join(" ")} 394,140 44,140`} /><polyline fill="none" points={points.map(([x,y])=>`${x},${y}`).join(" ")} stroke="#a855f7" strokeWidth="3"/>{points.map(([x,y], index)=><g key={x}><circle cx={x} cy={y} fill="#061521" r="5" stroke="#a855f7" strokeWidth="3"/>{labels[index] ? <text fill="#e2e8f0" fontSize="9" textAnchor="middle" x={x} y={y - 14}>{labels[index]}</text> : null}</g>)}</svg><div className="flex justify-around text-[8px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div></div>;
}

function PeakTimeHeatmap() {
  const rows = ["Mon 5/12", "Tue 5/13", "Wed 5/14", "Thu 5/15", "Fri 5/16", "Sat 5/17", "Sun 5/18"];
  const cols = ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];
  return <div className="h-full text-[8px]"><div className="mb-1 ml-14 grid grid-cols-8 text-center text-slate-400">{cols.map((c)=><span key={c}>{c}</span>)}</div><div className="grid grid-cols-[52px_1fr] gap-2"><div className="grid grid-rows-7 gap-1 text-slate-300">{rows.map((r)=><span key={r}>{r}</span>)}</div><div className="grid grid-cols-8 gap-1">{Array.from({ length: 56 }).map((_, index) => { const col = index % 8; const row = Math.floor(index / 8); const color = col < 2 ? "#087f3d" : col < 4 ? "#16a34a" : col === 4 ? "#d9dc1e" : col === 5 ? "#f59e0b" : col === 6 && row < 5 ? "#ef4444" : "#ef4444"; return <span className="h-[17px] rounded-sm border border-[#061521]" key={index} style={{ backgroundColor: color, opacity: 0.72 + ((row + col) % 3) * 0.09 }} />; })}</div></div><div className="mt-2 grid grid-cols-[1fr_220px_1fr] items-center text-slate-400"><span className="text-right">Low</span><span className="mx-3 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#05a64a,#facc15,#ef4444)" }} /><span>High</span></div></div>;
}

const peakEventRowsRef = [
  ["1", "May 16, 2025 2:18 PM", "6.31 MW", "37 min", "107%", "Feeder 4", "Demand Spike", "Critical", "26.4 MWh", "High"],
  ["2", "May 15, 2025 1:47 PM", "6.12 MW", "29 min", "104%", "Feeder 1", "Demand Spike", "Critical", "22.1 MWh", "High"],
  ["3", "May 14, 2025 2:03 PM", "5.98 MW", "31 min", "102%", "Feeder 3", "Demand Spike", "Warning", "20.3 MWh", "High"],
  ["4", "May 13, 2025 2:27 PM", "5.81 MW", "26 min", "99%", "Feeder 1", "Demand Spike", "Warning", "18.6 MWh", "Medium"],
  ["5", "May 17, 2025 1:55 PM", "5.77 MW", "34 min", "98%", "Feeder 4", "Demand Spike", "Warning", "19.2 MWh", "Medium"],
  ["6", "May 18, 2025 12:41 PM", "5.65 MW", "22 min", "96%", "Feeder 2", "Demand Spike", "Warning", "13.8 MWh", "Medium"],
  ["7", "May 16, 2025 9:18 AM", "5.42 MW", "18 min", "92%", "Feeder 3", "Morning Peak", "Moderate", "9.6 MWh", "Medium"],
  ["8", "May 15, 2025 9:02 AM", "5.21 MW", "16 min", "89%", "Feeder 1", "Morning Peak", "Moderate", "8.2 MWh", "Low"],
  ["9", "May 12, 2025 1:32 PM", "5.08 MW", "21 min", "87%", "Feeder 5", "Demand Spike", "Info", "8.9 MWh", "Low"],
  ["10", "May 14, 2025 9:35 AM", "4.97 MW", "14 min", "85%", "Feeder 2", "Morning Peak", "Info", "6.3 MWh", "Low"],
];

function PeakEventsReferenceList({ rows = peakEventRowsRef }: { rows?: string[][] }) {
  const headers = ["Rank", "Date / Time", "Peak Demand", "Duration", "% of Capacity", "Feeder", "Event Type", "Severity", "Energy at Peak", "Impact", "Actions"];
  return <div className="flex h-full flex-col"><table className="w-full table-fixed text-left text-[8px]"><colgroup><col className="w-[5%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[8%]" /><col className="w-[10%]" /><col className="w-[8%]" /><col className="w-[11%]" /><col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[7%]" /><col className="w-[8%]" /></colgroup><thead className="text-slate-400"><tr>{headers.map((h)=><th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row)=><PeakEventTableRow key={row.join("-")} row={row} />)}</tbody></table><div className="mt-auto grid grid-cols-3 items-center pt-2 text-[9px] text-slate-400"><span>Showing No Data events</span><div className="flex justify-center gap-2"><button className="rounded border border-cyan-300/12 px-3 py-1.5">‹</button><button className="rounded bg-[#087a35] px-3 py-1.5 text-[#05ff5e]">1</button><button className="rounded border border-cyan-300/12 px-3 py-1.5">›</button></div><span className="justify-self-end">Rows per page: <b className="ml-2 rounded border border-cyan-300/12 px-4 py-1.5 text-slate-300">10⌄</b></span></div></div>;
}

function PeakEventTableRow({ row }: { row: string[] }) {
  const [rank, date, demand, duration, capacity, feeder, eventType, severity, energy, impact] = row;
  const capClass = Number.parseInt(capacity) >= 100 ? "text-red-400" : Number.parseInt(capacity) >= 95 ? "text-orange-400" : "text-orange-300";
  const severityClass = severity === "Critical" ? "text-red-400" : severity === "Warning" ? "text-orange-400" : severity === "Moderate" ? "text-yellow-300" : "text-[#05ff5e]";
  const impactClass = impact === "High" ? "text-red-400" : impact === "Medium" ? "text-orange-400" : "text-[#05ff5e]";
  return <tr className="border-t border-white/6"><td className="py-[3.6px]">{rank}</td><td className="py-[3.6px]">{date}</td><td className="py-[3.6px] font-semibold">{demand}</td><td className="py-[3.6px]">{duration}</td><td className={`py-[3.6px] font-semibold ${capClass}`}>{capacity}</td><td className="py-[3.6px]">{feeder}</td><td className="py-[3.6px]">{eventType}</td><td className={`py-[3.6px] font-semibold ${severityClass}`}>● {severity}</td><td className="py-[3.6px]">{energy}</td><td className={`py-[3.6px] font-semibold ${impactClass}`}>{impact}</td><td className="py-[2px] text-right"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-0.5 text-[8px]">View Details</button></td></tr>;
}

function PeakImpactSummary() {
  return <div className="space-y-3 text-[9px]">{[["◎", "Total Energy Impact", "142.8 MWh", "text-purple-400"], ["↗", "Max Demand Impact", "+2.04 MW", "text-purple-400"], ["◷", "Avg Duration", "31 min", "text-red-400"], ["◉", "Events > 6 MW", "3", "text-orange-400"], ["◉", "Events > 90% Capacity", "5", "text-orange-400"]].map(([icon, label, value, color]) => <div className="grid grid-cols-[24px_1fr_auto] border-b border-white/6 pb-2" key={label}><span className={color}>{icon}</span><span>{label}</span><b className="text-slate-100">{value}</b></div>)}</div>;
}

function PeakEventDetail() {
  return <div className="flex h-full flex-col text-[8px]"><div className="mb-1.5 flex items-center justify-between"><span className="text-purple-300">◉ May 16, 2025 2:18 PM</span><span className="rounded border border-red-400 px-2 py-0.5 text-red-400">Critical</span></div><div className="mb-1.5 grid grid-cols-2 gap-4"><div><div className="text-2xl font-light">6.31 MW</div><div className="text-slate-400">Peak Demand</div></div><div><div className="text-base font-semibold">Feeder 4</div><div className="text-slate-400">Primary Source</div></div></div>{[["Duration", "37 min"], ["% of Capacity", "107%"], ["Energy at Peak", "26.4 MWh"], ["Event Type", "Demand Spike"], ["Start Time", "May 16, 2025 1:41 PM"], ["End Time", "May 16, 2025 2:18 PM"], ["Weather", "Clear, 28°C"], ["Notes", "High production load + HVAC demand >"]].map(([label, value]) => <div className="flex justify-between gap-3 border-b border-white/6 py-[3.5px]" key={label}><span className="text-slate-400">{label}</span><b className="text-right">{value}</b></div>)}<button className="mt-auto rounded border border-[#05ff5e] py-2 text-[9px] text-[#05ff5e]">View Full Event Analysis →</button></div>;
}

function PeakFullAnalysisReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[88px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Load Detail &nbsp; › &nbsp; Peak Events &nbsp; › &nbsp; <span className="text-[#05ff5e]">Full Event Analysis</span></div><h1 className="mt-1 text-2xl font-light">Full Event Analysis</h1><p className="mt-1 text-[10px] text-slate-300">Comprehensive analysis of peak demand event and system impact.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Peak Events</button></div>
        </div>
        <section className="h-[64px] rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
          <div className="mb-1 text-[9px] font-semibold">EVENT OVERVIEW</div>
          <div className="grid grid-cols-7 gap-4 text-[8.5px]"><InfoMini label="Event ID" value="No Data" /><InfoMini label="Event Type" value="No Data" /><InfoMini label="Severity" value="No Data" /><InfoMini label="Status" value="No Data" /><InfoMini label="Start Time" value="No Data" /><InfoMini label="End Time" value="No Data" /><InfoMini label="Duration" value="No Data" /></div>
        </section>
        <section className="mt-2 grid h-[78px] grid-cols-6 gap-3">
          <PeakKpi icon="◌" label="Peak Demand" value="No Data" detail="No approved event source" tone="purple" />
          <PeakKpi icon="ϟ" label="Energy At Peak ⓘ" value="No Data" detail="No approved event source" tone="blue" />
          <PeakKpi icon="◷" label="% Of Capacity ⓘ" value="No Data" detail="No approved event source" tone="orange" />
          <PeakKpi icon="ϟ" label="Load Factor Impact ⓘ" value="No Data" detail="No approved event source" tone="green" />
          <PeakKpi icon="◷" label="Recovered In" value="No Data" detail="No approved event source" tone="blue" />
          <PeakKpi icon="$" label="Cost Impact" value="No Data" detail="No approved cost model" tone="orange" />
        </section>
        <section className="mt-2 grid h-[546px] min-h-0 grid-cols-[1.28fr_0.56fr_0.56fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[282px_1fr] gap-3 overflow-hidden">
            <PeakBox title="DEMAND TIMELINE (5 MIN INTERVAL)"><NoDataPanel message="No approved 5-minute event timeline source." /></PeakBox>
            <div className="grid min-h-0 grid-cols-[0.78fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="LOAD CONTRIBUTION AT PEAK"><MetricListSmall rows={noDataRows("No approved peak load contribution source")} /></PeakBox>
              <PeakBox title="AFFECTED ASSETS"><NetworkTable headers={["Asset","Type","Peak Load","% Capacity","Impact"]} rows={noDataTableRows("No approved affected-assets event source", 5)} /></PeakBox>
            </div>
          </div>
          <div className="grid min-h-0 grid-rows-[282px_1fr] gap-3 overflow-hidden">
            <PeakBox title="EVENT MARKERS"><MetricListSmall rows={noDataRows("No approved event marker source")} /></PeakBox>
            <PeakBox title="ROOT CAUSE ANALYSIS"><MetricListSmall rows={noDataRows("No approved root cause model")} /></PeakBox>
          </div>
          <div className="grid min-h-0 grid-rows-[170px_156px_1fr] gap-3 overflow-hidden">
            <PeakBox title="IMPACT SUMMARY"><MetricListSmall rows={noDataRows("No approved event impact source")} /></PeakBox>
            <PeakBox title="SEVERITY & THRESHOLDS"><MetricListSmall rows={noDataRows("No approved event threshold source")} /></PeakBox>
            <PeakBox title="EVENT ANNOTATIONS"><MetricListSmall rows={noDataRows("No approved event annotation source")} /></PeakBox>
          </div>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function DemandTimelineFull() {
  const actual = "20,150 42,132 64,142 86,116 108,126 130,104 152,96 174,82 196,72 218,58 240,30 262,70 284,88 306,104 328,112 350,120 372,126 394,118 416,124 438,118 460,122 482,112 504,118 526,114 548,108";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-[#05ff5e]">━ Actual Load (MW)</span><span className="text-cyan-300">⋯ Average Load (MW)</span><span className="text-purple-400">● Peak Demand (MW)</span><span className="text-orange-400">⋯ Capacity Limit (MW)</span></div><svg className="h-[212px] w-full" viewBox="0 0 570 220"><defs><linearGradient id="loadAreaFull" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#05ff5e" stopOpacity=".42" /><stop offset="1" stopColor="#05ff5e" stopOpacity=".04" /></linearGradient></defs><g stroke="rgba(148,163,184,.18)">{[40,80,120,160,200].map((y)=><line key={y} x1="28" x2="560" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="44">8</text><text x="0" y="84">6</text><text x="0" y="124">4</text><text x="0" y="164">2</text><text x="0" y="204">0</text></g><line stroke="#ff8a00" strokeDasharray="4 4" x1="28" x2="560" y1="58" y2="58"/><line stroke="#29b6f6" strokeDasharray="4 4" x1="28" x2="560" y1="114" y2="114"/><polygon fill="url(#loadAreaFull)" points={`20,200 ${actual} 548,200`} /><polyline fill="none" points={actual} stroke="#05ff5e" strokeWidth="2"/><line stroke="#ef4444" strokeDasharray="4 4" x1="240" x2="240" y1="28" y2="204"/><circle cx="240" cy="30" fill="#a855f7" r="5"/><text fill="#e2e8f0" fontSize="8" x="250" y="32">6.31 MW (Peak)</text><text fill="#a855f7" fontSize="8" x="492" y="42">5.90 MW (Peak)</text><text fill="#29b6f6" fontSize="8" x="492" y="110">4.27 MW (Average)</text><text fill="#ef4444" fontSize="8" textAnchor="middle" x="240" y="214">2:18 PM Peak Event</text></svg><div className="flex justify-between px-6 text-[8px] text-slate-500"><span>12:00 PM</span><span>1:00 PM</span><span>2:00 PM</span><span>3:00 PM</span><span>4:00 PM</span><span>5:00 PM</span></div><div className="mt-2 h-7 rounded bg-[#132434]"><div className="mx-12 h-full rounded" style={{ background: "linear-gradient(90deg,#263746,#314452,#263746,#3b2458,#263746)" }} /></div></div>;
}

function LoadContributionAtPeak() {
  return <div className="grid h-full grid-cols-[110px_1fr] items-center gap-3"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#a855f7 0 22%, #05ff5e 22% 40%, #ffd740 40% 56%, #00bcd4 56% 65%, #64748b 65% 100%)" }}><div className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-lg">6.31<br /><span className="text-[8px]">MW</span><br /><span className="text-[7px]">Total Peak</span></div></div><div className="space-y-2 text-[8px]">{[["Production Line 4", "1.42 MW (22%)", "text-purple-400"], ["HVAC Systems", "1.18 MW (18%)", "text-[#05ff5e]"], ["Air Compressors", "0.98 MW (16%)", "text-cyan-300"], ["Welding Area", "0.76 MW (12%)", "text-yellow-300"], ["Lighting", "0.58 MW (9%)", "text-orange-400"], ["Other Loads", "1.39 MW (22%)", "text-slate-400"]].map(([label,value,color])=><div className="flex justify-between gap-2" key={label}><span className={color}>● <span className="text-slate-300">{label}</span></span><b className={color}>{value}</b></div>)}<div className="pt-2 text-right text-[#05ff5e]">View All Loads →</div></div></div>;
}

function AffectedAssetsFull() {
  const rows = [["Feeder 4", "Feeder", "1.42", "107%", "High"], ["Feeder 1", "Feeder", "1.24", "104%", "High"], ["Feeder 3", "Feeder", "1.08", "102%", "Medium"], ["Feeder 2", "Feeder", "0.99", "96%", "Medium"], ["Feeder 5", "Feeder", "0.76", "85%", "Low"]];
  return <div className="flex h-full flex-col text-[8px]"><div className="mb-2 flex gap-6"><span className="text-[#05ff5e] underline">Feeders</span><span>Panels</span><span>Loads</span></div><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Asset","Type","Peak Load (MW)","% of Capacity","Impact"].map((h)=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([asset,type,load,cap,impact])=><tr className="border-t border-white/6" key={asset}><td className="py-1.5">{asset}</td><td>{type}</td><td>{load}</td><td className={Number.parseInt(cap) > 100 ? "text-red-400" : Number.parseInt(cap) > 90 ? "text-orange-400" : "text-[#05ff5e]"}>{cap}</td><td className={impact === "High" ? "text-red-400" : impact === "Medium" ? "text-orange-400" : "text-[#05ff5e]"}>{impact}</td></tr>)}</tbody></table><div className="mt-auto text-right text-[#05ff5e]">View All Affected Assets →</div></div>;
}

function EventMarkersFull() {
  return <div className="space-y-4 text-[9px]">{[["#ef4444","Start of Spike","Rapid load increase detected","2:11 PM"],["#ef4444","Peak Demand Reached","6.31 MW (107% of capacity)","2:18 PM"],["#ff8a00","Sustained Peak","Load remained above 5.90 MW","2:18 PM - 2:35 PM"],["#ffd740","Load Declining","Load started returning to normal","2:35 PM"],["#05ff5e","Back to Normal","Load below 90% of capacity","2:55 PM"]].map(([color,title,detail,time])=><div className="grid grid-cols-[16px_1fr_auto] gap-2" key={title}><span className="mt-1 size-2 rounded-full" style={{ backgroundColor: color }} /><span><b>{title}</b><br /><span className="text-slate-400">{detail}</span></span><span>{time}</span></div>)}</div>;
}

function RootCauseFull() {
  return <div className="flex h-full flex-col gap-3 text-[8.5px]">{[["Primary Cause", "High production load + HVAC demand"], ["Contributing Factors", "High ambient temperature (28°C)\\nProduction Line 4 running at maximum capacity\\nMultiple large motors starting simultaneously"], ["Recommendations", "Stagger motor start times on Feeder 4\\nOptimize HVAC scheduling\\nConsider demand response strategy"]].map(([title,body])=><div className="grid grid-cols-[22px_1fr] gap-2" key={title}><span className="text-purple-400">▣</span><span><b>{title}</b><br />{body.split("\\n").map((line)=><span className="block text-[#05ff5e]" key={line}>• {line}</span>)}</span></div>)}<div className="mt-auto text-right text-[#05ff5e]">View Recommendations →</div></div>;
}

function ImpactSummaryFull() {
  return <div className="space-y-1 text-[7.7px]">{[["Max Demand Impact","+2.04 MW"],["Energy Impact","26.4 MWh"],["Duration Impact","37 min"],["Capacity Exceeded By","0.41 MW (7%)"],["Affected Feeders","2"],["Affected Panels","5"],["Affected Loads","18"],["Estimated Cost Impact","$3,842"],["CO₂ Impact","12.7 metric tons"]].map(([label,value])=><div className="flex justify-between gap-2 border-b border-white/6 pb-0.5" key={label}><span>{label}</span><b>{value}</b></div>)}</div>;
}

function SeverityThresholdsFull() {
  return <div className="space-y-1.5 text-[7.7px]"><ThresholdLine label="Warning Threshold (90%)" value="5.31 MW" pct="84%" tone="yellow" /><ThresholdLine label="Critical Threshold (100%)" value="5.90 MW" pct="94%" tone="red" /><ThresholdLine label="Peak Demand" value="6.31 MW" pct="100%" tone="red" /><ThresholdLine label="Threshold Exceeded" value="0.41 MW (7%)" pct="107%" tone="red" /><div className="mt-1 flex justify-between text-[7px] text-slate-500"><span>0%</span><span>50%</span><span>100%</span><span>120%</span></div></div>;
}

function ThresholdLine({ label, pct, tone, value }: { label: string; pct: string; tone: "red" | "yellow"; value: string }) {
  return <div><div className="mb-0.5 flex justify-between"><span>{label}</span><b className={tone === "red" ? "text-red-400" : "text-yellow-300"}>{value}</b></div><div className="grid grid-cols-[1fr_30px] items-center gap-2"><span className="h-1.5 rounded bg-slate-800"><span className={tone === "red" ? "block h-1.5 rounded bg-red-500" : "block h-1.5 rounded bg-yellow-400"} style={{ width: pct }} /></span><span className={tone === "red" ? "text-red-400" : "text-yellow-300"}>{pct}</span></div></div>;
}

function EventAnnotationsFull() {
  const rows = [["GD","Greg Dockery","May 16, 2025 3:05 PM","Verified high production schedule on Line 4. HVAC load was also elevated."],["AM","Alex Morgan","May 16, 2025 3:18 PM","Demand response not triggered due to manual override."],["SJ","Sarah Johnson","May 16, 2025 3:30 PM","Review compressor sequencing logic to prevent future spikes."]];
  return <div className="flex h-full flex-col text-[7.4px]"><div className="mb-0.5 flex justify-end gap-1 text-slate-300">＋ Add Note</div>{rows.map(([initials,name,time,note])=><div className="grid grid-cols-[22px_1fr_auto] gap-1.5 border-b border-white/6 py-1" key={name}><span className={initials === "SJ" ? "grid size-5 place-items-center rounded-full border border-red-500 text-red-400" : initials === "AM" ? "grid size-5 place-items-center rounded-full border border-[#05ff5e] text-[#05ff5e]" : "grid size-5 place-items-center rounded-full border border-slate-500"}>{initials}</span><span><b>{name}</b><br /><span className="text-slate-300">{note}</span></span><span className="text-slate-500">{time}</span></div>)}<div className="mt-auto text-right text-[#05ff5e]">View All Notes →</div></div>;
}

function LoadDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; <span className="text-[#05ff5e]">Load Detail</span></div><h1 className="mt-1 text-2xl font-light">Load Detail</h1><p className="mt-1 text-[10px] text-slate-300">Comprehensive view of connected load, demand trends, and consumption breakdown.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Overview</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div>
        </div>
        <section className="grid h-[94px] grid-cols-[repeat(5,1fr)_1.52fr] gap-3">
          <PeakKpi icon="⌁" label="Total Connected Load ⓘ" value={formatMw(data.currentLoadKva)} detail="Latest capacity intelligence" tone="green" />
          <PeakKpi icon="⌁" label="Peak Demand (7 Days) ⓘ" value="No Data" detail="No approved peak-demand source" tone="purple" />
          <PeakKpi icon="⌁" label="Average Load ⓘ" value="No Data" detail="No approved load trend source" tone="blue" />
          <PeakKpi icon="◷" label="Load Factor ⓘ" value="No Data" detail="No approved trend source" tone="orange" />
          <PeakKpi icon="ϟ" label="Total Energy (7 Days) ⓘ" value="No Data" detail="No approved energy trend source" tone="green" />
          <PeakBox title="LOAD BREAKDOWN (by Category)"><LoadBreakdownCard data={data} /></PeakBox>
        </section>
        <section className="mt-2 grid h-[590px] min-h-0 grid-cols-[1.42fr_0.66fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[196px_1fr_162px] gap-3 overflow-hidden">
            <PeakBox title="LOAD OVER TIME ⓘ"><NoDataPanel message="No approved load trend source." /></PeakBox>
            <div className="grid min-h-0 grid-cols-[1.36fr_0.88fr] gap-3 overflow-hidden">
              <PeakBox title="LOAD BY ASSET HIERARCHY"><LoadAssetHierarchy data={data} /></PeakBox>
              <PeakBox title="LOAD DISTRIBUTION (by Feeder)"><LoadDistributionFeeder data={data} /></PeakBox>
            </div>
            <div className="grid min-h-0 grid-cols-[0.88fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="PEAK DEMAND EVENTS (7 DAYS)"><PeakDemandEventsMini rows={noDataTableRows("No approved peak-demand event source", 4)} /></PeakBox>
              <PeakBox title="LOAD COMPARISON"><NoDataPanel message="No approved load comparison source." /></PeakBox>
            </div>
          </div>
          <div className="grid min-h-0 grid-rows-[166px_1fr_162px] gap-3 overflow-hidden">
            <PeakBox title="DEMAND SUMMARY"><DemandSummaryCard data={data} /></PeakBox>
            <PeakBox title="LOAD BY TIME OF DAY (Average)"><NoDataPanel message="No approved time-of-day load source." /></PeakBox>
            <PeakBox title="INSIGHTS"><LoadInsightsCard data={data} /></PeakBox>
          </div>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function LoadBreakdownCard({ data }: { data: DigitalTwinData }) {
  const rows = assetCapacityRows(data).slice(0, 5);
  return <div className="grid h-full grid-cols-[88px_1fr] items-center gap-3"><div className="grid size-20 place-items-center rounded-full bg-slate-800"><div className="grid size-12 place-items-center rounded-full bg-[#061521] text-center text-sm">{formatMw(data.currentLoadKva)}<br /><span className="text-[7px]">Current</span></div></div><div className="space-y-1.5 text-[8px]">{rows.length > 0 ? rows.map(([label, value])=><div className="grid grid-cols-[1fr_32px_54px] gap-2" key={label}><span><span className="mr-1 inline-block size-2 rounded-full bg-[#05ff5e]" />{label}</span><span>No Data</span><b>{value}</b></div>) : <MetricListSmall rows={noDataRows("No asset rating data")} />}</div></div>;
}

function LoadOverTimeChart() {
  const actual = "22,118 42,96 62,110 82,92 102,102 122,126 142,98 162,104 182,128 202,92 222,108 242,120 262,96 282,126 302,104 322,112 342,148 362,98 382,116 402,122 422,100 442,136 462,112 482,116 502,154 522,102 542,120 562,96 582,132 602,106 622,114 642,166 662,112 682,128";
  return <div className="h-full text-[8px]"><div className="mb-1 flex items-center justify-between"><span>May 12 - May 18, 2025</span><div className="flex gap-4"><span className="text-[#05ff5e]">━ Actual Load (MW)</span><span className="text-cyan-300">⋯ Average Load</span><span className="text-purple-400">⋯ Peak Demand</span></div><div className="flex gap-1 text-[8px]"><span className="rounded bg-[#063b27] px-2 py-1 text-[#05ff5e]">1 HOUR</span><span>1 DAY</span><span>7 DAYS</span><span>30 DAYS</span></div></div><svg className="h-[130px] w-full" viewBox="0 0 700 140"><defs><linearGradient id="loadDetailArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#05ff5e" stopOpacity=".42" /><stop offset="1" stopColor="#05ff5e" stopOpacity=".05" /></linearGradient></defs><g stroke="rgba(148,163,184,.18)">{[22,52,82,112,132].map((y)=><line key={y} x1="18" x2="690" y1={y} y2={y}/>)}</g><line stroke="#a855f7" strokeDasharray="5 5" x1="18" x2="690" y1="28" y2="28"/><line stroke="#29b6f6" strokeDasharray="5 5" x1="18" x2="690" y1="74" y2="74"/><polygon fill="url(#loadDetailArea)" points={`22,132 ${actual} 682,132`} /><polyline fill="none" points={actual} stroke="#05ff5e" strokeWidth="2"/><text fill="#a855f7" fontSize="9" x="650" y="26">6.31 MW</text><text fill="#29b6f6" fontSize="9" x="650" y="74">4.27 MW</text></svg><div className="flex justify-between px-1 text-[7px] text-slate-500"><span>May 12<br />12 AM</span><span>May 13<br />12 AM</span><span>May 14<br />12 AM</span><span>May 15<br />12 AM</span><span>May 16<br />12 AM</span><span>May 17<br />12 AM</span><span>May 18<br />12 AM</span></div></div>;
}

function LoadAssetHierarchy({ data }: { data: DigitalTwinData }) {
  const rows = data.assets.length > 0 ? data.assets.slice(0, 9).map((asset) => ["›", asset.name, formatMw(asset.kvaRating), "No Data", "No Data", asset.status || "No Data"]) : [["", "No Data", "No Data", "No Data", "No Data", "No Data"]];
  return <table className="w-full text-left text-[7.3px]"><thead className="text-slate-400"><tr>{["Asset","Current Load (MW)","% of Total","Peak Load (MW)","Trend (7 Days)","Health"].map((h)=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([arrow,asset,current,pct,peak,health], index)=><tr className="border-t border-white/6" key={asset}><td className="py-[2.1px]"><span className="mr-1 text-slate-400">{arrow}</span><span className={index > 2 && index < 8 ? "pl-3" : ""}>{asset}</span></td><td>{current}</td><td>{pct}</td><td>{peak}</td><td><LoadTinySpark tone={health === "Fair" ? "red" : health === "Good" ? "yellow" : "green"} /></td><td className={health === "Fair" ? "text-orange-400" : health === "Good" ? "text-yellow-300" : "text-[#05ff5e]"}>{health ? `● ${health}` : ""}</td></tr>)}</tbody></table>;
}

function LoadTinySpark({ tone }: { tone: string }) {
  const color = tone === "red" ? "#ef4444" : tone === "yellow" ? "#ff8a00" : "#05ff5e";
  return <svg className="h-3 w-24" viewBox="0 0 96 12"><polyline fill="none" points="0,7 12,6 24,7 36,4 48,6 60,3 72,7 84,5 96,4" stroke={color} strokeWidth="1.5" /></svg>;
}

function LoadDistributionFeeder({ data }: { data: DigitalTwinData }) {
  const rows = data.assets.filter((asset) => asset.type.toLowerCase().includes("feeder")).slice(0, 5);
  return <div className="h-full text-[8.5px]"><div className="mb-1 grid grid-cols-[70px_1fr_48px_38px] text-slate-400"><span>Feeder</span><span>Rating</span><span></span><span>% Load</span></div>{rows.length > 0 ? rows.map((asset)=><div className="grid grid-cols-[70px_1fr_48px_38px] items-center gap-2 py-2" key={asset.id}><span>{asset.name}</span><span className="h-2 rounded bg-slate-800"><span className="block h-2 rounded bg-[#05ff5e]" style={{ width: "35%" }} /></span><span>{formatMw(asset.kvaRating)}</span><span>No Data</span></div>) : <NoDataPanel message="No feeder assets or load distribution source." />}<div className="mt-2 flex justify-between text-[7px] text-slate-500"><span>Current feeder load: No Data</span><span>Rating only where populated</span></div></div>;
}

function PeakDemandEventsMini({ rows = peakEventRowsRef.slice(0, 5) }: { rows?: string[][] }) {
  return <div className="flex h-full flex-col"><table className="w-full text-left text-[7.4px]"><thead className="text-slate-400"><tr>{["Rank","Date / Time","Load (MW)","Duration"].map((h)=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(0,5).map((row)=><tr className="border-t border-white/6" key={row.join("-")}><td className="py-[3px]">{row[0]}</td><td>{row[1]}</td><td>{row[2]?.replace(" MW","")}</td><td>{row[3]}</td></tr>)}</tbody></table><div className="mt-auto text-right text-[9px] text-[#05ff5e]">View All Peak Events →</div></div>;
}

function LoadComparisonBars() {
  return <div className="h-full text-[8px]"><div className="mb-2 flex justify-between"><span>MWh</span><span>━ This Week (May 12 - May 18) &nbsp; ⋯ Last Week (May 5 - May 11)</span><span>7 Days⌄</span></div><div className="grid h-[112px] grid-cols-7 items-end gap-4 px-5">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,index)=><div className="grid h-full grid-cols-2 items-end gap-1 text-center" key={day}><span className="block rounded-t bg-[#05a64a]" style={{ height: `${[88,78,68,72,64,84,82][index]}%` }} /><span className="block rounded-t border border-[#05ff5e]" style={{ height: `${[82,64,62,60,58,62,60][index]}%` }} /><b className="col-span-2 mt-1 text-[7px] font-normal text-slate-400">{day}</b></div>)}</div></div>;
}

function DemandSummaryCard({ data }: { data: DigitalTwinData }) {
  return <div className="space-y-2 text-[8.5px]">{[["Current Load",formatMw(data.currentLoadKva)],["Installed Capacity",formatMw(data.transformerKva)],["Available Capacity",formatMw(data.headroomKva)],["Recovered Capacity",formatMw(data.recoveredCapacityKva)],["Peak Demand (7 Days)","No Data"],["Avg Daily Energy","No Data"]].map(([label,value])=><div className="flex justify-between gap-2 border-b border-white/6 pb-1" key={label}><span>{label}</span><b>{value}</b></div>)}</div>;
}

function LoadTimeHeatmap() {
  const rows = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const cols = ["12 AM","6 AM","12 PM","6 PM"];
  return <div className="h-full text-[8px]"><div className="mb-1 ml-9 grid grid-cols-4 text-center text-slate-400">{cols.map((c)=><span key={c}>{c}</span>)}</div><div className="grid grid-cols-[28px_1fr] gap-2"><div className="grid grid-rows-7 gap-1 text-slate-300">{rows.map((r)=><span key={r}>{r}</span>)}</div><div className="grid grid-cols-12 gap-1">{Array.from({ length: 84 }).map((_, index) => { const col = index % 12; const color = col < 3 ? "#16a34a" : col < 6 ? "#d9dc1e" : col < 10 ? "#ef4444" : "#22c55e"; return <span className="h-[14px] rounded-sm border border-[#061521]" key={index} style={{ backgroundColor: color, opacity: 0.7 + (index % 3) * 0.1 }} />; })}</div></div><div className="mt-2 grid grid-cols-[1fr_190px_1fr] items-center text-slate-400"><span className="text-right">Low</span><span className="mx-3 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#05a64a,#facc15,#ef4444)" }} /><span>High</span></div></div>;
}

function LoadInsightsCard({ data }: { data: DigitalTwinData }) {
  return <div className="flex h-full flex-col gap-3 text-[8.5px]">{[["↑",`Current load is ${formatMw(data.currentLoadKva)} from latest capacity intelligence.`,"text-[#05ff5e]"],["⌁","Peak demand insight: No Data. No approved peak-event source.","text-purple-400"],["ϟ","Feeder contribution insight: No Data. No approved feeder load source.","text-orange-400"]].map(([icon,text,color])=><div className="grid grid-cols-[26px_1fr] gap-2 border-b border-white/6 pb-2" key={text}><span className={`grid size-6 place-items-center rounded-full border ${color}`}>{icon}</span><span>{text}</span></div>)}<div className="mt-auto text-right text-[#05ff5e]">View All Insights →</div></div>;
}

function NetworkTopbar() {
  return (
    <header className="flex h-[30px] items-center justify-between border-b border-cyan-300/10">
      <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
      <div className="flex items-center gap-3 text-[9px]">
        <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5">Flex Tijuana</button>
        <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5">May 12 - May 18, 2025</button>
        <span className="text-[#05ff5e]">● Live</span>
        <span className="grid size-7 place-items-center rounded-full bg-[#334155]">GD</span>
        <span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span>
      </div>
    </header>
  );
}

function ElectricalNetworkOverview() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-5 gap-2">
        <NetworkKpi label="Network Health" value="95" detail="Excellent" tone="green" />
        <NetworkKpi label="Total Connected Load" value="5.82 MW" detail="↑ 4.3% vs Last 7 Days" tone="green" />
        <NetworkKpi label="Total Apparent Power" value="6.41 MVA" detail="Power Factor 0.91" tone="purple" />
        <NetworkKpi label="Total Losses" value="178 kW" detail="2.78% of Load" tone="red" />
        <NetworkKpi label="Capacity Available" value="2.18 MW" detail="27% of System" tone="blue" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.48fr_0.82fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[318px]" title="Network One-Line Diagram" variant="enterprise"><MiniOneLine /></DashboardPanel>
          <div className="grid h-[116px] grid-cols-[1fr_0.86fr] gap-2">
            <DashboardPanel title="Voltage Profile (L-L)" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#ffd740", "#29b6f6", "#a855f7"]} /></DashboardPanel>
            <DashboardPanel title="Feeder Loading" variant="enterprise"><Bars rows={[["Feeder 4", "92%", "red"], ["Feeder 2", "78%", "yellow"], ["Feeder 3", "65%", "green"], ["Feeder 1", "62%", "green"], ["Feeder 5", "58%", "green"]]} /></DashboardPanel>
          </div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="Network Alerts" variant="enterprise"><MetricListSmall rows={[["High load on Feeder 4", "92% of capacity"], ["Harmonic distortion on Feeder 2", "THD: 2.5%"], ["Capacitor bank switched off", "Automatic"]]} /></DashboardPanel>
          <DashboardPanel title="Top Network Issues" variant="enterprise"><NetworkTable headers={["Issue", "Location", "Impact", "Status"]} rows={[["High Loading", "Feeder 4", "High", "Active"], ["High Harmonics", "Feeder 2", "Medium", "Active"], ["Imbalance", "Building 3 Panel", "Medium", "Active"], ["Low Power Factor", "Feeder 2", "Low", "Monitoring"]]} /></DashboardPanel>
          <DashboardPanel title="Network Summary" variant="enterprise"><MetricListSmall rows={[["Total Transformers", "8"], ["Total Switchgear", "12"], ["Total Feeders", "24"], ["Total Connected Loads", "312"], ["System Voltage Levels", "115 kV / 69 kV / 480 V / 208 V"]]} /></DashboardPanel>
          <DashboardPanel title="Network Optimization Potential" variant="enterprise"><MetricListSmall rows={[["Capacity That Can Be Released", "1.24 MW"], ["Losses That Can Be Reduced", "62 kW"], ["Harmonic Reduction Potential", "35%"], ["Estimated Annual Savings", "$128,000"]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function AlertsDetailScreen() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-5 gap-2">
        <NetworkKpi label="Critical Alerts" value="1" detail="Requires Immediate Action" tone="red" />
        <NetworkKpi label="High Alerts" value="2" detail="Requires Attention" tone="yellow" />
        <NetworkKpi label="Medium Alerts" value="3" detail="Monitor Closely" tone="yellow" />
        <NetworkKpi label="Low Alerts" value="1" detail="Informational" tone="blue" />
        <NetworkKpi label="Total Active Alerts" value="7" detail="Across 5 Feeders" tone="blue" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.35fr_0.68fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="Active Alerts (7)" variant="enterprise"><NetworkTable headers={["Severity", "Alert", "Location", "Asset / Feeder", "Triggered", "Value", "Threshold", "Status"]} rows={alertRows} /></DashboardPanel>
          <div className="grid h-[126px] grid-cols-2 gap-2"><DashboardPanel title="Alert Trend (Last 7 Days)" variant="enterprise"><NetworkTrend colors={["#ef4444", "#ff8a00", "#ffd740", "#29b6f6"]} /></DashboardPanel><DashboardPanel title="Alerts By Location" variant="enterprise"><NetworkDonut total="7" rows={[["Electrical Room", "4"], ["Building 3", "1"], ["Main Transformer", "1"], ["IT Room", "1"]]} /></DashboardPanel></div>
          <DashboardPanel title="Alert History (Last 7 Days)" variant="enterprise"><NetworkTable headers={["Cleared", "Severity", "Alert", "Location", "Asset / Feeder", "Duration", "Cleared By"]} rows={[["May 17, 2025 06:45 PM", "Medium", "Power Factor Low", "Feeder 1", "Feeder 1", "1h 23m", "System Auto Clear"], ["May 17, 2025 02:30 PM", "High", "Harmonic Distortion High", "Feeder 5", "Feeder 5", "2h 05m", "John Martinez"]]} /></DashboardPanel>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="Alert Information" variant="enterprise"><MetricListSmall rows={[["Alert", "High Load on Feeder 4"], ["Location", "Electrical Room"], ["Asset / Feeder", "Feeder 4"], ["Triggered", "May 18, 2025 10:12 AM"], ["Current Value", "92% of Capacity"], ["Threshold", "> 90% of Capacity"], ["Impact", "High risk of overload and downtime."]]} /></DashboardPanel>
          <DashboardPanel title="Alert Actions" variant="enterprise"><div className="grid grid-cols-4 gap-2 text-center text-[9px]"><button className="rounded bg-[#063b27] py-2 text-[#05ff5e]">Acknowledge</button><button className="rounded bg-[#3a2b05] py-2 text-yellow-300">Snooze</button><button className="rounded bg-[#082544] py-2 text-blue-300">Assign</button><button className="rounded bg-[#2b164a] py-2 text-purple-300">Work Order</button></div></DashboardPanel>
          <DashboardPanel title="Alert Notes" variant="enterprise"><MetricListSmall rows={[["System", "Alert triggered automatically by capacity monitoring system."], ["Greg Dockery", "Investigating load composition on Feeder 4."]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function HealthDetailScreen() {
  return (
    <section className="mt-2 grid min-h-0 flex-1 grid-cols-[0.48fr_1.25fr_0.58fr] gap-2">
      <div className="space-y-2 overflow-hidden">
        <DashboardPanel title="Health Score" variant="enterprise"><Gauge value="95" label="Excellent" /></DashboardPanel>
        <DashboardPanel title="Health Breakdown" variant="enterprise"><Bars rows={[["Transformers", "97%", "green"], ["Switchgear", "94%", "green"], ["Feeders", "92%", "green"], ["Panels", "90%", "green"], ["Power Quality", "93%", "green"], ["Protection", "95%", "green"]]} /></DashboardPanel>
        <DashboardPanel title="Health Trend (30 Days)" variant="enterprise"><NetworkTrend colors={["#05ff5e"]} /></DashboardPanel>
        <DashboardPanel title="Status Legend" variant="enterprise"><MetricListSmall rows={[["Excellent (90-100)", "●"], ["Good (75-89)", "●"], ["Fair (50-74)", "●"], ["Poor (25-49)", "●"], ["Critical (0-24)", "●"]]} /></DashboardPanel>
      </div>
      <div className="space-y-2 overflow-hidden">
        <DashboardPanel title="Health By Asset Hierarchy" variant="enterprise"><NetworkTable headers={["Asset", "Health Score", "Status", "Issues", "Trend (7 Days)", "Details"]} rows={[["Utility (Grid)", "98%", "Excellent", "0", "▁▂▃▂▃", "View"], ["Main Transformer (T1)", "97%", "Excellent", "0", "▃▂▃▅▃", "View"], ["Main Switchgear", "95%", "Excellent", "1", "▂▃▃▅▆", "View"], ["Feeder A", "96%", "Excellent", "0", "▃▃▅▅▆", "View"], ["Feeder B", "87%", "Good", "2", "▃▅▃▂▃", "View"], ["Feeder C", "64%", "Fair", "3", "▂▃▂▃▂", "View"], ["Panels (Total 24)", "90%", "Good", "3", "▂▃▃▅▃", "View"], ["Power Quality", "93%", "Excellent", "1", "▃▃▅▃▅", "View"]]} /></DashboardPanel>
        <DashboardPanel title="Health Score Over Time (By Category)" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#29b6f6", "#ffd740", "#a855f7", "#00bcd4", "#ff8a00"]} /></DashboardPanel>
      </div>
      <div className="space-y-2 overflow-hidden">
        <DashboardPanel title="Top Health Risk Contributors" variant="enterprise"><NetworkDonut total="6" rows={[["High Loading", "2"], ["Harmonics", "2"], ["Imbalance", "1"], ["Low Power Factor", "1"]]} /></DashboardPanel>
        <DashboardPanel title="Health Impact Matrix" variant="enterprise"><ImpactMatrix /></DashboardPanel>
        <DashboardPanel title="Recent Health Events" variant="enterprise"><MetricListSmall rows={[["High load detected on Feeder C", "May 18, 2025 10:12 AM"], ["Harmonic distortion on Feeder B", "May 18, 2025 09:48 AM"], ["Capacitor bank switched off automatically", "May 18, 2025 08:33 AM"]]} /></DashboardPanel>
      </div>
    </section>
  );
}

function HealthEventsScreen() {
  return (
    <>
      <section className="mt-2 grid h-[76px] grid-cols-5 gap-2">
        <NetworkKpi label="Critical Events" value="2" detail="Requires immediate action" tone="red" />
        <NetworkKpi label="Warning Events" value="5" detail="Needs attention" tone="yellow" />
        <NetworkKpi label="Info Events" value="8" detail="Informational updates" tone="blue" />
        <NetworkKpi label="Resolved Events" value="12" detail="Automatically cleared" tone="green" />
        <NetworkKpi label="Total Events" value="27" detail="This time range" tone="blue" />
      </section>
      <section className="mt-2 flex h-[34px] gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">Search events, assets, issues...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">All Severities</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">All Event Types</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">All Assets</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">All Statuses</button></section>
      <DashboardPanel className="min-h-0 flex-1" title="Health Events" variant="enterprise"><NetworkTable headers={["Time", "Severity", "Event", "Asset", "Category", "Status", "Duration / Impact", "Actions"]} rows={[["May 18, 2025 10:12 AM", "Critical", "High load detected", "Feeder C 115 kV", "Loading", "Active", "Ongoing 92% of capacity", "View Details"], ["May 18, 2025 09:48 AM", "Warning", "Harmonic distortion", "Feeder B 115 kV", "Power Quality", "Active", "Ongoing THD: 2.5%", "View Details"], ["May 18, 2025 08:33 AM", "Info", "Capacitor bank switched off automatically", "Main Switchgear 480 V", "System", "Resolved", "3 min", "View Details"], ["May 18, 2025 07:15 AM", "Warning", "Power factor below target", "Building 3 Panel 480 V", "Power Quality", "Resolved", "10 min PF: 0.86", "View Details"], ["May 18, 2025 06:40 AM", "Warning", "Imbalance detected", "Feeder 2 115 kV", "Power Quality", "Active", "Ongoing Imbalance: 2.1%", "View Details"], ["May 17, 2025 11:22 PM", "Info", "Transformer temperature normal", "Main Transformer (T1)", "Thermal", "Resolved", "6 min", "View Details"], ["May 17, 2025 09:05 PM", "Warning", "High neutral current", "Panel C2 480 V", "Power Quality", "Resolved", "13 min Peak: 92A", "View Details"], ["May 17, 2025 05:30 PM", "Info", "Demand response event started", "Site Wide All", "Demand Response", "Resolved", "2 hrs", "View Details"], ["May 17, 2025 02:10 PM", "Warning", "Overvoltage condition", "Feeder D 115 kV", "Voltage", "Resolved", "8 min Max: 1.07 pu", "View Details"], ["May 17, 2025 12:22 PM", "Info", "Load restored", "Panel A1 480 V", "System", "Resolved", "2 min", "View Details"]]} /></DashboardPanel>
    </>
  );
}

function PeakEventsScreen() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-5 gap-2">
        <NetworkKpi label="Total Peak Events" value="12" detail="In Last 7 Days" tone="purple" />
        <NetworkKpi label="Highest Peak Demand" value="6.31 MW" detail="May 16, 2025 2:18 PM" tone="purple" />
        <NetworkKpi label="Average Peak Demand" value="5.96 MW" detail="↑ 4.2% vs Last 7 Days" tone="blue" />
        <NetworkKpi label="Total Energy At Peak" value="142.8 MWh" detail="During Peak Events" tone="green" />
        <NetworkKpi label="Avg Peak Duration" value="31 min" detail="Per Event" tone="yellow" />
      </section>
      <PeakEventsFilterBar />
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.55fr_0.58fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <div className="grid h-[130px] grid-cols-[0.86fr_1fr] gap-2"><DashboardPanel title="Peak Demand Trend (7 Days)" variant="enterprise"><NetworkTrend colors={["#a855f7"]} /></DashboardPanel><DashboardPanel title="Peak Events By Time Of Day" variant="enterprise"><HeatMap /></DashboardPanel></div>
          <DashboardPanel title="Peak Events List (27)" variant="enterprise"><PeakEventsList /></DashboardPanel>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[128px]" title="Peak Event Impact (7 Days)" variant="enterprise"><MetricListSmall rows={[["Total Energy Impact", "142.8 MWh"], ["Max Demand Impact", "+2.04 MW"], ["Avg Duration", "31 min"], ["Events > 6 MW", "3"], ["Events > 90% Capacity", "5"]]} /></DashboardPanel>
          <DashboardPanel title="Event Detail" variant="enterprise"><MetricListSmall rows={[["Date / Time", "May 16, 2025 2:18 PM"], ["Peak Demand", "6.31 MW"], ["Feeder", "Feeder 4"], ["Duration", "37 min"], ["% of Capacity", "107%"], ["Energy at Peak", "26.4 MWh"], ["Event Type", "Demand Spike"], ["Notes", "High production load + HVAC demand"]]} /><button className="mt-3 w-full rounded border border-[#05ff5e] py-2 text-[9px] text-[#05ff5e]">View Full Event Analysis →</button></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function PeakEventsFilterBar() {
  const filters = ["All Feeders", "All Severities", "All Event Types", "May 12 – May 18, 2025"];
  return (
    <div className="mt-2 grid h-[28px] grid-cols-[1.1fr_0.72fr_0.72fr_0.72fr_0.92fr_auto_auto] items-center gap-2 text-[9px]">
      <div className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1.5 text-slate-500">⌕ Search events, feeders, assets...</div>
      {filters.map((filter) => <button className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1.5 text-left text-slate-300" key={filter}>{filter}</button>)}
      <button className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1.5 text-slate-300">↗</button>
      <button className="text-left text-slate-400">× Clear Filters</button>
    </div>
  );
}

function PeakEventsList() {
  const rows = [
    ["1", "May 16, 2025 2:18 PM", "6.31 MW", "37 min", "107%", "Feeder 4", "Demand Spike", "Critical", "26.4 MWh", "High", "View Details"],
    ["2", "May 15, 2025 1:47 PM", "6.12 MW", "29 min", "104%", "Feeder 1", "Demand Spike", "Critical", "22.1 MWh", "High", "View Details"],
    ["3", "May 14, 2025 2:03 PM", "5.98 MW", "31 min", "102%", "Feeder 3", "Demand Spike", "Warning", "20.3 MWh", "High", "View Details"],
    ["4", "May 13, 2025 2:27 PM", "5.81 MW", "26 min", "99%", "Feeder 1", "Demand Spike", "Warning", "18.6 MWh", "Medium", "View Details"],
    ["5", "May 17, 2025 1:55 PM", "5.77 MW", "34 min", "98%", "Feeder 4", "Demand Spike", "Warning", "19.2 MWh", "Medium", "View Details"],
    ["6", "May 18, 2025 12:41 PM", "5.65 MW", "22 min", "96%", "Feeder 2", "Demand Spike", "Warning", "13.8 MWh", "Medium", "View Details"],
    ["7", "May 16, 2025 9:18 AM", "5.42 MW", "18 min", "92%", "Feeder 3", "Morning Peak", "Moderate", "9.6 MWh", "Medium", "View Details"],
    ["8", "May 15, 2025 9:02 AM", "5.21 MW", "16 min", "89%", "Feeder 1", "Morning Peak", "Moderate", "8.2 MWh", "Low", "View Details"],
    ["9", "May 12, 2025 1:32 PM", "5.08 MW", "21 min", "87%", "Feeder 5", "Demand Spike", "Info", "8.9 MWh", "Low", "View Details"],
    ["10", "May 14, 2025 9:35 AM", "4.97 MW", "14 min", "85%", "Feeder 2", "Morning Peak", "Info", "6.3 MWh", "Low", "View Details"],
  ];

  return (
    <div className="flex h-full flex-col">
      <NetworkTable headers={["Rank", "Date / Time", "Peak Demand", "Duration", "% of Capacity", "Feeder", "Event Type", "Severity", "Energy at Peak", "Impact", "Actions"]} rows={rows} />
      <div className="mt-auto flex items-center justify-between pt-2 text-[8px] text-slate-400">
        <span>Showing 1 to 10 of 27 events</span>
        <div className="flex items-center gap-2">
          <button className="rounded border border-cyan-300/12 px-2 py-1">‹</button>
          <button className="rounded bg-[#05ff5e] px-2 py-1 text-[#03110a]">1</button>
          <button className="rounded border border-cyan-300/12 px-2 py-1">2</button>
          <button className="rounded border border-cyan-300/12 px-2 py-1">3</button>
          <button className="rounded border border-cyan-300/12 px-2 py-1">›</button>
        </div>
        <span>Rows per page: <b className="rounded border border-cyan-300/12 px-2 py-1 text-slate-300">10⌄</b></span>
      </div>
    </div>
  );
}

function PeakFullAnalysisScreen() {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-1.5">
        <div className="grid grid-cols-7 gap-4 text-[9px]"><InfoMini label="Event ID" value="EVT-2025-0516-1418" /><InfoMini label="Event Type" value="Demand Spike" /><InfoMini label="Severity" value="Critical" /><InfoMini label="Status" value="Resolved" /><InfoMini label="Start Time" value="May 16, 2025 2:18 PM" /><InfoMini label="End Time" value="May 16, 2025 2:55 PM" /><InfoMini label="Duration" value="37 min" /></div>
      </section>
      <section className="mt-2 grid h-[62px] grid-cols-6 gap-2">
        <NetworkKpi label="Peak Demand" value="6.31 MW" detail="@ 2:18 PM" tone="purple" />
        <NetworkKpi label="Energy At Peak" value="26.4 MWh" detail="Total" tone="blue" />
        <NetworkKpi label="% Of Capacity" value="107%" detail="Over Capacity" tone="yellow" />
        <NetworkKpi label="Load Factor Impact" value="-12%" detail="During Event" tone="green" />
        <NetworkKpi label="Recovered In" value="31 min" detail="To Normal Range" tone="blue" />
        <NetworkKpi label="Cost Impact" value="$3,842" detail="Estimated" tone="yellow" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.18fr_0.78fr_0.62fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[176px]" title="Demand Timeline (5 Min Interval)" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#29b6f6", "#a855f7", "#ff8a00"]} /><div className="mt-1 text-center text-[9px] text-red-400">2:18 PM Peak Event</div></DashboardPanel>
          <div className="grid h-[174px] grid-cols-2 gap-2"><DashboardPanel title="Load Contribution At Peak" variant="enterprise"><NetworkDonut total="6.31 MW" rows={[["Production Line 4", "1.42 MW"], ["HVAC Systems", "1.18 MW"], ["Air Compressors", "0.98 MW"], ["Welding Area", "0.76 MW"]]} /></DashboardPanel><DashboardPanel title="Affected Assets" variant="enterprise"><NetworkTable headers={["Asset", "Type", "Peak Load", "% Capacity", "Impact"]} rows={[["Feeder 4", "Feeder", "1.42", "107%", "High"], ["Feeder 1", "Feeder", "1.24", "104%", "High"], ["Feeder 3", "Feeder", "1.08", "102%", "Medium"], ["Feeder 2", "Feeder", "0.99", "96%", "Medium"], ["Feeder 5", "Feeder", "0.76", "85%", "Low"]]} /></DashboardPanel></div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[176px]" title="Event Markers" variant="enterprise"><MetricListSmall rows={[["Start of Spike", "2:11 PM"], ["Peak Demand Reached", "2:18 PM"], ["Sustained Peak", "2:18 PM - 2:35 PM"], ["Load Declining", "2:35 PM"], ["Back to Normal", "2:55 PM"]]} /></DashboardPanel>
          <DashboardPanel className="h-[174px]" title="Root Cause Analysis" variant="enterprise"><MetricListSmall rows={[["Primary Cause", "High production load + HVAC demand"], ["Contributing Factors", "High ambient temperature, Line 4 maximum capacity"], ["Recommendations", "Stagger motor start times, optimize HVAC scheduling"]]} /></DashboardPanel>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[128px]" title="Impact Summary" variant="enterprise"><MetricListSmall compact rows={[["Max Demand Impact", "+2.04 MW"], ["Energy Impact", "26.4 MWh"], ["Duration Impact", "37 min"], ["Capacity Exceeded By", "0.41 MW"], ["Affected Feeders", "2"], ["Estimated Cost Impact", "$3,842"]]} /></DashboardPanel>
          <DashboardPanel className="h-[88px]" title="Severity & Thresholds" variant="enterprise"><Bars rows={[["Warning", "84%", "yellow"], ["Critical", "94%", "red"], ["Peak", "100%", "red"]]} /></DashboardPanel>
          <DashboardPanel className="h-[126px]" title="Event Annotations" variant="enterprise"><MetricListSmall compact rows={[["Greg Dockery", "Verified high production schedule on Line 4."], ["Alex Morgan", "Demand response not triggered."], ["Sarah Johnson", "Review compressor sequencing logic."]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function LoadDetailScreen() {
  return (
    <>
      <section className="mt-2 grid h-[110px] grid-cols-[repeat(5,1fr)_1.9fr] gap-2">
        <NetworkKpi label="Total Connected Load" value="5.82 MW" detail="↑ 4.3% vs Last 7 Days" tone="green" />
        <NetworkKpi label="Peak Demand (7 Days)" value="6.31 MW" detail="May 16, 2025 2:18 PM" tone="purple" />
        <NetworkKpi label="Average Load" value="4.27 MW" detail="73% of Peak" tone="blue" />
        <NetworkKpi label="Load Factor" value="67%" detail="Good" tone="yellow" />
        <NetworkKpi label="Total Energy (7 Days)" value="724.6 MWh" detail="↑ 3.8% vs Prior 7 Days" tone="green" />
        <DashboardPanel title="Load Breakdown" variant="enterprise"><NetworkDonut compact total="5.82 MW" rows={[["Production", "2.38 MW"], ["HVAC", "1.22 MW"], ["Utilities", "0.87 MW"], ["Lighting", "0.58 MW"], ["Other", "0.77 MW"]]} /></DashboardPanel>
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.72fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[142px]" title="Load Over Time" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#29b6f6", "#a855f7"]} /></DashboardPanel>
          <div className="grid h-[148px] grid-cols-[1fr_0.74fr] gap-2"><DashboardPanel title="Load By Asset Hierarchy" variant="enterprise"><NetworkTable headers={["Asset", "Current Load", "% of Total", "Peak Load", "Trend", "Health"]} rows={[["Utility (Grid)", "5.82", "100%", "6.31", "▁▂▃▅▃", "Excellent"], ["Main Transformer (T1)", "5.82", "100%", "6.31", "▃▃▅▃▅", "Excellent"], ["Feeder 1", "1.24", "21%", "1.42", "▂▃▅▃▅", "Excellent"], ["Feeder 2", "0.99", "17%", "1.15", "▂▃▂▃▅", "Good"], ["Feeder 3", "1.08", "19%", "1.26", "▃▅▃▅▆", "Good"], ["Feeder 4", "1.42", "24%", "1.68", "▃▆▅▆▇", "Fair"]]} /></DashboardPanel><DashboardPanel title="Load Distribution (By Feeder)" variant="enterprise"><Bars rows={[["Feeder 4", "24%", "red"], ["Feeder 1", "21%", "green"], ["Feeder 3", "19%", "green"], ["Feeder 5", "19%", "green"], ["Feeder 2", "17%", "yellow"]]} /></DashboardPanel></div>
          <div className="grid h-[112px] grid-cols-2 gap-2"><DashboardPanel title="Peak Demand Events (7 Days)" variant="enterprise"><NetworkTable headers={["Rank", "Date / Time", "Load", "Duration"]} rows={peakRows.slice(0, 5)} /></DashboardPanel><DashboardPanel title="Load Comparison" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#29b6f6"]} /></DashboardPanel></div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="Demand Summary" variant="enterprise"><MetricListSmall rows={[["Peak Demand (7 Days)", "6.31 MW"], ["Average Demand", "4.27 MW"], ["Minimum Demand", "2.61 MW"], ["Load Factor", "67%"], ["Max Daily Energy", "118.2 MWh"], ["Avg Daily Energy", "103.5 MWh"]]} /></DashboardPanel>
          <DashboardPanel title="Load By Time Of Day (Average)" variant="enterprise"><HeatMap /></DashboardPanel>
          <DashboardPanel title="Insights" variant="enterprise"><MetricListSmall rows={[["Load increased", "4.3% compared to prior 7 days"], ["Peak demand", "May 16 at 2:18 PM"], ["Feeder 4", "Highest contributing feeder"]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function LossesDetailScreen() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-6 gap-2">
        <NetworkKpi label="Total Losses" value="178 kW" detail="↓ 2.78% vs Last 7 Days" tone="red" />
        <NetworkKpi label="Total Loss Energy" value="3.42 MWh" detail="↓ 3.12% vs Last 7 Days" tone="yellow" />
        <NetworkKpi label="Estimated Cost Of Losses" value="$342 / day" detail="~$10,260 / month" tone="purple" />
        <NetworkKpi label="Loss Percentage" value="2.78%" detail="Of Total Energy" tone="blue" />
        <NetworkKpi label="CO2 Impact" value="2.34" detail="metric tons / day" tone="green" />
        <NetworkKpi label="Peak Loss" value="245 kW" detail="May 14, 2:18 PM" tone="yellow" />
      </section>
      <FilterBar labels={["May 12 - May 18, 2025", "All Feeders", "All Loss Categories", "All Severity", "Clear Filters"]} />
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[0.95fr_0.9fr_0.88fr] gap-2">
        <div className="space-y-2 overflow-hidden"><DashboardPanel title="Losses Trend (7 Days)" variant="enterprise"><NetworkTrend colors={["#ef4444", "#29b6f6"]} /></DashboardPanel><DashboardPanel title="Losses By Component Type" variant="enterprise"><LossesComponentTable /></DashboardPanel></div>
        <div className="space-y-2 overflow-hidden"><DashboardPanel title="Losses Breakdown By Category" variant="enterprise"><NetworkDonut total="178 kW" rows={[["IR Conductor Losses", "72 kW"], ["Transformer Losses", "46 kW"], ["Harmonic Losses", "32 kW"], ["Eddy Current Losses", "16 kW"], ["Other Losses", "12 kW"]]} /></DashboardPanel><DashboardPanel className="h-[220px]" title="Losses Heat Map (kW)" variant="enterprise"><MiniOneLine compact /></DashboardPanel></div>
        <div className="space-y-2 overflow-hidden"><DashboardPanel title="Losses By Location (Top 10)" variant="enterprise"><Bars rows={[["Feeder 4", "72%", "red"], ["Feeder 1", "55%", "red"], ["Main TX", "45%", "yellow"], ["Feeder 2", "34%", "green"], ["Panel B3", "28%", "green"], ["Feeder 3", "22%", "green"]]} /></DashboardPanel><DashboardPanel title="Losses By Time Of Day (Average)" variant="enterprise"><HeatMap /></DashboardPanel><DashboardPanel title="Losses Insights" variant="enterprise"><MetricListSmall rows={[["Feeder 4", "Highest losses at 48 kW"], ["Harmonic losses", "18% of total"], ["Peak losses", "May 14 at 2:18 PM"], ["Savings opportunity", "$62,000 annually"]]} /></DashboardPanel></div>
      </section>
    </>
  );
}

function LossesOptimizationScreen() {
  return <LossesOptimizationLayout actionPlan={false} />;
}

function LossesActionPlanScreen() {
  return <LossesOptimizationLayout actionPlan />;
}

function LossesDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; <span className="text-[#05ff5e]">Losses Detail</span></div><h1 className="mt-1 text-2xl font-light">Losses Detail</h1><p className="mt-1 text-[10px] text-slate-300">Comprehensive analysis of system losses and energy waste across the electrical network.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Overview</button></div>
        </div>
        <section className="grid h-[88px] grid-cols-6 gap-3">
          <LossKpi icon="ϟ" label="Total Losses ⓘ" value="No Data" detail="No approved losses model" tone="red" />
          <LossKpi icon="⌁" label="Total Loss Energy ⓘ" value="No Data" detail="No approved losses model" tone="orange" />
          <LossKpi icon="$" label="Estimated Cost Of Losses" value="No Data" detail="No approved cost model" tone="purple" />
          <LossKpi icon="%" label="Loss Percentage" value="No Data" detail="No approved losses model" tone="blue" />
          <LossKpi icon="♧" label="CO2 Impact" value="No Data" detail="No approved emissions model" tone="green" />
          <LossKpi icon="⌁" label="Peak Loss (Momentary)" value="No Data" detail="No approved loss events source" tone="yellow" />
        </section>
        <section className="mt-2 grid h-[32px] grid-cols-[190px_170px_180px_160px_auto_1fr] items-center gap-3 text-[9px]">
          {[`▣ ${data.dateRange || "No Data"}⌄`, "All Feeders⌄", "All Loss Categories⌄", "All Severity⌄"].map((label) => <button className="h-full rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-300" key={label}>{label}</button>)}
          <button className="text-left text-slate-400">× Clear Filters</button>
        </section>
        <section className="mt-2 grid h-[572px] min-h-0 grid-cols-[0.98fr_0.96fr_1fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[214px_1fr] gap-3 overflow-hidden">
            <PeakBox title="LOSSES TREND (7 DAYS)"><LossesTrendReference /></PeakBox>
            <PeakBox title="LOSSES BY COMPONENT TYPE"><LossesComponentTypeReference /></PeakBox>
          </div>
          <div className="grid min-h-0 grid-rows-[214px_1fr] gap-3 overflow-hidden">
            <PeakBox title="LOSSES BREAKDOWN BY CATEGORY"><LossesBreakdownReference /></PeakBox>
            <PeakBox title="LOSSES HEAT MAP (kW)"><LossesHeatMapReference /></PeakBox>
          </div>
          <div className="grid min-h-0 grid-rows-[214px_132px_1fr] gap-3 overflow-hidden">
            <PeakBox title="LOSSES BY LOCATION (TOP 10)"><LossesLocationReference /></PeakBox>
            <PeakBox title="LOSSES BY TIME OF DAY (AVERAGE)"><LossesTimeOfDayReference /></PeakBox>
            <PeakBox title="LOSSES INSIGHTS"><LossesInsightsReference /></PeakBox>
          </div>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function LossKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "green" | "orange" | "purple" | "red" | "yellow"; value: string }) {
  const color = tone === "red" ? "text-red-500" : tone === "yellow" ? "text-yellow-300" : tone === "green" ? "text-[#05ff5e]" : tone === "blue" ? "text-cyan-300" : tone === "orange" ? "text-orange-400" : "text-purple-400";
  return <article className="grid grid-cols-[54px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className={`grid size-10 place-items-center rounded-full border text-2xl ${color}`}>{icon}</div><div><div className="text-[8px] uppercase text-slate-300">{label}</div><div className={`mt-1 text-2xl leading-none ${color}`}>{value}</div><div className="mt-1 text-[9px] text-slate-400">{detail}</div></div></article>;
}

function LossesTrendReference() {
  if (!hasApprovedElectricalModel("losses")) return <NoDataPanel message="No approved losses trend source." />;
  const losses = "28,100 70,96 112,108 154,72 196,50 238,92 280,82 322,118 364,126 406,98 448,88 490,68 532,58";
  const percentage = "28,116 70,108 112,122 154,96 196,78 238,86 280,116 322,104 364,118 406,110 448,94 490,84 532,76";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-red-500">━ Total Losses (kW)</span><span className="text-cyan-300">━ Loss Percentage (%)</span></div><svg className="h-[142px] w-full" viewBox="0 0 560 150"><g stroke="rgba(148,163,184,.18)">{[24,48,72,96,120,140].map((y) => <line key={y} x1="30" x2="548" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="28">300</text><text x="0" y="52">250</text><text x="0" y="76">200</text><text x="0" y="100">150</text><text x="0" y="124">100</text></g><polyline fill="none" points={losses} stroke="#ef4444" strokeWidth="2.4" />{parseNetworkPoints(losses).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`l-${x}`} r="3.2" stroke="#ef4444" strokeWidth="2" />)}<polyline fill="none" points={percentage} stroke="#29b6f6" strokeWidth="2.4" />{parseNetworkPoints(percentage).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`p-${x}`} r="3.2" stroke="#29b6f6" strokeWidth="2" />)}<line stroke="#ef4444" strokeDasharray="4 4" x1="196" x2="196" y1="30" y2="140" /><rect fill="#061421" height="54" rx="4" stroke="#1e3a5f" width="112" x="206" y="34" /><text fill="#e2e8f0" fontSize="8" x="214" y="49">May 14, 2:18 PM</text><text fill="#e2e8f0" fontSize="8" x="214" y="65">Losses: 245 kW</text><text fill="#e2e8f0" fontSize="8" x="214" y="81">Loss %: 3.42%</text></svg><div className="flex justify-between px-7 text-[8px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div><div className="mt-1 flex gap-2 text-[8px]"><span className="rounded border border-cyan-300/12 px-3 py-1">15 Min</span><span className="rounded border border-cyan-300/12 px-3 py-1">1 HOUR</span><span className="rounded border border-cyan-300/12 px-3 py-1">1 DAY</span><span className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">7 DAYS</span><span className="rounded border border-cyan-300/12 px-3 py-1">30 DAYS</span></div></div>;
}

function LossesBreakdownReference() {
  if (!hasApprovedElectricalModel("losses")) return <NoDataPanel message="No approved losses category model." />;
  const rows = [["IR Conductor Losses", "72 kW (40.4%)", "#ef4444"], ["Transformer Losses", "46 kW (25.8%)", "#ff8a00"], ["Harmonic Losses", "32 kW (18.0%)", "#ffd740"], ["Eddy Current Losses", "16 kW (9.0%)", "#29b6f6"], ["Other Losses", "12 kW (6.7%)", "#a855f7"]];
  return <div className="grid h-full grid-cols-[150px_1fr] items-center gap-4"><div className="grid size-32 place-items-center rounded-full" style={{ background: "conic-gradient(#ef4444 0 40%, #ff8a00 40% 66%, #ffd740 66% 84%, #29b6f6 84% 93%, #a855f7 93% 100%)" }}><div className="grid size-20 place-items-center rounded-full bg-[#061521] text-center text-xl">178 kW<br /><span className="text-[8px] text-slate-400">Total Losses</span></div></div><div className="space-y-3 text-[8px]">{rows.map(([label, value, color]) => <div className="flex justify-between gap-2" key={label}><span><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><b>{value}</b></div>)}</div></div>;
}

function LossesLocationReference() {
  if (!hasApprovedElectricalModel("losses")) return <NoDataPanel message="No approved losses by location source." />;
  const rows = [["Feeder 4", "48 kW", "72%", "red"], ["Feeder 1", "34 kW", "55%", "red"], ["Main Transformer", "24 kW", "45%", "yellow"], ["Feeder 2", "22 kW", "34%", "green"], ["Building 3 Panel", "14 kW", "28%", "green"], ["Feeder 3", "12 kW", "22%", "green"], ["Feeder 5", "8 kW", "18%", "blue"], ["Utility Service", "6 kW", "12%", "purple"], ["Switchgear Bus", "5 kW", "10%", "purple"], ["Other", "5 kW", "8%", "slate"]];
  return <div className="h-full text-[8px]"><div className="mb-1 grid grid-cols-[92px_1fr_42px] text-slate-400"><span>kW</span><span></span><span></span></div>{rows.map(([label, value, width, tone]) => <div className="grid grid-cols-[92px_1fr_42px] items-center gap-2 py-[3px]" key={label}><span>{label}</span><span className="h-2.5 rounded bg-slate-900"><span className={tone === "red" ? "block h-2.5 rounded bg-red-500" : tone === "yellow" ? "block h-2.5 rounded bg-yellow-400" : tone === "green" ? "block h-2.5 rounded bg-[#05ff5e]" : tone === "blue" ? "block h-2.5 rounded bg-cyan-400" : tone === "purple" ? "block h-2.5 rounded bg-purple-500" : "block h-2.5 rounded bg-slate-400"} style={{ width }} /></span><b className="text-right font-normal">{value}</b></div>)}<div className="mt-1 flex justify-between pl-[94px] pr-10 text-[7px] text-slate-500"><span>0</span><span>15</span><span>30</span><span>45</span><span>60</span></div></div>;
}

function LossesComponentTypeReference() {
  if (!hasApprovedElectricalModel("losses")) return <NoDataPanel message="No approved component losses source." />;
  const rows = [["Conductors (IR)", "72", "40.4%", "1.38", "↓ 3.6%", "High"], ["Transformers", "46", "25.8%", "0.88", "↓ 2.1%", "High"], ["Harmonics", "32", "18.0%", "0.61", "↓ 4.8%", "Medium"], ["Eddy Currents", "16", "9.0%", "0.31", "↓ 1.7%", "Medium"], ["Connections", "7", "3.9%", "0.13", "↓ 5.2%", "Low"], ["Other", "5", "2.9%", "0.09", "↓ 0.8%", "Low"], ["Total", "178", "100%", "3.42", "↓ 2.78%", "—"]];
  return <div className="flex h-full flex-col"><table className="w-full text-left text-[7.4px]"><thead className="text-slate-400"><tr>{["Component Type", "Losses (kW)", "% of Total", "Losses (MWh)", "Trend vs Last 7 Days", "Status"].map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([type, loss, pct, mwh, trend, status]) => <tr className="border-t border-white/6" key={type}><td className="py-[4px]">{type}</td><td>{loss}</td><td>{pct}</td><td>{mwh}</td><td className="text-[#05ff5e]">{trend}</td><td className={status === "High" ? "text-red-400" : status === "Medium" ? "text-yellow-300" : status === "Low" ? "text-[#05ff5e]" : "text-slate-400"}>{status}</td></tr>)}</tbody></table><div className="mt-auto text-right text-[9px] text-[#05ff5e]">View Component Losses Details →</div></div>;
}

function LossesHeatMapReference() {
  if (!hasApprovedElectricalModel("losses")) return <NoDataPanel message="No approved losses heat-map source." />;
  return <div className="relative h-full text-[8px]"><svg className="absolute inset-0 h-full w-full" viewBox="0 0 430 260"><g fill="#94a3b8" fontSize="8" textAnchor="middle"><text x="220" y="22">Utility</text><text x="220" y="34">115 kV</text></g><g stroke="#ffd740" strokeWidth="2"><line x1="220" x2="220" y1="40" y2="63" /><line x1="220" x2="220" y1="100" y2="115" /><line x1="80" x2="360" y1="170" y2="170" />{[80,150,220,290,360].map((x) => <line key={x} x1={x} x2={x} y1="170" y2="196" />)}</g><rect fill="#061521" height="30" rx="4" stroke="#1e3a5f" width="110" x="165" y="62" /><rect fill="#061521" height="30" rx="4" stroke="#1e3a5f" width="110" x="165" y="116" /><g fill="#e2e8f0" fontSize="8" textAnchor="middle"><text x="220" y="76">Main Transformer</text><text fill="#05ff5e" x="220" y="88">1.5 MVA</text><text x="220" y="130">Main Switchgear</text><text fill="#05ff5e" x="220" y="142">480 V</text></g>{[[80,"F1","34 kW","#ef4444"],[150,"F2","22 kW","#ff8a00"],[220,"F3","12 kW","#ffd740"],[290,"F4","48 kW","#ef4444"],[360,"F5","8 kW","#05ff5e"]].map(([x,label,value,color]) => <g key={String(label)}><rect fill={String(color)} height="18" rx="2" width="38" x={Number(x)-19} y="197" /><text fill="#061521" fontSize="8" fontWeight="700" textAnchor="middle" x={Number(x)} y="210">{String(value)}</text><circle cx={Number(x)} cy="235" fill="#061521" r="9" stroke="#94a3b8" /><text fill="#e2e8f0" fontSize="7" textAnchor="middle" x={Number(x)} y="238">{String(label)}</text></g>)}</svg><div className="absolute bottom-1 left-0 right-0 flex justify-center gap-5 text-[8px]"><span className="text-[#05ff5e]">■ &lt; 5 kW</span><span className="text-yellow-300">■ 5 - 15 kW</span><span className="text-orange-400">■ 15 - 30 kW</span><span className="text-red-400">■ 30 - 50 kW</span><span className="text-red-500">■ &gt; 50 kW</span></div></div>;
}

function LossesTimeOfDayReference() {
  if (!hasApprovedElectricalModel("losses")) return <NoDataPanel message="No approved losses time-of-day source." />;
  const rows = ["12 AM", "6 AM", "12 PM", "6 PM"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return <div className="h-full text-[8px]"><div className="grid grid-cols-[44px_1fr_18px] gap-2"><div className="grid grid-rows-4 gap-1 text-slate-300">{rows.map((r) => <span key={r}>{r}</span>)}</div><div><div className="grid grid-cols-12 gap-1">{Array.from({ length: 48 }).map((_, index) => { const col = index % 12; const color = col < 4 ? "#16a34a" : col < 8 ? "#facc15" : col < 10 ? "#ff8a00" : "#ef4444"; return <span className="h-[13px] rounded-sm border border-[#061521]" key={index} style={{ backgroundColor: color, opacity: 0.76 + (index % 3) * 0.08 }} />; })}</div><div className="mt-1 grid grid-cols-7 text-center text-slate-500">{days.map((d) => <span key={d}>{d}</span>)}</div></div><div className="grid h-[72px] grid-rows-3 text-right text-slate-400"><span>300</span><span>200</span><span>100</span></div></div></div>;
}

function LossesInsightsReference() {
  if (!hasApprovedElectricalModel("losses")) return <MetricListSmall rows={noDataRows("No approved losses insight model")} />;
  const rows = [["!", "Feeder 4 has the highest losses (48 kW), representing 26.9% of total losses.", "text-red-500"], ["!", "Harmonic losses are 18.0% of total. Power factor improvement could reduce ~32 kW.", "text-orange-400"], ["i", "Peak losses occurred on May 14 at 2:18 PM (245 kW).", "text-cyan-300"], ["✓", "Estimated monthly cost of losses: $10,260.", "text-[#05ff5e]"], ["$", "Potential savings opportunity: $62,000 annually with optimization.", "text-purple-400"]];
  return <div className="flex h-full flex-col gap-1.5 text-[7.7px]">{rows.map(([icon, text, color]) => <div className="grid grid-cols-[24px_1fr] gap-2 border-b border-white/6 pb-1" key={text}><span className={`grid size-5 place-items-center rounded-full border ${color}`}>{icon}</span><span>{text}</span></div>)}<div className="mt-auto text-right text-[9px] text-[#05ff5e]">View Losses Optimization →</div></div>;
}

function LossesOptimizationReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[82px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Losses Detail &nbsp; › &nbsp; <span className="text-[#05ff5e]">Losses Optimization</span></div><h1 className="mt-1 text-2xl font-light">Losses Optimization</h1><p className="mt-1 text-[10px] text-slate-300">Identify, prioritize, and implement actions to reduce system losses and energy waste.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Losses Detail</button></div>
        </div>
        <section className="grid h-[88px] grid-cols-6 gap-3">
          <PeakKpi icon="◎" label="Total Optimization Potential" value="No Data" detail="No approved losses optimization model" tone="green" />
          <PeakKpi icon="$" label="Estimated Annual Savings" value="No Data" detail="No approved savings model" tone="purple" />
          <PeakKpi icon="◷" label="Payback Period" value="No Data" detail="No approved cost model" tone="orange" />
          <PeakKpi icon="⌘" label="Implementation Cost" value="No Data" detail="No approved implementation model" tone="blue" />
          <PeakKpi icon="PF" label="Expected PF Improvement" value="No Data" detail="No approved PF model" tone="green" />
          <PeakKpi icon="♧" label="CO2 Reduction" value="No Data" detail="No approved emissions model" tone="green" />
        </section>
        <section className="mt-2 grid h-[32px] grid-cols-[190px_142px_160px_150px_140px_auto_1fr] items-center gap-3 text-[9px]">
          {[`▣ ${data.dateRange || "No Data"}⌄`, "All Feeders⌄", "All Loss Categories⌄", "All Severities⌄", "All Actions⌄"].map((label) => <button className="h-full rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-300" key={label}>{label}</button>)}
          <button className="text-left text-slate-400">× Clear Filters</button>
          <button className="justify-self-end rounded bg-[#087a35] px-6 py-2 text-[#eafff1]">Recalculate Potential</button>
        </section>
        <section className="mt-2 grid h-[572px] min-h-0 grid-cols-[1.24fr_0.76fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[204px_1fr] gap-3 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[0.96fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="LOSS REDUCTION POTENTIAL BY CATEGORY"><LossReductionPotentialReference /></PeakBox>
              <PeakBox title="OPTIMIZATION IMPACT SUMMARY"><OptimizationImpactSummaryReference /></PeakBox>
            </div>
            <PeakBox title="OPTIMIZATION ACTION PLAN"><LossesOptimizationActionPlanReference /></PeakBox>
          </div>
          <aside className="grid min-h-0 grid-rows-[204px_174px_1fr] gap-3 overflow-hidden">
            <PeakBox title="TOP OPTIMIZATION OPPORTUNITIES"><TopOptimizationOpportunitiesReference /></PeakBox>
            <PeakBox title="ENERGY & COST SAVINGS FORECAST"><LossesSavingsForecastReference /></PeakBox>
            <PeakBox title="IMPLEMENTATION ROADMAP"><LossesRoadmapReference /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function LossReductionPotentialReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved loss-reduction model." />;
  const rows = [["IR Conductor Losses", "24 kW (39%)", "90%", "red"], ["Transformer Losses", "16 kW (26%)", "58%", "orange"], ["Harmonic Losses", "10 kW (16%)", "39%", "yellow"], ["Eddy Current Losses", "7 kW (11%)", "24%", "blue"], ["Other Losses", "5 kW (8%)", "18%", "purple"]];
  return <div className="h-full text-[8px]"><div className="grid h-full grid-cols-[96px_1fr_64px] items-center gap-x-2">{rows.map(([label, value, width, tone]) => <div className="contents" key={label}><span>{label}</span><span className="h-3 rounded-sm bg-slate-900/80"><span className={tone === "red" ? "block h-3 rounded-sm bg-red-500" : tone === "orange" ? "block h-3 rounded-sm bg-orange-500" : tone === "yellow" ? "block h-3 rounded-sm bg-yellow-400" : tone === "blue" ? "block h-3 rounded-sm bg-cyan-400" : "block h-3 rounded-sm bg-purple-500"} style={{ width }} /></span><b className="text-right font-normal text-slate-300">{value}</b></div>)}</div><div className="mt-1 grid grid-cols-[96px_1fr_64px] gap-2 text-slate-500"><span></span><span className="flex justify-between"><span>0</span><span>10</span><span>20</span><span>30</span></span><span></span><span></span><span className="text-center">Potential Reduction (kW)</span></div></div>;
}

function OptimizationImpactSummaryReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved loss-optimization impact model." />;
  const rows = [["Total Losses", "178 kW", "116 kW", "62 kW (34.8%)"], ["Losses Percentage", "2.78%", "1.80%", "0.98%"], ["Energy Lost", "3.42 MWh", "2.22 MWh", "1.20 MWh / day"], ["Cost of Losses", "$342 / day", "$280 / day", "$62 / day"], ["CO₂ Impact", "2.34 t / day", "1.89 t / day", "0.45 t / day"], ["Power Factor", "0.91", "0.97", "+0.06"]];
  return <table className="w-full text-left text-[8px]"><thead className="text-slate-400"><tr>{["", "Before Optimization", "After Optimization", "Improvement"].map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([label, before, after, improvement]) => <tr className="border-t border-white/6" key={label}><td className="py-2 text-slate-300">{label}</td><td>{before}</td><td>{after}</td><td className="font-semibold text-[#05ff5e]">{improvement}</td></tr>)}</tbody></table>;
}

function TopOptimizationOpportunitiesReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved optimization opportunity source." />;
  const rows = [["1", "Upgrade Capacitor Bank on Feeder 4", "High", "18 kW", "$18,900", "1.8 mo"], ["2", "Balance Transformer Loading", "High", "12 kW", "$12,600", "2.4 mo"], ["3", "Install Harmonic Filter on Feeder 1", "Medium", "10 kW", "$10,400", "3.2 mo"], ["4", "Tighten Connections - Feeder 2", "Medium", "8 kW", "$8,200", "2.1 mo"], ["5", "Replace Aging Cables - Feeder 3", "Low", "7 kW", "$7,300", "4.6 mo"], ["6", "Optimize Motor Efficiency (VFD)", "Low", "5 kW", "$4,600", "6.2 mo"]];
  return <div className="flex h-full flex-col"><table className="w-full text-left text-[7.5px]"><thead className="text-slate-400"><tr>{["", "", "", "Potential (kW)", "Annual Savings", "Payback"].map((h, i) => <th className={i === 1 ? "pb-1.5 font-medium" : "pb-1.5 text-right font-medium"} key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{rows.map(([rank, action, sev, potential, savings, payback]) => <tr className="border-t border-white/6" key={rank}><td className="py-1.5 text-red-400">{rank}</td><td className="py-1.5 text-slate-300">{action}</td><td className={sev === "High" ? "py-1.5 text-red-400" : sev === "Medium" ? "py-1.5 text-yellow-300" : "py-1.5 text-[#05ff5e]"}>{sev}</td><td className="py-1.5 text-right">{potential}</td><td className="py-1.5 text-right">{savings}</td><td className="py-1.5 text-right">{payback}</td></tr>)}</tbody></table><div className="mt-auto text-right text-[9px] text-[#05ff5e]">View All Opportunities →</div></div>;
}

function LossesOptimizationActionPlanReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved optimization action-plan model." />;
  const headers = ["#", "Action", "Category", "Location / Asset", "Severity", "Potential Reduction (kW)", "Est. Cost", "Annual Savings", "Payback", "Status"];
  return <div className="flex h-full flex-col overflow-hidden text-[8px]"><table className="w-full table-fixed text-left"><colgroup><col className="w-[5%]" /><col className="w-[21%]" /><col className="w-[11%]" /><col className="w-[12%]" /><col className="w-[8%]" /><col className="w-[10%]" /><col className="w-[8%]" /><col className="w-[10%]" /><col className="w-[7%]" /><col className="w-[8%]" /></colgroup><thead className="text-slate-400"><tr>{headers.map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{lossesOptimizationRows.map((row) => <tr className="border-t border-white/6" key={row.rank}><td className="py-2">{row.rank}</td><td>{row.action}</td><td>{row.category}</td><td>{row.asset}</td><td className={row.severity === "High" ? "text-red-400" : row.severity === "Medium" ? "text-yellow-300" : "text-[#05ff5e]"}>{row.severity}</td><td>{row.potential}</td><td>{row.cost}</td><td>{row.savings}</td><td>{row.payback}</td><td className={row.status === "Recommended" ? "text-[#05ff5e]" : "text-slate-300"}>{row.status}</td></tr>)}</tbody></table><div className="mt-auto grid grid-cols-[37%_10%_8%_10%_8%_10%_17%] border-t border-white/6 pt-2 text-[8px]"><b>Total / Average</b><span></span><b>60 kW</b><b>$23,800</b><b>$62,000</b><b>5.1 mo</b><span></span></div><div className="flex justify-between pt-2 text-[8px] text-slate-400"><span>Showing 1 to 6 of 6 actions</span><button className="text-[#05ff5e]">Download Action Plan &nbsp; ⇩</button></div></div>;
}

function LossesSavingsForecastReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved loss-savings forecast model." />;
  const current = "28,84 78,78 128,86 178,72 228,88 278,82 328,58 378,52 428,72 478,66 528,60";
  const projected = "28,108 78,100 128,106 178,94 228,110 278,104 328,88 378,82 428,96 478,92 528,86";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end gap-4"><span className="text-red-400">━ Current Losses (kWh)</span><span className="text-[#05ff5e]">━ Projected Losses (kWh)</span><span className="rounded bg-[#063b27] px-2 py-0.5 text-[#05ff5e]">Daily</span><span>Monthly</span></div><svg className="h-[112px] w-full" viewBox="0 0 550 124"><g stroke="rgba(148,163,184,.16)">{[20,44,68,92,116].map((y) => <line key={y} x1="28" x2="540" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">6 MWh</text><text x="0" y="52">4 MWh</text><text x="0" y="80">2 MWh</text><text x="12" y="118">0</text></g><polyline fill="none" points={current} stroke="#ef4444" strokeWidth="2.4" />{parseNetworkPoints(current).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`c-${x}`} r="3" stroke="#ef4444" strokeWidth="2" />)}<polyline fill="none" points={projected} stroke="#05ff5e" strokeWidth="2.4" />{parseNetworkPoints(projected).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`p-${x}`} r="3" stroke="#05ff5e" strokeWidth="2" />)}<text fill="#ef4444" fontSize="9" x="468" y="64">3.42 MWh / day</text><text fill="#05ff5e" fontSize="9" x="468" y="90">2.22 MWh / day</text></svg><div className="flex justify-between px-8 text-[8px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div></div>;
}

function LossesActionPlanReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Losses Detail &nbsp; › &nbsp; Losses Optimization &nbsp; › &nbsp; <span className="text-[#05ff5e]">Download Action Plan</span></div><h1 className="mt-1 text-2xl font-light">Download Action Plan</h1><p className="mt-1 text-[10px] text-slate-300">Comprehensive action plan to reduce losses, improve efficiency, and optimize system performance.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div>
        </div>
        <section className="grid h-[94px] grid-cols-6 gap-3">
          <PeakKpi icon="◎" label="Total Optimization Potential" value="No Data" detail="No approved losses optimization model" tone="green" />
          <PeakKpi icon="$" label="Estimated Annual Savings" value="No Data" detail="No approved savings model" tone="purple" />
          <PeakKpi icon="◷" label="Payback Period" value="No Data" detail="No approved cost model" tone="orange" />
          <PeakKpi icon="⌘" label="Implementation Cost" value="No Data" detail="No approved implementation model" tone="blue" />
          <PeakKpi icon="↗" label="CO2 Reduction" value="No Data" detail="No approved emissions model" tone="green" />
          <PeakKpi icon="⌁" label="Expected PF Improvement" value="No Data" detail="No approved PF model" tone="orange" />
        </section>
        <section className="mt-2 flex h-[34px] items-center justify-between rounded border border-cyan-300/15 bg-[#062033] px-3 text-[9px] text-cyan-100">
          <span>ⓘ &nbsp; Action-plan calculations are No Data until a losses optimization model is approved. Analysis period: {data.dateRange || "No Data"}.</span>
          <span className="flex gap-2"><button className="rounded border border-cyan-300/20 bg-[#061421] px-4 py-1.5 text-slate-200">⚙ Customize Plan</button><button className="rounded bg-[#087a35] px-4 py-1.5 text-[#eafff1]">⇩ Download PDF</button></span>
        </section>
        <section className="mt-2 grid h-[556px] min-h-0 grid-cols-[1.34fr_0.62fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[1fr_30px] gap-3 overflow-hidden">
            <PeakBox title="RECOMMENDED ACTION PLAN"><LossesActionPlanTableReference /></PeakBox>
            <div className="flex items-center gap-2 rounded border border-cyan-300/12 bg-[#061521]/92 px-3 text-[8px] text-slate-300"><span className="text-yellow-300">i</span><span><b>Note:</b> Loss reduction, annual savings, and implementation calculations are No Data until a losses optimization model is approved.</span></div>
          </div>
          <aside className="grid min-h-0 grid-rows-[166px_142px_1fr] gap-3 overflow-hidden">
            <PeakBox title="SAVINGS BREAKDOWN"><LossesSavingsBreakdown /></PeakBox>
            <PeakBox title="IMPLEMENTATION ROADMAP"><LossesRoadmapReference /></PeakBox>
            <PeakBox title="PLAN INCLUDES"><LossesPlanIncludes /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function LossesActionPlanTableReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved downloadable action-plan rows." />;
  const headers = ["Priority", "Action", "Category", "Location / Asset", "Potential Reduction (kW)", "Est. Cost", "Annual Savings", "Payback", "Implementation Time", "Status"];
  return (
    <div className="flex h-full flex-col overflow-hidden text-[8px]">
      <table className="w-full table-fixed text-left">
        <colgroup><col className="w-[5%]" /><col className="w-[20%]" /><col className="w-[10%]" /><col className="w-[11%]" /><col className="w-[10%]" /><col className="w-[8%]" /><col className="w-[10%]" /><col className="w-[7%]" /><col className="w-[10%]" /><col className="w-[9%]" /></colgroup>
        <thead className="text-slate-400"><tr>{headers.map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead>
        <tbody>{lossesActionPlanRows.map((row) => <LossesActionRowReference key={row.priority} row={row} />)}</tbody>
      </table>
      <div className="mt-auto grid grid-cols-[37%_10%_8%_10%_8%_10%_17%] border-t border-white/6 pt-2 text-[8px]">
        <b className="text-slate-200">TOTAL / AVERAGE</b><span></span><b>60 kW<br /><span className="font-normal text-slate-400">(34.8%)</span></b><b>$23,800</b><b>$62,000</b><b>5.1 mo</b><span></span>
      </div>
    </div>
  );
}

function LossesActionRowReference({ row }: { row: typeof lossesActionPlanRows[number] }) {
  const statusClass = row.status === "Recommended" ? "border-[#05ff5e]/40 bg-[#063b27] text-[#05ff5e]" : "border-cyan-300/20 bg-[#061421] text-cyan-300";
  return (
    <>
      <tr className="border-t border-white/6">
        <td className="py-2"><span className={row.priority === "3" ? "grid size-5 place-items-center rounded-full border border-yellow-300 text-yellow-300" : row.priority === "4" ? "grid size-5 place-items-center rounded-full border border-yellow-300 text-yellow-300" : "grid size-5 place-items-center rounded-full border border-[#05ff5e] text-[#05ff5e]"}>{row.priority}</span></td>
        <td className="py-2 font-medium text-slate-200">{row.action}</td>
        <td className="py-2">{row.category}</td>
        <td className="py-2">{row.asset}</td>
        <td className="py-2 font-semibold text-slate-100">{row.potential}<br /><span className="font-normal text-slate-500">{row.percent}</span></td>
        <td className="py-2">{row.cost}</td>
        <td className="py-2">{row.savings}</td>
        <td className="py-2">{row.payback}</td>
        <td className="py-2">{row.time}</td>
        <td className="py-2"><span className={`rounded border px-2 py-0.5 text-[7px] ${statusClass}`}>{row.status}</span></td>
      </tr>
      <tr className="border-b border-white/6 text-[7.4px] text-slate-400">
        <td></td><td className="pb-2" colSpan={9}><span className="text-slate-500">Description:</span> &nbsp; {row.description}</td>
      </tr>
    </>
  );
}

function LossesSavingsBreakdown() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved savings breakdown model." />;
  const rows = [["Reactive Power Savings", "$31,500 (50.8%)", "#05ff5e"], ["Transformer Savings", "$12,600 (20.3%)", "#a855f7"], ["Harmonic Savings", "$10,400 (16.8%)", "#ff8a00"], ["IR Conductor Savings", "$7,300 (11.8%)", "#29b6f6"], ["Other Savings", "$300 (0.5%)", "#64748b"]];
  return <div className="grid h-full grid-cols-[112px_1fr] items-center gap-3"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#05ff5e 0 51%, #a855f7 51% 71%, #ff8a00 71% 88%, #29b6f6 88% 99%, #64748b 99% 100%)" }}><div className="grid size-16 place-items-center rounded-full bg-[#061521] text-center text-lg">$62,000<br /><span className="text-[7px] text-slate-400">Annual Savings</span></div></div><div className="space-y-1.5 text-[8px]">{rows.map(([label, value, color]) => <div className="flex justify-between gap-2" key={label}><span><span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><b>{value}</b></div>)}</div></div>;
}

function LossesRoadmapReference() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <NoDataPanel message="No approved implementation roadmap model." />;
  const items = [["1", "Quick Wins", "(0 - 30 days)", "26 kW", "$21,100 / yr"], ["2", "Short Term", "(1 - 3 months)", "18 kW", "$18,700 / yr"], ["3", "Mid Term", "(3 - 6 months)", "11 kW", "$11,500 / yr"], ["4", "Long Term", "(6 - 12 months)", "5 kW", "$5,700 / yr"], ["5", "Total Potential", "(12+ months)", "60 kW", "$62,000 / yr"]];
  return <div className="h-full text-center text-[8px]"><div className="relative mt-2 grid grid-cols-5 gap-1"><div className="absolute left-[10%] right-[10%] top-3 h-0.5 bg-gradient-to-r from-[#05ff5e] via-[#ffd740] to-[#a855f7]" />{items.map(([step, label, time, kw, savings], index) => <div className="relative" key={step}><div className={index === 4 ? "mx-auto grid size-7 place-items-center rounded-full border border-purple-400 bg-[#061521] text-purple-400" : index === 3 ? "mx-auto grid size-7 place-items-center rounded-full border border-cyan-300 bg-[#061521] text-cyan-300" : index === 2 ? "mx-auto grid size-7 place-items-center rounded-full border border-yellow-300 bg-[#061521] text-yellow-300" : index === 1 ? "mx-auto grid size-7 place-items-center rounded-full border border-orange-400 bg-[#061521] text-orange-400" : "mx-auto grid size-7 place-items-center rounded-full border border-[#05ff5e] bg-[#061521] text-[#05ff5e]"}>{step}</div><div className={index === 4 ? "mt-2 text-purple-400" : index === 3 ? "mt-2 text-cyan-300" : index === 2 ? "mt-2 text-yellow-300" : index === 1 ? "mt-2 text-orange-400" : "mt-2 text-[#05ff5e]"}>{label}</div><div className="text-[7px] text-slate-500">{time}</div><b className={index === 4 ? "text-purple-400" : "text-[#05ff5e]"}>{kw}</b><br /><span className="text-yellow-300">{savings}</span></div>)}</div></div>;
}

function LossesPlanIncludes() {
  if (!hasApprovedElectricalModel("lossOptimization")) return <MetricListSmall rows={noDataRows("No approved report package model")} />;
  const rows = ["Detailed action steps and implementation guidelines", "Technical specifications and equipment recommendations", "Expected savings calculations and ROI analysis", "Implementation timeline and resource requirements", "Risk assessment and mitigation strategies"];
  return <div className="grid h-full grid-cols-[1fr_118px] gap-5 text-[9px]"><div className="space-y-3">{rows.map((row) => <div className="flex gap-2 text-slate-300" key={row}><span className="text-[#05ff5e]">✓</span><span>{row}</span></div>)}</div><div className="grid place-items-center border-l border-cyan-300/12"><div className="text-center"><div className="mx-auto grid h-20 w-16 place-items-center rounded border-2 border-slate-500 text-xl text-slate-300">PDF</div><div className="mt-3 text-slate-300">Professional<br />Report Format</div></div></div></div>;
}

const lossesActionPlanRows = [
  { priority: "1", action: "Upgrade Capacitor Bank on Feeder 4", category: "Reactive Power", asset: "Feeder 4", potential: "18 kW", percent: "(10.1%)", cost: "$6,800", savings: "$18,900", payback: "1.8 mo", time: "1-2 weeks", status: "Recommended", description: "Install higher capacity automatic capacitor bank to improve power factor and reduce reactive losses." },
  { priority: "2", action: "Balance Transformer Loading", category: "Transformer", asset: "Main Transformer", potential: "12 kW", percent: "(6.7%)", cost: "$4,500", savings: "$12,600", payback: "2.4 mo", time: "1-2 weeks", status: "Recommended", description: "Redistribute load to optimize transformer loading and reduce core losses." },
  { priority: "3", action: "Install Harmonic Filter on Feeder 1", category: "Harmonics", asset: "Feeder 1", potential: "10 kW", percent: "(5.6%)", cost: "$5,200", savings: "$10,400", payback: "3.2 mo", time: "2-3 weeks", status: "Recommended", description: "Install passive harmonic filter to reduce THD and minimize additional losses." },
  { priority: "4", action: "Tighten Electrical Connections", category: "IR Conductor Losses", asset: "Feeder 2", potential: "8 kW", percent: "(4.5%)", cost: "$1,200", savings: "$8,200", payback: "2.1 mo", time: "1 week", status: "Recommended", description: "Inspect and tighten all high-resistance connections to reduce I²R losses." },
  { priority: "5", action: "Replace Aging Cables on Feeder 3", category: "IR Conductor Losses", asset: "Feeder 3", potential: "7 kW", percent: "(3.9%)", cost: "$3,100", savings: "$7,300", payback: "4.6 mo", time: "2-3 weeks", status: "Optional", description: "Replace aging cables with larger gauge to reduce conductor losses." },
  { priority: "6", action: "Optimize Motor with VFD", category: "Motor Efficiency", asset: "Chiller Plant", potential: "5 kW", percent: "(2.8%)", cost: "$3,000", savings: "$4,600", payback: "6.2 mo", time: "2-4 weeks", status: "Optional", description: "Install VFD on motor to improve efficiency and reduce energy consumption." },
];

const lossesOptimizationRows = [
  { rank: "1", action: "Upgrade Capacitor Bank", category: "Reactive Power", asset: "Feeder 4", severity: "High", potential: "18", cost: "$6,800", savings: "$18,900", payback: "1.8 mo", status: "Recommended" },
  { rank: "2", action: "Balance Transformer Loading", category: "Transformer", asset: "Main Transformer", severity: "High", potential: "12", cost: "$4,500", savings: "$12,600", payback: "2.4 mo", status: "Recommended" },
  { rank: "3", action: "Install Harmonic Filter", category: "Harmonics", asset: "Feeder 1", severity: "Medium", potential: "10", cost: "$5,200", savings: "$10,400", payback: "3.2 mo", status: "Recommended" },
  { rank: "4", action: "Tighten Electrical Connections", category: "IR Conductor", asset: "Feeder 2", severity: "Medium", potential: "8", cost: "$1,200", savings: "$8,200", payback: "2.1 mo", status: "Recommended" },
  { rank: "5", action: "Replace Aging Cables", category: "IR Conductor", asset: "Feeder 3", severity: "Low", potential: "7", cost: "$3,100", savings: "$7,300", payback: "4.6 mo", status: "Optional" },
  { rank: "6", action: "Optimize Motor with VFD", category: "Eddy Current", asset: "Chiller Plant", severity: "Low", potential: "5", cost: "$3,000", savings: "$4,600", payback: "6.2 mo", status: "Optional" },
];

function OptimizationDetailScreen() {
  return (
    <>
      <section className="mt-2 grid h-[64px] grid-cols-[1.55fr_repeat(5,1fr)] gap-2">
        <article className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2">
          <div className="text-[9px] font-semibold uppercase text-slate-300">Load Rebalancing On Feeder 4 <span className="ml-2 rounded bg-[#064d2b] px-2 py-0.5 text-[7px] text-[#05ff5e]">Recommended</span></div>
          <p className="mt-1 text-[8px] text-slate-400">Rebalance load distribution to reduce overload, improve capacity utilization, and defer infrastructure upgrades.</p>
        </article>
        <NetworkKpi label="Capacity Gain" value="120 kVA" detail="Recoverable" tone="green" />
        <NetworkKpi label="Estimated Savings" value="$52,300 / yr" detail="$4,358 / month" tone="purple" />
        <NetworkKpi label="Payback Period" value="2.1 months" detail="Very Good" tone="yellow" />
        <NetworkKpi label="Implementation Time" value="1–2 weeks" detail="Low Impact" tone="blue" />
        <NetworkKpi label="Confidence Score" value="92%" detail="High" tone="blue" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.28fr_0.82fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <div className="grid h-[164px] grid-cols-[0.75fr_0.75fr_0.7fr] gap-2">
            <DashboardPanel title="Current Condition" variant="enterprise"><Gauge label="Overloaded" value="92%" /><MetricListSmall compact rows={[["Avg Load", "92%"], ["Peak Load", "98%"], ["Power Factor", "0.87"], ["THD", "2.5%"]]} /></DashboardPanel>
            <DashboardPanel title="Optimized Condition (Simulated)" variant="enterprise"><Gauge label="Optimal" value="80%" /><MetricListSmall compact rows={[["Avg Load", "80%"], ["Peak Load", "86%"], ["Power Factor", "0.95"], ["THD", "1.8%"]]} /></DashboardPanel>
            <DashboardPanel title="Capacity Impact" variant="enterprise"><Bars rows={[["Current Used", "92%", "red"], ["Optimized", "80%", "green"], ["Available", "20%", "green"]]} /></DashboardPanel>
          </div>
          <div className="grid h-[150px] grid-cols-[0.74fr_1fr] gap-2">
            <DashboardPanel title="Load Distribution Before vs After" variant="enterprise"><NetworkTable headers={["Phase", "Before", "After"]} rows={[["Phase A", "910", "720"], ["Phase B", "650", "690"], ["Phase C", "630", "670"]]} /></DashboardPanel>
            <DashboardPanel title="Hourly Load Profile (7 Days Average)" variant="enterprise"><NetworkTrend colors={["#ef4444", "#05ff5e", "#ffd740"]} /></DashboardPanel>
          </div>
          <div className="grid h-[118px] grid-cols-[0.72fr_1fr_0.7fr] gap-2">
            <DashboardPanel title="Savings Breakdown" variant="enterprise"><MetricListSmall rows={[["Demand Charge Reduction", "$28,600"], ["Loss Reduction Savings", "$12,400"], ["Efficiency Improvement", "$11,300"], ["Total Annual Savings", "$52,300"]]} /></DashboardPanel>
            <DashboardPanel title="Implementation Steps" variant="enterprise"><NetworkTable headers={["Step", "Action", "Owner", "Status"]} rows={[["1", "Load analysis & mapping", "Engineering", "Completed"], ["2", "Load redistribution plan", "Engineering", "In Progress"], ["3", "Capacitor bank optimization", "Field Tech", "Pending"], ["4", "Phase balancing adjustments", "Field Tech", "Pending"]]} /></DashboardPanel>
            <DashboardPanel title="Financial Summary" variant="enterprise"><MetricListSmall rows={[["Implementation Cost", "$6,500"], ["Annual Savings", "$52,300"], ["Payback Period", "2.1 months"], ["Net Present Value", "$221,600"]]} /></DashboardPanel>
          </div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[156px]" title="Opportunity Information" variant="enterprise"><MetricListSmall compact rows={[["Opportunity ID", "OPT-2025-0001"], ["Type", "Capacity Optimization"], ["Location", "Electrical Room"], ["Asset / Feeder", "Feeder 4"], ["Status", "Recommended"]]} /></DashboardPanel>
          <DashboardPanel className="h-[102px]" title="Root Cause Analysis" variant="enterprise"><MetricListSmall compact rows={[["Unbalanced loading", "Detected"], ["Feeder 4 above optimal band", ">80%"], ["Non-critical loads", "Phase A"], ["Reactive imbalance", "Higher kVA"]]} /></DashboardPanel>
          <DashboardPanel className="h-[102px]" title="Recommended Actions" variant="enterprise"><MetricListSmall compact rows={[["Redistribute loads", "Recommended"], ["Balance phase loading", "Recommended"], ["Optimize capacitor bank", "Recommended"], ["Monitor after implementation", "Required"]]} /></DashboardPanel>
          <DashboardPanel className="h-[86px]" title="Implementation Notes" variant="enterprise"><MetricListSmall compact rows={[["Hardware upgrade", "Not required"], ["Coordination", "Operations team"], ["Work window", "Normal operation"]]} /><button className="mt-1 w-full rounded bg-[#087a35] py-1 text-[8px] text-[#eafff1]">Generate Implementation Plan</button></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function OptimizationDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Optimization Opportunities &nbsp; › &nbsp; <span className="text-[#05ff5e]">Optimization Detail</span></div><h1 className="mt-1 text-2xl font-light">Optimization Detail</h1><p className="mt-1 text-[10px] text-slate-300">Detailed analysis of selected optimization opportunity and implementation plan.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▣ Save Plan</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Opportunities</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-[1.72fr_repeat(5,1fr)] gap-3">
          <article className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
            <div className="text-[10px] font-semibold uppercase text-slate-200">Optimization Opportunity <span className="ml-2 rounded bg-[#13283a] px-2 py-0.5 text-[7px] text-slate-300">No Data</span></div>
            <p className="mt-2 max-w-[360px] text-[9px] leading-snug text-slate-300">No approved recommendation engine/model exists for a selected optimization opportunity.</p>
          </article>
          <PeakKpi icon="↗" label="Capacity Gain" value="No Data" detail="No approved optimization model" tone="green" />
          <PeakKpi icon="$" label="Estimated Savings" value="No Data" detail="No approved savings model" tone="purple" />
          <PeakKpi icon="◷" label="Payback Period" value="No Data" detail="No approved cost model" tone="orange" />
          <PeakKpi icon="⌘" label="Implementation Time" value="No Data" detail="No approved implementation model" tone="blue" />
          <PeakKpi icon="◈" label="Confidence Score" value="No Data" detail="No approved model score" tone="blue" />
        </section>
        <section className="mt-2 grid h-[574px] min-h-0 grid-cols-[1.38fr_0.58fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[204px_174px_1fr] gap-3 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[0.76fr_0.76fr_0.68fr] gap-3 overflow-hidden">
              <PeakBox title="CURRENT CONDITION"><OptimizationConditionGauge value="92%" label="of Capacity" foot="Overloaded" tone="red" metrics={[["Avg Load", "92%"], ["Peak Load", "98%"], ["Est. Capacity Used", "1.84 MW"], ["Total Capacity", "2.00 MW"], ["Power Factor", "0.87"], ["THD (I)", "2.5%"]]} /></PeakBox>
              <PeakBox title="OPTIMIZED CONDITION (SIMULATED)"><OptimizationConditionGauge value="80%" label="of Capacity" foot="Optimal" tone="green" metrics={[["Avg Load", "80%"], ["Peak Load", "86%"], ["Est. Capacity Used", "1.60 MW"], ["Total Capacity", "2.00 MW"], ["Power Factor", "0.95"], ["THD (I)", "1.8%"]]} /></PeakBox>
              <PeakBox title="CAPACITY IMPACT"><CapacityImpactReference /></PeakBox>
            </div>
            <div className="grid min-h-0 grid-cols-[0.72fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="LOAD DISTRIBUTION BEFORE vs AFTER"><LoadDistributionBeforeAfter /></PeakBox>
              <PeakBox title="HOURLY LOAD PROFILE (7 DAYS AVERAGE)"><HourlyLoadProfileReference /></PeakBox>
            </div>
            <div className="grid min-h-0 grid-cols-[0.7fr_1.05fr_0.7fr] gap-3 overflow-hidden">
              <PeakBox title="SAVINGS BREAKDOWN"><SavingsBreakdownReference /></PeakBox>
              <PeakBox title="IMPLEMENTATION STEPS"><ImplementationStepsReference /></PeakBox>
              <PeakBox title="FINANCIAL SUMMARY"><FinancialSummaryReference /></PeakBox>
            </div>
          </div>
          <aside className="grid min-h-0 grid-rows-[164px_112px_112px_1fr] gap-3 overflow-hidden">
            <PeakBox title="OPPORTUNITY INFORMATION"><OpportunityInfoReference /></PeakBox>
            <PeakBox title="ROOT CAUSE ANALYSIS"><OptimizationBullets rows={[["◷", "Unbalanced three-phase loading detected.", "text-yellow-300"], ["⚑", "Feeder 4 operating above optimal load band (>80%).", "text-orange-400"], ["▣", "Non-critical loads concentrated on Phase A.", "text-cyan-300"], ["⌁", "Reactive power imbalance contributing to higher kVA.", "text-cyan-300"]]} /></PeakBox>
            <PeakBox title="RECOMMENDED ACTIONS"><OptimizationBullets rows={[["✓", "Redistribute non-critical loads to other feeders.", "text-[#05ff5e]"], ["✓", "Balance phase loading to within 10% variance.", "text-[#05ff5e]"], ["✓", "Optimize capacitor bank settings.", "text-[#05ff5e]"], ["✓", "Monitor load profile after implementation.", "text-[#05ff5e]"]]} /></PeakBox>
            <PeakBox title="IMPLEMENTATION NOTES"><ImplementationNotesReference /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function OptimizationConditionGauge({ foot, label, metrics, tone, value }: { foot: string; label: string; metrics: string[][]; tone: "green" | "red"; value: string }) {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved optimization condition model." />;
  const color = tone === "red" ? "#ef4444" : "#05ff5e";
  return <div className="grid h-full grid-cols-[120px_1fr] items-center gap-3 text-[8px]"><div className="text-center"><div className="grid size-28 place-items-center rounded-full" style={{ background: `conic-gradient(${color} 0 ${tone === "red" ? "92%" : "80%"}, #0f2533 ${tone === "red" ? "92%" : "80%"} 100%)` }}><div className="grid size-[72px] place-items-center rounded-full bg-[#061521] text-center text-3xl" style={{ color }}>{value}<br /><span className="text-[8px] text-slate-300">{label}</span></div></div><div className={tone === "red" ? "mt-2 text-red-400" : "mt-2 text-[#05ff5e]"}>{foot}</div></div><div className="space-y-[5px]">{metrics.map(([k, v]) => <div className="flex justify-between border-b border-white/6 pb-1" key={k}><span>{k}</span><b className={Number.parseFloat(v) > 90 || v === "0.87" ? "text-red-400" : v === "0.95" || v === "1.8%" || v === "80%" || v === "86%" ? "text-[#05ff5e]" : "text-slate-200"}>{v}</b></div>)}</div></div>;
}

function CapacityImpactReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved capacity impact model." />;
  return <div className="h-full text-[8px]"><svg className="h-[150px] w-full" viewBox="0 0 230 150"><g stroke="rgba(148,163,184,.18)">{[20,48,76,104,132].map((y) => <line key={y} x1="34" x2="224" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="2" y="24">2,500</text><text x="2" y="52">2,000</text><text x="2" y="80">1,500</text><text x="2" y="108">1,000</text><text x="12" y="136">0</text></g>{[["Current Used",62,"#ef4444","1,840 kVA"],["Optimized Used",74,"#22c55e","1,600 kVA"],["Available",106,"#29b6f6","400 kVA"]].map(([label,x,color,text]) => <g key={String(label)}><rect fill={String(color)} height={132-Number(x)} width="26" x={Number(x)} y={Number(x)} /><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={Number(x)+13} y={Number(x)-5}>{String(text)}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={Number(x)+13} y="145">{String(label).split(" ")[0]}</text></g>)}</svg><div className="mt-1 flex gap-3 text-[7px]"><span className="text-red-400">■ Current Used</span><span className="text-[#05ff5e]">■ Optimized Used</span><span className="text-cyan-300">■ Available</span></div></div>;
}

function LoadDistributionBeforeAfter() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved before/after load distribution model." />;
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-between"><span>kVA</span><span>Before Optimization</span><span>After Optimization (Simulated)</span></div><svg className="h-[136px] w-full" viewBox="0 0 330 140"><g fill="#94a3b8" fontSize="8"><text x="0" y="24">1000</text><text x="0" y="62">750</text><text x="0" y="100">500</text></g>{[[48,30,"910","#ef4444"],[86,62,"650","#eab308"],[124,68,"630","#147dff"],[210,64,"720","#22c55e"],[248,70,"690","#22c55e"],[286,72,"670","#22c55e"]].map(([x,y,val,color]) => <g key={`${x}-${val}`}><rect fill={String(color)} height={122-Number(y)} width="24" x={Number(x)} y={Number(y)} /><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={Number(x)+12} y={Number(y)-5}>{String(val)}</text></g>)}<path d="M160 74 H190" stroke="#94a3b8" strokeWidth="5" /><path d="M190 74 l-10 -8 v16 z" fill="#94a3b8" /><g fill="#94a3b8" fontSize="8" textAnchor="middle"><text x="60" y="136">Phase A</text><text x="98" y="136">Phase B</text><text x="136" y="136">Phase C</text><text x="222" y="136">Phase A</text><text x="260" y="136">Phase B</text><text x="298" y="136">Phase C</text></g></svg><div className="text-right text-[7px] text-slate-400">Optimal Range (±10%)</div></div>;
}

function HourlyLoadProfileReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved optimized load profile source." />;
  const before = "20,120 48,118 76,112 104,96 132,78 160,58 188,76 216,68 244,48 272,62 300,70 328,88 356,94 384,110 412,118";
  const after = "20,138 48,136 76,130 104,116 132,98 160,78 188,96 216,88 244,70 272,80 300,92 328,106 356,112 384,124 412,130";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-red-400">━ Before Optimization</span><span className="text-[#05ff5e]">━ After Optimization</span><span className="text-slate-400">-- Capacity Limit</span></div><svg className="h-[136px] w-full" viewBox="0 0 430 140"><g stroke="rgba(148,163,184,.18)">{[20,48,76,104,128].map((y) => <line key={y} x1="20" x2="420" y1={y} y2={y} />)}</g><line stroke="#ef4444" strokeDasharray="5 5" x1="20" x2="420" y1="36" y2="36" /><polyline fill="none" points={before} stroke="#ef4444" strokeWidth="2" />{parseNetworkPoints(before).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={`b-${x}`} r="3" stroke="#ef4444" strokeWidth="2" />)}<polyline fill="none" points={after} stroke="#05ff5e" strokeWidth="2" />{parseNetworkPoints(after).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={`a-${x}`} r="3" stroke="#05ff5e" strokeWidth="2" />)}</svg><div className="flex justify-between text-[7px] text-slate-500"><span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span><span>12 AM</span></div></div>;
}

function SavingsBreakdownReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved savings breakdown model")} />;
  return <div className="space-y-3 text-[8px]">{[["Demand Charge Reduction", "$28,600", "54.7%"], ["Loss Reduction Savings", "$12,400", "23.7%"], ["Efficiency Improvement", "$11,300", "21.6%"]].map(([label,value,pct]) => <div className="grid grid-cols-[1fr_58px_40px] border-b border-white/6 pb-2" key={label}><span>{label}</span><b className="text-[#05ff5e]">{value}</b><span>{pct}</span></div>)}<div className="flex justify-between pt-2 text-[#05ff5e]"><b>Total Annual Savings</b><b>$52,300&nbsp;&nbsp;&nbsp;100%</b></div></div>;
}

function ImplementationStepsReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved implementation-step model." />;
  const rows = [["1", "Load analysis & mapping", "Engineering Team", "1 day", "Completed"], ["2", "Load redistribution plan", "Engineering Team", "1 day", "In Progress"], ["3", "Capacitor bank optimization", "Field Technician", "0.5 day", "Pending"], ["4", "Phase balancing adjustments", "Field Technician", "1 day", "Pending"], ["5", "Post optimization verification", "Engineering Team", "0.5 day", "Pending"]];
  return <table className="w-full text-left text-[7.2px]"><thead className="text-slate-400"><tr>{["Step", "Action", "Owner", "Duration", "Status"].map((h) => <th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([step,action,owner,duration,status]) => <tr className="border-t border-white/6" key={step}><td className="py-[2.6px]"><span className="grid size-4 place-items-center rounded-full border border-[#05ff5e] text-[#05ff5e]">{step}</span></td><td>{action}</td><td>{owner}</td><td>{duration}</td><td className={status === "Completed" ? "text-[#05ff5e]" : status === "In Progress" ? "text-yellow-300" : "text-slate-300"}>{status}</td></tr>)}</tbody></table>;
}

function FinancialSummaryReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved financial model")} />;
  return <div className="flex h-full flex-col text-[7.7px]">{[["Implementation Cost", "$6,500"], ["Annual Savings", "$52,300"], ["Payback Period", "2.1 months"], ["ROI (1 Year)", "705%"]].map(([label,value]) => <div className="flex justify-between border-b border-white/6 py-1" key={label}><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}<div className="mt-auto rounded border border-cyan-300/12 bg-[#061421] p-1.5"><div className="text-slate-400">Net Present Value (5 Years)</div><div className="text-xl leading-tight text-[#05ff5e]">$221,600</div></div></div>;
}

function OpportunityInfoReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved opportunity model")} />;
  const rows = [["Opportunity ID", "OPT-2025-0001"], ["Type", "Capacity Optimization"], ["Location", "Electrical Room"], ["Asset / Feeder", "Feeder 4"], ["Identified", "May 18, 2025 10:12 AM"], ["Priority", "High"], ["Status", "Recommended"]];
  return <div className="space-y-1 text-[8px]">{rows.map(([label,value]) => <div className="flex justify-between border-b border-white/6 pb-1.5" key={label}><span>{label}</span><b className={value === "High" ? "text-red-400" : "text-[#05ff5e]"}>{value}</b></div>)}</div>;
}

function OptimizationBullets({ rows }: { rows: string[][] }) {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved recommendation detail model")} />;
  return <div className="space-y-2 text-[8px]">{rows.map(([icon,text,color]) => <div className="grid grid-cols-[20px_1fr_auto] gap-2 border-b border-white/6 pb-1.5" key={text}><span className={color}>{icon}</span><span>{text}</span><b className={color}>{text.includes("detected") ? "Detected" : text.includes(">80") ? ">80%" : text.includes("Phase") ? "Phase A" : text.includes("Reactive") ? "Higher kVA" : "Recommended"}</b></div>)}</div>;
}

function ImplementationNotesReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved implementation-note model")} />;
  return <div className="flex h-full flex-col text-[8px]"><div className="space-y-2">{[["No hardware upgrade required.", "Not required"], ["Coordination with operations team recommended.", "Operations team"], ["Can be implemented during normal operation.", "Normal operation"]].map(([label,value]) => <div className="grid grid-cols-[20px_1fr_auto] gap-2 border-b border-white/6 pb-1.5" key={label}><span className="text-[#05ff5e]">ⓘ</span><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}</div><button className="mt-auto rounded bg-[#087a35] py-2 text-[9px] text-[#eafff1]">▣ Generate Implementation Plan</button></div>;
}

function PowerDetailScreen() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-6 gap-2">
        <NetworkKpi label="Total Apparent Power" value="6.41 MVA" detail="↑ 4.3% vs Last 7 Days" tone="purple" />
        <NetworkKpi label="Total Real Power" value="5.82 MW" detail="↑ 4.1% vs Last 7 Days" tone="green" />
        <NetworkKpi label="Total Reactive Power" value="2.68 MVAR" detail="↓ 2.7% vs Last 7 Days" tone="blue" />
        <NetworkKpi label="Power Factor (Avg)" value="0.91" detail="+0.03 vs Last 7 Days" tone="yellow" />
        <NetworkKpi label="Power Factor (Min)" value="0.78" detail="May 15, 2:14 PM" tone="yellow" />
        <NetworkKpi label="KVA Utilization" value="75%" detail="Of System Capacity" tone="purple" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.34fr_0.88fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[174px]" title="Power Trend (7 Days)" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#29b6f6", "#a855f7", "#ff8a00"]} /></DashboardPanel>
          <div className="grid h-[128px] grid-cols-[1fr_0.74fr] gap-2"><DashboardPanel title="Power By Feeder (Current)" variant="enterprise"><NetworkTable headers={["Feeder", "kW", "kVAR", "kVA", "PF", "Status"]} rows={powerFeederRows} /></DashboardPanel><DashboardPanel title="Power By Time Of Day (Average)" variant="enterprise"><HeatMap /></DashboardPanel></div>
          <div className="grid h-[132px] grid-cols-[0.85fr_0.74fr] gap-2"><DashboardPanel title="Demand vs Capacity" variant="enterprise"><NetworkTrend colors={["#a855f7", "#29b6f6"]} /></DashboardPanel><DashboardPanel title="Reactive Power Analysis" variant="enterprise"><MetricListSmall rows={[["Leading (Capacitive)", "-0.45 MVAR"], ["Neutral", "0.00–0.20 MVAR"], ["Lagging (Inductive)", "2.68 MVAR"], ["View Reactive Power Details", "→"]]} /></DashboardPanel></div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <div className="grid h-[120px] grid-cols-[0.85fr_1fr] gap-2"><DashboardPanel title="Power Triangle (Current)" variant="enterprise"><PowerTriangle /></DashboardPanel><DashboardPanel title="Power Component Breakdown" variant="enterprise"><NetworkDonut compact total="6.41 MVA" rows={[["Real Power (P)", "5.82 MW"], ["Reactive Power (Q)", "2.68 MVAR"], ["Losses", "0.12 MW"]]} /></DashboardPanel></div>
          <DashboardPanel className="h-[80px]" title="Power Factor Distribution (7 Days)" variant="enterprise"><CompactBars rows={[["Poor", "8%", "red"], ["Fair", "32%", "yellow"], ["Good", "38%", "yellow"], ["Excellent", "22%", "green"]]} /></DashboardPanel>
          <DashboardPanel className="h-[120px]" title="Low Power Factor Events" variant="enterprise"><NetworkTable headers={["Time", "Min PF", "Location", "Impact"]} rows={lowPfRows.slice(0, 4)} /><div className="mt-1 text-right text-[8px] text-[#05ff5e]">View All Low PF Events →</div></DashboardPanel>
          <DashboardPanel className="h-[72px]" title="Insights" variant="enterprise"><MetricListSmall compact rows={[["Power factor improved", "0.03 vs previous 7 days"], ["Peak apparent power", "May 16 at 2:18 PM"], ["Reactive power", "Acceptable range"], ["Potential savings", "62 kW in losses"]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function PowerDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; <span className="text-[#05ff5e]">Power Detail</span></div><h1 className="mt-1 text-2xl font-light">Power Detail</h1><p className="mt-1 text-[10px] text-slate-300">Comprehensive analysis of apparent power, real power, reactive power, and power factor performance.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Overview</button></div>
        </div>
        <section className="grid h-[88px] grid-cols-6 gap-3">
          <LossKpi icon="⌁" label="Total Apparent Power ⓘ" value="No Data" detail="No approved apparent-power source" tone="purple" />
          <LossKpi icon="⌁" label="Total Real Power ⓘ" value={formatMw(data.currentLoadKva)} detail="Latest capacity intelligence" tone="green" />
          <LossKpi icon="⌁" label="Total Reactive Power ⓘ" value="No Data" detail="No approved reactive-power source" tone="blue" />
          <LossKpi icon="⌘" label="Power Factor (Avg) ⓘ" value="No Data" detail="No approved power-factor source" tone="orange" />
          <LossKpi icon="⌁" label="Power Factor (Min) ⓘ" value="No Data" detail="No approved low-PF event source" tone="orange" />
          <LossKpi icon="⌁" label="kVA Utilization ⓘ" value={data.transformerKva > 0 ? `${utilizationPct(data)}%` : "No Data"} detail="Used capacity over transformer capacity" tone="purple" />
        </section>
        <section className="mt-2 grid h-[604px] min-h-0 grid-cols-[1.34fr_0.9fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[244px_170px_1fr] gap-3 overflow-hidden">
            <PeakBox title="POWER TREND (7 DAYS) ⓘ"><PowerTrendReference /></PeakBox>
            <div className="grid min-h-0 grid-cols-[1fr_0.74fr] gap-3 overflow-hidden">
              <PeakBox title="POWER BY FEEDER (CURRENT) ⓘ"><PowerFeederTableReference /></PeakBox>
              <PeakBox title="POWER BY TIME OF DAY (AVERAGE) ⓘ"><PowerTimeOfDayReference /></PeakBox>
            </div>
            <div className="grid min-h-0 grid-cols-[0.88fr_0.74fr] gap-3 overflow-hidden">
              <PeakBox title="DEMAND VS CAPACITY"><DemandVsCapacityReference /></PeakBox>
              <PeakBox title="REACTIVE POWER ANALYSIS"><PowerReactiveAnalysisReference /></PeakBox>
            </div>
          </div>
          <aside className="grid min-h-0 grid-rows-[162px_92px_128px_1fr] gap-3 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[0.9fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="POWER TRIANGLE (CURRENT)"><ReactiveTriangleReference /></PeakBox>
              <PeakBox title="POWER COMPONENT BREAKDOWN (7 DAYS) ⓘ"><PowerComponentBreakdownReference /></PeakBox>
            </div>
            <PeakBox title="POWER FACTOR DISTRIBUTION (7 DAYS) ⓘ"><PowerFactorDistributionReference /></PeakBox>
            <PeakBox title="LOW POWER FACTOR EVENTS"><PowerLowPfEventsReference /></PeakBox>
            <PeakBox title="INSIGHTS"><PowerInsightsReference /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function PowerTrendReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved power trend source." />;
  const real = "24,112 58,104 92,98 126,96 160,90 194,82 228,78 262,86 296,76 330,80 364,72 398,76 432,74 466,78 500,82 534,76";
  const reactive = "24,136 58,132 92,130 126,126 160,116 194,106 228,118 262,110 296,96 330,108 364,116 398,108 432,112 466,110 500,106 534,102";
  const apparent = "24,72 58,70 92,68 126,64 160,60 194,58 228,62 262,56 296,54 330,60 364,58 398,56 432,58 466,57 500,56 534,55";
  const pf = "24,104 58,100 92,98 126,90 160,86 194,82 228,88 262,84 296,78 330,86 364,90 398,84 432,88 466,86 500,84 534,82";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-4"><span className="text-[#05ff5e]">━ Real Power (MW)</span><span className="text-cyan-300">━ Reactive Power (MVAR)</span><span className="text-purple-400">━ Apparent Power (MVA)</span><span className="text-orange-400">━ Power Factor</span></div><svg className="h-[180px] w-full" viewBox="0 0 620 188"><g stroke="rgba(148,163,184,.16)">{[28,62,96,130,164].map((y) => <line key={y} x1="30" x2="606" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="32">8</text><text x="0" y="66">6</text><text x="0" y="100">4</text><text x="0" y="134">2</text><text x="0" y="168">0</text></g>{[[real,"#05ff5e"],[reactive,"#29b6f6"],[apparent,"#a855f7"],[pf,"#ff8a00"]].map(([points,color]) => <g key={String(color)}><polyline fill="none" points={String(points)} stroke={String(color)} strokeWidth="2" />{parseNetworkPoints(String(points)).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={`${color}-${x}`} r="3" stroke={String(color)} strokeWidth="2" />)}</g>)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div><div className="mt-2 flex gap-2 text-[8px]"><span className="rounded border border-cyan-300/12 px-3 py-1">15 Min</span><span className="rounded border border-cyan-300/12 px-3 py-1">1 HOUR</span><span className="rounded border border-cyan-300/12 px-3 py-1">1 DAY</span><span className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">7 DAYS</span><span className="rounded border border-cyan-300/12 px-3 py-1">30 DAYS</span></div></div>;
}

function PowerFeederTableReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved feeder-level power source." />;
  const rows = [["Feeder 4","1.42 MW","0.91 MVAR","1.68 MVA","0.84","Fair","26%"],["Feeder 1","1.24 MW","0.48 MVAR","1.32 MVA","0.94","Good","21%"],["Feeder 3","1.08 MW","0.66 MVAR","1.27 MVA","0.85","Fair","20%"],["Feeder 2","0.99 MW","0.51 MVAR","1.11 MVA","0.89","Fair","17%"],["Feeder 5","1.10 MW","0.42 MVAR","1.18 MVA","0.93","Good","16%"],["Total","5.82 MW","2.98 MVAR","6.41 MVA","0.91","Good","100%"]];
  return <table className="w-full text-left text-[7.5px]"><thead className="text-slate-400"><tr>{["Feeder","kW (P)","kVAR (Q)","kVA (S)","PF","PF Status","% of S"].map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([f,p,q,s,pf,status,total]) => <tr className="border-t border-white/6" key={f}><td className="py-[4px]">{f}</td><td>{p}</td><td>{q}</td><td>{s}</td><td>{pf}</td><td className={status === "Fair" ? "text-yellow-300" : "text-[#05ff5e]"}>{status}</td><td>{total}</td></tr>)}</tbody></table>;
}

function PowerTimeOfDayReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved power time-of-day source." />;
  const rows = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return <div className="h-full text-[8px]"><div className="mb-1 ml-9 grid grid-cols-4 text-center text-slate-400"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div><div className="grid grid-cols-[28px_1fr] gap-2"><div className="grid grid-rows-7 gap-1 text-slate-300">{rows.map((r) => <span key={r}>{r}</span>)}</div><div className="grid grid-cols-12 gap-1">{Array.from({ length: 84 }).map((_, index) => { const col = index % 12; const color = col < 4 ? "#16a34a" : col < 7 ? "#facc15" : col < 9 ? "#ff8a00" : "#ef4444"; return <span className="h-[13px] rounded-sm border border-[#061521]" key={index} style={{ backgroundColor: color, opacity: 0.72 + (index % 3) * 0.09 }} />; })}</div></div><div className="mt-2 flex justify-between text-[7px] text-slate-400"><span>Low</span><span className="h-2 flex-1 mx-3 rounded-full bg-gradient-to-r from-[#05ff5e] via-[#facc15] to-[#ef4444]" /><span>High</span></div></div>;
}

function DemandVsCapacityReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved apparent power trend source." />;
  const apparent = "20,118 52,112 84,116 116,96 148,102 180,86 212,80 244,98 276,90 308,86 340,82 372,76";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-purple-400">━ Apparent Power (MVA)</span><span className="text-cyan-300">-- Capacity (MVA)</span></div><svg className="h-[112px] w-full" viewBox="0 0 400 120"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104].map((y) => <line key={y} x1="20" x2="390" y1={y} y2={y} />)}</g><line stroke="#29b6f6" strokeDasharray="4 4" x1="20" x2="390" y1="42" y2="42" /><polyline fill="none" points={apparent} stroke="#a855f7" strokeWidth="2" />{parseNetworkPoints(apparent).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={x} r="3" stroke="#a855f7" strokeWidth="2" />)}<text fill="#29b6f6" fontSize="8" x="350" y="40">8.50 MVA</text><text fill="#a855f7" fontSize="8" x="350" y="74">6.41 MVA</text></svg><div className="flex justify-between text-[7px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div></div>;
}

function PowerReactiveAnalysisReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <MetricListSmall rows={noDataRows("No approved reactive-power source")} />;
  return <div className="flex h-full flex-col text-[8px]">{[["Leading (Capacitive)", "-0.45 MVAR", "17%"], ["Neutral", "0.00 - 0.20 MVAR", "8%"], ["Lagging (Inductive)", "2.68 MVAR", "75%"]].map(([label,value,pct]) => <div className="flex justify-between border-b border-white/6 py-2" key={label}><span>{label}</span><b className="text-[#05ff5e]">{value}<br /><span>{pct}</span></b></div>)}<div className="mt-auto text-right text-[#05ff5e]">View Reactive Power Details →</div></div>;
}

function PowerComponentBreakdownReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved power component model." />;
  return <div className="grid h-full grid-cols-[92px_1fr] items-center gap-3"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#05ff5e 0 72%, #147dff 72% 98%, #ff8a00 98% 100%)" }}><div className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-lg">6.41<br /><span className="text-[8px]">MVA</span><br /><span className="text-[7px]">Total</span></div></div><div className="space-y-3 text-[8px]">{[["Real Power (P)","5.82 MW","71.6%","#05ff5e"],["Reactive Power (Q)","2.68 MVAR","33.0%","#147dff"],["Losses","0.12 MW","1.4%","#ff8a00"]].map(([l,v,p,c]) => <div className="grid grid-cols-[1fr_54px_28px] gap-2" key={l}><span><span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: c }} />{l}</span><b>{v}</b><span>{p}</span></div>)}</div></div>;
}

function PowerFactorDistributionReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved power-factor distribution source." />;
  return <div className="h-full text-[8px]"><div className="grid h-8 grid-cols-[8%_32%_38%_22%] overflow-hidden rounded"><span className="bg-red-500 text-center leading-8">8%</span><span className="bg-orange-500 text-center leading-8">32%</span><span className="bg-yellow-400 text-center leading-8 text-slate-900">38%</span><span className="bg-[#05ff5e] text-center leading-8 text-slate-900">22%</span></div><div className="mt-2 grid grid-cols-4 text-center text-[7px]"><span>Poor<br />&lt; 0.80</span><span>Fair<br />0.80 - 0.90</span><span>Good<br />0.90 - 0.95</span><span>Excellent<br />&gt; 0.95</span></div></div>;
}

function PowerLowPfEventsReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved low power-factor event source." />;
  return <div className="flex h-full flex-col"><table className="w-full text-left text-[7.2px]"><thead className="text-slate-400"><tr>{["Time","Min PF","Duration","Location","Impact"].map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{lowPfRows.map(([time,minPf,duration,feeder,impact]) => <tr className="border-t border-white/6" key={time}><td className="py-[3px]">{time}</td><td>{minPf}</td><td>{duration}</td><td>{feeder}</td><td className={impact === "High" ? "text-red-400" : impact === "Medium" ? "text-yellow-300" : "text-[#05ff5e]"}>{impact}</td></tr>)}</tbody></table><div className="mt-auto text-right text-[9px] text-[#05ff5e]">View All Low PF Events →</div></div>;
}

function PowerInsightsReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <MetricListSmall rows={noDataRows("No approved power-quality insight model")} />;
  const rows = [["◎","Power factor improved 0.03 compared to the previous 7 days.","text-purple-400"],["◎","Peak apparent power occurred on May 16 at 2:18 PM (6.78 MVA).","text-[#05ff5e]"],["◎","Reactive power is within acceptable range.","text-orange-400"],["◎","Maintaining PF above 0.90 could save an estimated 62 kW in losses.","text-cyan-300"]];
  return <div className="flex h-full flex-col gap-2 text-[7.8px]">{rows.map(([icon,text,color]) => <div className="grid grid-cols-[22px_1fr] gap-2 border-b border-white/6 pb-1" key={text}><span className={color}>{icon}</span><span>{text}</span></div>)}<div className="mt-auto text-right text-[#05ff5e]">View All Insights →</div></div>;
}

function LowPfEventsScreen() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-6 gap-2">
        <NetworkKpi label="Total Low PF Events" value="27" detail="In Last 7 Days" tone="purple" />
        <NetworkKpi label="Avg Min PF" value="0.78" detail="Below 0.90 Threshold" tone="yellow" />
        <NetworkKpi label="Lowest PF Recorded" value="0.62" detail="May 14, 9:37 AM" tone="red" />
        <NetworkKpi label="Total Duration" value="8h 47m" detail="Across All Events" tone="blue" />
        <NetworkKpi label="Affected Feeders" value="5" detail="Of 5 Feeders" tone="green" />
        <NetworkKpi label="Affected Load" value="18" detail="Panels / Loads" tone="yellow" />
      </section>
      <PeakEventsFilterBar />
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.55fr_0.58fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <div className="grid h-[148px] grid-cols-[0.9fr_0.82fr_0.72fr] gap-2"><DashboardPanel title="Min Power Factor Trend (7 Days)" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#ef4444"]} /></DashboardPanel><DashboardPanel title="Low PF Events By Hour (7 Days)" variant="enterprise"><Bars rows={[["PF 0.80–0.90", "54%", "yellow"], ["PF 0.70–0.80", "72%", "yellow"], ["PF < 0.70", "44%", "red"]]} /></DashboardPanel><DashboardPanel title="Event Severity Breakdown" variant="enterprise"><NetworkDonut total="27" rows={[["Critical", "5"], ["High", "10"], ["Medium", "12"]]} /></DashboardPanel></div>
          <DashboardPanel title="Low Power Factor Events (27)" variant="enterprise"><CompactNetworkTable headers={["#", "Start Time", "End Time", "Duration", "Min PF", "Avg PF", "Feeder", "Cause", "Severity", "Impact", "Status", "Actions"]} rows={lowPfEventRows} /><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Showing 1 to 10 of 27 events</span><span>Rows per page: 10</span></div></DashboardPanel>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="Event Details" variant="enterprise"><div className="text-2xl text-slate-100">0.62</div><MetricListSmall rows={[["Min PF", "Feeder 1"], ["Duration", "18 min"], ["Avg PF", "0.71"], ["Start Time", "May 14, 9:37 AM"], ["Low PF Threshold", "0.90"], ["Cause", "Motor Starting"]]} /><button className="mt-2 w-full rounded border border-[#05ff5e] py-2 text-[9px] text-[#05ff5e]">View Event Analysis →</button></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function LowPfEventsReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Power Detail &nbsp; › &nbsp; <span className="text-[#05ff5e]">Low Power Factor Events</span></div><h1 className="mt-1 text-2xl font-light">Low Power Factor Events</h1><p className="mt-1 text-[10px] text-slate-300">Detailed list of low power factor events detected across the network.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Power Detail</button></div>
        </div>
        <section className="grid h-[88px] grid-cols-6 gap-3">
          <LossKpi icon="×" label="Total Low PF Events" value="No Data" detail="No approved low-PF event source" tone="purple" />
          <LossKpi icon="⌁" label="Avg Min PF" value="No Data" detail="No approved PF source" tone="orange" />
          <LossKpi icon="⌁" label="Lowest PF Recorded" value="No Data" detail="No approved PF event source" tone="red" />
          <LossKpi icon="◷" label="Total Duration" value="No Data" detail="No approved event duration source" tone="blue" />
          <LossKpi icon="▦" label="Affected Feeders" value="No Data" detail="No approved event source" tone="green" />
          <LossKpi icon="▤" label="Affected Load" value="No Data" detail="No approved event load source" tone="yellow" />
        </section>
        <section className="mt-2 grid h-[32px] grid-cols-[1fr_124px_110px_128px_128px_178px_auto] items-center gap-3 text-[9px]">
          <div className="h-full rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-slate-500">⌕ &nbsp; Search events, feeders, locations...</div>
          {["All Feeders⌄", "PF < 0.90⌄", "All Severities⌄", "All Causes⌄", `▣ ${data.dateRange || "No Data"}⌄`].map((label) => <button className="h-full rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-300" key={label}>{label}</button>)}
          <button className="text-left text-slate-400">× Clear Filters</button>
        </section>
        <section className="mt-2 grid h-[572px] min-h-0 grid-cols-[1.55fr_0.48fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[202px_1fr] gap-3 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[0.9fr_1.12fr_0.72fr] gap-3 overflow-hidden">
              <PeakBox title="MIN POWER FACTOR TREND (7 DAYS)"><LowPfTrendReference /></PeakBox>
              <PeakBox title="LOW PF EVENTS BY HOUR (7 DAYS)"><LowPfByHourReference /></PeakBox>
              <PeakBox title="EVENT SEVERITY BREAKDOWN"><LowPfSeverityBreakdownReference /></PeakBox>
            </div>
            <PeakBox title="LOW POWER FACTOR EVENTS (27)"><LowPfEventsTableReference /></PeakBox>
          </div>
          <aside className="min-h-0 overflow-hidden">
            <PeakBox title="EVENT DETAILS"><LowPfEventDetailsReference /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function LowPfTrendReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved low-PF trend source." />;
  const pf = "24,78 58,76 92,80 126,74 160,112 194,102 228,96 262,124 296,142 330,104 364,88 398,102 432,116 466,114 500,110 534,110";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-between"><span>PF</span><span className="text-red-400">Threshold (0.90)</span></div><svg className="h-[138px] w-full" viewBox="0 0 550 148"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104,132].map((y) => <line key={y} x1="24" x2="540" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">1.00</text><text x="0" y="52">0.90</text><text x="0" y="80">0.80</text><text x="0" y="108">0.70</text><text x="0" y="136">0.60</text></g><line stroke="#ef4444" strokeDasharray="4 4" x1="24" x2="540" y1="48" y2="48" /><polyline fill="none" points={pf} stroke="#05ff5e" strokeWidth="2.4" />{parseNetworkPoints(pf).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={x} r="3" stroke="#05ff5e" strokeWidth="2" />)}</svg><div className="flex justify-between px-6 text-[7px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 17</span><span>May 18</span></div></div>;
}

function LowPfByHourReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved low-PF hourly event source." />;
  const bars = [2,3,2,4,5,4,3,4,6,5,7,4,8,9,7,5,9,5,4,7,4,3];
  return <div className="h-full text-[8px]"><svg className="h-[138px] w-full" viewBox="0 0 460 148"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104,132].map((y) => <line key={y} x1="28" x2="452" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="6" y="24">10</text><text x="12" y="52">8</text><text x="12" y="80">6</text><text x="12" y="108">4</text><text x="12" y="136">0</text></g>{bars.map((value, index) => { const color = index < 8 ? "#facc15" : index < 14 ? "#ff8a00" : "#ef4444"; const height = value * 12; const x = 38 + index * 18; return <rect fill={color} height={height} key={index} rx="1" width="11" x={x} y={132 - height} />; })}</svg><div className="flex justify-between px-8 text-[7px] text-slate-500"><span>12 AM</span><span>3 AM</span><span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span></div><div className="mt-1 flex justify-center gap-5 text-[8px]"><span className="text-yellow-300">■ PF 0.80 - 0.90</span><span className="text-orange-400">■ PF 0.70 - 0.80</span><span className="text-red-400">■ PF &lt; 0.70</span></div></div>;
}

function LowPfSeverityBreakdownReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved low-PF severity source." />;
  const rows = [["Critical (PF < 0.70)", "5 (19%)", "#ef4444"], ["High (PF 0.70 - 0.80)", "10 (37%)", "#ff8a00"], ["Medium (PF 0.80 - 0.90)", "12 (44%)", "#facc15"]];
  return <div className="grid h-full grid-cols-[94px_1fr] items-center gap-3"><div className="grid size-20 place-items-center rounded-full" style={{ background: "conic-gradient(#ef4444 0 19%, #ff8a00 19% 56%, #facc15 56% 100%)" }}><div className="grid size-12 place-items-center rounded-full bg-[#061521] text-center text-xl">27<br /><span className="text-[7px]">Total</span></div></div><div className="space-y-3 text-[8px]">{rows.map(([label,value,color]) => <div className="flex justify-between gap-2" key={label}><span><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><b>{value}</b></div>)}</div></div>;
}

function LowPfEventsTableReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved low-PF event table source." />;
  const headers = ["#", "Start Time", "End Time", "Duration", "Min PF", "Avg PF", "Feeder", "Location / Asset", "Cause", "Severity", "Impact", "Status", "Actions"];
  return <div className="flex h-full flex-col overflow-hidden"><table className="w-full table-fixed text-left text-[7.2px]"><colgroup><col className="w-[3%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[7%]" /><col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[8%]" /><col className="w-[11%]" /><col className="w-[11%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[7%]" /></colgroup><thead className="text-slate-400"><tr>{headers.map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{lowPfEventRows.map((row) => <LowPfEventRowReference key={`${row[0]}-${row[1]}`} row={row} />)}</tbody></table><div className="mt-auto grid grid-cols-3 items-center pt-3 text-[8px] text-slate-400"><span>Showing 1 to 10 of 27 events</span><div className="flex justify-center gap-2"><button className="rounded border border-cyan-300/12 px-2 py-1">‹</button><button className="rounded bg-[#087a35] px-3 py-1 text-[#05ff5e]">1</button><button className="rounded border border-cyan-300/12 px-3 py-1">2</button><button className="rounded border border-cyan-300/12 px-3 py-1">3</button><button className="rounded border border-cyan-300/12 px-2 py-1">›</button></div><span className="justify-self-end">Rows per page: <b className="ml-2 rounded border border-cyan-300/12 px-3 py-1 text-slate-300">10⌄</b></span></div></div>;
}

function LowPfEventRowReference({ row }: { row: string[] }) {
  const [rank, start, end, duration, minPf, avgPf, feeder, cause, severity, impact, status] = row;
  const severityClass = severity === "Critical" ? "text-red-400" : severity === "High" ? "text-orange-400" : "text-yellow-300";
  const impactClass = impact === "High" ? "text-red-400" : impact === "Medium" ? "text-orange-400" : "text-[#05ff5e]";
  return <tr className="border-t border-white/6"><td className="py-[3.4px]">{rank}</td><td>{start}</td><td>{end}</td><td>{duration}</td><td>{minPf}</td><td>{avgPf}</td><td>{feeder}</td><td>{lowPfLocations[Number(rank) - 1] ?? "Panel"}</td><td>{cause}</td><td className={severityClass}>{severity}</td><td className={impactClass}>{impact}</td><td className="text-[#05ff5e]">{status}</td><td><button className="rounded border border-cyan-300/12 px-2 py-0.5 text-[7px]">View Details</button></td></tr>;
}

function LowPfEventDetailsReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <MetricListSmall rows={noDataRows("No approved low-PF event detail source")} />;
  const rows = [["Duration", "18 min"], ["Avg PF", "0.71"], ["Start Time", "May 14, 2025 9:37 AM"], ["End Time", "May 14, 2025 9:55 AM"], ["Lowest PF", "0.62"], ["PF Threshold", "0.90"], ["PF Deviation", "-0.28"], ["Energy Impact", "22.1 kWh"], ["Estimated Cost Impact", "$3.42"], ["Cause", "Motor Starting"], ["Notes", "Two 50 HP motors started simultaneously."]];
  return <div className="flex h-full flex-col text-[8px]"><div className="mb-3 flex items-center justify-between"><span>May 14, 2025 9:37 AM</span><span className="rounded border border-red-500 px-2 py-0.5 text-red-400">Critical</span></div><div className="mb-3 grid grid-cols-2 gap-4 border-l border-cyan-400 pl-3"><div><div className="text-3xl font-light">0.62</div><div className="text-slate-400">Min PF</div></div><div><div className="text-lg">Feeder 1</div><div className="text-slate-400">Building 3 Panel</div></div></div><div className="space-y-[5px]">{rows.map(([label,value]) => <div className="flex justify-between gap-3 border-b border-white/6 pb-1" key={label}><span className="text-slate-400">{label}</span><b className="text-right">{value}</b></div>)}</div><button className="mt-auto rounded border border-[#05ff5e] py-2 text-[9px] text-[#05ff5e]">View Event Analysis →</button></div>;
}

const lowPfLocations = ["HVAC System 2", "Building 3 Panel", "Compressor 1", "Lighting Panel 1", "Chiller Plant", "AHU-4", "Pump Panel", "Welding Area", "Conveyor System", "Receptacle Panel"];

function ReactivePowerDetailScreen() {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-6 gap-2">
        <NetworkKpi label="Total Reactive Power" value="2.68 MVAR" detail="↓ 2.7% vs Last 7 Days" tone="purple" />
        <NetworkKpi label="Inductive Reactive" value="2.14 MVAR" detail="80% of Total" tone="yellow" />
        <NetworkKpi label="Capacitive Reactive" value="0.54 MVAR" detail="20% of Total" tone="blue" />
        <NetworkKpi label="Average Power Factor" value="0.91" detail="+0.03 vs Last 7 Days" tone="green" />
        <NetworkKpi label="PF Improvement Potential" value="+0.06" detail="Estimated" tone="yellow" />
        <NetworkKpi label="Est. kW Savings" value="62 kW" detail="~$128 / day" tone="green" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.85fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[174px]" title="Reactive Power Trend (7 Days)" variant="enterprise"><NetworkTrend colors={["#a855f7", "#ff8a00", "#29b6f6", "#05ff5e"]} /></DashboardPanel>
          <div className="grid h-[136px] grid-cols-[1fr_0.74fr] gap-2"><DashboardPanel title="Reactive Power By Feeder (Average)" variant="enterprise"><NetworkTable headers={["Feeder", "Inductive", "Capacitive", "Net", "PF", "Status"]} rows={reactiveRows} /></DashboardPanel><DashboardPanel title="Reactive Power By Time Of Day (Average)" variant="enterprise"><HeatMap /></DashboardPanel></div>
          <div className="grid h-[126px] grid-cols-[0.72fr_1fr] gap-2"><DashboardPanel title="Reactive Power Compensation" variant="enterprise"><MetricListSmall rows={[["Installed Capacitor Banks", "5"], ["Total Capacity", "1.20 MVAR"], ["Status", "Good"], ["View Capacitor Bank Details", "→"]]} /></DashboardPanel><DashboardPanel title="Reactive Power Opportunities" variant="enterprise"><MetricListSmall rows={[["Install capacitors on Feeder 4", "Estimated PF +0.03"], ["Optimize capacitor switching", "18 kW savings"], ["Reduce lagging VARs", "By balancing loads"]]} /></DashboardPanel></div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <div className="grid h-[118px] grid-cols-[0.8fr_1fr] gap-2"><DashboardPanel title="Power Triangle (Average)" variant="enterprise"><PowerTriangle /></DashboardPanel><DashboardPanel title="Reactive Power Breakdown" variant="enterprise"><NetworkDonut compact total="2.68 MVAR" rows={[["Inductive (Lagging)", "2.14 MVAR"], ["Capacitive (Leading)", "0.54 MVAR"]]} /></DashboardPanel></div>
          <DashboardPanel className="h-[72px]" title="Reactive Power Balance" variant="enterprise"><CompactBars rows={[["Leading", "15%", "green"], ["Net Lagging", "84%", "yellow"], ["Lagging", "89%", "red"]]} /></DashboardPanel>
          <DashboardPanel className="h-[58px]" title="Reactive Power Capacity" variant="enterprise"><CompactBars rows={[["Used", "89%", "red"], ["Available", "11%", "green"]]} /></DashboardPanel>
          <DashboardPanel className="h-[96px]" title="Low Power Factor Events (7 Days)" variant="enterprise"><NetworkTable headers={["Time", "Min PF", "Duration", "Cause", "Impact"]} rows={lowPfRows.slice(0, 4)} /></DashboardPanel>
          <DashboardPanel className="h-[58px]" title="Insights" variant="enterprise"><MetricListSmall compact rows={[["Net reactive power", "Lagging by 2.68 MVAR"], ["Power factor", "Improved by 0.03"], ["Optimization", "Could save 62 kW"], ["Feeder 4", "Highest contribution"]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function ReactivePowerDetailReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[146px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">⌂ &nbsp; {siteLabel(data)}⌄</button><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[78px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">⊞ Electrical Network &nbsp; › &nbsp; Power Detail &nbsp; › &nbsp; <span className="text-[#05ff5e]">Reactive Power Detail</span></div><h1 className="mt-1 text-2xl font-light">Reactive Power Detail</h1><p className="mt-1 text-[10px] text-slate-300">In-depth analysis of reactive power, power factor, and VAR performance across the network.</p></div>
          <div className="flex flex-col items-end gap-2 text-[9px]"><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Report</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Configure Alerts</button></div><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Power Detail</button></div>
        </div>
        <section className="grid h-[88px] grid-cols-6 gap-3">
          <LossKpi icon="⌁" label="Total Reactive Power ⓘ" value="No Data" detail="No approved reactive-power source" tone="purple" />
          <LossKpi icon="⌘" label="Inductive Reactive (Lagging) ⓘ" value="No Data" detail="No approved reactive source" tone="orange" />
          <LossKpi icon="⌁" label="Capacitive Reactive (Leading)" value="No Data" detail="No approved reactive source" tone="blue" />
          <LossKpi icon="PF" label="Average Power Factor ⓘ" value="No Data" detail="No approved power-factor source" tone="green" />
          <LossKpi icon="⌘" label="PF Improvement Potential" value="No Data" detail="No approved PF model" tone="yellow" />
          <LossKpi icon="$" label="Est. kW Savings (if PF optimized)" value="No Data" detail="No approved savings model" tone="green" />
        </section>
        <section className="mt-2 grid h-[604px] min-h-0 grid-cols-[1.34fr_0.9fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[244px_170px_1fr] gap-3 overflow-hidden">
            <PeakBox title="REACTIVE POWER TREND (7 DAYS) ⓘ"><ReactivePowerTrendReference /></PeakBox>
            <div className="grid min-h-0 grid-cols-[1fr_0.74fr] gap-3 overflow-hidden">
              <PeakBox title="REACTIVE POWER BY FEEDER (AVERAGE) ⓘ"><ReactiveFeederTableReference /></PeakBox>
              <PeakBox title="REACTIVE POWER BY TIME OF DAY (AVERAGE)"><ReactiveTimeOfDayReference /></PeakBox>
            </div>
            <div className="grid min-h-0 grid-cols-[0.72fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="REACTIVE POWER COMPENSATION"><ReactiveCompensationReference /></PeakBox>
              <PeakBox title="REACTIVE POWER OPPORTUNITIES"><ReactiveOpportunitiesReference /></PeakBox>
            </div>
          </div>
          <aside className="grid min-h-0 grid-rows-[136px_92px_70px_124px_1fr] gap-3 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[0.9fr_1fr] gap-3 overflow-hidden">
              <PeakBox title="POWER TRIANGLE (AVERAGE) ⓘ"><ReactiveTriangleReference /></PeakBox>
              <PeakBox title="REACTIVE POWER BREAKDOWN"><ReactiveBreakdownReference /></PeakBox>
            </div>
            <PeakBox title="REACTIVE POWER BALANCE ⓘ"><ReactiveBalanceReference /></PeakBox>
            <PeakBox title="REACTIVE POWER CAPACITY"><ReactiveCapacityReference /></PeakBox>
            <PeakBox title="LOW POWER FACTOR EVENTS (7 DAYS) ⓘ"><ReactiveLowPfEventsReference /></PeakBox>
            <PeakBox title="INSIGHTS"><ReactiveInsightsReference /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function ReactivePowerTrendReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved reactive-power trend source." />;
  const reactive = "24,118 58,110 92,106 126,120 160,96 194,76 228,112 262,92 296,52 330,72 364,106 398,84 432,118 466,96 500,86 534,74";
  const inductive = "24,130 58,124 92,128 126,118 160,112 194,98 228,126 262,108 296,84 330,102 364,124 398,108 432,130 466,116 500,110 534,104";
  const capacitive = "24,154 58,150 92,152 126,148 160,144 194,136 228,150 262,144 296,128 330,140 364,152 398,142 432,150 466,146 500,142 534,138";
  const pf = "24,82 58,86 92,84 126,76 160,70 194,72 228,86 262,80 296,64 330,74 364,86 398,68 432,62 466,76 500,72 534,66";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-4"><span className="text-purple-400">━ Total Reactive (MVAR)</span><span className="text-orange-400">━ Inductive (Lagging)</span><span className="text-cyan-300">━ Capacitive (Leading)</span><span className="text-[#05ff5e]">━ PF (Avg)</span></div><svg className="h-[180px] w-full" viewBox="0 0 620 188"><g stroke="rgba(148,163,184,.16)">{[28,62,96,130,164].map((y) => <line key={y} x1="30" x2="606" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="32">4.0</text><text x="0" y="66">2.0</text><text x="0" y="100">0</text><text x="0" y="134">-2.0</text><text x="0" y="168">-4.0</text></g>{[[reactive,"#a855f7"],[inductive,"#ff8a00"],[capacitive,"#29b6f6"],[pf,"#05ff5e"]].map(([points,color]) => <g key={String(color)}><polyline fill="none" points={String(points)} stroke={String(color)} strokeWidth="2" />{parseNetworkPoints(String(points)).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={`${color}-${x}`} r="3" stroke={String(color)} strokeWidth="2" />)}</g>)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div><div className="mt-2 flex gap-2 text-[8px]"><span className="rounded border border-cyan-300/12 px-3 py-1">15 Min</span><span className="rounded border border-cyan-300/12 px-3 py-1">1 HOUR</span><span className="rounded border border-cyan-300/12 px-3 py-1">1 DAY</span><span className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">7 DAYS</span><span className="rounded border border-cyan-300/12 px-3 py-1">30 DAYS</span></div></div>;
}

function ReactiveFeederTableReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved feeder reactive-power source." />;
  const rows = [["Feeder 4","0.92","0.18","0.74","0.88","Fair","27.6%"],["Feeder 1","0.68","0.12","0.56","0.92","Good","20.9%"],["Feeder 3","0.42","0.10","0.32","0.93","Good","11.9%"],["Feeder 2","0.38","0.06","0.32","0.90","Fair","11.9%"],["Feeder 5","0.36","0.08","0.28","0.94","Good","10.4%"],["Total","2.76","0.54","2.68","0.91","—","100%"]];
  return <table className="w-full text-left text-[7.5px]"><thead className="text-slate-400"><tr>{["Feeder","Inductive (MVAR)","Capacitive (MVAR)","Net Reactive (MVAR)","PF (Avg)","PF Status","% of Total"].map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([f,i,c,n,pf,status,total]) => <tr className="border-t border-white/6" key={f}><td className="py-[4px]">{f}</td><td>{i}</td><td>{c}</td><td>{n}</td><td>{pf}</td><td className={status === "Fair" ? "text-yellow-300" : status === "Good" ? "text-[#05ff5e]" : "text-slate-400"}>{status}</td><td>{total}</td></tr>)}</tbody></table>;
}

function ReactiveTimeOfDayReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved reactive-power time-of-day source." />;
  const rows = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const cols = ["12 AM","6 AM","12 PM","6 PM"];
  return <div className="h-full text-[8px]"><div className="mb-1 ml-9 grid grid-cols-4 text-center text-slate-400">{cols.map((c) => <span key={c}>{c}</span>)}</div><div className="grid grid-cols-[28px_1fr] gap-2"><div className="grid grid-rows-7 gap-1 text-slate-300">{rows.map((r) => <span key={r}>{r}</span>)}</div><div className="grid grid-cols-12 gap-1">{Array.from({ length: 84 }).map((_, index) => { const col = index % 12; const color = col < 3 ? "#147dff" : col < 6 ? "#38bdf8" : col < 9 ? "#facc15" : "#ff8a00"; return <span className="h-[13px] rounded-sm border border-[#061521]" key={index} style={{ backgroundColor: color, opacity: 0.72 + (index % 3) * 0.09 }} />; })}</div></div><div className="mt-2 grid grid-cols-3 text-center text-[7px] text-slate-400"><span>Leading (Capacitive)</span><span>Neutral (0 MVAR)</span><span>Lagging (Inductive)</span></div></div>;
}

function ReactiveCompensationReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved compensation source." />;
  return <div className="grid h-full grid-cols-[92px_1fr] gap-4 text-[8px]"><div><div className="text-4xl text-slate-300">▥</div><MetricListSmall compact rows={[["Installed Capacitor Banks", "5"], ["Total Capacity", "1.20 MVAR"], ["Status", "Good"]]} /></div><div className="space-y-3 border-l border-cyan-300/12 pl-4"><div className="font-semibold text-slate-300">Compensation Summary</div>{[["Reactive power compensated", "0.54 MVAR"], ["Compensation efficiency", "85%"], ["PF improvement achieved", "0.04"]].map(([label,value]) => <div className="flex justify-between gap-2" key={label}><span className="text-[#05ff5e]">✓ {label}</span><b>{value}</b></div>)}<div className="mt-auto text-right text-[#05ff5e]">View Capacitor Bank Details →</div></div></div>;
}

function ReactiveOpportunitiesReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <MetricListSmall rows={noDataRows("No approved reactive-power recommendation model")} />;
  const rows = [["▣","Install additional 0.40 MVAR capacitors on Feeder 4","Estimated PF improvement: +0.03"],["◎","Optimize capacitor switching to reduce overcompensation","Estimated kW savings: 18 kW"],["◌","Reduce lagging VARs by balancing motor loads","Estimated PF improvement: +0.02"]];
  return <div className="flex h-full flex-col gap-3 text-[8px]">{rows.map(([icon,title,detail]) => <div className="grid grid-cols-[24px_1fr] gap-2" key={title}><span className="text-cyan-300">{icon}</span><span><b>{title}</b><br /><span className="text-slate-400">{detail}</span></span></div>)}<div className="mt-auto text-right text-[#05ff5e]">View All Recommendations →</div></div>;
}

function ReactiveTriangleReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved apparent/reactive power source." />;
  return <div className="h-full text-[8px]"><svg className="h-[112px] w-full" viewBox="0 0 170 118"><path d="M34 18 L34 92 L126 92 Z" fill="rgba(6,20,33,.7)" stroke="#a855f7" strokeWidth="2" /><path d="M34 92 H126" stroke="#05ff5e" strokeWidth="2" /><path d="M126 92 V44" stroke="#29b6f6" strokeWidth="2" /><text fill="#a855f7" fontSize="10" x="78" y="18">S</text><text fill="#a855f7" fontSize="8" x="70" y="30">6.41 MVA</text><text fill="#e2e8f0" fontSize="8" x="54" y="72">PF</text><text fill="#05ff5e" fontSize="9" x="54" y="84">0.91</text><text fill="#05ff5e" fontSize="9" x="83" y="106">P</text><text fill="#05ff5e" fontSize="8" x="70" y="116">5.82 MW</text><text fill="#29b6f6" fontSize="9" x="134" y="70">Q</text><text fill="#29b6f6" fontSize="8" x="130" y="82">2.68 MVAR</text></svg><div className="text-center text-[10px]">ϕ 24.7°<br /><span className="text-slate-400">Phase Angle</span></div></div>;
}

function ReactiveBreakdownReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved reactive-power breakdown source." />;
  return <div className="grid h-full grid-cols-[84px_1fr] items-center gap-3"><div className="grid size-20 place-items-center rounded-full" style={{ background: "conic-gradient(#ff8a00 0 80%, #147dff 80% 100%)" }}><div className="grid size-12 place-items-center rounded-full bg-[#061521] text-center text-sm">2.68<br /><span className="text-[7px]">MVAR</span><br /><span className="text-[7px]">Total</span></div></div><div className="space-y-3 text-[8px]">{[["Inductive (Lagging)","2.14 MVAR","80%","#ff8a00"],["Capacitive (Leading)","0.54 MVAR","20%","#147dff"]].map(([l,v,p,c]) => <div className="grid grid-cols-[1fr_54px_26px] gap-2" key={l}><span><span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: c }} />{l}</span><b>{v}</b><span>{p}</span></div>)}</div></div>;
}

function ReactiveBalanceReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved reactive balance source." />;
  return <div className="h-full text-[8px]"><div className="mb-2 flex justify-between text-slate-400"><span>-3.0 MVAR</span><span>0</span><span>+3.0 MVAR</span></div><div className="relative h-4 rounded bg-gradient-to-r from-[#05ff5e] via-[#ff8a00] to-[#ef4444]"><span className="absolute left-[84%] top-[-5px] text-white">▼</span></div><div className="mt-3 flex justify-between"><span>Leading (Capacitive)</span><b className="text-orange-400">Net Lagging<br />2.68 MVAR (84% of Capacity)</b><span>Lagging (Inductive)</span></div></div>;
}

function ReactiveCapacityReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved reactive capacity source." />;
  return <div className="h-full text-[8px]"><div className="mb-2 flex justify-between px-8 text-slate-400"><span>1.5 MVAR</span><span>3.0 MVAR</span></div><div className="relative h-4 rounded bg-gradient-to-r from-[#05ff5e] via-[#ff8a00] to-[#ef4444]"><span className="absolute left-[89%] top-[-5px] text-white">▼</span></div><div className="mt-3 flex justify-around"><b className="text-orange-400">Used 2.68 MVAR (89%)</b><b className="text-[#05ff5e]">Available 0.32 MVAR (11%)</b></div></div>;
}

function ReactiveLowPfEventsReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <NoDataPanel message="No approved low-PF event source." />;
  return <div className="flex h-full flex-col"><table className="w-full text-left text-[6.8px]"><thead className="text-slate-400"><tr>{["Time","Feeder","Min PF","Duration","Cause","Impact"].map((h) => <th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{lowPfRows.map(([time,minPf,duration,feeder,impact]) => <tr className="border-t border-white/6" key={time}><td className="py-[2.4px]">{time}</td><td>{feeder}</td><td>{minPf}</td><td>{duration}</td><td>{time.includes("15") ? "High Inductive Load" : time.includes("14") ? "HVAC Systems" : time.includes("13") ? "Motor Loads" : "Compressor Start"}</td><td className={impact === "High" ? "text-red-400" : impact === "Medium" ? "text-yellow-300" : "text-[#05ff5e]"}>{impact}</td></tr>)}</tbody></table><div className="mt-auto text-right text-[8.5px] text-[#05ff5e]">View All PF Events →</div></div>;
}

function ReactiveInsightsReference() {
  if (!hasApprovedElectricalModel("powerQuality")) return <MetricListSmall rows={noDataRows("No approved reactive-power insight model")} />;
  const rows = [["◎","Net reactive power is lagging (inductive) by 2.68 MVAR.","text-purple-400"],["◎","Power factor improved by 0.03 compared to the previous 7 days.","text-[#05ff5e]"],["◎","Optimizing PF to 0.97 could save an estimated 62 kW in losses.","text-[#05ff5e]"],["◎","Feeder 4 has the highest lagging reactive contribution (27.6%).","text-orange-400"]];
  return <div className="flex h-full flex-col gap-1.5 text-[7.2px]">{rows.map(([icon,text,color]) => <div className="grid grid-cols-[18px_1fr] gap-2 border-b border-white/6 pb-0.5" key={text}><span className={color}>{icon}</span><span>{text}</span></div>)}<div className="mt-auto text-right text-[8.5px] text-[#05ff5e]">View All Insights →</div></div>;
}

function OptimizationRecommendationsScreen() {
  return (
    <>
      <section className="mt-2 grid h-[52px] grid-cols-6 gap-2">
        <NetworkKpi label="Total Connected Load" value="3.2 MW" detail="Current" tone="blue" />
        <NetworkKpi label="Total Demand (Live)" value="1,063 kW" detail="Live" tone="green" />
        <NetworkKpi label="Power Factor (Avg)" value="0.98" detail="Good" tone="yellow" />
        <NetworkKpi label="Total Harmonic Distortion" value="4.1%" detail="THD" tone="purple" />
        <NetworkKpi label="Capacity Utilization" value="85%" detail="High" tone="green" />
        <NetworkKpi label="Annual Savings Potential" value="$286,450" detail="Estimated" tone="green" />
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.55fr_0.58fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel className="h-[252px]" title="Optimization Recommendations" variant="enterprise"><NetworkTable headers={["Priority", "Recommendation", "Target", "Issue / Opportunity", "Expected Impact", "Savings / Yr", "Payback", "Confidence", "Action"]} rows={recommendationRows} /></DashboardPanel>
          <div className="grid h-[188px] grid-cols-[0.9fr_0.82fr] gap-2"><DashboardPanel title="Network Heat Map (Load & Impact)" variant="enterprise"><MiniOneLine compact /></DashboardPanel><DashboardPanel title="Top Priority Actions" variant="enterprise"><MetricListSmall rows={[["Install XECO Active Power Filter", "$112,430 / yr"], ["Balance Phase Loads", "$34,250 / yr"], ["Install Capacitor Bank", "$21,780 / yr"], ["View All Recommendations", "→"]]} /></DashboardPanel></div>
        </div>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="Optimization Impact Summary" variant="enterprise"><MetricListSmall rows={[["Total Annual Savings Potential", "$286,450"], ["Demand Reduction Potential", "187 kW"], ["Energy Reduction Potential", "524,300 kWh"], ["CO2 Reduction Potential", "284 tons / yr"]]} /></DashboardPanel>
          <DashboardPanel title="Savings Potential Over Time" variant="enterprise"><NetworkTrend colors={["#05ff5e", "#147dff"]} /></DashboardPanel>
          <DashboardPanel title="Next Steps" variant="enterprise"><MetricListSmall rows={[["Review recommendations", "Complete"], ["Approve recommended actions", "Pending"], ["Generate scope of work", "Pending"], ["Schedule installation", "Pending"], ["Monitor results", "Pending"]]} /></DashboardPanel>
        </div>
      </section>
    </>
  );
}

function OptimizationRecommendationsReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Client<br /><b>{siteLabel(data)}</b>⌄</button><button className="w-[210px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.updatedAt || data.dateRange || "No Data"}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[84px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Clients &nbsp; › &nbsp; {siteLabel(data)} &nbsp; › &nbsp; Projects &nbsp; › &nbsp; {data.projectName || "No Data"} &nbsp; › &nbsp; Electrical Network &nbsp; › &nbsp; <span className="text-[#05ff5e]">Optimization Recommendations</span></div><h1 className="mt-1 text-2xl font-light">Electrical Network Optimization Recommendations</h1><p className="mt-1 text-[10px] text-slate-300">Actionable recommendations to improve power quality, reduce demand and maximize energy savings.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Electrical Network</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Recommendations</button><button className="rounded bg-[#147dff] px-4 py-2 text-white">⟳ Recalculate Analysis</button></div>
        </div>
        <section className="grid h-[72px] grid-cols-6 gap-3">
          <CompactRecKpi icon="⌁" label="Total Connected Load" value={formatMw(data.currentLoadKva)} />
          <CompactRecKpi icon="▣" label="Total Demand (Live)" value={formatKva(data.currentLoadKva)} />
          <CompactRecKpi icon="⌘" label="Power Factor (Avg)" value="No Data" />
          <CompactRecKpi icon="⌁" label="Total Harmonic Distortion (THD)" value="No Data" />
          <CompactRecKpi icon="◔" label="Capacity Utilization" value={data.transformerKva > 0 ? `${utilizationPct(data)}%` : "No Data"} />
          <CompactRecKpi icon="$" label="Annual Savings Potential" value="No Data" />
        </section>
        <section className="mt-2 grid h-[620px] min-h-0 grid-cols-[1.52fr_0.58fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[356px_1fr] gap-3 overflow-hidden">
            <PeakBox title="OPTIMIZATION RECOMMENDATIONS"><OptimizationRecommendationsTableReference /></PeakBox>
            <div className="grid min-h-0 grid-cols-[0.92fr_0.78fr] gap-3 overflow-hidden">
              <PeakBox title="NETWORK HEAT MAP (Load & Impact)"><OptimizationNetworkHeatMapReference /></PeakBox>
              <PeakBox title="TOP PRIORITY ACTIONS"><TopPriorityActionsReference /></PeakBox>
            </div>
          </div>
          <aside className="grid min-h-0 grid-rows-[148px_218px_1fr] gap-3 overflow-hidden">
            <PeakBox title="OPTIMIZATION IMPACT SUMMARY"><OptimizationImpactSummaryCard /></PeakBox>
            <PeakBox title="SAVINGS POTENTIAL OVER TIME"><SavingsPotentialOverTimeReference /></PeakBox>
            <PeakBox title="NEXT STEPS"><NextStepsReference /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt || "No Data"} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function CompactRecKpi({ icon, label, value }: { icon: string; label: string; value: string }) {
  const tone = label.includes("Savings") ? "text-[#05ff5e]" : label.includes("THD") ? "text-purple-400" : label.includes("Demand") || label.includes("Load") ? "text-cyan-300" : label.includes("Power Factor") ? "text-orange-400" : "text-[#05ff5e]";
  return <article className="grid grid-cols-[38px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className={`grid size-8 place-items-center rounded-full border ${tone}`}>{icon}</div><div><div className="text-[8px] text-slate-400">{label}</div><div className={`mt-1 text-xl leading-none ${tone}`}>{value}</div></div></article>;
}

function OptimizationRecommendationsTableReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved optimization recommendation engine." />;
  const rows = [
    ["High", "Install XECO Active Power Filter (XAPF-200)", "Main Switchboard (Upstream) 1200A, 480Y/277V", "THD 4.1% exceeds target (≤ 3%) PF 0.98 can be improved", "PF ↑ 0.99+ THD ↓ < 3%", "$112,430", "1.6 yrs", "95%", "View Details"],
    ["High", "Balance Phase Loads", "Panel LP-3, LP-4, LP-6 3 Phase Load", "Phase imbalance 5.2% (> 3% target)", "Reduce unbalance to < 2%", "$34,250", "0.8 yrs", "85%", "View Details"],
    ["Medium", "Install Capacitor Bank", "Panel LP-5 225A", "PF 0.95 at panel Reactive power 78 kVAR", "PF → 0.99+ Reduce kVAR", "$21,780", "1.3 yrs", "80%", "View Details"],
    ["Medium", "Replace Aging Transformers", "Transformer T-2 1500 kVA", "Efficiency 97.2% (below target) High no-load losses", "Increase efficiency to 98.5%+", "$18,960", "2.6 yrs", "75%", "View Details"],
    ["Low", "Install Harmonic Filter", "Panel MCC-2 75 kW", "5th harmonic 2.8% 7th harmonic 2.1%", "Reduce harmonics by 40%+", "$8,360", "2.1 yrs", "70%", "View Details"],
  ];
  const headers = ["Priority", "Recommendation", "Target Location / Equipment", "Issue / Opportunity", "Expected Impact", "Est. Savings / Yr", "Payback", "Confidence", "Action"];
  return <div className="flex h-full flex-col overflow-hidden text-[8px]"><div className="mb-2 flex justify-end"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5 text-[8px]">All Priorities⌄</button></div><table className="w-full table-fixed text-left"><colgroup><col className="w-[6%]" /><col className="w-[17%]" /><col className="w-[16%]" /><col className="w-[17%]" /><col className="w-[13%]" /><col className="w-[10%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[7%]" /></colgroup><thead className="text-slate-400"><tr>{headers.map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <OptimizationRecommendationRow row={row} key={row[1]} index={index} />)}</tbody></table></div>;
}

function OptimizationRecommendationRow({ index, row }: { index: number; row: string[] }) {
  const [priority, recommendation, target, issue, impact, savings, payback, confidence, action] = row;
  const priorityClass = priority === "High" ? "text-red-400" : priority === "Medium" ? "text-yellow-300" : "text-[#05ff5e]";
  const conf = Number.parseInt(confidence);
  return <tr className="border-t border-white/6"><td className={`py-3 font-semibold ${priorityClass}`}>{priority}<br />↑</td><td><span className="mr-2 inline-grid size-6 place-items-center rounded border border-cyan-300/20 text-cyan-300">{index + 1}</span>{recommendation}</td><td>{target}</td><td>{issue}</td><td className="text-[#05ff5e]">↑ {impact}</td><td className="font-semibold">{savings}</td><td>{payback}</td><td><div className="grid size-9 place-items-center rounded-full border-4 border-[#05ff5e] text-[#05ff5e]">{conf}%</div></td><td><button className="rounded border border-[#147dff] px-3 py-1.5 text-[#147dff]">{action}</button></td></tr>;
}

function OptimizationNetworkHeatMapReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved recommendation heat-map source." />;
  const panels = [["PANEL LP-1","125 kW","#05ff5e"],["PANEL LP-2","118 kW","#05ff5e"],["PANEL LP-3","110 kW","#ff8a00"],["PANEL LP-4","142 kW","#ff8a00"],["PANEL LP-5","95 kW","#05ff5e"],["PANEL LP-6","90 kW","#05ff5e"]];
  return <div className="relative h-full text-[8px]"><svg className="absolute inset-0 h-full w-full" viewBox="0 0 470 210"><g fill="#e2e8f0" fontSize="8" textAnchor="middle"><text x="235" y="18">UTILITY SOURCE</text><text x="235" y="30">13.2 kV</text></g><g stroke="#94a3b8" strokeWidth="1.5"><line x1="235" x2="235" y1="36" y2="62" /><line x1="235" x2="235" y1="88" y2="110" /><line x1="70" x2="400" y1="130" y2="130" />{[70,136,202,268,334,400].map((x) => <line key={x} x1={x} x2={x} y1="130" y2="158" />)}</g><rect fill="#061521" height="30" rx="4" stroke="#94a3b8" width="98" x="186" y="58" /><rect fill="#061521" height="30" rx="4" stroke="#94a3b8" width="98" x="186" y="106" /><g fill="#e2e8f0" fontSize="8" textAnchor="middle"><text x="235" y="71">MAIN TRANSFORMER</text><text x="235" y="82">1500 kVA</text><text x="235" y="119">MAIN SWITCHBOARD</text><text x="235" y="130">1200A, 480Y/277V</text></g>{panels.map(([label,load,color], i) => { const x = 70 + i * 66; return <g key={label}><rect fill="#061521" height="24" rx="2" stroke="#94a3b8" width="54" x={x - 27} y="158" /><text fill="#e2e8f0" fontSize="7" textAnchor="middle" x={x} y="169">{label}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x} y="179">{load}</text><circle cx={x} cy="194" fill={color} r="4" /></g>; })}</svg><div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px]"><span className="text-[#05ff5e]">● Good (PF ≥ 0.96, THD ≤ 3%)</span><span className="text-yellow-300">● Monitor (Near Limit)</span><span className="text-orange-400">● Poor (Action Recommended)</span><span className="text-[#05ff5e]">View Full Network →</span></div></div>;
}

function TopPriorityActionsReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved priority action model")} />;
  const rows = [["1","Install XECO Active Power Filter (XAPF-200)","Main Switchboard (Upstream)","Savings / Yr: $112,430","Payback: 1.6 yrs","Impact: PF ↑, THD ↓","High"],["2","Balance Phase Loads","Panel LP-3, LP-4, LP-6","Savings / Yr: $34,250","Payback: 0.8 yrs","Impact: Unbalance ↓","High"],["3","Install Capacitor Bank","Panel LP-5","Savings / Yr: $21,780","Payback: 1.3 yrs","Impact: kVAR ↓, PF ↑","Medium"]];
  return <div className="flex h-full flex-col gap-2 text-[7.4px]">{rows.map(([rank,title,sub,savings,payback,impact,sev]) => <div className="rounded border border-cyan-300/12 bg-[#061421] p-1.5" key={rank}><div className="flex items-center justify-between"><span><b className="mr-2 inline-grid size-5 place-items-center rounded-full bg-[#147dff]">{rank}</b><b>{title}</b></span><span className={sev === "High" ? "rounded border border-red-400 px-2 py-0.5 text-red-400" : "rounded border border-yellow-300 px-2 py-0.5 text-yellow-300"}>{sev}</span></div><div className="ml-7 mt-0.5 text-slate-400">{sub}</div><div className="ml-7 mt-0.5 flex gap-4 text-slate-300"><span>{savings}</span><span>{payback}</span><span>{impact}</span></div></div>)}<div className="mt-auto text-[8px] text-[#05ff5e]">View All Recommendations →</div></div>;
}

function OptimizationImpactSummaryCard() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved optimization impact model")} />;
  return <div className="space-y-2 text-[8px]">{[["Total Annual Savings Potential","$286,450"],["Demand Reduction Potential","187 kW"],["Energy Reduction Potential","524,300 kWh"],["CO₂ Reduction Potential","284 tons / yr"]].map(([label,value]) => <div className="grid grid-cols-[22px_1fr_auto] border-b border-white/6 pb-1.5" key={label}><span className="text-[#05ff5e]">ⓘ</span><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}</div>;
}

function SavingsPotentialOverTimeReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <NoDataPanel message="No approved savings forecast model." />;
  const cumulative = "26,142 76,126 126,106 176,86 226,66 276,46 326,22";
  const annual = "26,150 76,138 126,144 176,136 226,142 276,148 326,140";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-between"><span>Savings (USD)</span><button className="rounded border border-cyan-300/12 px-2 py-0.5 text-[7px]">5 Years⌄</button></div><svg className="h-[150px] w-full" viewBox="0 0 350 158"><g stroke="rgba(148,163,184,.16)">{[20,52,84,116,146].map((y) => <line key={y} x1="26" x2="342" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">$1.5M</text><text x="0" y="56">$1.2M</text><text x="0" y="88">$900K</text><text x="0" y="120">$600K</text><text x="0" y="150">$0</text></g><polyline fill="none" points={cumulative} stroke="#05ff5e" strokeWidth="2" />{parseNetworkPoints(cumulative).map(([x,y]) => <circle cx={x} cy={y} fill="#061521" key={x} r="3" stroke="#05ff5e" strokeWidth="2" />)}{parseNetworkPoints(annual).map(([x,y], i) => <rect fill="#147dff" height={148-y} key={x} width="16" x={x - 8} y={y} opacity=".8" />)}<rect fill="#063b27" height="18" rx="3" width="46" x="286" y="12" /><text fill="#05ff5e" fontSize="8" textAnchor="middle" x="309" y="24">$1.43M</text></svg><div className="flex justify-between px-7 text-[7px] text-slate-500"><span>Year 1</span><span>Year 2</span><span>Year 3</span><span>Year 4</span><span>Year 5</span></div><div className="mt-1 flex justify-center gap-5 text-[8px]"><span className="text-[#05ff5e]">━ Cumulative Savings</span><span className="text-[#147dff]">■ Annual Savings</span></div></div>;
}

function NextStepsReference() {
  if (!hasApprovedElectricalModel("recommendations")) return <MetricListSmall rows={noDataRows("No approved recommendation workflow model")} />;
  const rows = ["Review recommendations and target locations", "Approve recommended actions", "Generate detailed scope of work", "Schedule installation with XECO team", "Monitor results and verify savings"];
  return <div className="flex h-full flex-col text-[8px]"><div className="space-y-3">{rows.map((row) => <div className="grid grid-cols-[22px_1fr] gap-2" key={row}><span className="grid size-5 place-items-center rounded-full border border-[#05ff5e] text-[#05ff5e]">✓</span><span>{row}</span></div>)}</div><div className="mt-auto rounded border border-cyan-300/12 bg-[#062033] p-3 text-cyan-100">ⓘ &nbsp; These recommendations are based on real-time data and industry best practices. Actual results may vary.</div></div>;
}

function emptyDigitalTwinScreenData(): DigitalTwinData {
  return {
    activeMeters: 0,
    assets: [],
    cbiScore: 0,
    currentLoadKva: 0,
    dateRange: "No Data",
    headroomKva: 0,
    projectName: "No Data",
    recoveredCapacityKva: 0,
    relationships: [],
    siteName: "No Data",
    state: "empty",
    status: "No Data",
    transformerKva: 0,
    twinId: null,
    twinLabel: "No Data",
    twinNotes: "No Data",
    updatedAt: "No Data",
    version: 0,
  };
}

function siteLabel(data: DigitalTwinData) {
  return data.siteName || data.projectName || "No Data";
}

function primaryAsset(data: DigitalTwinData) {
  return data.assets.find((asset) => asset.type.toLowerCase().includes("transformer")) ?? data.assets[0];
}

function formatKva(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "No Data";
  }

  return `${Math.round(value).toLocaleString()} kVA`;
}

function formatMw(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "No Data";
  }

  return `${(value / 1000).toFixed(2)} MW`;
}

function utilizationPct(data: DigitalTwinData) {
  if (!data.transformerKva || !data.currentLoadKva) {
    return 0;
  }

  return Math.min(100, Math.round((data.currentLoadKva / data.transformerKva) * 100));
}

function healthScore(data: DigitalTwinData) {
  if (!data.cbiScore) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(data.cbiScore)));
}

function noDataRows(message: string): [string, string][] {
  return [["No Data", message]];
}

function noDataTableRows(message: string, length: number): string[][] {
  return [Array.from({ length }, (_, index) => (index === 0 ? "No Data" : index === 1 ? message : "No Data"))];
}

function assetCapacityRows(data: DigitalTwinData): [string, string][] {
  const totals = new Map<string, number>();

  for (const asset of data.assets) {
    const key = asset.type || "Unclassified";
    totals.set(key, (totals.get(key) ?? 0) + asset.kvaRating);
  }

  return Array.from(totals.entries())
    .filter(([, value]) => value > 0)
    .slice(0, 5)
    .map(([label, value]) => [label, formatKva(value)]);
}

function assetTypeCounts(data: DigitalTwinData): [string, string][] {
  const totals = new Map<string, number>();

  for (const asset of data.assets) {
    const key = asset.type || "Unclassified";
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  return Array.from(totals.entries())
    .slice(0, 4)
    .map(([label, value]) => [`${label} Assets`, String(value)]);
}

function voltageLevels(data: DigitalTwinData) {
  const values = new Set<string>();

  for (const asset of data.assets) {
    if (asset.voltagePrimary > 0) values.add(`${asset.voltagePrimary} V`);
    if (asset.voltageSecondary > 0) values.add(`${asset.voltageSecondary} V`);
  }

  return values.size > 0 ? Array.from(values).slice(0, 4).join(" / ") : "No Data";
}

function NoDataPanel({ message }: { message: string }) {
  return <div className="grid h-full min-h-[80px] place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] p-4 text-center text-[9px] text-slate-400">No Data<br />{message}</div>;
}

function hasApprovedElectricalModel(model: "losses" | "lossOptimization" | "powerQuality" | "recommendations") {
  void model;
  return false;
}

function FullNetworkExpandedReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-4 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Site<br /><b>{siteLabel(data)}</b>⌄</button><button className="w-[220px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.updatedAt}⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[74px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Enterprise &nbsp; › &nbsp; {data.projectName} &nbsp; › &nbsp; {siteLabel(data)} &nbsp; › &nbsp; <span className="text-slate-200">Full Network</span></div><h1 className="mt-1 text-2xl font-light">Full Network View</h1><p className="mt-1 text-[10px] text-slate-300">Complete electrical network and power flow visualization.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Site Dashboard</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Diagram</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▣ Network Report</button><button className="rounded bg-[#147dff] px-5 py-2 text-white">⛶ Fullscreen</button></div>
        </div>
        <section className="grid h-[728px] min-h-0 grid-cols-[1.55fr_0.54fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[1fr_206px] gap-3 overflow-hidden">
            <div className="relative overflow-hidden rounded-lg border border-cyan-300/12 bg-[#03111d]"><FullNetworkOneLineCanvas /><FullNetworkLegend /><FullNetworkControls /></div>
            <div className="grid min-h-0 grid-cols-[0.92fr_0.88fr_1.05fr] gap-3 overflow-hidden">
              <PeakBox title="TRANSFORMER DETAILS"><FullNetworkTransformerDetails data={data} /></PeakBox>
              <PeakBox title="POWER FLOW SUMMARY (Live)"><FullNetworkPowerFlowSummary /></PeakBox>
              <PeakBox title="TOP 5 FEEDER LOAD (kW)"><FullNetworkFeederLoad /></PeakBox>
            </div>
          </div>
          <aside className="grid min-h-0 grid-rows-[190px_316px_1fr] gap-3 overflow-hidden">
            <PeakBox title="NETWORK SUMMARY"><FullNetworkSummary data={data} /></PeakBox>
            <PeakBox title="NETWORK HIERARCHY"><FullNetworkHierarchy data={data} /></PeakBox>
            <PeakBox title="ALARMS & EVENTS"><NoDataPanel message="No Data - no approved network alarm/event source." /></PeakBox>
          </aside>
        </section>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function FullNetworkOneLineCanvas() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 930 500" preserveAspectRatio="none" aria-hidden="true">
      <defs><filter id="fullGreenGlow"><feGaussianBlur stdDeviation="1.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <g transform="translate(456 10)" textAnchor="middle"><text fill="#e2e8f0" fontSize="8" fontWeight="700">UTILITY SOURCE</text><text fill="#e2e8f0" fontSize="8" y="12">13.2 kV</text><text fill="#05ff5e" fontSize="8" y="35">↓ 1,063 kW</text></g>
      <line stroke="#05ff5e" strokeWidth="1.8" x1="456" x2="456" y1="45" y2="92" />
      <g transform="translate(408 58)"><text fill="#e2e8f0" fontSize="8" textAnchor="end">UTILITY</text><text fill="#e2e8f0" fontSize="8" textAnchor="end" y="11">METER</text><text fill="#94a3b8" fontSize="7" textAnchor="end" y="22">PF 0.98</text><text fill="#94a3b8" fontSize="7" textAnchor="end" y="33">THD 4.1%</text><rect fill="#061521" height="28" rx="2" stroke="#e2e8f0" width="20" x="8" y="2" /><text fill="#e2e8f0" fontSize="14" x="13" y="22">⌁</text></g>
      <FullNetworkDeviceBox title="XECO ACTIVE POWER FILTER" sub="(XAPF-200)" meta="Status: Online" extra="PF Improvement 0.82 → 0.98" x={522} y={62} w={150} />
      <line stroke="#05ff5e" strokeDasharray="3 3" strokeWidth="1.5" x1="508" x2="522" y1="96" y2="96" />
      <line stroke="#05ff5e" strokeWidth="1.8" x1="456" x2="456" y1="92" y2="140" />
      <FullNetworkDeviceBox title="MAIN TRANSFORMER" sub="1500 kVA" meta="13.2kV → 480Y/277V" x={468} y={122} w={128} />
      <text fill="#05ff5e" fontSize="8" textAnchor="end" x="442" y="128">1,015 kW</text>
      <line stroke="#05ff5e" strokeWidth="1.8" x1="456" x2="456" y1="176" y2="206" />
      <FullNetworkDeviceBox title="MAIN SWITCHBOARD" sub="1200A, 480Y/277V, 3Ø, 4W" meta="PF 0.98  THD 4.1%" x={468} y={206} w={148} />
      <line stroke="#147dff" strokeWidth="2" x1="114" x2="804" y1="270" y2="270" />
      {[114,252,390,528,666,804].map((x) => <line key={x} stroke="#147dff" strokeWidth="2" x1={x} x2={x} y1="270" y2="306" />)}
      {fullNetworkFeeders.map((feeder) => <FullNetworkFeeder key={feeder.name} {...feeder} />)}
    </svg>
  );
}

const fullNetworkFeeders = [
  { name: "PANEL LP-1", amps: "225A", load: "125 kW", x: 114, color: "#05ff5e", loads: [["MCC-1", "75 kW", "Ⓜ"], ["MCC-2", "50 kW", "Ⓜ"]] },
  { name: "PANEL LP-2", amps: "225A", load: "118 kW", x: 252, color: "#05ff5e", loads: [["MCC-3", "60 kW", "Ⓜ"], ["MCC-4", "58 kW", "Ⓜ"]] },
  { name: "PANEL LP-3", amps: "225A", load: "110 kW", x: 390, color: "#05ff5e", loads: [["HVAC-1", "70 kW", "❄"], ["PUMP-1", "40 kW", "▱"]] },
  { name: "PANEL LP-4", amps: "225A", load: "142 kW", x: 528, color: "#ff8a00", loads: [["COMP-1", "90 kW", "▰"], ["DRYER-1", "52 kW", "▣"]] },
  { name: "PANEL LP-5", amps: "225A", load: "95 kW", x: 666, color: "#05ff5e", loads: [["LIGHTING", "95 kW", "♢"]] },
  { name: "PANEL LP-6", amps: "225A", load: "90 kW", x: 804, color: "#05ff5e", loads: [["OFFICE", "45 kW", "▦"], ["IT ROOM", "45 kW", "▤"]] },
];

function FullNetworkFeeder({ amps, color, load, loads, name, x }: { amps: string; color: string; load: string; loads: string[][]; name: string; x: number }) {
  return <g transform={`translate(${x} 286)`}><text fill={color} fontSize="8" textAnchor="middle" y="-10">{load}</text><rect fill="#061521" height="30" rx="2" stroke="#e2e8f0" width="18" x="-9" /><text fill="#e2e8f0" fontSize="12" textAnchor="middle" x="0" y="20">›</text><text fill="#e2e8f0" fontSize="8" textAnchor="start" x="16" y="12">{name}</text><text fill="#e2e8f0" fontSize="7" textAnchor="start" x="16" y="23">{amps}</text>{loads.map(([label, kw, icon], index) => { const dx = index === 0 ? -31 : 31; return <g key={label} transform={`translate(${dx} 80)`}><polyline fill="none" points={`0,-50 0,-22 ${dx > 0 ? 0 : 0},-8`} stroke="#e2e8f0" strokeWidth="1" /><text fill="#e2e8f0" fontSize="8" textAnchor="middle" y="8">{label}</text><text fill={color} fontSize="8" textAnchor="middle" y="20">{kw}</text><text fill="#e2e8f0" fontSize="21" textAnchor="middle" y="48">{icon}</text></g>; })}</g>;
}

function FullNetworkDeviceBox({ extra, meta, sub, title, w, x, y }: { extra?: string; meta: string; sub: string; title: string; w: number; x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><rect fill="#061521" height={extra ? 76 : 48} rx="4" stroke="#1e3a5f" width={w} /><text fill="#e2e8f0" fontSize="8" fontWeight="700" x="10" y="14">{title}</text><text fill="#e2e8f0" fontSize="8" x="10" y="26">{sub}</text><text fill="#94a3b8" fontSize="7" x="10" y="38">{meta}</text>{extra ? <text fill="#05ff5e" fontSize="7" x="10" y="52">{extra}</text> : null}</g>;
}

function FullNetworkLegend() {
  const rows = [["#05ff5e", "13.2 kV"], ["#147dff", "480 V"], ["#a855f7", "208 V"], ["#05ff5e", "Power Flow (kW)"], ["#e2e8f0", "Transformer"], ["#e2e8f0", "Circuit Breaker"], ["#e2e8f0", "Switch"], ["#e2e8f0", "Meter"], ["#05ff5e", "Active Device"], ["#e2e8f0", "Load"]];
  return <div className="absolute left-4 top-4 w-[132px] rounded border border-cyan-300/18 bg-[#061521]/95 p-3 text-[8px]"><div className="mb-2 text-center font-semibold text-slate-200">LEGEND</div><div className="space-y-1.5">{rows.map(([color,label]) => <div className="flex items-center gap-2" key={label}><span className="h-[1px] w-5" style={{ background: color }} /><span>{label}</span></div>)}</div></div>;
}

function FullNetworkControls() {
  return <div className="absolute right-4 top-4 flex items-center gap-2 text-[10px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⚙ Display Options⌄</button><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421]">⌕</button><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421]">+</button><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421]">−</button><button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421]">⛶</button></div>;
}

function FullNetworkSummary({ data }: { data: DigitalTwinData }) {
  const utilization = utilizationPct(data);
  const rows = [
    ["Total Connected Load", formatMw(data.transformerKva)],
    ["Total Demand (Live)", formatMw(data.currentLoadKva)],
    ["Total Apparent Power", formatKva(data.currentLoadKva)],
    ["Power Factor (Avg)", "No Data"],
    ["Total Harmonic Distortion", "No Data"],
    ["System Frequency", "No Data"],
    ["System Voltage (Avg.)", "No Data"],
  ];

  return <div className="space-y-2 text-[8px]">{rows.map(([label,value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><b>{value}</b></div>)}<div className="flex justify-between"><span>Capacity Utilization</span><b>{utilization}%</b></div><MeterBar value={utilization} /></div>;
}

function FullNetworkHierarchy({ data }: { data: DigitalTwinData }) {
  const assets = data.assets.length ? data.assets.slice(0, 8) : [];
  return <div className="flex h-full flex-col text-[8px]"><div className="space-y-1.5"><div>▾ {data.projectName || "Project"}</div><div className="ml-4">▾ {siteLabel(data)}</div>{assets.length ? assets.map((asset) => <div className="ml-8" key={asset.id}>• {asset.name} ({asset.type})</div>) : <div className="ml-8 text-slate-400">No asset hierarchy rows returned</div>}</div><div className="mt-auto border-t border-white/8 pt-3"><b>Active Devices</b><div className="mt-2 space-y-2 text-[#05ff5e]"><div>No Data<br /><span className="text-slate-400">No approved device-event source for this network panel.</span></div></div></div></div>;
}

function FullNetworkEvents() {
  return <div className="space-y-3 text-[8px]"><div className="grid grid-cols-[24px_1fr_auto] gap-2"><span className="grid size-6 place-items-center rounded-full bg-red-500/15 text-red-400">✧</span><span><b className="block text-red-300">High THD Alert</b><span className="text-slate-400">THD (4.1%) exceeds threshold (4.0%)</span></span><span className="text-slate-400">10:14 AM</span></div><div className="grid grid-cols-[24px_1fr_auto] gap-2"><span className="grid size-6 place-items-center rounded-full bg-yellow-500/15 text-yellow-300">△</span><span><b className="block text-yellow-300">Transformer Temperature Warning</b><span className="text-slate-400">Main Transformer temperature high 62 C</span></span><span className="text-slate-400">10:12 AM</span></div><div className="pt-1 text-[#05ff5e]">View All Alarms →</div></div>;
}

function FullNetworkTransformerDetails({ data }: { data: DigitalTwinData }) {
  return <div className="flex h-full flex-col text-[8px]">{[["Name",data.twinLabel || "Ochsner Digital Twin"],["Rating",formatKva(data.transformerKva)],["Primary Voltage","No Data"],["Secondary Voltage","No Data"],["Impedance","No Data"],["Loading (Current)",`${utilizationPct(data)}% (${formatKva(data.currentLoadKva)})`],["Temperature","No Data"]].map(([label,value]) => <div className="flex justify-between border-b border-white/5 py-1" key={label}><span className="text-slate-400">{label}</span><b>{value}</b></div>)}<div className="mt-auto text-[#05ff5e]">View Transformer Analytics →</div></div>;
}

function FullNetworkPowerFlowSummary() {
  const rows = [["Production Loads","512 kW (48.2%)","#05ff5e"],["HVAC & Mechanical","300 kW (28.2%)","#147dff"],["Lighting","95 kW (8.9%)","#a855f7"],["Other Loads","156 kW (14.7%)","#f59e0b"]];
  return <div className="grid h-full grid-cols-[132px_1fr] gap-2 text-[8px]"><div className="relative"><svg className="size-[120px]" viewBox="0 0 90 90"><circle cx="45" cy="45" fill="none" r="31" stroke="#05ff5e" strokeDasharray="94 195" strokeWidth="18" transform="rotate(-90 45 45)" /><circle cx="45" cy="45" fill="none" r="31" stroke="#147dff" strokeDasharray="55 195" strokeDashoffset="-96" strokeWidth="18" transform="rotate(-90 45 45)" /><circle cx="45" cy="45" fill="none" r="31" stroke="#a855f7" strokeDasharray="17 195" strokeDashoffset="-153" strokeWidth="18" transform="rotate(-90 45 45)" /><circle cx="45" cy="45" fill="none" r="31" stroke="#f59e0b" strokeDasharray="29 195" strokeDashoffset="-172" strokeWidth="18" transform="rotate(-90 45 45)" /><circle cx="45" cy="45" fill="#061521" r="22" /></svg><div className="absolute left-0 top-[38px] w-[120px] text-center"><b className="text-lg">1,063</b> kW<br /><span className="text-slate-400">Total Demand</span></div></div><div className="flex flex-col gap-2">{rows.map(([label,value,color]) => <div className="grid grid-cols-[12px_1fr] gap-2" key={label}><span className="mt-1 size-2 rounded-sm" style={{ background: color }} /><span>{label}<br /><b>{value}</b></span></div>)}<div className="mt-auto text-[#05ff5e]">View Load Analysis →</div></div></div>;
}

function FullNetworkFeederLoad() {
  const rows = [["Panel LP-4","142 kW","13.4%"],["Panel LP-1","125 kW","11.8%"],["Panel LP-2","118 kW","11.1%"],["Panel LP-3","110 kW","10.3%"],["Panel LP-5","95 kW","8.9%"]];
  return <div className="flex h-full flex-col text-[8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr><th className="pb-2 font-medium">Feeder</th><th className="pb-2 text-right font-medium">Demand (kW)</th><th className="pb-2 text-right font-medium">% of Total</th></tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}><td className="py-2">{row[0]}</td><td className="text-right">{row[1]}</td><td className="text-right">{row[2]}</td></tr>)}</tbody></table><div className="mt-auto text-[#05ff5e]">View All Feeders →</div></div>;
}

function OneLineDrawingScannerReferenceScreen({ data }: { data: DigitalTwinData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 py-2">
        <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[14px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Site<br /><b>{siteLabel(data)}</b>⌄</button><button className="w-[220px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {data.updatedAt}⌄</button><span className="text-[#05ff5e]">● Online</span><span className="text-red-400">●</span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#17324a]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[96px] items-center justify-between">
          <div><div className="text-[11px] text-slate-300">Enterprise &nbsp; › &nbsp; {data.projectName} &nbsp; › &nbsp; {siteLabel(data)} &nbsp; › &nbsp; <span className="font-semibold text-slate-100">Scan One-Line Drawing</span></div><h1 className="mt-4 text-3xl font-light">Scan One-Line Drawing</h1><p className="mt-1 text-[12px] text-slate-300">Upload or scan your facility one-line drawing to map your electrical system and enable network analysis.</p></div>
          <button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-3 text-[11px]">← Back to Project Setup</button>
        </div>
        <section className="grid h-[590px] min-h-0 grid-cols-[0.72fr_1fr] gap-3 overflow-hidden">
          <ScannerWhiteCard title="1. Upload or Scan One-Line Drawing"><ScannerUploadPanel /></ScannerWhiteCard>
          <ScannerWhiteCard title="2. Extracted Preview"><ScannerBlockedPanel /></ScannerWhiteCard>
        </section>
        <div className="mt-3 flex h-[58px] items-center rounded-lg border border-amber-300/25 bg-amber-500/10 px-5 text-[12px] text-amber-100"><span className="mr-4 grid size-6 place-items-center rounded-full border border-amber-300 text-amber-300">!</span>No Data - scanner upload, OCR extraction, and drawing write model are not approved for this pass.</div>
        <div className="mt-4 flex h-[42px] justify-end gap-4 text-[12px]"><button className="w-[128px] rounded border border-slate-600 bg-[#061421]">Cancel</button><button className="w-[150px] rounded border border-slate-600 bg-[#061421]">Skip for Now</button><button className="w-[190px] rounded bg-[#0a9f3e] text-white">Save & Continue →</button></div>
        <footer className="absolute bottom-2 left-4 right-4 flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: {data.updatedAt} &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function ScannerWhiteCard({ children, title }: { children: ReactNode; title: string }) {
  return <article className="min-h-0 overflow-hidden rounded-lg border border-slate-300 bg-white p-4 text-slate-950 shadow-[0_18px_60px_rgba(0,0,0,.32)]"><h2 className="mb-4 text-[16px] font-semibold">{title}</h2>{children}</article>;
}

function ScannerBlockedPanel() {
  return <div className="grid h-full place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-8 text-center text-[14px] leading-relaxed text-slate-600"><div><div className="mb-3 text-2xl font-semibold text-slate-800">No Data</div><div>No approved upload storage, OCR extraction, detected-component table, or scanner write workflow exists yet.</div><div className="mt-4 text-[12px] text-slate-500">The visual shell is preserved; generated drawing data is intentionally blocked.</div></div></div>;
}

function ScannerUploadPanel() {
  return (
    <div className="flex h-full flex-col text-[13px]">
      <div className="grid h-[226px] place-items-center rounded-lg border-2 border-dashed border-[#147dff]/55 bg-slate-50">
        <div className="text-center"><div className="mx-auto mb-3 grid size-9 place-items-center rounded text-3xl text-[#147dff]">⇪</div><div className="text-[16px]">Drag and drop your one-line drawing here<br />or scan using your device</div><button className="mt-5 w-[248px] rounded bg-[#0869dd] px-5 py-2.5 text-[14px] text-white">▣ &nbsp; Scan One-Line Drawing</button></div>
      </div>
      <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-slate-600"><span className="h-px bg-slate-300" /><span>or</span><span className="h-px bg-slate-300" /></div>
      <div className="grid grid-cols-[170px_1fr] gap-6"><div><div className="mb-2 font-semibold">Upload from your device</div><button className="w-[160px] rounded border border-[#147dff]/55 bg-white px-4 py-2.5 text-[#147dff]">▭ &nbsp; Browse Files</button></div><div className="pt-7 text-slate-600">Supported formats: JPG, PNG, PDF, DWG<br />(Max file size: 10MB)</div></div>
      <div className="mt-4 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 p-3"><div className="mb-1.5 flex items-center gap-3 text-[14px] font-semibold text-slate-800"><span className="text-[#147dff]">☼</span>Tips for Best Results</div><ul className="ml-10 list-disc space-y-1 text-[11.5px]"><li>Use a clear, high-resolution image</li><li>Ensure the entire one-line is visible</li><li>Include labels, ratings, and breaker information</li><li>Avoid glare and shadows</li></ul></div>
    </div>
  );
}

function ScannerPreviewPanel() {
  return (
    <div className="flex h-full flex-col text-[12px]">
      <div className="mb-3 flex items-center gap-2 text-[#0a9f3e]"><span className="grid size-5 place-items-center rounded-full border border-[#0a9f3e]">✓</span>Drawing processed successfully</div>
      <div className="relative h-[300px] rounded-lg border border-slate-300 bg-white"><button className="absolute right-4 top-4 z-10 rounded border border-slate-300 bg-white px-4 py-2 text-[11px]">⛶ &nbsp; Enlarge</button><ScannerExtractedDrawing /></div>
      <div className="mt-3 font-semibold">Detected Components (Auto-Extracted)</div>
      <div className="mt-2 grid h-[58px] grid-cols-5 gap-3"><ScannerComponentCard icon="♙" value="1" label="Transformer" tone="green" /><ScannerComponentCard icon="⇪" value="1" label="Switchgear" tone="blue" /><ScannerComponentCard icon="⌘" value="6" label="Breakers" tone="purple" /><ScannerComponentCard icon="▤" value="6" label="Panels" tone="orange" /><ScannerComponentCard icon="▭" value="1" label="MCC" tone="cyan" /></div>
      <div className="mt-2 rounded border border-slate-200 bg-white px-4 py-2.5 text-[#147dff]">Review & Edit Extracted Components →</div>
    </div>
  );
}

function ScannerExtractedDrawing() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 660 360" preserveAspectRatio="none" aria-hidden="true">
      <g stroke="#111827" strokeWidth="2" fill="none"><line x1="330" x2="330" y1="44" y2="92" /><path d="M320 84 L330 68 L340 84 L330 100 Z" /><line x1="330" x2="330" y1="100" y2="134" /><path d="M296 136 C308 150 318 150 330 136 C342 150 352 150 364 136" /><path d="M296 152 C308 166 318 166 330 152 C342 166 352 166 364 152" /><line x1="120" x2="610" y1="202" y2="202" />{[120,220,330,440,540,610].map((x) => <g key={x}><line x1={x} x2={x} y1="202" y2="252" /><path d={`M${x - 8} 226 L${x} 214 L${x + 8} 226 L${x} 238 Z`} /></g>)}</g>
      <g fill="#111827" fontSize="11" fontWeight="700" textAnchor="middle"><text x="330" y="28">UTILITY SOURCE</text><text x="330" y="40">13.2KV</text><text x="375" y="90">MAIN</text><text x="375" y="103">SWITCHGEAR</text><text x="375" y="116">13.2KV</text><text x="390" y="146">MAIN TRANSFORMER</text><text x="390" y="160">1500 KVA</text><text x="390" y="174">13.2KV / 480Y/277V</text><text x="604" y="192">MAIN BUS</text><text x="604" y="205">480Y/277V</text></g>
      {[["PANEL A","400A","HVAC","LOAD",120],["PANEL B","400A","LIGHTING","LOAD",220],["PANEL C","400A","PRODUCTION","LINE 1",330],["PANEL D","400A","PRODUCTION","LINE 2",440],["MCC-1","600A","MOTORS","LOAD",540],["PANEL E","400A","SPARE","",610]].map(([a,b,c,d,x]) => <g key={a as string} fill="#111827" fontSize="10" fontWeight="700" textAnchor="middle"><text x={x as number} y="276">{a as string}</text><text x={x as number} y="289">{b as string}</text><line stroke="#111827" strokeWidth="2" x1={x as number} x2={x as number} y1="302" y2="326" /><text x={x as number} y="344">{c as string}</text><text x={x as number} y="357">{d as string}</text></g>)}
    </svg>
  );
}

function ScannerComponentCard({ icon, label, tone, value }: { icon: string; label: string; tone: "green" | "blue" | "purple" | "orange" | "cyan"; value: string }) {
  const color = tone === "green" ? "text-[#0a9f3e]" : tone === "blue" ? "text-[#147dff]" : tone === "purple" ? "text-purple-600" : tone === "orange" ? "text-orange-500" : "text-cyan-500";
  return <div className="grid grid-cols-[30px_1fr] items-center rounded border border-slate-300 bg-white px-3"><span className={`text-2xl ${color}`}>{icon}</span><span><b className="text-lg">{value}</b><br /><span className="text-[9px] text-slate-500">{label}</span></span></div>;
}

function LossesOptimizationLayout({ actionPlan }: { actionPlan: boolean }) {
  return (
    <>
      <section className="mt-2 grid h-[72px] grid-cols-6 gap-2">
        <NetworkKpi label="Total Optimization Potential" value="62 kW" detail="34.8% of Total Losses" tone="green" />
        <NetworkKpi label="Estimated Annual Savings" value="$62,000" detail="~$5,167 / month" tone="purple" />
        <NetworkKpi label="Payback Period" value="5.1 months" detail="Very Good" tone="yellow" />
        <NetworkKpi label="Implementation Cost" value="$23,800" detail="One-Time" tone="blue" />
        <NetworkKpi label="Expected PF Improvement" value="+0.06" detail="From 0.91 to 0.97" tone="green" />
        <NetworkKpi label="CO2 Reduction" value="~70.2" detail="metric tons / year" tone="green" />
      </section>
      {actionPlan ? <div className="mt-2 flex items-center justify-between rounded border border-cyan-300/15 bg-[#062033] px-3 py-2 text-[9px] text-cyan-100"><span>This action plan is customized for your network and based on the current analysis period. Implementation of all recommended actions can achieve maximum potential savings.</span><span className="flex gap-2"><button className="rounded border border-cyan-300/20 bg-[#061421] px-4 py-1 text-slate-200">Customize Plan</button><button className="rounded bg-[#087a35] px-4 py-1 text-[#eafff1]">Download PDF</button></span></div> : null}
      {!actionPlan ? <FilterBar labels={["May 12 - May 18, 2025", "All Feeders", "All Loss Categories", "All Severities", "All Actions", "Clear Filters"]} /> : null}
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.32fr_0.74fr] gap-2">
        <div className="space-y-2 overflow-hidden">
          {actionPlan ? null : <div className="grid h-[166px] grid-cols-[0.9fr_0.9fr_1fr] gap-2"><DashboardPanel title="Loss Reduction Potential By Category" variant="enterprise"><Bars rows={[["IR Losses", "90%", "red"], ["Transformer", "58%", "yellow"], ["Harmonics", "38%", "yellow"], ["Eddy Current", "24%", "green"], ["Other", "18%", "green"]]} /></DashboardPanel><DashboardPanel title="Optimization Impact Summary" variant="enterprise"><MetricListSmall rows={[["Total Losses", "178 kW -> 116 kW"], ["Loss Percentage", "2.78% -> 1.80%"], ["Energy Lost", "3.42 -> 2.22 MWh/day"], ["Cost of Losses", "$342 -> $280/day"], ["Power Factor", "0.91 -> 0.97"]]} /></DashboardPanel><DashboardPanel title="Top Optimization Opportunities" variant="enterprise"><NetworkTable headers={["#", "Opportunity", "Potential", "Savings"]} rows={actionRows.slice(0, 6).map(([rank, action, , , potential, , savings]) => [rank, action.replace(" on Feeder 4", "").replace(" on Feeder 1", ""), potential, savings])} /></DashboardPanel></div>}
          <DashboardPanel className={actionPlan ? "h-[388px]" : "h-[238px]"} title={actionPlan ? "Recommended Action Plan" : "Optimization Action Plan"} variant="enterprise"><ActionPlanTable /></DashboardPanel>
        </div>
        <div className="space-y-2 overflow-hidden">
          {actionPlan ? <DashboardPanel title="Savings Breakdown" variant="enterprise"><NetworkDonut total="$62,000" rows={[["Reactive Power Savings", "$31,500"], ["Transformer Savings", "$12,600"], ["Harmonic Savings", "$10,400"], ["IR Conductor Savings", "$7,300"]]} /></DashboardPanel> : null}
          {!actionPlan ? <DashboardPanel title="Energy & Cost Savings Forecast" variant="enterprise"><NetworkTrend colors={["#ef4444", "#05ff5e"]} /></DashboardPanel> : null}
          <DashboardPanel title="Implementation Roadmap" variant="enterprise"><Roadmap /></DashboardPanel>
          {actionPlan ? <DashboardPanel title="Plan Includes" variant="enterprise"><MetricListSmall rows={[["Detailed action steps", "Included"], ["Technical specs", "Included"], ["Savings calculations", "Included"], ["Risk assessment", "Included"], ["Professional Report Format", "PDF"]]} /></DashboardPanel> : null}
        </div>
      </section>
    </>
  );
}

function ActionPlanTable() {
  const headers = ["#", "Action", "Category", "Location / Asset", "Potential", "Est. Cost", "Annual Savings", "Payback", "Status"];
  return (
    <div className="flex h-full flex-col">
      <table className="w-full text-left text-[7.5px]">
        <thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead>
        <tbody>{actionRows.map((row, index) => <tr className="border-t border-white/5" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={cell === "High" ? "py-1 text-red-400" : cell === "Medium" ? "py-1 text-yellow-300" : cell === "Low" || cell === "Recommended" ? "py-1 text-[#05ff5e]" : "py-1 text-slate-300"} key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
      <div className="mt-1 grid grid-cols-[1fr_0.18fr_0.18fr_0.18fr_0.18fr] border-t border-white/5 pt-1.5 text-[8px]">
        <b className="text-slate-200">Total / Average</b>
        <b className="text-slate-200">60 kW</b>
        <b className="text-slate-200">$23,800</b>
        <b className="text-slate-200">$62,000</b>
        <b className="text-slate-200">5.1 mo</b>
      </div>
      <div className="mt-1 flex items-center justify-between pt-1 text-[8px] text-slate-400">
        <span>Showing 1 to 6 of 6 actions</span>
        <button className="text-[#05ff5e]">Download Action Plan ⬇</button>
      </div>
    </div>
  );
}

function PowerTriangle() {
  return (
    <div className="relative h-full min-h-[92px] text-[8px]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 160 120" aria-hidden="true">
        <path d="M42 18 L42 92 L126 92 Z" fill="rgba(6,20,33,.7)" stroke="#a855f7" strokeWidth="2" />
        <path d="M42 92 H126" stroke="#05ff5e" strokeWidth="2" />
        <path d="M126 92 V45" stroke="#29b6f6" strokeWidth="2" />
      </svg>
      <div className="absolute left-[44%] top-[18%] text-purple-400">S<br />6.41 MVA</div>
      <div className="absolute left-[28%] top-[48%] text-slate-200">PF<br /><b className="text-[#05ff5e]">0.91</b></div>
      <div className="absolute bottom-3 left-[39%] text-[#05ff5e]">P<br />5.82 MW</div>
      <div className="absolute bottom-7 right-[9%] text-cyan-300">Q<br />2.68 MVAR</div>
    </div>
  );
}

const powerFeederRows = [
  ["Feeder 4", "1.42 MW", "0.91 MVAR", "1.68 MVA", "0.84", "Fair"],
  ["Feeder 1", "1.24 MW", "0.48 MVAR", "1.32 MVA", "0.94", "Good"],
  ["Feeder 3", "1.08 MW", "0.66 MVAR", "1.27 MVA", "0.85", "Fair"],
  ["Feeder 2", "0.99 MW", "0.51 MVAR", "1.11 MVA", "0.89", "Fair"],
  ["Feeder 5", "1.10 MW", "0.42 MVAR", "1.18 MVA", "0.93", "Good"],
  ["Total", "5.82 MW", "2.98 MVAR", "6.41 MVA", "0.91", "Good"],
];

const lowPfRows = [
  ["May 15, 2:14 PM", "0.78", "26 min", "Feeder 4", "High"],
  ["May 14, 9:37 AM", "0.80", "18 min", "Feeder 1", "Medium"],
  ["May 13, 11:52 AM", "0.81", "21 min", "Feeder 2", "Medium"],
  ["May 12, 3:28 PM", "0.82", "15 min", "Feeder 1", "Low"],
];

const lowPfEventRows = [
  ["1", "May 15, 2:14 PM", "May 15, 2:40 PM", "26 min", "0.78", "0.83", "Feeder 4", "HVAC Starting Load", "High", "High", "Resolved", "View Details"],
  ["2", "May 14, 9:37 AM", "May 14, 9:55 AM", "18 min", "0.62", "0.71", "Feeder 1", "Motor Starting", "Critical", "High", "Resolved", "View Details"],
  ["3", "May 13, 11:52 AM", "May 13, 12:13 PM", "21 min", "0.81", "0.86", "Feeder 2", "Compressor Start", "Medium", "Medium", "Resolved", "View Details"],
  ["4", "May 12, 3:28 PM", "May 12, 3:43 PM", "15 min", "0.82", "0.87", "Feeder 1", "Lighting Load", "Medium", "Low", "Resolved", "View Details"],
  ["5", "May 16, 6:31 PM", "May 16, 6:58 PM", "27 min", "0.74", "0.82", "Feeder 3", "Chiller Start", "High", "High", "Resolved", "View Details"],
  ["6", "May 17, 8:19 AM", "May 17, 8:36 AM", "17 min", "0.77", "0.84", "Feeder 2", "HVAC Starting Load", "High", "Medium", "Resolved", "View Details"],
  ["7", "May 15, 6:02 AM", "May 15, 6:14 AM", "12 min", "0.83", "0.88", "Feeder 5", "Pump Start", "Medium", "Low", "Resolved", "View Details"],
  ["8", "May 13, 4:48 PM", "May 13, 5:07 PM", "19 min", "0.79", "0.85", "Feeder 4", "Welding Load", "High", "Medium", "Resolved", "View Details"],
  ["9", "May 14, 7:12 PM", "May 14, 7:31 PM", "19 min", "0.69", "0.76", "Feeder 3", "Conveyor System", "Critical", "High", "Resolved", "View Details"],
  ["10", "May 12, 10:41 AM", "May 12, 10:55 AM", "14 min", "0.84", "0.88", "Feeder 1", "Misc Load", "Medium", "Low", "Resolved", "View Details"],
];

const reactiveRows = [
  ["Feeder 4", "0.92", "0.18", "0.74", "0.88", "Fair"],
  ["Feeder 1", "0.68", "0.12", "0.56", "0.92", "Good"],
  ["Feeder 3", "0.42", "0.10", "0.32", "0.93", "Good"],
  ["Feeder 2", "0.38", "0.06", "0.32", "0.90", "Fair"],
  ["Feeder 5", "0.36", "0.08", "0.28", "0.94", "Good"],
  ["Total", "2.76", "0.54", "2.68", "0.91", "—"],
];

const recommendationRows = [
  ["High", "Install XECO Active Power Filter", "Main Switchboard", "THD 4.1% exceeds target", "PF +0.99 / THD ↓", "$112,430", "1.6 yrs", "95%", "View Details"],
  ["High", "Balance Phase Loads", "Panel LP-3", "Phase imbalance 5.2%", "Reduce unbalance", "$34,250", "0.8 yrs", "85%", "View Details"],
  ["Medium", "Install Capacitor Bank", "Panel LP-5", "PF 0.95 at panel", "PF +0.99", "$21,780", "1.3 yrs", "80%", "View Details"],
  ["Medium", "Replace Aging Transformers", "Transformer T-2", "Efficiency 97.2%", "Increase efficiency", "$18,960", "2.6 yrs", "75%", "View Details"],
  ["Low", "Install Harmonic Filter", "Panel MCC-2", "5th harmonic 2.8%", "Reduce harmonics", "$8,360", "2.1 yrs", "70%", "View Details"],
];

const peakRows = [
  ["1", "May 16, 2025 2:18 PM", "6.31", "37 min"],
  ["2", "May 15, 2025 1:47 PM", "6.12", "29 min"],
  ["3", "May 14, 2025 2:03 PM", "5.98", "31 min"],
  ["4", "May 13, 2025 2:27 PM", "5.81", "26 min"],
  ["5", "May 17, 2025 1:55 PM", "5.77", "34 min"],
];

const lossRows = [
  ["Conductors (IR)", "72", "40.4%", "1.38", "↓ 3.6%", "High"],
  ["Transformers", "46", "25.8%", "0.88", "↓ 2.1%", "High"],
  ["Harmonics", "32", "18.0%", "0.61", "↓ 4.8%", "Medium"],
  ["Eddy Currents", "16", "9.0%", "0.31", "↓ 1.7%", "Medium"],
  ["Connections", "7", "3.9%", "0.13", "↓ 5.2%", "Low"],
  ["Other", "5", "2.9%", "0.09", "↓ 0.8%", "Low"],
];

function LossesComponentTable() {
  return (
    <div className="flex h-full flex-col">
      <NetworkTable headers={["Component Type", "Losses", "%", "MWh", "Trend", "Status"]} rows={[...lossRows, ["Total", "178", "100%", "3.42", "↓ 2.78%", "—"]]} />
      <div className="mt-auto text-right text-[8px] text-[#05ff5e]">View Component Losses Details →</div>
    </div>
  );
}

const actionRows = [
  ["1", "Upgrade Capacitor Bank on Feeder 4", "Reactive Power", "Feeder 4", "18 kW", "$6,800", "$18,900", "1.8 mo", "Recommended"],
  ["2", "Balance Transformer Loading", "Transformer", "Main Transformer", "12 kW", "$4,500", "$12,600", "2.4 mo", "Recommended"],
  ["3", "Install Harmonic Filter on Feeder 1", "Harmonics", "Feeder 1", "10 kW", "$5,200", "$10,400", "3.2 mo", "Recommended"],
  ["4", "Tighten Electrical Connections", "IR Conductor", "Feeder 2", "8 kW", "$1,200", "$8,200", "2.1 mo", "Recommended"],
  ["5", "Replace Aging Cables on Feeder 3", "IR Conductor", "Feeder 3", "7 kW", "$3,100", "$7,300", "4.6 mo", "Optional"],
  ["6", "Optimize Motor with VFD", "Motor Efficiency", "Chiller Plant", "5 kW", "$3,000", "$4,600", "6.2 mo", "Optional"],
];

function InfoMini({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[8px] text-slate-500">{label}</div><div className="mt-1 text-[9px] text-slate-200">{value}</div></div>;
}

function FilterBar({ labels }: { labels: string[] }) {
  return <div className="mt-2 flex h-[28px] items-center gap-2 text-[9px]">{labels.map((label) => <button className={label === "Clear Filters" ? "rounded border border-cyan-300/12 bg-transparent px-3 py-1.5 text-slate-400" : "rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5 text-slate-300"} key={label}>{label}</button>)}</div>;
}

function Roadmap() {
  return <div className="space-y-2 text-[9px]"><div className="grid grid-cols-5 gap-2 text-center">{["Quick Wins", "Short Term", "Mid Term", "Long Term", "Total Potential"].map((label, index) => <div key={label}><div className="mx-auto grid size-6 place-items-center rounded-full border border-[#05ff5e] text-[#05ff5e]">{index + 1}</div><div className="mt-1 text-slate-300">{label}</div><b className="text-[#05ff5e]">{[26, 18, 11, 5, 60][index]} kW</b><br /><span className="text-yellow-300">{["$21,100", "$18,700", "$11,500", "$5,700", "$62,000"][index]} / yr</span></div>)}</div></div>;
}

const alertRows = [
  ["Critical", "High Load on Feeder 4", "Electrical Room", "Feeder 4", "May 18, 2025 10:12 AM", "92%", "> 90%", "Active"],
  ["High", "Harmonic Distortion on Feeder 2", "Electrical Room", "Feeder 2", "May 18, 2025 09:48 AM", "THD: 2.5%", "> 2.0%", "Active"],
  ["High", "Unbalanced Load", "Building 3 Panel", "Panel B3-P1", "May 18, 2025 09:32 AM", "18%", "> 15%", "Active"],
  ["Medium", "Capacitor Bank Switched Off", "Electrical Room", "Cap Bank 2", "May 18, 2025 08:33 AM", "Off", "Should be On", "Active"],
  ["Medium", "Low Power Factor", "Feeder 2", "Feeder 2", "May 18, 2025 07:59 AM", "0.87", "< 0.90", "Active"],
  ["Low", "Gateway Communication", "IT Room", "Gateway-01", "May 18, 2025 06:22 AM", "Latency 120 ms", "> 200 ms", "Monitoring"],
];

function NetworkKpi({ detail, label, tone, value }: { detail: string; label: string; tone: "blue" | "green" | "purple" | "red" | "yellow"; value: string }) {
  const color = tone === "red" ? "text-red-400" : tone === "yellow" ? "text-yellow-300" : tone === "purple" ? "text-purple-400" : tone === "blue" ? "text-cyan-300" : "text-[#05ff5e]";
  return <article className="grid grid-cols-[34px_1fr] items-center gap-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2"><KpiIcon colorClass={color} label={label} /><div className="min-w-0"><div className="whitespace-nowrap text-[6px] uppercase leading-[0.95] text-slate-400">{label}</div><div className={`mt-0.5 whitespace-nowrap text-[15px] leading-none ${color}`}>{value}</div><div className="truncate text-[6.5px] leading-none text-slate-400">{detail}</div></div></article>;
}

function KpiIcon({ colorClass, label }: { colorClass: string; label: string }) {
  const icon = label.includes("Energy") ? "⌁" : label.includes("Cost") || label.includes("Savings") ? "$" : label.includes("Percentage") || label.includes("Capacity") ? "%" : label.includes("CO2") ? "♧" : label.includes("Peak") || label.includes("Factor") || label.includes("Demand") ? "⌁" : label.includes("Load") ? "∿" : label.includes("Time") || label.includes("Payback") || label.includes("Duration") ? "◷" : label.includes("Implementation") ? "⚒" : label.includes("Optimization") ? "◎" : "⚡";
  return <div className={`grid size-8 place-items-center rounded-full border bg-[#061421] text-base ${colorClass}`}>{icon}</div>;
}

function MiniOneLine({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative h-full min-h-[190px] text-[8px]">
      <div className="absolute left-[46%] top-1 text-center text-slate-300">UTILITY<br /><span className="text-slate-500">115 kV</span></div>
      <div className={`absolute left-[47%] ${compact ? "top-9 h-10" : "top-12 h-14"} w-0.5 bg-[#ffd740]`} />
      <div className={`absolute left-[40%] ${compact ? "top-[54px]" : "top-[78px]"} rounded border border-cyan-300/20 bg-[#061421] px-3 py-1.5 text-center`}>MAIN TRANSFORMER<br /><b className="text-[#05ff5e]">1.5 MVA</b></div>
      <div className={`absolute left-[40%] ${compact ? "top-[104px]" : "top-[142px]"} rounded border border-cyan-300/20 bg-[#061421] px-3 py-1.5 text-center`}>MAIN SWITCHGEAR<br /><b className="text-[#05ff5e]">480 V</b></div>
      <div className={`absolute left-[9%] right-[9%] ${compact ? "top-[158px]" : "top-[206px]"} h-0.5 bg-[#ffd740]`} />
      {["FEEDER 1", "FEEDER 2", "FEEDER 3", "FEEDER 4", "FEEDER 5"].map((name, index) => <div className={`absolute ${compact ? "top-[169px] w-[50px] p-1" : "top-[228px] w-[86px] p-2"} rounded border border-cyan-300/12 bg-[#061421] text-center`} key={name} style={{ left: `${6 + index * 19}%` }}><b className={index === 3 ? "text-red-400" : index === 1 ? "text-yellow-300" : "text-[#05ff5e]"}>{compact ? name.replace("FEEDER ", "F") : name}</b><br />{compact ? [34, 22, 12, 48, 8][index] : [1.24, 0.986, 1.08, 1.42, 1.10][index]} {compact ? "kW" : "MW"}{compact ? null : <><br />Health <b>{[96, 87, 93, 64, 94][index]}</b></>}</div>)}
    </div>
  );
}

function NetworkTrend({ colors }: { colors: string[] }) {
  const labels = ["May 12", "May 14", "May 16", "May 18"];
  return (
    <div className="h-full min-h-[76px]">
      <svg className="h-[calc(100%-12px)] min-h-[62px] w-full" viewBox="0 0 360 108" aria-hidden="true">
        <g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[20, 46, 72, 96].map((y) => <line key={y} x1="0" x2="360" y1={y} y2={y} />)}</g>
        {colors.map((color, index) => {
          const points = `0,${64 - index * 8} 40,${58 - index * 6} 80,${62 - index * 5} 120,${48 - index * 3} 160,${52 - index * 4} 200,${40 - index * 2} 240,${34 + index * 4} 280,${46 + index * 2} 320,${42 + index * 3} 360,${38 + index * 2}`;
          return (
            <g key={color}>
              <polyline fill="none" points={points} stroke={color} strokeWidth="2" />
              {parseNetworkPoints(points).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r="3" stroke={color} strokeWidth="2" />)}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[7px] text-slate-500">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

function parseNetworkPoints(points: string) {
  return points.split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return [x, y] as const;
  }).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

function Bars({ rows }: { rows: [string, string, string][] }) {
  return <div className="space-y-2 text-[9px]">{rows.map(([label, value, tone]) => <div className="grid grid-cols-[74px_1fr_36px] items-center gap-2" key={label}><span>{label}</span><span className="h-2 rounded bg-slate-800"><span className={tone === "red" ? "block h-2 rounded bg-red-500" : tone === "yellow" ? "block h-2 rounded bg-yellow-400" : "block h-2 rounded bg-[#05ff5e]"} style={{ width: value }} /></span><b>{value}</b></div>)}</div>;
}

function CompactBars({ rows }: { rows: [string, string, string][] }) {
  return <div className="space-y-1 text-[8px]">{rows.map(([label, value, tone]) => <div className="grid grid-cols-[68px_1fr_30px] items-center gap-2" key={label}><span>{label}</span><span className="h-2 rounded bg-slate-800"><span className={tone === "red" ? "block h-2 rounded bg-red-500" : tone === "yellow" ? "block h-2 rounded bg-yellow-400" : "block h-2 rounded bg-[#05ff5e]"} style={{ width: value }} /></span><b>{value}</b></div>)}</div>;
}

function NetworkTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[8px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={cell === "Critical" || cell === "High" || cell === "Active" ? "py-1.5 text-red-400" : cell === "Warning" || cell === "Medium" || cell === "Moderate" ? "py-1.5 text-yellow-300" : cell === "Low" || cell === "Info" ? "py-1.5 text-cyan-300" : cell.includes("%") && Number.parseInt(cell) > 90 ? "py-1.5 text-[#05ff5e]" : "py-1.5 text-slate-300"} key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function CompactNetworkTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[7px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={cell === "Critical" || cell === "High" || cell === "Active" ? "py-1 text-red-400" : cell === "Warning" || cell === "Medium" || cell === "Moderate" ? "py-1 text-yellow-300" : cell === "Low" || cell === "Info" ? "py-1 text-cyan-300" : cell.includes("%") && Number.parseInt(cell) > 90 ? "py-1 text-[#05ff5e]" : "py-1 text-slate-300"} key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function MetricListSmall({ compact = false, rows }: { compact?: boolean; rows: [string, string][] }) {
  return <div className={`${compact ? "space-y-1 text-[8px]" : "space-y-2 text-[9px]"}`}>{rows.map(([label, value]) => <div className={`flex justify-between gap-3 border-b border-white/5 ${compact ? "pb-0.5" : "pb-1"}`} key={label}><span className="text-slate-300">{label}</span><b className="text-right text-[#05ff5e]">{value}</b></div>)}</div>;
}

function NetworkDonut({ compact = false, rows, total }: { compact?: boolean; rows: [string, string][]; total: string }) {
  if (compact) {
    return (
      <div className="grid h-full grid-cols-[54px_1fr] items-center gap-2">
        <div className="grid size-12 place-items-center rounded-full" style={{ background: "conic-gradient(#ef4444 0 33%, #ff8a00 33% 66%, #ffd740 66% 83%, #29b6f6 83% 100%)" }}>
          <div className="grid size-8 place-items-center rounded-full bg-[#061521] text-center text-[11px] leading-none">{total}<br /><span className="text-[6px] text-slate-400">Total</span></div>
        </div>
        <div className="space-y-0.5 text-[8px]">
          {rows.map(([label, value]) => <div className="flex justify-between gap-2 border-b border-white/5 pb-0.5" key={label}><span className="truncate text-slate-300">{label}</span><b className="text-right text-[#05ff5e]">{value}</b></div>)}
        </div>
      </div>
    );
  }
  return <div className="grid h-full grid-cols-[92px_1fr] items-center gap-3"><div className="grid size-20 place-items-center rounded-full" style={{ background: "conic-gradient(#ef4444 0 33%, #ff8a00 33% 66%, #ffd740 66% 83%, #29b6f6 83% 100%)" }}><div className="grid size-12 place-items-center rounded-full bg-[#061521] text-center text-lg">{total}<br /><span className="text-[8px] text-slate-400">Total</span></div></div><MetricListSmall rows={rows} /></div>;
}

function Gauge({ label, value }: { label: string; value: string }) {
  return <div className="grid place-items-center"><div className="grid size-28 place-items-center rounded-full" style={{ background: "conic-gradient(#05ff5e 0 95%, #0f2533 95% 100%)" }}><div className="grid size-20 place-items-center rounded-full bg-[#061521] text-center text-3xl">{value}<br /><span className="text-[10px] text-slate-300">{label}</span></div></div><div className="mt-2 text-[10px] text-[#05ff5e]">↑ 3 pts vs Last 7 Days</div></div>;
}

function ImpactMatrix() {
  const cells = [["0", "1", "2"], ["1", "1", "1"], ["1", "0", "0"]];
  return <div className="grid grid-cols-3 gap-1 text-center text-[12px]">{cells.flat().map((cell, index) => <div className={index === 2 ? "rounded bg-red-600 py-4" : index === 1 || index === 4 || index === 5 ? "rounded bg-yellow-500 py-4 text-black" : "rounded bg-[#087a35] py-4"} key={`${cell}-${index}`}>{cell}</div>)}</div>;
}

function HeatMap() {
  return <div className="grid grid-cols-12 gap-1">{Array.from({ length: 72 }, (_, index) => <div className="h-3 rounded-sm" key={index} style={{ backgroundColor: index % 12 > 7 ? "#ef4444" : index % 12 > 4 ? "#ffd740" : index % 5 === 0 ? "#16a34a" : "#087a35" }} />)}</div>;
}

function DigitalTwinSvg({
  currentLoadKva,
  positioned,
  relationships,
  transformerKva,
}: {
  currentLoadKva: number;
  positioned: PositionedAsset[];
  relationships: DigitalTwinRelationship[];
  transformerKva: number;
}) {
  const byId = new Map(positioned.map((asset) => [asset.id, asset]));
  const feeds = relationships.filter((relationship) => relationship.type === "feeds");
  const busY = 210;
  const feeders = positioned.filter((asset) => asset.type === "circuit");
  const panels = positioned.filter((asset) => asset.type === "panel");

  return (
    <svg className="h-full w-full" viewBox="0 0 780 470" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <pattern id="dtGrid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(41,182,246,0.08)" strokeWidth="0.7" />
        </pattern>
        <filter id="dtGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="780" height="470" fill="url(#dtGrid)" />

      {feeds.map((relationship) => {
        const parent = byId.get(relationship.parentId);
        const child = byId.get(relationship.childId);
        if (!parent || !child || child.type === "ecbs") {
          return null;
        }

        return (
          <path
            d={`M ${parent.x} ${parent.y + 25} V ${(parent.y + child.y) / 2} H ${child.x} V ${child.y - 28}`}
            fill="none"
            key={relationship.id}
            stroke={child.type === "ats" || parent.type === "generator" ? "#ffd740" : "#05ff5e"}
            strokeDasharray={child.type === "ats" || parent.type === "generator" ? "5 4" : undefined}
            strokeWidth="2"
          />
        );
      })}

      <rect filter="url(#dtGlow)" height="6" rx="3" width="600" x="90" y={busY} fill="#05ff5e" opacity="0.9" />
      <text fill="#05ff5e" fontSize="9" fontWeight="700" letterSpacing="0.08em" textAnchor="middle" x="390" y={busY - 12}>
        MAIN SWITCHGEAR / 480V BUS
      </text>

      {positioned.map((asset) => (
        <AssetNode asset={asset} currentLoadKva={currentLoadKva} key={asset.id} transformerKva={transformerKva} />
      ))}

      {feeders.map((feeder) => (
        <line key={`feeder-drop-${feeder.id}`} stroke="#05ff5e" strokeWidth="2" x1={feeder.x} x2={feeder.x} y1={busY + 6} y2={feeder.y - 26} />
      ))}
      {panels.map((panel) => (
        <line key={`panel-drop-${panel.id}`} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" x1={panel.x} x2={panel.x} y1="318" y2={panel.y - 22} />
      ))}
    </svg>
  );
}

function AssetNode({
  asset,
  currentLoadKva,
  transformerKva,
}: {
  asset: PositionedAsset;
  currentLoadKva: number;
  transformerKva: number;
}) {
  const tone = assetTone(asset);
  const load = asset.type === "transformer" || asset.type === "switchgear" ? currentLoadKva : branchLoad(asset);
  const utilization = asset.type === "transformer" && transformerKva > 0 ? (currentLoadKva / transformerKva) * 100 : branchUtilization(asset);
  const status = utilization >= 80 ? "Warning" : "Healthy";
  const statusColor = utilization >= 80 ? healthColor.warning : healthColor.healthy;

  if (asset.type === "utility_service") {
    return (
      <g transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="42" rx="5" stroke="#1e3a5f" width="76" x="-38" y="-21" />
        <text fill="#cbd5e1" fontSize="8" fontWeight="700" textAnchor="middle" y="-3">UTILITY</text>
        <text fill="#cbd5e1" fontSize="8" textAnchor="middle" y="10">480 V</text>
        <text fill="#94a3b8" fontSize="22" textAnchor="middle" x="44" y="7">⌁</text>
      </g>
    );
  }

  if (asset.type === "transformer") {
    return (
      <g filter="url(#dtGlow)" transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="62" rx="6" stroke={tone} width="150" x="-75" y="-31" />
        <TransformerIcon x="-60" y="-10" />
        <text fill="#e2e8f0" fontSize="8" fontWeight="700" x="-26" y="-12">{asset.name.toUpperCase()}</text>
        <text fill="#e2e8f0" fontSize="14" fontWeight="700" x="-26" y="4">{formatNumber(transformerKva)} kVA</text>
        <text fill="#94a3b8" fontSize="8" x="-26" y="18">Load</text>
        <text fill="#e2e8f0" fontSize="8" x="20" y="18">{formatNumber(load)} kVA ({formatNumber(utilization)}%)</text>
        <circle cx="66" cy="-20" fill={statusColor} r="5" />
      </g>
    );
  }

  if (asset.type === "switchgear") {
    return (
      <g transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="48" rx="6" stroke="#1e3a5f" width="140" x="-70" y="-24" />
        <SwitchgearIcon x="-58" y="-12" />
        <text fill="#e2e8f0" fontSize="8" fontWeight="700" x="-24" y="-4">{asset.name.toUpperCase()}</text>
        <text fill="#94a3b8" fontSize="8" x="-24" y="11">Health</text>
        <circle cx="30" cy="8" fill={statusColor} r="4" />
        <text fill={statusColor} fontSize="8" x="39" y="11">{status}</text>
      </g>
    );
  }

  if (asset.type === "generator" || asset.type === "ats") {
    return (
      <g transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="38" rx="5" stroke="#ffd740" strokeDasharray="4 3" width="86" x="-43" y="-19" />
        <text fill="#ffd740" fontSize="8" fontWeight="700" textAnchor="middle" y="-3">{asset.type === "ats" ? "ATS" : "GENERATOR"}</text>
        <text fill="#94a3b8" fontSize="8" textAnchor="middle" y="10">{asset.kvaRating ? `${formatNumber(asset.kvaRating)} kVA` : `${formatNumber(asset.ampRating)} A`}</text>
      </g>
    );
  }

  const isPanel = asset.type === "panel";
  return (
    <g transform={`translate(${asset.x} ${asset.y})`}>
      <rect fill="#061521" height={isPanel ? 42 : 48} rx="5" stroke={utilization >= 80 ? "#ffd740" : "#1e3a5f"} width={isPanel ? 74 : 88} x={isPanel ? -37 : -44} y={isPanel ? -21 : -24} />
      <text fill="#e2e8f0" fontSize="7.5" fontWeight="700" textAnchor="middle" y="-6">{short(asset.name, isPanel ? 12 : 14)}</text>
      <text fill="#94a3b8" fontSize="7" textAnchor="middle" y="6">{asset.ampRating ? `${formatNumber(asset.ampRating)} A` : "Load"}</text>
      <circle cx={isPanel ? -30 : -36} cy={isPanel ? 15 : 18} fill={statusColor} r="3.5" />
      <text fill={statusColor} fontSize="7" x={isPanel ? -20 : -26} y={isPanel ? 18 : 21}>{status}</text>
      {asset.badges.map((badge, index) => (
        <g key={badge.id} transform={`translate(${-30 + index * 30} 30)`}>
          <rect fill="rgba(5,255,94,0.12)" height="12" rx="3" stroke="#05ff5e" width="26" />
          <text fill="#05ff5e" fontSize="6" fontWeight="700" textAnchor="middle" x="13" y="9">APF</text>
        </g>
      ))}
    </g>
  );
}

function SelectedAssetCard({
  asset,
  loadKva,
  recoveredCapacityKva,
  utilization,
}: {
  asset: DigitalTwinAsset;
  loadKva: number;
  recoveredCapacityKva: number;
  utilization: number;
}) {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-start gap-2">
        <div className="grid size-9 place-items-center rounded border border-slate-600 bg-[#061421] text-slate-300">
          <TransformerMiniIcon />
        </div>
        <div>
          <div className="text-[12px] font-semibold text-slate-100">{asset.name}</div>
          <div className="text-[10px] text-slate-400">{formatNumber(asset.kvaRating)} kVA</div>
        </div>
        <span className="ml-auto size-3 rounded-full bg-[#05ff5e]" />
      </div>
      <div className="grid grid-cols-4 border-b border-[#05ff5e]/60 text-center text-[8px] text-slate-400">
        <span className="pb-1 text-[#05ff5e]">Overview</span>
        <span>Measurements</span>
        <span>Health</span>
        <span>Events</span>
      </div>
      <MetricLine label="Load" value={`${formatNumber(loadKva)} kVA (${formatNumber(utilization)}%)`} />
      <MeterBar value={utilization} />
      <MetricLine label="Available Capacity" value={`${formatNumber(Math.max(0, asset.kvaRating - loadKva))} kVA`} valueClass="text-[#29b6f6]" />
      <MetricLine label="Recovered Capacity" value={`${formatNumber(recoveredCapacityKva)} kVA`} valueClass="text-[#05ff5e]" />
      <MetricLine label="Utilization" value={`${formatNumber(utilization)}%`} />
      <MetricLine label="Health Status" value={utilization >= 80 ? "Warning" : "Healthy"} valueClass={utilization >= 80 ? "text-yellow-300" : "text-[#05ff5e]"} />
    </div>
  );
}

function CapacityByLevel({
  levels,
  totalRecovered,
}: {
  levels: { color: string; label: string; total: number; value: number }[];
  totalRecovered: number;
}) {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="grid grid-cols-[70px_1fr] gap-2">
        <svg className="h-[72px] w-[72px]" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" fill="none" r="25" stroke="#0f2533" strokeWidth="18" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#05ff5e" strokeDasharray="54 157" strokeWidth="18" transform="rotate(-90 40 40)" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#29b6f6" strokeDasharray="38 157" strokeDashoffset="-58" strokeWidth="18" transform="rotate(-90 40 40)" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#ffd740" strokeDasharray="31 157" strokeDashoffset="-100" strokeWidth="18" transform="rotate(-90 40 40)" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#ff8a00" strokeDasharray="22 157" strokeDashoffset="-134" strokeWidth="18" transform="rotate(-90 40 40)" />
        </svg>
        <div className="space-y-1">
          {levels.map((level) => {
            const pct = level.total > 0 ? (level.value / level.total) * 100 : 0;
            return (
              <div className="flex items-center justify-between gap-2" key={level.label}>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <span className="size-2 rounded-full" style={{ backgroundColor: level.color }} />
                  {level.label}
                </span>
                <span className="text-slate-200">{formatNumber(level.value)} kVA ({formatNumber(pct)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-white/10 pt-2 text-right text-[16px] font-semibold text-[#05ff5e]">
        {formatNumber(totalRecovered)} kVA
      </div>
    </div>
  );
}

function MetricLine({ label, value, valueClass = "text-slate-100" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-white/5 pb-1">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function MeterBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-[#05ff5e]" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="mr-4 inline-flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function positionAssets(assets: DigitalTwinAsset[], relationships: DigitalTwinRelationship[]): PositionedAsset[] {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const childrenByParent = new Map<number, number[]>();
  const containsByParent = new Map<number, DigitalTwinAsset[]>();

  relationships.forEach((relationship) => {
    if (relationship.type === "contains") {
      const child = byId.get(relationship.childId);
      if (child) {
        containsByParent.set(relationship.parentId, [...(containsByParent.get(relationship.parentId) ?? []), child]);
      }
      return;
    }

    childrenByParent.set(relationship.parentId, [...(childrenByParent.get(relationship.parentId) ?? []), relationship.childId]);
  });

  const positioned: PositionedAsset[] = [];
  const push = (asset: DigitalTwinAsset | undefined, x: number, y: number) => {
    if (!asset || positioned.some((row) => row.id === asset.id)) {
      return;
    }

    positioned.push({ ...asset, badges: containsByParent.get(asset.id) ?? [], x, y });
  };

  const utility = assets.find((asset) => asset.type === "utility_service");
  const transformer = assets.find((asset) => asset.type === "transformer");
  const switchgear = assets.find((asset) => asset.type === "switchgear");
  const generator = assets.find((asset) => asset.type === "generator");
  const ats = assets.find((asset) => asset.type === "ats");
  const switchgearChildren = (switchgear ? childrenByParent.get(switchgear.id) ?? [] : [])
    .map((id) => byId.get(id))
    .filter((asset): asset is DigitalTwinAsset => Boolean(asset));
  const circuits = switchgearChildren.filter((asset) => asset.type === "circuit");
  const panels = switchgearChildren.filter((asset) => asset.type === "panel");

  push(utility, 390, 52);
  push(transformer, 390, 126);
  push(switchgear, 390, 184);
  push(generator, 690, 92);
  push(ats, 690, 150);

  distribute(circuits, 84, 650).forEach(([asset, x]) => push(asset, x, 266));
  distribute(panels, 72, 650).forEach(([asset, x]) => push(asset, x, 362));

  return positioned;
}

function distribute(assets: DigitalTwinAsset[], start: number, end: number): Array<[DigitalTwinAsset, number]> {
  if (assets.length === 0) {
    return [];
  }

  if (assets.length === 1) {
    return [[assets[0], (start + end) / 2]];
  }

  return assets.map((asset, index) => [asset, start + ((end - start) / (assets.length - 1)) * index]);
}

function assetTone(asset: DigitalTwinAsset) {
  if (asset.type === "generator" || asset.type === "ats") {
    return "#ffd740";
  }
  if (asset.type === "panel") {
    return "#ab47bc";
  }
  if (asset.type === "ecbs") {
    return "#05ff5e";
  }
  return "#29b6f6";
}

function branchLoad(asset: DigitalTwinAsset) {
  if (asset.ampRating > 0) {
    return Math.round((Math.sqrt(3) * 480 * asset.ampRating) / 1000);
  }

  return asset.kvaRating;
}

function branchUtilization(asset: DigitalTwinAsset) {
  const rating = asset.kvaRating || branchLoad(asset) || 1;
  return Math.min(100, (branchLoad(asset) / rating) * 100);
}

function sumAmpCapacity(assets: DigitalTwinAsset[]) {
  return assets.reduce((sum, asset) => sum + branchLoad(asset), 0);
}

function short(value: string, max: number) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}...`;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

void [DigitalTwinSvg, SelectedAssetCard, CapacityByLevel, positionAssets, sumAmpCapacity, titleCase];

function TransformerIcon({ x, y }: { x: string; y: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#263747" height="28" rx="2" stroke="#94a3b8" width="24" />
      <circle cx="12" cy="9" fill="none" r="5" stroke="#cbd5e1" />
      <circle cx="12" cy="19" fill="none" r="5" stroke="#cbd5e1" />
    </g>
  );
}

function SwitchgearIcon({ x, y }: { x: string; y: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#263747" height="24" rx="2" stroke="#94a3b8" width="22" />
      <path d="M6 5h10M6 12h10M6 19h10M11 4v16" stroke="#cbd5e1" strokeWidth="1" />
    </g>
  );
}

function TransformerMiniIcon() {
  return (
    <svg className="size-6" viewBox="0 0 28 28" aria-hidden="true">
      <rect fill="none" height="22" rx="2" stroke="currentColor" width="18" x="5" y="3" />
      <circle cx="14" cy="10" fill="none" r="4" stroke="currentColor" />
      <circle cx="14" cy="18" fill="none" r="4" stroke="currentColor" />
    </svg>
  );
}
