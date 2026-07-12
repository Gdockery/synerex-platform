import type { ReactNode } from "react";

const rows = [
  ["CM-20250518-00186", "Flex Tijuana Manufacturing\nMain Electrical Room", "Switch", "SW-00048 (ACB Main)", "Miguel Alvarez", "May 18, 2025 09:32 AM", "00:42:15", "Successful", "100%"],
  ["CM-20250518-00185", "Flex Juarez\nElectrical Room 1", "Gateway", "GW-00067", "Carlos Ramirez", "May 18, 2025 08:15 AM", "00:28:44", "Successful", "98%"],
  ["CM-20250517-00184", "Flex Monterrey\nElectrical Room 2", "Meter", "MT-00023", "Luis Hernandez", "May 17, 2025 03:45 PM", "00:35:20", "Successful", "100%"],
  ["CM-20250517-00183", "Flex Tijuana Manufacturing\nLine 3 MCC", "Repeater", "RP-00023", "Miguel Alvarez", "May 17, 2025 02:10 PM", "00:16:08", "Successful", "97%"],
  ["CM-20250517-00182", "Flex Tijuana Manufacturing\nElectrical Room 2", "Switch", "SW-00027 (Air Circuit Breaker)", "Miguel Alvarez", "May 17, 2025 11:22 AM", "00:51:36", "Requires Attention", "82%"],
  ["CM-20250517-00181", "Flex El Paso\nUtility Yard", "Meter", "MT-00077", "Carlos Ramirez", "May 17, 2025 10:05 AM", "00:33:14", "In Progress", "--"],
  ["CM-20250516-00180", "Flex Reynosa\nMain Electrical Room", "Gateway", "GW-00068", "Javier Soto", "May 16, 2025 04:18 PM", "00:29:10", "Successful", "99%"],
  ["CM-20250516-00179", "Flex Matamoros\nElectrical Room", "Switch", "SW-00015 (Utility Breaker)", "Javier Soto", "May 16, 2025 02:48 PM", "00:47:31", "Failed", "45%"],
  ["CM-20250516-00178", "Flex Tijuana Manufacturing\nHVAC Panel", "Repeater", "RP-00011", "Miguel Alvarez", "May 16, 2025 12:40 PM", "00:14:22", "Successful", "100%"],
  ["CM-20250516-00177", "Flex Chihuahua\nElectrical Room 1", "Meter", "MT-00019", "Luis Hernandez", "May 15, 2025 01:30 PM", "00:31:09", "Successful", "98%"],
  ["CM-20250516-00176", "Flex Tijuana Manufacturing\nTransformer T1", "Switch", "SW-00048 (ACB Main)", "Miguel Alvarez", "May 15, 2025 11:12 AM", "00:53:48", "Successful", "100%"],
  ["CM-20250514-00175", "Flex Saltillo\nElectrical Room", "Gateway", "GW-00061", "Carlos Ramirez", "May 14, 2025 04:05 PM", "00:27:31", "Requires Attention", "78%"],
  ["CM-20250514-00174", "Flex Tijuana Manufacturing\nLine 1 MCC", "Meter", "MT-00051", "Miguel Alvarez", "May 14, 2025 01:43 PM", "00:32:18", "Successful", "99%"],
  ["CM-20250513-00173", "Flex Nogales\nElectrical Room", "Repeater", "RP-00007", "Javier Soto", "May 13, 2025 03:20 PM", "00:15:49", "Successful", "100%"],
  ["CM-20250513-00172", "Flex Tijuana Manufacturing\nUPS Room", "Switch", "SW-00012 (HVAC Switch)", "Miguel Alvarez", "May 13, 2025 10:18 AM", "00:45:02", "In Progress", "--"],
];

function ClientProjectSourceMissing({ message = "source_missing: Client project backend source/write model is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function CommissioningHistoryScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <CommissioningSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <CommissioningTopbar />
          <ClientProjectSourceMissing />
          <section className="flex h-[102px] items-start justify-between pt-3">
            <div>
              <div className="text-[9px] text-slate-400">Home &nbsp; &gt; &nbsp; Commissioning & Testing &nbsp; &gt; &nbsp; <span className="text-slate-100 underline">Commissioning History</span></div>
              <h1 className="mt-3 text-[22px] font-semibold leading-none">Commissioning History</h1>
              <p className="mt-2 text-[10px] text-slate-400">Review historical commissioning, testing and verification results for all sites and devices.</p>
            </div>
            <div className="mt-5 flex gap-3 text-[10px]"><ActionButton>Export Report</ActionButton><ActionButton>Download Data (CSV)</ActionButton><ActionButton>Filters <b className="ml-2 rounded-full bg-[#147dff] px-1.5 text-white">0</b></ActionButton></div>
          </section>
          <section className="grid h-[104px] grid-cols-[1fr_1fr_1fr_1fr_1fr_1.94fr] gap-2">
            <CommissioningKpi label="Total Commissioning Records" value="No Data" detail="source_missing" icon="▣" tone="#147dff" />
            <CommissioningKpi label="Successful" value="No Data" detail="source_missing" icon="✓" tone="#05ff5e" />
            <CommissioningKpi label="In Progress" value="No Data" detail="source_missing" icon="◷" tone="#147dff" />
            <CommissioningKpi label="Requires Attention" value="No Data" detail="source_missing" icon="!" tone="#f59e0b" />
            <CommissioningKpi label="Failed" value="No Data" detail="source_missing" icon="×" tone="#ef4444" />
            <ResultsOverview />
          </section>
          <section className="mt-4 grid h-[38px] grid-cols-[122px_1fr_122px_150px_150px_1fr_78px_96px] gap-2 text-[9px]">
            <FilterField label="Date Range" value="Custom" />
            <FilterField label=" " value="Apr 01, 2025   ->   May 18, 2025" />
            <FilterField label="Site" value="All Sites" />
            <FilterField label="Device Type" value="All Types" />
            <FilterField label="Commissioning Status" value="All Status" />
            <FilterField label=" " value="Search records..." />
            <button className="pt-4 text-[#05bfff]">Clear All</button>
            <button className="mt-[14px] rounded bg-[#147dff] px-3 text-white">Apply Filters</button>
          </section>
          <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1fr_244px] gap-3">
            <CommissioningTable />
            <CommissioningRightRail />
          </section>
          <CommissioningFooter />
        </main>
      </div>
    </div>
  );
}

function CommissioningSidebar() {
  const groups = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Electrical Network", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters", "Devices"]],
    ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Firmware"]],
    ["COMMISSIONING & TESTING", ["Field Testing", "Commissioning & Testing", "Commissioning History", "Test Templates", "Test Procedures"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-3"><div className="text-[28px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[8px]">{groups.map(([title,items])=><section key={String(title)}><h2 className="mb-1 text-[#05ff5e]">{title}</h2>{(items as string[]).map(item=><div className={item==="Commissioning History" ? "flex h-[20px] items-center rounded bg-[#063b27] px-1.5 text-[#05ff5e]" : "flex h-[20px] items-center rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; {item}</div>)}</section>)}</nav><div className="absolute bottom-[84px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-2 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[28px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-2 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[42px] left-3 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function CommissioningTopbar() {
  return <header className="flex h-[48px] items-center justify-between border-b border-cyan-300/10"><div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[156px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[198px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">May 11 - May 18, 2025<br/><span className="text-[8px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ActionButton({ children }: { children: ReactNode }) {
  return <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-slate-100">{children}</button>;
}

function CommissioningKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className="grid grid-cols-[1fr_42px] rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><span><div className="text-[8px] text-slate-400">{label}</div><div className="mt-2 text-[22px] leading-none">{value}</div><div className="mt-2 text-[9px]" style={{color:tone}}>{detail}</div></span><span className="grid size-9 place-items-center self-center rounded-full border text-lg" style={{borderColor:tone,color:tone}}>{icon}</span></article>;
}

function ResultsOverview() {
  const rows = [["Successful","158 (84.9%)","#05ff5e"],["In Progress","16 (8.6%)","#147dff"],["Requires Attention","7 (3.8%)","#f59e0b"],["Failed","5 (2.7%)","#ef4444"]];
  return <article className="grid grid-cols-[84px_1fr] rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[8px]"><div className="relative size-[78px]"><svg className="size-[78px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="181 214" strokeWidth="16" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="18 214" strokeDashoffset="-181" strokeWidth="16" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="8 214" strokeDashoffset="-199" strokeWidth="16" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute inset-0 grid place-items-center text-center"><b className="text-[20px]">186<br/><span className="text-[8px] font-normal">Total</span></b></div></div><div><div className="mb-2 text-[8px]">Results Overview</div><div className="space-y-2">{rows.map(([l,v,c])=><div className="grid grid-cols-[10px_1fr_auto] gap-2" key={l}><span className="mt-1 size-2 rounded-full" style={{background:c}}/><span>{l}</span><span>{v}</span></div>)}</div></div></article>;
}

function FilterField({ label, value }: { label: string; value: string }) {
  return <label><div className="mb-1 text-[8px] text-slate-400">{label}</div><div className="h-7 rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-slate-200">{value}</div></label>;
}

function CommissioningTable() {
  return <div className="min-h-0 overflow-hidden rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[7px]"><div className="mb-2 text-[9px] text-slate-300">Showing 1 to 15 of 186 records</div><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Commission ID","Site / Location","Device Type","Device / Name","Technician","Start Date & Time (CDT)","Duration","Status","Result","Actions"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}><td className="py-1 text-[#05bfff]">{row[0]}</td><td className="whitespace-pre-line py-1">{row[1]}</td><td className="py-1">{row[2]}</td><td className="py-1 text-[#05bfff]">{row[3]}</td><td className="py-1">{row[4]}</td><td className="py-1">{row[5]}</td><td className="py-1">{row[6]}</td><td className="py-1"><StatusPill status={row[7]} /></td><td className="py-1">{row[8]}</td><td className="py-1">◎ &nbsp; ⇩</td></tr>)}</tbody></table><div className="mt-3 flex items-center justify-between text-[9px] text-slate-400"><span>Show <b className="rounded border border-cyan-300/12 px-3 py-1 text-slate-100">15</b> per page</span><span className="space-x-2"><b className="rounded border border-cyan-300/12 px-2 py-1">‹</b><b className="rounded bg-[#147dff] px-2 py-1 text-white">0</b><b className="rounded border border-cyan-300/12 px-2 py-1">0</b><b className="rounded border border-cyan-300/12 px-2 py-1">0</b><b className="rounded border border-cyan-300/12 px-2 py-1">0</b><b className="rounded border border-cyan-300/12 px-2 py-1">0</b><span>...</span><b className="rounded border border-cyan-300/12 px-2 py-1">13</b><b className="rounded border border-cyan-300/12 px-2 py-1">›</b></span></div></div>;
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "Successful" ? "bg-[#063b27] text-[#05ff5e]" : status === "Failed" ? "bg-red-500/20 text-red-400" : status === "In Progress" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400";
  return <span className={`rounded px-2 py-1 ${cls}`}>{status}</span>;
}

function CommissioningRightRail() {
  return <aside className="flex min-h-0 flex-col gap-2"><SidePanel title="Record Details"><p className="text-[9px] leading-relaxed text-slate-400">Select a record from the table to view full commissioning details.</p></SidePanel><SidePanel title="Summary by Device Type"><DeviceTypeBars /></SidePanel><SidePanel title="Average Commissioning Duration"><div className="text-[28px] leading-none">00:34:26</div><div className="mt-2 text-[9px] text-[#05ff5e]">↓ 6.2% vs prior 30 days</div></SidePanel><SidePanel className="flex-1" title="Quick Actions"><div className="space-y-4 text-[9px]"><div>⊞ Create New Commissioning Record</div><div>▤ Commissioning Test Templates</div><div>▧ View Test Procedures</div><div>⇩ Export Current View</div></div></SidePanel></aside>;
}

function SidePanel({ children, className = "", title }: { children: ReactNode; className?: string; title: string }) {
  return <section className={`rounded border border-cyan-300/12 bg-[#061521]/92 p-3 ${className}`}><h3 className="mb-3 text-[11px] font-semibold">{title}</h3>{children}</section>;
}

function DeviceTypeBars() {
  const rows = [["Switch","72 (38.7%)","#147dff","76%"],["Meter","48 (25.8%)","#05ff5e","54%"],["Gateway","26 (14.0%)","#8b5cf6","30%"],["Repeater","22 (11.8%)","#f59e0b","24%"],["Other","18 (9.7%)","#94a3b8","20%"]];
  return <div className="space-y-3 text-[8px]">{rows.map(([l,v,c,w])=><div className="grid grid-cols-[52px_1fr_58px] items-center gap-2" key={l}><span>{l}</span><span className="h-2 rounded bg-white/5"><i className="block h-2 rounded" style={{background:c,width:w}} /></span><span>{v}</span></div>)}</div>;
}

function CommissioningFooter() {
  return <footer className="flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-9 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-4 text-[#05ff5e]">▥ Live</b></span></footer>;
}
