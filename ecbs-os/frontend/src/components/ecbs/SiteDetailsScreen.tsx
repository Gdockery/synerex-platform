import type { ReactNode } from "react";

const facilityRows = [
  ["▣", "Site Name", "Flex Tijuana Manufacturing"],
  ["⌖", "Address", "1234 Industrial Way\nTijuana, Baja California, Mexico 22444"],
  ["◴", "Time Zone", "America/Mexico_Tijuana (PDT)"],
  ["▦", "Facility Type", "Manufacturing"],
  ["▥", "Industry", "Electronics Manufacturing"],
  ["▤", "Building Size", "250,000 sq ft"],
  ["▣", "Year Built", "2018"],
  ["⊙", "Operating Schedule", "24/7 Operations"],
  ["▤", "Notes", "Main manufacturing facility with SMT lines,\nassembly, and test operations."],
];

const electricalRows = [
  ["Utility", "CFE - GDMTH (Medium Voltage)"],
  ["Service Voltage", "13,200 V"],
  ["Service Type", "3 Phase, 4 Wire"],
  ["Main Service", "13.2 kV, 1200A"],
  ["Main Transformer", "1500 kVA, 13.2kV - 480Y/277V"],
  ["Main Switchboard", "1200A, 480Y/277V, 3Ø, 4W"],
  ["Power Factor (Avg.)", "0.98 Lagging"],
  ["Peak Demand (Baseline)", "1,250 kW"],
  ["Total Connected Load", "3.2 MW"],
  ["Target Power Factor", "0.95"],
  ["THD (Current)", "4.1%"],
  ["Date of Last Assessment", "May 05, 2025"],
];

const deviceSummary = [
  ["Gateways", "1", "Online", "#147dff"],
  ["Meters", "4", "Online", "#16a34a"],
  ["Switches", "6", "Online", "#7c3aed"],
  ["Active Power Filters", "2", "Online", "#f97316"],
  ["Repeaters", "3", "Online", "#06b6d4"],
];

const meterRows = [
  ["Main Meter-01", "Power Quality Meter", "Main Switchboard", "Online", "10:15:08 AM", "▂▃▅▇"],
  ["Panel A Meter-01", "Power Meter", "Panel A (SMT Line 1)", "Online", "10:15:10 AM", "▂▃▆▇"],
  ["Panel B Meter-01", "Power Meter", "Panel B (Assembly)", "Online", "10:15:07 AM", "▂▄▅▇"],
  ["Panel C Meter-01", "Power Meter", "Panel C (Test Area)", "Online", "10:15:11 AM", "▂▃▅▇"],
];

const performanceRows = [
  ["↯", "Total Real Power (kW)", "1,063 kW"],
  ["⊙", "Total Apparent Power (kVA)", "1,250 kVA"],
  ["⌁", "Power Factor", "0.98 Lagging"],
  ["△", "Total Harmonic Distortion (THD)", "4.1%"],
  ["◉", "System Frequency", "59.98 Hz"],
  ["◎", "System Load", "85%"],
];

const contacts = [
  ["Primary Contact", "AR", "Alejandro Ramirez", "Facilities Manager", "+52 664 123 4567", "alejandro.ramirez@flex.com"],
  ["Technical Contact", "MC", "Miguel Contreras", "Maintenance Engineer", "+52 664 234 5678", "miguel.contreras@flex.com"],
  ["Utility Contact", "JS", "Jose Sanchez", "Account Manager - CFE", "+52 664 345 6789", "jose.sanchez@cfe.mx"],
];

const documents = [
  ["▣", "One-Line Drawing", "Rev 1.0", "May 05, 2025", "PDF", "1.2 MB"],
  ["▣", "Utility Bill (May 2025)", "", "May 05, 2025", "PDF", "0.8 MB"],
  ["▣", "Site Assessment Report", "", "May 05, 2025", "PDF", "2.4 MB"],
  ["▣", "Proposal", "", "May 05, 2025", "PDF", "1.1 MB"],
  ["▣", "Electrical Photos", "", "May 05, 2025", "ZIP", "15.6 MB"],
];

const timeline = [
  ["May 05, 2025\n09:30 AM", "Site Assessment Completed", "Assessment report generated"],
  ["May 05, 2025\n10:15 AM", "Proposal Generated", "Energy optimization proposal ready"],
  ["May 06, 2025\n08:00 AM", "Deployment Scheduled", "Installation window: May 20 - May 24, 2025"],
  ["May 18, 2025\n10:15 AM", "System Online", "All devices reporting normally"],
];

const settings = [
  ["Auto Refresh (Live Data)", "10 sec"],
  ["Data Retention", "13 Months"],
  ["Alerts Enabled", "Yes"],
  ["Email Notifications", "Enabled"],
  ["Demand Threshold Alert", "1,100 kW"],
  ["PF Threshold Alert", "Below 0.90"],
];

function EnterpriseAdminSourceMissing({ message = "source_missing: Enterprise report/site/transformer backend source or artifact store is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function SiteDetailsScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[150px_1fr]">
        <SiteDetailsSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <SiteDetailsTopbar />
          <EnterpriseAdminSourceMissing />
          <section className="flex h-[82px] items-start justify-between pt-3">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects &nbsp; &gt; &nbsp; Flex Tijuana Manufacturing &nbsp; &gt; &nbsp; <span className="text-white">Site Details</span></div>
              <h1 className="mt-3 text-[24px] font-semibold leading-none">Site Details</h1>
              <p className="mt-2 text-[10px] text-slate-200">Detailed information about this facility and its electrical system.</p>
            </div>
            <div className="mt-5 flex gap-4 text-[11px]">
              <button className="rounded border border-cyan-300/20 bg-[#061421] px-7 py-2.5">← &nbsp; Back to Site Dashboard</button>
              <button className="rounded bg-[#2554b8] px-9 py-2.5">✎ &nbsp; Edit Site</button>
            </div>
          </section>
          <section className="grid h-[276px] grid-cols-[0.9fr_1.03fr_1.18fr] gap-2.5">
            <WhiteCard title="Facility Information">
              <IconRows rows={facilityRows} />
            </WhiteCard>
            <WhiteCard action="View Full One-Line →" title="Electrical System Summary">
              <SimpleRows rows={electricalRows} />
            </WhiteCard>
            <WhiteCard title="Site Image">
              <SiteImageGallery />
            </WhiteCard>
          </section>
          <section className="mt-2.5 grid h-[272px] grid-cols-[1.46fr_0.68fr_0.94fr] gap-2.5">
            <WhiteCard title="Installed Devices Summary">
              <DeviceAndMeters />
            </WhiteCard>
            <WhiteCard action="View Live Data →" title="Key Performance (Current)">
              <Performance />
            </WhiteCard>
            <WhiteCard action="Edit Contacts →" title="Site Contacts">
              <Contacts />
            </WhiteCard>
          </section>
          <section className="mt-2.5 grid h-[168px] grid-cols-[1.04fr_0.92fr_0.92fr] gap-2.5">
            <WhiteCard action="View All Documents →" title="Site Documents">
              <Documents />
            </WhiteCard>
            <WhiteCard action="View All Activities →" title="Site Timeline">
              <Timeline />
            </WhiteCard>
            <WhiteCard action="Edit Settings →" title="Site Settings">
              <Settings />
            </WhiteCard>
          </section>
          <footer className="absolute bottom-2 left-4 right-4 flex h-[26px] items-center justify-between text-[9px] text-slate-500">
            <span>© 2025 XECO Energy Corporation. All rights reserved.</span>
            <span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span>
            <span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function WhiteCard({ action, children, title }: { action?: string; children: ReactNode; title: string }) {
  return (
    <article className="min-h-0 overflow-hidden rounded-lg bg-white p-3 text-slate-900 shadow-[0_12px_28px_rgba(0,0,0,.22)]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {action ? <span className="text-[10px] font-semibold text-[#147dff]">{action}</span> : null}
      </div>
      {children}
    </article>
  );
}

function IconRows({ rows }: { rows: string[][] }) {
  return <div className="space-y-1.5 text-[8.5px] leading-tight">{rows.map(([icon,label,value])=><div className="grid grid-cols-[20px_82px_1fr] gap-2" key={label}><span className="text-[14px] text-[#147dff]">{icon}</span><span className="text-slate-500">{label}</span><span className="whitespace-pre-line font-medium">{value}</span></div>)}</div>;
}

function SimpleRows({ rows }: { rows: string[][] }) {
  return <div className="text-[8.2px]">{rows.map(([label,value])=><div className="grid grid-cols-[144px_1fr] border-b border-slate-200 py-[2.8px]" key={label}><span className="text-slate-600">{label}</span><b>{value}</b></div>)}</div>;
}

function SiteImageGallery() {
  return (
    <div>
      <div className="h-[170px] rounded bg-[linear-gradient(145deg,#b7ddff_0_36%,#d8d7ca_37%_56%,#72828e_57%_58%,#e7edf3_59%)] p-4">
        <div className="mt-[74px] h-[54px] rounded-sm bg-white/85 shadow-lg">
          <div className="px-8 pt-4 text-[20px] font-bold text-sky-500">flex</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[20px_repeat(4,1fr)_20px] items-center gap-2">
        <span className="text-center text-slate-400">‹</span>
        {[0,1,2,3].map((item)=><div className="h-[34px] rounded border border-slate-200 bg-[linear-gradient(145deg,#b7ddff,#f6f8fa_48%,#8b99a6)]" key={item} />)}
        <span className="text-center text-slate-400">›</span>
      </div>
    </div>
  );
}

function DeviceAndMeters() {
  return (
    <div className="text-[9px]">
      <div className="grid grid-cols-5 gap-2">
        {deviceSummary.map(([label,value,state,color])=><div className="rounded border border-slate-200 p-1.5" key={label}><div className="text-[14px]" style={{color}}>⌘</div><div className="text-slate-500">{label}</div><b className="text-[16px] leading-none">{value}</b><div className="text-[#16a34a]">● {state}</div></div>)}
      </div>
      <div className="mt-3 flex justify-between"><h3 className="text-[12px] font-semibold">Meters Overview</h3><span className="font-semibold text-[#147dff]">View All Meters →</span></div>
      <table className="mt-1.5 w-full text-left text-[8px]"><thead className="text-slate-500"><tr>{["Meter Name","Type","Location","Status","Last Reading","Signal Strength"].map(h=><th className="border-b border-slate-200 pb-1" key={h}>{h}</th>)}</tr></thead><tbody>{meterRows.map(row=><tr className="border-b border-slate-100" key={row[0]}>{row.map((cell,i)=><td className={i===5?"py-1 text-[16px] leading-none text-[#16a34a]":"py-1"} key={`${row[0]}-${i}`}>{i===3?<><span className="text-[#16a34a]">●</span> {cell}</>:cell}</td>)}</tr>)}</tbody></table>
      <div className="mt-2 font-semibold text-[#147dff]">View All Meters →</div>
    </div>
  );
}

function Performance() {
  return <div className="space-y-2.5 text-[9.5px]">{performanceRows.map(([icon,label,value],index)=><div key={label}><div className="grid grid-cols-[22px_1fr_80px] items-center gap-2"><span className="text-[16px] text-[#147dff]">{icon}</span><span>{label}</span><b className="text-right">{value}</b></div>{index===5?<div className="ml-8 mt-1.5 h-1.5 rounded-full bg-slate-200"><div className="h-full w-[85%] rounded-full bg-[#147dff]" /></div>:null}</div>)}</div>;
}

function Contacts() {
  return <div className="space-y-2 text-[8.2px]">{contacts.map(([role,initials,name,title,phone,email])=><div className="border-b border-slate-200 pb-1.5" key={role}><div className="mb-1 font-semibold">{role}</div><div className="grid grid-cols-[34px_1fr] gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#1e5dbb] text-[11px] font-semibold text-white">{initials}</span><span><b>{name}</b><br/><span className="text-slate-600">{title}</span><br/><span>{phone}</span><br/><span className="text-[#147dff]">{email}</span></span></div></div>)}</div>;
}

function Documents() {
  return <div className="space-y-1.5 text-[8.2px]">{documents.map(([icon,name,rev,date,type,size])=><div className="grid grid-cols-[20px_1fr_48px_66px_32px_40px] items-center gap-2" key={name}><span className={name==="Site Assessment Report"?"text-red-500":"text-[#147dff]"}>{icon}</span><b>{name}</b><span>{rev}</span><span>{date}</span><span>{type}</span><span>{size}</span></div>)}</div>;
}

function Timeline() {
  return <div className="space-y-1.5 text-[8px]">{timeline.map(([time,title,detail])=><div className="grid grid-cols-[74px_14px_1fr] gap-2" key={title}><span className="whitespace-pre-line text-slate-600">{time}</span><span className="relative pt-1"><span className="grid size-2 rounded-full bg-[#05ff5e]" /></span><span><b>{title}</b><br/><span className="text-slate-600">{detail}</span></span></div>)}</div>;
}

function Settings() {
  return <div className="space-y-2 text-[8.4px]">{settings.map(([label,value])=><div className="grid grid-cols-[1fr_76px] items-center" key={label}><span><span className="mr-2 text-slate-500">◉</span>{label}</span><b>{value}</b></div>)}</div>;
}

function SiteDetailsTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 18, 2025 10:15 AM CDT</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function SiteDetailsSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Billing"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="DEVICES"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className={item==="Sites"?"flex h-[23px] items-center justify-between rounded bg-[#063b27] px-1.5 text-[#05ff5e]":"flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[84px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[36px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}
