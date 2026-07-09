const trendRows = [
  ["May 1, 2025 (Thu)", "7.6", "0.9", "8.5", "89.4%", "+ 8.7%"],
  ["May 2, 2025 (Fri)", "6.8", "1.1", "7.9", "86.1%", "+ 1.3%"],
  ["May 3, 2025 (Sat)", "4.2", "0.6", "4.8", "87.5%", "- 9.2%"],
  ["May 4, 2025 (Sun)", "3.9", "0.5", "4.4", "88.6%", "+ 2.5%"],
  ["May 5, 2025 (Mon)", "7.2", "1.0", "8.2", "87.8%", "+ 11.1%"],
];

const bars = [7.6, 6.8, 4.2, 3.9, 7.2, 8.0, 9.0, 9.4, 8.8, 9.6, 8.1, 7.8, 6.9, 7.1, 5.4, 6.0, 6.6, 6.5];
const downtime = [0.9, 0.7, 0.6, 0.5, 0.9, 1.1, 0.8, 0.9, 1.2, 1.1, 0.8, 0.9, 0.8, 0.8, 0.6, 0.7, 0.8, 0.9];
const productionPct = [89, 86, 88, 89, 88, 91, 93, 95, 96, 97, 90, 89, 92, 90, 73, 74, 88, 89];

export function ProductionTimeDateRangeScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <ProductionSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <ProductionTopbar />
          <section className="flex h-[90px] items-start justify-between pt-3">
            <div>
              <div className="text-[9px] text-slate-400">Home &nbsp; &gt; &nbsp; Energy Dashboard &nbsp; &gt; &nbsp; Production Time &nbsp; &gt; &nbsp; <span className="text-slate-100 underline">Date Range</span></div>
              <h1 className="mt-3 text-[22px] font-semibold leading-none">Production Time - Date Range <span className="text-[14px] text-slate-400">ⓘ</span></h1>
              <p className="mt-2 text-[10px] text-slate-300">View and analyze production time performance for the selected date range.</p>
            </div>
            <div className="mt-7 flex gap-3 text-[10px]"><ActionButton>⇄ &nbsp; Compare Ranges</ActionButton><ActionButton>⇩ &nbsp; Export &nbsp;⌄</ActionButton></div>
          </section>
          <section className="grid h-[86px] grid-cols-5 gap-3">
            <ProductionKpi label="Total Production Time" value="146.2 hrs" detail="+ 12.6% vs Apr 1 - Apr 18, 2025" icon="◷" tone="#147dff" />
            <ProductionKpi label="Average Daily Production Time" value="8.13 hrs/day" detail="+ 9.9% vs Apr 1 - Apr 18, 2025" icon="▣" tone="#05ff5e" />
            <ProductionKpi label="Peak Production Time (Day)" value="9.8 hrs" detail="May 8, 2025" icon="↗" tone="#9333ea" />
            <ProductionKpi label="Lowest Production Time (Day)" value="6.1 hrs" detail="May 14, 2025" icon="↘" tone="#f59e0b" />
            <ProductionKpi label="Total Downtime" value="9.6 hrs" detail="+ 4.3% vs Apr 1 - Apr 18, 2025" icon="△" tone="#ef4444" />
          </section>
          <section className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_292px] gap-3">
            <div className="min-h-0 rounded border border-cyan-300/12 bg-[#061521]/92">
              <ProductionTabs />
              <TrendChart />
              <div className="grid h-[226px] grid-cols-[1fr_326px] gap-3 border-t border-cyan-300/10 p-3">
                <DailySummaryTable />
                <ProductionDistribution />
              </div>
            </div>
            <DateRangeFilters />
          </section>
          <ProductionFooter />
        </main>
      </div>
    </div>
  );
}

function ProductionSidebar() {
  const groups = [["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Electrical Network", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]], ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters", "Devices"]], ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Firmware"]], ["COMMISSIONING & TESTING", ["Field Testing", "Commissioning & Testing", "Documents"]]];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-3"><div className="text-[29px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[8px]">{groups.map(([title,items])=><section key={String(title)}><h2 className="mb-1 text-[#05ff5e]">{title}</h2>{(items as string[]).map(item=><div className={item==="Energy Dashboard" ? "flex h-[20px] items-center rounded bg-[#063b27] px-1.5 text-[#05ff5e]" : "flex h-[20px] items-center rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; {item}{item==="Alarms & Events"?<b className="ml-auto grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">6</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[92px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-center text-[8px]"><div className="text-slate-400">XECO Current<br/>Balance Index</div><div className="mt-1 text-[30px] font-light leading-none text-[#05ff5e]">96</div><div className="text-[#05ff5e]">At Rating</div><div className="mt-2 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[44px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function ProductionTopbar() {
  return <header className="flex h-[48px] items-center justify-between border-b border-cyan-300/10"><div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[154px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[188px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">May 1 - May 18, 2025<br/><span className="text-[8px] text-slate-400">Custom</span></button><span className="text-[#05ff5e]">● Live</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">3</b></span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return <button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2 text-slate-100">{children}</button>;
}

function ProductionKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className="grid grid-cols-[1fr_48px] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><span><div className="text-[8px] text-slate-400">{label}</div><div className="mt-2 text-[22px] leading-none">{value}</div><div className="mt-3 text-[8px]" style={{color:tone}}>{detail}</div></span><span className="grid size-11 place-items-center rounded-full border text-[22px]" style={{borderColor:tone,color:tone}}>{icon}</span></article>;
}

function ProductionTabs() {
  return <div className="flex h-[46px] items-end justify-between border-b border-cyan-300/12 px-3 text-[9px]"><div className="flex gap-9"><span className="border-b-2 border-[#147dff] pb-3 text-white">Daily Trend</span><span className="pb-3 text-slate-300">Hourly Breakdown</span><span className="pb-3 text-slate-300">Shift Analysis</span><span className="pb-3 text-slate-300">Downtime Analysis</span><span className="pb-3 text-slate-300">Equipment Comparison</span></div><div className="pb-2">View: <button className="ml-2 rounded border border-cyan-300/12 bg-[#03101b] px-4 py-1.5">Production Time ⌄</button></div></div>;
}

function TrendChart() {
  const greenPoints = productionPct.map((v, i) => `${56 + i * 42},${206 - v * 1.55}`).join(" ");
  return <section className="h-[318px] p-4"><h3 className="text-[13px] font-semibold">Production Time Trend <span className="text-slate-400">ⓘ</span></h3><div className="mt-4 flex justify-center gap-10 text-[8px]"><span><b className="text-[#147dff]">━</b> Production Time (hrs)</span><span><b className="text-[#9333ea]">━</b> Downtime (hrs)</span><span><b className="text-[#05ff5e]">━</b> Production Time (%)</span></div><svg className="mt-2 h-[216px] w-full overflow-visible" viewBox="0 0 790 246"><text fill="#94a3b8" fontSize="9" x="0" y="38">Hours</text><text fill="#94a3b8" fontSize="9" x="714" y="18">% of Available Time</text>{[12,10,8,6,4,2,0].map((v,i)=><g key={v}><text fill="#94a3b8" fontSize="9" x="10" y={31+i*31}>{v}</text><line x1="42" x2="745" y1={28+i*31} y2={28+i*31} stroke="#164057" strokeOpacity=".45"/></g>)}{[100,80,60,40,20,0].map((v,i)=><text fill="#94a3b8" fontSize="9" x="756" y={31+i*37} key={v}>{v}%</text>)}{bars.map((value,i)=>{const x=58+i*40; const h=value*17; const y=214-h; return <g key={i}><rect fill="#147dff" height={h} rx="2" width="16" x={x} y={y}/><rect fill="#9333ea" height={downtime[i]*17} rx="2" width="16" x={x} y={214-downtime[i]*17}/><text fill="#cbd5e1" fontSize="8" textAnchor="middle" x={x+8} y="232">May {i+1}</text></g>})}<polyline fill="none" points={greenPoints} stroke="#05ff5e" strokeWidth="2"/>{productionPct.map((v,i)=><circle cx={56+i*42} cy={206-v*1.55} fill="#05ff5e" key={i} r="3"/> )}</svg><div className="text-[8px] text-slate-400">All times shown in facility local time (CDT)</div></section>;
}

function DailySummaryTable() {
  return <section className="rounded border border-cyan-300/12 bg-[#061421] p-3 text-[8px]"><h3 className="mb-4 text-[11px] font-semibold">Daily Summary</h3><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Date","Production Time (hrs)","Downtime (hrs)","Available Time (hrs)","Production Time (%)","vs Previous Period"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{trendRows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,index)=><td className={index===5 && cell.startsWith("-") ? "py-2 text-red-400" : index===5 ? "py-2 text-[#05ff5e]" : "py-2"} key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-3 flex items-center justify-between text-[9px] text-slate-400"><span>Showing 1 to 5 of 18 days</span><span className="space-x-2"><b className="rounded border border-cyan-300/12 px-2 py-1">‹</b><b className="rounded border border-cyan-300/12 px-2 py-1">‹</b><b className="rounded border border-[#147dff] px-2 py-1 text-white">1</b><b className="rounded border border-cyan-300/12 px-2 py-1">2</b><b className="rounded border border-cyan-300/12 px-2 py-1">3</b><b className="rounded border border-cyan-300/12 px-2 py-1">4</b><b className="rounded border border-cyan-300/12 px-2 py-1">›</b><b className="rounded border border-cyan-300/12 px-2 py-1">»</b></span><button className="rounded border border-cyan-300/12 bg-[#03101b] px-4 py-1">5 per page ⌄</button></div></section>;
}

function ProductionDistribution() {
  return <section className="rounded border border-cyan-300/12 bg-[#061421] p-3"><h3 className="text-[11px] font-semibold">Production Time Distribution</h3><div className="mt-4 grid grid-cols-[136px_1fr] items-center gap-3 text-[8px]"><div className="relative size-[124px]"><svg className="size-[124px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="79 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="72 214" strokeDashoffset="-79" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="40 214" strokeDashoffset="-151" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#ef4444" strokeDasharray="23 214" strokeDashoffset="-191" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[22px]">146.2</b><br/>Total hrs</span></div></div><div className="space-y-4">{[["> 90%","68 days (37.0%)","#05b82e"],["70% - 90%","62 days (33.7%)","#147dff"],["50% - 70%","34 days (18.5%)","#f59e0b"],["< 50%","20 days (10.9%)","#ef4444"]].map(([l,v,c])=><div className="flex justify-between" key={l}><span><b style={{color:c}}>●</b> {l}</span><span>{v}</span></div>)}</div></div><p className="mt-4 text-[8px] text-slate-400">Based on production time percentage of available time.</p></section>;
}

function DateRangeFilters() {
  return <aside className="rounded border border-cyan-300/12 bg-[#061521]/92 p-4 text-[9px]"><div className="mb-5 flex justify-between"><h3 className="text-[13px] font-semibold">Date Range & Filters</h3><span>⌃</span></div><div className="space-y-4"><div><div className="mb-2">Date Range Selection</div><div className="rounded border border-cyan-300/12 bg-[#03101b] px-3 py-2">Custom <span className="float-right">⌄</span></div></div><div className="grid grid-cols-2 gap-3"><Select label="From" value="May 1, 2025  ▣" /><Select label="To" value="May 18, 2025  ▣" /></div><div><div className="mb-2">Quick Select</div><div className="grid grid-cols-3 gap-2">{["Today","Yesterday","Last 7 Days","Last 30 Days","This Month","Last Month","This Year","Custom"].map(item=><button className={item==="Custom"?"rounded border border-[#147dff] bg-[#063057] py-2 text-[#7dd3fc]":"rounded border border-cyan-300/12 bg-[#061421] py-2 text-slate-300"} key={item}>{item}</button>)}</div></div><div className="border-t border-cyan-300/10 pt-2">Filters</div><div className="grid grid-cols-2 gap-3"><Select label="Site" value="All Sites" /><Select label="Equipment Group" value="All Groups" /><Select label="Shift" value="All Shifts" /><Select label="Production Line" value="All Lines" /></div><label className="flex items-center gap-2 text-[10px]"><span className="grid size-4 place-items-center rounded bg-[#147dff] text-white">✓</span> Include Weekends</label><button className="w-full rounded bg-[#147dff] py-3 text-[11px]">Apply Filters</button><div className="text-center text-[#05bfff]">Clear All</div></div></aside>;
}

function Select({ label, value }: { label: string; value: string }) {
  return <label><div className="mb-1 text-slate-400">{label}</div><div className="rounded border border-cyan-300/12 bg-[#03101b] px-3 py-2 text-slate-200">{value}<span className="float-right">⌄</span></div></label>;
}

function ProductionFooter() {
  return <footer className="flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-9 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: May 18, 2025 10:15 AM CDT <b className="ml-4 text-[#05ff5e]">▥ Live</b></span></footer>;
}
