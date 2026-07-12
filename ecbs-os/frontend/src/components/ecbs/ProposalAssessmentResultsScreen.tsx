const summaryItems = [
  ["Project / Facility", "Flex Tijuana Manufacturing", "▦"],
  ["Location", "Tijuana, Baja California, Mexico", "⌖"],
  ["Utility", "CFE - GDMTH (Medium Voltage)", "⌁"],
  ["Service Voltage", "13,200 V", "⚡"],
  ["Analysis Period", "Apr 03, 2025 - May 02, 2025 (30 days)", "▣"],
  ["Peak Demand (Baseline)", "1,250 kW", "⌁"],
  ["Power Factor (Baseline)", "0.82 Lagging", "◴"],
  ["Total Connected Load", "3.2 MW", "▣"],
];

const baselineRows = [
  ["Peak Demand", "1,250 kW", "1,063 kW", "187 kW (15.0%)"],
  ["Energy Consumption", "12,430,000 kWh", "10,588,000 kWh", "1,842,000 kWh (14.8%)"],
  ["Power Factor (Avg.)", "0.82 Lagging", "0.98 Lagging", "+0.16"],
  ["Total Harmonic Distortion (THD)", "16.2%", "4.1%", "12.1% (74.7%)"],
  ["Estimated Annual Cost", "$770,000", "$646,000", "$124,000 (16.1%)"],
];

const solutionRows = [
  ["XECO Gateway", "XGW-1000", "1", "Main Switchgear", "System Communication"],
  ["XECO Meters", "XEM-600", "8", "Main & Sub Panels", "Monitoring & Measurement"],
  ["XECO Switches", "XSW-300", "6", "Feeder Panels", "Harmonic & PF Correction"],
  ["XECO Repeaters", "XRP-100", "2", "Building Coverage", "Signal Extension"],
  ["Active Power Filter", "XAPF-200", "1", "Main Switchgear", "Harmonic Mitigation"],
];

function ClientProjectSourceMissing({ message = "source_missing: Client project backend source/write model is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function ProposalAssessmentResultsScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ProposalResultsSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ProposalResultsTopbar />
          <ClientProjectSourceMissing />
          <section className="flex h-[88px] items-start justify-between pt-4">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects &nbsp; &gt; &nbsp; Flex Tijuana Manufacturing &nbsp; &gt; &nbsp; <span className="text-white">Proposal / Assessment Results</span></div>
              <h1 className="mt-4 text-[22px] font-semibold leading-none">Proposal / Assessment Results</h1>
              <p className="mt-2 text-[10px] text-slate-200">Your proposal and site assessment are ready. Review the summary below or open the full reports.</p>
            </div>
            <div className="mt-6 flex gap-3 text-[10px]"><button className="rounded border border-cyan-300/20 bg-[#061421] px-5 py-2.5">&lt;- &nbsp; Back to Project Dashboard</button><button className="rounded bg-[#1455d8] px-5 py-2.5">Next Step: Project Dashboard &nbsp; →</button></div>
          </section>
          <section className="h-[66px] rounded-t-lg border border-cyan-300/12 bg-[#061521]/92 px-7 py-3">
            <ResultsSteps />
          </section>
          <section className="grid h-[488px] grid-cols-[294px_1fr] gap-2 overflow-hidden rounded-b-lg bg-white p-2 text-slate-900">
            <ProjectSummary />
            <div className="grid min-h-0 grid-rows-[112px_1fr_166px] gap-2">
              <ExecutiveSummary />
              <div className="grid min-h-0 grid-cols-[1fr_1.03fr] gap-2">
                <AnnualSavings />
                <BaselineComparison />
              </div>
              <div className="grid min-h-0 grid-cols-[1fr_1.03fr] gap-2">
                <RecommendedSolution />
                <PowerQualityImprovement />
              </div>
            </div>
          </section>
          <section className="mt-2 grid h-[148px] grid-cols-[1fr_306px] gap-2 overflow-hidden rounded-lg bg-white p-3 text-slate-900">
            <ReportsReady />
            <WhatsNext />
          </section>
          <ProposalResultsFooter />
        </main>
      </div>
    </div>
  );
}

function ProposalResultsSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Billing"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="ENTERPRISE"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className="flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300" key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[84px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details {"->"}</div></div><div className="absolute bottom-[36px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ProposalResultsTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ResultsSteps() {
  const steps = [["✓", "Utility Bill Scan", "Complete"], ["✓", "1-Line Scan", "Complete"], ["✓", "Data Analysis", "Complete"], ["4", "Results Generated", "Complete"], ["5", "Next Steps", "Ready"]];
  return <div className="flex h-[40px] items-center text-[11px] text-slate-300">{steps.map(([num,title,state],i)=><span className="flex flex-1 items-center last:flex-none" key={title}><span className={i<3?"grid size-8 place-items-center rounded-full bg-[#16a34a] text-white":i===3?"grid size-8 place-items-center rounded-full bg-[#147dff] text-white":"grid size-8 place-items-center rounded-full border border-slate-500 text-slate-300"}>{num}</span><span className="ml-3"><b className="text-white">{title}</b><br/><span>{state}</span></span>{i<steps.length-1 ? <span className="mx-5 h-px flex-1 bg-slate-700" /> : null}</span>)}</div>;
}

function ProjectSummary() {
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3"><div className="mb-2 flex justify-between"><h2 className="text-[13px] font-semibold">Project Summary</h2><span className="text-[10px] text-[#147dff]">✎ Edit</span></div><div className="space-y-1.5 text-[8.7px]">{summaryItems.map(([label,value,icon])=><div className="grid grid-cols-[22px_1fr] gap-2" key={label}><span className="text-[15px] text-[#147dff]">{icon}</span><span><b className="text-slate-600">{label}</b><br/>{value}</span></div>)}</div><div className="mt-2 rounded border border-slate-200 p-2"><h3 className="mb-1 text-[11px] font-semibold">Data Sources</h3>{[["Utility Bill","May 05, 2025"],["One-Line Drawing","Rev 1"],["Site Information","Complete"],["Equipment Inventory","Complete"],["Meter Data (ON/OFF)","Complete"],["Analysis & Calculations","Complete"]].map(([l,v])=><div className="flex justify-between py-0.5 text-[8px]" key={l}><span><b className="text-[#16a34a]">◎</b> {l}</span><span>{v}</span></div>)}</div></section>;
}

function ExecutiveSummary() {
  return <section className="rounded border border-slate-200 p-3"><h2 className="mb-3 text-[13px] font-semibold">Executive Summary</h2><div className="grid grid-cols-5 gap-3">{[["$","Estimated Annual Savings","$124,000","16.1% Reduction","#16a34a"],["▥","Energy Savings","1,842,000 kWh","14.8% Reduction","#147dff"],["⚡","Demand Savings","187 kW","15.0% Reduction","#7c3aed"],["▣","Payback Period","2.1 Years","After Full Deployment","#f59e0b"],["◎","ROI (5 Years)","122%","Return on Investment","#0e9aa7"]].map(([icon,label,value,detail,color])=><article className="rounded border border-slate-200 p-2 text-center text-[8.5px]" key={label}><div className="mx-auto mb-1 grid size-7 place-items-center rounded-full text-white" style={{backgroundColor:color}}>{icon}</div><div>{label}</div><b className="text-[14px]">{value}</b><div>{detail}</div></article>)}</div></section>;
}

function AnnualSavings() {
  return <section className="rounded border border-slate-200 p-3"><h2 className="mb-2 text-[12px] font-semibold">Annual Savings Breakdown</h2><div className="grid grid-cols-[170px_1fr] items-center gap-3 text-[8.5px]"><div className="relative size-[142px]"><svg className="size-[142px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#16a34a" strokeDasharray="127 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="50 214" strokeDashoffset="-127" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#7c3aed" strokeDasharray="28 214" strokeDashoffset="-177" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="10 214" strokeDashoffset="-205" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#fff" r="25"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[16px]">$124,000</b><br/>Total Annual<br/>Savings</span></div></div><div className="space-y-3">{[["Energy Savings","$72,800","58.7%","#16a34a"],["Demand Savings","$28,900","23.3%","#147dff"],["Power Factor Improvement","$16,500","13.3%","#7c3aed"],["Maintenance Savings","$5,800","4.7%","#f59e0b"]].map(([l,v,p,c])=><div className="grid grid-cols-[1fr_70px_44px] gap-2" key={l}><span><b style={{color:c}}>●</b> {l}</span><b>{v}</b><span>{p}</span></div>)}</div></div></section>;
}

function BaselineComparison() {
  return <section className="rounded border border-slate-200 p-3"><h2 className="mb-2 text-[12px] font-semibold">Baseline vs. Optimized Comparison</h2><table className="w-full text-left text-[8.5px]"><thead><tr>{["Metric","Baseline (Current)","Optimized (with XECO)","Improvement",""].map(h=><th className="pb-2 font-semibold" key={h}>{h}</th>)}</tr></thead><tbody>{baselineRows.map(row=><tr className="border-t border-slate-200" key={row[0]}>{row.map(cell=><td className="py-2" key={`${row[0]}-${cell}`}>{cell}</td>)}<td className="py-2 text-[#16a34a]">↓</td></tr>)}</tbody></table></section>;
}

function RecommendedSolution() {
  return <section className="rounded border border-slate-200 p-2.5"><h2 className="mb-1 text-[12px] font-semibold">Recommended XECO Solution</h2><table className="w-full text-left text-[7.2px]"><thead><tr>{["Component","Model / Type","Quantity","Placement","Function"].map(h=><th className="pb-0.5 font-semibold" key={h}>{h}</th>)}</tr></thead><tbody>{solutionRows.map(row=><tr className="border-t border-slate-200" key={row[0]}>{row.map(cell=><td className="py-0.5" key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table><button className="mt-1 rounded border border-[#147dff] px-3 py-1 text-[8.5px] text-[#147dff]">View Recommended System Details →</button></section>;
}

function PowerQualityImprovement() {
  return <section className="rounded border border-slate-200 p-3"><h2 className="mb-2 text-[12px] font-semibold">Power Quality Improvement</h2><div className="grid h-[112px] grid-cols-3 gap-3">{[["Power Factor (Avg.)","0.82","0.98","+0.16 Improvement"],["THD (Total)","16.2%","4.1%","-74.7% Reduction"],["Voltage Unbalance","3.8%","1.2%","-68.4% Reduction"]].map(([label,b,a,detail])=><article className="rounded border border-slate-200 p-2 text-center text-[8.5px]" key={label}><div className="mb-2 text-left font-semibold">{label}</div><div className="flex items-center justify-center gap-2"><Gauge value={b} label="Lagging" /><span className="text-[18px]">→</span><Gauge value={a} label="Lagging" green /></div><div className="mt-2 text-[#16a34a]">{detail}</div></article>)}</div></section>;
}

function Gauge({ green, label, value }: { green?: boolean; label: string; value: string }) {
  return <span className="grid size-12 place-items-center rounded-full border-[3px] text-center text-[8px]" style={{borderColor:green?"#16a34a":"#94a3b8"}}><b className="text-[12px]">{value}</b><br/>{label}</span>;
}

function ReportsReady() {
  return <section><h2 className="text-[13px] font-semibold">Your Reports Are Ready</h2><p className="mt-1 text-[9px]">Your proposal and site assessment reports have been generated based on the data analysis.</p><div className="mt-2 grid grid-cols-2 gap-4">{[["PROPOSAL","Energy Optimization Proposal","Comprehensive proposal with recommended solution, costs, savings, and financial analysis."],["ASSESSMENT REPORT","Site Assessment Report","Detailed assessment of current conditions, analysis, and system improvement opportunities."]].map(([tag,title,detail])=><article className="grid grid-cols-[62px_1fr] rounded border border-slate-200 bg-slate-50 p-2 text-[8.5px]" key={tag}><div className="grid h-[68px] w-[48px] place-items-center rounded bg-white text-[6.5px] font-semibold text-[#147dff] shadow">{tag}</div><div><b>{title}</b><p className="mt-0.5">{detail}</p><div className="mt-2 flex gap-3"><button className="rounded border border-[#147dff] px-4 py-1 text-[#147dff]">◎ Preview Report</button><button className="rounded border border-[#147dff] px-4 py-1 text-[#147dff]">Download PDF ⇩</button></div></div></article>)}</div></section>;
}

function WhatsNext() {
  return <section><h2 className="mb-3 text-[13px] font-semibold">What&apos;s Next?</h2>{["Review the proposal and assessment reports","Share reports with your stakeholders","Proceed to Project Dashboard to begin deployment planning","Schedule commissioning & testing after installation"].map(item=><div className="py-1.5 text-[9px]" key={item}><b className="text-[#16a34a]">◎</b> &nbsp; {item}</div>)}</section>;
}

function ProposalResultsFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
