function ClientProjectSourceMissing({ message = "source_missing: Client project backend source/write model is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function GenerateProposalScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ProposalSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ProposalTopbar />
          <ClientProjectSourceMissing />
          <section className="flex h-[104px] items-start justify-between pt-4">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects / Facilities &nbsp; &gt; &nbsp; <span className="text-[#05ff5e]">Create New Project</span></div>
              <h1 className="mt-4 text-[28px] font-semibold leading-none">Create New Project</h1>
              <p className="mt-3 text-[10px] text-slate-200">Set up a new project and upload required documents to generate proposals and site assessment reports.</p>
            </div>
            <button className="mt-6 rounded border border-cyan-300/20 bg-[#061421] px-4 py-2 text-[10px] text-slate-200">&lt;- Back to Projects</button>
          </section>
          <section className="h-[58px] rounded-t-lg border border-cyan-300/12 bg-[#061521]/92 px-7 py-3">
            <ProposalSteps />
          </section>
          <section className="grid h-[570px] shrink-0 grid-cols-[1fr_0.98fr] gap-3 overflow-hidden rounded-b-lg border-x border-b border-cyan-300/12 bg-[#061521]/92 p-3">
            <ProjectInformationPanel />
            <div className="flex min-h-0 flex-col gap-2">
              <RequiredDocumentsPanel />
              <NextStepPanel />
            </div>
          </section>
          <div className="flex h-[58px] items-center justify-end gap-3 border-b border-cyan-300/10 pr-3">
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-7 py-2 text-[11px]">Cancel</button>
            <button className="rounded bg-[#1455a8] px-7 py-2 text-[11px]">Save Draft</button>
            <button className="rounded bg-[#16a34a] px-7 py-2 text-[11px]">Save & Continue</button>
          </div>
          <ProposalFooter />
        </main>
      </div>
    </div>
  );
}

function ProposalSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["SETTINGS", ["Settings"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="ENTERPRISE"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className="flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300" key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[84px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details {"->"}</div></div><div className="absolute bottom-[36px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ProposalTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ProposalSteps() {
  const steps = ["Project Information", "Upload Documents", "Site & Utility Information", "Review & Confirm"];
  return <div className="flex h-[38px] items-center text-[12px] text-slate-300">{steps.map((step,i)=><span className="flex flex-1 items-center last:flex-none" key={step}><span className={i===0 ? "grid size-8 place-items-center rounded-full border border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : "grid size-8 place-items-center rounded-full border border-slate-500 text-slate-300"}>{i+1}</span><span className={i===0 ? "ml-3 text-white" : "ml-3"}>{step}</span>{i<steps.length-1 ? <span className="mx-7 h-px flex-1 bg-slate-700" /> : null}</span>)}</div>;
}

function ProjectInformationPanel() {
  return <section className="min-h-0 rounded-lg bg-white p-5 text-slate-900"><h2 className="mb-4 text-[16px] font-semibold">1. Project Information</h2><div className="grid grid-cols-2 gap-x-4 gap-y-3"><Field label="Project / Facility Name" value="Flex Tijuana Manufacturing" required /><Field label="Site Location" value="Tijuana, Baja California, Mexico" required /><Field label="Site Type" value="Manufacturing Facility⌄" required /><Field label="Industry" value="Manufacturing⌄" required /><Field label="Project Owner" value="Flex Ltd.⌄" required /><Field label="Account Manager" value="Sarah Johnson⌄" /><Field label="Start Date" value="May 12, 2025                         ▣" required /><Field label="Target Completion Date" value="Jun 30, 2025                         ▣" required /><Field label="Project Currency" value="USD - US Dollar⌄" required /><Field label="Rate Schedule / Tariff" value="CFE - GDMTH (Medium Voltage)⌄" /><div className="col-span-2"><Field multiline label="Project Description (Optional)" value={"Primary manufacturing facility with multiple production lines.\nFocus on energy optimization and capacity recovery."} /></div></div><div className="mt-3 rounded border border-green-300 bg-green-50 px-4 py-3 text-[11px] text-slate-700">ⓘ &nbsp; After saving, you can continue to upload documents, configure site details, and generate proposals and site assessment reports.</div></section>;
}

function Field({ label, multiline, required, value }: { label: string; multiline?: boolean; required?: boolean; value: string }) {
  return <label className="block text-[11px]"><span>{label} {required ? <b className="text-red-500">*</b> : null}</span>{multiline ? <div className="mt-2 h-[60px] rounded border border-slate-300 bg-white px-3 py-2 text-[11px] whitespace-pre-line">{value}<span className="float-right mt-6 text-[9px] text-slate-500">112 / 500</span></div> : <div className="mt-2 h-[32px] rounded border border-slate-300 bg-white px-3 py-2 text-[11px]">{value}</div>}</label>;
}

function RequiredDocumentsPanel() {
  return <section className="rounded-lg bg-white p-3.5 text-slate-900"><h2 className="mb-2 text-[16px] font-semibold">2. Required Documents</h2><div className="mb-2 rounded border border-green-200 bg-green-50 px-4 py-2 text-[11px]">ⓘ &nbsp; Upload the following documents to enable assessment and proposal generation.</div><div className="grid grid-cols-2 gap-4"><UploadCard title="Utility Bill (Most Recent)" button="Scan Utility Bill" icon="$" /><UploadCard title="One-Line Drawing" button="Scan One-Line Drawing" icon="⌁" /></div></section>;
}

function UploadCard({ button, icon, title }: { button: string; icon: string; title: string }) {
  return <article className="rounded border border-dashed border-slate-300 p-2.5 text-[10px]"><h3 className="font-semibold">{title}</h3><p>JPG, PNG, PDF (Max 10MB)</p><div className="my-2 grid place-items-center text-[34px] text-[#16a34a]">{icon}</div><button className="h-7 w-full rounded bg-[#168a35] text-white">▧ {button}</button><button className="mt-2 h-7 w-full rounded border border-green-700 text-green-700">Browse Files</button><div className="mt-1.5 text-slate-500">No file uploaded</div></article>;
}

function NextStepPanel() {
  const rows = [["▧","Project / Facility Name","Complete","#16a34a"],["⌖","Site Location","Complete","#16a34a"],["▣","Site Type","Complete","#16a34a"],["▤","Utility Bill","Required","#f59e0b"],["⌁","One-Line Drawing","Required","#f59e0b"]];
  return <section className="flex-1 rounded-lg bg-white p-3.5 text-slate-900"><h2 className="mb-2 text-[16px] font-semibold">3. Required for Next Step</h2><table className="w-full text-left text-[10.5px]"><thead className="text-slate-500"><tr><th className="pb-1.5">Requirement</th><th className="pb-1.5">Status</th></tr></thead><tbody>{rows.map(([icon,label,status,color])=><tr className="border-t border-slate-200" key={label}><td className="py-1"><span style={{color}}>{icon}</span> &nbsp; {label}</td><td className="py-1 font-semibold" style={{color}}>{status==="Complete"?"✓ ":"○ "}{status}</td></tr>)}</tbody></table></section>;
}

function ProposalFooter() {
  return <footer className="flex h-[36px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
