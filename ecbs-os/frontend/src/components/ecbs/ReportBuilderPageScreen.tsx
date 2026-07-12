const metrics = [
  ["Real Power (kW)", true],
  ["Apparent Power (kVA)", true],
  ["Demand (kW)", true],
  ["Energy (kWh)", false],
  ["Power Factor (PF)", true],
  ["Reactive Power (kVAR)", false],
] as const;

const reportSections = [
  "Executive Summary",
  "Trend Over Time",
  "Demand Summary",
  "Energy Summary",
  "Top Power Quality Metrics",
  "Cost & Savings Summary",
  "Asset Details",
];

const reportRows = [
  ["Main Transformer (TXFR-01)", "872", "893", "0.98"],
  ["Transformer T-2 (TXFR-02)", "191", "196", "0.98"],
  ["Total / Average", "1,063", "1,089", "0.98"],
];

const energyRows = [
  ["Main Transformer (TXFR-01)", "142,580", "78.1%"],
  ["Transformer T-2 (TXFR-02)", "39,870", "21.9%"],
  ["Total", "182,450", "100%"],
];

const qualityRows = [
  ["Main Transformer (TXFR-01)", "2.1%", "4.3%", "0.7%", "0.35"],
  ["Transformer T-2 (TXFR-02)", "2.4%", "4.8%", "0.8%", "0.36"],
];

function EnterpriseAdminSourceMissing({ message = "source_missing: Enterprise report/site/transformer backend source or artifact store is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function ReportBuilderPageScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ReportSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.11),transparent_32%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ReportTopbar />
          <EnterpriseAdminSourceMissing />
          <section className="flex h-[86px] items-start justify-between pt-3">
            <div>
              <div className="text-[10px] text-slate-300">Home &nbsp; &gt; &nbsp; Reports &nbsp; &gt; &nbsp; <span className="text-white">Report Builder</span></div>
              <h1 className="mt-3 text-[22px] font-semibold leading-none">Report Builder</h1>
              <p className="mt-2 text-[10px] text-slate-200">Create custom reports with the data and analysis that matters most to you.</p>
            </div>
            <div className="mt-4 flex gap-4 text-[11px]">
              <button className="rounded border border-cyan-300/20 bg-[#061421] px-8 py-2.5">◎ &nbsp; Save as Template</button>
              <button className="rounded bg-[#1455d8] px-12 py-2.5">⌁ &nbsp; Generate Report</button>
            </div>
          </section>
          <section className="grid h-[704px] grid-cols-[270px_1fr_300px] gap-3 overflow-hidden">
            <BuilderRail />
            <ReportPreview />
            <ReportOptions />
          </section>
          <ReportFooter />
        </main>
      </div>
    </div>
  );
}

function ReportSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Electrical Network", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Billing"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="ENTERPRISE"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className={item==="Reports" ? "flex h-[22px] items-center justify-between rounded bg-[#0b3158] px-1.5 text-white" : "flex h-[22px] items-center justify-between rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[86px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[36px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ReportTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 11 - May 18, 2025<br/><span className="ml-5 text-[7px] text-slate-400">(7 Days)</span></button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function BuilderRail() {
  return <section className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2.5 text-[9.2px]"><RailTitle num="1" title="Select Data Source" /><Field label="Site" value="Flex Tijuana Manufacturing" /><Field label="Asset Type" value="All Assets" /><Field label="Assets (Optional)" value="Main Transformer (TXFR-01)  ×&#10;Transformer T-2 (TXFR-02)  ×" tall /><div className="mb-1.5 text-[7.5px] text-slate-400">2 assets selected</div><Field label="All Locations / Sites" value="All Locations / Sites" /><RailTitle num="2" title="Select Metrics" /><div className="mb-1.5 rounded border border-cyan-300/12 bg-[#04111c] px-3 py-1.5 text-slate-500">⌕ &nbsp; Search metrics...</div><Accordion title="Power & Energy" open>{metrics.map(([label,checked])=><div className="flex h-[14px] items-center gap-2" key={label}><span className={checked ? "grid size-3 place-items-center rounded-sm bg-[#147dff] text-[8px] text-white" : "size-3 rounded-sm border border-slate-600"}>{checked ? "✓" : ""}</span><span>{label}</span></div>)}</Accordion>{["Power Quality", "Current & Voltage", "Capacity & Utilization", "Cost & Savings", "Environmental"].map(item=><div className="flex h-[18px] items-center justify-between border-b border-cyan-300/10" key={item}>{item}<span>⌄</span></div>)}<RailTitle num="3" title="Grouping & Aggregation" /><Field label="Aggregation Interval" value="15 Minutes" /><Field label="Group By (Optional)" value="Asset" /><RailTitle num="4" title="Filters (Optional)" /><button className="rounded border border-[#147dff] px-4 py-1.5 text-[#147dff]">+ &nbsp; Add Filter</button></section>;
}

function RailTitle({ num, title }: { num: string; title: string }) {
  return <h2 className="mb-1.5 mt-1 flex items-center gap-2 font-semibold text-white first:mt-0"><span className="grid size-4 place-items-center rounded-full bg-[#147dff] text-[9px]">{num}</span>{title}</h2>;
}

function Field({ label, tall, value }: { label: string; tall?: boolean; value: string }) {
  return <label className="mb-1.5 block text-[8.5px] text-slate-400">{label}<span className={tall ? "mt-1 block min-h-[36px] whitespace-pre-line rounded border border-cyan-300/12 bg-[#04111c] px-3 py-1 text-[8.8px] text-slate-200" : "mt-1 flex h-[22px] items-center justify-between rounded border border-cyan-300/12 bg-[#04111c] px-3 text-[8.8px] text-slate-200"}>{value}<span className="text-slate-400">⌄</span></span></label>;
}

function Accordion({ children, open, title }: { children: React.ReactNode; open?: boolean; title: string }) {
  return <div className="mb-1.5"><div className="mb-1 flex items-center justify-between">{title}<span>{open ? "⌃" : "⌄"}</span></div><div className="space-y-0.5 pl-2 text-[9px] text-slate-200">{children}</div></div>;
}

function ReportPreview() {
  return <section className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="mb-2 flex items-center justify-between text-[10px]"><h2 className="flex items-center gap-2 font-semibold"><span className="grid size-4 place-items-center rounded-full bg-[#147dff] text-[9px]">5</span>Report Preview</h2><button className="rounded border border-cyan-300/18 bg-[#04111c] px-4 py-2">⇩ &nbsp; Export Preview PDF</button></div><div className="mb-2 flex gap-1 text-[10px]"><button className="rounded-t border border-cyan-300/18 bg-[#0b3158] px-5 py-2">Preview</button><button className="rounded-t border border-cyan-300/12 bg-[#04111c] px-5 py-2 text-slate-300">Data Table</button></div><article className="h-[640px] overflow-hidden rounded bg-white p-4 text-slate-900 shadow-xl"><ReportDocument /></article></section>;
}

function ReportDocument() {
  return <div className="mx-auto h-full max-w-[610px] text-[7.5px]"><header className="mb-2 flex items-start justify-between border-b border-slate-200 pb-2"><div className="text-[26px] font-black italic leading-none tracking-[-0.1em]"><span className="text-[#16a34a]">X</span>ECO<div className="mt-1 text-[7px] font-bold uppercase tracking-[0.48em] text-[#16a34a]">Energy</div></div><div className="text-center"><h2 className="text-[13px] font-bold">CUSTOM REPORT</h2><p>Flex Tijuana Manufacturing<br/>May 11 - May 18, 2025 (7 Days)</p></div><div className="text-right text-[6.5px]">Generated: May 18, 2025 10:15 AM CDT<br/>Generated By: John Smith (OEM Admin)</div></header><section className="mb-2 rounded border border-slate-200 p-2"><h3 className="mb-1.5 font-bold">EXECUTIVE SUMMARY</h3><div className="grid grid-cols-5 gap-2">{[["Total Demand (Avg.)","1,063 kW"],["Power Factor (Avg.)","0.98"],["Energy (Total)","182,450 kWh"],["Total Cost","$10,245"],["Est. Savings","$2,187"]].map(([label,value])=><div className="rounded border border-slate-200 p-1.5 text-center" key={label}><div>{label}</div><b className="block pt-1 text-[12px]">{value}</b></div>)}</div></section><section className="mb-2 rounded border border-slate-200 p-2"><h3 className="font-bold">TREND OVER TIME</h3><p className="mb-0.5 text-[6.8px]">May 11 - May 18, 2025</p><TrendChart /><div className="mt-0.5 flex justify-center gap-8 text-[6.8px]"><span className="text-[#147dff]">━ Demand (kW)</span><span className="text-[#ff8b3d]">━ Apparent Power (kVA)</span><span className="text-[#16a34a]">━ Power Factor (PF)</span></div></section><div className="mb-2 grid grid-cols-2 gap-2"><SummaryTable title="DEMAND SUMMARY (Average)" heads={["Asset","Demand (kW)","kVA","PF"]} rows={reportRows} /><SummaryTable title="ENERGY SUMMARY" heads={["Asset","Energy (kWh)","% of Total"]} rows={energyRows} /></div><SummaryTable title="TOP POWER QUALITY METRICS (Average)" heads={["Asset","THD (V)","THD (I)","Voltage Unbalance (%)","Flicker (Pst)"]} rows={qualityRows} /><footer className="mt-3 flex items-end justify-between text-[6.8px]"><span>© 2025 XECO Energy Corporation.<br/>All rights reserved.</span><span>Page 1 of 8</span><span className="text-right text-[21px] font-black italic tracking-[-0.1em]"><span className="text-[#16a34a]">X</span>ECO<div className="text-[5px] tracking-[0.48em] text-[#16a34a]">ENERGY</div></span></footer></div>;
}

function TrendChart() {
  const x = [0,28,58,88,118,148,178,208,238,268,298,328,358,388,418,448,478,508,538];
  const demand = x.map((v,i)=>`${v},${74 + (i % 4) * 5 - (i % 2) * 3}`).join(" ");
  const kva = x.map((v,i)=>`${v},${48 + (i % 5) * 4 - (i % 2) * 2}`).join(" ");
  const pf = x.map((v,i)=>`${v},${26 + (i % 6) * 3 - (i % 2) * 3}`).join(" ");
  return <svg className="h-[112px] w-full" viewBox="0 0 560 150"><g stroke="#e5e7eb" strokeWidth="1">{[28,52,76,100,124].map(y=><line key={y} x1="34" x2="540" y1={y} y2={y}/>)}{[34,118,202,286,370,454,538].map(xv=><line key={xv} x1={xv} x2={xv} y1="20" y2="128"/>)}<line x1="34" x2="540" y1="128" y2="128"/><line x1="34" x2="34" y1="20" y2="128"/></g><polyline fill="none" points={demand} stroke="#147dff" strokeWidth="2" transform="translate(34 0)" /><polyline fill="none" points={kva} stroke="#ff8b3d" strokeWidth="2" transform="translate(34 0)" /><polyline fill="none" points={pf} stroke="#16a34a" strokeWidth="2" transform="translate(34 0)" /><g className="text-[7px] fill-slate-500"><text x="36" y="143">May 11</text><text x="450" y="143">May 18</text><text x="4" y="24">2,000</text><text x="518" y="24">1.00</text><text x="518" y="128">0.60</text></g></svg>;
}

function SummaryTable({ heads, rows, title }: { heads: string[]; rows: string[][]; title: string }) {
  return <section className="rounded border border-slate-200 p-1.5"><h3 className="mb-1 font-bold">{title}</h3><table className="w-full text-left text-[6.7px]"><thead><tr>{heads.map(head=><th className="border-b border-slate-200 py-0.5 font-semibold" key={head}>{head}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.join("-")}>{row.map(cell=><td className="border-b border-slate-100 py-0.5" key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></section>;
}

function ReportOptions() {
  return <section className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9.2px]"><h2 className="mb-2 flex items-center gap-2 font-semibold"><span className="grid size-4 place-items-center rounded-full bg-[#147dff] text-[9px]">6</span>Report Options</h2><Field label="Report Template" value="Custom Report" /><button className="mb-1.5 text-[8.5px] text-[#147dff]">Manage Templates</button><Input label="Report Title" value="Custom Report" /><Input label="Report Subtitle (Optional)" value="Performance Summary" /><Field label="Logo" value="XECO Energy Logo" /><div className="mb-2 flex items-center gap-2"><span className="grid size-3 place-items-center rounded-sm bg-[#147dff] text-[8px]">✓</span> Include Cover Page</div><h3 className="mb-1 font-semibold">Sections & Layout</h3><p className="mb-1 text-[7.5px] text-slate-500">Drag and drop to reorder sections</p><div className="space-y-1">{reportSections.map(section=><div className="grid h-[20px] grid-cols-[18px_18px_1fr_18px] items-center rounded border border-cyan-300/12 bg-[#04111c] px-2" key={section}><span className="text-slate-500">↕</span><span className="grid size-3 place-items-center rounded-sm bg-[#147dff] text-[8px]">✓</span><span>{section}</span><span>⚙</span></div>)}</div><button className="mt-1.5 w-full rounded border border-[#147dff] py-1.5 text-[#147dff]">+ &nbsp; Add Section</button><Field label="Report Format" value="PDF" /><Field label="Page Size" value="A4 (8.27 x 11.69 in)" /><div className="mb-2"><div className="mb-1 text-[8.5px] text-slate-400">Orientation</div><div className="flex gap-4"><span className="text-[#147dff]">● Portrait</span><span className="text-slate-400">○ Landscape</span></div></div><Field label="Include Data Table" value="At End of Report" /></section>;
}

function Input({ label, value }: { label: string; value: string }) {
  return <label className="mb-1.5 block text-[8.5px] text-slate-400">{label}<span className="mt-1 flex h-[25px] items-center rounded border border-cyan-300/12 bg-[#04111c] px-3 text-[9px] text-slate-200">{value}</span></label>;
}

function ReportFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
