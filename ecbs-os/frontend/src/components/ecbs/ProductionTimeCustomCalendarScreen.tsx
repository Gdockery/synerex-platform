const calendarDays = [
  ["27", "", "muted"], ["28", "", "muted"], ["29", "", "muted"], ["30", "", "muted"], ["1", "7.6", "blue"], ["2", "8.1", "green"], ["3", "5.2", "purple"],
  ["4", "7.8", "cyan"], ["5", "8.4", "green"], ["6", "8.7", "green"], ["7", "9.2", "green"], ["8", "9.8", "blue"], ["9", "8.6", "green"], ["10", "7.1", "green"],
  ["11", "8.2", "cyan"], ["12", "9.1", "green"], ["13", "8.8", "green"], ["14", "8.9", "green"], ["15", "7.4", "green"], ["16", "6.6", "blue"], ["17", "6.6", "blue"],
  ["18", "7.5", "blue"], ["19", "", "dark"], ["20", "", "dark"], ["21", "", "dark"], ["22", "", "dark"], ["23", "", "dark"], ["24", "", "dark"],
  ["25", "", "dark"], ["26", "", "dark"], ["27", "", "dark"], ["28", "", "dark"], ["29", "", "dark"], ["30", "", "dark"], ["31", "", "dark"],
];

const productionBars = [7.8, 5.2, 8.4, 8.7, 9.2, 9.8, 8.2, 9.1, 8.9, 7.5];
const downtimeBars = [0.6, 1.1, 0.5, 0.7, 0.6, 0.4, 0.8, 0.6, 0.7, 0.6];

function ClientProjectSourceMissing({ message = "source_missing: Client project backend source/write model is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function ProductionTimeCustomCalendarScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ProductionSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ProductionTopbar />
          <ClientProjectSourceMissing />
          <section className="flex h-[90px] items-start justify-between pt-3">
            <div>
              <div className="text-[9px] text-slate-400">Home &nbsp; &gt; &nbsp; Energy Dashboard &nbsp; &gt; &nbsp; Production Time &nbsp; &gt; &nbsp; <span className="text-slate-100 underline">Custom Calendar</span></div>
              <h1 className="mt-3 text-[22px] font-semibold leading-none">Production Time - Custom Calendar <span className="text-[14px] text-slate-400">ⓘ</span></h1>
              <p className="mt-2 text-[10px] text-slate-300">Analyze production time using a custom calendar and date selections.</p>
            </div>
            <div className="mt-7 flex gap-3 text-[10px]"><ActionButton>⇄ &nbsp; Compare Ranges</ActionButton><ActionButton>⇩ &nbsp; Export &nbsp;⌄</ActionButton></div>
          </section>
          <section className="grid h-[86px] grid-cols-5 gap-3">
            <ProductionKpi label="Total Production Time" value="No Data" detail="source_missing" icon="◷" tone="#147dff" />
            <ProductionKpi label="Average Daily Production Time" value="No Data" detail="source_missing" icon="▣" tone="#05ff5e" />
            <ProductionKpi label="Peak Day" value="No Data" detail="source_missing" icon="↗" tone="#9333ea" />
            <ProductionKpi label="Lowest Day" value="No Data" detail="source_missing" icon="↘" tone="#f59e0b" />
            <ProductionKpi label="Total Downtime" value="No Data" detail="source_missing" icon="△" tone="#ef4444" />
          </section>
          <section className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_292px] gap-3">
            <div className="min-h-0 rounded border border-cyan-300/12 bg-[#061521]/92">
              <ProductionTabs />
              <div className="grid h-[366px] grid-cols-[318px_1fr]">
                <DateSelector />
                <ProductionChart />
              </div>
              <div className="grid h-[220px] grid-cols-[1fr_372px] gap-3 border-t border-cyan-300/10 p-3">
                <SelectedPeriodSummary />
                <ProductionDistribution />
              </div>
            </div>
            <DateFilters />
          </section>
          <ProductionFooter />
        </main>
      </div>
    </div>
  );
}

function ProductionSidebar() {
  const groups = [["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Electrical Network", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]], ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters", "Devices"]], ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Firmware"]], ["COMMISSIONING & TESTING", ["Field Testing", "Commissioning & Testing", "Documents"]]];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-3"><div className="text-[29px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[8px]">{groups.map(([title,items])=><section key={String(title)}><h2 className="mb-1 text-[#05ff5e]">{title}</h2>{(items as string[]).map(item=><div className={item==="Energy Dashboard" ? "flex h-[20px] items-center rounded bg-[#063b27] px-1.5 text-[#05ff5e]" : "flex h-[20px] items-center rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; {item}{item==="Alarms & Events"?<b className="ml-auto grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[92px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-center text-[8px]"><div className="text-slate-400">XECO Current<br/>Balance Index</div><div className="mt-1 text-[30px] font-light leading-none text-[#05ff5e]">96</div><div className="text-[#05ff5e]">At Rating</div><div className="mt-2 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[44px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ProductionTopbar() {
  return <header className="flex h-[48px] items-center justify-between border-b border-cyan-300/10"><div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[154px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[188px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">May 1 - May 18, 2025<br/><span className="text-[8px] text-slate-400">Custom</span></button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return <button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2 text-slate-100">{children}</button>;
}

function ProductionKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className="grid grid-cols-[1fr_48px] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><span><div className="text-[8px] text-slate-400">{label}</div><div className="mt-2 text-[22px] leading-none">{value}</div><div className="mt-3 text-[8px]" style={{color:tone}}>{detail}</div></span><span className="grid size-11 place-items-center rounded-full border text-[22px]" style={{borderColor:tone,color:tone}}>{icon}</span></article>;
}

function ProductionTabs() {
  return <div className="flex h-[46px] items-end justify-between border-b border-cyan-300/12 px-3 text-[9px]"><div className="flex gap-9"><span className="pb-3 text-slate-300">Daily Trend</span><span className="pb-3 text-slate-300">Shift Based</span><span className="border-b-2 border-[#147dff] pb-3 text-white">Custom Calendar</span><span className="pb-3 text-slate-300">Hourly Breakdown</span><span className="pb-3 text-slate-300">Downtime Analysis</span><span className="pb-3 text-slate-300">Equipment Comparison</span></div><div className="pb-2">View: <button className="ml-2 rounded border border-cyan-300/12 bg-[#03101b] px-4 py-1.5">Production Time ⌄</button></div></div>;
}

function DateSelector() {
  return <section className="border-r border-cyan-300/10 p-4 text-[9px]"><h3 className="mb-3 font-semibold">Select Dates</h3><div className="mb-3 flex gap-2"><button className="rounded bg-[#147dff] px-5 py-2">Calendar</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Date Range</button></div><div className="rounded border border-cyan-300/12 bg-[#03101b] p-2.5"><div className="mb-2 flex justify-between text-[13px]"><span>‹</span><b>May 2025</b><span>›</span></div><div className="grid grid-cols-7 gap-1 text-center"><div className="text-slate-400">Sun</div><div className="text-slate-400">Mon</div><div className="text-slate-400">Tue</div><div className="text-slate-400">Wed</div><div className="text-slate-400">Thu</div><div className="text-slate-400">Fri</div><div className="text-slate-400">Sat</div>{calendarDays.map(([day, hours, tone], index)=><div className={calendarClass(tone)} key={`${day}-${index}`}><div>{day}</div>{hours?<b>{hours}</b>:null}</div>)}</div></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[8px] text-slate-400"><span><b className="text-[#9333ea]">■</b> &lt; 6 hrs</span><span><b className="text-[#147dff]">■</b> 6 - 7 hrs</span><span><b className="text-[#06b6d4]">■</b> 7 - 8 hrs</span><span><b className="text-[#05ff5e]">■</b> 8 - 9 hrs</span><span><b className="text-[#f59e0b]">■</b> &gt; 9 hrs</span></div><div className="mt-2 flex justify-between text-[8px]"><span>Selected Dates: May 1 - May 18, 2025 (18 days)</span><span className="text-[#05bfff]">Clear Selection</span></div></section>;
}

function calendarClass(tone: string) {
  const base = "h-[28px] rounded py-0.5 leading-[12px]";
  if (tone === "muted") return `${base} bg-transparent text-slate-500`;
  if (tone === "dark") return `${base} bg-[#061421] text-slate-500`;
  if (tone === "purple") return `${base} bg-[#6d28d9] text-white`;
  if (tone === "blue") return `${base} bg-[#147dff] text-white`;
  if (tone === "cyan") return `${base} bg-[#0e8a9a] text-white`;
  return `${base} bg-[#087a35] text-white`;
}

function ProductionChart() {
  const days = ["May 1\nThu","May 3\nSat","May 5\nMon","May 7\nWed","May 9\nFri","May 11\nSun","May 13\nTue","May 15\nThu","May 17\nSat","May 18\nSun"];
  return <section className="p-4"><div className="mb-3 flex items-start justify-between"><h3 className="font-semibold text-[11px]">Production Time by Day</h3><div className="space-x-1 text-[10px]"><button className="rounded bg-[#147dff] px-2 py-1">▥</button><button className="rounded border border-cyan-300/12 px-2 py-1">⌁</button><button className="rounded border border-cyan-300/12 px-2 py-1">▦</button><button className="rounded border border-cyan-300/12 px-2 py-1">↗</button></div></div><div className="mb-3 flex justify-center gap-8 text-[8px]"><span><b className="text-[#147dff]">━</b> Production Time (hrs)</span><span><b className="text-[#9333ea]">━</b> Downtime (hrs)</span><span><b className="text-slate-400">--</b> Target (8.0 hrs)</span></div><svg className="h-[230px] w-full overflow-visible" viewBox="0 0 650 230"><line x1="48" x2="626" y1="49" y2="49" stroke="#64748b" strokeDasharray="6 5" strokeWidth="1"/>{[12,10,8,6,4,2,0].map((v,i)=><g key={v}><text fill="#94a3b8" fontSize="9" x="8" y={18+i*31}>{v}</text><line x1="42" x2="626" y1={16+i*31} y2={16+i*31} stroke="#164057" strokeOpacity=".45"/></g>)}<text fill="#94a3b8" fontSize="9" x="0" y="39">Hours</text>{productionBars.map((value,i)=>{const x=73+i*57; const h=value*16; const y=202-h; return <g key={i}><rect fill="#147dff" height={h} rx="2" width="18" x={x} y={y}/><rect fill="#9333ea" height={downtimeBars[i]*16} rx="2" width="18" x={x} y={202-downtimeBars[i]*16}/><text fill="#cbd5e1" fontSize="9" textAnchor="middle" x={x+9} y={y-6}>{value.toFixed(1)}</text><text fill="#a78bfa" fontSize="8" textAnchor="middle" x={x+9} y="196">{downtimeBars[i].toFixed(1)}</text><text fill="#cbd5e1" fontSize="8" textAnchor="middle" x={x+9} y="217">{days[i].split('\\n')[0]}</text><text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x+9} y="228">{days[i].split('\\n')[1]}</text></g>})}</svg><div className="mt-1 text-[8px] text-slate-400">All times shown in facility local time (CDT)</div></section>;
}

function SelectedPeriodSummary() {
  const rows = [["Total Production Time (hrs)", "146.2", "129.9", "+ 16.3", "+ 12.6%"], ["Average Daily Production Time (hrs/day)", "8.13", "7.22", "+ 0.91", "+ 12.6%"], ["Total Downtime (hrs)", "9.6", "9.2", "+ 0.4", "+ 4.3%"], ["Available Time (hrs)", "180.0", "180.0", "--", "--"], ["% of Available Time", "81.2%", "72.2%", "+ 9.0%", "+ 12.5%"]];
  return <section className="text-[8px]"><h3 className="mb-4 text-[11px] font-semibold">Summary for Selected Period</h3><table className="w-full text-left"><thead className="text-slate-400"><tr><th className="pb-2">Metric</th><th className="pb-2">Selected Period<br/>(May 1 - May 18, 2025)</th><th className="pb-2">Previous Period<br/>(Apr 1 - Apr 18, 2025)</th><th className="pb-2">Change</th><th className="pb-2">% Change</th></tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,index)=><td className={index>2 && cell.startsWith("+") ? "py-2 text-[#05ff5e]" : index===3 && cell.startsWith("-") ? "py-2 text-red-400" : "py-2"} key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></section>;
}

function ProductionDistribution() {
  return <section className="rounded border border-cyan-300/12 bg-[#061421] p-3"><h3 className="text-[11px] font-semibold">Production Time Distribution</h3><div className="mt-4 grid grid-cols-[150px_1fr] items-center gap-3 text-[9px]"><div className="relative size-[132px]"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="95 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="60 214" strokeDashoffset="-95" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#06b6d4" strokeDasharray="38 214" strokeDashoffset="-155" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="20 214" strokeDashoffset="-193" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#ef4444" strokeDasharray="12 214" strokeDashoffset="-210" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[22px]">146.2</b><br/>Total hrs</span></div></div><div className="space-y-3">{[["> 9 hrs","3 days (16.7%)","#f59e0b"],["8 - 9 hrs","8 days (44.4%)","#05b82e"],["7 - 8 hrs","5 days (27.8%)","#06b6d4"],["6 - 7 hrs","1 day (5.6%)","#147dff"],["< 6 hrs","1 day (5.6%)","#ef4444"]].map(([l,v,c])=><div className="flex justify-between" key={l}><span><b style={{color:c}}>●</b> {l}</span><span>{v}</span></div>)}</div></div><p className="mt-3 text-[8px] text-slate-400">Based on total production time per day.</p></section>;
}

function DateFilters() {
  return <aside className="rounded border border-cyan-300/12 bg-[#061521]/92 p-4 text-[9px]"><div className="mb-5 flex justify-between"><h3 className="text-[13px] font-semibold">Date Range & Filters</h3><span>⌃</span></div><div className="space-y-4"><div><div className="mb-2">Custom Calendar Selection</div><Select label="Selection Mode" value="Select Multiple Dates" /></div><div><div className="mb-2">Quick Select</div><div className="grid grid-cols-3 gap-2">{["Today","Yesterday","Last 7 Days","Last 30 Days","This Month","Last Month","This Year","Custom"].map(item=><button className={item==="Custom"?"rounded border border-[#147dff] bg-[#063057] py-2 text-[#7dd3fc]":"rounded border border-cyan-300/12 bg-[#061421] py-2 text-slate-300"} key={item}>{item}</button>)}</div></div><div className="flex items-center justify-between"><span>Include Partial Days<br/><b className="font-normal text-slate-400">Include first and last day even if partial.</b></span><span className="h-4 w-8 rounded-full bg-[#147dff] p-0.5"><i className="ml-auto block size-3 rounded-full bg-white" /></span></div><div className="grid grid-cols-2 gap-3"><Select label="Site" value="All Sites" /><Select label="Equipment Group" value="All Groups" /><Select label="Shift" value="All Shifts" /><Select label="Production Line" value="All Lines" /></div><label className="flex items-center gap-2 text-[10px]"><span className="grid size-4 place-items-center rounded bg-[#147dff] text-white">✓</span> Include Weekends</label><button className="w-full rounded bg-[#147dff] py-3 text-[11px]">Apply Filters</button><div className="text-center text-[#05bfff]">Clear All Filters</div></div></aside>;
}

function Select({ label, value }: { label: string; value: string }) {
  return <label><div className="mb-1 text-slate-400">{label}</div><div className="rounded border border-cyan-300/12 bg-[#03101b] px-3 py-2 text-slate-200">{value}<span className="float-right">⌄</span></div></label>;
}

function ProductionFooter() {
  return <footer className="flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-9 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-4 text-[#05ff5e]">▥ Live</b></span></footer>;
}
