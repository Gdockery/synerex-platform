const summaryRows = [
  ["▦", "Facility", "Flex Tijuana Manufacturing", "#147dff"],
  ["⌖", "Location", "Tijuana, Baja California, Mexico", "#16a34a"],
  ["⚡", "Service Voltage", "13,200 V", "#7c3aed"],
  ["◴", "Total Connected Load", "3.2 MW", "#16a34a"],
  ["▧", "Peak Demand", "1,250 kW", "#f59e0b"],
  ["⌁", "Power Factor (Current)", "0.82 Lagging", "#147dff"],
  ["▣", "Analysis Period", "Apr 03, 2025 - May 02, 2025 (30 days)", "#147dff"],
];

const findings = [
  "High reactive power and low power factor detected",
  "Harmonic distortion exceeds IEEE-519 limits",
  "Capacity recovery potential identified",
  "Estimated annual savings of $124,000",
  "Payback period of 2.1 years",
];

function EnterpriseAdminSourceMissing({ message = "source_missing: Enterprise report/site/transformer backend source or artifact store is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function GenerateSiteAssessmentScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <SiteAssessmentSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <SiteAssessmentTopbar />
          <EnterpriseAdminSourceMissing />
          <section className="flex h-[100px] items-start justify-between pt-4">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects / Facilities &nbsp; &gt; &nbsp; Create New Project &nbsp; &gt; &nbsp; <span className="text-white">Assessment Results</span></div>
              <h1 className="mt-4 text-[25px] font-semibold leading-none">Site Assessment Results</h1>
              <p className="mt-3 text-[11px] text-slate-200">Your documents have been processed. Review the assessment summary, reports, and recommended next steps.</p>
            </div>
          </section>
          <section className="h-[62px] rounded-t-lg border border-cyan-300/12 bg-[#061521]/92 px-6 py-3">
            <AssessmentSteps />
          </section>
          <section className="flex h-[58px] items-center justify-between border-x border-cyan-300/12 bg-gradient-to-r from-[#062719] to-[#06321f] px-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-[#05ff5e] text-[22px] text-[#05ff5e]">✓</span>
              <span><b>Assessment completed successfully!</b><br/><span className="text-[11px] text-slate-200">Your proposal and site assessment reports are ready.</span></span>
            </div>
            <div className="flex gap-3 text-[11px]">
              <button className="rounded border border-cyan-300/20 bg-[#061421] px-7 py-2.5">◎ &nbsp; Preview All Reports</button>
              <button className="rounded bg-[#16a34a] px-8 py-2.5">Continue to Project Dashboard &nbsp; →</button>
            </div>
          </section>
          <section className="grid h-[584px] grid-cols-[1fr_416px] gap-3 overflow-hidden pt-3">
            <div className="flex min-h-0 flex-col gap-3">
              <GeneratedReports />
              <AdditionalDocuments />
            </div>
            <AssessmentSummary />
          </section>
          <SiteAssessmentFooter />
        </main>
      </div>
    </div>
  );
}

function SiteAssessmentSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["SETTINGS", ["Settings"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="DEVICES"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className="flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300" key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[92px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[38px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function SiteAssessmentTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function AssessmentSteps() {
  const steps = [["1","Project Information","done"],["✓","Upload Documents","done"],["✓","Site & Utility Information","done"],["4","Review & Confirm","active"]];
  return <div className="flex h-[36px] items-center text-[11px] text-slate-300">{steps.map(([num,title,state],i)=><span className="flex flex-1 items-center last:flex-none" key={title}><span className={state==="done" ? "grid size-8 place-items-center rounded-full border border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : "grid size-8 place-items-center rounded-full bg-[#16a34a] text-white"}>{num}</span><span className={state==="active" ? "ml-3 text-white" : "ml-3"}><b>{title}</b>{state==="active"?<><br/><span className="text-[9px]">Complete</span></>:null}</span>{i<steps.length-1 ? <span className="mx-7 h-px flex-1 bg-slate-700" /> : null}</span>)}</div>;
}

function GeneratedReports() {
  return <section className="h-[398px] overflow-hidden rounded-lg bg-white p-4 text-slate-900"><h2 className="mb-4 text-[15px] font-semibold">Generated Reports</h2><div className="grid grid-cols-2 gap-4"><ReportCard title="Proposal Report" tag="ENERGY OPTIMIZATION PROPOSAL" color="#16a34a" badge="Generated" size="2.4 MB" pages="25 pages" detail="Comprehensive proposal with estimated savings, ROI, equipment recommendations, and financial analysis."/><ReportCard title="Site Assessment Report" tag="SITE ASSESSMENT REPORT" color="#147dff" badge="Generated" size="3.1 MB" pages="38 pages" detail="Detailed analysis of your electrical system, power quality, capacity, and infrastructure optimization opportunities." /></div></section>;
}

function ReportCard({ badge, color, detail, pages, size, tag, title }: { badge: string; color: string; detail: string; pages: string; size: string; tag: string; title: string }) {
  return <article className="rounded border border-slate-200 p-3"><div className="grid grid-cols-[34px_1fr_70px] gap-3"><span className="grid size-8 place-items-center rounded border text-[20px]" style={{ color, borderColor: color }}>▤</span><div><h3 className="text-[14px] font-semibold">{title}</h3><p className="mt-2 h-[32px] text-[9.5px] leading-[14px]">{detail}</p></div><span className="h-fit rounded-full bg-green-50 px-2 py-1 text-center text-[8px] text-green-700">{badge}</span></div><div className="mt-4 h-[126px] overflow-hidden rounded bg-[#07111d] p-4 text-white" style={{ backgroundImage: `linear-gradient(120deg,#07111d 0 54%,${color} 55%,#dbeafe 56%)` }}><div className="text-[26px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-4 text-[16px] font-semibold" style={{ color }}>{tag}</div><div className="mt-2 text-[9px]">Flex Tijuana Manufacturing<br/>Tijuana, Baja California, Mexico<br/>May 18, 2025</div></div><div className="mt-3 flex gap-3 text-[9px]"><span className="rounded bg-slate-100 px-3 py-1"><b className="text-red-500">▧</b> PDF</span><span className="rounded bg-slate-100 px-3 py-1">{size}</span><span className="rounded bg-slate-100 px-3 py-1">{pages}</span></div><div className="mt-3 grid grid-cols-2 gap-3"><button className="rounded border border-[#147dff] py-2 text-[11px] text-[#147dff]">View Report &nbsp; ◎</button><button className="rounded border border-[#147dff] py-2 text-[11px] text-[#147dff]">⇩ Download</button></div></article>;
}

function AdditionalDocuments() {
  return <section className="h-[152px] rounded-lg bg-white p-4 text-slate-900"><h2 className="mb-3 text-[14px] font-semibold">Additional Documents</h2><table className="w-full text-left text-[10px]"><thead className="text-slate-500"><tr>{["Document Name","Type","Size","Date Added","Actions"].map(h=><th className="border-b border-slate-200 pb-2" key={h}>{h}</th>)}</tr></thead><tbody>{[["▧","Extracted Utility Bill (May 05, 2025)","Utility Bill","1.2 MB","May 18, 2025 10:12 AM"],["▧","One-Line Drawing - Rev 1","One-Line Drawing","892 KB","May 18, 2025 10:15 AM"]].map(row=><tr className="border-b border-slate-100" key={row[1]}><td className="py-2"><span className={row[0]==="▧"?"text-red-500":""}>{row[0]}</span> {row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td className="text-[#147dff]">◎ &nbsp; ⇩</td></tr>)}</tbody></table></section>;
}

function AssessmentSummary() {
  return <aside className="overflow-hidden rounded-lg bg-white p-5 text-slate-900"><h2 className="mb-4 text-[16px] font-semibold">Assessment Summary</h2><div className="space-y-2.5">{summaryRows.map(([icon,label,value,color])=><div className="grid grid-cols-[30px_1fr] gap-2 text-[10.5px]" key={label}><span className="text-[20px]" style={{color}}>{icon}</span><span><span className="text-slate-500">{label}</span><br/><b>{value}</b></span></div>)}</div><div className="my-3.5 h-px bg-slate-200" /><h3 className="mb-2 text-[13px] font-semibold">Key Findings</h3><div className="space-y-1.5 text-[9.8px]">{findings.map(item=><div key={item}><b className="text-[#16a34a]">✓</b> &nbsp; {item}</div>)}</div><button className="mt-3.5 w-full rounded border border-[#147dff] py-2.5 text-[12px] text-[#147dff]">View Detailed Findings &nbsp; →</button></aside>;
}

function SiteAssessmentFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
