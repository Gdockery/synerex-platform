import {
  ActiveAlarmsCard,
  DashboardFooter,
  DashboardKpiCard,
  DashboardPanel,
  DeviceHealthCard,
  EcbsImpactCard,
  ElectricalNetworkOverviewCard,
  HiddenCapacityRecoveryCard,
  LivePowerSnapshotCard,
  MonitoringHealthCard,
  QuickActionsCard,
  RecentEventsCard,
  SiteInformationCard,
  TransformerStatusCard,
  TrendCard,
  type QuickActionItem,
} from "./DashboardCards";
import type { SiteDashboardData } from "@/lib/trackingDashboardData";

const quickActions: QuickActionItem[] = [
  { label: "Generate Assessment", icon: "assessment", color: "#147dff" },
  { label: "Generate Proposal", icon: "proposal", color: "#f59e0b" },
  { label: "View Digital Twin", icon: "digitalTwin", color: "#05ff5e" },
  { label: "Export Meter Data", icon: "export", color: "#cbd5e1" },
  { label: "View Reports", icon: "reports", color: "#147dff" },
  { label: "Open Deployment", icon: "deployment", color: "#f59e0b" },
  { label: "Schedule Maintenance", icon: "maintenance", color: "#cbd5e1" },
  { label: "Add Note", icon: "note", color: "#f59e0b" },
];

const siteDashboardData: SiteDashboardData = {
  siteName: "Flex Tijuana",
  updatedAt: "May 18, 2025 10:15 AM",
  kpis: [
    { icon: "∿", label: "Current Balance Index™", value: "96", detail: "A+ Rating", color: "#0da64a" },
    { icon: "⚡", label: "Capacity Recovered", value: "425 kVA", detail: "↑ 25% vs Baseline", color: "#147dff" },
    { icon: "▣", label: "Transformer Utilization", value: "75%", detail: "On Target (<85%)", color: "#147dff" },
    { icon: "⊙", label: "Power Factor (Avg)", value: "0.99", detail: "Optimal", color: "#0da64a" },
    { icon: "↕", label: "THD (Avg)", value: "4.8%", detail: "Good (<5%)", color: "#0da64a" },
    { icon: "$", label: "Annual Savings", value: "$184,200", detail: "↑ 12.6% vs Last Month", color: "#0da64a" },
  ],
  electricalNodes: [
    { label: "Utility", value: "13.8 kV" },
    { label: "Transformer T1", value: "1500 kVA" },
    { label: "Main Switchgear", value: "480 V" },
  ],
  panels: [
    { name: "Panel A", label: "Production", load: "632 kW" },
    { name: "Panel B", label: "HVAC", load: "198 kW" },
    { name: "Panel C", label: "Lighting", load: "72 kW" },
    { name: "Panel D", label: "East 45 kV", load: "89 kW" },
    { name: "Panel E", label: "Other Loads", load: "89 kW" },
  ],
  transformerUtilization: "75%",
  transformerMetrics: [
    { label: "Rating", value: "1,500 kVA" },
    { label: "Current Load", value: "1,125 kVA (480 A)" },
    { label: "Available Capacity", value: "375 kVA (25%)", accent: true },
    { label: "Recovered Capacity", value: "225 kVA", accent: true },
    { label: "Temperature", value: "58 °C" },
    { label: "Efficiency", value: "98.6%", accent: true },
  ],
  liveSnapshot: [
    { label: "Voltage (L-L)", value: "481 V" },
    { label: "Current", value: "1,248 A" },
    { label: "Real Power", value: "912 kW", color: "#f59e0b" },
    { label: "Reactive Power", value: "95 kvar", color: "#f59e0b" },
    { label: "Power Factor", value: "0.99" },
    { label: "Frequency", value: "60.01 Hz" },
  ],
  savingsTrend: {
    value: "$184,200",
    detail: "↑ 12.6% vs Last Month",
    labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    points: "0,88 26,79 52,70 78,55 104,38 130,44 156,36 182,31 208,18 234,24 260,14 286,12 312,5",
  },
  balanceTrend: {
    value: "96",
    detail: "A+ Rating",
    labels: ["Apr 19", "Apr 24", "Apr 29", "May 4", "May 9", "May 14", "May 18"],
    points: "0,88 24,36 48,30 72,32 96,27 120,24 144,20 168,17 192,12 216,18 240,13 264,15 288,12 312,5",
  },
  thdTrend: {
    value: "4.8%",
    detail: "Good (<5%)",
    labels: ["Apr 19", "Apr 24", "Apr 29", "May 4", "May 9", "May 14", "May 18"],
    points: "0,18 26,30 52,36 78,40 104,44 130,48 156,55 182,57 208,60 234,63 260,66 286,70 312,72",
    color: "#2f8cff",
  },
  capacityBefore: [
    { label: "Productive Current", value: "45%", color: "#05ff5e" },
    { label: "Reactive Current", value: "30%", color: "#f59e0b" },
    { label: "Harmonic Current", value: "15%", color: "#ef4444" },
    { label: "Imbalance Current", value: "10%", color: "#ef4444" },
  ],
  capacityAfter: [
    { label: "Productive Current", value: "90%", color: "#05ff5e" },
    { label: "Reactive Current", value: "10%", color: "#f59e0b" },
    { label: "Harmonic Current", value: "5%", color: "#ef4444" },
    { label: "Imbalance Current", value: "5%", color: "#ef4444" },
  ],
  impact: [
    { icon: "↓", label: "Current Reduction", value: "-18%" },
    { icon: "↓", label: "THD Reduction", value: "-78%" },
    { icon: "+", label: "PF Improvement", value: "0.86 → 0.99" },
    { icon: "ⓘ", label: "Capacity Recovery", value: "425 kVA" },
    { icon: "$", label: "Annual Savings", value: "$184,200 ↑" },
  ],
  deviceHealth: [
    { color: "#05ff5e", label: "Healthy", value: "94 (98%)" },
    { color: "#f59e0b", label: "Warning", value: "2 (2%)" },
    { color: "#ef4444", label: "Offline", value: "0 (0%)" },
  ],
  monitoringHealth: [
    { color: "#05ff5e", label: "PQ Meter", value: "Online" },
    { color: "#05ff5e", label: "Gateway", value: "Online" },
    { color: "#05ff5e", label: "Cloud", value: "Online" },
    { color: "#05ff5e", label: "Database", value: "Online" },
  ],
  alarms: [
    { title: "High THD Detected", detail: "Panel B: 6.0% on Panel B", time: "Today 9:23 AM", tone: "red" },
    { title: "Transformer T1 Overload", detail: "Load 92% (Limit 90%)", time: "Today 7:45 AM", tone: "yellow" },
    { title: "Communication Restored", detail: "ECBS Rack 03", time: "Today 8:02 AM", tone: "blue" },
  ],
  events: [
    { time: "May 18, 10:10 AM", event: "THD exceeded 5% on Panel C" },
    { time: "May 18, 08:42 AM", event: "Gateway communication restored" },
    { time: "May 18, 07:15 AM", event: "Firmware updated on ECBS Rack 03" },
    { time: "May 17, 11:00 PM", event: "Monthly performance report generated" },
  ],
  siteInfo: [
    { label: "Site Name", value: "Flex Tijuana" },
    { label: "Address", value: "Av. El Santo 1234, Tijuana, BC 22100" },
    { label: "Customer", value: "Flex" },
    { label: "Installed", value: "May 10, 2024" },
    { label: "ECBS System", value: "ECBS-1500CR" },
    { label: "Commissioned By", value: "XECO Field Team" },
  ],
};

export function SiteDashboardScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[176px_1fr]">
        <SiteDashboardSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-3 py-2">
          <DashboardHeader />
          <section className="grid h-[84px] grid-cols-6 gap-2">
            {siteDashboardData.kpis.map((kpi) => (
              <DashboardKpiCard key={kpi.label} kpi={kpi} />
            ))}
          </section>
          <section className="mt-2 grid h-[258px] grid-cols-[1.28fr_0.9fr_1.35fr] gap-2">
            <DashboardPanel title="Electrical Network Overview" action="View Full Network →" actionHref="/enterprise/digital-twin">
              <ElectricalNetworkOverviewCard nodes={siteDashboardData.electricalNodes} panels={siteDashboardData.panels} />
            </DashboardPanel>
            <DashboardPanel title="Transformer T1">
              <TransformerStatusCard metrics={siteDashboardData.transformerMetrics} value={siteDashboardData.transformerUtilization} />
            </DashboardPanel>
            <DashboardPanel title="Live Power Snapshot" action="View Live Data →" actionHref="/data-analytics/live-data/live-data">
              <LivePowerSnapshotCard metrics={siteDashboardData.liveSnapshot} />
            </DashboardPanel>
          </section>
          <section className="mt-2 grid h-[152px] grid-cols-3 gap-2">
            <DashboardPanel title="Savings Trend (12 Months)" action="View Report →" actionHref="/enterprise/savings-forecast">
              <TrendCard {...siteDashboardData.savingsTrend} />
            </DashboardPanel>
            <DashboardPanel title="Current Balance Index™ Trend (30 Days)" action="View Report →" actionHref="/enterprise/current-analysis">
              <TrendCard {...siteDashboardData.balanceTrend} />
            </DashboardPanel>
            <DashboardPanel title="THD Trend (30 Days)" action="View Report →" actionHref="/data-analytics/power-quality">
              <TrendCard {...siteDashboardData.thdTrend} />
            </DashboardPanel>
          </section>
          <section className="mt-2 grid h-[144px] grid-cols-[1.25fr_1.65fr_0.85fr_0.85fr] gap-2">
            <DashboardPanel title="Hidden Capacity Recovery (ECBS Impact)" action="View Analysis →" actionHref="/enterprise/capacity-intelligence">
              <HiddenCapacityRecoveryCard before={siteDashboardData.capacityBefore} after={siteDashboardData.capacityAfter} />
            </DashboardPanel>
            <DashboardPanel title="ECBS Impact (vs. Baseline)">
              <EcbsImpactCard metrics={siteDashboardData.impact} />
            </DashboardPanel>
            <DashboardPanel title="Device Health">
              <DeviceHealthCard items={siteDashboardData.deviceHealth} />
            </DashboardPanel>
            <DashboardPanel title="Monitoring Health">
              <MonitoringHealthCard items={siteDashboardData.monitoringHealth} />
            </DashboardPanel>
          </section>
          <section className="mt-2 grid h-[164px] grid-cols-[1fr_1fr_0.9fr_1.6fr] gap-2">
            <DashboardPanel title="Active Alarms (3)" action="View All Alarms →" actionHref="/enterprise/alarms-events">
              <ActiveAlarmsCard alarms={siteDashboardData.alarms} />
            </DashboardPanel>
            <DashboardPanel title="Recent Events" action="View All Events →" actionHref="/enterprise/alarms-events">
              <RecentEventsCard events={siteDashboardData.events} />
            </DashboardPanel>
            <DashboardPanel title="Quick Actions">
              <QuickActionsCard actions={quickActions} />
            </DashboardPanel>
            <DashboardPanel title="Site Information" action="View Site Details →" actionHref="/enterprise/sites/site-details">
              <SiteInformationCard rows={siteDashboardData.siteInfo} />
            </DashboardPanel>
          </section>
          <div className="absolute bottom-2 left-3 right-3">
            <DashboardFooter updatedAt={siteDashboardData.updatedAt} />
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="flex h-[46px] items-start justify-between">
      <div>
        <h1 className="text-[17px] font-semibold leading-none text-slate-100">Site Dashboard</h1>
        <p className="mt-1 text-[10px] text-slate-300">Flex Tijuana <span className="ml-2 text-[#05ff5e]">● Online</span></p>
      </div>
      <div className="flex items-center gap-3 text-[9px] text-slate-300">
        <button className="rounded border border-slate-600/70 bg-[#061421] px-3 py-1.5 text-[9px]">▣ &nbsp; May 12 - May 18, 2025</button>
        <span><span className="text-[#05ff5e]">●</span> Real-time</span>
        <span className="relative grid size-6 place-items-center rounded-full border border-slate-600">!<span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-red-500 text-[8px] font-bold text-white">3</span></span>
        <span className="grid size-6 place-items-center rounded-full border border-slate-600">?</span>
        <span className="grid size-7 place-items-center rounded-full bg-[#0b3158] text-[10px]">GD</span>
        <span className="leading-tight"><span className="block font-semibold text-slate-100">Greg Dockery</span><span className="text-slate-500">Administrator</span></span>
        <span>⌄</span>
      </div>
    </header>
  );
}

function SiteDashboardSidebar() {
  const enterprise = ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Electrical Network", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Monitoring Center", "Reports"];
  const devices = ["Gateways", "Meters", "Switches", "Repeaters"];
  return (
    <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3">
      <div className="mb-4 border-b border-white/8 pb-3">
        <div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div>
        <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div>
      </div>
      <nav className="space-y-2.5 text-[9px]">
        <section>
          <div className="space-y-1">
            {enterprise.map((item) => (
              <div className={item === "Sites" ? "flex h-[24px] items-center rounded bg-[#063b27] px-2 text-[#05ff5e]" : "flex h-[23px] items-center rounded px-2 text-slate-300"} key={item}>
                <span className="mr-2">⌘</span><span>{item}</span>{item === "Alarms & Events" ? <b className="ml-auto grid size-4 place-items-center rounded-full bg-orange-500 text-[8px] text-white">2</b> : null}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-1 flex justify-between text-[#05ff5e]">Devices <span>⌄</span></h2>
          {devices.map((item) => <div className="flex h-[22px] items-center rounded px-2 text-slate-300" key={item}><span className="mr-2">⊙</span>{item}</div>)}
        </section>
        <section>
          <div className="flex h-[22px] items-center rounded px-2 text-slate-300"><span className="mr-2">⚙</span>Settings</div>
        </section>
      </nav>
      <div className="absolute bottom-[126px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]">
        <div>XECO Current<br/>Balance Index™</div>
        <div className="text-[38px] leading-none text-[#65a30d]">96</div>
        <div>A+ Rating</div>
        <div className="mt-3 text-[#05ff5e]">View Details →</div>
      </div>
      <div className="absolute bottom-[54px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-3 text-[8px]">
        <div className="text-white">☏ Need Help?</div>
        <div className="text-slate-400">Contact XECO Support</div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div>
    </aside>
  );
}
