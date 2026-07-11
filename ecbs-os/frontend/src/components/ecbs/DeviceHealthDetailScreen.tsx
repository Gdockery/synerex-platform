import type { ReactNode } from "react";
import { DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";
import type { DeviceDataRow, DevicesData } from "@/lib/devicesData";

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
  ["No Data", "No Data", "No approved component health source", "No Data", "0"],
];

export function DeviceScreen({ data, variant }: { data?: DevicesData; variant: DeviceScreenVariant }) {
  if (variant === "scheduling") return <DeviceSchedulingScreen data={data} />;
  if (variant === "commissioning") return <DeviceCommissioningScreen data={data} />;
  if (variant === "commissioningNext") return <CommissioningNextStepsScreen data={data} />;
  if (variant === "jobCosting" || variant === "jobInvoices" || variant === "jobProductionTime" || variant === "jobReports") return <JobCostingScreen data={data} variant={variant} />;
  if (variant === "gatewayDetail") return <GatewayDetailScreen data={data} />;
  if (variant === "meterDetail") return <MeterDetailScreen data={data} />;
  if (variant === "repeaterDetail") return <RepeaterDetailScreen data={data} />;
  if (variant === "switchDetail") return <SwitchDetailScreen data={data} />;
  if (variant === "switchesList") return <SwitchesInventoryScreen data={data} />;

  const summaryKind = variant === "meters" ? "Meter" : variant === "gateways" ? "Gateway" : "Repeater";
  const summary = summaryForKind(data, summaryKind);
  const total = summaryKind === "Repeater" ? "No Data" : String(summary.total || "No Data");
  const online = summaryKind === "Repeater" ? "No Data" : String(summary.online || "No Data");
  const warning = summaryKind === "Repeater" ? "No Data" : String(summary.warning || "No Data");
  const offline = summaryKind === "Repeater" ? "No Data" : String(summary.offline || "No Data");
  const onlinePct = percentage(summary.online, summary.total);
  const warningPct = percentage(summary.warning, summary.total);
  const offlinePct = percentage(summary.offline, summary.total);
  const config =
    variant === "meters"
      ? { title: "Meters", active: "/devices/meters", total, online, warning, offline, health: "No Data", firmware: "No Data", noun: "Meter", model: "No Data", description: "Meters collect and transmit power quality data from devices." }
      : variant === "repeaters"
        ? { title: "Repeaters", active: "/devices/repeaters", total, online, warning, offline, health: "No Data", firmware: "No Data", noun: "Repeater", model: "No Data", description: "Repeaters extend network coverage and ensure reliable communication." }
        : { title: "Gateways", active: "/devices/gateways", total, online, warning, offline, health: "No Data", firmware: "No Data", noun: "Gateway", model: "No Data", description: "Gateways collect and transmit data from meters and devices." };

  return (
    <EcbsAppShell activeHref={config.active}>
      <PortalFrame active={config.title}>
        <div className="flex h-[66px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Devices › {config.title}</div><h1 className="text-xl font-light">{config.title}</h1><p className="mt-1 text-[9px] text-slate-400">Monitor and manage all {config.title.toLowerCase()} at this site. {config.description}</p></div>
          <div className="flex gap-3 text-[9px]"><button className="w-[230px] rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-left text-slate-400">⌕ &nbsp; Search {config.title.toLowerCase()}...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">▽ Filters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export {config.title}</button></div>
        </div>
        <section className="mt-2 grid h-[86px] grid-cols-6 gap-2">
          <Kpi title={`Total ${config.title}`} value={config.total} detail={`View All ${config.title} ->`} tone="cyan" icon={variant === "repeaters" ? "antenna" : "info"} />
          <Kpi title="Online" value={config.online} detail={summaryKind === "Repeater" ? "No approved repeater model" : onlinePct} tone="green" icon="shield" />
          <Kpi title="Warning" value={config.warning} detail={summaryKind === "Repeater" ? "No approved repeater model" : warningPct} tone="yellow" icon="warning" />
          <Kpi title="Offline" value={config.offline} detail={summaryKind === "Repeater" ? "No approved repeater model" : offlinePct} tone="red" icon="warning" />
          <Kpi title="Health Score (Avg)" value={config.health} detail="No approved health model" tone="purple" icon={variant === "repeaters" ? "wave" : "clock"} />
          <Kpi title="Firmware Up To Date" value={config.firmware} detail="No approved firmware model" tone="cyan" icon={variant === "repeaters" ? "gear" : "info"} />
        </section>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.62fr] gap-2">
          <DashboardPanel title={`${config.title} at Flex Tijuana (${config.total})`} variant="enterprise">
            <DeviceListTable data={data} variant={variant} model={config.model} />
          </DashboardPanel>
          <div className="space-y-2 overflow-hidden">
            <DashboardPanel title={`${config.noun} Status`} variant="enterprise"><DonutSummary total={config.total} rows={statusRows(summary, summaryKind)} /></DashboardPanel>
            <DashboardPanel title={variant === "repeaters" ? "Repeater Signal Strength Distribution" : `${config.noun} Health Distribution`} variant="enterprise"><DonutSummary total={config.total} rows={noDataRows(summaryKind === "Repeater" ? "No approved repeater signal source" : "No approved health model")} /></DashboardPanel>
            <DashboardPanel title="Firmware Status" variant="enterprise"><DonutSummary total={config.total} rows={noDataRows("No approved firmware model")} /></DashboardPanel>
            <DashboardPanel action={variant === "repeaters" ? "View All ->" : undefined} title={`Recent ${config.noun} Alerts`} variant="enterprise"><MetricList rows={noDataRows("No approved device alert source")} /></DashboardPanel>
          </div>
        </section>
      </PortalFrame>
    </EcbsAppShell>
  );
}

function SwitchesInventoryScreen({ data }: { data?: DevicesData }) {
  const summary = summaryForKind(data, "Switch");
  const onlinePct = percentage(summary.online, summary.total);
  const warningPct = percentage(summary.warning, summary.total);
  const offlinePct = percentage(summary.offline, summary.total);
  return (
    <EcbsAppShell activeHref="/devices/switches">
      <PortalFrame active="Switches">
        <div className="flex h-[72px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Devices › Switches</div><h1 className="text-xl font-light">Switches</h1><p className="mt-1 text-[9px] text-slate-400">Monitor and manage all power switches and breakers at this site. Switches control power distribution and protect critical equipment.</p></div>
          <div className="flex gap-3 text-[9px]"><button className="w-[230px] rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-left text-slate-400">⌕ &nbsp; Search switches...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">▽ Filters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export Switches</button></div>
        </div>
        <div className="flex h-[34px] gap-9 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] text-[#05ff5e]">▣ Device Control</span><span>▣ Device Scheduling</span><span>⚙ Commissioning & Testing</span><span>▧ Production Time</span><span>♙ Job Costing</span><span>Logs</span></div>
        <section className="mt-2 grid h-[92px] grid-cols-6 gap-2">
          <Kpi title="Total Switches" value={summary.total > 0 ? String(summary.total) : "No Data"} detail="View All Switches ->" tone="cyan" icon="gear" />
          <Kpi title="Online" value={summary.total > 0 ? String(summary.online) : "No Data"} detail={onlinePct} tone="green" icon="shield" />
          <Kpi title="Warning" value={summary.total > 0 ? String(summary.warning) : "No Data"} detail={warningPct} tone="yellow" icon="warning" />
          <Kpi title="Offline" value={summary.total > 0 ? String(summary.offline) : "No Data"} detail={offlinePct} tone="red" icon="warning" />
          <Kpi title="Health Score (Avg)" value="No Data" detail="No approved health model" tone="purple" icon="wave" />
          <Kpi title="Firmware Up To Date" value="No Data" detail="No approved firmware model" tone="cyan" icon="gear" />
        </section>
        <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.62fr] gap-2">
          <DashboardPanel title={`Switches at Flex Tijuana (${summary.total > 0 ? summary.total : "No Data"})`} variant="enterprise"><DeviceListTable data={data} variant="switchesList" model="ECBS Switch" /></DashboardPanel>
          <div className="space-y-2 overflow-hidden">
            <DashboardPanel title="Switch Status" variant="enterprise"><DonutSummary total={summary.total > 0 ? String(summary.total) : "No Data"} rows={statusRows(summary, "Switch")} /></DashboardPanel>
            <DashboardPanel title="Switch Health Distribution" variant="enterprise"><DonutSummary total={summary.total > 0 ? String(summary.total) : "No Data"} rows={noDataRows("No approved health model")} /></DashboardPanel>
            <DashboardPanel title="Firmware Status" variant="enterprise"><DonutSummary total={summary.total > 0 ? String(summary.total) : "No Data"} rows={noDataRows("No approved firmware model")} /></DashboardPanel>
            <DashboardPanel action="View All ->" title="Recent Switch Alerts" variant="enterprise"><MetricList rows={noDataRows("No approved device alert source")} /></DashboardPanel>
          </div>
        </section>
      </PortalFrame>
    </EcbsAppShell>
  );
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

function DeviceListTable({ data, variant }: { data?: DevicesData; model: string; variant: DeviceScreenVariant }) {
  const apiRows = deviceRowsForVariant(data, variant).map((row) => [
    row.name,
    row.kind,
    row.location,
    row.status,
    row.healthScore,
    row.lastSeen,
    row.firmware,
    "◎ ⋮",
  ]);
  const rows = apiRows.length > 0 ? apiRows : [["No Data", "No Data", variant === "repeaters" ? "No approved repeater model" : "No scoped ECBS device rows were found.", "No Data", "No Data", "No Data", "No Data", "◎ ⋮"]];
  const healthHeader = variant === "repeaters" ? "Signal Strength" : "Health Score";
  const noun = variant === "meters" ? "Meter" : variant === "repeaters" ? "Repeater" : variant === "switchesList" ? "Switch" : "Gateway";
  return <><div className="mb-3 flex justify-end gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Group by: {variant === "meters" || variant === "switchesList" ? "Type" : "None"}⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">☷</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">▦</button></div><DeviceTable headers={[`${noun} Name`, "Model", "Location / Asset", "Status", healthHeader, "Last Seen", "Firmware", "Actions"]} rows={rows} /><div className="mt-6 flex justify-between text-[9px] text-slate-400"><span>Showing {rows[0]?.[0] === "No Data" ? "No Data" : `1 to ${rows.length}`} of {summaryLabel(data, variant)}</span><span>‹ &nbsp; <b className="rounded border border-[#05ff5e] px-3 py-2 text-[#05ff5e]">1</b> &nbsp; 2 &nbsp; 3 {variant === "meters" ? " 4" : ""} &nbsp; ›</span></div></>;
}

function DeviceTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-3 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={cell === "Online" || cell === "Connected" || cell === "Pass" || cell === "Uploaded" ? "py-[7px] text-[#05ff5e]" : cell === "Warning" || cell === "Pending" ? "py-[7px] text-yellow-300" : cell === "Offline" ? "py-[7px] text-red-400" : "py-[7px] text-slate-300"} key={`${cell}-${cellIndex}`}>{cellIndex === 0 && /^G|^MT|^RP|^SW/.test(cell) ? <span><span className="mr-2 inline-grid size-4 place-items-center rounded border border-sky-400 text-sky-400">▣</span><span className="text-cyan-300">{cell}</span>{index === 0 ? <span className="ml-2 text-yellow-300">★</span> : null}</span> : cellIndex === 0 && headers[0] === "Equipment" ? <span><span className="mr-2 inline-grid size-4 place-items-center rounded border border-slate-500 text-slate-300">{["⌂", "△", "▦", "◌", "◈", "◎"][index] ?? "▣"}</span>{cell}</span> : cellIndex === 4 && /^-\d+ dBm$/.test(cell) ? <SignalStrength value={cell} /> : cellIndex === 4 && /^\\d+$/.test(cell) ? <span className="inline-flex items-center gap-3"><span>{cell}</span><span className="inline-block h-1.5 w-16 rounded bg-slate-800"><span className="block h-1.5 rounded bg-[#22c55e]" style={{ width: `${cell}%` }} /></span></span> : cellIndex === 7 ? <span className="text-[#05ff5e]">◎ &nbsp; ⋮</span> : cell}</td>)}</tr>)}</tbody></table>;
}

function SignalStrength({ value }: { value: string }) {
  const dbm = Math.abs(Number.parseInt(value, 10));
  const width = Math.max(18, Math.min(92, 118 - dbm));
  return <span className="inline-flex items-center gap-3"><span>{value}</span><span className="inline-block h-1.5 w-14 rounded bg-slate-800"><span className="block h-1.5 rounded bg-[#22c55e]" style={{ width: `${width}%` }} /></span></span>;
}

function DonutSummary({ rows, total }: { rows: [string, string][]; total: string }) {
  return <div className="grid h-full grid-cols-[120px_1fr] items-center gap-4"><div className="grid size-24 place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 75%, #147dff 75% 88%, #f59e0b 88% 95%, #ef4444 95% 100%)" }}><div className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-lg">{total}<br /><span className="text-[8px] text-slate-400">Total</span></div></div><MetricList rows={rows} /></div>;
}

function CostCenterTable() {
  const headers = ["Cost Center / Job", "kWh", "% of Total kWh", "kW Peak", "% of Total", "Cost (USD)", "% of Total"];
  const rows = [["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No approved job-costing source"]];
  return <table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={row[0] === "TOTAL" ? "py-[3.5px] font-semibold text-slate-100" : index === 0 ? "py-[3.5px] text-slate-300" : "py-[3.5px] text-slate-300"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function GatewayDetailScreen({ data }: { data?: DevicesData }) {
  const device = selectedDevice(data, "Gateway");
  return (
    <EcbsAppShell activeHref="/devices/gateways">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 18, 2025 10:15 AM CDT⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Gateways › {device.name}</div><h1 className="mt-1 text-xl font-light">Gateway Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">{device.status}</span></h1><p className="mt-1 text-[9px] text-slate-400">Gateway ID: {device.name} &nbsp; | &nbsp; Model: No Data &nbsp; | &nbsp; Firmware: {device.firmware} &nbsp; | &nbsp; Last Seen: {device.lastSeen}</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Gateways</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">↻ Restart Gateway</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Update Firmware</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-6 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="No Data" /><Info label="Location" value={device.location} /><Info label="IP Address" value="No Data" /><Info label="MAC Address" value="No Data" /><Info label="Uptime" value="No Data" /><Info label="Data Transmission" value="No Data" /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]">Overview</span><span>Meters (12)</span><span>Connectivity</span><span>Performance</span><span>Data & Storage</span><span>Events</span><span>Alerts</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[502px] min-h-0 grid-cols-[0.78fr_0.92fr_1.45fr_0.92fr] gap-2">
          <div className="grid min-h-0 grid-rows-[1fr_174px] gap-2 overflow-hidden">
            <DashboardPanel title="Gateway Status" variant="enterprise"><MetricList rows={[["Overall Status", device.status], ["Power", "No Data"], ["Internet Connection", "No Data"], ["Data Collection", "No Data"], ["Time Sync", "No Data"], ["Temperature", "No Data"], ["CPU Usage", "No Data"], ["Memory Usage", "No Data"], ["Disk Usage", "No Data"]]} /></DashboardPanel>
            <DashboardPanel title="Connected Meters" variant="enterprise"><DonutSummary total="No Data" rows={noDataRows("No approved gateway-to-meter mapping exists.")} /><div className="mt-1 text-[9px] text-[#29b6f6]">View All Meters →</div></DashboardPanel>
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
            <DashboardPanel action="Edit" title="Gateway Information" variant="enterprise"><MetricList rows={[["Model", "No Data"], ["Serial Number", device.serialNumber], ["Hardware Revision", "No Data"], ["Firmware Version", device.firmware], ["Bootloader Version", "No Data"], ["Time Zone", "No Data"], ["Time Server", "No Data"], ["Installed On", "No Data"], ["Installed By", "No Data"], ["Notes", "No Data"]]} /></DashboardPanel>
            <DashboardPanel title="Actions" variant="enterprise"><MetricList rows={[["Restart Gateway", ""], ["Update Firmware", ""], ["Backup Configuration", ""], ["Export Gateway Diagnostics", ""], ["Remove Gateway", ""]]} /></DashboardPanel>
          </div>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function GatewayConnectivity() {
  return <div className="space-y-4 text-[9px]"><div><div className="mb-2 text-slate-400">Primary Connection</div><div className="rounded border border-cyan-300/12 bg-[#061421] p-3"><b>No Data</b><br /><span>No approved network configuration source exists.</span><div className="mt-3 grid grid-cols-2 gap-y-2"><span>IP Address</span><b>No Data</b><span>Gateway</span><b>No Data</b><span>DNS</span><b>No Data</b></div></div></div><div><div className="mb-2 text-slate-400">Secondary Connection (Failover)</div><div className="rounded border border-cyan-300/12 bg-[#061421] p-3"><b>No Data</b><br /><span>Signal: No Data</span><div className="mt-3 grid grid-cols-2"><span>IP</span><b>No Data</b></div></div></div></div>;
}

function GatewayEvents() {
  const rows = [["●", "No Data", "No approved device event source"]];
  return <div className="space-y-2 text-[9px]">{rows.map(([dot, event, time], index) => <div className="grid grid-cols-[16px_1fr_auto] border-b border-white/5 pb-1.5" key={`${event}-${time}`}><span className={index === 2 ? "text-blue-400" : index === 3 ? "text-yellow-400" : "text-[#05ff5e]"}>{dot}</span><span>{event}</span><b className="text-slate-400">{time}</b></div>)}</div>;
}

function GatewayDataFlow() {
  return <div className="h-full"><div className="mb-1 flex justify-end gap-2 text-[8px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1">Last 24 Hours⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">⛶</button></div><NoDataChartBlock label="No approved gateway data-flow source exists." /><div className="grid grid-cols-4 gap-3 text-[9px]"><Info label="Total Data In" value="No Data" /><Info label="Total Data Out" value="No Data" /><Info label="Avg In Rate" value="No Data" /><Info label="Avg Out Rate" value="No Data" /></div></div>;
}

function GatewayPerformance() {
  return <div className="h-full"><div className="grid grid-cols-5 gap-2 text-[9px]"><Info label="CPU Usage (Avg.)" value="No Data" /><Info label="Memory Usage (Avg.)" value="No Data" /><Info label="Temperature (Avg.)" value="No Data" /><Info label="Data Collection Success" value="No Data" /><Info label="Packet Loss (Avg.)" value="No Data" /></div><div className="mt-2"><NoDataChartBlock label="No approved gateway performance source exists." /></div></div>;
}

function MeterDetailScreen({ data }: { data?: DevicesData }) {
  const device = selectedDevice(data, "Meter");
  const telemetry = data?.telemetry ?? emptyTelemetry();
  return (
    <EcbsAppShell activeHref="/devices/meters">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 18, 2025 10:15 AM CDT⌄</button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Meters › {device.name}</div><h1 className="mt-1 text-xl font-light">Meter Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">{device.status}</span></h1><p className="mt-1 text-[9px] text-slate-400">Meter ID: {device.name} &nbsp; | &nbsp; Model: No Data &nbsp; | &nbsp; Serial Number: {device.serialNumber} &nbsp; | &nbsp; Firmware: {device.firmware} &nbsp; | &nbsp; Last Seen: {device.lastSeen}</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Meters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Data⌄</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure Meter</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-5 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="No Data" /><Info label="Location" value={device.location} /><Info label="Electrical Network" value="No Data" /><Info label="Gateway" value="No Data" /><Info label="Meter Type" value={device.kind} /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="bg-[#082039] px-5 py-2 text-slate-100">Overview</span><span>Real-Time</span><span>Historical Data</span><span>Power Quality</span><span>Energy</span><span>Events</span><span>Alarms</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[598px] min-h-0 grid-cols-[0.88fr_1fr_0.72fr_0.86fr] grid-rows-[226px_180px_176px] gap-2 overflow-hidden">
          <DashboardPanel action="Edit" className="min-h-0" title="Meter Status" variant="enterprise"><MeterStatusList /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Real-Time Electrical Values" variant="enterprise"><MeterRealTimeValues telemetry={telemetry} /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Power Factor" variant="enterprise"><MeterPowerFactor value={telemetry.powerFactor} /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Energy Summary (Today)" variant="enterprise"><MeterEnergySummary telemetry={telemetry} /></DashboardPanel>
          <DashboardPanel className="col-span-2 min-h-0" title="Load Trend (Last 24 Hours)" variant="enterprise"><MeterLoadTrend /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Harmonic Distortion (THD)" variant="enterprise"><MeterThd /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Demand (3-Hour Rolling)" variant="enterprise"><MeterDemand /></DashboardPanel>
          <DashboardPanel action="View All Events ->" className="col-span-2 min-h-0" title="Recent Events" variant="enterprise"><MeterEvents /></DashboardPanel>
          <DashboardPanel action="Edit" className="min-h-0" title="Meter Information" variant="enterprise"><MeterInformation device={device} /></DashboardPanel>
          <DashboardPanel className="min-h-0" title="Actions" variant="enterprise"><MeterActions /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function MeterRealTimeValues({ telemetry }: { telemetry: DevicesData["telemetry"] }) {
  return <div className="text-[8.5px]"><div className="mb-1 text-slate-400">{telemetry.timestamp}</div><MeterMiniTable headers={["Parameter", "L1", "L2", "L3", "Total"]} rows={[["Voltage (V)", "No Data", "No Data", "No Data", "No Data"], ["Current (A)", "No Data", "No Data", "No Data", "No Data"], ["kW", "No Data", "No Data", "No Data", telemetry.kilowatts], ["kVA", "No Data", "No Data", "No Data", telemetry.kilovoltAmps], ["kVAR", "No Data", "No Data", "No Data", "No Data"], ["Power Factor", "No Data", "No Data", "No Data", telemetry.powerFactor], ["Frequency (Hz)", "No Data", "No Data", "No Data", "No Data"]]} /><div className="mt-1 text-[9px] text-[#29b6f6]">View Real-Time →</div></div>;
}

function MeterStatusList() {
  const rows = [["Overall Status", "No Data"], ["Power", "No Data"], ["Communication", "No Data"], ["Data Collection", "No Data"], ["Time Sync", "No Data"], ["Battery", "No Data"], ["Temperature", "No Data"], ["CT Ratio", "No Data"], ["VT Ratio", "No Data"], ["Nominal Voltage", "No Data"], ["Nominal Frequency", "No Data"]];
  return <div className="space-y-[3px] text-[8.5px]">{rows.map(([label, value], index) => <div className="flex justify-between border-b border-white/5 pb-[2px]" key={label}><span className="text-slate-300">{index < 6 ? "◎ " : ""}{label}</span><b className={index < 6 ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div>;
}

function MeterMiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1.5 font-normal" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={index === 0 ? "py-[4px] text-slate-300" : "py-[4px] text-slate-200"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function MeterPowerFactor({ value }: { value: string }) {
  return <div className="grid h-full place-items-center text-center"><div className="relative h-[120px] w-[190px]"><div className="absolute left-0 right-0 top-5 mx-auto h-[95px] w-[170px] rounded-t-full border-[14px] border-b-0 border-[#22c55e]" style={{ borderLeftColor: "#334155", borderTopColor: "#334155" }} /><div className="absolute bottom-1 left-0 right-0 text-3xl text-slate-100">{value}</div><div className="absolute bottom-[-14px] left-0 right-0 text-[10px] text-slate-300">No Data</div></div><div className="text-[9px] text-slate-300">Target PF: No Data</div><div className="text-[9px] text-yellow-300">No approved target/compliance model</div></div>;
}

function MeterEnergySummary({ telemetry }: { telemetry: DevicesData["telemetry"] }) {
  return <div className="space-y-2 text-[8.5px]"><CompactMeterRows rows={[["Active Energy (kWh)", telemetry.kilowattHours], ["Reactive Energy (kVARh)", "No Data"], ["Apparent Energy (kVAh)", "No Data"], ["Import (kWh)", "No Data"], ["Export (kWh)", "No Data"]]} /><div><div className="mb-1 text-[9px] font-semibold">Energy Summary (MTD)</div><CompactMeterRows rows={[["Active Energy (kWh)", "No Data"], ["Import (kWh)", "No Data"], ["Export (kWh)", "No Data"]]} /></div><div className="text-[#29b6f6]">View Energy Details →</div></div>;
}

function CompactMeterRows({ rows }: { rows: [string, string][] }) {
  return <div className="space-y-[3px]">{rows.map(([label, value]) => <div className="flex justify-between" key={label}><span>{label}</span><b className="text-slate-100">{value}</b></div>)}</div>;
}

function MeterLoadTrend() {
  return <div className="h-full"><div className="mb-1 flex items-center justify-between text-[8px] text-slate-400"><span className="text-[#29b6f6]">━ kW &nbsp; <b className="text-yellow-300">━ kVA</b> &nbsp; <b className="text-[#22c55e]">━ kVAR</b> &nbsp; <b className="text-purple-400">━ PF</b></span><span>24 Hours⌄</span></div><NoDataChartBlock label="No approved meter load trend source exists." /><div className="grid grid-cols-4 gap-2 text-[8px]"><Info label="kW" value="No Data" /><Info label="kVA" value="No Data" /><Info label="kVAR" value="No Data" /><Info label="PF" value="No Data" /></div><div className="mt-1 text-[9px] text-[#29b6f6]">View Historical Data →</div></div>;
}

function MeterThd() {
  return <div className="space-y-2 text-[8.5px]"><div className="text-slate-400">No Data</div><MeterMiniTable headers={["Parameter", "L1 (%)", "L2 (%)", "L3 (%)", "N (%)"]} rows={[["Voltage THD", "No Data", "No Data", "No Data", "No Data"], ["Current THD", "No Data", "No Data", "No Data", "No Data"], ["Current TDD", "No Data", "No Data", "No Data", "No Data"]]} /><div className="flex items-center justify-between border-t border-white/5 pt-1"><span>THD Compliance: No Data</span><b className="rounded bg-slate-800 px-2 py-1 text-[8px] text-slate-300">No Data</b></div><div className="text-[#29b6f6]">View Power Quality →</div></div>;
}

function MeterDemand() {
  return <div className="space-y-2 text-[8.5px]"><div className="text-slate-400">As of No Data</div><CompactMeterRows rows={[["kW Demand", "No Data"], ["kVA Demand", "No Data"], ["kVAR Demand", "No Data"], ["Power Factor", "No Data"], ["Time of Max Demand", "No Data"]]} /><div className="pt-1 text-[#29b6f6]">View Demand Details →</div></div>;
}

function MeterEvents() {
  const rows = [["No Data", "No Data", "No Data", "No approved device event source"]];
  return <table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{["Time", "Event", "Severity", "Description"].map((header) => <th className="pb-2 font-normal" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(([time, event, severity, description]) => <tr className="border-t border-white/5" key={event}><td className="py-2 text-slate-300">{time}</td><td>{event}</td><td className={severity === "Critical" ? "text-red-400" : severity === "Warning" ? "text-yellow-300" : "text-[#29b6f6]"}>● {severity}</td><td>{description}</td></tr>)}</tbody></table>;
}

function MeterInformation({ device }: { device: DeviceDataRow }) {
  return <div className="space-y-[3px] text-[8.5px]"><CompactMeterRows rows={[["Manufacturer", "No Data"], ["Model", "No Data"], ["Serial Number", device.serialNumber], ["Firmware Version", device.firmware], ["Hardware Revision", "No Data"], ["Installed On", "No Data"], ["Installed By", "No Data"], ["Notes", "No Data"]]} /></div>;
}

function MeterActions() {
  return <div className="space-y-[7px] text-[8.5px]">{["ⓘ  Calibrate Meter", "◷  Sync Time", "↻  Reset Energy Values", "⊕  Test Communication", "⌫  Remove Meter"].map((action, index) => <div className={index === 4 ? "border-t border-white/5 pt-2 text-red-400" : "border-b border-white/5 pb-1.5"} key={action}>{action}</div>)}</div>;
}

function RepeaterDetailScreen({ data }: { data?: DevicesData }) {
  const device = selectedDevice(data, "Repeater");
  return (
    <EcbsAppShell activeHref="/devices/repeaters">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 11 - May 18, 2025<br /><span className="text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Repeaters › {device.name}</div><h1 className="mt-1 text-xl font-light">Repeater Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">{device.status}</span></h1><p className="mt-1 text-[9px] text-slate-400">Repeater ID: {device.name} &nbsp; | &nbsp; Model: No Data &nbsp; | &nbsp; Firmware: {device.firmware} &nbsp; | &nbsp; Last Seen: {device.lastSeen}</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Repeaters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">↻ Restart Repeater</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Update Firmware</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure Repeater</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-7 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="No Data" /><Info label="Location" value="No Data" /><Info label="Parent Gateway" value="No Data" /><Info label="IP Address" value="No Data" /><Info label="MAC Address" value="No Data" /><Info label="Uptime" value="No Data" /><Info label="Signal Strength" value="No approved repeater model" /></section>
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
  const rows = [["Overall Status", "No Data"], ["Power", "No Data"], ["Internet Connection", "No Data"], ["Data Forwarding", "No Data"], ["Time Sync", "No Data"], ["Temperature", "No Data"], ["CPU Usage", "No Data"], ["Memory Usage", "No Data"], ["Signal Strength (to Gateway)", "No approved repeater model"], ["Packet Loss", "No Data"]];
  return <div className="space-y-[3px] text-[8.2px]">{rows.map(([label, value], index) => <div className="flex justify-between border-b border-white/5 pb-[2px]" key={label}><span className="text-slate-300">{index < 5 || index > 7 ? "◎ " : "◷ "}{label}</span><b className={index < 5 || index > 7 ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div>;
}

function RepeaterTopology() {
  return <div className="grid h-full place-items-center text-center text-[8.5px]"><div className="rounded border border-dashed border-cyan-300/20 bg-[#061421] p-6 text-slate-400">No approved repeater topology source exists.</div><div className="mt-1 justify-self-start text-[#29b6f6]">View Network Map →</div></div>;
}

function RepeaterThroughput() {
  return <div className="h-full"><div className="mb-1 flex justify-end gap-2 text-[8px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1">Last 24 Hours⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">⛶</button></div><NoDataChartBlock label="No approved repeater throughput source exists." /><div className="grid grid-cols-4 gap-2 text-[8px]"><Info label="Avg Data In" value="No Data" /><Info label="Avg Data Out" value="No Data" /><Info label="Peak In" value="No Data" /><Info label="Peak Out" value="No Data" /></div></div>;
}

function RepeaterInformation() {
  return <div className="space-y-[4px] text-[8.5px]"><CompactMeterRows rows={[["Model", "No Data"], ["Serial Number", "No Data"], ["Firmware Version", "No Data"], ["Hardware Revision", "No Data"], ["Bootloader Version", "No Data"], ["Frequency Band", "No Data"], ["Installation Date", "No Data"], ["Installed By", "No Data"], ["Notes", "No approved repeater model"]]} /></div>;
}

function RepeaterConnectedSummary() {
  return <div className="grid h-full grid-cols-[118px_1fr] items-center gap-3"><div className="grid size-24 place-items-center rounded-full bg-slate-800"><span className="grid size-14 place-items-center rounded-full bg-[#061521] text-center text-base">No Data<br /><b className="text-[8px] font-normal text-slate-400">Total</b></span></div><div className="space-y-3 text-[8.5px]"><div><b className="mr-2 text-[#22c55e]">●</b>Meters <span className="float-right">No Data</span></div><div><b className="mr-2 text-[#147dff]">●</b>Switches <span className="float-right">No Data</span></div><div><b className="mr-2 text-yellow-400">●</b>Other Devices <span className="float-right">No Data</span></div><div className="pt-2 text-[#29b6f6]">View All Connected Devices →</div></div></div>;
}

function RepeaterDetailEvents() {
  const rows = [["●", "No Data", "No approved device event source"]];
  return <div className="space-y-[6px] text-[8.5px]">{rows.map(([dot, event, time], index) => <div className="grid grid-cols-[16px_1fr_auto] border-b border-white/5 pb-[4px]" key={`${event}-${time}`}><span className={index === 2 ? "text-blue-400" : index === 3 || index === 5 ? "text-slate-500" : "text-[#05ff5e]"}>{dot}</span><span>{event}</span><b className="text-slate-400">{time}</b></div>)}</div>;
}

function RepeaterEnvironmental() {
  return <div className="grid h-full gap-2 text-[8.5px]">{[["♨", "Temperature", "No Data", "text-orange-400"], ["♢", "Humidity", "No Data", "text-[#29b6f6]"], ["⌘", "Ventilation", "No Data", "text-[#29b6f6]"]].map(([icon, label, value, color]) => <div className="grid grid-cols-[36px_1fr] items-center gap-2" key={label}><span className={`grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#061421] text-lg ${color}`}>{icon}</span><span><span className="text-slate-400">{label}</span><br /><b>{value}</b></span></div>)}</div>;
}

function RepeaterSignalQuality() {
  return <div className="grid h-full place-items-center text-center"><div className="grid size-[112px] place-items-center rounded-full bg-slate-800"><span className="grid size-[74px] place-items-center rounded-full bg-[#061521] text-sm">No Data<br /><b className="text-[8px] font-normal text-slate-400">Signal</b></span></div><div className="grid w-full grid-cols-2 text-[8px] text-slate-400"><span>No Data</span><span className="text-right">No Data</span></div><div className="text-[9px]">Noise Floor: No Data<br />SNR: No Data</div><div className="text-[9px] text-[#29b6f6]">View Signal History →</div></div>;
}

function RepeaterPerformance() {
  const metrics = [["CPU Usage (Avg.)", "No Data"], ["Memory Usage (Avg.)", "No Data"], ["Uptime", "No Data"], ["Packet Success Rate", "No Data"], ["Avg Response Time", "No Data"]];
  return <div className="grid h-full grid-cols-[1.65fr_0.95fr] gap-4 text-[8.5px]"><div className="grid grid-cols-5 gap-3">{metrics.map(([label, value]) => <div className="border-r border-white/8 pr-3" key={label}><Info label={label} value={value} /><div className="mt-5 h-32 rounded border border-dashed border-cyan-300/20" /></div>)}</div><div><div className="mb-2 text-[10px] font-semibold">Data Forwarding</div><CompactMeterRows rows={[["Status", "No Data"], ["Total Packets (24h)", "No Data"], ["Dropped Packets (24h)", "No Data"], ["Forwarding Mode", "No Data"], ["Queue Length", "No Data"]]} /></div></div>;
}

function RepeaterActions() {
  return <div className="space-y-[7px] text-[8.5px]">{["↻  Restart Repeater", "⇩  Update Firmware", "⇧  Backup Configuration", "⊕  Export Repeater Diagnostics", "⌫  Remove Repeater"].map((action, index) => <div className={index === 4 ? "border-t border-white/5 pt-2 text-red-400" : "border-b border-white/5 pb-1.5"} key={action}>{action}</div>)}</div>;
}

function SwitchDetailScreen({ data }: { data?: DevicesData }) {
  const device = selectedDevice(data, "Switch");
  const telemetry = data?.telemetry ?? emptyTelemetry();
  return (
    <EcbsAppShell activeHref="/devices/switches">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
          <div className="text-[12px] font-semibold">XECO ENERGY INTELLIGENCE PORTAL</div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[150px] rounded border border-slate-700 bg-[#061421] px-3 py-1 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2">▣ May 11 - May 18, 2025<br /><span className="text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[70px] items-center justify-between">
          <div><div className="text-[10px] text-slate-400">Home › Devices › Switches › {device.name}</div><h1 className="mt-1 text-xl font-light">Switch Detail <span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">{device.status}</span></h1><p className="mt-1 text-[9px] text-slate-400">Switch ID: {device.name} &nbsp; | &nbsp; Model: No Data &nbsp; | &nbsp; Serial Number: {device.serialNumber} &nbsp; | &nbsp; Firmware: {device.firmware} &nbsp; | &nbsp; Last Seen: {device.lastSeen}</p></div>
          <div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">← Back to Switches</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export Data⌄</button><button className="rounded bg-[#1463ff] px-4 py-2">⚙ Configure Switch</button></div>
        </div>
        <section className="grid h-[84px] grid-cols-[1.15fr_1fr_1.1fr_1fr_0.9fr_0.72fr_0.72fr_0.78fr] rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Site" value="No Data" /><Info label="Location" value={device.location} /><Info label="Electrical Network" value="No Data" /><Info label="Gateway" value="No Data" /><Info label="Switch Type" value={device.kind} /><Info label="Status" value={device.status} /><Info label="Rated Current" value="No Data" /><Info label="Rated Voltage" value="No Data" /></section>
        <div className="flex h-[44px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="bg-[#082039] px-5 py-2 text-slate-100">Overview</span><span>Real-Time</span><span>Historical Data</span><span>Power Quality</span><span>Events</span><span>Trips & Alarms</span><span>Maintenance</span><span>Configuration</span><span>Log Files</span></div>
        <section className="mt-2 grid h-[610px] min-h-0 grid-cols-10 grid-rows-[258px_236px_84px] gap-2 overflow-hidden">
          <DashboardPanel action="Edit" className="col-span-3 min-h-0" title="Switch Status" variant="enterprise"><SwitchStatusList device={device} /></DashboardPanel>
          <DashboardPanel className="col-span-3 min-h-0" title="Real-Time Electrical Values" variant="enterprise"><SwitchRealTimeValues telemetry={telemetry} /></DashboardPanel>
          <DashboardPanel className="col-span-4 min-h-0" title="Load Trend (Last 24 Hours)" variant="enterprise"><SwitchLoadTrend telemetry={telemetry} /></DashboardPanel>
          <DashboardPanel className="col-span-3 min-h-0" title="Power Quality Snapshot" variant="enterprise"><SwitchPowerQuality /></DashboardPanel>
          <DashboardPanel className="col-span-3 min-h-0" title="Trips & Alarms (Last 7 Days)" variant="enterprise"><SwitchTripsAlarms /></DashboardPanel>
          <DashboardPanel action="Edit" className="col-span-4 min-h-0" title="Switch Information" variant="enterprise"><SwitchInformation device={device} /></DashboardPanel>
          <DashboardPanel className="col-span-6 min-h-0" title="Actions" variant="enterprise"><SwitchActionTiles /></DashboardPanel>
          <DashboardPanel className="col-span-4 min-h-0" title="Quick Links" variant="enterprise"><SwitchQuickLinks /></DashboardPanel>
        </section>
        <footer className="mt-2 flex h-[30px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span>Data updated: May 18, 2025 10:15 AM CDT &nbsp; <b className="text-[#05ff5e]">Live</b></span></footer>
      </div>
    </EcbsAppShell>
  );
}

function SwitchStatusList({ device }: { device: DeviceDataRow }) {
  const rows = [["Operational Status", device.status], ["Connectivity", device.lastSeen === "No Data" ? "No Data" : "Connected"], ["Control Power", "No Data"], ["Spring Status", "No Data"], ["Trip Unit Status", "No Data"], ["Arc Flash Protection", "No Data"], ["Temperature", "No Data"], ["Mechanical Operations", "No Data"]];
  return <div className="h-full text-[8.4px]"><div className="space-y-[4px]">{rows.map(([label, value], index) => <div className="flex justify-between border-b border-white/5 pb-[2px]" key={label}><span className="text-slate-300">{index < 6 ? "◎ " : "♨ "}{label}</span><b className={index < 2 && value !== "No Data" ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div><div className="mt-4 flex justify-between text-[8.5px]"><span className="text-slate-400">Last Operation</span><b>No Data</b></div></div>;
}

function SwitchRealTimeValues({ telemetry }: { telemetry: DevicesData["telemetry"] }) {
  return <div className="text-[8.5px]"><div className="mb-1 text-slate-400">{telemetry.timestamp}</div><MeterMiniTable headers={["Parameter", "L1", "L2", "L3", "Avg / Total"]} rows={[["Voltage (V L-L)", "No Data", "No Data", "No Data", "No Data"], ["Voltage (V L-N)", "No Data", "No Data", "No Data", "No Data"], ["Current (A)", "No Data", "No Data", "No Data", "No Data"], ["Power (kW)", "No Data", "No Data", "No Data", telemetry.kilowatts], ["kVA", "No Data", "No Data", "No Data", telemetry.kilovoltAmps], ["kVAR", "No Data", "No Data", "No Data", "No Data"], ["Power Factor", "No Data", "No Data", "No Data", telemetry.powerFactor], ["Frequency (Hz)", "No Data", "No Data", "No Data", "No Data"]]} /><div className="mt-1 text-[9px] text-[#29b6f6]">View Real-Time →</div></div>;
}

function SwitchLoadTrend({ telemetry }: { telemetry: DevicesData["telemetry"] }) {
  return <div className="h-full"><div className="mb-1 flex items-center justify-between text-[8px] text-slate-400"><span className="ml-auto">24 Hours⌄ &nbsp; ⛶</span></div><NoDataChartBlock label="No approved switch load trend source exists." /><div className="grid grid-cols-4 gap-3 text-[9px]"><Info label="Avg Current" value="No Data" /><Info label="Avg kW" value={telemetry.kilowatts} /><Info label="Peak Current" value="No Data" /><Info label="Peak kW" value="No Data" /></div><div className="mt-1 text-[9px] text-[#29b6f6]">View Historical Data →</div></div>;
}

function SwitchPowerQuality() {
  const items = [["THD (V L-L)", "No Data", "No Data"], ["THD (I)", "No Data", "No Data"], ["Unbalance (V)", "No Data", "No Data"], ["Flicker (Pst)", "No Data", "No Data"], ["Voltage Deviation", "No Data", "No Data"], ["Frequency Deviation", "No Data", "No Data"]];
  return <div className="grid h-full grid-cols-4 gap-x-4 gap-y-5 text-[9px]">{items.map(([label, value, status], index) => <div className={index > 3 ? "col-span-2" : ""} key={label}><div className="text-slate-400">{label}</div><div className="mt-2 text-xl text-slate-100">{value}</div><div className={status === "Excellent" ? "text-[#05ff5e]" : "text-[#22c55e]"}>{status}</div></div>)}<div className="col-span-4 text-[#29b6f6]">View Power Quality →</div></div>;
}

function SwitchTripsAlarms() {
  const rows = [["No Data", "No Data", "No approved device event source", "No Data"]];
  return <div className="text-[8.5px]"><div className="mb-4 grid grid-cols-4 text-center"><Info label="Total Trips" value="No Data" /><Info label="Active Alarms" value="No Data" /><Info label="Warnings" value="No Data" /><Info label="Info" value="No Data" /></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Time", "Type", "Description", "Severity"].map((h) => <th className="pb-1.5 font-normal" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([time, type, description, severity]) => <tr className="border-t border-white/5" key={`${time}-${description}`}><td className="py-[5px]">{time}</td><td>{type}</td><td>{description}</td><td className={severity === "High" ? "text-red-400" : severity === "Medium" ? "text-yellow-300" : "text-[#29b6f6]"}>● {severity}</td></tr>)}</tbody></table><div className="mt-2 text-[#29b6f6]">View All Events →</div></div>;
}

function SwitchInformation({ device }: { device: DeviceDataRow }) {
  return <div className="grid grid-cols-2 gap-x-8 text-[8.7px]"><CompactMeterRows rows={[["Manufacturer", "No Data"], ["Model", "No Data"], ["Serial Number", device.serialNumber], ["Firmware Version", device.firmware], ["Trip Unit", "No Data"]]} /><CompactMeterRows rows={[["Rated Current", "No Data"], ["Rated Voltage", "No Data"], ["Interrupting Capacity", "No Data"], ["Installation Date", "No Data"], ["Installed By", "No Data"], ["Notes", "No Data"]]} /></div>;
}

function SwitchActionTiles() {
  return <div className="grid h-full grid-cols-7 gap-3 text-center text-[7.5px]">{[["▭", "Open Switch"], ["▣", "Close Switch"], ["↻", "Reset Trip Unit"], ["⚡", "Test Trip Unit"], ["⌁", "Maintenance Mode"], ["⇩", "Download Logs"], ["⇧", "Update Firmware"]].map(([icon, label]) => <button className="flex flex-col items-center justify-center gap-1 rounded border border-cyan-300/12 bg-[#061421] leading-tight text-slate-200" key={label}><span className="block text-base leading-none">{icon}</span><span>{label}</span></button>)}</div>;
}

function SwitchQuickLinks() {
  return <div className="space-y-2 text-[9px] text-[#29b6f6]"><div>View One-Line Diagram →</div><div>View Electrical Network →</div><div>View Transformer (TXFR-01) →</div></div>;
}

export function DeviceHealthDetailScreen({ data }: { data?: DevicesData }) {
  const device = data?.devices.find((row) => row.name !== "No Data");
  const deviceName = device?.name ?? "No Data";
  const deviceStatus = device?.status ?? "No Data";
  const lastSeen = device?.lastSeen ?? "No Data";
  return (
    <EcbsAppShell activeHref="/devices/gateways">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><div className="text-[12px] font-semibold uppercase tracking-wide text-slate-200">XECO Energy Intelligence Portal</div><div className="mt-2 text-[10px] text-slate-400">Home › Devices › Devices › {deviceName} › <span className="text-slate-200">Device Health</span></div></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2 text-left"><span className="block text-[7px] text-slate-500">Client</span>Flex Ltd.</button><button className="rounded border border-slate-700 bg-[#061421] px-4 py-2 text-left"><span className="block text-[7px] text-slate-500">▣</span>May 11 - May 18, 2025<br /><span className="text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">● Live</span><span className="text-red-400">♢</span><span className="text-slate-400">?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br /><span className="text-slate-400">OEM Admin</span></span></div>
        </header>

        <div className="mt-2 flex h-[34px] items-center justify-between">
          <div className="flex items-center gap-2"><h1 className="text-xl font-light">Device Health Detail</h1><span className="rounded-full bg-[#063b27] px-2 py-0.5 text-[9px] text-[#05ff5e]">{deviceStatus}</span></div>
          <div className="flex gap-8 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">← Back to Devices</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Last 24 Hours⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export Health Report</button></div>
        </div>

        <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
          <div className="grid grid-cols-[76px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 text-[9px]">
            <div className="h-[58px] rounded bg-gradient-to-br from-slate-700 to-slate-950 p-3 text-[#05ff5e]">XECO</div>
            <div><div className="text-slate-500">Device Name</div><div className="mt-1 text-[14px] text-slate-100">{deviceName}</div><div className="mt-1 text-[8px] text-slate-400"><span className="text-[#05ff5e]">● {deviceStatus}</span> &nbsp; | &nbsp; Last Seen: {lastSeen}</div></div>
            <Info label="Device Type" value={device?.kind ?? "No Data"} />
            <Info label="Site" value="No Data" />
            <Info label="Location" value={device?.location ?? "No Data"} />
            <Info label="IP Address" value="No Data" />
            <Info label="Serial Number" value={device?.serialNumber ?? "No Data"} />
            <Info label="Firmware" value={device?.firmware ?? "No Data"} />
          </div>
        </section>

        <section className="mt-2 grid h-[92px] grid-cols-5 gap-2">
          <Kpi title="Overall Health Score" value={device?.healthScore ?? "No Data"} detail="No approved health model" tone="green" icon="ring" />
          <Kpi title="Uptime (Last 24 Hours)" value="No Data" detail="No approved uptime source" tone="green" icon="clock" />
          <Kpi title="Critical Alarms" value="No Data" detail="No approved device alarm source" tone="green" icon="shield" />
          <Kpi title="Warnings" value="No Data" detail="No approved device alarm source" tone="yellow" icon="warning" />
          <Kpi title="Informational" value="No Data" detail="No approved device event source" tone="cyan" icon="info" />
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

function DeviceSchedulingScreen({ data }: { data?: DevicesData }) {
  const switches = scheduleRowsFromData(data);
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
  const selectedCount = switches.filter((row) => row[5]).length;
  return <div className="h-[calc(100%-22px)]"><div className="mb-3 flex items-center justify-between"><p className="text-[9px] text-slate-400">Choose one or more switches to set ON/OFF schedules.</p><button className="w-[170px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left text-[9px] text-slate-400">⌕ &nbsp; Search switches...</button></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["", "Switch Name", "Type", "Location / Asset", "Status", "Current Mode"].map((header) => <th className="border-b border-white/8 pb-3 font-normal" key={header}>{header}</th>)}</tr></thead><tbody>{switches.map(([name, type, location, status, mode, selected, starred]) => <tr className="border-b border-white/5" key={name}><td className="py-[8px]"><span className={selected ? "grid size-4 place-items-center rounded bg-[#22c55e] text-[9px] text-[#03110a]" : "block size-4 rounded border border-slate-600"}>{selected ? "✓" : ""}</span></td><td className="py-[8px]"><span className="mr-2 inline-grid size-4 place-items-center rounded border border-[#05ff5e] text-[#05ff5e]">▣</span><span className="text-cyan-300">{name}</span>{starred ? <span className="ml-2 text-yellow-300">★</span> : null}</td><td>{type}</td><td>{location}</td><td className={status === "Offline" ? "text-red-400" : status === "Warning" ? "text-yellow-300" : "text-[#05ff5e]"}>● {status}</td><td>{mode}</td></tr>)}</tbody></table><div className="mt-6 flex items-center justify-between text-[9px]"><span className="text-[#05ff5e]">{selectedCount > 0 ? `${selectedCount} switches selected` : "No switches selected"}</span><span className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Select All</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Clear Selection</button></span></div></div>;
}

function SwitchScheduleForm() {
  return <div className="relative h-[calc(100%-22px)] overflow-hidden pb-12 text-[9px]"><p className="mb-3 text-slate-400">Device scheduling has no approved table or command API yet.</p><div className="mb-4"><div className="mb-2 text-slate-300">Schedule Type ⓘ</div><div className="space-y-3">{["No Data", "No Data", "No Data", "No Data", "No Data", "No Data"].map((item, index) => <div className="flex items-center gap-2" key={`${item}-${index}`}><span className="block size-4 rounded-full border border-slate-500" />{item}</div>)}</div></div><div className="rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-2 font-semibold uppercase">Time Schedule</div><div className="mb-3 text-[8px] text-slate-400">No approved device schedule source exists.</div><div className="grid grid-cols-2 gap-3"><Field label="Start Time" value="No Data" /><Field label="End Time" value="No Data" /></div><div className="mt-3"><Field label="Time Zone" value="No Data" /></div><div className="mt-3"><div className="mb-2 text-slate-400">Days of Week</div><div className="grid grid-cols-4 gap-2">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span className="flex items-center gap-2" key={day}><span className="block size-4 rounded border border-slate-600" />{day}</span>)}</div></div><div className="mt-4 text-slate-500">Add Another Time Window (Optional)</div><div className="mt-2 grid grid-cols-2 gap-3"><Field label="Start Time" value="No Data" /><Field label="End Time" value="No Data" /></div><button className="mt-3 rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">+ Add Window</button></div><button className="absolute bottom-0 left-0 right-0 rounded bg-[#087a35] py-3 text-[10px] font-semibold">Apply Schedule: No Data</button></div>;
}

function SwitchScheduleReview() {
  const selected = [["No Data", "No approved device schedule source exists."]];
  return <div className="relative h-[calc(100%-22px)] overflow-hidden pb-12 text-[9px]"><p className="mb-2 text-slate-400">Review and confirm your schedule settings.</p><div className="rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-3 font-semibold uppercase">Selected Switches (4)</div><div className="space-y-3">{selected.map(([name, detail]) => <div className="grid grid-cols-[18px_22px_1fr] gap-3" key={name}><span className="mt-1 text-[#05ff5e]">●</span><span className="grid size-5 place-items-center rounded border border-slate-600 text-slate-400">▣</span><span><b>{name}</b><br /><span className="text-[8px] text-slate-400">{detail}</span></span></div>)}</div></div><div className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-3 font-semibold uppercase">Schedule Preview</div><div className="grid grid-cols-[76px_18px_1fr] gap-2"><span>06:00 AM</span><span className="h-10 border-l border-[#05ff5e]" /><span className="text-[#05ff5e]">ON</span><span>10:00 PM</span><span className="h-4 border-l border-red-400" /><span className="text-red-400">OFF</span></div><div className="mt-1 text-center text-slate-400">Mon, Tue, Wed, Thu, Fri</div></div><div className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-3 font-semibold uppercase">Next 5 Occurrences (Local Time)</div><div className="space-y-1.5">{["Tue, May 13", "Wed, May 14", "Thu, May 15", "Fri, May 16", "Mon, May 19"].map((day) => <div className="grid grid-cols-[1fr_70px_28px_70px_28px]" key={day}><span>{day}</span><span>06:00 AM</span><span className="text-[#05ff5e]">ON</span><span>10:00 PM</span><span className="text-red-400">OFF</span></div>)}</div></div><div className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061421] p-3"><div className="mb-2 font-semibold uppercase">Schedule Status</div><div className="flex gap-3"><span>▣</span><span>This schedule will be active immediately after saving.</span></div></div><button className="absolute bottom-0 right-0 rounded border border-cyan-300/12 bg-[#061421] px-8 py-3">▣ &nbsp; View All Schedules</button></div>;
}

function DeviceCommissioningScreen({ data }: { data?: DevicesData }) {
  const equipmentRows = deviceRowsForVariant(data, "switchesList")
    .slice(0, 6)
    .map((row) => [row.name, row.serialNumber, row.status, row.lastSeen === "No Data" ? "No Data" : "Connected", row.lastSeen]);
  const testReadings = telemetryRowsFromData(data);
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
            <DashboardPanel action="⟳ Refresh Status" title="Equipment Status" variant="enterprise"><DeviceTable headers={["Equipment", "Serial Number", "Status", "Communication", "Last Check"]} rows={equipmentRows.length > 0 ? equipmentRows : [["No Data", "No Data", "No Data", "No Data", "No scoped ECBS switch rows were found."]]} /></DashboardPanel>
            <DashboardPanel action="▧ View Historical Data" title={<span>Live Test Readings <b className="ml-4 rounded bg-[#063b27] px-2 py-1 text-[9px] text-[#05ff5e]">Testing Mode: No Data</b></span>} variant="enterprise"><DeviceTable headers={["Parameter", "Baseline (OFF)", "Live Test (ON)", "Improvement", "Target", "Status"]} rows={testReadings} /></DashboardPanel>
            <section className="grid min-h-0 grid-cols-[0.95fr_0.92fr] gap-3">
              <DashboardPanel title="Test Notes" variant="enterprise"><div className="relative h-full rounded border border-cyan-300/12 bg-[#03111c] p-3 text-[9px] text-slate-500">Enter test notes, observations, or comments...<span className="absolute bottom-3 right-3 text-slate-400">0 / 1000</span></div></DashboardPanel>
              <DashboardPanel title="Test Confirmation" variant="enterprise"><div className="space-y-3 text-[9px]"><label className="grid grid-cols-[16px_1fr] gap-2"><span className="mt-0.5 size-3 rounded border border-slate-600" /><span>No approved commissioning confirmation source exists.</span></label><div className="grid grid-cols-2 gap-3"><Field label="Tested By" value="No Data" /><Field label="Date & Time" value="No Data" /></div></div></DashboardPanel>
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

function CommissioningNextStepsScreen({ data }: { data?: DevicesData }) {
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
        <NextProjectSummary data={data} />
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

function NextProjectSummary({ data }: { data?: DevicesData }) {
  const items = [
    ["▣", "bg-[#147dff]", "Project Name", "No Data"],
    ["▤", "bg-[#22c55e]", "Project ID", "No Data"],
    ["▥", "bg-[#7c3aed]", "Site", "No Data"],
    ["▧", "bg-[#f59e0b]", "Current Stage", "Commissioning & Testing"],
    ["", "", "Overall Progress", "No Data"],
    ["▣", "bg-cyan-500", "Last Updated", data?.updatedAt ?? "No Data"],
  ];
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4"><h2 className="mb-4 text-[12px] font-semibold">Project Summary</h2><div className="grid grid-cols-[1.05fr_1fr_0.9fr_1fr_1fr_1fr] items-center gap-4 text-[9px]">{items.map(([icon, tone, label, value], index) => <div className="flex items-center gap-3" key={label}>{index === 4 ? <div className="grid size-16 place-items-center rounded-full" style={{ background: "conic-gradient(#334155 0 100%)" }}><span className="grid size-12 place-items-center rounded-full bg-[#061521] text-[12px]">No Data</span></div> : <span className={`grid size-8 place-items-center rounded-full ${tone} text-white`}>{icon}</span>}<span><span className="text-[8px] text-slate-500">{label}</span><br /><b className="text-slate-100">{value}</b></span></div>)}</div></section>;
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

function JobCostingScreen({ data, variant }: { data?: DevicesData; variant: "jobCosting" | "jobInvoices" | "jobProductionTime" | "jobReports" }) {
  if (variant === "jobProductionTime") return <ProductionTimeScreen />;
  if (variant === "jobInvoices") return <InvoicesScreen />;
  if (variant === "jobReports") return <JobReportsScreen />;
  return <JobCostingMainScreen data={data} />;
}

function JobCostingMainScreen({ data }: { data?: DevicesData }) {
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
              <JobKpi icon="ϟ" label="Total kWh" value={data?.telemetry.kilowattHours ?? "No Data"} detail="Latest telemetry only; no job allocation model" tone="blue" />
              <JobKpi icon="▥" label="Total kVAh" value={data?.telemetry.kilovoltAmps ?? "No Data"} detail="No approved apparent-energy source" tone="green" />
              <JobKpi icon="⌁" label="Peak Demand" value={data?.telemetry.kilowatts ?? "No Data"} detail="Latest kW only; no demand rollup" tone="yellow" />
              <JobKpi icon="$" label="Total Cost" value="No Data" detail="No approved job costing source" tone="purple" />
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
  const rows = [["No Data", "No Data", "No Data", "No approved job-costing source"]];
  return <div className="grid h-full grid-cols-[190px_1fr] items-center gap-5"><div className="grid size-36 place-items-center rounded-full bg-slate-800"><span className="grid size-24 place-items-center rounded-full bg-[#061521] text-center text-base">No Data<br /><b className="text-[9px] font-normal text-slate-400">Total Cost</b></span></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr><th className="pb-2">Cost Center / Job</th><th className="pb-2 text-right">kWh</th><th className="pb-2 text-right">kW (Peak)</th><th className="pb-2 text-right">Cost</th></tr></thead><tbody>{rows.map(([name, kwh, kw, cost]) => <tr className="border-t border-white/5" key={name}><td className="py-2">{name}</td><td className="py-2 text-right">{kwh}</td><td className="py-2 text-right">{kw}</td><td className="py-2 text-right">{cost}</td></tr>)}</tbody></table></div>;
}

function JobCostingResults() {
  return <><p className="mb-2 text-[8px] text-slate-400">Detailed energy and cost allocation for selected job / cost center.</p><DeviceTable headers={["Metric", "Value", "Unit", "% of Total", "Rate", "Cost"]} rows={[["No Data", "No Data", "No Data", "No Data", "No Data", "No approved job-costing source"]]} /><div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-[10px]"><span>Total Cost Allocated</span><b className="text-[#05ff5e]">No Data</b></div></>;
}

function ProductionTimeFilter() {
  return <div className="space-y-2 text-[9px]"><p className="text-[8px] text-slate-400">Define production time included in allocation.</p><Field label="Schedule" value="Production Schedule - Day Shift⌄" /><Field label="Production Time" value="May 1, 2025 6:00 AM  →  May 12, 2025 6:00 PM" /><MetricList rows={[["Included Time", "87.5% (210.00 hrs)"], ["Excluded Time", "12.5% (30.00 hrs)"], ["Total Time", "240.00 hrs"]]} /><button className="float-right rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5 text-[9px]">View / Edit Production Time</button></div>;
}

function CostBreakdown() {
  return <div className="text-[9px]"><p className="mb-3 text-[8px] text-slate-400">Breakdown of costs for selected job / cost center.</p><table className="w-full text-left"><thead className="text-slate-500"><tr><th className="pb-2">Cost Component</th><th className="pb-2 text-right">Amount (USD)</th><th className="pb-2 text-right">% of Total Cost</th></tr></thead><tbody>{[["No Data", "No Data", "No approved job-costing source"]].map(([label, value, pct]) => <tr className="border-t border-white/5" key={label}><td className="py-3">{label}</td><td className="text-right">{value}</td><td className="text-right">{pct}</td></tr>)}</tbody></table><div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-[11px]"><span>Total Cost</span><b className="text-[#05ff5e]">No Data</b><span>No Data</span></div></div>;
}

function JobCostTrend() {
  return <div className="grid h-full place-items-center rounded border border-dashed border-cyan-300/20 text-center text-[9px] text-slate-400"><span>No approved job-cost trend source exists.<br />Costing derivatives remain No Data.</span></div>;
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
          <JobKpi icon="▤" label="Total Invoices" value="No Data" detail="No approved invoice source" tone="blue" />
          <JobKpi icon="$" label="Total Invoiced" value="No Data" detail="No approved invoice source" tone="green" />
          <JobKpi icon="▧" label="Total Payments" value="No Data" detail="No approved payment source" tone="purple" />
          <JobKpi icon="◷" label="Outstanding" value="No Data" detail="No approved payment source" tone="yellow" />
          <JobKpi icon="▥" label="Past Due" value="No Data" detail="No approved invoice source" tone="cyan" />
          <JobKpi icon="%" label="Collection Rate" value="No Data" detail="No approved collection model" tone="gray" />
        </section>
        <section className="mt-2 grid h-[34px] grid-cols-[1fr_116px_126px_126px_146px_82px] gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left text-slate-400">⌕ &nbsp; Search invoices...</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">Status: All⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">Invoice Type: All⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">Cost Center: All⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 text-left">▣ May 1 - May 12, 2025⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3">▽ Filters</button></section>
        <section className="mt-2 grid h-[620px] min-h-0 grid-cols-[1.48fr_0.62fr] gap-2">
          <DashboardPanel title="Invoices (No Data)" variant="enterprise"><InvoiceList /></DashboardPanel>
          <div className="grid min-h-0 grid-rows-[250px_214px_1fr] gap-2 overflow-hidden">
            <DashboardPanel title={<span className="flex items-center justify-between">Invoice Details <b className="rounded bg-slate-800 px-2 py-1 text-[8px] text-slate-300">No Data</b></span>} variant="enterprise"><InvoiceDetails /></DashboardPanel>
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
    ["No Data", "No Data", "No approved payment/invoice source", "No Data", "No Data", "No Data", "No Data", "No Data"],
  ];
  return <div className="h-full text-[9px]"><div className="mb-3 flex justify-end gap-2"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5">Sort by: Invoice Date (Newest)⌄</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">☷</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2">▦</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["", "Invoice #", "Invoice Date", "Customer / Cost Center", "Job / Work Order", "Period", "Amount", "Status", "Due Date", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}><td className="py-[7px]"><span className="inline-block size-3 rounded border border-slate-600" /></td>{row.map((cell, index) => <td className={index === 0 ? "py-[7px] text-cyan-300" : "py-[7px] text-slate-300"} key={`${row[0]}-${index}`}>{index === 2 ? cell.split("\n").map((part) => <span className={part === cell.split("\n")[1] ? "block text-[8px] text-slate-500" : "block"} key={part}>{part}</span>) : index === 6 ? <InvoiceStatus status={cell} /> : cell}</td>)}<td className="py-[7px] text-slate-300">⋮</td></tr>)}</tbody></table><div className="mt-4 flex items-center justify-between text-[9px] text-slate-400"><span>Showing No Data invoices</span><span>‹ &nbsp; <b className="rounded border border-[#05ff5e] px-3 py-2 text-[#05ff5e]">1</b> &nbsp; ›</span></div></div>;
}

function InvoiceStatus({ status }: { status: string }) {
  const cls = status === "Paid" ? "border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : status === "Sent" ? "border-sky-400 bg-[#08233c] text-sky-300" : status === "Overdue" ? "border-red-400 bg-red-950/50 text-red-300" : "border-yellow-300 bg-yellow-950/40 text-yellow-300";
  return <span className={`rounded border px-2 py-0.5 text-[8px] ${cls}`}>{status}</span>;
}

function InvoiceDetails() {
  const fields = [["Customer / Cost Center", "No Data"], ["Invoice Type", "No Data"], ["Job / Work Order", "No Data"], ["Period", "No Data"], ["Invoice Date", "No Data"], ["PO / Reference", "No Data"], ["Due Date", "No Data"], ["Payment Terms", "No Data"]];
  return <div className="text-[9px]"><div className="mb-4 flex items-start justify-between"><div><h3 className="text-[16px] font-light">No Data</h3></div><div className="flex gap-3 text-[9px]"><span>▧ PDF</span><span>✉ Email</span><span>▣ Print</span><span>⋮</span></div></div><div className="grid grid-cols-2 gap-x-5 gap-y-3">{fields.map(([label, value]) => <div key={label}><div className="text-[8px] text-slate-500">{label}</div><div className="mt-1 whitespace-pre-line text-[#05ff5e]">{value}</div></div>)}</div></div>;
}

function InvoiceLineItems() {
  const rows = [["No Data", "No Data", "No Data", "No approved invoice line-item source"]];
  return <div className="text-[8px]"><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Description", "kWh", "kW (Peak)", "Amount (USD)"].map((header) => <th className="pb-1 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={index === 3 ? "py-1 text-right text-slate-200" : "py-1 text-slate-300"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 space-y-0.5 border-t border-white/10 pt-1"><div className="flex justify-between"><span>Subtotal</span><b>No Data</b></div><div className="flex justify-between"><span>Tax</span><b>No Data</b></div><div className="flex justify-between text-[9px] uppercase"><span>Total</span><b className="text-[#05ff5e]">No Data</b></div></div></div>;
}

function PaymentHistory() {
  return <div className="text-[8.5px]"><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Date", "Type", "Reference #", "Amount", "Status"].map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{[["No Data", "No Data", "No Data", "No Data", "No approved payment source"]].map((row) => <tr className="border-t border-white/5" key={row[1]}>{row.map((cell, index) => <td className={index === 4 ? "py-1.5 text-[#05ff5e]" : "py-1.5 text-slate-300"} key={`${row[1]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table><button className="mt-2 w-full rounded border border-cyan-300/12 bg-[#061421] py-1.5">View Invoice History</button></div>;
}

function ProductionTimeScreen() {
  return (
    <EcbsAppShell activeHref="/financials/job-costing-invoicing">
      <div className="flex h-full min-h-0 flex-col px-3 py-2">
        <JobCostingHeader leaf="Production Time" section="Production Time" />
        <JobCostingTabs active="Production Time" primaryAction="Save Changes" secondaryAction="" />
        <section className="mt-2 grid h-[126px] grid-cols-[1.3fr_0.78fr] gap-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
          <div><h2 className="text-[12px] font-semibold uppercase">Production Time Configuration</h2><p className="mt-1 text-[9px] text-slate-400">Define where energy usage is considered Production Time for job costing and invoicing.</p><div className="mt-4 grid grid-cols-2 gap-4"><Field label="Select Site / Deployment" value="No Data⌄" /><Field label="Time Zone" value="No Data⌄" /></div></div>
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
  const jobs = [["No Data", "No approved production-time job source", false]] as const;
  return <div className="text-[9px]"><p className="mb-3 text-slate-400">Choose one or more jobs to set production time.</p><div className="mb-3 grid grid-cols-[1fr_auto] gap-2"><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left text-slate-400">⌕ &nbsp; Search jobs...</button><button className="px-2 text-[#29b6f6]">Select All</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr><th className="pb-2"></th><th className="pb-2">Job ID</th><th className="pb-2">Job Name</th></tr></thead><tbody>{jobs.map(([id, name, checked]) => <tr className="border-t border-white/5" key={id}><td className="py-2"><span className={checked ? "grid size-4 place-items-center rounded bg-[#22c55e] text-[#02100a]" : "grid size-4 rounded border border-slate-600"}>{checked ? "✓" : ""}</span></td><td className="py-2">{id}</td><td className="py-2">{name}</td></tr>)}</tbody></table><p className="mt-4 text-[#05ff5e]">No Data jobs selected</p></div>;
}

function WeeklyProductionTime() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return <div className="text-[9px]"><p className="mb-3 text-slate-400">Choose how production time is defined.</p><div className="mb-4 flex gap-8 border-b border-cyan-300/10 text-[9px]"><span className="border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]">Weekly Schedule</span><span>Date Range</span><span>Shift Based</span><span>Custom Calendar</span></div><p className="mb-2 text-slate-400">Define weekly recurring production time.</p><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Day of Week", "Production Start", "Production End", "Breaks (Optional)", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{days.map((day) => <tr className="border-t border-white/5" key={day}><td className="py-1.5"><span className="mr-2 inline-block size-4 rounded border border-slate-600 align-middle" />{day}</td><td><button className="rounded border border-cyan-300/12 bg-[#03111c] px-5 py-1">No Data</button></td><td><button className="rounded border border-cyan-300/12 bg-[#03111c] px-5 py-1">No Data</button></td><td><button className="rounded border border-cyan-300/12 bg-[#03111c] px-5 py-1">No Data</button></td><td className="text-slate-300">▧ &nbsp; <span className="text-red-400">▢</span></td></tr>)}</tbody></table><button className="mt-3 rounded border border-sky-400/25 bg-[#061421] px-4 py-2 text-[#29b6f6]">+ Add Break</button><p className="mt-3 text-[8px] text-slate-400">No approved production-time schedule source exists.</p></div>;
}

function ProductionSummary() {
  return <div className="space-y-2 text-[8.5px]"><p className="text-slate-400">Review production time settings.</p><div className="rounded border border-cyan-300/12 bg-[#061421] p-2.5"><b>Selected Jobs (No Data)</b><div className="mt-1.5 space-y-1"><div className="text-slate-300"><span className="mr-2 text-[#05ff5e]">●</span>No approved production-time job source</div></div></div><div className="rounded border border-cyan-300/12 bg-[#061421] p-2.5"><b>Weekly Production Schedule</b><div className="mt-1.5 space-y-0.5 text-slate-300"><div>No Data</div></div></div><div className="space-y-0.5"><b>What happens outside production time?</b><div><span className="text-slate-500">○</span> No Data</div></div></div>;
}

function ProductionExceptions() {
  const rows = [["No Data", "No Data", "No approved production-time exception source", "No Data"]];
  return <div className="text-[9px]"><div className="mb-3 flex items-center justify-between"><p className="text-slate-400">Add dates when production time does not apply.</p><button className="rounded border border-sky-400/25 bg-[#061421] px-3 py-1.5 text-[#29b6f6]">+ Add Exception</button></div><table className="w-full text-left"><thead className="text-slate-500"><tr>{["Date", "Type", "Description", "Applies To", "Actions"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell) => <td className="py-2" key={`${row[0]}-${cell}`}>{cell}</td>)}<td className="py-2 text-red-400">▢</td></tr>)}</tbody></table></div>;
}

function ProductionCalendar() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "No", "Data", "No", "Data", "No", "Data", "No", "Data", "No", "Data", "No", "Data", "No", "Data"];
  return <div className="text-[9px]"><div className="mb-2 flex justify-between"><span>No Data</span><span className="text-[#29b6f6]">‹ &nbsp; ›</span></div><div className="grid grid-cols-7 gap-1 text-center">{days.map((day, index) => <div className={index < 7 ? "py-1 text-slate-400" : "rounded bg-[#03111c] py-1 text-slate-400"} key={`${day}-${index}`}>{day}</div>)}</div><div className="mt-3 flex gap-5 text-[8px] text-slate-400"><span><b className="text-[#05ff5e]">■</b> Production Time: No Data</span><span><b>□</b> Non-Production Time: No Data</span></div></div>;
}

function ProductionApplySettings() {
  return <div className="space-y-3 text-[9px]"><p className="text-slate-400">Apply production time settings to selected jobs.</p><button className="w-full rounded bg-[#087a35] py-3 text-[10px]">Apply to No Data Jobs</button><button className="w-full rounded border border-cyan-300/12 bg-[#061421] py-2.5">Cancel</button><div className="rounded border border-cyan-300/12 bg-[#061421] p-3 text-slate-400"><span className="mr-2 text-sky-400">ⓘ</span>No approved production-time write model exists.</div></div>;
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
          <JobReportKpi icon="ϟ" label="Total Energy (kWh)" value="No Data" detail="No approved report source" delta="No Data" tone="blue" />
          <JobReportKpi icon="$" label="Total Cost (USD)" value="No Data" detail="No approved cost source" delta="No Data" tone="green" />
          <JobReportKpi icon="▧" label="Peak Demand (kW)" value="No Data" detail="No approved demand report source" delta="No Data" tone="purple" />
          <JobReportKpi icon="◴" label="Demand Cost (USD)" value="No Data" detail="No approved cost source" delta="No Data" tone="orange" />
          <JobReportKpi icon="%" label="Power Factor (Avg)" value="No Data" detail="No approved report source" delta="No Data" tone="cyan" />
          <JobReportKpi icon="●" label="Total Savings (USD)" value="No Data" detail="No approved savings source" delta="No Data" tone="green" />
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
  const filters = [["Date Range", "No Data"], ["Comparison", "No Data⌄"], ["Group By", "No Data⌄"], ["Site / Deployment", "No Data⌄"], ["Switch / Circuit", "No Data⌄"]];
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
  return (
    <div className="h-full text-[8px]">
      <div className="mb-2 flex items-center gap-7 text-slate-400"><span className="text-[#05ff5e]">kWh</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#22c55e]" />Energy (kWh)</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#147dff]" />Total Cost (USD)</span><span><i className="mr-1 inline-block h-0.5 w-4 bg-[#f59e0b]" />Peak Demand (kW)</span><span className="ml-auto text-yellow-300">USD &nbsp;&nbsp; kW</span></div>
      <NoDataChartBlock label="No approved job-costing report trend source exists." />
      <div className="ml-9 mr-9 flex justify-between text-[7.5px] text-slate-400"><span>No Data</span></div>
    </div>
  );
}

function JobReportDonut() {
  const rows = [["No Data", "No Data", "No Data", "#64748b"]];
  return <div className="grid h-full grid-cols-[138px_1fr] items-center gap-5"><div className="grid size-32 place-items-center rounded-full bg-slate-800"><span className="grid size-[82px] place-items-center rounded-full bg-[#061521] text-center text-[16px]">No Data<br /><b className="text-[9px] font-normal text-slate-400">Total kWh</b></span></div><div className="space-y-2 text-[8px]">{rows.map(([name, value, pct, color]) => <div className="grid grid-cols-[1fr_42px_38px] gap-2" key={name}><span className="truncate"><i className="mr-2 inline-block size-2 rounded-sm" style={{ backgroundColor: color }} />{name}</span><span className="text-right text-slate-200">{value}</span><span className="text-right text-slate-300">{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Full Breakdown →</div></div></div>;
}

function JobReportSummary() {
  const rows = [["Total Energy (kWh)", "No Data"], ["Total Cost (USD)", "No Data"], ["Demand Cost (USD)", "No Data"], ["Energy Cost (USD)", "No Data"], ["Other Charges (USD)", "No Data"], ["Power Factor (Avg)", "No Data"], ["Peak Demand (kW)", "No Data"], ["Savings vs Baseline (USD)", "No Data"], ["Savings %", "No Data"]];
  return <div className="space-y-1.5 text-[8.5px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-300">{label}</span><b className={label.includes("Savings") ? "text-[#05ff5e]" : "text-slate-100"}>{value}</b></div>)}</div>;
}

function JobReportCostTable() {
  const headers = ["Cost Center / Job", "kWh", "% of Total kWh", "kW (Peak)", "Demand Cost (USD)", "Energy Cost (USD)", "Other Charges (USD)", "Total Cost (USD)", "% of Total Cost", "Savings (USD)"];
  const rows = [["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No approved job-costing report source"]];
  return <table className="w-full text-left text-[8px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={row[0] === "TOTAL" ? "py-[7px] font-semibold text-slate-100" : index === 0 ? "py-[7px] text-slate-300" : index === 9 ? "py-[7px] text-[#05ff5e]" : "py-[7px] text-slate-300"} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function JobReportTopCosts() {
  const rows = [["No Data", "No Data", "No approved cost source"]];
  return <div className="space-y-0.5 text-[7.5px]"><div className="grid grid-cols-[1fr_58px_58px] gap-2 text-slate-500"><span>Cost Center</span><span>Total Cost (USD)</span><span>% of Total Cost</span></div>{rows.map(([label, cost, pct]) => <div className="grid grid-cols-[1fr_58px_58px] gap-2 border-b border-white/5 pb-0.5" key={label}><span>{label}</span><b className="text-right text-slate-100">{cost}</b><span className="text-right text-slate-300">{pct}</span></div>)}<div className="pt-0.5 text-[#05ff5e]">View All Cost Centers →</div></div>;
}

function JobReportActions() {
  const rows = ["Export to PDF", "Export to Excel", "Schedule Report", "Save Report Template", "Share Report"];
  return <div className="space-y-0 text-[7.5px]">{rows.map((row, index) => <button className="grid w-full grid-cols-[18px_1fr_10px] items-center border-b border-white/5 py-[3px] text-left" key={row}><span>{["▧", "▥", "◷", "◇", "⌘"][index]}</span><span>{row}</span><span>›</span></button>)}</div>;
}
function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-1 text-[8px] text-slate-500">{label}</div><div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-[9px] text-slate-200">{value}</div></div>;
}

function summaryForKind(data: DevicesData | undefined, kind: string) {
  return data?.summaries.find((row) => row.kind === kind) ?? { kind, offline: 0, online: 0, total: 0, warning: 0 };
}

function percentage(value: number, total: number) {
  if (!total) {
    return "No Data";
  }

  return `${((value / total) * 100).toFixed(1)}%`;
}

function statusRows(summary: { offline: number; online: number; total: number; warning: number }, kind: string): [string, string][] {
  if (kind === "Repeater") {
    return noDataRows("No approved repeater model");
  }

  if (!summary.total) {
    return noDataRows("No scoped ECBS device rows were found.");
  }

  return [
    ["Online", `${summary.online} (${percentage(summary.online, summary.total)})`],
    ["Warning", `${summary.warning} (${percentage(summary.warning, summary.total)})`],
    ["Offline", `${summary.offline} (${percentage(summary.offline, summary.total)})`],
  ];
}

function noDataRows(message: string): [string, string][] {
  return [["No Data", message]];
}

function deviceRowsForVariant(data: DevicesData | undefined, variant: DeviceScreenVariant): DeviceDataRow[] {
  if (!data || data.state === "no-data") {
    return [];
  }

  const kind = variant === "meters" ? "Meter" : variant === "gateways" ? "Gateway" : variant === "switchesList" || variant === "scheduling" ? "Switch" : variant === "repeaters" ? "Repeater" : "";

  if (!kind || kind === "Repeater") {
    return [];
  }

  return data.devices.filter((row) => row.kind === kind && row.name !== "No Data");
}

function scheduleRowsFromData(data: DevicesData | undefined): readonly (readonly [string, string, string, string, string, boolean, boolean])[] {
  const rows = deviceRowsForVariant(data, "switchesList").slice(0, 12);

  if (rows.length === 0) {
    return [["No Data", "No Data", "No scoped ECBS switch rows were found.", "No Data", "No approved scheduling source", false, false]];
  }

  return rows.map((row, index) => [row.name, row.kind, row.location, row.status, "No approved scheduling source", index < 4, row.isMain] as const);
}

function summaryLabel(data: DevicesData | undefined, variant: DeviceScreenVariant) {
  const kind = variant === "meters" ? "Meter" : variant === "gateways" ? "Gateway" : variant === "switchesList" ? "Switch" : variant === "repeaters" ? "Repeater" : "";

  if (!kind || kind === "Repeater") {
    return "No Data";
  }

  const summary = summaryForKind(data, kind);

  return summary.total > 0 ? `${summary.total} ${kind.toLowerCase()}s` : "No Data";
}

function telemetryRowsFromData(data: DevicesData | undefined): string[][] {
  return [
    ["Power Factor", "No Data", data?.telemetry.powerFactor ?? "No Data", "No Data", "No approved target", data?.telemetry.powerFactor === "No Data" ? "No Data" : "Data"],
    ["Total Harmonic Distortion (THD)", "No Data", "No Data", "No Data", "No approved THD source", "No Data"],
    ["kVA Demand", "No Data", data?.telemetry.kilovoltAmps ?? "No Data", "No Data", "No approved demand rollup", data?.telemetry.kilovoltAmps === "No Data" ? "No Data" : "Data"],
    ["kW", "No Data", data?.telemetry.kilowatts ?? "No Data", "No Data", "Latest telemetry only", data?.telemetry.kilowatts === "No Data" ? "No Data" : "Data"],
    ["Voltage (L-L Avg)", "No Data", "No Data", "No Data", "No approved voltage source", "No Data"],
    ["System Frequency", "No Data", "No Data", "No Data", "No approved frequency source", "No Data"],
  ];
}

function selectedDevice(data: DevicesData | undefined, kind: string): DeviceDataRow {
  const row = kind === "Repeater" ? undefined : data?.devices.find((device) => device.kind === kind && device.name !== "No Data");

  return row ?? {
    firmware: "No Data",
    healthScore: "No Data",
    id: "no-data",
    isMain: false,
    kind,
    lastSeen: "No Data",
    location: "No Data",
    name: "No Data",
    serialNumber: "No Data",
    status: kind === "Repeater" ? "No Data" : "No scoped ECBS device row",
  };
}

function emptyTelemetry(): DevicesData["telemetry"] {
  return {
    kilovoltAmps: "No Data",
    kilowattHours: "No Data",
    kilowatts: "No Data",
    powerFactor: "No Data",
    timestamp: "No Data",
  };
}

function NoDataChartBlock({ label }: { label: string }) {
  return <div className="grid h-[120px] place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] text-center text-[9px] text-slate-400">{label}</div>;
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
