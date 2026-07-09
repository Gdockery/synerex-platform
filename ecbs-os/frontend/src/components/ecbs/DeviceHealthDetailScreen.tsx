import type { ReactNode } from "react";
import { DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

export type DeviceScreenVariant =
  | "commissioning"
  | "commissioningNext"
  | "gateways"
  | "jobCosting"
  | "jobInvoices"
  | "jobProductionTime"
  | "jobReports"
  | "meters"
  | "repeaters"
  | "scheduling"
  | "switchDetail"
  | "switchesList"
  | "gatewayDetail"
  | "meterDetail"
  | "repeaterDetail";

const components = [
  ["Power Module", "Healthy", "OK", "OK", "100"],
  ["Cooling System", "Healthy", "42 °C", "< 70 °C", "100"],
  ["Capacitor Bank", "Healthy", "OK", "OK", "100"],
  ["IGBT Modules", "Healthy", "OK", "OK", "100"],
  ["Communication", "Healthy", "Strong", "Good", "100"],
  ["Power Quality", "Healthy", "THD 2.1%", "< 5%", "95"],
  ["Internal Fans", "Warning", "1 Fan High Speed", "N/A", "70"],
  ["DC Bus Voltage", "Healthy", "798 VDC", "600-900 V", "100"],
];

const deviceRows = [
  ["GW-TJU-01", "XGW-500", "Main Switchgear Room", "Online", "96", "1 min ago", "v2.4.1"],
  ["GW-TJU-02", "XGW-500", "Substation A", "Online", "94", "2 min ago", "v2.4.1"],
  ["GW-TJU-03", "XGW-300", "Panel D1", "Online", "92", "1 min ago", "v2.3.9"],
  ["GW-TJU-04", "XGW-300", "Feeder A", "Online", "90", "2 min ago", "v2.4.1"],
  ["GW-TJU-05", "XGW-300", "AHF Panel", "Warning", "78", "5 min ago", "v2.3.8"],
  ["GW-TJU-06", "XGW-500", "Main Transformer", "Online", "95", "1 min ago", "v2.4.1"],
  ["GW-TJU-07", "XGW-300", "Edge Gateway 1", "Online", "93", "3 min ago", "v2.4.0"],
  ["GW-TJU-08", "XGW-300", "Edge Gateway 2", "Online", "91", "3 min ago", "v2.4.0"],
  ["GW-TJU-09", "XGW-300", "Warehouse Panel", "Online", "89", "4 min ago", "v2.3.9"],
  ["GW-TJU-10", "XGW-300", "Utility Entrance", "Online", "90", "2 min ago", "v2.4.1"],
  ["GW-TJU-11", "XGW-300", "Solar Inverter Room", "Online", "94", "1 min ago", "v2.4.1"],
  ["GW-TJU-12", "XGW-300", "Water Treatment", "Online", "92", "1 min ago", "v2.4.1"],
];

export function DeviceScreen({ variant }: { variant: DeviceScreenVariant }) {
  if (variant === "scheduling") return <DeviceSchedulingScreen />;
  if (variant === "commissioning") return <DeviceCommissioningScreen />;
  if (variant === "commissioningNext") return <CommissioningNextStepsScreen />;
  if (variant === "jobCosting" || variant === "jobInvoices" || variant === "jobProductionTime" || variant === "jobReports") return <JobCostingScreen variant={variant} />;
  if (variant === "gatewayDetail") return <GatewayDetailScreen />;
  if (variant === "meterDetail") return <MeterDetailScreen />;
  if (variant === "repeaterDetail") return <RepeaterDetailScreen />;
  if (variant === "switchDetail") return <SwitchDetailScreen />;
  if (variant === "switchesList") return <SwitchesInventoryScreen />;

  const config =
    variant === "meters"
      ? { title: "Meters", active: "/devices/meters", total: "38", online: "34", warning: "3", offline: "1", health: "93", firmware: "97%", noun: "Meter", model: "Power Quality Meter", description: "Meters collect and transmit power quality data from devices." }
      : variant === "repeaters"
        ? { title: "Repeaters", active: "/devices/repeaters", total: "16", online: "14", warning: "1", offline: "1", health: "91", firmware: "94%", noun: "Repeater", model: "XRPT-200", description: "Repeaters extend network coverage and ensure reliable communication." }
        : { title: "Gateways", active: "/devices/gateways", total: "12", online: "11", warning: "1", offline: "0", health: "92", firmware: "100%", noun: "Gateway", model: "XGW-500", description: "Gateways collect and transmit data from meters and devices." };

  return (
    <EcbsAppShell activeHref={config.active}>
      <PortalFrame active={config.title}>
        <div className="flex h-[66px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Devices › {config.title}</div><h1 className="text-xl font-light">{config.title}</h1><p className="mt-1 text-[9px] text-slate-400">Monitor and manage all {config.title.toLowerCase()} at this site. {config.description}</p></div>
          <div className="flex gap-3 text-[9px]"><button className="w-[230px] rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-left text-slate-400">⌕ &nbsp; Search {config.title.toLowerCase()}...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">▽ Filters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export {config.title}</button></div>
        </div>
        <section className="mt-2 grid h-[86px] grid-cols-6 gap-2">
          <Kpi title={`Total ${config.title}`} value={config.total} detail={`View All ${config.title} ->`} tone="cyan" icon={variant === "repeaters" ? "antenna" : "info"} />
          <Kpi title="Online" value={config.online} detail={variant === "gateways" ? "91.7%" : variant === "meters" ? "89.5%" : "87.5%"} tone="green" icon="shield" />
          <Kpi title="Warning" value={config.warning} detail={variant === "meters" ? "7.9%" : "8.3%"} tone="yellow" icon="warning" />
          <Kpi title="Offline" value={config.offline} detail={variant === "gateways" ? "0%" : "6.3%"} tone="red" icon="warning" />
          <Kpi title="Health Score (Avg)" value={config.health} detail="Excellent" tone="purple" icon={variant === "repeaters" ? "wave" : "clock"} />
          <Kpi title="Firmware Up To Date" value={config.firmware} detail={variant === "gateways" ? "12 of 12" : variant === "meters" ? "37 of 38" : variant === "repeaters" ? "15 of 16" : `View Details ->`} tone="cyan" icon={variant === "repeaters" ? "gear" : "info"} />
        </section>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.62fr] gap-2">
          <DashboardPanel title={`${config.title} at Flex Tijuana (${config.total})`} variant="enterprise">
            <DeviceListTable variant={variant} model={config.model} />
          </DashboardPanel>
          <div className="space-y-2 overflow-hidden">
            <DashboardPanel title={`${config.noun} Status`} variant="enterprise"><DonutSummary total={config.total} rows={variant === "meters" ? [["Online", "34 (89.5%)"], ["Warning", "3 (7.9%)"], ["Offline", "1 (2.6%)"]] : variant === "repeaters" ? [["Online", "14 (87.5%)"], ["Warning", "1 (6.3%)"], ["Offline", "1 (6.3%)"]] : [["Online", config.online], ["Warning", config.warning], ["Offline", config.offline]]} /></DashboardPanel>
            <DashboardPanel title={variant === "repeaters" ? "Repeater Signal Strength Distribution" : `${config.noun} Health Distribution`} variant="enterprise"><DonutSummary total={config.total} rows={variant === "meters" ? [["Excellent (90-100)", "22 (57.9%)"], ["Good (70-89)", "11 (28.9%)"], ["Fair (50-69)", "4 (10.5%)"], ["Poor (<50)", "1 (2.6%)"]] : variant === "repeaters" ? [["Excellent (-50 to -70 dBm)", "7 (43.8%)"], ["Good (-71 to -85 dBm)", "6 (37.5%)"], ["Fair (-86 to -100 dBm)", "2 (12.5%)"], ["Poor (< -100 dBm)", "1 (6.3%)"]] : [["Excellent", "7"], ["Good", "4"], ["Fair", "1"], ["Poor", "0"]]} /></DashboardPanel>
            <DashboardPanel title="Firmware Status" variant="enterprise"><DonutSummary total={config.total} rows={variant === "meters" ? [["Up To Date", "37 (97.4%)"], ["Update Available", "1 (2.6%)"], ["Unknown", "0 (0%)"]] : variant === "repeaters" ? [["Up To Date", "15 (93.8%)"], ["Update Available", "1 (6.3%)"], ["Unknown", "0 (0%)"]] : [["Up To Date", variant === "gateways" ? "12" : "15"], ["Update Available", variant === "gateways" ? "0" : "1"], ["Unknown", "0"]]} /></DashboardPanel>
            <DashboardPanel action={variant === "repeaters" ? "View All ->" : undefined} title={`Recent ${config.noun} Alerts`} variant="enterprise">{variant === "repeaters" ? <RepeaterAlerts /> : <MetricList rows={variant === "meters" ? [["MT-AHF-01 (AHF Panel)", "5 min ago"], ["MT-MAIN-01 (Main Transformer)", "15 min ago"], ["MT-UTILITY-01 (Utility Entrance)", "1 hr ago"]] : [[`${config.noun.toUpperCase()}-05 (AHF Panel)`, "5 min ago"], [`${config.noun.toUpperCase()}-06 (Main Transformer)`, "1 hr ago"]]} />}</DashboardPanel>
          </div>
        </section>
      </PortalFrame>
    </EcbsAppShell>
  );
}

function SwitchesInventoryScreen() {
  return (
    <EcbsAppShell activeHref="/devices/switches">
      <PortalFrame active="Switches">
        <div className="flex h-[72px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Devices › Switches</div><h1 className="text-xl font-light">Switches</h1><p className="mt-1 text-[9px] text-slate-400">Monitor and manage all power switches and breakers at this site. Switches control power distribution and protect critical equipment.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="w-[230px] rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-left text-slate-400">⌕ &nbsp; Search switches...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">▽ Filters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export Switches</button></div>
        </div>
        <div className="flex h-[34px] gap-9 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] text-[#05ff5e]">▣ Device Control</span><span>▣ Device Scheduling</span><span>⚙ Commissioning & Testing</span><span>▧ Production Time</span><span>♙ Job Costing</span><span>Logs</span></div>
        <section className="mt-2 grid h-[92px] grid-cols-6 gap-2">
          <Kpi title="Total Switches" value="24" detail="View All Switches ->" tone="cyan" icon="gear" />
          <Kpi title="Online" value="21" detail="87.5%" tone="green" icon="shield" />
          <Kpi title="Warning" value="2" detail="8.3%" tone="yellow" icon="warning" />
          <Kpi title="Offline" value="1" detail="4.2%" tone="red" icon="warning" />
          <Kpi title="Health Score (Avg)" value="90" detail="Excellent" tone="purple" icon="wave" />
          <Kpi title="Firmware Up To Date" value="96%" detail="23 of 24" tone="cyan" icon="gear" />
        </section>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.62fr] gap-2">
          <DashboardPanel title="Switches at Flex Tijuana (24)" variant="enterprise"><SwitchesInventoryTable /></DashboardPanel>
          <div className="space-y-2 overflow-hidden">
            <DashboardPanel title="Switch Status" variant="enterprise"><DonutSummary total="24" rows={[["Online", "21 (87.5%)"], ["Warning", "2 (8.3%)"], ["Offline", "1 (4.2%)"]]} /></DashboardPanel>
            <DashboardPanel title="Switch Health Distribution" variant="enterprise"><DonutSummary total="24" rows={[["Excellent (90-100)", "14 (58.3%)"], ["Good (70-89)", "7 (29.2%)"], ["Fair (50-69)", "2 (8.3%)"], ["Poor (<50)", "1 (4.2%)"]]} /></DashboardPanel>
            <DashboardPanel title="Firmware Status" variant="enterprise"><DonutSummary total="24" rows={[["Up To Date", "23 (95.8%)"], ["Update Available", "1 (4.2%)"], ["Unknown", "0 (0%)"]]} /></DashboardPanel>
            <DashboardPanel action="View All ->" title="Recent Switch Alerts" variant="enterprise"><SwitchAlerts /></DashboardPanel>
          </div>
        </section>
      </PortalFrame>
    </EcbsAppShell>
  );
}

function SwitchesInventoryTable() {
  const rows = [
    ["SW-MAIN-01", "Air Circuit Breaker", "Main Switchgear MSB", "Online", "96", "Auto (Always On)", true],
    ["SW-MAIN-02", "Molded Case Switch", "Substation A", "Online", "94", "Auto (Always On)", true],
    ["SW-FEEDER-01", "Molded Case Switch", "Feeder A", "Online", "92", "Auto (Time Schedule)", true],
    ["SW-FEEDER-02", "Molded Case Switch", "Feeder B", "Online", "90", "Auto (Utility Based)", true],
    ["SW-PANEL-D1", "Disconnect Switch", "Panel D1", "Online", "91", "Monitor (Always On)", false],
    ["SW-PANEL-A1", "Disconnect Switch", "Panel A1", "Warning", "72", "Monitor (Always On)", false],
    ["SW-PANEL-A2", "Disconnect Switch", "Panel A2", "Online", "93", "Monitor (Always On)", false],
    ["SW-PANEL-B1", "Molded Case Switch", "Panel B1", "Online", "89", "Monitor (Always On)", false],
    ["SW-TRANS-01", "Transfer Switch", "Main Transformer", "Online", "95", "Auto (Always On)", false],
    ["SW-TRANS-02", "Transfer Switch", "Backup Transformer", "Offline", "0", "Monitor (Always Off)", false],
    ["SW-ATS-01", "Automatic Transfer Switch", "Generator ATS", "Online", "94", "Auto (Time Schedule)", false],
    ["SW-UPS-01", "Static Switch", "UPS System", "Online", "93", "Auto (Always On)", false],
  ];
  return <div className="text-[9px]"><div className="mb-3 flex justify-end gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Group by: Type⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">☷</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">▦</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["", "Switch Name", "Type", "Location / Asset", "Status", "Health Score", "Current Mode", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(([name, type, location, status, health, mode, checked], index) => <tr className="border-t border-white/5" key={`${String(name)}-${index}`}><td className="py-[6px]"><span className={checked ? "grid size-4 place-items-center rounded bg-[#22c55e] text-[#02100a]" : "grid size-4 rounded border border-slate-600"}>{checked ? "✓" : ""}</span></td><td className="py-[6px]"><span className={status === "Offline" ? "mr-2 inline-grid size-4 place-items-center rounded border border-red-400 text-red-400" : "mr-2 inline-grid size-4 place-items-center rounded border border-[#05ff5e] text-[#05ff5e]"}>▣</span><span className="text-cyan-300">{name}</span>{index === 0 ? <span className="ml-2 text-yellow-300">★</span> : null}</td><td>{type}</td><td>{location}</td><td className={status === "Online" ? "text-[#05ff5e]" : status === "Warning" ? "text-yellow-300" : "text-red-400"}>● {status}</td><td><span className="inline-flex items-center gap-3"><span>{health}</span><span className="inline-block h-1.5 w-14 rounded bg-slate-800"><span className={status === "Warning" ? "block h-1.5 rounded bg-yellow-400" : status === "Offline" ? "block h-1.5 rounded bg-slate-700" : "block h-1.5 rounded bg-[#22c55e]"} style={{ width: `${health}%` }} /></span></span></td><td><span className={mode.startsWith("Auto") ? "rounded border border-[#05ff5e]/40 bg-[#063b27] px-2 py-1 text-[8px] text-[#05ff5e]" : "rounded border border-slate-500/40 bg-slate-900 px-2 py-1 text-[8px] text-slate-300"}>{mode}</span></td><td className="text-slate-300">↻ &nbsp; ▣ &nbsp; ⓘ &nbsp; ⋮</td></tr>)}</tbody></table><div className="mt-5 flex justify-between text-[9px] text-slate-400"><span>Showing 1 to 12 of 24 switches</span><span>‹ &nbsp; <b className="rounded border border-[#05ff5e] px-3 py-2 text-[#05ff5e]">1</b> &nbsp; 2 &nbsp; ›</span></div></div>;
}

function SwitchAlerts() {
  const rows = [
    ["△", "text-yellow-300", "SW-PANEL-A1 (Panel A1)", "High Temperature Detected", "5 min ago"],
    ["×", "text-red-400", "SW-TRANS-02 (Backup Transformer)", "Switch Offline", "2 hrs ago"],
    ["✓", "text-[#05ff5e]", "SW-MAIN-01 (Main Switchgear MSB)", "Maintenance Test Completed", "15 hrs ago"],
  ];
  return <div className="space-y-2 text-[9px]">{rows.map(([icon, color, title, detail, time]) => <div className="grid grid-cols-[18px_1fr_auto] items-start gap-2 border-b border-white/5 pb-1.5" key={title}><span className={`grid size-4 place-items-center rounded-full border border-current ${color}`}>{icon}</span><span><b className="block text-slate-200">{title}</b><span className="text-[8px] text-slate-500">{detail}</span></span><b className="text-[8px] text-slate-300">{time}</b></div>)}</div>;
}

function PortalFrame({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-2">
      <header className="flex h-[38px] items-center justify-between border-b border-cyan-300/10">
        <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
        <div className="flex items-center gap-3 text-[9px]"><button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5">Flex Tijuana</button><button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5">May 12 - May 18, 2025</button><span className="text-[#05ff5e]">● Online</span><span className="grid size-7 place-items-center rounded-full bg-[#334155]">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span></div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <footer className="flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">{active ? "Live" : ""}</b></span></footer>
    </div>
  );
}

function DeviceListTable({ model, variant }: { model: string; variant: DeviceScreenVariant }) {
  const prefix = variant === "meters" ? "MT" : variant === "repeaters" ? "RP" : variant === "switchesList" ? "SW" : "GW";
  const meterRows = [
    ["MT-MAIN-01", "Power Quality Meter", "Main Transformer", "Online", "96", "1 min ago", "v2.4.1", "◎ ⋮"],
    ["MT-MSW-01", "Power Meter", "Main Switchgear MSB", "Online", "94", "2 min ago", "v2.4.1", "◎ ⋮"],
    ["MT-PANEL-D1", "Power Quality Meter", "Panel D1", "Online", "92", "1 min ago", "v2.3.9", "◎ ⋮"],
    ["MT-FEEDER-A", "Power Meter", "Feeder A", "Online", "90", "2 min ago", "v2.4.1", "◎ ⋮"],
    ["MT-AHF-01", "Harmonic Meter", "AHF Panel", "Warning", "78", "5 min ago", "v2.3.8", "◎ ⋮"],
    ["MT-PANEL-A1", "Power Quality Meter", "Panel A1", "Online", "93", "2 min ago", "v2.4.1", "◎ ⋮"],
    ["MT-PANEL-A2", "Power Quality Meter", "Panel A2", "Online", "91", "3 min ago", "v2.4.1", "◎ ⋮"],
    ["MT-FEEDER-B", "Power Meter", "Feeder B", "Online", "89", "3 min ago", "v2.4.0", "◎ ⋮"],
    ["MT-SOLAR-01", "Power Meter", "Solar Inverter Room", "Online", "94", "1 min ago", "v2.4.1", "◎ ⋮"],
    ["MT-UTILITY-01", "Utility Meter", "Utility Entrance", "Offline", "0", "1 hr ago", "v2.3.9", "◎ ⋮"],
  ];
  const repeaterRows = [
    ["RP-TJU-01", "XRPT-200", "Main Switchgear Room", "Online", "-62 dBm", "1 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-TJU-02", "XRPT-200", "Substation A", "Online", "-65 dBm", "2 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-TJU-03", "XRPT-100", "Panel D1", "Online", "-68 dBm", "1 min ago", "v1.3.8", "◎ ⋮"],
    ["RP-FEEDER-A", "XRPT-200", "Feeder A", "Online", "-70 dBm", "2 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-FEEDER-B", "XRPT-200", "Feeder B", "Warning", "-85 dBm", "5 min ago", "v1.4.0", "◎ ⋮"],
    ["RP-PANEL-A1", "XRPT-100", "Panel A1", "Online", "-66 dBm", "2 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-PANEL-A2", "XRPT-100", "Panel A2", "Online", "-64 dBm", "2 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-PANEL-B1", "XRPT-100", "Panel B1", "Online", "-71 dBm", "3 min ago", "v1.3.8", "◎ ⋮"],
    ["RP-TRANS-01", "XRPT-200", "Main Transformer", "Online", "-59 dBm", "1 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-TRANS-02", "XRPT-200", "Backup Transformer", "Offline", "--", "2 hrs ago", "v1.3.7", "◎ ⋮"],
    ["RP-ATS-01", "XRPT-100", "Generator ATS", "Online", "-67 dBm", "1 min ago", "v1.4.2", "◎ ⋮"],
    ["RP-UPS-01", "XRPT-100", "UPS Room", "Online", "-63 dBm", "3 min ago", "v1.4.2", "◎ ⋮"],
  ];
  const rows = variant === "meters" ? meterRows : variant === "repeaters" ? repeaterRows : deviceRows.slice(0, 12).map((row, index) => [
    `${prefix}-${row[0].split("-").slice(1).join("-")}`,
    variant === "repeaters" ? (index % 3 === 0 ? "XRPT-200" : "XRPT-100") : variant === "switchesList" ? (index % 4 === 0 ? "Air Circuit Breaker" : index % 4 === 1 ? "Molded Case Switch" : index % 4 === 2 ? "Disconnect Switch" : "Transfer Switch") : model,
    row[2],
    row[3],
    variant === "repeaters" ? `${-62 - index} dBm` : row[4],
    row[5],
    row[6],
    "◎ ⋮",
  ]);
  const healthHeader = variant === "repeaters" ? "Signal Strength" : "Health Score";
  const noun = variant === "meters" ? "Meter" : variant === "repeaters" ? "Repeater" : variant === "switchesList" ? "Switch" : "Gateway";
  return <><div className="mb-3 flex justify-end gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Group by: {variant === "meters" || variant === "switchesList" ? "Type" : "None"}⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">☷</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">▦</button></div><DeviceTable headers={[`${noun} Name`, "Model", "Location / Asset", "Status", healthHeader, "Last Seen", "Firmware", "Actions"]} rows={rows} /><div className="mt-6 flex justify-between text-[9px] text-slate-400"><span>Showing 1 to {rows.length} of {variant === "meters" ? "38 meters" : variant === "repeaters" ? "16 repeaters" : variant === "switchesList" ? "24 switches" : "12 gateways"}</span><span>‹ &nbsp; <b className="rounded border border-[#05ff5e] px-3 py-2 text-[#05ff5e]">1</b> &nbsp; 2 &nbsp; 3 {variant === "meters" ? " 4" : ""} &nbsp; ›</span></div></>;
}

function DeviceTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-3 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={cell === "Online" || cell === "Connected" || cell === "Pass" || cell === "Uploaded" ? "py-[7px] text-[#05ff5e]" : cell === "Warning" || cell === "Pending" ? "py-[7px] text-yellow-300" : cell === "Offline" ? "py-[7px] text-red-400" : "py-[7px] text-slate-300"} key={`${cell}-${cellIndex}`}>{cellIndex === 0 && /^G|^MT|^RP|^SW/.test(cell) ? <span><span className="mr-2 inline-grid size-4 place-items-center rounded border border-sky-400 text-sky-400">▣</span><span className="text-cyan-300">{cell}</span>{index === 0 ? <span className="ml-2 text-yellow-300">★</span> : null}</span> : cellIndex === 0 && headers[0] === "Equipment" ? <span><span className="mr-2 inline-grid size-4 place-items-center rounded border border-slate-500 text-slate-300">{["⌂", "△", "▦", "◌", "◈", "◎"][index] ?? "▣"}</span>{cell}</span> : cellIndex === 4 && /^-\d+ dBm$/.test(cell) ? <SignalStrength value={cell} /> : cellIndex === 4 && /^\\d+$/.test(cell) ? <span className="inline-flex items-center gap-3"><span>{cell}</span><span className="inline-block h-1.5 w-16 rounded bg-slate-800"><span className="block h-1.5 rounded bg-[#22c55e]" style={{ width: `${cell}%` }} /></span></span> : cellIndex === 7 ? <span className="text-[#05ff5e]">◎ &nbsp; ⋮</span> : cell}</td>)}</tr>)}</tbody></table>;
}

function SignalStrength({ value }: { value: string }) {
  const dbm = Math.abs(Number.parseInt(value, 10));
  const width = Math.max(18, Math.min(92, 118 - dbm));
  return <span className="inline-flex items-center gap-3"><span>{value}</span><span className="inline-block h-1.5 w-14 rounded bg-slate-800"><span className="block h-1.5 rounded bg-[#22c55e]" style={{ width: `${width}%` }} /></span></span>;
}

function RepeaterAlerts() {
  const rows = [
    ["△", "text-yellow-300", "RP-FEEDER-B (Feeder B)", "Weak signal strength: -85 dBm", "5 min ago"],
    ["×", "text-red-400", "RP-TRANS-02 (Backup Transformer)", "Repeater offline", "2 hrs ago"],
    ["✓", "text-[#05ff5e]", "RP-TJU-01 (Main Switchgear Room)", "Reconnected", "15 hrs ago"],
  ];
  return <div className="space-y-2 text-[9px]">{rows.map(([icon, color, title, detail, time]) => <div className="grid grid-cols-[18px_1fr_auto] items-start gap-2 border-b border-white/5 pb-1.5" key={title}><span className={`grid size-4 place-items-center rounded-full border border-current ${color}`}>{icon}</span><span><b className="block text-slate-200">{title}</b><span className="text-[8px] text-slate-500">{detail}</span></span><b className="text-[8px] text-slate-300">{time}</b></div>)}</div>;
}

function DonutSummary({ rows, total }: { rows: [string, string][]; total: string }) {
  return <div className="grid h-full grid-cols-[120px_1fr] items-center gap-4"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 75%, #147dff 75% 88%, #f59e0b 88% 95%, #ef4444 95% 100%)" }}><div className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-lg">{total}<br /><span className="text-[8px] text-slate-400">Total</span></div></div><MetricList rows={rows} /></div>;
}

function CostCenterTable() {
  const headers = ["Cost Center / Job", "kWh", "% of Total kWh", "kW Peak", "% of Total", "Cost (USD)", "% of Total"];
  const rows = [["Production Line 1 (JOB-1001)", "54,689", "62.4%", "257", "62.4%", "$5,451.63", "62.4%"], ["Chiller Plant (JOB-1002)", "16,401", "18.7%", "77", "18.7%", "$1,634.22", "18.7%"], ["Packaging Line (JOB-1003)", "8,132", "9.3%", "38", "9.2%", "$810.96", "9.3%"], ["Warehouse (JOB-1004)", "4,476", "5.1%", "22", "5.3%", "$445.11", "5.1%"], ["Office Building (JOB-1005)", "2,444", "2.8%", "12", "2.7%", "$245.54", "2.8%"], ["Other / Unallocated", "1,510", "1.7%", "6", "1.7%", "$154.90", "1.7%"], ["TOTAL", "87,652", "100%", "412", "100%", "$8,742.36", "100%"]];
  return <table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={row[0] === "TOTAL" ? "py-[3.5px] font-semibold text-slate-100" : index === 0 ? "py-[3.5px] text-slate-300" : "py-[3.5px] text-slate-300"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function TrendChart() {
  return <div className="h-full"><svg className="h-[118px] w-full" viewBox="0 0 420 120"><g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[20, 45, 70, 95].map((y) => <line key={y} x1="0" x2="420" y1={y} y2={y} />)}</g><polyline fill="none" points="0,82 38,58 76,63 114,72 152,52 190,47 228,24 266,36 304,50 342,38 380,50 420,41" stroke="#22c55e" strokeWidth="2" /><polyline fill="none" points="0,70 38,46 76,48 114,55 152,38 190,36 228,22 266,34 304,41 342,28 380,42 420,35" stroke="#147dff" strokeWidth="2" /><polyline fill="none" points="0,78 38,54 76,57 114,62 152,46 190,44 228,31 266,42 304,47 342,35 380,46 420,40" stroke="#f59e0b" strokeWidth="2" /></svg><div className="flex justify-between text-[8px] text-slate-400"><span>May 1</span><span>May 3</span><span>May 5</span><span>May 7</span><span>May 9</span><span>May 11</span></div></div>;
}

function GatewayDetailScreen() {
  return (
    <EcbsAppShell activeHref="/devices/gateways">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 18, 2025 10:15 AM CDT⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Gateways › GWF-00125</div><h1 className="mt-1 text-xl font-light">Gateway Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">Online</span></h1><p className="mt-1 text-[9px] text-slate-400">Gateway ID: GWF-00125 &nbsp; | &nbsp; Model: XECO Gateway Pro 2.0 &nbsp; | &nbsp; Firmware: v2.3.8 &nbsp; | &nbsp; Last Seen: May 18, 2025 10:14:58 AM CDT</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Gateways</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">↻ Restart Gateway</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Update Firmware</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-6 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="Flex Tijuana Manufacturing" /><Info label="Location" value="Main Electrical Room" /><Info label="IP Address" value="10.20.15.25" /><Info label="MAC Address" value="00:1A:2B:3C:4D:5E" /><Info label="Uptime" value="23d 14h 42m 18s" /><Info label="Data Transmission" value="Good  ▂▅▇" /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]">Overview</span><span>Meters (12)</span><span>Connectivity</span><span>Performance</span><span>Data & Storage</span><span>Events</span><span>Alerts</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[502px] min-h-0 grid-cols-[0.78fr_0.92fr_1.45fr_0.92fr] gap-2">
          <div className="grid min-h-0 grid-rows-[1fr_174px] gap-2 overflow-hidden">
            <DashboardPanel title="Gateway Status" variant="enterprise"><MetricList rows={[["Overall Status", "Online"], ["Power", "Normal"], ["Internet Connection", "Connected"], ["Data Collection", "Active"], ["Time Sync", "Synchronized"], ["Temperature", "42 °C / 107.6 °F"], ["CPU Usage", "18%"], ["Memory Usage", "42%"], ["Disk Usage", "31% (28 GB / 90 GB)"]]} /></DashboardPanel>
            <DashboardPanel title="Connected Meters" variant="enterprise"><DonutSummary total="12" rows={[["Online", "12 (100%)"], ["Offline", "0 (0%)"], ["Warning", "0 (0%)"], ["Unknown", "0 (0%)"]]} /><div className="mt-1 text-[9px] text-[#29b6f6]">View All Meters →</div></DashboardPanel>
          </div>
          <div className="grid min-h-0 grid-rows-[1fr_174px] gap-2 overflow-hidden">
            <DashboardPanel title="Connectivity" variant="enterprise"><GatewayConnectivity /></DashboardPanel>
            <DashboardPanel action="View All Events ->" title="Recent Events" variant="enterprise"><GatewayEvents /></DashboardPanel>
          </div>
          <div className="grid min-h-0 grid-rows-[220px_1fr] gap-2 overflow-hidden">
            <DashboardPanel title="Data Flow (Last 24 Hours)" variant="enterprise"><GatewayDataFlow /></DashboardPanel>
            <DashboardPanel title="Performance (Last 7 Days)" variant="enterprise"><GatewayPerformance /></DashboardPanel>
          </div>
          <div className="grid min-h-0 grid-rows-[1fr_174px] gap-2 overflow-hidden">
            <DashboardPanel action="Edit" title="Gateway Information" variant="enterprise"><MetricList rows={[["Model", "XECO Gateway Pro 2.0"], ["Serial Number", "XGW2-00125-5E4D3CB1A00"], ["Hardware Revision", "Rev B"], ["Firmware Version", "v2.3.8 (Latest)"], ["Bootloader Version", "v1.1.5"], ["Time Zone", "America/Mexico_City (PDT)"], ["Time Server", "time.xecoenergy.com"], ["Installed On", "Apr 24, 2025 8:30 AM"], ["Installed By", "XECO Engineering Team"], ["Notes", "Main gateway for Flex Tijuana site"]]} /></DashboardPanel>
            <DashboardPanel title="Actions" variant="enterprise"><MetricList rows={[["Restart Gateway", ""], ["Update Firmware", ""], ["Backup Configuration", ""], ["Export Gateway Diagnostics", ""], ["Remove Gateway", ""]]} /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function GatewayConnectivity() {
  return <div className="space-y-4 text-[9px]"><div><div className="mb-2 text-slate-400">Primary Connection</div><div className="rounded border border-cyan-300/12 bg-[#061421] p-3"><b className="text-[#05ff5e]">▰ Ethernet (LAN)</b><br /><span className="text-[#05ff5e]">1000 Mbps Full Duplex</span><div className="mt-3 grid grid-cols-2 gap-y-2"><span>IP Address</span><b>10.20.15.25</b><span>Gateway</span><b>10.20.15.1</b><span>DNS</span><b>10.20.10.53</b></div></div></div><div><div className="mb-2 text-slate-400">Secondary Connection (Failover)</div><div className="rounded border border-cyan-300/12 bg-[#061421] p-3"><b>▰ Cellular LTE</b><br /><span className="text-[#05ff5e]">Signal: -67 dBm (Good)</span><div className="mt-3 grid grid-cols-2"><span>IP</span><b>100.64.12.18</b></div></div></div></div>;
}

function GatewayEvents() {
  const rows = [["●", "Gateway Online", "May 18, 2025 9:52 AM"], ["●", "Configuration Updated", "May 17, 2025 11:43 PM"], ["●", "Firmware Check Completed", "May 17, 2025 11:43 PM"], ["●", "High Temperature Warning", "May 17, 2025 2:15 PM"], ["●", "Gateway Online", "May 16, 2025 10:02 AM"]];
  return <div className="space-y-2 text-[9px]">{rows.map(([dot, event, time], index) => <div className="grid grid-cols-[16px_1fr_auto] border-b border-white/5 pb-1.5" key={`${event}-${time}`}><span className={index === 2 ? "text-blue-400" : index === 3 ? "text-yellow-400" : "text-[#05ff5e]"}>{dot}</span><span>{event}</span><b className="text-slate-400">{time}</b></div>)}</div>;
}

function GatewayDataFlow() {
  return <div className="h-full"><div className="mb-1 flex justify-end gap-2 text-[8px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1">Last 24 Hours⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">⛶</button></div><TrendChart /><div className="grid grid-cols-4 gap-3 text-[9px]"><Info label="Total Data In" value="12.45 GB" /><Info label="Total Data Out" value="3.21 GB" /><Info label="Avg In Rate" value="531 MB/hr" /><Info label="Avg Out Rate" value="134 MB/hr" /></div></div>;
}

function GatewayPerformance() {
  return <div className="h-full"><div className="grid grid-cols-5 gap-2 text-[9px]"><Info label="CPU Usage (Avg.)" value="18%" /><Info label="Memory Usage (Avg.)" value="42%" /><Info label="Temperature (Avg.)" value="42 °C" /><Info label="Data Collection Success" value="99.8%" /><Info label="Packet Loss (Avg.)" value="0.12%" /></div><div className="mt-2"><HealthChart /></div></div>;
}

function MeterDetailScreen() {
  return (
    <EcbsAppShell activeHref="/devices/meters">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 18, 2025 10:15 AM CDT⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Meters › MTR-000125</div><h1 className="mt-1 text-xl font-light">Meter Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">Online</span></h1><p className="mt-1 text-[9px] text-slate-400">Meter ID: MTR-000125 &nbsp; | &nbsp; Model: Dent Instruments PS3HD &nbsp; | &nbsp; Serial Number: PS3HD-542881 &nbsp; | &nbsp; Firmware: v3.14 &nbsp; | &nbsp; Last Seen: May 18, 2025 10:14:58 AM CDT</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Meters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Data⌄</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure Meter</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-5 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="Flex Tijuana Manufacturing" /><Info label="Location" value="Main Electrical Room" /><Info label="Electrical Network" value="TXFR-01 / Main Incoming" /><Info label="Gateway" value="GWF-00125  Online" /><Info label="Meter Type" value="Revenue (4-Quadrant) ⓘ" /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="bg-[#082039] px-5 py-2 text-slate-100">Overview</span><span>Real-Time</span><span>Historical Data</span><span>Power Quality</span><span>Energy</span><span>Events</span><span>Alarms</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[598px] min-h-0 grid-cols-[0.88fr_1fr_0.72fr_0.86fr] grid-rows-[226px_180px_176px] gap-2 overflow-hidden">
          <DashboardPanel action="Edit" className="min-h-0" title="Meter Status" variant="enterprise"><MeterStatusList /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Real-Time Electrical Values" variant="enterprise"><MeterRealTimeValues /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Power Factor" variant="enterprise"><MeterPowerFactor /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Energy Summary (Today)" variant="enterprise"><MeterEnergySummary /></DashboardPanel>
          <DashboardPanel className="col-span-2 min-h-0" title="Load Trend (Last 24 Hours)" variant="enterprise"><MeterLoadTrend /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Harmonic Distortion (THD)" variant="enterprise"><MeterThd /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Demand (3-Hour Rolling)" variant="enterprise"><MeterDemand /></DashboardPanel>
          <DashboardPanel action="View All Events ->" className="col-span-2 min-h-0" title="Recent Events" variant="enterprise"><MeterEvents /></DashboardPanel>
          <DashboardPanel action="Edit" className="min-h-0" title="Meter Information" variant="enterprise"><MeterInformation /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Actions" variant="enterprise"><MeterActions /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function MeterRealTimeValues() {
  return <div className="text-[8.5px]"><div className="mb-1 text-slate-400">10:15:00 AM CDT</div><MeterMiniTable headers={["Parameter", "L1", "L2", "L3", "Total"]} rows={[["Voltage (V)", "480.1", "479.5", "480.3", "—"], ["Current (A)", "512.3", "498.7", "505.2", "—"], ["kW", "238.6", "231.7", "242.9", "713.2"], ["kVA", "289.1", "283.6", "291.4", "864.1"], ["kVAR", "164.2", "163.5", "164.0", "491.7"], ["Power Factor", "0.83", "0.82", "0.83", "0.83"], ["Frequency (Hz)", "60.02", "60.01", "60.01", "60.01"]]} /><div className="mt-1 text-[9px] text-[#29b6f6]">View Real-Time →</div></div>;
}

function MeterStatusList() {
  const rows = [["Overall Status", "Online"], ["Power", "Normal"], ["Communication", "Connected"], ["Data Collection", "Active"], ["Time Sync", "Synchronized"], ["Battery", "Good"], ["Temperature", "41 °C / 105.8 °F"], ["CT Ratio", "800 / 5"], ["VT Ratio", "480 / 480"], ["Nominal Voltage", "480Y/277 VAC, 3Ø 4W"], ["Nominal Frequency", "60 Hz"]];
  return <div className="space-y-[3px] text-[8.5px]">{rows.map(([label, value], index) => <div className="flex justify-between border-b border-white/5 pb-[2px]" key={label}><span className="text-slate-300">{index < 6 ? "◎ " : ""}{label}</span><b className={index < 6 ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div>;
}

function MeterMiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1.5 font-normal" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={index === 0 ? "py-[4px] text-slate-300" : "py-[4px] text-slate-200"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function MeterPowerFactor() {
  return <div className="grid h-full place-items-center text-center"><div className="relative h-[120px] w-[190px]"><div className="absolute left-0 right-0 top-5 mx-auto h-[95px] w-[170px] rounded-t-full border-[14px] border-b-0 border-[#22c55e]" style={{ borderLeftColor: "#ff3b30", borderTopColor: "#ffb000" }} /><div className="absolute bottom-1 left-0 right-0 text-3xl text-slate-100">0.83</div><div className="absolute bottom-[-14px] left-0 right-0 text-[10px] text-slate-300">Lagging</div></div><div className="text-[9px] text-slate-300">Target PF: 0.95 (Lagging)</div><div className="text-[9px] text-yellow-300">Below target by 0.12</div></div>;
}

function MeterEnergySummary() {
  return <div className="space-y-2 text-[8.5px]"><CompactMeterRows rows={[["Active Energy (kWh)", "5,128.6"], ["Reactive Energy (kVARh)", "3,482.7"], ["Apparent Energy (kVAh)", "6,192.3"], ["Import (kWh)", "5,128.6"], ["Export (kWh)", "0.0"]]} /><div><div className="mb-1 text-[9px] font-semibold">Energy Summary (MTD)</div><CompactMeterRows rows={[["Active Energy (kWh)", "182,450.4"], ["Import (kWh)", "182,450.4"], ["Export (kWh)", "0.0"]]} /></div><div className="text-[#29b6f6]">View Energy Details →</div></div>;
}

function CompactMeterRows({ rows }: { rows: [string, string][] }) {
  return <div className="space-y-[3px]">{rows.map(([label, value]) => <div className="flex justify-between" key={label}><span>{label}</span><b className="text-slate-100">{value}</b></div>)}</div>;
}

function MeterLoadTrend() {
  return <div className="h-full"><div className="mb-1 flex items-center justify-between text-[8px] text-slate-400"><span className="text-[#29b6f6]">━ kW &nbsp; <b className="text-yellow-300">━ kVA</b> &nbsp; <b className="text-[#22c55e]">━ kVAR</b> &nbsp; <b className="text-purple-400">━ PF</b></span><span>24 Hours⌄</span></div><svg className="h-[126px] w-full" viewBox="0 0 360 126"><g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[20, 46, 72, 98].map((y) => <line key={y} x1="22" x2="350" y1={y} y2={y} />)}</g><polyline fill="none" points="22,80 54,69 86,70 118,78 150,52 182,74 214,82 246,88 278,86 310,87 350,74" stroke="#147dff" strokeWidth="2" /><polyline fill="none" points="22,68 54,56 86,58 118,64 150,46 182,60 214,64 246,70 278,70 310,72 350,58" stroke="#f59e0b" strokeWidth="2" /><polyline fill="none" points="22,96 54,88 86,92 118,98 150,82 182,90 214,98 246,103 278,102 310,104 350,94" stroke="#22c55e" strokeWidth="2" /><polyline fill="none" points="22,39 54,38 86,39 118,40 150,37 182,39 214,41 246,42 278,40 310,42 350,39" stroke="#a855f7" strokeWidth="2" /></svg><div className="grid grid-cols-4 gap-2 text-[8px]"><Info label="kW" value="1,290" /><Info label="kVA" value="1,536" /><Info label="kVAR" value="712" /><Info label="PF" value="0.83" /></div><div className="mt-1 text-[9px] text-[#29b6f6]">View Historical Data →</div></div>;
}

function MeterThd() {
  return <div className="space-y-2 text-[8.5px]"><div className="text-slate-400">10:15:00 AM CDT</div><MeterMiniTable headers={["Parameter", "L1 (%)", "L2 (%)", "L3 (%)", "N (%)"]} rows={[["Voltage THD", "2.4", "2.3", "2.2", "1.8"], ["Current THD", "6.2", "6.1", "6.3", "3.9"], ["Current TDD", "5.8", "5.7", "5.9", "—"]]} /><div className="flex items-center justify-between border-t border-white/5 pt-1"><span>THD Compliance: IEEE 519 - 2014</span><b className="rounded bg-[#063b27] px-2 py-1 text-[8px] text-[#05ff5e]">Compliant</b></div><div className="text-[#29b6f6]">View Power Quality →</div></div>;
}

function MeterDemand() {
  return <div className="space-y-2 text-[8.5px]"><div className="text-slate-400">As of 10:00 AM CDT</div><CompactMeterRows rows={[["kW Demand", "842 kW"], ["kVA Demand", "1,021 kVA"], ["kVAR Demand", "495 kVAR"], ["Power Factor", "0.83"], ["Time of Max Demand", "May 18, 8:00 AM"]]} /><div className="pt-1 text-[#29b6f6]">View Demand Details →</div></div>;
}

function MeterEvents() {
  const rows = [["May 18, 2025 10:14 AM", "Data Collection Restored", "Info", "Data collection resumed"], ["May 18, 2025 9:52 AM", "Power Factor Low", "Warning", "PF dropped below 0.85"], ["May 18, 2025 9:20 AM", "Voltage Unbalance High", "Warning", "Voltage unbalance 1.8%"], ["May 18, 2025 8:00 AM", "High Demand", "Critical", "kW Demand 842 kW"]];
  return <table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{["Time", "Event", "Severity", "Description"].map((header) => <th className="pb-2 font-normal" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(([time, event, severity, description]) => <tr className="border-t border-white/5" key={event}><td className="py-2 text-slate-300">{time}</td><td>{event}</td><td className={severity === "Critical" ? "text-red-400" : severity === "Warning" ? "text-yellow-300" : "text-[#29b6f6]"}>● {severity}</td><td>{description}</td></tr>)}</tbody></table>;
}

function MeterInformation() {
  return <div className="space-y-[3px] text-[8.5px]"><CompactMeterRows rows={[["Manufacturer", "Dent Instruments"], ["Model", "PS3HD"], ["Serial Number", "PS3HD-542881"], ["Firmware Version", "v3.14"], ["Hardware Revision", "Rev C"], ["Installed On", "Apr 20, 2025"], ["Installed By", "XECO Engineering Team"], ["Notes", "Revenue meter - Main incoming"]]} /></div>;
}

function MeterActions() {
  return <div className="space-y-[7px] text-[8.5px]">{["ⓘ  Calibrate Meter", "◷  Sync Time", "↻  Reset Energy Values", "⊕  Test Communication", "⌫  Remove Meter"].map((action, index) => <div className={index === 4 ? "border-t border-white/5 pt-2 text-red-400" : "border-b border-white/5 pb-1.5"} key={action}>{action}</div>)}</div>;
}

function RepeaterDetailScreen() {
  return (
    <EcbsAppShell activeHref="/devices/repeaters">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 11 - May 18, 2025<br /><span className="text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Repeaters › RPT-00067</div><h1 className="mt-1 text-xl font-light">Repeater Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">Online</span></h1><p className="mt-1 text-[9px] text-slate-400">Repeater ID: RPT-00067 &nbsp; | &nbsp; Model: XECO Repeater Pro 2.0 &nbsp; | &nbsp; Firmware: v2.3.8 &nbsp; | &nbsp; Last Seen: May 18, 2025 10:14:58 AM CDT</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Repeaters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">↻ Restart Repeater</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Update Firmware</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure Repeater</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-7 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="Flex Tijuana Manufacturing" /><Info label="Location" value="Electrical Room 2" /><Info label="Parent Gateway" value="GWF-00125" /><Info label="IP Address" value="10.20.25.67" /><Info label="MAC Address" value="00:1A:2B:3C:4D:67" /><Info label="Uptime" value="23d 14h 42m 18s" /><Info label="Signal Strength" value="Excellent  ▂▅▇" /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="bg-[#082039] px-5 py-2 text-slate-100">Overview</span><span>Network & Connectivity</span><span>Connected Devices (15)</span><span>Performance</span><span>Events</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[598px] min-h-0 grid-cols-[0.9fr_0.72fr_1.08fr_0.64fr_0.74fr] grid-rows-[214px_164px_196px] gap-2 overflow-hidden">
          <DashboardPanel className="min-h-0" title="Repeater Status" variant="enterprise"><RepeaterStatusList /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Network Topology" variant="enterprise"><RepeaterTopology /></DashboardPanel>
          <DashboardPanel className="col-span-2 min-h-0" title="Throughput (Last 24 Hours)" variant="enterprise"><RepeaterThroughput /></DashboardPanel>
          <DashboardPanel action="Edit" className="min-h-0" title="Repeater Information" variant="enterprise"><RepeaterInformation /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Connected Devices Summary" variant="enterprise"><RepeaterConnectedSummary /></DashboardPanel>
          <DashboardPanel action="View All Events ->" className="col-span-2 min-h-0" title="Recent Events" variant="enterprise"><RepeaterDetailEvents /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Environmental" variant="enterprise"><RepeaterEnvironmental /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Signal Quality (to Gateway)" variant="enterprise"><RepeaterSignalQuality /></DashboardPanel>
          <DashboardPanel className="col-span-4 min-h-0" title="Performance (Last 7 Days)" variant="enterprise"><RepeaterPerformance /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Actions" variant="enterprise"><RepeaterActions /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function RepeaterStatusList() {
  const rows = [["Overall Status", "Online"], ["Power", "Normal"], ["Internet Connection", "Connected"], ["Data Forwarding", "Active"], ["Time Sync", "Synchronized"], ["Temperature", "41 °C / 105.8 °F"], ["CPU Usage", "21%"], ["Memory Usage", "38%"], ["Signal Strength (to Gateway)", "Excellent"], ["Packet Loss", "0.2%"]];
  return <div className="space-y-[3px] text-[8.2px]">{rows.map(([label, value], index) => <div className="flex justify-between border-b border-white/5 pb-[2px]" key={label}><span className="text-slate-300">{index < 5 || index > 7 ? "◎ " : "◷ "}{label}</span><b className={index < 5 || index > 7 ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div>;
}

function RepeaterTopology() {
  return <div className="grid h-full place-items-center text-center text-[8.5px]"><div className="relative h-[156px] w-[180px]"><div className="absolute left-[62px] top-0 rounded border border-slate-600 bg-[#061421] px-3 py-2">▣<br />GWF-00125<br /><span className="text-slate-500">Gateway</span></div><div className="absolute left-[76px] top-[48px] h-8 border-l border-[#05ff5e]" /><div className="absolute left-[56px] top-[74px] rounded border border-[#05ff5e] bg-[#063b27] px-4 py-2 text-[#05ff5e]">▣<br />RPT-00067<br /><span className="text-slate-300">Repeater</span></div><div className="absolute left-[30px] top-[124px] h-5 w-[122px] rounded-t border-x border-t border-[#05ff5e]/60 border-dashed" /><div className="absolute bottom-0 left-0 grid grid-cols-3 gap-2"><span className="rounded border border-slate-600 bg-[#061421] px-3 py-2">15<br />Meters</span><span className="rounded border border-slate-600 bg-[#061421] px-3 py-2">6<br />Switches</span><span className="rounded border border-slate-600 bg-[#061421] px-3 py-2">4<br />Devices</span></div></div><div className="mt-1 justify-self-start text-[#29b6f6]">View Network Map →</div></div>;
}

function RepeaterThroughput() {
  return <div className="h-full"><div className="mb-1 flex justify-end gap-2 text-[8px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1">Last 24 Hours⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">⛶</button></div><svg className="h-[116px] w-full" viewBox="0 0 420 116"><g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[16, 42, 68, 94].map((y) => <line key={y} x1="24" x2="410" y1={y} y2={y} />)}</g><polyline fill="none" points="24,50 40,42 56,54 72,45 88,51 104,34 120,60 136,45 152,55 168,40 184,57 200,52 216,31 232,62 248,48 264,36 280,56 296,45 312,42 328,59 344,34 360,58 376,44 392,52 410,48" stroke="#147dff" strokeWidth="2" /><polyline fill="none" points="24,82 40,72 56,78 72,69 88,74 104,61 120,85 136,74 152,82 168,65 184,83 200,78 216,60 232,85 248,76 264,62 280,80 296,70 312,76 328,86 344,65 360,83 376,70 392,76 410,72" stroke="#22c55e" strokeWidth="2" /></svg><div className="grid grid-cols-4 gap-2 text-[8px]"><Info label="Avg Data In" value="2.48 Mbps" /><Info label="Avg Data Out" value="1.92 Mbps" /><Info label="Peak In" value="7.64 Mbps" /><Info label="Peak Out" value="5.13 Mbps" /></div></div>;
}

function RepeaterInformation() {
  return <div className="space-y-[4px] text-[8.5px]"><CompactMeterRows rows={[["Model", "XECO Repeater Pro 2.0"], ["Serial Number", "XR2P-00067-9F2A7811"], ["Firmware Version", "v2.3.8 (Latest)"], ["Hardware Revision", "Rev B"], ["Bootloader Version", "v1.1.5"], ["Frequency Band", "2.4 GHz / 5 GHz"], ["Installation Date", "Apr 24, 2025"], ["Installed By", "XECO Engineering Team"], ["Notes", "Repeater between Electrical Room 2 and Line 3 MCC"]]} /></div>;
}

function RepeaterConnectedSummary() {
  return <div className="grid h-full grid-cols-[118px_1fr] items-center gap-3"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 60%, #147dff 60% 84%, #f59e0b 84% 100%)" }}><span className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-xl">25<br /><b className="text-[8px] font-normal text-slate-400">Total</b></span></div><div className="space-y-3 text-[8.5px]"><div><b className="mr-2 text-[#22c55e]">●</b>Meters <span className="float-right">15 (60%)</span></div><div><b className="mr-2 text-[#147dff]">●</b>Switches <span className="float-right">6 (24%)</span></div><div><b className="mr-2 text-yellow-400">●</b>Other Devices <span className="float-right">4 (16%)</span></div><div className="pt-2 text-[#29b6f6]">View All Connected Devices →</div></div></div>;
}

function RepeaterDetailEvents() {
  const rows = [["●", "Repeater Online", "May 18, 2025 9:52 AM"], ["●", "Configuration Updated", "May 17, 2025 11:43 PM"], ["●", "Firmware Check Completed", "May 17, 2025 11:43 PM"], ["●", "High Temperature Warning Cleared", "May 16, 2025 2:15 PM"], ["●", "Data Forwarding Restored", "May 16, 2025 10:02 AM"], ["●", "Signal Strength Improved", "May 16, 2025 8:41 AM"]];
  return <div className="space-y-[6px] text-[8.5px]">{rows.map(([dot, event, time], index) => <div className="grid grid-cols-[16px_1fr_auto] border-b border-white/5 pb-[4px]" key={`${event}-${time}`}><span className={index === 2 ? "text-blue-400" : index === 3 || index === 5 ? "text-slate-500" : "text-[#05ff5e]"}>{dot}</span><span>{event}</span><b className="text-slate-400">{time}</b></div>)}</div>;
}

function RepeaterEnvironmental() {
  return <div className="grid h-full gap-2 text-[8.5px]">{[["♨", "Temperature", "41 °C / 105.8 °F", "text-orange-400"], ["♢", "Humidity", "32 %", "text-[#29b6f6]"], ["⌘", "Ventilation", "Normal", "text-[#29b6f6]"]].map(([icon, label, value, color]) => <div className="grid grid-cols-[36px_1fr] items-center gap-2" key={label}><span className={`grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421] text-lg ${color}`}>{icon}</span><span><span className="text-slate-400">{label}</span><br /><b>{value}</b></span></div>)}</div>;
}

function RepeaterSignalQuality() {
  return <div className="grid h-full place-items-center text-center"><div className="grid size-[112px] place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 72%, #063b27 72% 100%)" }}><span className="grid size-[74px] place-items-center rounded-full bg-[#061521] text-lg">-62 dBm<br /><b className="text-[8px] font-normal text-slate-400">Excellent</b></span></div><div className="grid w-full grid-cols-2 text-[8px] text-slate-400"><span>-100</span><span className="text-right">-30</span></div><div className="text-[9px]">Noise Floor: -95 dBm<br />SNR: 33 dB</div><div className="text-[9px] text-[#29b6f6]">View Signal History →</div></div>;
}

function RepeaterPerformance() {
  const metrics = [["CPU Usage (Avg.)", "21%"], ["Memory Usage (Avg.)", "38%"], ["Uptime", "100%"], ["Packet Success Rate", "99.8%"], ["Avg Response Time", "28 ms"]];
  return <div className="grid h-full grid-cols-[1.65fr_0.95fr] gap-4 text-[8.5px]"><div className="grid grid-cols-5 gap-3">{metrics.map(([label, value], index) => <div className="border-r border-white/8 pr-3" key={label}><Info label={label} value={value} /><svg className="mt-5 h-32 w-full" viewBox="0 0 110 54"><g stroke="rgba(148,163,184,.16)"><line x1="0" x2="110" y1="14" y2="14" /><line x1="0" x2="110" y1="42" y2="42" /></g><polyline fill="none" points={index === 2 ? "0,14 110,14" : index === 3 ? "0,12 16,14 32,13 48,15 64,12 80,13 96,12 110,14" : "0,34 16,28 32,36 48,32 64,37 80,31 96,34 110,30"} stroke="#147dff" strokeWidth="2" /></svg></div>)}</div><div><div className="mb-2 text-[10px] font-semibold">Data Forwarding</div><CompactMeterRows rows={[["Status", "Active"], ["Total Packets (24h)", "128,452"], ["Dropped Packets (24h)", "256 (0.2%)"], ["Forwarding Mode", "Normal"], ["Queue Length", "24"]]} /></div></div>;
}

function RepeaterActions() {
  return <div className="space-y-[7px] text-[8.5px]">{["↻  Restart Repeater", "⇩  Update Firmware", "⇧  Backup Configuration", "⊕  Export Repeater Diagnostics", "⌫  Remove Repeater"].map((action, index) => <div className={index === 4 ? "border-t border-white/5 pt-2 text-red-400" : "border-b border-white/5 pb-1.5"} key={action}>{action}</div>)}</div>;
}

function SwitchDetailScreen() {
  return (
    <EcbsAppShell activeHref="/devices/switches">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 11 - May 18, 2025<br /><span className="text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Switches › SW-00048</div><h1 className="mt-1 text-xl font-light">Switch Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">Online</span></h1><p className="mt-1 text-[9px] text-slate-400">Switch ID: SW-00048 &nbsp; | &nbsp; Model: Schneider Electric MasterPact MTZ2-16H1 &nbsp; | &nbsp; Serial Number: 0619B210012 &nbsp; | &nbsp; Firmware: v2.7.1 &nbsp; | &nbsp; Last Seen: May 18, 2025 10:14:58 AM CDT</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Switches</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Data⌄</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure Switch</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-[1.15fr_1fr_1.1fr_1fr_0.9fr_0.72fr_0.72fr_0.78fr] rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="Flex Tijuana Manufacturing" /><Info label="Location" value="Main Electrical Room" /><Info label="Electrical Network" value="TXFR-01 / Main Incoming" /><Info label="Gateway" value="GWF-00125  Online" /><Info label="Switch Type" value="Air Circuit Breaker ⓘ" /><Info label="Status" value="Closed ●" /><Info label="Rated Current" value="1600 A" /><Info label="Rated Voltage" value="480Y/277 VAC" /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="bg-[#082039] px-5 py-2 text-slate-100">Overview</span><span>Real-Time</span><span>Historical Data</span><span>Power Quality</span><span>Events</span><span>Trips & Alarms</span><span>Maintenance</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[610px] min-h-0 grid-cols-10 grid-rows-[258px_236px_84px] gap-2 overflow-hidden">
          <DashboardPanel action="Edit" className="col-span-3 min-h-0" title="Switch Status" variant="enterprise"><SwitchStatusList /></DashboardPanel>
          <DashboardPanel className="col-span-3 min-h-0" title="Real-Time Electrical Values" variant="enterprise"><SwitchRealTimeValues /></DashboardPanel>
          <DashboardPanel className="col-span-4 min-h-0" title="Load Trend (Last 24 Hours)" variant="enterprise"><SwitchLoadTrend /></DashboardPanel>
          <DashboardPanel className="col-span-3 min-h-0" title="Power Quality Snapshot" variant="enterprise"><SwitchPowerQuality /></DashboardPanel>
          <DashboardPanel className="col-span-3 min-h-0" title="Trips & Alarms (Last 7 Days)" variant="enterprise"><SwitchTripsAlarms /></DashboardPanel>
          <DashboardPanel action="Edit" className="col-span-4 min-h-0" title="Switch Information" variant="enterprise"><SwitchInformation /></DashboardPanel>
          <DashboardPanel className="col-span-6 min-h-0" title="Actions" variant="enterprise"><SwitchActionTiles /></DashboardPanel>
          <DashboardPanel className="col-span-4 min-h-0" title="Quick Links" variant="enterprise"><SwitchQuickLinks /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function SwitchStatusList() {
  const rows = [["Operational Status", "Closed"], ["Connectivity", "Connected"], ["Control Power", "Normal"], ["Spring Status", "Charged"], ["Trip Unit Status", "OK"], ["Arc Flash Protection", "Enabled"], ["Temperature", "43 °C / 109.4 °F"], ["Mechanical Operations", "1,284"]];
  return <div className="h-full text-[8.4px]"><div className="space-y-[4px]">{rows.map(([label, value], index) => <div className="flex justify-between border-b border-white/5 pb-[2px]" key={label}><span className="text-slate-300">{index < 6 ? "◎ " : "♨ "}{label}</span><b className={index < 6 ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div><div className="mt-4 flex justify-between text-[8.5px]"><span className="text-slate-400">Last Operation</span><b>May 18, 2025 8:42 AM CDT</b></div></div>;
}

function SwitchRealTimeValues() {
  return <div className="text-[8.5px]"><div className="mb-1 text-slate-400">10:15:00 AM CDT</div><MeterMiniTable headers={["Parameter", "L1", "L2", "L3", "Avg / Total"]} rows={[["Voltage (V L-L)", "481.2", "480.5", "480.8", "480.8"], ["Voltage (V L-N)", "277.6", "276.9", "277.2", "277.2"], ["Current (A)", "512", "498", "524", "511"], ["Power (kW)", "238.6", "231.4", "244.3", "714.3"], ["kVA", "291.5", "283.7", "297.2", "872.4"], ["kVAR", "165.2", "162.1", "168.7", "496.0"], ["Power Factor", "0.82", "0.82", "0.82", "0.82"], ["Frequency (Hz)", "60.02", "60.01", "60.01", "60.01"]]} /><div className="mt-1 text-[9px] text-[#29b6f6]">View Real-Time →</div></div>;
}

function SwitchLoadTrend() {
  return <div className="h-full"><div className="mb-1 flex items-center justify-between text-[8px] text-slate-400"><span className="ml-auto">24 Hours⌄ &nbsp; ⛶</span></div><svg className="h-[148px] w-full" viewBox="0 0 560 148"><g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[18, 48, 78, 108, 138].map((y) => <line key={y} x1="34" x2="548" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="22">2,000</text><text x="8" y="52">1,600</text><text x="8" y="82">1,200</text><text x="14" y="112">800</text><text x="14" y="142">400</text></g><polyline fill="none" points="34,44 68,72 102,62 136,66 170,58 204,43 238,38 272,48 306,44 340,36 374,52 408,58 442,60 476,72 510,80 548,68" stroke="#147dff" strokeWidth="2" /><polyline fill="none" points="34,78 68,96 102,86 136,88 170,80 204,64 238,62 272,70 306,66 340,54 374,74 408,82 442,88 476,96 510,102 548,92" stroke="#22c55e" strokeWidth="2" /><polyline fill="none" points="34,58 68,84 102,78 136,76 170,69 204,51 238,50 272,58 306,56 340,45 374,64 408,72 442,78 476,86 510,90 548,82" stroke="#f59e0b" strokeWidth="2" /></svg><div className="grid grid-cols-4 gap-3 text-[9px]"><Info label="Avg Current" value="511 A" /><Info label="Avg kW" value="714 kW" /><Info label="Peak Current" value="1,024 A" /><Info label="Peak kW" value="1,182 kW" /></div><div className="mt-1 text-[9px] text-[#29b6f6]">View Historical Data →</div></div>;
}

function SwitchPowerQuality() {
  const items = [["THD (V L-L)", "2.3%", "Good"], ["THD (I)", "6.1%", "Good"], ["Unbalance (V)", "0.7%", "Excellent"], ["Flicker (Pst)", "0.28", "Good"], ["Voltage Deviation", "-0.4%", "Normal"], ["Frequency Deviation", "0.01 Hz", "Normal"]];
  return <div className="grid h-full grid-cols-4 gap-x-4 gap-y-5 text-[9px]">{items.map(([label, value, status], index) => <div className={index > 3 ? "col-span-2" : ""} key={label}><div className="text-slate-400">{label}</div><div className="mt-2 text-xl text-slate-100">{value}</div><div className={status === "Excellent" ? "text-[#05ff5e]" : "text-[#22c55e]"}>{status}</div></div>)}<div className="col-span-4 text-[#29b6f6]">View Power Quality →</div></div>;
}

function SwitchTripsAlarms() {
  const rows = [["May 18, 2025 8:42 AM", "Trip", "Long Time Overcurrent", "High"], ["May 17, 2025 9:14 PM", "Warning", "High Temperature", "Medium"], ["May 17, 2025 4:36 PM", "Warning", "High Current Warning", "Medium"], ["May 16, 2025 6:22 PM", "Info", "Control Power Restored", "Info"], ["May 15, 2025 11:10 AM", "Info", "Switch Closed", "Info"]];
  return <div className="text-[8.5px]"><div className="mb-4 grid grid-cols-4 text-center"><Info label="Total Trips" value="1" /><Info label="Active Alarms" value="0" /><Info label="Warnings" value="2" /><Info label="Info" value="5" /></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Time", "Type", "Description", "Severity"].map((h) => <th className="pb-1.5 font-normal" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([time, type, description, severity]) => <tr className="border-t border-white/5" key={`${time}-${description}`}><td className="py-[5px]">{time}</td><td>{type}</td><td>{description}</td><td className={severity === "High" ? "text-red-400" : severity === "Medium" ? "text-yellow-300" : "text-[#29b6f6]"}>● {severity}</td></tr>)}</tbody></table><div className="mt-2 text-[#29b6f6]">View All Events →</div></div>;
}

function SwitchInformation() {
  return <div className="grid grid-cols-2 gap-x-8 text-[8.7px]"><CompactMeterRows rows={[["Manufacturer", "Schneider Electric"], ["Model", "MasterPact MTZ2-16H1"], ["Serial Number", "0619B210012"], ["Firmware Version", "v2.7.1"], ["Trip Unit", "Micrologic X"]]} /><CompactMeterRows rows={[["Rated Current", "1600 A"], ["Rated Voltage", "480Y/277 VAC"], ["Interrupting Capacity", "65 kA @ 480 VAC"], ["Installation Date", "Apr 15, 2024"], ["Installed By", "XECO Engineering Team"], ["Notes", "Main incoming ACB for TXFR-01"]]} /></div>;
}

function SwitchActionTiles() {
  return <div className="grid h-full grid-cols-7 gap-3 text-center text-[7.5px]">{[["▭", "Open Switch"], ["▣", "Close Switch"], ["↻", "Reset Trip Unit"], ["⚡", "Test Trip Unit"], ["⌁", "Maintenance Mode"], ["⇩", "Download Logs"], ["⇧", "Update Firmware"]].map(([icon, label]) => <button className="flex flex-col items-center justify-center gap-1 rounded border border-cyan-300/12 bg-[#061421] leading-tight text-slate-200" key={label}><span className="block text-base leading-none">{icon}</span><span>{label}</span></button>)}</div>;
}

function SwitchQuickLinks() {
  return <div className="space-y-2 text-[9px] text-[#29b6f6]"><div>View One-Line Diagram →</div><div>View Electrical Network →</div><div>View Transformer (TXFR-01) →</div></div>;
}

function DeviceDetailScreen({ variant }: { variant: "gatewayDetail" | "meterDetail" | "repeaterDetail" | "switchDetail" }) {
  const isGateway = variant === "gatewayDetail";
  const isMeter = variant === "meterDetail";
  const isRepeater = variant === "repeaterDetail";
  const label = isGateway ? "Gateway" : isMeter ? "Meter" : isRepeater ? "Repeater" : "Switch";
  const activeHref = isGateway ? "/devices/gateways" : isMeter ? "/devices/meters" : isRepeater ? "/devices/repeaters" : "/devices/switches";
  const id = isGateway ? "GWF-00125" : isMeter ? "MTR-000125" : isRepeater ? "RPT-00067" : "SW-00048";
  return (
    <EcbsAppShell activeHref={activeHref}>
      <PortalFrame active={`${label} Detail`}>
        <div className="flex h-[58px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › {label}s › {id}</div><h1 className="text-xl font-light">{label} Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">Online</span></h1><p className="text-[9px] text-slate-400">{label} ID: {id} &nbsp; | &nbsp; Model: XECO {label} Pro 2.0 &nbsp; | &nbsp; Firmware: v2.3.8 &nbsp; | &nbsp; Last Seen: May 18, 2025 10:14:58 AM CDT</p></div>
          <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">← Back to {label}s</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">{isMeter || variant === "switchDetail" ? "Export Data" : `Restart ${label}`}</button><button className="rounded bg-[#1463ff] px-3 py-1.5">Configure {label}</button></div>
        </div>
        <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid grid-cols-7 gap-4 text-[9px]"><Info label="Site" value="Flex Tijuana Manufacturing" /><Info label="Location" value={isRepeater ? "Electrical Room 2" : "Main Electrical Room"} /><Info label={isRepeater ? "Parent Gateway" : isGateway ? "IP Address" : "Electrical Network"} value={isRepeater ? "GWF-00125" : isGateway ? "10.20.15.25" : "TXFR-01 / Main Incoming"} /><Info label={isGateway || isRepeater ? "MAC Address" : "Gateway"} value={isGateway ? "00:1A:2B:3C:4D:5E" : isRepeater ? "00:1A:2B:3C:4D:67" : "GWF-00125 Online"} /><Info label="Uptime" value="23d 14h 42m 18s" /><Info label={isRepeater ? "Signal Strength" : variant === "switchDetail" ? "Status" : "Data Transmission"} value={isRepeater ? "Excellent" : variant === "switchDetail" ? "Closed" : "Good"} /><Info label={variant === "switchDetail" ? "Rated Current" : "Firmware"} value={variant === "switchDetail" ? "1600 A" : "v2.3.8"} /></div></section>
        <div className="flex h-[34px] gap-8 border-b border-cyan-300/10 pt-3 text-[10px]"><span className="border-b-2 border-[#05ff5e] text-[#05ff5e]">Overview</span><span>{isRepeater ? "Network & Connectivity" : "Real-Time"}</span><span>Historical Data</span><span>Performance</span><span>Events</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[0.78fr_0.82fr_1fr_0.6fr] gap-2">
          <div className="space-y-2 overflow-hidden"><DashboardPanel title={`${label} Status`} variant="enterprise"><MetricList rows={[[isMeter ? "Overall Status" : "Operational Status", "Online"], ["Power", "Normal"], [isGateway ? "Internet Connection" : isRepeater ? "Data Forwarding" : "Communication", isRepeater ? "Active" : "Connected"], ["Time Sync", "Synchronized"], ["Temperature", "42 °C / 107.6 °F"], ["CPU Usage", isGateway || isRepeater ? "18%" : "48%"], ["Memory Usage", isGateway || isRepeater ? "42%" : "Good"]]} /></DashboardPanel><DashboardPanel title={isRepeater ? "Connected Devices Summary" : isGateway ? "Connected Meters" : "Power Quality Snapshot"} variant="enterprise"><DonutSummary total={isRepeater ? "25" : isGateway ? "12" : "0.83"} rows={isRepeater ? [["Meters", "15"], ["Switches", "6"], ["Other Devices", "4"]] : isGateway ? [["Online", "12"], ["Offline", "0"], ["Warning", "0"]] : [["Power Factor", "0.83"], ["THD", "6.1%"], ["Unbalance", "0.7%"]]} /></DashboardPanel></div>
          <div className="space-y-2 overflow-hidden"><DashboardPanel title={isRepeater ? "Network Topology" : "Real-Time Electrical Values"} variant="enterprise">{isRepeater ? <div className="grid h-full place-items-center text-center text-[10px]"><div className="rounded border border-[#05ff5e] p-3">GWF-00125<br />↓<br />RPT-00067<br />↓<br />15 Meters | 6 Switches | 4 Devices</div></div> : <DeviceTable headers={["Parameter", "L1", "L2", "L3", "Total"]} rows={[["Voltage", "480.1", "479.5", "480.3", "480.0"], ["Current", "512.3", "498.7", "505.2", "1516"], ["kW", "238.6", "231.7", "242.9", "713.2"], ["kVA", "289.1", "283.6", "291.4", "864.1"], ["Power Factor", "0.83", "0.82", "0.83", "0.83"], ["Frequency", "60.02", "60.01", "60.01", "60.01"]]} />}</DashboardPanel><DashboardPanel title="Recent Events" variant="enterprise"><MetricList rows={[[`${label} Online`, "May 18, 2025 9:52 AM"], ["Configuration Updated", "May 17, 2025 11:43 PM"], ["Firmware Check Completed", "May 17, 2025 11:43 PM"], ["High Temperature Warning", "May 17, 2025 2:15 PM"]]} /></DashboardPanel></div>
          <div className="space-y-2 overflow-hidden"><DashboardPanel title={isGateway ? "Data Flow (Last 24 Hours)" : isRepeater ? "Throughput (Last 24 Hours)" : "Load Trend (Last 24 Hours)"} variant="enterprise"><TrendChart /><div className="grid grid-cols-4 gap-3 text-[9px]"><Info label="Total Data In" value={isGateway ? "12.45 GB" : "2.48 Mbps"} /><Info label="Total Data Out" value={isGateway ? "3.21 GB" : "1.92 Mbps"} /><Info label="Peak" value={isRepeater ? "7.64 Mbps" : "1,024 A"} /><Info label="Average" value={isGateway ? "531 MB/hr" : "511 A"} /></div></DashboardPanel><DashboardPanel title="Performance (Last 7 Days)" variant="enterprise"><div className="grid grid-cols-4 gap-3"><Info label="CPU Usage" value="18%" /><Info label="Memory Usage" value="42%" /><Info label="Temperature" value="42 °C" /><Info label="Success Rate" value="99.8%" /></div><HealthChart /></DashboardPanel></div>
          <div className="space-y-2 overflow-hidden"><DashboardPanel title={`${label} Information`} variant="enterprise"><MetricList rows={[["Model", `XECO ${label} Pro 2.0`], ["Serial Number", `${id}-REV-B`], ["Firmware", "v2.3.8 (Latest)"], ["Hardware", "Rev B"], ["Installed By", "XECO Engineering Team"], ["Notes", `${label} installed at Flex Tijuana site`]]} /></DashboardPanel><DashboardPanel title="Actions" variant="enterprise"><MetricList rows={[[`Restart ${label}`, ""], ["Update Firmware", ""], ["Backup Configuration", ""], [`Export ${label} Diagnostics`, ""], [`Remove ${label}`, ""]]} /></DashboardPanel></div>
        </section>
      </PortalFrame>
    </EcbsAppShell>
  );
}

export function DeviceHealthDetailScreen() {
  return (
    <EcbsAppShell activeHref="/devices/gateways">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><div className="text-[12px] font-semibold uppercase tracking-wide text-slate-200">XECO Energy Intelligence Portal</div><div className="mt-2 text-[10px] text-slate-400">Home › Devices › Devices › XAPF-100-01 › <span className="text-slate-200">Device Health</span></div></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2 text-left"><span className="block text-[7px] text-slate-500">▣</span>May 11 - May 18, 2025<br /><span className="text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span></div>
        </header>

        <div className="mt-2 flex h-[34px] items-center justify-between">
          <div className="flex items-center gap-2"><h1 className="text-xl font-light">Device Health Detail</h1><span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">Healthy</span></div>
          <div className="flex gap-8 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">← Back to Devices</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Last 24 Hours⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export Health Report</button></div>
        </div>

        <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
          <div className="grid grid-cols-[76px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 text-[9px]">
            <div className="h-[58px] rounded bg-gradient-to-br from-slate-700 to-slate-950 p-3 text-[#05ff5e]">XECO</div>
            <div><div className="text-slate-500">Device Name</div><div className="mt-1 text-[14px] text-slate-100">XAPF-100-01</div><div className="mt-1 text-[8px] text-slate-400"><span className="text-[#05ff5e]">● Online</span> &nbsp; | &nbsp; Last Seen: May 18, 2025 10:14:58 AM CDT</div></div>
            <Info label="Device Type" value="XECO Active Power Filter" />
            <Info label="Site" value="Flex Tijuana Manufacturing" />
            <Info label="Location" value="Main Electrical Room" />
            <Info label="IP Address" value="10.20.15.78" />
            <Info label="Serial Number" value="XAPF10001A7B2C3" />
            <Info label="Firmware" value="v2.3.8 (Latest)" />
          </div>
        </section>

        <section className="mt-2 grid h-[92px] grid-cols-5 gap-2">
          <Kpi title="Overall Health Score" value="96 /100" detail="Excellent" tone="green" icon="ring" />
          <Kpi title="Uptime (Last 24 Hours)" value="100%" detail="No Downtime" tone="green" icon="clock" />
          <Kpi title="Critical Alarms" value="0" detail="No active critical alarms" tone="green" icon="shield" />
          <Kpi title="Warnings" value="1" detail="Requires attention" tone="yellow" icon="warning" />
          <Kpi title="Informational" value="2" detail="For your awareness" tone="cyan" icon="info" />
        </section>

        <section className="mt-2 grid h-[520px] min-h-0 grid-cols-[1.25fr_1fr] gap-2">
          <div className="space-y-2 overflow-hidden">
            <DashboardPanel className="h-[300px]" title="Health Overview" variant="enterprise"><HealthChart /></DashboardPanel>
            <section className="grid h-[212px] grid-cols-[0.78fr_1fr] gap-2">
              <DashboardPanel title="Environmental Conditions" variant="enterprise"><MetricList rows={[["Ambient Temperature", "25.4 °C"], ["Humidity", "38% RH"], ["Ventilation Status", "Normal"], ["Dust Level", "Low"], ["Enclosure Door", "Closed"]]} /></DashboardPanel>
              <DashboardPanel title="Alarms & Events (Last 24 Hours)" variant="enterprise"><MetricList rows={[["No Critical Alarms", "Great! No critical alarms detected."], ["High Internal Fan Speed", "Fan 2 operating above normal speed."], ["Configuration Updated", "Power quality thresholds updated."], ["Firmware Check Completed", "Device is running latest firmware."]]} /></DashboardPanel>
            </section>
          </div>
          <div className="space-y-2 overflow-hidden">
            <DashboardPanel className="h-[300px]" title="Component Status" variant="enterprise"><ComponentTable /></DashboardPanel>
            <section className="grid h-[212px] grid-cols-[1fr_0.9fr] gap-2">
              <DashboardPanel title="Device Information" variant="enterprise"><MetricList rows={[["Manufacturer", "XECO Energy Corporation"], ["Model", "XAPF-100"], ["Hardware Revision", "Rev B"], ["Installation Date", "Apr 24, 2025"], ["Installed By", "XECO Engineering Team"], ["Notes", "Installed on Main Switchgear Line Side"]]} /></DashboardPanel>
              <DashboardPanel title="Actions" variant="enterprise"><MetricList rows={[["Run Health Diagnostics", ""], ["Test Communication", ""], ["Reboot Device", ""], ["Check for Firmware Updates", ""], ["Generate Health Report", ""], ["Remove Device", ""]]} /></DashboardPanel>
            </section>
          </div>
        </section>

        <footer className="flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function DeviceSchedulingScreen() {
  const switches = [["SW-MAIN-01", "Air Circuit Breaker", "Main Switchgear MSB", "Online", "Auto (Always On)", true, true], ["SW-MAIN-02", "Molded Case Switch", "Substation A", "Online", "Auto (Always On)", true, false], ["SW-FEEDER-01", "Molded Case Switch", "Feeder A", "Online", "Auto (Time Schedule)", true, false], ["SW-FEEDER-02", "Molded Case Switch", "Feeder B", "Online", "Auto (Utility Based)", true, false], ["SW-PANEL-D1", "Disconnect Switch", "Panel D1", "Online", "Monitor (Always On)", false, false], ["SW-PANEL-A1", "Disconnect Switch", "Panel A1", "Warning", "Monitor (Always On)", false, false], ["SW-PANEL-A2", "Disconnect Switch", "Panel A2", "Online", "Monitor (Always On)", false, false], ["SW-PANEL-B1", "Molded Case Switch", "Panel B1", "Online", "Monitor (Always On)", false, false], ["SW-TRANS-01", "Transfer Switch", "Main Transformer", "Online", "Auto (Always On)", false, false], ["SW-TRANS-02", "Transfer Switch", "Backup Transformer", "Offline", "Monitor (Always On)", false, false], ["SW-ATS-01", "Automatic Transfer Switch", "Generator ATS", "Online", "Auto (Time Schedule)", false, false], ["SW-UPS-01", "Static Switch", "UPS System", "Online", "Auto (Always On)", false, false]] as const;
  return (
    <EcbsAppShell activeHref="/devices/switches">
      <PortalFrame active="Switches">
        <div className="h-[126px] border-b border-cyan-300/10 pt-4">
          <div className="text-[10px] text-slate-400">Devices › Switches</div>
          <h1 className="mt-1 text-xl font-light">Switches</h1>
          <p className="mt-1 text-[9px] text-slate-400">Monitor and manage all power switches and breakers at this site. Switches control power distribution and protect critical equipment.</p>
          <div className="mt-7 flex gap-10 text-[10px]"><span>Device Control</span><span className="border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]">Device Scheduling</span><span>Commissioning & Testing</span><span>Logs</span></div>
        </div>
        <section className="mt-2 grid h-[666px] min-h-0 grid-cols-[1.25fr_0.62fr_0.65fr] gap-2">
          <DashboardPanel title="1. Select Switches To Schedule" variant="enterprise"><SwitchScheduleSelector switches={switches} /></DashboardPanel>
          <DashboardPanel title="2. Set Schedule" variant="enterprise"><SwitchScheduleForm /></DashboardPanel>
          <DashboardPanel title="3. Review Schedule" variant="enterprise"><SwitchScheduleReview /></DashboardPanel>
        </section>
      </PortalFrame>
    </EcbsAppShell>
  );
}

function SwitchScheduleSelector({ switches }: { switches: readonly (readonly [string, string, string, string, string, boolean, boolean])[] }) {
  return <div className="h-[calc(100%-22px)]"><div className="mb-3 flex items-center justify-between"><p className="text-[9px] text-slate-400">Choose one or more switches to set ON/OFF schedules.</p><button className="w-[170px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left text-[9px] text-slate-400">⌕ &nbsp; Search switches...</button></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["", "Switch Name", "Type", "Location / Asset", "Status", "Current Mode"].map((header) => <th className="border-b border-white/8 pb-3 font-normal" key={header}>{header}</th>)}</tr></thead><tbody>{switches.map(([name, type, location, status, mode, selected, starred]) => <tr className="border-b border-white/5" key={name}><td className="py-[8px]"><span className={selected ? "grid size-4 place-items-center rounded bg-[#22c55e] text-[9px] text-[#03110a]" : "block size-4 rounded border border-slate-600"}>{selected ? "✓" : ""}</span></td><td className="py-[8px]"><span className="mr-2 inline-grid size-4 place-items-center rounded border border-[#05ff5e] text-[#05ff5e]">▣</span><span className="text-cyan-300">{name}</span>{starred ? <span className="ml-2 text-yellow-300">★</span> : null}</td><td>{type}</td><td>{location}</td><td className={status === "Offline" ? "text-red-400" : status === "Warning" ? "text-yellow-300" : "text-[#05ff5e]"}>● {status}</td><td>{mode}</td></tr>)}</tbody></table><div className="mt-6 flex items-center justify-between text-[9px]"><span className="text-[#05ff5e]">4 switches selected</span><span className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Select All</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Clear Selection</button></span></div></div>;
}

function SwitchScheduleForm() {
  return <div className="relative h-[calc(100%-22px)] overflow-hidden pb-12 text-[9px]"><p className="mb-3 text-slate-400">Choose how the selected switches should operate.</p><div className="mb-4"><div className="mb-2 text-slate-300">Schedule Type ⓘ</div><div className="space-y-3">{["Always On (24/7)", "Always Off", "Time Schedule", "Utility Based", "Capacity Based", "Manual Override"].map((item) => <div className="flex items-center gap-2" key={item}><span className={item === "Time Schedule" ? "grid size-4 place-items-center rounded-full border border-[#05ff5e] text-[#05ff5e]" : "block size-4 rounded-full border border-slate-500"}>{item === "Time Schedule" ? "●" : ""}</span>{item}</div>)}</div></div><div className="rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-2 font-semibold uppercase">Time Schedule</div><div className="mb-3 text-[8px] text-slate-400">Set the days and time range for operation.</div><div className="grid grid-cols-2 gap-3"><Field label="Start Time" value="06:00 AM   ◷" /><Field label="End Time" value="10:00 PM   ◷" /></div><div className="mt-3"><Field label="Time Zone" value="(GMT-07:00) Baja California⌄" /></div><div className="mt-3"><div className="mb-2 text-slate-400">Days of Week</div><div className="grid grid-cols-4 gap-2">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => <span className="flex items-center gap-2" key={day}><span className={index < 5 ? "grid size-4 place-items-center rounded bg-[#22c55e] text-[9px] text-[#03110a]" : "block size-4 rounded border border-slate-600"}>{index < 5 ? "✓" : ""}</span>{day}</span>)}</div></div><div className="mt-4 text-slate-500">Add Another Time Window (Optional)</div><div className="mt-2 grid grid-cols-2 gap-3"><Field label="Start Time" value="--:--   ◷" /><Field label="End Time" value="--:--   ◷" /></div><button className="mt-3 rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">+ Add Window</button></div><button className="absolute bottom-0 left-0 right-0 rounded bg-[#087a35] py-3 text-[10px] font-semibold">Apply Schedule to 4 Switches</button></div>;
}

function SwitchScheduleReview() {
  const selected = [["SW-MAIN-01", "Air Circuit Breaker · Main Switchgear MSB"], ["SW-MAIN-02", "Molded Case Switch · Substation A"], ["SW-FEEDER-01", "Molded Case Switch · Feeder A"], ["SW-FEEDER-02", "Molded Case Switch · Feeder B"]];
  return <div className="relative h-[calc(100%-22px)] overflow-hidden pb-12 text-[9px]"><p className="mb-2 text-slate-400">Review and confirm your schedule settings.</p><div className="rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-3 font-semibold uppercase">Selected Switches (4)</div><div className="space-y-3">{selected.map(([name, detail]) => <div className="grid grid-cols-[18px_22px_1fr] gap-3" key={name}><span className="mt-1 text-[#05ff5e]">●</span><span className="grid size-5 place-items-center rounded border border-slate-600 text-slate-400">▣</span><span><b>{name}</b><br /><span className="text-[8px] text-slate-400">{detail}</span></span></div>)}</div></div><div className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-3 font-semibold uppercase">Schedule Preview</div><div className="grid grid-cols-[76px_18px_1fr] gap-2"><span>06:00 AM</span><span className="h-10 border-l border-[#05ff5e]" /><span className="text-[#05ff5e]">ON</span><span>10:00 PM</span><span className="h-4 border-l border-red-400" /><span className="text-red-400">OFF</span></div><div className="mt-1 text-center text-slate-400">Mon, Tue, Wed, Thu, Fri</div></div><div className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-3 font-semibold uppercase">Next 5 Occurrences (Local Time)</div><div className="space-y-1.5">{["Tue, May 13", "Wed, May 14", "Thu, May 15", "Fri, May 16", "Mon, May 19"].map((day) => <div className="grid grid-cols-[1fr_70px_28px_70px_28px]" key={day}><span>{day}</span><span>06:00 AM</span><span className="text-[#05ff5e]">ON</span><span>10:00 PM</span><span className="text-red-400">OFF</span></div>)}</div></div><div className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-2 font-semibold uppercase">Schedule Status</div><div className="flex gap-3"><span>▣</span><span>This schedule will be active immediately after saving.</span></div></div><button className="absolute bottom-0 right-0 rounded border border-cyan-300/12 bg-[#061421] px-8 py-3">▣ &nbsp; View All Schedules</button></div>;
}

function DeviceCommissioningScreen() {
  return (
    <EcbsAppShell activeHref="/operations/commissioning">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[38px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]">
            <button className="w-[126px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button>
            <button className="w-[176px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Project</span>Flex Tijuana Manufacturing</button>
            <button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">May 12 - May 18, 2025</button>
            <span className="text-[#05ff5e]">● Online</span>
            <span className="text-red-400">♢</span>
            <span className="text-slate-400">?</span>
            <span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span>
            <span>John Smith<br /><span className="text-slate-400">OEM User</span></span>
          </div>
        </header>
        <div className="flex h-[72px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Clients › Flex Ltd. › Projects / Facilities › Flex Tijuana Manufacturing › Commissioning & Testing</div><h1 className="mt-1 text-xl font-light">Commissioning & Testing</h1><p className="mt-1 text-[9px] text-slate-400">Verify installation, test equipment performance, and complete project commissioning.</p></div>
          <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Download Test Forms</button><button className="rounded bg-[#087a35] px-5 py-2">◎ Complete Commissioning</button></div>
        </div>
        <CommissioningStepper />
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.33fr_0.78fr] gap-3">
          <div className="grid min-h-0 grid-rows-[252px_246px_1fr] gap-3 overflow-hidden">
            <DashboardPanel action="⟳ Refresh Status" title="Equipment Status" variant="enterprise"><DeviceTable headers={["Equipment", "Serial Number", "Status", "Communication", "Last Check"]} rows={[["XECO Line/Power Filter", "XPF-100-24-00123", "Online", "Connected", "May 18, 2025 09:15 AM"], ["Switch Gear Booster", "SGB-60-24-00098", "Online", "Connected", "May 18, 2025 09:15 AM"], ["Rack System (3-Phase)", "RACK-300-24-00456", "Online", "Connected", "May 18, 2025 09:15 AM"], ["Load Controller", "LC-24-00234", "Online", "Connected", "May 18, 2025 09:15 AM"], ["Bi-Directional Meter", "BDM-800-24-00111", "Online", "Connected", "May 18, 2025 09:15 AM"], ["Gateway", "GW-4G-24-00045", "Online", "Connected", "May 18, 2025 09:15 AM"]]} /></DashboardPanel>
            <DashboardPanel action="▧ View Historical Data" title={<span>Live Test Readings <b className="ml-4 rounded bg-[#063b27] px-2 py-1 text-[9px] text-[#05ff5e]">Testing Mode: ON</b></span>} variant="enterprise"><DeviceTable headers={["Parameter", "Baseline (OFF)", "Live Test (ON)", "Improvement", "Target", "Status"]} rows={[["Power Factor", "0.72", "0.98", "+36.1%", ">= 0.95", "Pass"], ["Total Harmonic Distortion (THD)", "18.6%", "4.2%", "-77.4%", "<= 5.0%", "Pass"], ["kVA Demand", "2,850 kVA", "2,120 kVA", "-25.6%", "Lower is better", "Pass"], ["kW", "1,980 kW", "1,920 kW", "-3.0%", "Lower is better", "Pass"], ["Voltage (L-L Avg)", "480.2 V", "479.1 V", "-0.2%", "± 5%", "Pass"], ["System Frequency", "59.97 Hz", "59.98 Hz", "+0.02%", "60 Hz ± 1%", "Pass"]]} /></DashboardPanel>
            <section className="grid min-h-0 grid-cols-[0.95fr_0.92fr] gap-3">
              <DashboardPanel title="Test Notes" variant="enterprise"><div className="relative h-full rounded border border-cyan-300/12 bg-[#03111c] p-3 text-[9px] text-slate-500">Enter test notes, observations, or comments...<span className="absolute bottom-3 right-3 text-slate-400">0 / 1000</span></div></DashboardPanel>
              <DashboardPanel title="Test Confirmation" variant="enterprise"><div className="space-y-3 text-[9px]"><label className="grid grid-cols-[16px_1fr] gap-2"><span className="mt-0.5 size-3 rounded border border-slate-600" /><span>I confirm that all tests have been performed in accordance with XECO commissioning procedures and the system is operating as expected.</span></label><div className="grid grid-cols-2 gap-3"><Field label="Tested By" value="John Smith" /><Field label="Date & Time" value="May 18, 2025 09:30 AM" /></div></div></DashboardPanel>
            </section>
          </div>
          <div className="grid min-h-0 grid-rows-[252px_1fr_54px] gap-3 overflow-hidden">
            <DashboardPanel title="Commissioning Progress" variant="enterprise"><CommissioningProgress /></DashboardPanel>
            <DashboardPanel title="Test Documentation" variant="enterprise"><TestDocumentation /></DashboardPanel>
            <div className="flex items-center justify-end gap-5 text-[10px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-8 py-3">← Previous Step</button><button className="rounded bg-[#087a35] px-9 py-3">Next Step →</button></div>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function CommissioningStepper() {
  const steps = [
    ["✓", "Pre-Commissioning Checklist", "Completed"],
    ["✓", "Installation Verification", "Completed"],
    ["3", "Testing & Validation", "In Progress"],
    ["4", "Performance Results", "Pending"],
    ["5", "Final Approval", "Pending"],
  ];
  return <div className="grid h-[76px] grid-cols-[1fr_56px_1fr_56px_1fr_56px_1fr_56px_1fr] items-center text-[10px]">{steps.flatMap(([number, title, status], index) => [<div className="flex items-center gap-3" key={title}><span className={index < 2 ? "grid size-8 place-items-center rounded-full bg-[#22c55e] text-white" : index === 2 ? "grid size-8 place-items-center rounded-full bg-[#05ff5e] text-[#02100a]" : "grid size-8 place-items-center rounded-full bg-slate-700 text-slate-200"}>{number}</span><span>{title}<br /><b className={index <= 2 ? "text-[#05ff5e]" : "text-slate-500"}>{status}</b></span></div>, index < steps.length - 1 ? <span className="h-px bg-slate-600" key={`${title}-line`} /> : null])}</div>;
}

function CommissioningProgress() {
  return <div className="grid h-full grid-cols-[154px_1fr] items-center gap-5"><div className="grid size-32 place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 60%, #29b6f6 60% 80%, #334155 80% 100%)" }}><span className="grid size-[88px] place-items-center rounded-full bg-[#061521] text-center text-2xl">60%<br /><b className="text-[10px] font-normal text-slate-300">Complete</b></span></div><div className="space-y-5 text-[10px]"><MetricList rows={[["Completed", "2"], ["In Progress", "1"], ["Pending", "2"]]} /><div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4"><Info label="Started On" value="May 17, 2025 02:30 PM" /><Info label="Target Completion" value="May 18, 2025 05:00 PM" /></div></div></div>;
}

function TestDocumentation() {
  const docs = [
    ["Pre-Commissioning Checklist", "Uploaded", ""],
    ["Commissioning Test Form", "Uploaded", ""],
    ["Site Photos", "Uploaded", "12 files uploaded"],
    ["Additional Documents", "Uploaded", "1-Line_Drawing_revA.pdf"],
  ];
  return <div className="space-y-2 text-[9px]">{docs.map(([title, status, detail]) => <div className="grid grid-cols-[18px_1fr_70px_28px] items-center gap-2 border-b border-white/5 pb-2" key={title}><span className="text-[#05ff5e]">▧</span><span>{title}{detail ? <><br /><span className="text-[8px] text-slate-500">{detail}</span></> : null}</span><b className="text-[#05ff5e]">{status}</b><button className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1">⇩</button></div>)}<div className="mt-4 rounded border border-dashed border-cyan-300/20 py-7 text-center text-[9px] text-slate-400">☁ &nbsp; Drag & drop files here or <span className="text-[#05ff5e]">Browse Files</span><br /><span className="text-[8px]">Accepted formats: PDF, JPG, PNG, DOCX (Max 20MB)</span></div></div>;
}

function CommissioningNextStepsScreen() {
  return (
    <EcbsAppShell activeHref="/operations/commissioning">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[38px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]">
            <button className="w-[126px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button>
            <button className="w-[176px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Project</span>Flex Tijuana Manufacturing</button>
            <button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 12 - May 18, 2025</button>
            <span className="text-[#05ff5e]">● Online</span>
            <span className="text-red-400">♢</span>
            <span className="text-slate-400">?</span>
            <span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span>
            <span>John Smith<br /><span className="text-slate-400">OEM User</span></span>
          </div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Clients › Flex Ltd. › Projects / Facilities › Flex Tijuana Manufacturing › Next Steps</div><h1 className="mt-1 text-xl font-light">Next Steps</h1><p className="mt-1 text-[9px] text-slate-400">Review project status and complete the remaining steps to move the project forward.</p></div>
        </div>
        <NextProjectSummary />
        <section className="mt-3 grid min-h-0 flex-1 grid-cols-[1.42fr_0.54fr] gap-3 overflow-hidden">
          <div className="grid min-h-0 grid-rows-[1fr_70px] gap-3 overflow-hidden">
            <DashboardPanel title="Recommended Next Steps" variant="enterprise"><RecommendedNextSteps /></DashboardPanel>
            <MovingForwardCta />
          </div>
          <div className="grid min-h-0 grid-rows-[1fr_188px] gap-3 overflow-hidden">
            <DashboardPanel title="Project Timeline" variant="enterprise"><ProjectTimeline /></DashboardPanel>
            <DashboardPanel title="Helpful Resources" variant="enterprise"><HelpfulResources /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function NextProjectSummary() {
  const items = [
    ["▣", "bg-[#147dff]", "Project Name", "Flex Tijuana Manufacturing"],
    ["▤", "bg-[#22c55e]", "Project ID", "PRJ-2025-00047"],
    ["▥", "bg-[#7c3aed]", "Site", "Flex Tijuana Facility"],
    ["▧", "bg-[#f59e0b]", "Current Stage", "Commissioning & Testing"],
    ["", "", "Overall Progress", "60% Complete"],
    ["▣", "bg-cyan-500", "Last Updated", "May 18, 2025 10:15 AM"],
  ];
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4"><h2 className="mb-4 text-[12px] font-semibold">Project Summary</h2><div className="grid grid-cols-[1.05fr_1fr_0.9fr_1fr_1fr_1fr] items-center gap-4 text-[9px]">{items.map(([icon, tone, label, value], index) => <div className="flex items-center gap-3" key={label}>{index === 4 ? <div className="grid size-16 place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 60%, #147dff 60% 70%, #334155 70% 100%)" }}><span className="grid size-12 place-items-center rounded-full bg-[#061521] text-[16px]">60%</span></div> : <span className={`grid size-8 place-items-center rounded-full ${tone} text-white`}>{icon}</span>}<span><span className="text-[8px] text-slate-500">{label}</span><br /><b className="text-slate-100">{value}</b></span></div>)}</div></section>;
}

function RecommendedNextSteps() {
  const steps = [
    ["1", "▤", "bg-[#22c55e]", "Generate Proposal", "Generate a detailed proposal based on the site assessment and system configuration.", "Completed", "View Proposal"],
    ["2", "▧", "bg-[#22c55e]", "Generate Site Assessment Reports", "Generate comprehensive site assessment reports including baseline and findings.", "Completed", "View Reports"],
    ["3", "⚒", "bg-[#147dff]", "Commissioning & Testing", "Verify installation, test equipment performance, and complete project commissioning.", "In Progress", "Continue"],
    ["4", "▥", "bg-[#7c3aed]", "Production Time", "Monitor production runtime, energy usage, and efficiency by production line and time period.", "Pending", "Start"],
    ["5", "$", "bg-[#f59e0b]", "Job Costing & Energy Invoicing", "Analyze costs, apply tariffs, and generate invoices for the project.", "Pending", "Start"],
    ["6", "▱", "bg-cyan-500", "Reports & Analytics", "Access project reports, performance analytics, and savings dashboards.", "Pending", "Start"],
    ["7", "▢", "bg-yellow-500", "Final Review & Approval", "Review all documentation and results for final approval and project closeout.", "Pending", "Start"],
  ];
  return <div className="relative space-y-0 text-[9px] before:absolute before:left-[22px] before:top-8 before:h-[386px] before:border-l before:border-dashed before:border-slate-600">{steps.map(([number, icon, tone, title, detail, status, action]) => <div className={status === "In Progress" ? "relative grid grid-cols-[52px_48px_1fr_90px_118px] items-center rounded-lg bg-[#0b3158]/60 p-3" : "relative grid grid-cols-[52px_48px_1fr_90px_118px] items-center border-b border-white/5 p-3"} key={title}><span className={status === "Completed" ? "z-10 grid size-6 place-items-center rounded-full border border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : status === "In Progress" ? "z-10 grid size-6 place-items-center rounded-full border border-[#147dff] bg-[#08233c] text-[#29b6f6]" : "z-10 grid size-6 place-items-center rounded-full border border-slate-500 bg-[#061521] text-slate-300"}>{number}</span><span className={`grid size-9 place-items-center rounded-full ${tone} text-[16px] text-white`}>{icon}</span><span><b className="text-slate-100">{title}</b><br /><span className="text-[8px] text-slate-400">{detail}</span></span><b className={status === "Completed" ? "justify-self-start rounded bg-[#063b27] px-2 py-1 text-[#05ff5e]" : status === "In Progress" ? "justify-self-start rounded bg-[#0b3158] px-2 py-1 text-blue-300" : "justify-self-start rounded bg-slate-800 px-2 py-1 text-slate-400"}>{status}</b><button className="justify-self-end rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-slate-200">{action} &nbsp; →</button></div>)}</div>;
}

function ProjectTimeline() {
  const rows = [
    ["✓", "Project Created", "May 10, 2025 09:20 AM", "done"],
    ["✓", "Proposal Generated", "May 12, 2025 02:30 PM", "done"],
    ["✓", "Site Assessment Reports", "May 13, 2025 11:15 AM", "done"],
    ["4", "Commissioning & Testing", "In Progress", "active"],
    ["5", "Production Time", "Pending", "pending"],
    ["6", "Job Costing & Invoicing", "Pending", "pending"],
    ["7", "Reports & Analytics", "Pending", "pending"],
    ["8", "Final Review & Approval", "Pending", "pending"],
  ];
  return <div className="relative space-y-3 text-[9px] before:absolute before:left-[14px] before:top-5 before:h-[300px] before:border-l before:border-dashed before:border-slate-600">{rows.map(([marker, title, detail, state]) => <div className="relative grid grid-cols-[32px_1fr] gap-2" key={title}><span className={state === "done" ? "z-10 grid size-5 place-items-center rounded-full border border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : state === "active" ? "z-10 grid size-5 place-items-center rounded-full border border-[#147dff] bg-[#08233c] text-[#29b6f6]" : "z-10 grid size-5 place-items-center rounded-full border border-slate-500 bg-[#061521] text-slate-300"}>{marker}</span><span><b className="block text-slate-200">{title}</b><span className={state === "active" ? "text-[#29b6f6]" : state === "pending" ? "text-slate-400" : "text-slate-400"}>{detail}</span></span></div>)}</div>;
}

function HelpfulResources() {
  const rows = [["▻", "Training Videos", "View step-by-step training videos"], ["▤", "User Guides", "Access user manuals and guides"], ["?", "Knowledge Base", "Browse frequently asked questions"], ["◌", "Contact Support", "Get help from our support team"]];
  return <div className="space-y-2 text-[9px]">{rows.map(([icon, title, detail]) => <div className="grid grid-cols-[24px_1fr_12px] items-center gap-2" key={title}><span className="grid size-5 place-items-center rounded-full border border-cyan-300/30 text-cyan-300">{icon}</span><span><b className="text-slate-200">{title}</b><br /><span className="text-[8px] text-slate-400">{detail}</span></span><span>›</span></div>)}</div>;
}

function MovingForwardCta() {
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 text-[10px]"><span className="grid size-10 place-items-center rounded-full bg-[#0b3158] text-[20px]">↗</span><span><b>Keep your project moving forward!</b><br /><span className="text-slate-400">Complete the current step to unlock the next phase and ensure a successful deployment.</span></span><button className="rounded bg-[#087a35] px-9 py-2">Continue Commissioning & Testing →</button></div></section>;
}

function JobCostingScreen({ variant }: { variant: "jobCosting" | "jobInvoices" | "jobProductionTime" | "jobReports" }) {
  if (variant === "jobProductionTime") return <ProductionTimeScreen />;
  if (variant === "jobInvoices") return <InvoicesScreen />;
  if (variant === "jobReports") return <JobReportsScreen />;
  return <JobCostingMainScreen />;
}

function JobCostingMainScreen() {
  return (
    <EcbsAppShell activeHref="/financials/job-costing-invoicing">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <JobCostingHeader />
        <JobCostingTabs active="Job Costing" />
        <section className="mt-2 grid h-[318px] grid-cols-[0.66fr_0.58fr_1.35fr] gap-2">
          <DashboardPanel title="1. Select Context" variant="enterprise"><JobContextForm /></DashboardPanel>
          <DashboardPanel title="2. Energy Data Source" variant="enterprise"><EnergySourceForm /></DashboardPanel>
          <div className="grid min-h-0 grid-rows-[74px_1fr] gap-2">
            <section className="grid grid-cols-4 gap-2">
              <JobKpi icon="ϟ" label="Total kWh" value="87,652" detail="100% of Selected Period" tone="blue" />
              <JobKpi icon="▥" label="Total kVAh" value="103,419" detail="100% of Selected Period" tone="green" />
              <JobKpi icon="⌁" label="Peak Demand" value="412 kW" detail="May 7, 10:00 AM" tone="yellow" />
              <JobKpi icon="$" label="Total Cost" value="$8,742.36" detail="100% of Selected Period" tone="purple" />
            </section>
            <DashboardPanel title="3. Energy Allocation Summary" variant="enterprise"><EnergyAllocationSummary /></DashboardPanel>
          </div>
        </section>
        <section className="mt-2 grid h-[190px] grid-cols-[1fr_0.72fr_0.82fr] gap-2">
          <DashboardPanel title="4. Job Costing Results (Production Line 1 - JOB-1001)" variant="enterprise"><JobCostingResults /></DashboardPanel>
          <DashboardPanel title="5. Production Time Filter" variant="enterprise"><ProductionTimeFilter /></DashboardPanel>
          <DashboardPanel title="6. Cost Breakdown" variant="enterprise"><CostBreakdown /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[214px] min-h-0 grid-cols-[1fr_0.9fr_0.48fr] gap-2">
          <DashboardPanel title="7. Cost Allocation By Cost Center (All Jobs)" variant="enterprise"><CostCenterTable /></DashboardPanel>
          <DashboardPanel title="8. Cost Trends" variant="enterprise"><JobCostTrend /></DashboardPanel>
          <DashboardPanel title="9. Actions" variant="enterprise"><JobActions /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function JobCostingHeader({ section = "Production Time", leaf = "Job Costing" }: { leaf?: string; section?: string }) {
  return <header className="flex h-[46px] items-center justify-between"><div><h1 className="text-lg font-light">Job Costing & Energy Invoicing</h1><div className="mt-1 text-[10px] text-slate-400">Financials › Job Costing & Energy Invoicing › {section} › <span className="text-slate-200">{leaf}</span></div></div><div className="flex items-center gap-3 text-[9px]"><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">⌂ Flex Tijuana⌄</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 1 - May 12, 2025⌄</button><span className="text-[#05ff5e]">● Online</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#334155]">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div></header>;
}

function JobCostingTabs({ active, primaryAction = "Save Changes", secondaryAction = "⇩ Export Report" }: { active: string; primaryAction?: string; secondaryAction?: string }) {
  return <div className="flex h-[32px] items-end justify-between border-b border-cyan-300/10"><div className="flex gap-8 text-[10px]">{["Overview", "Job Costing", "Production Time", "Rates & Tariffs", "Payments / Invoices", "Reports"].map((tab) => <span className={tab === active ? "border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]" : "pb-2 text-slate-300"} key={tab}>{tab}</span>)}</div><div className="mb-1 flex gap-2 text-[9px]">{secondaryAction ? <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5">{secondaryAction}</button> : null}<button className="rounded bg-[#087a35] px-4 py-1.5">{primaryAction}</button></div></div>;
}

function JobKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "cyan" | "gray" | "green" | "purple" | "yellow"; value: string }) {
  const color = tone === "blue" ? "bg-[#147dff]" : tone === "green" ? "bg-[#16a34a]" : tone === "yellow" ? "bg-[#f59e0b]" : tone === "cyan" ? "bg-[#06b6d4]" : tone === "gray" ? "bg-slate-600" : "bg-[#7c3aed]";
  return <article className="grid grid-cols-[34px_1fr] items-center gap-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><span className={`grid size-8 place-items-center rounded-full ${color} text-[16px] text-white`}>{icon}</span><span><span className="text-[8px] uppercase text-slate-400">{label}</span><br /><b className="text-[18px] font-light text-slate-100">{value}</b><br /><span className="text-[8px] text-slate-400">{detail}</span></span></article>;
}

function JobContextForm() {
  const rows = [["Site / Deployment", "Flex Tijuana"], ["Switch / Circuit", "SW-MAIN-01 (Main Switchgear MSB)"], ["Associated Meter", "PQ Meter (Main)"], ["Department / Area", "Production"]];
  return <div className="space-y-2 text-[9px]"><p className="text-[8px] text-slate-400">Choose site, devices, and cost allocation context.</p>{rows.map(([label, value]) => <Field key={label} label={label} value={`${value}⌄`} />)}<div className="grid grid-cols-2 gap-2"><Field label="Production Line / Cost Center" value="Production Line 1⌄" /><Field label="Job / Work Order (Optional)" value="JOB-1001⌄" /></div><Field label="Shift" value="Day Shift (6AM - 6PM)⌄" /></div>;
}

function EnergySourceForm() {
  return <div className="space-y-2 text-[9px]"><p className="text-[8px] text-slate-400">Select data and configuration for allocation.</p><Field label="Data Source" value="PQ Meter (Main)⌄" /><Field label="Data Type" value="Billed Data (Utility Meter)⌄" /><Field label="Date Range" value="May 1, 2025        →    May 12, 2025  ▣" /><Field label="Time Zone" value="(GMT-07:00) Baja California⌄" /><div className="rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px] text-slate-400"><span className="text-sky-400">ⓘ</span> Only utility (billed) energy usage is included in job costing.<br />Non-production time usage can be excluded in settings.</div></div>;
}

function EnergyAllocationSummary() {
  const rows = [["Production Line 1 (JOB-1001)", "62.4%", "$5,451.63"], ["Chiller Plant (JOB-1002)", "18.7%", "$1,634.22"], ["Packaging Line (JOB-1003)", "9.3%", "$810.96"], ["Warehouse (JOB-1004)", "5.1%", "$445.11"], ["Office Building (JOB-1005)", "2.8%", "$245.54"], ["Other / Unallocated", "1.7%", "$154.90"]];
  return <div className="grid h-full grid-cols-[190px_1fr] items-center gap-5"><div className="grid size-36 place-items-center rounded-full" style={{ background: "conic-gradient(#147dff 0 62%, #22c55e 62% 81%, #f59e0b 81% 90%, #7c3aed 90% 95%, #06b6d4 95% 98%, #64748b 98% 100%)" }}><span className="grid size-24 place-items-center rounded-full bg-[#061521] text-center text-lg">$8,742.36<br /><b className="text-[9px] font-normal text-slate-400">Total Cost</b></span></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr><th className="pb-2">Cost Center / Job</th><th className="pb-2 text-right">kWh</th><th className="pb-2 text-right">kW (Peak)</th><th className="pb-2 text-right">Cost</th></tr></thead><tbody>{rows.map(([name, pct, cost]) => <tr className="border-t border-white/5" key={name}><td className="py-2">{name}</td><td className="py-2 text-right">{pct}</td><td className="py-2 text-right">{pct}</td><td className="py-2 text-right">{cost}</td></tr>)}</tbody></table></div>;
}

function JobCostingResults() {
  return <><p className="mb-2 text-[8px] text-slate-400">Detailed energy and cost allocation for selected job / cost center.</p><DeviceTable headers={["Metric", "Value", "Unit", "% of Total", "Rate", "Cost"]} rows={[["Energy (kWh)", "54,689", "kWh", "62.4%", "$0.05645 /kWh", "$3,085.96"], ["Demand (kW)", "257", "kW", "62.4%", "$20.62 /kW", "$5,296.34"], ["kVAh", "64,378", "kVAh", "62.2%", "-", "-"], ["Power Factor (Avg)", "0.94", "PF", "-", "Target: 0.95", "-"], ["THD (Avg)", "3.2", "%", "-", "Target: <5%", "-"]]} /><div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-[10px]"><span>Total Cost Allocated</span><b className="text-[#05ff5e]">$8,382.30</b></div></>;
}

function ProductionTimeFilter() {
  return <div className="space-y-2 text-[9px]"><p className="text-[8px] text-slate-400">Define production time included in allocation.</p><Field label="Schedule" value="Production Schedule - Day Shift⌄" /><Field label="Production Time" value="May 1, 2025 6:00 AM  →  May 12, 2025 6:00 PM" /><MetricList rows={[["Included Time", "87.5% (210.00 hrs)"], ["Excluded Time", "12.5% (30.00 hrs)"], ["Total Time", "240.00 hrs"]]} /><button className="float-right rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5 text-[9px]">View / Edit Production Time</button></div>;
}

function CostBreakdown() {
  return <div className="text-[9px]"><p className="mb-3 text-[8px] text-slate-400">Breakdown of costs for selected job / cost center.</p><table className="w-full text-left"><thead className="text-slate-500"><tr><th className="pb-2">Cost Component</th><th className="pb-2 text-right">Amount (USD)</th><th className="pb-2 text-right">% of Total Cost</th></tr></thead><tbody>{[["Energy Cost (kWh)", "$3,085.96", "36.8%"], ["Demand Cost (kW)", "$5,296.34", "63.2%"], ["Other Charges", "$0.00", "0.0%"]].map(([label, value, pct]) => <tr className="border-t border-white/5" key={label}><td className="py-3">{label}</td><td className="text-right">{value}</td><td className="text-right">{pct}</td></tr>)}</tbody></table><div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-[11px]"><span>Total Cost</span><b className="text-[#05ff5e]">$8,382.30</b><span>100%</span></div></div>;
}

function JobCostTrend() {
  return <div className="h-full"><p className="mb-2 text-[8px] text-slate-400">Daily cost trend for selected job.</p><div className="mb-1 text-right text-[8px] text-[#05ff5e]">━ Production Line 1 (JOB-1001)</div><svg className="h-[142px] w-full" viewBox="0 0 420 142"><g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[20, 50, 80, 110, 140].map((y) => <line key={y} x1="26" x2="414" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="23">$1,000</text><text x="9" y="53">$800</text><text x="9" y="83">$600</text><text x="9" y="113">$400</text><text x="14" y="140">$0</text></g><polyline fill="none" points="28,112 64,88 100,92 136,102 172,83 208,78 244,54 280,72 316,85 352,66 386,83 414,72" stroke="#22c55e" strokeWidth="2" /><g fill="#22c55e">{[["28","112"],["64","88"],["100","92"],["136","102"],["172","83"],["208","78"],["244","54"],["280","72"],["316","85"],["352","66"],["386","83"],["414","72"]].map(([x,y]) => <circle cx={x} cy={y} key={`${x}-${y}`} r="3" />)}</g></svg><div className="flex justify-between pl-8 text-[8px] text-slate-400"><span>May 1</span><span>May 3</span><span>May 5</span><span>May 7</span><span>May 9</span><span>May 11</span></div></div>;
}

function JobActions() {
  const rows = ["Generate Job Costing Report", "Export to Excel", "Create Invoice", "Manage Cost Centers", "View Historical Job Costs"];
  return <div className="space-y-1.5 text-[9px]">{rows.map((row, index) => <button className="grid w-full grid-cols-[22px_1fr_12px] items-center rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5 text-left" key={row}><span>{["▤", "▧", "$", "♙", "◷"][index]}</span><span>{row}</span><span>›</span></button>)}</div>;
}

function InvoicesScreen() {
  return (
    <EcbsAppShell activeHref="/financials/job-costing-invoicing">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <JobCostingHeader leaf="Payments / Invoices" section="Payments / Invoices" />
        <JobCostingTabs active="Payments / Invoices" primaryAction="+ Create Invoice" secondaryAction="⇩ Export Invoices" />
        <section className="mt-2 grid h-[92px] grid-cols-6 gap-2">
          <JobKpi icon="▤" label="Total Invoices" value="26" detail="This Period" tone="blue" />
          <JobKpi icon="$" label="Total Invoiced" value="$84,752.36" detail="This Period" tone="green" />
          <JobKpi icon="▧" label="Total Payments" value="$67,285.14" detail="This Period" tone="purple" />
          <JobKpi icon="◷" label="Outstanding" value="$17,467.22" detail="This Period" tone="yellow" />
          <JobKpi icon="▥" label="Past Due" value="$3,215.00" detail="This Period" tone="cyan" />
          <JobKpi icon="%" label="Collection Rate" value="79.3%" detail="This Period" tone="gray" />
        </section>
        <section className="mt-2 grid h-[34px] grid-cols-[1fr_116px_126px_126px_146px_82px] gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-400">⌕ &nbsp; Search invoices...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">Status: All⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">Invoice Type: All⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">Cost Center: All⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">▣ May 1 - May 12, 2025⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">▽ Filters</button></section>
        <section className="mt-2 grid h-[620px] min-h-0 grid-cols-[1.48fr_0.62fr] gap-2">
          <DashboardPanel title="Invoices (26)" variant="enterprise"><InvoiceList /></DashboardPanel>
          <div className="grid min-h-0 grid-rows-[250px_214px_1fr] gap-2 overflow-hidden">
            <DashboardPanel title={<span className="flex items-center justify-between">Invoice Details <b className="rounded bg-[#063b27] px-2 py-1 text-[8px] text-[#05ff5e]">Paid</b></span>} variant="enterprise"><InvoiceDetails /></DashboardPanel>
            <DashboardPanel title="Line Items" variant="enterprise"><InvoiceLineItems /></DashboardPanel>
            <DashboardPanel title="Payment History" variant="enterprise"><PaymentHistory /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function InvoiceList() {
  const rows = [
    ["INV-2025-0057", "May 12, 2025", "Production Line 1\nManufacturing", "JOB-1001", "May 1 - May 12, 2025", "$8,742.36", "Paid", "May 27, 2025"],
    ["INV-2025-0056", "May 9, 2025", "Chiller Plant\nUtilities", "JOB-1002", "Apr 26 - May 9, 2025", "$1,634.22", "Paid", "May 24, 2025"],
    ["INV-2025-0055", "May 9, 2025", "Packaging Line\nManufacturing", "JOB-1003", "Apr 26 - May 9, 2025", "$810.96", "Sent", "May 24, 2025"],
    ["INV-2025-0054", "May 8, 2025", "Warehouse\nOperations", "JOB-1004", "Apr 26 - May 8, 2025", "$445.11", "Pending", "May 23, 2025"],
    ["INV-2025-0053", "May 7, 2025", "Office Building\nAdministrative", "JOB-1005", "Apr 26 - May 7, 2025", "$245.54", "Paid", "May 22, 2025"],
    ["INV-2025-0052", "May 6, 2025", "Maintenance Shop\nMaintenance", "JOB-1006", "Apr 26 - May 6, 2025", "$154.90", "Sent", "May 21, 2025"],
    ["INV-2025-0051", "May 5, 2025", "Production Line 1\nManufacturing", "JOB-1001", "Apr 19 - Apr 25, 2025", "$8,215.47", "Paid", "May 20, 2025"],
    ["INV-2025-0050", "May 5, 2025", "Chiller Plant\nUtilities", "JOB-1002", "Apr 19 - Apr 25, 2025", "$1,589.75", "Paid", "May 20, 2025"],
    ["INV-2025-0049", "May 4, 2025", "Packaging Line\nManufacturing", "JOB-1003", "Apr 19 - Apr 25, 2025", "$798.40", "Pending", "May 19, 2025"],
    ["INV-2025-0048", "May 2, 2025", "Warehouse\nOperations", "JOB-1004", "Apr 19 - Apr 24, 2025", "$438.92", "Overdue", "May 17, 2025"],
  ];
  return <div className="h-full text-[9px]"><div className="mb-3 flex justify-end gap-2"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">Sort by: Invoice Date (Newest)⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">☷</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">▦</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["", "Invoice #", "Invoice Date", "Customer / Cost Center", "Job / Work Order", "Period", "Amount", "Status", "Due Date", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}><td className="py-[7px]"><span className="inline-block size-3 rounded border border-slate-600" /></td>{row.map((cell, index) => <td className={index === 0 ? "py-[7px] text-cyan-300" : "py-[7px] text-slate-300"} key={`${row[0]}-${index}`}>{index === 2 ? cell.split("\n").map((part) => <span className={part === cell.split("\n")[1] ? "block text-[8px] text-slate-500" : "block"} key={part}>{part}</span>) : index === 6 ? <InvoiceStatus status={cell} /> : cell}</td>)}<td className="py-[7px] text-slate-300">⋮</td></tr>)}</tbody></table><div className="mt-4 flex items-center justify-between text-[9px] text-slate-400"><span>Showing 1 to 10 of 26 invoices</span><span>‹ &nbsp; <b className="rounded border border-[#05ff5e] px-3 py-2 text-[#05ff5e]">1</b> &nbsp; 2 &nbsp; 3 &nbsp; ›</span></div></div>;
}

function InvoiceStatus({ status }: { status: string }) {
  const cls = status === "Paid" ? "border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : status === "Sent" ? "border-sky-400 bg-[#08233c] text-sky-300" : status === "Overdue" ? "border-red-400 bg-red-950/50 text-red-300" : "border-yellow-300 bg-yellow-950/40 text-yellow-300";
  return <span className={`rounded border px-2 py-0.5 text-[8px] ${cls}`}>{status}</span>;
}

function InvoiceDetails() {
  const fields = [["Customer / Cost Center", "Production Line 1\nManufacturing"], ["Invoice Type", "Energy Usage"], ["Job / Work Order", "JOB-1001"], ["Period", "May 1 - May 12, 2025"], ["Invoice Date", "May 12, 2025"], ["PO / Reference", "PO-77821"], ["Due Date", "May 27, 2025"], ["Payment Terms", "Net 15"]];
  return <div className="text-[9px]"><div className="mb-4 flex items-start justify-between"><div><h3 className="text-[16px] font-light">INV-2025-0057</h3></div><div className="flex gap-3 text-[9px]"><span>▧ PDF</span><span>✉ Email</span><span>▣ Print</span><span>⋮</span></div></div><div className="grid grid-cols-2 gap-x-5 gap-y-3">{fields.map(([label, value]) => <div key={label}><div className="text-[8px] text-slate-500">{label}</div><div className="mt-1 whitespace-pre-line text-[#05ff5e]">{value}</div></div>)}</div></div>;
}

function InvoiceLineItems() {
  const rows = [["Energy Usage (kWh)", "54,689", "-", "$3,085.96"], ["Demand (kW)", "257", "412", "$3,296.34"], ["Power Factor Adjustment", "-", "-", "$210.50"], ["Other Charges", "-", "-", "$149.56"]];
  return <div className="text-[8px]"><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Description", "kWh", "kW (Peak)", "Amount (USD)"].map((header) => <th className="pb-1 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={index === 3 ? "py-1 text-right text-slate-200" : "py-1 text-slate-300"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 space-y-0.5 border-t border-white/10 pt-1"><div className="flex justify-between"><span>Subtotal</span><b>$8,742.36</b></div><div className="flex justify-between"><span>Tax (0%)</span><b>$0.00</b></div><div className="flex justify-between text-[9px] uppercase"><span>Total</span><b className="text-[#05ff5e]">$8,742.36</b></div></div></div>;
}

function PaymentHistory() {
  return <div className="text-[8.5px]"><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Date", "Type", "Reference #", "Amount", "Status"].map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{[["May 12, 2025", "ACH Payment", "ACH-55421", "$8,742.36", "Completed"], ["May 12, 2025", "Payment Applied", "-", "$8,742.36", "Applied"]].map((row) => <tr className="border-t border-white/5" key={row[1]}>{row.map((cell, index) => <td className={index === 4 ? "py-1.5 text-[#05ff5e]" : "py-1.5 text-slate-300"} key={`${row[1]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table><button className="mt-2 w-full rounded border border-cyan-300/12 bg-[#061421] py-1.5">View Invoice History</button></div>;
}

function ProductionTimeScreen() {
  return (
    <EcbsAppShell activeHref="/financials/job-costing-invoicing">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <JobCostingHeader leaf="Production Time" section="Production Time" />
        <JobCostingTabs active="Production Time" primaryAction="Save Changes" secondaryAction="" />
        <section className="mt-2 grid h-[126px] grid-cols-[1.3fr_0.78fr] gap-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
          <div><h2 className="text-[12px] font-semibold uppercase">Production Time Configuration</h2><p className="mt-1 text-[9px] text-slate-400">Define where energy usage is considered Production Time for job costing and invoicing.</p><div className="mt-4 grid grid-cols-2 gap-4"><Field label="Select Site / Deployment" value="Flex Tijuana⌄" /><Field label="Time Zone" value="(GMT-07:00) Baja California⌄" /></div></div>
          <div className="rounded border border-cyan-300/12 bg-[#061421] p-4 text-[9px] text-slate-400"><span className="mr-2 text-sky-400">ⓘ</span>Only energy usage during Production Time will be included in job costing and invoicing for Production-related jobs. Non-Production Time usage can be excluded or billed under a different rate if configured.</div>
        </section>
        <section className="mt-2 grid h-[400px] min-h-0 grid-cols-[0.62fr_1.12fr_0.8fr] gap-2">
          <DashboardPanel title="1. Select Jobs" variant="enterprise"><ProductionJobSelector /></DashboardPanel>
          <DashboardPanel title="2. Set Production Time" variant="enterprise"><WeeklyProductionTime /></DashboardPanel>
          <DashboardPanel title="3. Summary" variant="enterprise"><ProductionSummary /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[238px] min-h-0 grid-cols-[0.9fr_0.72fr_0.72fr] gap-2">
          <DashboardPanel title="4. Exceptions (Holidays / Downtime)" variant="enterprise"><ProductionExceptions /></DashboardPanel>
          <DashboardPanel title="5. Preview Calendar" variant="enterprise"><ProductionCalendar /></DashboardPanel>
          <DashboardPanel title="6. Apply Settings" variant="enterprise"><ProductionApplySettings /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function ProductionJobSelector() {
  const jobs = [["JOB-1001", "Production Line 1", true], ["JOB-1002", "Chiller Plant", true], ["JOB-1003", "Packaging Line", true], ["JOB-1004", "Warehouse", false], ["JOB-1005", "Office Building", false], ["JOB-1006", "Maintenance Shop", false]] as const;
  return <div className="text-[9px]"><p className="mb-3 text-slate-400">Choose one or more jobs to set production time.</p><div className="mb-3 grid grid-cols-[1fr_auto] gap-2"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left text-slate-400">⌕ &nbsp; Search jobs...</button><button className="px-2 text-[#29b6f6]">Select All</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr><th className="pb-2"></th><th className="pb-2">Job ID</th><th className="pb-2">Job Name</th></tr></thead><tbody>{jobs.map(([id, name, checked]) => <tr className="border-t border-white/5" key={id}><td className="py-2"><span className={checked ? "grid size-4 place-items-center rounded bg-[#22c55e] text-[#02100a]" : "grid size-4 rounded border border-slate-600"}>{checked ? "✓" : ""}</span></td><td className="py-2">{id}</td><td className="py-2">{name}</td></tr>)}</tbody></table><p className="mt-4 text-[#05ff5e]">3 jobs selected</p></div>;
}

function WeeklyProductionTime() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return <div className="text-[9px]"><p className="mb-3 text-slate-400">Choose how production time is defined.</p><div className="mb-4 flex gap-8 border-b border-cyan-300/10 text-[9px]"><span className="border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]">Weekly Schedule</span><span>Date Range</span><span>Shift Based</span><span>Custom Calendar</span></div><p className="mb-2 text-slate-400">Define weekly recurring production time.</p><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Day of Week", "Production Start", "Production End", "Breaks (Optional)", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{days.map((day, index) => <tr className="border-t border-white/5" key={day}><td className="py-1.5"><span className={index < 5 ? "mr-2 inline-grid size-4 place-items-center rounded bg-[#22c55e] text-[#02100a]" : "mr-2 inline-block size-4 rounded border border-slate-600 align-middle"}>{index < 5 ? "✓" : ""}</span>{day}</td><td><button className="rounded border border-cyan-300/12 bg-[#03111c] px-5 py-1">{index < 5 ? "06:00 AM  ◷" : "—"}</button></td><td><button className="rounded border border-cyan-300/12 bg-[#03111c] px-5 py-1">{index < 5 ? "06:00 PM  ◷" : "—"}</button></td><td><button className="rounded border border-cyan-300/12 bg-[#03111c] px-5 py-1">{index < 5 ? "12:00 PM – 01:00 PM" : "—"}</button></td><td className="text-slate-300">▧ &nbsp; <span className="text-red-400">▢</span></td></tr>)}</tbody></table><button className="mt-3 rounded border border-sky-400/25 bg-[#061421] px-4 py-2 text-[#29b6f6]">+ Add Break</button><p className="mt-3 text-[8px] text-slate-400">All times are in (GMT-07:00) Baja California</p></div>;
}

function ProductionSummary() {
  return <div className="space-y-2 text-[8.5px]"><p className="text-slate-400">Review production time settings.</p><div className="rounded border border-cyan-300/12 bg-[#061421] p-2.5"><b>Selected Jobs (3)</b><div className="mt-1.5 space-y-1">{["JOB-1001      Production Line 1", "JOB-1002      Chiller Plant", "JOB-1003      Packaging Line"].map((row) => <div className="text-slate-300" key={row}><span className="mr-2 text-[#05ff5e]">●</span>{row}</div>)}</div></div><div className="rounded border border-cyan-300/12 bg-[#061421] p-2.5"><b>Weekly Production Schedule</b><div className="mt-1.5 space-y-0.5 text-slate-300">{["Mon  06:00 AM – 06:00 PM (Break: 12:00 PM – 01:00 PM)", "Tue  06:00 AM – 06:00 PM (Break: 12:00 PM – 01:00 PM)", "Wed  06:00 AM – 06:00 PM (Break: 12:00 PM – 01:00 PM)", "Thu  06:00 AM – 06:00 PM (Break: 12:00 PM – 01:00 PM)", "Fri  06:00 AM – 06:00 PM (Break: 12:00 PM – 01:00 PM)", "Sat  Not Set", "Sun  Not Set"].map((row) => <div key={row}>{row}</div>)}</div></div><div className="space-y-0.5"><b>What happens outside production time?</b><div><span className="text-[#05ff5e]">◉</span> Exclude from job costing & invoicing</div><div><span className="text-slate-500">○</span> Bill at different rate (Non-Production Rate)</div><div><span className="text-slate-500">○</span> Include at same rate</div></div></div>;
}

function ProductionExceptions() {
  const rows = [["May 26, 2025", "Holiday", "Memorial Day", "All Selected Jobs"], ["Jul 04, 2025", "Holiday", "Independence Day", "All Selected Jobs"], ["Dec 25, 2025", "Holiday", "Christmas Day", "All Selected Jobs"], ["Dec 31, 2025", "Downtime", "Year End Maintenance", "JOB-1001, JOB-1002"]];
  return <div className="text-[9px]"><div className="mb-3 flex items-center justify-between"><p className="text-slate-400">Add dates when production time does not apply.</p><button className="rounded border border-sky-400/25 bg-[#061421] px-3 py-1.5 text-[#29b6f6]">+ Add Exception</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Date", "Type", "Description", "Applies To", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell) => <td className="py-2" key={`${row[0]}-${cell}`}>{cell}</td>)}<td className="py-2 text-red-400">▢</td></tr>)}</tbody></table></div>;
}

function ProductionCalendar() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "27", "28", "29", "30", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
  return <div className="text-[9px]"><div className="mb-2 flex justify-between"><span>May 2025</span><span className="text-[#29b6f6]">‹ &nbsp; ›</span></div><div className="grid grid-cols-7 gap-1 text-center">{days.map((day, index) => <div className={index < 7 ? "py-1 text-slate-400" : index >= 11 && index <= 40 && !["10", "11", "17", "18", "24", "25", "26"].includes(day) ? "rounded bg-[#063b27] py-1 text-[#05ff5e]" : day === "26" ? "rounded bg-slate-700 py-1 text-slate-300" : "rounded bg-[#03111c] py-1 text-slate-400"} key={`${day}-${index}`}>{day}</div>)}</div><div className="mt-3 flex gap-5 text-[8px] text-slate-400"><span><b className="text-[#05ff5e]">■</b> Production Time</span><span><b>□</b> Non-Production Time</span><span><b className="text-slate-500">▧</b> Exception</span></div></div>;
}

function ProductionApplySettings() {
  return <div className="space-y-3 text-[9px]"><p className="text-slate-400">Apply production time settings to selected jobs.</p><button className="w-full rounded bg-[#087a35] py-3 text-[10px]">Apply to 3 Jobs</button><button className="w-full rounded border border-cyan-300/12 bg-[#061421] py-2.5">Cancel</button><div className="rounded border border-cyan-300/12 bg-[#061421] p-3 text-slate-400"><span className="mr-2 text-sky-400">ⓘ</span>Changes will affect job costing and future invoices. Historical data will not be changed.</div></div>;
}

function JobReportsScreen() {
  return (
    <EcbsAppShell activeHref="/devices/switches">
      <div className="flex h-screen min-h-0 flex-col overflow-hidden px-4 py-3">
        <header className="flex h-[42px] shrink-0 items-center justify-between border-b border-cyan-300/10">
          <div className="text-[14px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-4 text-[10px]">
            <button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">⌂ Flex Tijuana⌄</button>
            <button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 1 – May 12, 2025⌄</button>
            <span className="text-[#05ff5e]">● Online</span>
            <span className="text-red-400">♢</span>
            <span className="text-slate-400">?</span>
            <span className="grid size-8 place-items-center rounded-full bg-[#334155]">GD</span>
            <span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span>
            <span>⌄</span>
          </div>
        </header>
        <section className="flex h-[76px] shrink-0 items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">Devices &nbsp;›&nbsp; Switches &nbsp;›&nbsp; Job Costing & Energy Invoicing &nbsp;›&nbsp; Reports</div>
            <h1 className="mt-1 text-[21px] font-light">Job Costing Reports</h1>
            <p className="mt-1 text-[10px] text-slate-400">Analyze energy usage, costs, and savings by job, cost center, and time period.</p>
          </div>
          <button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-3 text-[10px]">⇩ &nbsp; Export Report &nbsp;⌄</button>
        </section>
        <JobReportTabs />
        <JobReportFilters />
        <section className="mt-3 grid h-[92px] shrink-0 grid-cols-6 gap-3">
          <JobReportKpi icon="ϟ" label="Total Energy (kWh)" value="87,652" detail="vs Apr 19 – Apr 30, 2025" delta="▲ 5.2%" tone="blue" />
          <JobReportKpi icon="$" label="Total Cost (USD)" value="$8,742.36" detail="vs Apr 19 – Apr 30, 2025" delta="▼ 2.7%" tone="green" />
          <JobReportKpi icon="▧" label="Peak Demand (kW)" value="412" detail="vs Apr 19 – Apr 30, 2025" delta="▼ 1.8%" tone="purple" />
          <JobReportKpi icon="◴" label="Demand Cost (USD)" value="$3,296.34" detail="vs Apr 19 – Apr 30, 2025" delta="▼ 3.1%" tone="orange" />
          <JobReportKpi icon="%" label="Power Factor (Avg)" value="0.94" detail="vs Apr 19 – Apr 30, 2025" delta="▲ 2.2%" tone="cyan" />
          <JobReportKpi icon="●" label="Total Savings (USD)" value="$1,784.52" detail="vs Apr 19 – Apr 30, 2025" delta="▲ 8.6%" tone="green" />
        </section>
        <section className="mt-3 grid h-[170px] shrink-0 grid-cols-[1.15fr_0.72fr_0.62fr] gap-3">
          <DashboardPanel title="Energy & Cost Overview" variant="enterprise"><JobReportTrendChart /></DashboardPanel>
          <DashboardPanel title="Energy By Cost Center (kWh)" variant="enterprise"><JobReportDonut /></DashboardPanel>
          <DashboardPanel title="Summary" variant="enterprise"><JobReportSummary /></DashboardPanel>
        </section>
        <section className="mt-3 grid min-h-0 flex-1 grid-cols-[1.95fr_0.65fr] gap-3">
          <DashboardPanel title="Job Costing Report (May 1 – May 12, 2025)" variant="enterprise"><JobReportCostTable /></DashboardPanel>
          <div className="grid min-h-0 grid-rows-[172px_1fr] gap-3 overflow-hidden">
            <DashboardPanel title="Top 5 Cost Centers By Cost" variant="enterprise"><JobReportTopCosts /></DashboardPanel>
            <DashboardPanel title="Report Actions" variant="enterprise"><JobReportActions /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-3 flex h-[30px] shrink-0 items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500">
          <span>© 2025 XECO Energy Corporation. All rights reserved.</span>
          <span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span>
          <span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">▥ &nbsp; Live</b></span>
        </footer>
      </div>
    </EcbsAppShell>
  );
}

function JobReportTabs() {
  const tabs = ["Job Costing Summary", "Energy Allocation", "Cost Analysis", "Trend Analysis", "Cost Center Performance", "Savings & ROI", "Custom Reports"];
  return <div className="flex h-[38px] shrink-0 items-end gap-10 border-b border-cyan-300/10 text-[10px]">{tabs.map((tab) => <span className={tab === "Job Costing Summary" ? "border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]" : "pb-2 text-slate-300"} key={tab}>{tab}</span>)}</div>;
}

function JobReportFilters() {
  const filters = [["Date Range", "May 1 – May 12, 2025"], ["Comparison", "Previous Period⌄"], ["Group By", "Cost Center⌄"], ["Site / Deployment", "Flex Tijuana⌄"], ["Switch / Circuit", "SW-MAIN-01 (Main Switchgear MSB)⌄"]];
  return <section className="mt-3 grid h-[52px] shrink-0 grid-cols-[0.82fr_0.78fr_0.78fr_0.86fr_1.18fr_78px] gap-3 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2 text-[9px]">{filters.map(([label, value]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-1.5" key={label}><div className="text-[7.5px] text-slate-500">{label}</div><div className="mt-1 truncate text-slate-200">{value}</div></div>)}<button className="rounded border border-cyan-300/12 bg-[#03111c] text-slate-200">▽ Filters</button></section>;
}

function JobReportKpi({ delta, detail, icon, label, tone, value }: { delta: string; detail: string; icon: string; label: string; tone: "blue" | "cyan" | "green" | "orange" | "purple"; value: string }) {
  const color = tone === "blue" ? "#147dff" : tone === "green" ? "#16a34a" : tone === "purple" ? "#7c3aed" : tone === "orange" ? "#f97316" : "#14b8a6";
  const isDown = delta.startsWith("▼");
  return (
    <article className="grid grid-cols-[44px_1fr] items-center gap-3 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
      <span className="grid size-10 place-items-center rounded-full text-[20px] text-white shadow-[0_0_18px_rgba(0,220,255,.18)]" style={{ backgroundColor: color }}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[7.5px] font-semibold uppercase text-slate-400">{label}</span>
        <span className="mt-1 block whitespace-nowrap text-[20px] font-light leading-none text-slate-100">{value}</span>
        <span className="mt-1 block truncate text-[7.5px] text-slate-500">{detail}</span>
        <span className={isDown ? "text-[8px] text-red-400" : "text-[8px] text-[#05ff5e]"}>{delta}</span>
      </span>
    </article>
  );
}

function JobReportTrendChart() {
  const days = ["May 1", "May 2", "May 3", "May 4", "May 5", "May 6", "May 7", "May 8", "May 9", "May 10", "May 11", "May 12"];
  return (
    <div className="h-full text-[8px]">
      <div className="mb-2 flex items-center gap-7 text-slate-400"><span className="text-[#05ff5e]">kWh</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#22c55e]" />Energy (kWh)</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#147dff]" />Total Cost (USD)</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#f59e0b]" />Peak Demand (kW)</span><span className="ml-auto text-yellow-300">USD &nbsp;&nbsp; kW</span></div>
      <div className="grid h-[120px] grid-cols-[34px_1fr_34px] gap-2">
        <div className="flex flex-col justify-between text-right text-slate-500"><span>20K</span><span>15K</span><span>10K</span><span>5K</span><span>0</span></div>
        <svg className="h-full w-full" viewBox="0 0 620 160" preserveAspectRatio="none" aria-hidden="true">
          {[24, 56, 88, 120, 152].map((y) => <line key={y} x1="0" x2="620" y1={y} y2={y} stroke="rgba(148,163,184,.15)" />)}
          {[26, 80, 134, 188, 242, 296, 350, 404, 458, 512, 566, 610].map((x, i) => <rect fill="#16a34a" key={x} width="16" x={x - 8} y={[72, 58, 64, 74, 84, 68, 58, 78, 70, 56, 90, 68][i]} height={152 - [72, 58, 64, 74, 84, 68, 58, 78, 70, 56, 90, 68][i]} />)}
          <polyline fill="none" points="20,96 74,64 128,70 182,54 236,82 290,72 344,52 398,68 452,90 506,58 560,78 614,62" stroke="#147dff" strokeWidth="2.4" />
          <polyline fill="none" points="20,102 74,72 128,78 182,64 236,94 290,82 344,72 398,88 452,86 506,44 560,76 614,86" stroke="#f59e0b" strokeWidth="2.4" />
        </svg>
        <div className="flex flex-col justify-between text-slate-500"><span>$1.5K</span><span>$1.0K</span><span>$500</span><span>0</span></div>
      </div>
      <div className="ml-9 mr-9 flex justify-between text-[7.5px] text-slate-400">{days.map((day) => <span key={day}>{day}</span>)}</div>
    </div>
  );
}

function JobReportDonut() {
  const rows = [["Production Line 1", "54,689", "62.4%", "#147dff"], ["Chiller Plant", "16,401", "18.7%", "#22c55e"], ["Packaging Line", "8,132", "9.3%", "#f59e0b"], ["Warehouse", "4,476", "5.1%", "#7c3aed"], ["Office Building", "2,444", "2.8%", "#06b6d4"], ["Other / Unallocated", "1,510", "1.7%", "#64748b"]];
  return <div className="grid h-full grid-cols-[138px_1fr] items-center gap-5"><div className="grid size-32 place-items-center rounded-full" style={{ background: "conic-gradient(#147dff 0 62%, #22c55e 62% 81%, #f59e0b 81% 90%, #7c3aed 90% 95%, #06b6d4 95% 98%, #64748b 98% 100%)" }}><span className="grid size-[82px] place-items-center rounded-full bg-[#061521] text-center text-[18px]">87,652<br /><b className="text-[9px] font-normal text-slate-400">Total kWh</b></span></div><div className="space-y-2 text-[8px]">{rows.map(([name, value, pct, color]) => <div className="grid grid-cols-[1fr_42px_38px] gap-2" key={name}><span className="truncate"><i className="mr-2 inline-block size-2 rounded-sm" style={{ backgroundColor: color }} />{name}</span><span className="text-right text-slate-200">{value}</span><span className="text-right text-slate-300">{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Full Breakdown →</div></div></div>;
}

function JobReportSummary() {
  const rows = [["Total Energy (kWh)", "87,652"], ["Total Cost (USD)", "$8,742.36"], ["Demand Cost (USD)", "$3,296.34"], ["Energy Cost (USD)", "$3,085.96"], ["Other Charges (USD)", "$2,360.06"], ["Power Factor (Avg)", "0.94"], ["Peak Demand (kW)", "412"], ["Savings vs Baseline (USD)", "$1,784.52"], ["Savings %", "16.9%"]];
  return <div className="space-y-1.5 text-[8.5px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-300">{label}</span><b className={label.includes("Savings") ? "text-[#05ff5e]" : "text-slate-100"}>{value}</b></div>)}</div>;
}

function JobReportCostTable() {
  const headers = ["Cost Center / Job", "kWh", "% of Total kWh", "kW (Peak)", "Demand Cost (USD)", "Energy Cost (USD)", "Other Charges (USD)", "Total Cost (USD)", "% of Total Cost", "Savings (USD)"];
  const rows = [["Production Line 1 (JOB-1001)", "54,689", "62.4%", "257", "$2,045.13", "$1,854.24", "$1,552.26", "$5,451.63", "62.4%", "$1,102.34"], ["Chiller Plant (JOB-1002)", "16,401", "18.7%", "77", "$831.52", "$557.18", "$245.52", "$1,634.22", "18.7%", "$381.49"], ["Packaging Line (JOB-1003)", "8,132", "9.3%", "38", "$379.46", "$317.20", "$114.30", "$810.96", "9.3%", "$142.22"], ["Warehouse (JOB-1004)", "4,476", "5.1%", "22", "$210.68", "$162.11", "$72.32", "$445.11", "5.1%", "$96.78"], ["Office Building (JOB-1005)", "2,444", "2.8%", "12", "$106.39", "$89.45", "$49.70", "$245.54", "2.8%", "$37.91"], ["Other / Unallocated", "1,510", "1.7%", "6", "$54.16", "$37.78", "$62.96", "$154.90", "1.7%", "$23.78"], ["TOTAL", "87,652", "100%", "412", "$3,627.34", "$3,085.96", "$2,097.06", "$8,742.36", "100%", "$1,784.52"]];
  return <table className="w-full text-left text-[8px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={row[0] === "TOTAL" ? "py-[7px] font-semibold text-slate-100" : index === 0 ? "py-[7px] text-slate-300" : index === 9 ? "py-[7px] text-[#05ff5e]" : "py-[7px] text-slate-300"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function JobReportTopCosts() {
  const rows = [["Production Line 1", "$5,451.63", "62.4%"], ["Chiller Plant", "$1,634.22", "18.7%"], ["Packaging Line", "$810.96", "9.3%"], ["Warehouse", "$445.11", "5.1%"], ["Office Building", "$245.54", "2.8%"]];
  return <div className="space-y-0.5 text-[7.5px]"><div className="grid grid-cols-[1fr_58px_58px] gap-2 text-slate-500"><span>Cost Center</span><span>Total Cost (USD)</span><span>% of Total Cost</span></div>{rows.map(([label, cost, pct]) => <div className="grid grid-cols-[1fr_58px_58px] gap-2 border-b border-white/5 pb-0.5" key={label}><span>{label}</span><b className="text-right text-slate-100">{cost}</b><span className="text-right text-slate-300">{pct}</span></div>)}<div className="pt-0.5 text-[#05ff5e]">View All Cost Centers →</div></div>;
}

function JobReportActions() {
  const rows = ["Export to PDF", "Export to Excel", "Schedule Report", "Save Report Template", "Share Report"];
  return <div className="space-y-0 text-[7.5px]">{rows.map((row, index) => <button className="grid w-full grid-cols-[18px_1fr_10px] items-center border-b border-white/5 py-[3px] text-left" key={row}><span>{["▧", "▥", "◷", "◇", "⌘"][index]}</span><span>{row}</span><span>›</span></button>)}</div>;
}
function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-1 text-[8px] text-slate-500">{label}</div><div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-[9px] text-slate-200">{value}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[8px] text-slate-500">{label}</div><div className="mt-1 text-[9px] text-slate-200">{value}</div></div>;
}

function Kpi({ detail, icon, title, tone, value }: { detail: string; icon?: "antenna" | "clock" | "gear" | "info" | "ring" | "shield" | "warning" | "wave"; title: string; tone: "cyan" | "green" | "purple" | "red" | "yellow"; value: string }) {
  const color = tone === "yellow" ? "text-yellow-300" : tone === "red" ? "text-red-400" : tone === "purple" ? "text-purple-300" : tone === "cyan" ? "text-cyan-300" : "text-[#05ff5e]";
  if (icon) {
    const glyph = icon === "antenna" ? "⌁" : icon === "clock" ? "◷" : icon === "gear" ? "⚙" : icon === "shield" ? "⬟" : icon === "warning" ? "△" : icon === "wave" ? "⌁" : icon === "info" ? "i" : "";
    return <article className="grid grid-cols-[1fr_76px] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div><div className="text-[8px] text-slate-400">{title}</div><div className={`mt-2 whitespace-nowrap text-[23px] leading-none ${color}`}>{value}</div><div className="mt-1 truncate text-[9px] text-slate-400">{detail}</div></div><div className="grid place-items-center">{icon === "ring" ? <div className="size-[58px] rounded-full border-[8px] border-[#22c55e] border-r-[#063b27]" /> : <div className={`grid size-[54px] place-items-center rounded-full border-2 ${tone === "yellow" ? "border-yellow-300 text-yellow-300" : tone === "red" ? "border-red-400 text-red-400" : tone === "purple" ? "border-purple-400 text-purple-400" : tone === "cyan" ? "border-cyan-300 text-cyan-300" : "border-[#05ff5e] text-[#05ff5e]"} text-[28px]`}>{glyph}</div>}</div></article>;
  }
  return <article className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2"><div className="text-[7px] leading-[0.95] text-slate-400">{title}</div><div className={`mt-1 whitespace-nowrap text-[17px] leading-none ${color}`}>{value}</div><div className="truncate text-[7px] leading-none text-slate-400">{detail}</div></article>;
}

function HealthChart() {
  return <div className="h-full"><div className="mb-2 flex items-center gap-7 text-[8px] text-slate-400"><span>Health Score</span><span className="text-[#22c55e]">━ Health Score</span><span className="text-red-400">━ Temperature</span><span className="text-sky-400">━ CPU Usage</span><span className="text-purple-400">━ Memory Usage</span><span className="ml-auto">% / °C</span></div><svg className="h-[220px] w-full" viewBox="0 0 640 220"><g stroke="rgba(148,163,184,.18)" strokeWidth="1">{[30, 74, 118, 162, 206].map((y) => <line key={y} x1="24" x2="620" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="34">100</text><text x="5" y="78">75</text><text x="5" y="122">50</text><text x="5" y="166">25</text><text x="10" y="210">0</text><text x="608" y="34">100</text><text x="612" y="78">75</text><text x="612" y="122">50</text><text x="612" y="166">25</text><text x="617" y="210">0</text></g><polyline fill="none" points="24,34 60,37 96,32 132,39 168,33 204,36 240,31 276,35 312,30 348,38 384,33 420,35 456,31 492,39 528,34 564,36 620,32" stroke="#22c55e" strokeWidth="2" /><polyline fill="none" points="24,118 84,112 144,120 204,116 264,111 324,115 384,110 444,116 504,112 564,118 620,111" stroke="#ef4444" strokeWidth="2" /><polyline fill="none" points="24,188 110,180 200,184 310,178 420,186 520,180 620,174" stroke="#29b6f6" strokeWidth="2" /><polyline fill="none" points="24,146 110,142 200,138 310,144 420,136 520,132 620,126" stroke="#a855f7" strokeWidth="2" /></svg><div className="flex gap-7 text-[9px] text-slate-400"><span>1H</span><span>6H</span><span className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">24H</span><span>7D</span><span>30D</span><span className="ml-auto text-[#05ff5e]">View Historical Health →</span></div></div>;
}

function ComponentTable() {
  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["Component", "Status", "Value", "Threshold", "Health"].map((h) => <th className="pb-2 font-normal" key={h}>{h}</th>)}</tr></thead><tbody>{components.map(([component, status, value, threshold, health]) => <tr className="border-t border-white/5" key={component}><td className="py-2">{component}</td><td className={status === "Warning" ? "py-2 text-yellow-300" : "py-2 text-[#05ff5e]"}>● {status}</td><td>{value}</td><td>{threshold}</td><td><div className="h-2 rounded bg-slate-800"><div className={status === "Warning" ? "h-2 rounded bg-yellow-400" : "h-2 rounded bg-[#22c55e]"} style={{ width: `${health}%` }} /></div></td></tr>)}</tbody></table>;
}

function MetricList({ rows }: { rows: [string, string][] }) {
  return <div className="space-y-2 text-[9px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-300">{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}</div>;
}
