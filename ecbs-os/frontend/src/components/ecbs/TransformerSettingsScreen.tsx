import type { ReactNode } from "react";

const infoFields = [
  ["Transformer Name", "Main Transformer", true],
  ["Transformer ID", "TXFR-01", false],
  ["Location", "Main Electrical Room", false],
  ["Manufacturer", "Schneider Electric", false],
  ["Model", "Trihal 1500", false],
  ["Serial Number", "SE1500-4827-001", false],
  ["Rating (kVA)", "1500", false, "kVA"],
  ["Primary Voltage (L-L)", "13.2", false, "kV"],
  ["Secondary Voltage (L-L)", "480", false, "V"],
  ["Connection", "Delta - Wye", false, "⌄"],
  ["Frequency", "60", false, "Hz"],
  ["Phase", "3 Phase", false, "⌄"],
  ["Impedance (%)", "5.75", false, "%"],
  ["Transformer Type", "Dry Type", false, "⌄"],
  ["Cooling Type", "AN (Air Natural)", false, "⌄"],
  ["Install Date", "Jan 15, 2018", false, "▣"],
  ["Commission Date", "Jan 20, 2018", false, "▣"],
];

const operatingLeft = [
  ["Target Power Factor", "0.98", "Leading"],
  ["Load Optimization Mode", "Auto (PF + Balance)", "⌄"],
  ["Max Loading Limit", "90", "%"],
  ["Tap Change", "Automatic", "⌄"],
];

const operatingToggles = [
  ["Enable Load Balancing", true],
  ["Enable Harmonic Mitigation", true],
  ["Enable Temperature Derating", true],
  ["Enable Energy Loss Tracking", true],
  ["Tap Change Deadband", "1.0", "%"],
];

const statusRows = [
  ["Health Status", "Good", "●"],
  ["Last Communication", "May 18, 2025 10:14 AM", "◴"],
  ["Uptime", "27d 14h 32m", "↻"],
  ["Temperature", "62 °C", "♨"],
  ["Loading", "68% (1,023 kVA)", "⌁"],
  ["Oil Temperature", "N/A (Dry Type)", "♨"],
];

const tapRows = [
  ["1", "456 V (-5.0%)"],
  ["2", "468 V (-2.5%)"],
  ["3", "480 V (0%)"],
  ["4", "492 V (+2.5%)"],
  ["5", "504 V (+5.0%)"],
];

function EnterpriseAdminSourceMissing({ message = "source_missing: Enterprise report/site/transformer backend source or artifact store is not wired for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="rounded border border-cyan-300/12 bg-[#061521]/92 px-4 py-2 text-[10px] text-slate-300">
      <b className="text-[#05ff5e]">No Data</b> - {message}
    </div>
  );
}

export function TransformerSettingsScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[150px_1fr]">
        <TransformerSettingsSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <TransformerTopbar />
          <EnterpriseAdminSourceMissing />
          <section className="flex h-[96px] items-start justify-between pt-3">
            <div>
              <div className="text-[10px] text-slate-300">Clients &nbsp; &gt; &nbsp; Flex Ltd. &nbsp; &gt; &nbsp; Projects &nbsp; &gt; &nbsp; Flex Tijuana Manufacturing &nbsp; &gt; &nbsp; Transformers &nbsp; &gt; &nbsp; <span className="text-white">Transformer Settings</span></div>
              <h1 className="mt-4 text-[24px] font-semibold leading-none">Transformer Settings</h1>
              <p className="mt-2 text-[10px] text-slate-200">Configure transformer parameters, monitoring thresholds, and alert settings.</p>
            </div>
            <div className="mt-5 flex gap-4 text-[11px]">
              <button className="rounded border border-cyan-300/20 bg-[#061421] px-7 py-2.5">← &nbsp; Back to Transformer</button>
              <button className="rounded border border-cyan-300/20 bg-[#061421] px-7 py-2.5">Reset to Defaults</button>
              <button className="rounded bg-[#1463df] px-9 py-2.5">▧ &nbsp; Save Settings</button>
            </div>
          </section>
          <section className="grid h-[722px] grid-cols-[1.18fr_0.96fr] gap-3">
            <div className="min-h-0">
              <Tabs />
              <DarkCard className="mt-2 h-[424px]" title="Transformer Information">
                <TransformerInfo />
              </DarkCard>
              <DarkCard className="mt-3 h-[236px]" title="Operating Settings">
                <OperatingSettings />
              </DarkCard>
            </div>
            <div className="min-h-0">
              <DarkCard className="h-[246px]" title="Transformer Status" action={<span className="rounded border border-[#05ff5e]/50 px-2 py-1 text-[#05ff5e]">Online</span>}>
                <TransformerStatus />
              </DarkCard>
              <DarkCard className="mt-3 h-[228px]" title="Tap Settings">
                <TapSettings />
              </DarkCard>
              <DarkCard className="mt-3 h-[204px]" title="Transformer Loading Trend (kVA)" action={<span className="rounded border border-cyan-300/12 px-3 py-1">7 Days ⌄</span>}>
                <LoadingTrend />
              </DarkCard>
            </div>
          </section>
          <Footer />
        </main>
      </div>
    </div>
  );
}

function Tabs() {
  return <div className="grid h-[42px] grid-cols-5 overflow-hidden rounded border border-cyan-300/12 bg-[#061521]/92 text-[10px]">{["General Settings","Monitoring & Thresholds","Alarms","Communication","Maintenance"].map((tab)=><span className={tab==="General Settings"?"grid place-items-center border-b-2 border-[#147dff] bg-[#0a2740] text-white":"grid place-items-center border-l border-cyan-300/10 text-slate-300"} key={tab}>{tab}</span>)}</div>;
}

function TransformerInfo() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-x-5 gap-y-2.5">
        {infoFields.map(([label, value, required, suffix]) => <Field key={String(label)} label={String(label)} required={Boolean(required)} suffix={suffix ? String(suffix) : undefined} value={String(value)} />)}
      </div>
      <label className="mt-2 block text-[10px] text-slate-300">Notes<div className="mt-1 h-[38px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-slate-200">Main facility transformer supplying all production and facility loads.<span className="float-right mt-3 text-[8px] text-slate-500">63 / 500</span></div></label>
    </div>
  );
}

function Field({ label, required, suffix, value }: { label: string; required?: boolean; suffix?: string; value: string }) {
  return <label className="block text-[9.5px] text-slate-300"><span>{label} {required ? <b className="text-red-500">*</b> : null}</span><div className="mt-1 grid h-7 grid-cols-[1fr_auto] overflow-hidden rounded border border-cyan-300/12 bg-[#061421] text-slate-200"><span className="px-3 py-1.5">{value}</span>{suffix ? <span className="border-l border-cyan-300/12 px-3 py-1.5 text-slate-300">{suffix}</span> : null}</div></label>;
}

function OperatingSettings() {
  return (
    <div className="grid h-full grid-cols-2 grid-rows-[1fr_48px] gap-x-7 gap-y-2 text-[9.8px]">
      <div className="space-y-2">
        {operatingLeft.map(([label,value,suffix])=><OpField key={label} label={label} suffix={suffix} value={value} />)}
      </div>
      <div className="space-y-2.5 pt-1">
        {operatingToggles.map(([label,value])=>typeof value==="boolean"?<div className="flex items-center justify-between" key={String(label)}><span>{label}</span><Toggle on={value} /></div>:<OpField key={String(label)} label={String(label)} suffix="%" value={String(value)} />)}
      </div>
      <div className="col-span-2 grid h-[48px] grid-cols-3 rounded border border-cyan-300/12 bg-[#061421] text-center text-[9.5px]">
        <MetricBadge color="#f59e0b" label="Current Load" value="68% (1,023 kVA)" />
        <MetricBadge color="#05ff5e" label="Current PF" value="0.98 Leading" />
        <MetricBadge color="#ef4444" label="Current Temperature" value="62 °C (Normal)" />
      </div>
    </div>
  );
}

function TransformerStatus() {
  return (
    <div className="grid h-full grid-cols-[270px_1fr] gap-4">
      <TransformerPhoto />
      <div className="space-y-3 text-[10px]">
        {statusRows.map(([label,value,icon],index)=><div className="grid grid-cols-[18px_1fr_auto] items-center border-b border-cyan-300/8 pb-1.5" key={label}><span>{icon}</span><span>{label}</span><b className={index===0||index===4?"text-[#05ff5e]":"text-slate-200"}>{value}</b></div>)}
      </div>
    </div>
  );
}

function OpField({ label, suffix, value }: { label: string; suffix?: string; value: string }) {
  return <label className="block text-[8.8px] text-slate-300"><span>{label}</span><div className="mt-0.5 grid h-6 grid-cols-[1fr_auto] overflow-hidden rounded border border-cyan-300/12 bg-[#061421] text-slate-200"><span className="px-3 py-1">{value}</span>{suffix ? <span className="border-l border-cyan-300/12 px-3 py-1 text-slate-300">{suffix}</span> : null}</div></label>;
}

function TransformerPhoto() {
  return <div className="h-[190px] rounded bg-[linear-gradient(90deg,#c5c1b7_0_16%,#646967_17%_29%,#bbb8ad_30%_47%,#54595b_48%_55%,#aaa69b_56%_100%)] p-4 shadow-inner"><div className="ml-20 mt-4 h-[150px] w-[88px] rounded bg-[#85817b] shadow-xl" /><div className="-mt-[132px] ml-[138px] h-[130px] w-[70px] rounded bg-[#7a7772] shadow-lg" /></div>;
}

function TapSettings() {
  return (
    <div className="grid h-full grid-cols-[132px_1fr] gap-5 text-[10px]">
      <div>
        <div className="text-slate-400">Current Tap Position</div>
        <div className="mt-3 text-[36px] font-light leading-none">3 <span className="text-[12px] text-slate-400">of 17</span></div>
        <div className="mt-6 flex gap-3"><button className="h-8 w-14 rounded border border-[#147dff] text-[#147dff]">−</button><button className="h-8 w-14 rounded border border-[#147dff] text-[#147dff]">＋</button></div>
        <div className="mt-12 grid grid-cols-3 gap-4 text-[11px]"><b>Voltage Regulation<br/><span className="text-[16px]">±2.5%</span></b><b>Step Voltage<br/><span className="text-[16px]">12 V (2.5%)</span></b><b>Tap Changer<br/><span className="text-[16px]">On-Load</span></b></div>
      </div>
      <div>
        <table className="w-full text-left"><thead className="text-slate-400"><tr><th className="pb-2">Tap Position</th><th className="pb-2">Secondary Voltage (L-L)</th></tr></thead><tbody>{tapRows.map(([pos,voltage])=><tr className={pos==="3"?"bg-[#0a2740]":"border-t border-cyan-300/8"} key={pos}><td className="py-2 pl-3">{pos}</td><td className="py-2">{voltage}</td></tr>)}</tbody></table>
        <div className="absolute right-7 top-[410px] h-[102px] w-1 rounded bg-slate-500" />
      </div>
    </div>
  );
}

function LoadingTrend() {
  return (
    <div className="relative h-[156px] px-3 pt-2 text-[9px] text-slate-400">
      {[2000,1500,1000,500,0].map((v,i)=><div className="absolute left-0 right-0 border-t border-cyan-300/8" key={v} style={{top: 12 + i*28}}><span className="absolute -top-2 left-0">{v.toLocaleString()}</span></div>)}
      <svg className="absolute left-48 right-8 top-8 h-[96px] w-[360px]" viewBox="0 0 360 96">
        <polyline fill="none" points="0,34 20,38 40,32 60,36 80,24 100,28 120,44 140,36 160,35 180,45 200,42 220,30 240,35 260,38 280,31 300,36 320,42 340,39 360,28" stroke="#05ff5e" strokeWidth="3" />
        <line stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="2" x1="0" x2="360" y1="10" y2="10" />
      </svg>
      <div className="absolute bottom-5 left-20 right-8 flex justify-between">{["May 12","May 13","May 14","May 15","May 16","May 17","May 18"].map(d=><span key={d}>{d}</span>)}</div>
      <div className="absolute bottom-0 left-48 flex gap-8 text-[10px]"><span className="text-[#05ff5e]">→ Apparent Power (kVA)</span><span className="text-[#f59e0b]">→ Max Rating (1,500 kVA)</span></div>
    </div>
  );
}

function DarkCard({ action, children, className = "", title }: { action?: ReactNode; children: ReactNode; className?: string; title: string }) {
  return <article className={`relative min-h-0 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4 ${className}`}><div className="mb-3 flex items-center justify-between"><h2 className="text-[13px] font-semibold">{title}</h2>{action ? <span className="text-[10px]">{action}</span> : null}</div>{children}</article>;
}

function Toggle({ on }: { on: boolean }) {
  return <span className={`relative h-5 w-9 rounded-full ${on?"bg-[#16a34a]":"bg-slate-600"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white ${on?"right-0.5":"left-0.5"}`} /></span>;
}

function MetricBadge({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="grid grid-cols-[38px_1fr] items-center border-r border-cyan-300/10 last:border-r-0"><span className="mx-auto grid size-8 place-items-center rounded-full border text-[16px]" style={{borderColor:color,color}}>⌁</span><span className="text-left"><span className="text-slate-400">{label}</span><br/><b>{value}</b></span></div>;
}

function TransformerTopbar() {
  return <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10"><div className="text-[13px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div><div className="flex items-center gap-4 text-[10px]"><button className="w-[150px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left"><span className="text-[7px] text-slate-400">Client</span><br/>Flex Ltd.</button><button className="w-[220px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 18, 2025 10:15 AM CDT</button><span className="text-[#05ff5e]">source_missing</span><span className="relative text-lg">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b></span><span>?</span><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">JS</span><span>John Smith<br/><span className="text-slate-500">OEM Admin</span></span><span>⌄</span></div></header>;
}

function TransformerSettingsSidebar() {
  const sections = [
    ["ENTERPRISE", ["Enterprise Dashboard", "Energy Dashboard", "Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast", "Alarms & Events", "Reports"]],
    ["DEVICES", ["Gateways", "Meters", "Switches", "Repeaters"]],
    ["ADMINISTRATION", ["Users & Roles", "Account Settings", "Integrations", "Billing"]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4 border-b border-white/8 pb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#05ff5e]">Energy</div></div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>{title==="DEVICES"?"⌃":""}</span></h2>{(items as string[]).map(item=><div className={item==="Transformers"?"flex h-[23px] items-center justify-between rounded bg-[#063b27] px-1.5 text-[#05ff5e]":"flex h-[23px] items-center justify-between rounded px-1.5 text-slate-300"} key={item}>⌘ &nbsp; <span className="mr-auto">{item}</span>{item==="Alarms & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[84px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[8px]"><div>XECO Current<br/>Balance Index™</div><div className="text-[34px] leading-none text-[#65a30d]">No Data</div><div className="text-[#05ff5e]">source_missing</div><div className="mt-3 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-[36px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-2 text-[8px]"><div className="text-white">☏ Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-2 left-3 right-3 text-[7px] text-slate-500">© 2025 XECO Energy Corporation.</div></aside>;
}

function Footer() {
  return <footer className="absolute bottom-2 left-4 right-4 flex h-[26px] items-center justify-between text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-12 text-[#05ff5e]"><span>Privacy Policy</span><span>Terms of Service</span><span>Support</span></span><span>Data updated: source_missing <b className="ml-5 text-[#05ff5e]">▥ Live</b></span></footer>;
}
