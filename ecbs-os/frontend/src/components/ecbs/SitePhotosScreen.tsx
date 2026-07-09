const photos = [
  ["Main Transformer", "Outdoor Yard", "May 18, 2025 10:12 AM", "yard"],
  ["Main Switchboard", "Electrical Room 1", "May 18, 2025 10:11 AM", "gear"],
  ["Panel A (SMT Line 1)", "Electrical Room 1", "May 18, 2025 10:10 AM", "gear"],
  ["Power Quality Meter", "Main Switchboard", "May 18, 2025 10:10 AM", "meter"],
  ["Active Power Filter", "Electrical Room 2", "May 18, 2025 10:09 AM", "cabinet"],
  ["Xeco Gateway", "Control Panel", "May 18, 2025 10:09 AM", "gateway"],
  ["Panel B (Assembly)", "Electrical Room 2", "May 18, 2025 10:08 AM", "gear"],
  ["Feeder Panel 1", "Electrical Room 2", "May 18, 2025 10:08 AM", "panel"],
  ["CT Installation", "Main Switchboard", "May 18, 2025 10:07 AM", "wiring"],
  ["Meter-01", "Main Switchboard", "May 18, 2025 10:07 AM", "meter"],
  ["Repeater-01", "Electrical Room 1", "May 18, 2025 10:06 AM", "gateway"],
  ["Exterior - North View", "Building Exterior", "May 18, 2025 10:05 AM", "building"],
];

const details = [
  ["Photo Name", "Main Transformer"],
  ["Category", "Transformer"],
  ["Location", "Outdoor Yard"],
  ["Description", "1500 kVA main transformer\n13.2kV - 480Y/277V"],
  ["Date Taken", "May 18, 2025 10:12 AM"],
  ["Uploaded By", "John Smith (OEM Admin)"],
  ["File Size", "2.4 MB"],
  ["Dimensions", "4032 x 3024"],
];

export function SitePhotosScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[150px_1fr]">
        <SitePhotosSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <SitePhotosTopbar />
          <section className="flex h-[100px] items-start justify-between pt-3">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects &nbsp; &gt; &nbsp; Flex Tijuana Manufacturing &nbsp; &gt; &nbsp; <span className="text-white">Site Photos</span></div>
              <h1 className="mt-4 text-[24px] font-semibold leading-none">Site Photos</h1>
              <p className="mt-2 text-[10px] text-slate-200">View and manage photos of your facility and electrical system.</p>
            </div>
            <div className="mt-5 flex gap-4 text-[11px]">
              <button className="rounded border border-cyan-300/20 bg-[#061421] px-7 py-2.5">← &nbsp; Back to Site Dashboard</button>
              <button className="rounded bg-[#1463df] px-8 py-2.5">＋ &nbsp; Upload Photos</button>
            </div>
          </section>
          <section className="grid h-[674px] grid-cols-[1fr_380px] gap-3">
            <PhotoGallery />
            <PhotoDetails />
          </section>
          <SitePhotosFooter />
        </main>
      </div>
    </div>
  );
}

function PhotoGallery() {
  return (
    <section className="min-h-0 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4">
      <h2 className="text-[13px] font-semibold">Photo Gallery</h2>
      <div className="mt-4 grid grid-cols-[148px_148px_1fr_150px_72px] items-center gap-3 text-[10px]">
        <button className="flex h-8 items-center justify-between rounded border border-cyan-300/12 bg-[#071827] px-3 text-slate-300">All Categories <span>⌄</span></button>
        <button className="flex h-8 items-center justify-between rounded border border-cyan-300/12 bg-[#071827] px-3 text-slate-300">All Locations <span>⌄</span></button>
        <div className="h-8 rounded border border-cyan-300/12 bg-[#071827] px-3 py-2 text-slate-500">⌕ &nbsp; Search photos...</div>
        <button className="flex h-8 items-center justify-between rounded border border-cyan-300/12 bg-[#071827] px-3 text-slate-300">Sort by: Newest First <span>⌄</span></button>
        <div className="grid h-8 grid-cols-2 overflow-hidden rounded border border-cyan-300/12 text-center text-[16px]"><span className="bg-[#0c2233] py-1">▦</span><span className="py-1">☰</span></div>
      </div>
      <div className="mt-3 text-[10px] text-slate-300">24 Photos</div>
      <div className="mt-2 grid h-[488px] grid-cols-4 grid-rows-3 gap-3 overflow-hidden">
        {photos.map((photo, index) => (
          <PhotoTile active={index === 0} key={photo[0]} photo={photo} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex gap-2">
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#071827]">‹</button>
          <button className="grid size-8 place-items-center rounded bg-[#1463df] text-white">1</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#071827]">2</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#071827]">3</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 bg-[#071827]">›</button>
        </div>
        <span>Showing 1 to 12 of 24 photos</span>
      </div>
    </section>
  );
}

function PhotoTile({ active, photo }: { active?: boolean; photo: string[] }) {
  const [name, location, time, kind] = photo;
  return (
    <article className={`overflow-hidden rounded-lg border bg-[#071827] ${active ? "border-[#147dff] ring-2 ring-[#147dff]" : "border-cyan-300/12"}`}>
      <PhotoImage kind={kind} small />
      <div className="p-2 text-[9px] leading-tight">
        <div className="font-semibold text-white">{name}</div>
        <div className="text-slate-300">{location}</div>
        <div className="mt-1 text-[8px] text-slate-500">{time}</div>
      </div>
    </article>
  );
}

function PhotoDetails() {
  return (
    <aside className="min-h-0 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4">
      <h2 className="text-[13px] font-semibold">Photo Details</h2>
      <div className="relative mt-3 overflow-hidden rounded-lg">
        <PhotoImage kind="yard" />
        <button className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded bg-black/35">‹</button>
        <button className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded bg-black/35">›</button>
        <button className="absolute right-2 top-2 grid size-7 place-items-center rounded bg-black/45">↗</button>
      </div>
      <div className="mt-4 space-y-2.5 text-[9.2px]">
        {details.map(([label, value]) => (
          <div className="grid grid-cols-[88px_1fr] gap-3" key={label}>
            <span className="text-slate-400">{label}</span>
            <span className="whitespace-pre-line text-slate-100">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-[88px_1fr] gap-3 text-[9.2px]">
        <span className="text-slate-400">Tags</span>
        <div className="flex flex-wrap gap-2">
          {["Transformer", "Outdoor", "Main Equipment"].map((tag) => <span className="rounded border border-cyan-300/12 bg-[#071827] px-2 py-1" key={tag}>{tag}</span>)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[88px_1fr] gap-3 text-[9.2px]">
        <span className="text-slate-400">Notes</span>
        <span>Unit is operating normally. No visible issues.</span>
      </div>
      <div className="mt-4 h-px bg-cyan-300/10" />
      <div className="mt-3 grid grid-cols-3 gap-3 text-[9px]">
        <button className="rounded border border-cyan-300/20 bg-[#071827] py-2.5">✎ &nbsp; Edit Details</button>
        <button className="rounded border border-cyan-300/20 bg-[#071827] py-2.5">⇩ &nbsp; Download</button>
        <button className="rounded border border-red-500/50 bg-[#1a0a0c] py-2.5 text-red-500">▢ &nbsp; Delete</button>
      </div>
    </aside>
  );
}

function PhotoImage({ kind, small }: { kind: string; small?: boolean }) {
  const h = small ? "h-[108px]" : "h-[214px]";
  if (kind === "yard") {
    return <div className={`${h} bg-[linear-gradient(160deg,#b7d9ff_0_28%,#d7dce2_29%_46%,#415162_47%_49%,#e9eef2_50%_100%)] p-4`}><div className="mt-14 h-12 w-[72%] rounded-sm bg-white/85 shadow"><span className="pl-10 text-[18px] font-semibold text-sky-500">flex</span></div></div>;
  }
  if (kind === "meter") {
    return <div className={`${h} grid place-items-center bg-[linear-gradient(135deg,#c7c2b5,#5b5f60)]`}><div className="rounded bg-[#071827] p-3 text-center text-[15px] leading-tight text-[#05ff5e] shadow-lg">480.1<br/>479.9<br/>THD 4.1</div></div>;
  }
  if (kind === "gateway") {
    return <div className={`${h} grid place-items-center bg-[linear-gradient(135deg,#b9b5aa,#4b504d)]`}><div className="rounded bg-[#061421] px-6 py-4 text-[17px] font-semibold"><span className="text-[#05ff5e]">X</span>ECO</div></div>;
  }
  if (kind === "wiring") {
    return <div className={`${h} bg-[repeating-linear-gradient(90deg,#a9a395_0_14px,#24272a_15px_21px,#d7d0c0_22px_34px)]`} />;
  }
  if (kind === "panel") {
    return <div className={`${h} bg-[linear-gradient(90deg,#9d927d,#d8d1c4_45%,#383b3d_46%,#a7a091)]`} />;
  }
  return <div className={`${h} bg-[repeating-linear-gradient(90deg,#777b78_0_45px,#989b97_46px_92px,#c1bdb4_93px_98px)]`} />;
}

function SitePhotosTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 18, 2025 10:15 AM CDT</button><span className="text-[#05ff5e]">● Live</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">3</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function SitePhotosSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Billing"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="DEVICES"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className={item==="Sites"?"flex h-[23px] items-center justify-between rounded bg-[#063b27] px-1.5 text-[#05ff5e]":"flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">3</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[84px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">96</div><div>A+ Rating</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[36px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function SitePhotosFooter() {
  return <footer className="absolute bottom-2 left-4 right-4 flex h-[26px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: May 18, 2025 10:15 AM <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
