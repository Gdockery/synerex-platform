const billInfo = [
  ["Utility Company", "Austin Energy"],
  ["Rate Schedule / Tariff", "CFE - GDMTH (Medium Voltage)"],
  ["Account Number", "876543210"],
  ["Service Voltage", "13,200 V"],
  ["Service Address", "2500 Industrial Way\nAustin, TX 78741"],
  ["Total Amount Due", "$48,732.16"],
  ["Bill Date", "May 05, 2025"],
  ["Total Demand", "1,250 kW"],
  ["Billing Period", "Apr 03, 2025 - May 02, 2025 (30 days)"],
  ["Total Energy (kWh)", "512,480 kWh"],
  ["Due Date", "May 26, 2025"],
  ["Power Factor", "0.82 Lagging"],
];

function ClientProjectSourceMissing({ message = "source_missing: Client project backend source/write model is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function UtilityBillScannerPageScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <BillPageSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <BillPageTopbar />
          <ClientProjectSourceMissing />
          <section className="flex h-[76px] items-start justify-between pt-3">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects / Facilities &nbsp; &gt; &nbsp; Create New Project &nbsp; &gt; &nbsp; <span className="text-white">Scan Utility Bill</span></div>
              <h1 className="mt-3 text-[26px] font-semibold leading-none">Scan Utility Bill</h1>
              <p className="mt-2 text-[11px] text-slate-200">Upload or scan the most recent utility bill for accurate analysis and rate identification.</p>
            </div>
            <button className="mt-5 rounded border border-cyan-300/20 bg-[#061421] px-5 py-2.5 text-[11px]">&lt;- &nbsp; Back to Project Setup</button>
          </section>
          <section className="grid h-[626px] grid-cols-[1.08fr_1fr] gap-3">
            <ExtractedInformation />
            <UploadUtilityBill />
          </section>
          <div className="flex h-[70px] items-center justify-end gap-3 border-b border-cyan-300/10">
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-9 py-2.5 text-[11px]">Cancel</button>
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-8 py-2.5 text-[11px]">Skip for Now</button>
            <button className="rounded bg-[#16a34a] px-8 py-2.5 text-[11px]">Save & Continue &nbsp; →</button>
          </div>
          <BillPageFooter />
        </main>
      </div>
    </div>
  );
}

function BillPageSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["SETTINGS", ["Settings"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="DEVICES"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className="flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300" key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[92px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[38px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function BillPageTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ExtractedInformation() {
  return <section className="overflow-hidden rounded-lg bg-white p-5 text-slate-900"><div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Extracted Bill Information</h2><button className="rounded border border-[#147dff] px-4 py-2 text-[11px] text-[#147dff]">⟳ &nbsp; Re-scan / Replace</button></div><div className="mt-3 text-[11px] text-[#16a34a]">◎ &nbsp; Data extracted successfully</div><div className="mt-4 border-t border-slate-200 pt-4"><div className="grid grid-cols-2 gap-x-9 gap-y-5 text-[10.5px]">{billInfo.map(([label,value])=><div key={label}><div className="text-slate-500">{label}</div><div className="mt-1 whitespace-pre-line text-[12.5px] font-semibold leading-[17px]">{value}</div></div>)}</div></div><div className="mt-5 rounded bg-blue-50 px-4 py-2.5 text-[10.5px] text-slate-700">ⓘ &nbsp; Please verify the extracted information above. You can edit any field if needed before continuing.</div><div className="mt-4 grid grid-cols-2 gap-3"><button className="rounded border border-[#147dff] py-2.5 text-[12px] text-[#147dff]">Edit Extracted Data &nbsp; ✎</button><button className="rounded border border-[#147dff] py-2.5 text-[12px] text-[#147dff]">Preview Full Bill &nbsp; ◎</button></div></section>;
}

function UploadUtilityBill() {
  return <section className="overflow-hidden rounded-lg bg-white p-5 text-slate-900"><h2 className="text-[18px] font-semibold">Upload or Scan Your Utility Bill</h2><div className="mt-5 grid h-[236px] place-items-center rounded border-2 border-dashed border-[#147dff] bg-white text-center"><div><div className="mx-auto mb-4 grid size-14 place-items-center text-[34px] text-[#147dff]">⇧</div><p className="text-[16px]">Drag and drop your utility bill here</p><p className="text-[14px]">or scan using your device</p><button className="mt-4 rounded bg-[#147dff] px-8 py-3 text-[13px] text-white">▣ &nbsp; Scan Utility Bill</button></div></div><div className="my-4 grid grid-cols-[1fr_34px_1fr] items-center text-center text-[11px] text-slate-500"><span className="h-px bg-slate-200" /><span>or</span><span className="h-px bg-slate-200" /></div><div className="grid grid-cols-2 gap-5 text-[11px]"><div><h3 className="mb-3 text-[13px] font-semibold">Upload from your device</h3><button className="rounded border border-[#147dff] px-8 py-2.5 text-[12px] text-[#147dff]">▱ &nbsp; Browse Files</button></div><div className="pt-7 text-[12px]">Supported formats: JPG, PNG, PDF<br/>(Max file size: 10MB)</div></div><div className="mt-5 rounded bg-blue-50 p-4 text-[11px]"><h3 className="mb-2 text-[15px] font-semibold">☼ &nbsp; Tips for Best Results</h3><ul className="ml-7 list-disc space-y-1.5"><li>Use a clear, well-lit image of the entire bill</li><li>Include all pages (front and back if applicable)</li><li>Avoid glare and ensure text is readable</li></ul></div></section>;
}

function BillPageFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
