import type { ReactNode } from "react";

const categoryCards = [
  ["▥", "Executive Summary", "High-level overview of performance, savings, and impact.", "6 Reports", "#16a34a"],
  ["⌁", "Capacity & Performance", "Capacity recovery, utilization, load profile, and performance analytics.", "8 Reports", "#147dff"],
  ["⌁", "Power Quality", "Power quality metrics, trends, and compliance summary.", "7 Reports", "#7c3aed"],
  ["$", "Savings & Financials", "Energy savings, cost avoidance, ROI, and financial impact.", "6 Reports", "#16a34a"],
  ["◒", "Environmental Impact", "Carbon reduction, sustainability metrics, and environmental impact.", "4 Reports", "#16a34a"],
  ["⚠", "Alerts & Events", "Alarm summaries, event logs, and issue reports.", "5 Reports", "#f97316"],
];

const reportRows = [
  ["▦", "Executive Summary Report", "Executive Summary", "Comprehensive overview of system performance, savings, and key achievements.", "PDF", "May 18, 2025 8:00 AM"],
  ["▦", "Capacity Intelligence Report", "Capacity & Performance", "Detailed analysis of capacity recovery, utilization, and available capacity.", "PDF", "May 18, 2025 8:00 AM"],
  ["▦", "Transformer Performance Report", "Capacity & Performance", "Transformer load profile, health, and performance analysis.", "PDF", "May 17, 2025 8:15 AM"],
  ["▦", "Power Quality Summary", "Power Quality", "Power quality metrics summary with trends and compliance.", "PDF", "May 18, 2025 8:00 AM"],
  ["▦", "Harmonics Analysis Report", "Power Quality", "Detailed harmonics analysis and THD trends by phase.", "Excel", "May 17, 2025 2:36 PM"],
  ["▦", "Savings & Financial Report", "Savings & Financials", "Financial impact, cost savings, and ROI analysis.", "PDF", "May 18, 2025 8:00 AM"],
  ["▦", "ROI Analysis Report", "Savings & Financials", "Detailed ROI analysis and payback calculations.", "Excel", "May 18, 2025 10:45 AM"],
  ["▦", "Environmental Impact Report", "Environmental Impact", "Carbon reduction and environmental impact summary.", "PDF", "May 18, 2025 8:00 AM"],
  ["⚠", "Alerts & Events Summary", "Alerts & Events", "Summary of alarms, events, and system notifications.", "PDF", "May 18, 2025 8:00 AM"],
  ["▦", "Custom Report - Production Line", "Custom Report", "Custom report for Production Line 1 analysis.", "PDF", "May 16, 2025 4:20 PM"],
];

const scheduledReports = [
  ["Executive Summary Report", "Weekly - Every Monday at 8:00 AM"],
  ["Capacity Intelligence Report", "Weekly - Every Monday at 8:30 AM"],
  ["Power Quality Summary", "Weekly - Every Monday at 9:00 AM"],
  ["Savings & Financial Report", "Monthly - 1st of every month"],
  ["Environmental Impact Report", "Monthly - 1st of every month"],
];

const recentReports = [
  ["Executive Summary Report", "May 18, 2025 8:00 AM", "PDF"],
  ["Capacity Intelligence Report", "May 18, 2025 8:00 AM", "PDF"],
  ["Power Quality Summary", "May 18, 2025 8:00 AM", "PDF"],
  ["Savings & Financial Report", "May 18, 2025 8:00 AM", "PDF"],
  ["Environmental Impact Report", "May 18, 2025 8:00 AM", "PDF"],
];

export function ReportsPageScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[170px_1fr]">
        <ReportsSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.11),transparent_32%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ReportsTopbar />
          <section className="flex h-[104px] items-start justify-between pt-4">
            <div>
              <h1 className="text-[22px] font-semibold leading-none">Reports</h1>
              <p className="mt-3 text-[11px] text-slate-300">Create, schedule, and export reports to share insights and prove impact.</p>
              <div className="mt-4 flex gap-8 border-b border-cyan-300/12 text-[10px]">
                {["All Reports", "Scheduled Reports", "Custom Reports", "Report History"].map((tab) => (
                  <span className={tab === "All Reports" ? "border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]" : "pb-2 text-slate-300"} key={tab}>{tab}</span>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-[11px]">
              <button className="w-[260px] rounded border border-cyan-300/12 bg-[#061421] px-4 py-3 text-left text-slate-400">⌕ &nbsp; Search reports...</button>
              <button className="rounded bg-[#16a34a] px-7 py-3 font-semibold text-white">+ &nbsp; Create Custom Report</button>
            </div>
          </section>
          <section className="grid h-[112px] grid-cols-6 gap-3">
            {categoryCards.map(([icon,title,detail,count,color]) => <CategoryCard color={color} count={count} detail={detail} icon={icon} key={title} title={title} />)}
          </section>
          <section className="mt-3 grid h-[524px] grid-cols-[1fr_336px] gap-3 overflow-hidden">
            <ReportsTable />
            <ReportsRightRail />
          </section>
          <ReportsFooter />
        </main>
      </div>
    </div>
  );
}

function ReportsSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard"]],
    ["INTELLIGENCE", ["Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast"]],
    ["OPERATIONS", ["Alarms & Events", "Reports"]],
    ["DEVICES", ["Devices"]],
    ["SYSTEM", ["Settings"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 text-[#05ff5e]">{title}</h2>{(items as string[]).map(item=><div className={item==="Reports" ? "flex h-[28px] items-center justify-between rounded bg-[#0b3158] px-1.5 text-[#05ff5e]" : "flex h-[24px] items-center justify-between rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">16</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[92px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[44px] leading-none text-[#05ff5e]">96</div><div>A+ Rating</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ReportsTopbar() {
  return <header className="flex h-[64px] items-center justify-between border-b border-cyan-300/10"><div><div className="text-[15px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-1 text-[10px] font-semibold text-[#05ff5e]">Reports</div></div><div className="flex items-center gap-4 text-[10px]"><button className="w-[160px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; Flex Tijuana ⌄</button><button className="w-[200px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025 ⌄</button><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">3</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full border border-slate-500">●</span><span>Greg Dockery<br/><span className="text-slate-500">Administrator</span></span><span>⌄</span></div></header>;
}

function CategoryCard({ color, count, detail, icon, title }: { color: string; count: string; detail: string; icon: string; title: string }) {
  return <article className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full text-[18px] text-white" style={{backgroundColor: color}}>{icon}</span><div><h2 className="text-[11px] font-semibold">{title}</h2><p className="mt-1 text-[8.2px] leading-[12px] text-slate-300">{detail}</p><div className="mt-2 text-[9px] font-semibold">{count}</div></div></div></article>;
}

function ReportsTable() {
  return <section className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-[12px] font-semibold uppercase">Available Reports</h2><div className="flex gap-3 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#04111c] px-4 py-2">All Categories ⌄</button><button className="rounded border border-cyan-300/12 bg-[#04111c] px-4 py-2">All Formats ⌄</button><button className="rounded border border-cyan-300/12 bg-[#04111c] px-4 py-2">▽ Filters</button></div></div><table className="w-full text-left text-[8.8px]"><thead className="text-slate-300"><tr>{["Report Name","Category","Description","Format","Last Generated","Actions"].map(h=><th className="border-b border-cyan-300/12 pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{reportRows.map(([icon,name,category,description,format,date])=><tr className="border-b border-cyan-300/10" key={name}><td className="py-[7px]"><span className={icon==="⚠" ? "text-[#f97316]" : "text-slate-300"}>{icon}</span> &nbsp; {name}</td><td className="py-[7px] text-slate-300">{category}</td><td className="max-w-[275px] py-[7px] text-slate-300">{description}</td><td className="py-[7px]"><span className={format==="Excel"?"text-[#16a34a]":"text-red-400"}>▧</span> {format}</td><td className="py-[7px] text-slate-300">{date}</td><td className="py-[7px] text-[13px]"><span className="text-[#05ff5e]">⊙</span> &nbsp; ⇩ &nbsp; ⋮</td></tr>)}</tbody></table><div className="mt-3 flex items-center justify-between text-[10px] text-slate-300"><span>Showing 1 to 10 of 30 reports</span><div className="flex items-center gap-5"><span>‹</span><span className="rounded border border-[#05ff5e] px-3 py-1 text-[#05ff5e]">1</span><span>2</span><span>3</span><span>›</span></div></div></section>;
}

function ReportsRightRail() {
  return <aside className="space-y-1.5 overflow-hidden"><RailPanel compact title={<span>REPORT SUMMARY <span className="text-[9px] normal-case text-slate-400">(This Period)</span></span>}><div className="grid grid-cols-2 gap-2">{[["▣","36","Reports Generated","#147dff"],["▣","12","Scheduled Reports","#65a30d"],["⇩","92","Reports Downloaded","#7c3aed"],["◎","156","Total Report Views","#f97316"]].map(([icon,value,label,color])=><article className="rounded border border-cyan-300/12 bg-[#04111c] p-1.5" key={label}><div className="flex gap-2"><span className="grid size-7 place-items-center rounded border text-[16px]" style={{color,borderColor:color}}>{icon}</span><span><b className="text-[16px]">{value}</b><br/><span className="text-[7.5px] text-slate-400">{label}</span></span></div></article>)}</div></RailPanel><RailPanel compact title="SCHEDULED REPORTS" action="View All →">{scheduledReports.map(([title,time])=><div className="grid grid-cols-[16px_1fr_35px] gap-2 py-[1px] text-[7.8px]" key={title}><span>▣</span><span><b>{title}</b><br/><span className="text-slate-400">{time}</span></span><span className="text-[#05ff5e]">Active</span></div>)}</RailPanel><RailPanel dense title="RECENTLY GENERATED REPORTS" action="View All →">{recentReports.map(([title,time,type])=><div className="grid grid-cols-[15px_1fr_28px] gap-1.5 py-[1px] text-[7.5px] leading-[10px]" key={title}><span className="text-red-400">▧</span><span>{title}</span><span className="text-right text-slate-400">{type}</span><span></span><span className="text-slate-400">{time}</span></div>)}</RailPanel></aside>;
}

function RailPanel({ action, children, compact, dense, title }: { action?: string; children: ReactNode; compact?: boolean; dense?: boolean; title: ReactNode }) {
  return <section className={dense ? "rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-1.5" : compact ? "rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2" : "rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2.5"}><div className={dense ? "mb-1 flex items-center justify-between" : compact ? "mb-1.5 flex items-center justify-between" : "mb-2 flex items-center justify-between"}><h2 className="text-[12px] font-semibold">{title}</h2>{action ? <button className="text-[9px] text-[#05ff5e]">{action}</button> : null}</div>{children}</section>;
}

function ReportsFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: May 18, 2025 10:15 AM <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
