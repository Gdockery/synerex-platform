const transactions = [
  ["Invoice", "INV-2025-0518-1001", "Flex Tijuana Mfg.", "CC-210 - Assembly", "May 18, 2025", "Jun 17, 2025", "$18,750.00", "$0.00", "$18,750.00", "Due in 30 days"],
  ["Invoice", "INV-2025-0510-0987", "Flex Juarez", "CC-220 - Assembly", "May 10, 2025", "Jun 09, 2025", "$22,340.00", "$0.00", "$22,340.00", "Due in 22 days"],
  ["Payment", "PAY-2025-0508-0456", "Flex Tijuana Mfg.", "CC-210 - Assembly", "May 08, 2025", "--", "-$15,000.00", "-$15,000.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0501-0912", "Flex Monterrey", "CC-320 - Facilities", "May 01, 2025", "May 31, 2025", "$27,650.00", "$27,650.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0425-0876", "Flex Austin HQ", "CC-510 - Admin", "Apr 25, 2025", "May 25, 2025", "$9,850.00", "$9,850.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0418-0850", "Flex Reynosa", "CC-330 - Facilities", "Apr 18, 2025", "May 18, 2025", "$14,250.00", "$0.00", "$14,250.00", "Overdue"],
  ["Payment", "PAY-2025-0415-0821", "Flex Dallas", "CC-410 - Logistics", "Apr 15, 2025", "--", "$11,900.00", "$11,900.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0410-0758", "Flex Monterey", "CC-320 - Facilities", "Apr 10, 2025", "--", "-$18,650.00", "-$18,650.00", "$0.00", "Paid"],
  ["Payment", "PAY-2025-0410-0356", "Flex Monterey", "CC-320 - Facilities", "Apr 10, 2025", "--", "-$18,650.00", "-$18,650.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0401-0752", "Flex Orlando", "CC-610 - Engineering", "Apr 01, 2025", "May 01, 2025", "$7,450.00", "$3,200.00", "$4,250.00", "Partial"],
  ["Payment", "PAY-2025-0331-0288", "Flex Orlando", "CC-610 - Engineering", "Mar 31, 2025", "--", "-$3,200.00", "-$3,200.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0330-0701", "Flex Tijuana Mfg.", "CC-210 - Assembly", "Mar 30, 2025", "Apr 29, 2025", "$26,800.00", "$26,800.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0315-0600", "Flex San Luis Potosí", "CC-220 - Assembly", "Mar 15, 2025", "Apr 14, 2025", "$15,750.00", "$0.00", "$15,750.00", "Overdue"],
  ["Payment", "PAY-2025-0305-0222", "Flex Dallas", "CC-410 - Logistics", "Mar 05, 2025", "--", "-$11,750.00", "-$11,750.00", "$0.00", "Paid"],
  ["Invoice", "INV-2025-0301-0550", "Flex Austin HQ", "CC-510 - Admin", "Mar 01, 2025", "Mar 31, 2025", "$6,900.00", "$6,900.00", "$0.00", "Paid"],
];

export function PaymentsInvoicesScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <PaymentsSidebar />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <PaymentsTopbar />
          <section className="flex h-[82px] items-start justify-between pt-3">
            <div>
              <div className="text-[9px] text-slate-400">Home &nbsp; &gt; &nbsp; Job Costing &nbsp; &gt; &nbsp; <span className="text-slate-100 underline">Payments / Invoices</span></div>
              <h1 className="mt-3 text-[22px] font-semibold leading-none">Payments / Invoices <span className="text-[14px] text-slate-400">ⓘ</span></h1>
              <p className="mt-2 text-[10px] text-slate-300">View and manage job costing invoices, payments, and transaction history.</p>
            </div>
            <div className="mt-6 flex gap-3 text-[10px]"><ActionButton>+ &nbsp; New Payment</ActionButton><ActionButton>⇧ &nbsp; Upload Payment</ActionButton><ActionButton>⇩ &nbsp; Export &nbsp;⌄</ActionButton></div>
          </section>
          <section className="grid h-[86px] grid-cols-5 gap-2">
            <PaymentKpi label="Total Invoiced" value="$812,450.75" detail="All time" icon="▧" tone="#147dff" />
            <PaymentKpi label="Total Paid" value="$623,315.20" detail="76.7% of invoiced" icon="▤" tone="#05ff5e" />
            <PaymentKpi label="Outstanding Balance" value="$189,135.55" detail="23.3% of invoiced" icon="♙" tone="#f59e0b" />
            <PaymentKpi label="Overdue Amount" value="$34,250.00" detail="4 invoices overdue" icon="△" tone="#ef4444" />
            <PaymentKpi label="Paid This Month" value="$48,650.00" detail="May 1 - May 18, 2025" icon="▣" tone="#8b5cf6" />
          </section>
          <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1fr_282px] gap-3">
            <div className="min-h-0 rounded border border-cyan-300/12 bg-[#061521]/92">
              <PaymentsTabs />
              <PaymentsFilters />
              <TransactionsTable />
            </div>
            <PaymentsRightRail />
          </section>
          <PaymentsFooter />
        </main>
      </div>
    </div>
  );
}

function PaymentsSidebar() {
  const groups = [["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Electrical Network", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]], ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters", "Devices"]], ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Firmware"]], ["JOB COSTING", ["Job Dashboard", "Rates & Tariffs", "Cost Centers", "Budgets", "Payments"]]];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-3"><div className="text-[29px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[8px]">{groups.map(([title,items])=><section key={String(title)}><h2 className="mb-1 text-[#05ff5e]">{title}</h2>{(items as string[]).map(item=><div className={item==="Payments" ? "flex h-[20px] items-center rounded bg-[#063b27] px-1.5 text-[#05ff5e]" : "flex h-[20px] items-center rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; {item}{item==="Alarms & Events"?<b className="ml-auto grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">3</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[44px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function PaymentsTopbar() {
  return <header className="flex h-[48px] items-center justify-between border-b border-cyan-300/10"><div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[154px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[198px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">May 11 - May 18, 2025<br/><span className="text-[8px] text-slate-400">Custom</span></button><span className="text-[#05ff5e]">● Live</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-slate-100">{children}</button>;
}

function PaymentKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className="grid grid-cols-[42px_1fr] items-center gap-3 rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><span className="grid size-9 place-items-center rounded-full border text-lg" style={{borderColor:tone,color:tone}}>{icon}</span><span><div className="text-[8px] text-slate-400">{label}</div><div className="mt-1 text-[19px] leading-none">{value}</div><div className="mt-2 text-[8px]" style={{color:tone}}>{detail}</div></span></article>;
}

function PaymentsTabs() {
  return <div className="flex h-[38px] items-end gap-7 border-b border-cyan-300/12 px-3 text-[9px]"><span className="border-b-2 border-[#05ff5e] pb-3 text-slate-100">All Transactions</span><span className="pb-3 text-slate-400">Payment History</span></div>;
}

function PaymentsFilters() {
  return <div className="grid h-[56px] grid-cols-[98px_120px_120px_98px_132px_132px_1fr_76px] gap-2 px-3 py-2 text-[8px]"><Filter value="All Sites⌄" label="" /><Filter value="All Cost Centers⌄" label="" /><Filter value="All Statuses⌄" label="" /><Filter value="All Types⌄" label="" /><Filter value="Apr 11, 2025" label="From" /><Filter value="May 18, 2035" label="To" /><Filter value="Search invoices, payments..." label="" /><button className="mt-[14px] rounded border border-cyan-300/12 bg-[#061421]">▽ Filters</button></div>;
}

function Filter({ label, value }: { label: string; value: string }) {
  return <label><div className="h-[12px] text-slate-400">{label}</div><div className="h-7 rounded border border-cyan-300/12 bg-[#03101b] px-2 py-2 text-slate-300">{value}</div></label>;
}

function TransactionsTable() {
  return <div className="h-[548px] overflow-hidden px-3 text-[7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Type","Invoice / Payment #","Site / Location","Cost Center","Invoice Date","Due Date","Amount","Paid Amount","Balance","Status","Actions"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{transactions.map(row=><tr className="border-t border-white/5" key={row[1]}><td className="py-[10px]"><span className={row[0]==="Payment"?"rounded bg-green-500/20 px-2 py-0.5 text-[#05ff5e]":"rounded bg-blue-500/20 px-2 py-0.5 text-[#38bdf8]"}>{row[0]}</span></td><td className="py-[10px] text-[#05bfff]">{row[1]}</td><td className="py-[10px]">{row[2]}</td><td className="py-[10px]">{row[3]}</td><td className="py-[10px]">{row[4]}</td><td className="py-[10px]">{row[5]}</td><td className={row[6].startsWith("-")?"py-[10px] text-[#05ff5e]":"py-[10px]"}>{row[6]}</td><td className={row[7].startsWith("-")?"py-[10px] text-[#05ff5e]":"py-[10px]"}>{row[7]}</td><td className="py-[10px]">{row[8]}</td><td className="py-[10px]"><PaymentStatus status={row[9]} /></td><td className="py-[10px]">⋮</td></tr>)}</tbody></table><div className="mt-3 flex items-center justify-between text-[9px] text-slate-400"><span>Show <b className="rounded border border-cyan-300/12 px-3 py-1 text-white">15</b> per page</span><span className="space-x-2"><b className="rounded border border-cyan-300/12 px-2 py-1">‹</b><b className="rounded bg-[#147dff] px-2 py-1 text-white">1</b><b className="rounded border border-cyan-300/12 px-2 py-1">2</b><b className="rounded border border-cyan-300/12 px-2 py-1">3</b><b className="rounded border border-cyan-300/12 px-2 py-1">4</b><b className="rounded border border-cyan-300/12 px-2 py-1">5</b><b className="rounded border border-cyan-300/12 px-2 py-1">›</b></span><span>1-15 of 68 &nbsp; › &nbsp; ↻</span></div></div>;
}

function PaymentStatus({ status }: { status: string }) {
  const cls = status.includes("Due") ? "bg-blue-500/20 text-blue-400" : status === "Paid" ? "bg-green-500/20 text-[#05ff5e]" : status === "Overdue" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400";
  return <span className={`rounded px-2 py-0.5 ${cls}`}>{status}</span>;
}

function PaymentsRightRail() {
  return <aside className="flex h-full min-h-0 flex-col gap-2"><Panel title="Aging Summary"><AgingDonut /></Panel><Panel title="Payment Summary (This Month)"><div className="space-y-4 text-[9px]"><Metric label="Payments Made" value="$48,650.00" /><Metric label="Invoices Issued" value="$66,990.00" /><Metric label="Net Payments" value="-$18,340.00" red /><div className="pt-3 text-center text-[#05bfff]">View Payment History →</div></div></Panel><Panel className="flex-1" title={<span className="flex justify-between">Top Cost Centers (Outstanding Balance) <b className="text-[#05bfff]">View All</b></span>}><CostCenterBars /></Panel></aside>;
}

function Panel({ children, className = "", title }: { children: React.ReactNode; className?: string; title: React.ReactNode }) {
  return <section className={`rounded border border-cyan-300/12 bg-[#061521]/92 p-3 ${className}`}><h3 className="mb-3 text-[11px] font-semibold">{title}</h3>{children}</section>;
}

function AgingDonut() {
  return <div className="grid grid-cols-[132px_1fr] items-center gap-2 text-[8px]"><div className="relative size-[118px]"><svg className="size-[118px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="125 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="37 214" strokeDashoffset="-125" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="14 214" strokeDashoffset="-162" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#ef4444" strokeDasharray="39 214" strokeDashoffset="-176" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[17px]">$189,135.55</b><br/>Outstanding</span></div></div><div className="space-y-3">{[["Current (0-30 days)","$109,885.55 (58.1%)","#147dff"],["31-60 days","$32,500.00 (17.2%)","#05b82e"],["61-90 days","$12,750.00 (6.7%)","#f59e0b"],["90+ days","$34,000.00 (18.0%)","#ef4444"]].map(([l,v,c])=><div key={l}><b style={{color:c}}>●</b> {l}<br/><span>{v}</span></div>)}</div></div>;
}

function Metric({ label, red, value }: { label: string; red?: boolean; value: string }) {
  return <div className="flex justify-between"><span>{label}</span><span className={red ? "text-red-400" : ""}>{value}</span></div>;
}

function CostCenterBars() {
  const rows = [["CC-210 - Assembly","$82,340.00","92%"],["CC-220 - Assembly","$52,250.00","58%"],["CC-320 - Facilities","$21,750.00","28%"],["CC-410 - Logistics","$16,250.00","20%"],["CC-610 - Engineering","$9,300.00","6%"]];
  return <div className="space-y-4 text-[8px]">{rows.map(([l,v,w])=><div className="grid grid-cols-[92px_1fr_58px] items-center gap-2" key={l}><span>{l}</span><span className="h-2 rounded bg-white/5"><i className="block h-2 rounded bg-[#147dff]" style={{width:w}} /></span><span>{v}</span></div>)}</div>;
}

function PaymentsFooter() {
  return <footer className="flex h-[34px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-9 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: May 18, 2025 10:15 AM CDT <b className="ml-4 text-[#05ff5e]">▥ Live</b></span></footer>;
}
