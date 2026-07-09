const extractedFields = [
  ["Account Number", "123 456 789 0", "▧"],
  ["Bill Date", "May 05, 2025  ▣", "▣"],
  ["Due Date", "May 26, 2025  ▣", "▣"],
  ["Total Amount Due", "$136,725.68", "$"],
  ["Total Usage", "1,842,000 kWh", "▥"],
  ["Peak Demand", "1,250 kW", "⚡"],
  ["Power Factor (Avg.)", "0.82 Lagging", "⌁"],
  ["Rate Schedule", "CFE - GDMTH", "▤"],
  ["Service Voltage", "13,200 V", "⚡"],
];

export function UtilityBillScannerScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ScannerSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ScannerTopbar />
          <section className="flex h-[102px] items-start justify-between pt-4">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects &nbsp; &gt; &nbsp; Create New Project &nbsp; &gt; &nbsp; <span className="text-white">Scan Utility Bill</span></div>
              <h1 className="mt-4 text-[26px] font-semibold leading-none">Scan Utility Bill</h1>
              <p className="mt-3 text-[11px] text-slate-200">Upload or capture your utility bill to automatically extract key data for analysis.</p>
            </div>
            <button className="mt-7 rounded border border-cyan-300/20 bg-[#061421] px-5 py-2.5 text-[11px]">&lt;- &nbsp; Back to Create New Project</button>
          </section>
          <section className="h-[66px] rounded-t-lg border border-cyan-300/12 bg-[#061521]/92 px-7 py-3">
            <ScannerSteps />
          </section>
          <section className="grid h-[424px] grid-cols-[1.08fr_0.58fr_1.32fr] gap-2 overflow-hidden rounded-b-lg bg-white p-2 text-slate-900">
            <UploadPanel />
            <BillPagesPanel />
            <BillPreviewPanel />
          </section>
          <section className="mt-2 h-[118px] overflow-hidden rounded-lg bg-white p-2.5 text-slate-900">
            <ExtractedBillData />
          </section>
          <div className="flex h-[44px] items-center justify-end gap-3 border-b border-cyan-300/10 pr-1">
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-8 py-2 text-[11px]">Cancel</button>
            <button className="rounded bg-[#16a34a] px-8 py-2 text-[11px]">Save & Continue &nbsp; →</button>
          </div>
          <ScannerFooter />
        </main>
      </div>
    </div>
  );
}

function ScannerSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["SETTINGS", ["Settings"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="DEVICES"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className="flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300" key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">3</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[92px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">96</div><div>A+ Rating</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[38px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ScannerTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025</button><span className="text-[#05ff5e]">● Online</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">3</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ScannerSteps() {
  const steps = [["1", "Scan Utility Bill", "In Progress"], ["2", "Scan One-Line Drawing", "Pending"], ["3", "Project Details", "Pending"], ["4", "Review & Confirm", "Pending"]];
  return <div className="flex h-[40px] items-center text-[11px] text-slate-300">{steps.map(([num,title,state],i)=><span className="flex flex-1 items-center last:flex-none" key={title}><span className={i===0?"grid size-8 place-items-center rounded-full bg-[#147dff] text-white":"grid size-8 place-items-center rounded-full border border-slate-500 text-slate-300"}>{num}</span><span className="ml-3"><b className="text-white">{title}</b><br/><span className={i===0?"text-[#147dff]":""}>{state}</span></span>{i<steps.length-1 ? <span className="mx-7 h-px flex-1 bg-slate-700" /> : null}</span>)}</div>;
}

function UploadPanel() {
  return <section className="rounded border border-slate-200 p-4"><h2 className="mb-3 text-[13px] font-semibold">1. Upload or Capture Your Utility Bill</h2><div className="grid h-[188px] place-items-center rounded border-2 border-dashed border-[#147dff] bg-slate-50 text-center text-[10.5px]"><div><div className="mx-auto mb-3 grid size-10 place-items-center rounded text-[26px] text-[#147dff]">⇧</div><p className="text-[13px]">Drag and drop your utility bill here</p><p className="my-1.5">or</p><button className="rounded bg-[#147dff] px-7 py-2 text-white">▣ &nbsp; Capture with Camera</button><p className="mt-3 text-slate-500">Supported formats: JPG, PNG, PDF (Max file size: 10MB)</p></div></div><h3 className="mt-2.5 text-[12px] font-semibold">Or Select from Device</h3><button className="mt-2 rounded border border-[#147dff] px-7 py-1.5 text-[11px] text-[#147dff]">▱ &nbsp; Browse Files</button><div className="mt-2.5 rounded bg-blue-50 p-2.5 text-[9.5px]"><h3 className="mb-1 text-[11.5px] font-semibold">☼ &nbsp; Tips for Best Results</h3><ul className="ml-7 list-disc space-y-0.5"><li>Use a clear, high-resolution image</li><li>Ensure all four corners of the bill are visible</li><li>Include pages with detailed usage and charges</li><li>Avoid glare and shadows</li></ul></div></section>;
}

function BillPagesPanel() {
  return <section className="rounded border border-slate-200 p-3"><h2 className="mb-2 text-[13px] font-semibold">2. Bill Pages (2 pages detected)</h2><BillThumb active page="1" title="Account Summary" /><BillThumb page="2" title="Usage & Charges" /><button className="mt-2 w-full rounded border border-[#147dff] py-1.5 text-[11px] text-[#147dff]">+ &nbsp; Add More Pages</button></section>;
}

function BillThumb({ active, page, title }: { active?: boolean; page: string; title: string }) {
  return <article className={active ? "mb-2 rounded border-2 border-[#147dff] p-2" : "mb-2 rounded border border-slate-200 p-2 opacity-75"}><div className="flex gap-2"><span className={active ? "grid size-6 place-items-center rounded-full bg-[#147dff] text-white" : "grid size-6 place-items-center rounded-full bg-slate-500 text-white"}>{page}</span><MiniBill /></div><div className="ml-8 mt-1 text-[9.5px]">Page {page}<br/><span className="text-slate-500">{title}</span></div></article>;
}

function MiniBill() {
  return <div className="h-[86px] flex-1 rounded bg-white p-2 shadow"><div className="mb-1.5 flex items-center gap-1 text-[6px]"><b className="text-[#16a34a]">EnergyCo</b><span className="ml-auto">123 456</span></div><div className="space-y-1">{[70,55,78,42,64].map((w,i)=><span className="block h-1 rounded bg-slate-200" style={{width:`${w}%`}} key={i}/>)}</div><div className="mt-2 grid grid-cols-4 items-end gap-1">{[16,21,14,27].map((h,i)=><span className="bg-slate-300" style={{height:h}} key={i}/>)}</div><div className="mt-1.5 h-1 w-16 bg-[#16a34a]" /></div>;
}

function BillPreviewPanel() {
  return <section className="rounded border border-slate-200 p-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-[13px] font-semibold">3. Bill Preview</h2><div className="space-x-4 text-[11px]"><button className="rounded border border-slate-200 px-3 py-1">−</button><span>100%</span><button className="rounded border border-slate-200 px-3 py-1">+</button><button className="rounded border border-slate-200 px-3 py-1">⇩</button></div></div><div className="h-[364px] rounded border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between"><div className="text-[24px] font-bold"><span className="text-[#16a34a]">⌁</span> EnergyCo<br/><span className="text-[7px] font-normal">Powering Your World</span></div><div className="grid grid-cols-[90px_1fr] gap-y-1 text-[7.4px]"><b>Account Number:</b><span>123 456 789 0</span><b>Bill Date:</b><span>May 05, 2025</span><b>Due Date:</b><span>May 26, 2025</span></div></div><div className="mt-3 text-[7.6px]">FLEX TIJUANA MANUFACTURING<br/>1234 Industrial Way<br/>Tijuana, Baja California 22444</div><div className="mt-2 grid grid-cols-2 gap-3"><BillBox title="ACCOUNT SUMMARY" rows={[["Previous Balance","$118,750.43"],["Payments Received","-$118,750.43"],["Balance Forward","$0.00"],["Current Charges","$136,725.68"]]} footer={["Total Amount Due","$136,725.68"]}/><BillBox title="MONTHLY USAGE SUMMARY" rows={[["Electricity Usage","1,842,000 kWh"],["Peak Demand","1,250 kW"],["Power Factor (Average)","0.82 Lagging"]]} service /></div><div className="mt-2"><BillBox title="CURRENT CHARGES DETAIL" rows={[["Energy Charge","$89,642.10"],["Demand Charge","$34,875.00"],["Power Factor Adjustment","$6,420.35"],["Fuel Adjustment","$3,210.45"],["Taxes & Fees","$2,577.78"]]} footer={["Total Current Charges","$136,725.68"]}/></div></div></section>;
}

function BillBox({ footer, rows, service, title }: { footer?: string[]; rows: string[][]; service?: boolean; title: string }) {
  const compact = title === "CURRENT CHARGES DETAIL";
  return <div className={compact ? "rounded border border-slate-200 p-1.5 text-[6.4px]" : "rounded border border-slate-200 p-2 text-[7px]"}><h3 className={compact ? "mb-1 font-bold" : "mb-1.5 font-bold"}>{title}</h3>{rows.map(([l,v])=><div className={compact ? "flex justify-between leading-[9px]" : "flex justify-between py-[1px]"} key={l}><span>{l}</span><span>{v}</span></div>)}{service ? <div className="mt-2 border-t border-slate-200 pt-1"><h3 className="font-bold text-[#16a34a]">SERVICE SUMMARY</h3><div className="mt-0.5 grid grid-cols-[72px_1fr] gap-y-[1px]"><span>Service Address:</span><span>1234 Industrial Way, Tijuana</span><span>Rate Schedule:</span><span>CFE - GDMTH</span><span>Service Voltage:</span><span>13,200 V</span></div></div> : null}{footer ? <div className={compact ? "mt-1 flex justify-between border-t border-slate-200 pt-1 text-[8px] font-bold" : "mt-1.5 flex justify-between border-t border-slate-200 pt-1.5 text-[9.5px] font-bold"}><span>{footer[0]}</span><span className="text-[#16a34a]">{footer[1]}</span></div> : null}</div>;
}

function ExtractedBillData() {
  return <><div className="mb-2 flex items-center gap-3"><h2 className="text-[13px] font-semibold">4. Extracted Bill Data</h2><span className="text-[10px] text-[#16a34a]">◎ Data extracted successfully</span></div><div className="grid grid-cols-9 gap-2">{extractedFields.map(([label,value,icon])=><article className="rounded border border-slate-200 p-1.5 text-[8px]" key={label}><div className="mb-1.5 text-slate-500"><span className="text-[#147dff]">{icon}</span> &nbsp; {label}</div><b className={label==="Total Amount Due"?"text-[#16a34a]":""}>{value}</b></article>)}</div><button className="mt-2 rounded border border-[#147dff] px-4 py-1 text-[10px] text-[#147dff]">Review & Edit Extracted Data &nbsp; ✎</button></>;
}

function ScannerFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: May 18, 2025 10:15 AM <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
