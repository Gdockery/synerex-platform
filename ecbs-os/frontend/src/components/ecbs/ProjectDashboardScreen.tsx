const projectRows: Array<[string, string, string, string, string, number, string, string]> = [
  ["Flex Tijuana Manufacturing", "🇲🇽 Tijuana, Mexico", "Manufacturing", "3.2 MW", "In Progress", 75, "Feb 01, 2025", "Jun 30, 2025"],
  ["Flex Juarez Plant", "🇲🇽 Juarez, Mexico", "Manufacturing", "2.8 MW", "In Progress", 60, "Mar 15, 2025", "Jul 15, 2025"],
  ["Flex DFW Campus", "🇺🇸 Dallas, TX, USA", "Manufacturing", "4.6 MW", "In Progress", 40, "Apr 01, 2025", "Aug 31, 2025"],
  ["Flex Austin HQ", "🇺🇸 Austin, TX, USA", "Corporate", "1.5 MW", "Planning", 10, "May 10, 2025", "Sep 30, 2025"],
  ["Flex San Luis Potosi", "🇲🇽 San Luis Potosi, Mexico", "Manufacturing", "3.7 MW", "Not Started", 0, "Jun 01, 2025", "Nov 30, 2025"],
  ["Flex Monterrey Facility", "🇲🇽 Monterrey, Mexico", "Manufacturing", "2.1 MW", "In Progress", 20, "Apr 20, 2025", "Aug 20, 2025"],
  ["Flex Phoenix DC", "🇺🇸 Phoenix, AZ, USA", "Data Center", "2.9 MW", "In Progress", 55, "Mar 05, 2025", "Jul 31, 2025"],
  ["Flex Guadalajara Plant", "🇲🇽 Guadalajara, Mexico", "Manufacturing", "1.8 MW", "Planning", 5, "Jun 15, 2025", "Dec 15, 2025"],
];

function ClientProjectSourceMissing({ message = "source_missing: Client project backend source/write model is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function ProjectDashboardScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ProjectSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ProjectTopbar />
          <ClientProjectSourceMissing />
          <section className="flex h-[130px] items-start justify-between pt-4">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects / Facilities</div>
              <h1 className="mt-5 text-[22px] font-semibold leading-none">Flex Ltd. - Projects / Facilities</h1>
              <p className="mt-3 text-[10px] text-slate-200">View and manage all projects and facilities for this client.</p>
            </div>
            <button className="mt-7 rounded bg-[#087a35] px-4 py-2.5 text-[11px] text-white">+ &nbsp; New Project</button>
          </section>
          <section className="grid h-[96px] grid-cols-5 gap-3">
            <ProjectKpi label="Total Projects" value="No Data" detail="source_missing" icon="▣" tone="#147dff" />
            <ProjectKpi label="Total Capacity" value="No Data" detail="source_missing" icon="◴" tone="#10b981" />
            <ProjectKpi label="Active Projects" value="No Data" detail="source_missing" icon="⌁" tone="#7c3aed" />
            <ProjectKpi label="Completed Projects" value="No Data" detail="source_missing" icon="✓" tone="#c56a05" />
            <ProjectKpi label="Projected Savings (Annual)" value="No Data" detail="source_missing" icon="$" tone="#1d65c8" />
          </section>
          <ProjectTabs />
          <section className="mt-3 min-h-0 flex-1 rounded border border-cyan-300/12 bg-[#061521]/92">
            <ProjectToolbar />
            <ProjectTable />
          </section>
          <ProjectFooter />
        </main>
      </div>
    </div>
  );
}

function ProjectSidebar() {
  const groups = [["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]], ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]], ["SETTINGS", ["Settings"]]];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4"><div className="text-[29px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-3 text-[9px]">{groups.map(([title,items])=><section key={String(title)}><h2 className="mb-1 text-[#05ff5e]">{title}</h2>{(items as string[]).map(item=><div className={item==="Energy Dashboard" ? "flex h-[24px] items-center rounded bg-[#063b27] px-1.5 text-[#05ff5e]" : "flex h-[24px] items-center rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; {item}{item==="Alarms & Events"?<b className="ml-auto grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[102px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-center text-[8px]"><div className="text-slate-400">XECO Current<br/>Balance Index</div><div className="mt-1 text-[31px] font-light leading-none text-[#05ff5e]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[50px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ &nbsp; Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[8px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ProjectTopbar() {
  return <header className="flex h-[48px] items-center justify-between border-b border-cyan-300/10"><div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[154px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[214px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp;⌄</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ProjectKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className="grid grid-cols-[58px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-4"><span className="grid size-12 place-items-center rounded-lg text-[24px]" style={{backgroundColor:tone,color:"white"}}>{icon}</span><span><div className="text-[10px] text-slate-400">{label}</div><div className="mt-1 text-[22px] font-semibold leading-none">{value}</div><div className="mt-2 text-[9px] text-slate-300">{detail}</div></span></article>;
}

function ProjectTabs() {
  return <div className="flex h-[46px] items-end gap-9 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] pb-3 text-[#05ff5e]">Projects / Facilities</span><span className="pb-3 text-slate-300">Sites</span><span className="pb-3 text-slate-300">Analytics</span><span className="pb-3 text-slate-300">Documents</span><span className="pb-3 text-slate-300">Alerts <b className="ml-1 inline-grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span></div>;
}

function ProjectToolbar() {
  return <div className="grid h-[62px] grid-cols-[1fr_104px_1fr_108px_34px_34px] items-center gap-3 border-b border-cyan-300/10 px-4 text-[10px]"><div className="rounded border border-cyan-300/12 bg-[#03101b] px-3 py-3 text-slate-400">⌕ &nbsp; Search projects or facilities by name, location, or ID...</div><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-3 text-slate-200">▽ &nbsp; Filters <b className="text-[#05ff5e]">●</b></button><div /><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-3">⇩ &nbsp; Export &nbsp;⌄</button><button className="rounded border border-[#05ff5e] bg-[#063b27] py-3 text-[#05ff5e]">☰</button><button className="rounded border border-cyan-300/12 bg-[#061421] py-3">▦</button></div>;
}

function ProjectTable() {
  return <div className="px-4 text-[9px]"><table className="w-full text-left"><thead className="text-slate-300"><tr>{["Project / Facility Name","Site Location","Site Type","Capacity","Status","Progress","Start Date","Target Completion","Actions"].map(h=><th className="h-[42px] font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{projectRows.map(row=><tr className="border-t border-cyan-300/10" key={row[0]}><td className="py-2"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#147dff] text-[15px]">▦</span><span><b className="font-medium text-slate-100">{row[0]}</b><br/><span className="text-slate-400">{row[1]}</span></span></div></td><td className="py-2">{row[1].replace(/^[^ ]+ /, "")}</td><td className="py-2">{row[2]}</td><td className="py-2">{row[3]}</td><td className="py-2"><Status value={row[4] as string} /></td><td className="py-2"><div className="flex items-center gap-3"><span className="h-2 w-[88px] rounded-full bg-slate-700"><i className={row[4]==="Planning"?"block h-2 rounded-full bg-[#147dff]":"block h-2 rounded-full bg-[#05b82e]"} style={{width:`${row[5]}%`}} /></span><span>{row[5]}%</span></div></td><td className="py-2">{row[6]}</td><td className="py-2">{row[7]}</td><td className="py-2"><span className="rounded border border-cyan-300/20 px-2 py-1 text-[13px]">⌁</span><span className="ml-4 text-[16px]">⌘</span></td></tr>)}</tbody></table><div className="mt-4 flex items-center justify-between text-[10px] text-slate-300"><span>Showing 1 to 8 of 18 projects</span><span className="space-x-3"><button className="rounded border border-cyan-300/12 px-3 py-2">←</button><button className="rounded border border-[#05ff5e] px-3 py-2 text-[#05ff5e]">1</button><button className="rounded border border-cyan-300/12 px-3 py-2">2</button><button className="rounded border border-cyan-300/12 px-3 py-2">3</button><button className="rounded border border-cyan-300/12 px-3 py-2">→</button></span></div></div>;
}

function Status({ value }: { value: string }) {
  const color = value === "Planning" ? "#147dff" : value === "Not Started" ? "#64748b" : "#05b82e";
  return <span><b style={{color}}>●</b> &nbsp; {value}</span>;
}

function ProjectFooter() {
  return <footer className="flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-9 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-4 text-[#05ff5e]">▥ Live</b></span></footer>;
}
