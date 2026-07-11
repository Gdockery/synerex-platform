import { DashboardPanel, type DashboardKpi } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";
import type { CurrentAnalysisData, LiveDataScreenData } from "@/lib/analysisData";

export type AnalysisDataVariant = "current" | "live";

const emptyCurrentKpis: DashboardKpi[] = [
  { icon: "A", label: "Total Current", value: "1,125 A", detail: "Avg | +8.7% vs prior 7 days", tone: "green" },
  { icon: "P", label: "Productive Current (kW)", value: "812 A", detail: "72% of total", tone: "green" },
  { icon: "R", label: "Reactive Current (kVAR)", value: "198 A", detail: "18% of total", tone: "yellow" },
  { icon: "H", label: "Harmonic Current (THD)", value: "79 A", detail: "7% of total", tone: "yellow" },
  { icon: "I", label: "Imbalance Current", value: "36 A", detail: "3% of total", tone: "yellow" },
  { icon: "N", label: "Neutral Current", value: "52 A", detail: "4.6% of phase avg.", tone: "blue" },
];

const emptyLiveKpis: DashboardKpi[] = [
  { icon: "S", label: "System Status", value: "Online", detail: "All systems normal", tone: "green" },
  { icon: "kW", label: "Total kW", value: "1,063 kW", detail: "+12.4% vs yesterday", tone: "blue" },
  { icon: "kVA", label: "Total kVA", value: "1,250 kVA", detail: "+14.8% vs yesterday", tone: "cyan" },
  { icon: "PF", label: "Power Factor", value: "0.98", detail: "+0.1% vs yesterday", tone: "yellow" },
  { icon: "THD", label: "THD (V)", value: "4.1%", detail: "+74.7% vs baseline", tone: "yellow" },
  { icon: "Hz", label: "Frequency", value: "59.98 Hz", detail: "Nominal 60 Hz", tone: "blue" },
  { icon: "L", label: "System Load", value: "85%", detail: "Of capacity", tone: "green" },
];

export function AnalysisDataScreen({ currentData, liveData, variant }: { currentData?: CurrentAnalysisData; liveData?: LiveDataScreenData; variant: AnalysisDataVariant }) {
  const isLive = variant === "live";
  const currentKpis: DashboardKpi[] = currentData?.kpis.map(toDashboardKpi) ?? emptyCurrentKpis.map((kpi) => ({ ...kpi, detail: "No Data", value: "No Data" }));
  const liveKpis: DashboardKpi[] = liveData?.kpis.map(toDashboardKpi) ?? emptyLiveKpis.map((kpi) => ({ ...kpi, detail: "No Data", value: "No Data" }));
  const kpis = isLive ? liveKpis : currentKpis;
  const updatedAt = isLive ? liveData?.updatedAt ?? "No Data" : currentData?.updatedAt ?? "No Data";

  return (
    <EcbsAppShell activeHref={isLive ? "/data-analytics/live-data/live-data" : "/enterprise/current-analysis"}>
      <div className={isLive ? "flex h-full min-h-[682px] flex-col overflow-hidden px-3 py-2" : "flex h-full min-h-[682px] flex-col overflow-hidden bg-white px-3 py-2 text-slate-900"}>
        <Header
          breadcrumbs={isLive ? ["Clients", liveData?.clientName ?? "No Data", "Projects", liveData?.projectName ?? "No Data", "Live Data"] : ["Current Analysis"]}
          isLive={isLive}
          siteName={isLive ? liveData?.siteName ?? "No Data" : currentData?.siteName ?? "No Data"}
          subtitle={isLive ? "Real-time monitoring of your electrical system performance." : "Comprehensive analysis of current components and their impact on your electrical system."}
          title={isLive ? "Live Data" : "Current Analysis"}
          updatedAt={updatedAt}
        />

        <section className={isLive ? "mt-2 grid h-[88px] grid-cols-7 gap-2" : "mt-2 grid h-[104px] grid-cols-6 gap-2"}>
          {kpis.map((kpi) => isLive ? <LiveKpiCard key={kpi.label} kpi={kpi} /> : <CurrentKpiCard key={kpi.label} kpi={kpi} />)}
        </section>

        {isLive ? <LiveDataBody data={liveData} /> : <CurrentAnalysisBody data={currentData} />}

        <footer className={isLive ? "mt-auto flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500" : "mt-auto flex h-[26px] items-center justify-between border-t border-slate-200 text-[9px] text-slate-500"}>
          <span>Privacy Policy | Terms of Service | Support</span>
          <span>Data updated: {updatedAt} <span className="ml-4 text-[#05ff5e]">{isLive ? "Live" : "Online"}</span></span>
        </footer>
      </div>
    </EcbsAppShell>
  );
}

function toDashboardKpi(kpi: { detail: string; icon?: string; label: string; tone?: string; value: string }): DashboardKpi {
  const tone = kpi.tone === "blue" || kpi.tone === "cyan" || kpi.tone === "green" || kpi.tone === "yellow" ? kpi.tone : kpi.tone ? "yellow" : undefined;
  return { detail: kpi.detail, icon: kpi.icon ?? kpi.label.slice(0, 2), label: kpi.label, tone, value: kpi.value };
}

function Header({ breadcrumbs, isLive, siteName, subtitle, title, updatedAt }: { breadcrumbs: string[]; isLive: boolean; siteName: string; subtitle: string; title: string; updatedAt: string }) {
  return (
    <header className={isLive ? "border-b border-cyan-300/10 pb-2" : "border-b border-slate-200 pb-2"}>
      <div className="flex h-[32px] items-center justify-between">
        <div className={isLive ? "text-[12px] font-semibold uppercase tracking-wide text-slate-100" : "text-[12px] font-semibold uppercase tracking-wide text-slate-900"}>XECO Energy Intelligence Portal</div>
        <div className="flex items-center gap-3 text-[9px] text-slate-300">
          {isLive ? <Button>Client {breadcrumbs[1] ?? "No Data"}</Button> : <LightButton>⌂ {siteName}</LightButton>}
          {isLive ? <Button>{updatedAt}</Button> : <LightButton>▣ Latest Rollup</LightButton>}
          <span className="text-[#05ff5e]">● {isLive ? "Live" : "Online"}</span>
          <span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">ND</span>
          <span className={isLive ? "" : "text-slate-900"}>No Data<br /><span className="text-slate-500">User</span></span>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="text-[9px] text-slate-500">{breadcrumbs.map((item, index) => <span key={item}>{index ? <span className="mx-2">›</span> : null}{item}</span>)}</div>
          <h1 className={isLive ? "mt-2 text-[21px] font-semibold leading-none text-slate-100" : "mt-2 text-[21px] font-semibold leading-none text-slate-900"}>{title} {isLive ? <span className="rounded border border-[#05ff5e]/40 bg-[#05ff5e]/10 px-2 py-1 text-[12px] text-[#05ff5e]">Live</span> : null}</h1>
          <p className={isLive ? "mt-2 text-[10px] text-slate-300" : "mt-2 text-[10px] text-slate-700"}>{subtitle}</p>
        </div>
        <div className="flex gap-2">{isLive ? <><Button>Auto Refresh 10 sec</Button><Button>Export Data</Button><Button>Today</Button></> : <><LightButton>Asset Scope&nbsp;&nbsp; Entire Site</LightButton><LightButton>Time Range&nbsp;&nbsp; Last 7 Days</LightButton><LightButton>⇩ Export Report</LightButton></>}</div>
      </div>
    </header>
  );
}

function CurrentAnalysisBody({ data }: { data?: CurrentAnalysisData }) {
  const rows = data?.assetRows.map((row) => row.cells) ?? [["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data"]];
  const insights = data?.insights?.length ? data.insights : ["No Data: approved narrative insight source is not defined for Current Analysis."];
  return (
    <>
      <section className="mt-2 grid h-[200px] grid-cols-2 gap-2">
        <LightPanel title="Current Components Over Time"><NoDataChart label="No approved telemetry trend contract" /></LightPanel>
        <LightPanel title="Phase Current Balance"><NoDataChart label="No approved phase trend contract" /></LightPanel>
      </section>
      <section className="mt-2 grid h-[190px] grid-cols-[0.9fr_0.85fr_1fr] gap-2">
        <LightPanel title="Current Component Breakdown"><Donut data={data} /></LightPanel>
        <LightPanel title="Current Harmonic Distortion (THD)"><NoDataChart label="No approved harmonic spectrum source" /></LightPanel>
        <LightPanel title="Neutral Current Trend"><NoDataChart label="No approved neutral-current trend source" /></LightPanel>
      </section>
      <section className="mt-2 grid h-[205px] grid-cols-[1.45fr_0.7fr] gap-2">
        <LightPanel title="Current Analysis By Asset">
          <LightTable headers={["Asset", "Total", "Productive", "Reactive", "Harmonic", "Imbalance", "Neutral", "CBI", "Status"]} rows={rows} />
        </LightPanel>
        <LightPanel title="Key Insights">
          <ul className="space-y-3 text-[10px] text-slate-700">{insights.map((item) => <li key={item}><span className="text-[#05aa55]">●</span> {item}</li>)}</ul>
        </LightPanel>
      </section>
    </>
  );
}

function LiveDataBody({ data }: { data?: LiveDataScreenData }) {
  const phaseRows = data?.phaseRows.map((row) => row.cells) ?? [["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data"]];
  const deviceRows = data?.deviceRows.map((row) => row.cells) ?? [["No Data", "No Data", "No Data", "No Data", "No Data", "No Data"]];
  return (
    <>
      <section className="mt-2 grid h-[180px] grid-cols-3 gap-2">
        <DashboardPanel action="24 Hours ˅" title="Real-Time Power Trend" variant="enterprise"><DarkNoData label="No approved raw telemetry trend" /></DashboardPanel>
        <DashboardPanel action="24 Hours ˅" title="Power Factor Trend" variant="enterprise"><DarkNoData label="No approved PF trend contract" /></DashboardPanel>
        <DashboardPanel action="24 Hours ˅" title="Voltage Trend (L-L)" variant="enterprise"><DarkNoData label="No approved voltage telemetry source" /></DashboardPanel>
      </section>
      <section className="mt-2 grid h-[190px] grid-cols-[1fr_0.6fr_0.85fr] gap-2">
        <DashboardPanel title="Phase Summary (Instantaneous)" variant="enterprise"><DarkTable headers={["Phase", "Voltage", "Current", "kW", "kVA", "PF", "THD"]} rows={phaseRows} /></DashboardPanel>
        <DashboardPanel title="Demand Summary (15-min Rolling)" variant="enterprise"><Gauge data={data} /></DashboardPanel>
        <DashboardPanel title="Harmonic Summary (Voltage)" variant="enterprise"><DarkNoData label="No approved harmonic-order source" /></DashboardPanel>
      </section>
      <section className="mt-2 grid h-[210px] grid-cols-[1.3fr_0.7fr_1fr] gap-2">
        <DashboardPanel title="Device Status" variant="enterprise"><DarkTable headers={["Device", "Type", "Location", "Status", "Last Update", "Signal"]} rows={deviceRows} /></DashboardPanel>
        <DashboardPanel title="Alarms & Events" variant="enterprise"><LiveAlarms rows={data?.alarmRows.map((row) => row.cells)} /></DashboardPanel>
        <DashboardPanel title="Real-Time System Diagram" variant="enterprise"><SystemDiagram rows={data?.systemRows} /></DashboardPanel>
      </section>
    </>
  );
}

function Button({ children }: { children: React.ReactNode }) {
  return <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-[9px] text-slate-300">{children}</button>;
}

function LightButton({ children }: { children: React.ReactNode }) {
  return <button className="rounded border border-slate-200 bg-white px-4 py-2 text-[10px] font-semibold text-slate-800 shadow-sm">{children}</button>;
}

function CurrentKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = currentKpiConfig[kpi.label] ?? currentKpiConfig["Total Current"];
  const [detail, delta = "↑ 8.7% vs Prior 7 Days"] = kpi.detail.split("|").map((item) => item.trim());

  return (
    <article className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${config.bg} text-white`}>
        <WaveIcon />
      </span>
      <div className="min-w-0">
        <div className="whitespace-nowrap text-[9px] font-bold uppercase text-slate-700">{kpi.label}</div>
        <div className="mt-1 whitespace-nowrap text-[24px] font-semibold leading-none text-slate-900">{kpi.value}</div>
        <div className="mt-1 whitespace-nowrap text-[10px] text-slate-700">{detail}</div>
        <div className="mt-2 whitespace-nowrap text-[9px] font-semibold text-[#05aa55]">{delta}</div>
      </div>
    </article>
  );
}

function LiveKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = liveKpiConfig[kpi.label] ?? liveKpiConfig["System Status"];

  return (
    <article className="flex items-center gap-3 overflow-hidden rounded-lg border border-cyan-300/10 bg-[#071827] px-3 py-3 shadow-[0_0_22px_rgba(0,229,255,0.04)]">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full border ${config.border} ${config.bg} ${config.text}`}>
        <LiveKpiIcon kind={config.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="whitespace-nowrap text-[7.5px] font-bold uppercase leading-none text-slate-400">{kpi.label}</div>
        <div className="mt-1.5 whitespace-nowrap text-[19px] font-semibold leading-none text-slate-100">{kpi.value}</div>
        <div className={`mt-2 whitespace-nowrap text-[8px] font-semibold leading-none ${config.delta}`}>{kpi.detail}</div>
      </div>
      {kpi.label === "System Load" ? <MiniLoadGauge /> : null}
    </article>
  );
}

const liveKpiConfig: Record<string, { bg: string; border: string; delta: string; icon: string; text: string }> = {
  "System Status": { bg: "bg-[#063820]", border: "border-[#05ff5e]/40", delta: "text-[#05ff5e]", icon: "check", text: "text-[#05ff5e]" },
  "Total kW": { bg: "bg-[#082943]", border: "border-[#147dff]/50", delta: "text-[#05ff5e]", icon: "bolt", text: "text-[#147dff]" },
  "Total kVA": { bg: "bg-[#2d1648]", border: "border-[#a855f7]/50", delta: "text-[#05ff5e]", icon: "nodes", text: "text-[#a855f7]" },
  "Power Factor": { bg: "bg-[#342703]", border: "border-[#facc15]/50", delta: "text-[#05ff5e]", icon: "gauge", text: "text-[#facc15]" },
  "THD (V)": { bg: "bg-[#3b0d11]", border: "border-[#ef1717]/50", delta: "text-[#05ff5e]", icon: "pulse", text: "text-[#ef4444]" },
  "Frequency": { bg: "bg-[#082943]", border: "border-[#147dff]/50", delta: "text-slate-400", icon: "grid", text: "text-[#147dff]" },
  "System Load": { bg: "bg-[#063820]", border: "border-[#05ff5e]/40", delta: "text-slate-400", icon: "load", text: "text-[#05ff5e]" },
};

function LiveKpiIcon({ kind }: { kind: string }) {
  if (kind === "check") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" /></svg>;
  if (kind === "bolt") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
  if (kind === "nodes") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="6" cy="17" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="17" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M11 7 7 15m6-8 4 8M8.5 17h7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
  if (kind === "gauge") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15a8 8 0 1 1 16 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><path d="m12 15 4-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><circle cx="12" cy="15" r="1.6" fill="currentColor" /></svg>;
  if (kind === "pulse") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h4l2-6 4 12 3-8 2 2h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
  if (kind === "grid") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M7 4v16M12 4v16M17 4v16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></svg>;
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a8 8 0 1 0-8-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><path d="M12 13V5m0 8 5 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function MiniLoadGauge() {
  return (
    <svg className="hidden h-12 w-16 shrink-0 xl:block" viewBox="0 0 70 48" aria-hidden="true">
      <path d="M12 36a23 23 0 0 1 46 0" fill="none" stroke="#12364c" strokeLinecap="round" strokeWidth="7" />
      <path d="M12 36a23 23 0 0 1 38-17" fill="none" stroke="#65a30d" strokeLinecap="round" strokeWidth="7" />
      <path d="M35 36 51 22" stroke="#05ff5e" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

const currentKpiConfig: Record<string, { bg: string }> = {
  "Total Current": { bg: "bg-[#16a34a]" },
  "Productive Current (kW)": { bg: "bg-[#16a34a]" },
  "Reactive Current (kVAR)": { bg: "bg-[#f59e0b]" },
  "Harmonic Current (THD)": { bg: "bg-[#f97316]" },
  "Imbalance Current": { bg: "bg-[#ef1717]" },
  "Neutral Current": { bg: "bg-[#147dff]" },
};

function WaveIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h3l2-5 4 10 3-7 2 2h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function LightPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-sm"><h2 className="mb-2 text-[12px] font-semibold uppercase text-slate-700">{title}</h2>{children}</section>;
}

function LightTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr className="border-t border-slate-200" key={i}>{r.map((c, j) => <td className={j === r.length - 1 ? "py-2 text-[#05aa55]" : "py-2 text-slate-700"} key={j}>{c}</td>)}</tr>)}</tbody></table>;
}

function DarkTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="flex h-full flex-col"><table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{headers.map((h) => <th className="pb-1.5" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr className="border-t border-white/5" key={i}>{r.map((c, j) => <td className={c === "Online" ? "py-1 text-[#05ff5e]" : c.startsWith("▮") ? "py-1 text-[#05ff5e]" : "py-1 text-slate-300"} key={j}>{j === 0 && (c === "L1" || c === "L2" || c === "L3") ? <span className={c === "L1" ? "text-red-400" : c === "L2" ? "text-yellow-300" : "text-blue-400"}>{c}</span> : c}</td>)}</tr>)}</tbody></table>{headers[0] === "Device" ? <a className="mt-auto inline-flex text-[10px] font-semibold text-[#147dff]">View All Devices →</a> : null}</div>;
}

function LineChart({ colors }: { colors: string[] }) {
  return <svg className="h-[150px] w-full" viewBox="0 0 500 155" preserveAspectRatio="none">{[30, 60, 90, 120].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="#e2e8f0" strokeOpacity=".8" />)}{colors.map((color, i) => <polyline fill="none" key={color} points={`0,${92 + i * 7} 40,${74 + i * 6} 80,${40 + i * 4} 120,${108 + i * 4} 160,${86 + i * 4} 200,${42 + i * 4} 240,${104 + i * 4} 280,${82 + i * 4} 320,${44 + i * 4} 360,${102 + i * 4} 400,${76 + i * 4} 440,${46 + i * 4} 500,${92 + i * 4}`} stroke={color} strokeWidth="2.2" />)}</svg>;
}

function StackedCurrentChart() {
  return <svg className="h-[150px] w-full" viewBox="0 0 500 155" preserveAspectRatio="none">{[35, 70, 105, 140].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="#e2e8f0" strokeOpacity=".8" />)}<path d="M0 122 C30 92 50 88 75 116 C105 145 120 54 150 68 C190 84 178 145 220 112 C250 92 260 44 295 70 C330 96 320 140 360 116 C390 92 395 54 430 70 C460 90 465 130 500 94 L500 155 L0 155Z" fill="#05aa55" opacity=".9" /><path d="M0 90 C50 70 75 84 100 94 C135 104 150 58 180 64 C230 70 240 100 280 84 C320 68 345 78 380 92 C420 108 440 64 500 78 L500 122 L0 122Z" fill="#f59e0b" opacity=".82" /><path d="M0 62 C75 46 110 66 150 54 C210 42 245 60 300 50 C360 40 405 58 500 48 L500 90 L0 90Z" fill="#ef4444" opacity=".55" /></svg>;
}

function Donut({ data }: { data?: CurrentAnalysisData }) {
  const total = data?.kpis.find((kpi) => kpi.label === "Total Current")?.value ?? "No Data";
  const rows = ["Productive Current (kW)", "Reactive Current (kVAR)", "Harmonic Current (THD)", "Imbalance Current"].map((label) => {
    const kpi = data?.kpis.find((item) => item.label === label);
    return `${label.replace(" (kW)", "").replace(" (kVAR)", "").replace(" (THD)", "")} ${kpi?.value ?? "No Data"} (${kpi?.detail ?? "No Data"})`;
  });
  return <div className="grid grid-cols-[120px_1fr] items-center gap-4"><div className="grid size-[110px] place-items-center rounded-full p-6" style={{ background: "conic-gradient(#05aa55 0 72%, #f59e0b 72% 90%, #fb923c 90% 97%, #ef4444 97% 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-white text-center text-[12px] font-semibold">{total}<br /><span className="text-[8px] text-slate-500">Total Current</span></div></div><ul className="space-y-2 text-[9px] text-slate-700">{rows.map((row) => <li key={row}>{row}</li>)}</ul></div>;
}

function Bars() {
  return <div className="flex h-[95px] items-end gap-4 border-b border-slate-200">{[24, 16, 12, 10, 7, 6, 4, 3, 2, 1].map((h, i) => <div className="w-4 rounded-t bg-[#05aa55]" style={{ height: `${h * 3}px` }} key={i} />)}</div>;
}

function DarkLine() {
  const blue = "0,88 25,90 50,92 75,90 100,87 125,78 150,54 175,36 200,27 225,30 250,21 275,35 300,28 325,34 350,42 375,52 400,65 425,76 450,82 475,90 500,96";
  const green = "0,98 25,96 50,94 75,92 100,88 125,78 150,72 175,58 200,49 225,52 250,44 275,54 300,50 325,55 350,62 375,72 400,82 425,88 450,93 475,98 500,102";
  const purple = "0,112 25,111 50,113 75,111 100,109 125,108 150,106 175,102 200,100 225,103 250,99 275,104 300,101 325,103 350,105 375,108 400,110 425,111 450,112 475,113 500,114";
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex gap-3 whitespace-nowrap text-[8px] text-slate-400"><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#05ff5e]" />kW</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#147dff]" />kVA</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#a855f7]" />kVAR</span></div>
      <svg className="min-h-0 flex-1 w-full" viewBox="0 0 520 150" preserveAspectRatio="none">
        {[28, 56, 84, 112].map((y) => <line key={y} x1="26" x2="512" y1={y} y2={y} stroke="rgba(148,163,184,.16)" />)}
        {["0", "500", "1k", "1.5k", "2k"].map((label, index) => <text key={label} x="0" y={118 - index * 28} fill="#64748b" fontSize="8">{label}</text>)}
        <polyline fill="none" points={blue} stroke="#147dff" strokeWidth="2.3" />
        <polyline fill="none" points={green} stroke="#05ff5e" strokeWidth="2.3" />
        <polyline fill="none" points={purple} stroke="#a855f7" strokeWidth="1.8" />
        {blue.split(" ").map((pair) => { const [x, y] = pair.split(","); return <circle cx={x} cy={y} fill="#147dff" key={`b-${pair}`} r="2" />; })}
        {green.split(" ").map((pair) => { const [x, y] = pair.split(","); return <circle cx={x} cy={y} fill="#05ff5e" key={`g-${pair}`} r="2" />; })}
        {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map((label, index) => <text key={label} x={26 + index * 80} y="144" fill="#94a3b8" fontSize="8">{label}</text>)}
      </svg>
    </div>
  );
}

function Gauge({ data }: { data?: LiveDataScreenData }) {
  const kw = data?.kpis.find((kpi) => kpi.label === "Total kW")?.value ?? "No Data";
  const load = data?.kpis.find((kpi) => kpi.label === "System Load")?.value ?? "No Data";
  return (
    <div className="flex h-full flex-col">
      <svg className="min-h-0 flex-1 w-full" viewBox="0 0 260 150" aria-hidden="true">
        <path d="M40 118a90 90 0 0 1 180 0" fill="none" stroke="#12364c" strokeWidth="18" />
        <path d="M40 118a90 90 0 0 1 58-84" fill="none" stroke="#22c55e" strokeLinecap="round" strokeWidth="18" />
        <path d="M98 34a90 90 0 0 1 77 0" fill="none" stroke="#f59e0b" strokeLinecap="round" strokeWidth="18" />
        <path d="M175 34a90 90 0 0 1 45 84" fill="none" stroke="#ef4444" strokeLinecap="round" strokeWidth="18" />
        <path d="M130 118 84 55" stroke="#e2e8f0" strokeLinecap="round" strokeWidth="3" />
        <circle cx="130" cy="118" r="5" fill="#e2e8f0" />
        {["0", "750", "1,500", "2,250", "3,000"].map((label, index) => <text fill="#94a3b8" fontSize="9" key={label} textAnchor="middle" x={[42, 72, 130, 188, 218][index]} y={[124, 54, 24, 54, 124][index]}>{label}</text>)}
        <text fill="#f8fafc" fontSize="28" fontWeight="700" textAnchor="middle" x="130" y="92">{kw}</text>
        <text fill="#94a3b8" fontSize="10" textAnchor="middle" x="130" y="108">{load} of capacity</text>
        <text fill="#94a3b8" fontSize="9" textAnchor="middle" x="130" y="122">Contract Demand</text>
      </svg>
      <div className="flex justify-between border-t border-cyan-300/10 pt-1 text-[8px] text-slate-500"><span>Predicted Demand (Today)</span><span className="text-[#147dff]">No Data</span></div>
    </div>
  );
}

function DarkBars() {
  return <div className="flex h-full flex-col"><div className="ml-auto mb-1 rounded border border-cyan-300/10 px-2 py-1 text-[8px] text-slate-300">IEEE 519 Limits ˅</div><div className="relative flex min-h-0 flex-1 items-end gap-7 border-b border-slate-700 pl-2"><div className="absolute left-0 right-0 top-[42%] border-t border-dashed border-yellow-500" />{[88, 50, 35, 24, 13, 9, 7, 6, 5, 4].map((h, i) => <div className="w-4 rounded-t bg-[#22c55e]" style={{ height: `${h}px` }} key={i} />)}</div><div className="mt-1 flex justify-between text-[8px] text-slate-400"><span>THD</span><span>3</span><span>5</span><span>7</span><span>11</span><span>13</span><span>17</span><span>19</span><span>23</span><span>25</span></div></div>;
}

function SystemDiagram({ rows }: { rows?: { label: string; value: string }[] }) {
  const values = rows?.length ? rows : [{ label: "Utility Voltage", value: "No Data" }, { label: "Main Transformer", value: "No Data" }, { label: "Panel Loads", value: "No Data" }];
  return <div className="flex h-full flex-col items-center justify-center text-center text-[8px] text-slate-300"><div className="font-semibold">UTILITY<br /><span className="text-slate-400">{values[0]?.value ?? "No Data"}</span></div><div className="h-7 border-l border-[#05ff5e]" /><div className="text-blue-300">⚙<br /><span className="text-slate-200">MAIN TRANSFORMER</span><br />{values[1]?.value ?? "No Data"}</div><div className="h-7 border-l border-[#05ff5e]" /><div className="text-blue-300">▧<br /><span className="text-slate-200">MAIN SWITCHBOARD</span><br />No Data</div><div className="h-6 border-l border-[#05ff5e]" /><div className="w-[94%] border-t-2 border-[#05ff5e]" /><div className="grid w-full grid-cols-6 gap-2 text-blue-300">{["XAPF-01\\nNo Data", "METER-01\\nNo Data", "PANEL A\\nNo Data", "PANEL B\\nNo Data", "PANEL C\\nNo Data", "METER-02\\nNo Data"].map((item) => <span className="-mt-1 whitespace-pre-line" key={item}>⊕<br />{item}</span>)}</div><a className="mt-auto self-start text-[10px] font-semibold text-[#147dff]">View Full One-Line →</a></div>;
}

function LiveAlarms({ rows }: { rows?: string[][] }) {
  const alarms = rows?.length ? rows : [["No Data", "No approved live alarm event source is defined for this screen payload."]];

  return (
    <div className="flex h-full flex-col">
      <ul className="space-y-3 text-[8.5px] text-slate-300">
        {alarms.map(([title, body]) => (
          <li className="grid grid-cols-[24px_1fr_42px] gap-2" key={`${title}-${body}`}>
            <span className="grid size-6 place-items-center rounded-full bg-white/5 text-blue-400">ⓘ</span>
            <span><b className="text-blue-400">{title}</b><br />{body}</span>
            <span className="text-right text-[7.5px] text-slate-500">No Data</span>
          </li>
        ))}
      </ul>
      <a className="mt-auto text-[10px] font-semibold text-[#147dff]">View All Alarms →</a>
    </div>
  );
}

function NoDataChart({ label }: { label: string }) {
  return <div className="grid h-[150px] place-items-center rounded border border-dashed border-slate-300 text-center text-[10px] text-slate-500">No Data<br /><span>{label}</span></div>;
}

function DarkNoData({ label }: { label: string }) {
  return <div className="grid h-full place-items-center rounded border border-dashed border-cyan-300/10 text-center text-[10px] text-slate-500">No Data<br /><span>{label}</span></div>;
}
