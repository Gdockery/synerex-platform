import type { ReactNode } from "react";

const siteInfo = [
  ["Client", "Flex Ltd."],
  ["Site Name", "Flex Tijuana Manufacturing"],
  ["Address", "1234 Industrial Way\nTijuana, Baja California, Mexico 22444"],
  ["Time Zone", "America/Mexico_City (PDT)"],
  ["Facility Type", "Manufacturing"],
  ["Operating Schedule", "24/7 Operations"],
];

const transformerInfo = [
  ["Transformer Name", "Main Transformer"],
  ["Transformer ID", "TXFR-01"],
  ["Manufacturer", "Schneider Electric"],
  ["Model", "Trihal 1500"],
  ["Serial Number", "SE1500-4827-001"],
  ["Rating (kVA)", "1500 kVA"],
  ["Primary Voltage (L-L)", "13.2 kV"],
  ["Secondary Voltage (L-L)", "480V/277V"],
  ["Impedance", "5.75%"],
  ["Location", "Main Electrical Room"],
  ["Install Date", "Jan 15, 2018"],
  ["Commission Date", "Jan 20, 2018"],
  ["Status", "● In Service"],
];

const summaryCards = [
  ["⌁", "Total Connected Load", "3.2 MW", "#147dff"],
  ["▣", "Total Demand (Live)", "1,063 kW", "#16a34a"],
  ["⌾", "Power Factor (Avg.)", "0.98", "#f59e0b"],
  ["⌁", "Total Harmonic Distortion (THD)", "4.1%", "#7c3aed"],
  ["◴", "Capacity Utilization", "68%", "#65a30d"],
];

const performanceRows = [
  ["Apparent Power (kVA)", "1,250", "980", "1,485", "kVA", "● Normal"],
  ["Real Power (kW)", "1,063", "820", "1,312", "kW", "● Normal"],
  ["Power Factor (Avg.)", "0.98", "0.95", "0.99", "pf", "● Normal"],
  ["Current (Primary)", "52.6", "41.3", "61.8", "A", "● Normal"],
  ["Current (Secondary)", "1,265", "992", "1,510", "A", "● Normal"],
  ["Temperature (Top Oil)", "62", "54", "68", "°C", "● Normal"],
  ["Temperature (Winding)", "65", "56", "70", "°C", "● Normal"],
  ["THD (Voltage)", "4.1%", "2.3%", "5.6%", "%", "● Normal"],
  ["THD (Current)", "6.2%", "3.1%", "7.8%", "%", "● Normal"],
];

const alarms = [
  ["May 14, 2025 08:12 AM", "⚠ Warning", "Oil Temperature High", "Top oil temperature reached 68°C (threshold: 70°C)", "Cleared"],
  ["May 13, 2025 02:45 AM", "ⓘ Info", "Load Change", "Load increased to 1,248 kW", "Cleared"],
];

export function TransformerPdfReportScreen() {
  return (
    <div className="grid h-screen w-screen place-items-center overflow-hidden bg-[#111] text-slate-950">
      <main className="h-[900px] w-[600px] overflow-hidden rounded bg-white shadow-2xl">
        <div className="origin-top-left scale-[0.8] px-4 py-3" style={{ width: "125%" }}>
          <Header />
          <section className="mt-2 rounded border border-slate-300 p-2">
            <SectionTitle index="1" title="SITE & TRANSFORMER INFORMATION" />
            <div className="grid grid-cols-[1fr_1.18fr_1.15fr] gap-4">
              <InfoBlock rows={siteInfo} title="Site Information" />
              <InfoBlock rows={transformerInfo} title="Transformer Information" />
              <TransformerPhoto />
            </div>
          </section>
          <section className="mt-1.5 rounded border border-slate-300 p-2">
            <SectionTitle index="2" title="EXECUTIVE SUMMARY" />
            <div className="grid grid-cols-5 gap-2">
              {summaryCards.map(([icon, label, value, color]) => <SummaryCard color={color} icon={icon} key={label} label={label} value={value} />)}
            </div>
            <div className="mt-2 rounded border border-green-200 bg-green-50 p-2 text-[6.8px]">
              <b className="text-green-700">Key Findings</b><br />
              The transformer is operating within normal parameters. Power factor is excellent and load level is within recommended limits.<br />
              No critical alarms were detected during this reporting period.
            </div>
          </section>
          <section className="mt-1.5 grid grid-cols-[1.05fr_0.95fr] gap-1.5">
            <Panel title="3. PERFORMANCE SUMMARY (7 DAYS)">
              <PerformanceTable />
            </Panel>
            <Panel title="Transformer Loading Trend (kVA)" plainTitle>
              <LoadingTrend />
            </Panel>
          </section>
          <section className="mt-1.5 grid grid-cols-[1.05fr_0.95fr] gap-1.5">
            <Panel title="4. POWER QUALITY SUMMARY">
              <PowerQuality />
            </Panel>
            <Panel title="5. LOSS ANALYSIS (Estimated)">
              <LossAnalysis />
            </Panel>
          </section>
          <section className="mt-1.5 rounded border border-slate-300 p-2">
            <SectionTitle index="6" title="ALARMS & EVENTS SUMMARY" />
            <table className="w-full text-left text-[6.5px]">
              <thead><tr>{["Date/Time", "Severity", "Event", "Description", "Status"].map(h => <th className="border border-slate-200 bg-slate-50 px-1 py-1" key={h}>{h}</th>)}</tr></thead>
              <tbody>{alarms.map(row => <tr key={row[0]}>{row.map(cell => <td className="border border-slate-200 px-1 py-0.5" key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody>
            </table>
            <div className="mt-1 grid grid-cols-3 text-center text-[6.5px]"><span>Total Alarms: 2</span><span className="text-red-600">0 Critical</span><span><span className="text-amber-600">1 Warning</span> &nbsp; <span className="text-blue-600">1 Info</span></span></div>
          </section>
          <section className="mt-1.5 grid grid-cols-[1fr_0.95fr] gap-1.5">
            <Panel title="7. RECOMMENDATIONS">
              <ul className="ml-3 list-disc space-y-1 text-[6.7px]">
                <li>Continue routine monitoring of oil temperature and load levels.</li>
                <li>Transformer is operating efficiently. No corrective actions required at this time.</li>
                <li>Next preventive maintenance recommended on or before Jan 20, 2026.</li>
              </ul>
            </Panel>
            <section className="grid grid-cols-[1fr_0.9fr] gap-2 rounded border border-slate-300 p-2">
              <div className="text-center text-[6.8px]">
                <div className="mb-0.5">Report Approved By:</div>
                <div className="font-serif text-[18px] italic">John Smith</div>
                <div className="mx-auto mb-1 h-px w-32 bg-slate-500" />
                <b>John Smith</b><br />OEM Admin<br />May 18, 2025 &nbsp; 10:15 AM CDT
              </div>
              <div className="grid grid-cols-[34px_1fr] items-center gap-2 rounded bg-green-50 p-2 text-[6.5px]">
                <div className="grid size-8 place-items-center rounded-full border-2 border-green-600 text-[18px] text-green-600">✓</div>
                <div><b className="text-green-700">Report Data Verified</b><br />All data in this report is verified and accurate as of the report date and time.</div>
              </div>
            </section>
          </section>
          <Footer />
        </div>
      </main>
    </div>
  );
}

function Header() {
  return <header className="grid grid-cols-[150px_1fr_210px] items-start gap-3"><div><div className="text-[34px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#16a34a]">X</span>ECO</div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.5em] text-[#16a34a]">Energy</div></div><div><h1 className="text-[17px] font-bold leading-none">TRANSFORMER REPORT</h1><p className="mt-2 text-[9px] text-slate-500">Performance Summary & Analysis</p></div><div className="grid grid-cols-[78px_1fr] gap-x-2 gap-y-1 text-[6.8px]"><b>Report ID:</b><span>TR-RPT-20250518-01</span><b>Date Generated:</b><span>May 18, 2025 &nbsp; 10:15 AM CDT</span><b>Date Range:</b><span>May 11, 2025 - May 18, 2025 (7 Days)</span><b>Generated By:</b><span>John Smith (OEM Admin)</span></div></header>;
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return <h2 className="mb-2 text-[8.5px] font-bold text-[#147dff]">{index}. {title}</h2>;
}

function InfoBlock({ rows, title }: { rows: string[][]; title: string }) {
  return <div><h3 className="mb-1.5 text-[7px] font-bold">{title}</h3><div className="grid grid-cols-[72px_1fr] gap-x-2 gap-y-[3px] text-[6.4px]">{rows.map(([label, value]) => <span className={label === "Status" ? "contents text-green-700" : "contents"} key={label}><b>{label}:</b><span className={label === "Status" ? "text-green-700" : "whitespace-pre-line"}>{value}</span></span>)}</div></div>;
}

function TransformerPhoto() {
  return <div className="h-[136px] overflow-hidden rounded border border-slate-300 bg-[linear-gradient(135deg,#d7d3ca,#717171_45%,#2f3032)] p-2"><div className="flex h-full items-end gap-2">{[42,68,92,118,105,84].map((h,i)=><span className="flex-1 rounded-t bg-gradient-to-b from-slate-300 to-slate-700 shadow" style={{height:h}} key={i}><span className="mx-auto mt-2 block h-10 w-2 rounded bg-slate-200/60" /></span>)}</div></div>;
}

function SummaryCard({ color, icon, label, value }: { color: string; icon: string; label: string; value: string }) {
  return <article className="rounded border border-slate-200 p-2"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[13px]" style={{color}}>{icon}</span><span className="text-[6.3px]"><span>{label}</span><br /><b className="text-[12px]" style={{color}}>{value}</b></span></div></article>;
}

function Panel({ children, plainTitle, title }: { children: ReactNode; plainTitle?: boolean; title: string }) {
  return <section className="rounded border border-slate-300 p-2"><h2 className={plainTitle ? "mb-2 text-[8px] font-bold" : "mb-2 text-[8.5px] font-bold text-[#147dff]"}>{title}</h2>{children}</section>;
}

function PerformanceTable() {
  return <table className="w-full text-left text-[6.2px]"><thead><tr>{["Parameter", "Average", "Minimum", "Maximum", "Unit", "Status"].map(h=><th className="border border-slate-200 bg-slate-50 px-1 py-0.5" key={h}>{h}</th>)}</tr></thead><tbody>{performanceRows.map(row=><tr key={row[0]}>{row.map(cell=><td className={cell.includes("Normal") ? "border border-slate-200 px-1 py-[2px] text-green-700" : "border border-slate-200 px-1 py-[2px]"} key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function LoadingTrend() {
  const points = "0,96 28,92 56,98 84,88 112,72 140,82 168,98 196,103 224,86 252,92 280,98 308,80 336,94 364,102 392,89 420,97";
  return <svg className="h-[134px] w-full" viewBox="0 0 440 150"><g stroke="#e5e7eb">{[22,52,82,112,142].map(y=><line x1="35" x2="428" y1={y} y2={y} key={y}/>)}{[35,100,165,230,295,360,425].map(x=><line x1={x} x2={x} y1="18" y2="132" key={x}/>)}</g><line x1="35" x2="428" y1="42" y2="42" stroke="#f97316" strokeDasharray="4 3"/><polyline fill="none" points={points} stroke="#147dff" strokeWidth="2" transform="translate(35 0)"/><g className="fill-slate-500 text-[7px]"><text x="6" y="24">2,000</text><text x="10" y="84">1,000</text><text x="10" y="134">0</text><text x="36" y="146">May 12</text><text x="360" y="146">May 18</text></g><g className="text-[7px]"><text x="120" y="147" fill="#147dff">━ Apparent Power (kVA)</text><text x="242" y="147" fill="#f97316">··· Rated Capacity (1,500 kVA)</text></g></svg>;
}

function PowerQuality() {
  const rows = [["L1-L2", "480.2 V", "1.2%"], ["L2-L3", "478.6 V", "0.3%"], ["L3-L1", "481.1 V", "1.4%"], ["Average", "479.9 V", ""]];
  return <div className="grid grid-cols-2 gap-3 text-[6.5px]"><div><b>Voltage (L-L)</b>{rows.map(([l,v,p])=><div className="mt-2 grid grid-cols-[42px_1fr_42px_28px] items-center gap-2" key={l}><span>{l}</span><span className="h-1 rounded bg-[#147dff]" /><span>{v}</span><span>{p}</span></div>)}<div className="mt-2 flex justify-between"><span>IEEE 519 Limit: ±5%</span><b className="text-green-700">Within Limit</b></div></div><div><b>Current THD</b>{[["L1","6.0%"],["L2","6.3%"],["L3","6.2%"],["Average","6.2%"]].map(([l,v])=><div className="mt-2 grid grid-cols-[36px_1fr_38px] items-center gap-2" key={l}><span>{l}</span><span className="h-1 rounded bg-blue-100"><span className="block h-1 w-2/3 rounded bg-blue-300" /></span><span>{v}</span></div>)}<div className="mt-2 flex justify-between"><span>IEEE 519 Limit: &lt; 8%</span><b className="text-green-700">Within Limit</b></div></div></div>;
}

function LossAnalysis() {
  const rows = [["No-Load Losses (Core)", "6.8 kW", "4.5%"], ["Load Losses (Copper)", "22.4 kW", "14.8%"], ["Stray Load Losses", "3.2 kW", "2.1%"], ["Total Estimated Losses", "32.4 kW", "21.4%"]];
  return <div className="text-[6.8px]">{rows.map(([l,v,p])=><div className="flex justify-between border-b border-slate-200 px-1 py-1" key={l}><b>{l}</b><span>{v}</span><span>{p}</span></div>)}<div className="mt-1 flex justify-between rounded bg-green-50 px-1 py-1"><b>Efficiency (Estimated)</b><b>98.0%</b></div></div>;
}

function Footer() {
  return <footer className="mt-2 grid grid-cols-[80px_1fr_80px_1fr_42px] items-end gap-3 border-t border-slate-200 pt-2 text-[6.5px]"><div><div className="text-[24px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#16a34a]">X</span>ECO</div><div className="text-[5px] font-bold uppercase tracking-[0.45em] text-[#16a34a]">Energy</div></div><div>XECO Energy Corporation<br/>123 Energy Way, Austin, TX 78701 USA<br/>www.xecoenergy.com &nbsp; | &nbsp; support@xecoenergy.com</div><div className="text-center">Page 1 of 1</div><div>This report is confidential and intended for<br/>the use of the named recipient only.</div><div className="grid size-9 grid-cols-4 gap-[1px] bg-white p-1">{Array.from({length:16}).map((_,i)=><span className={(i*7)%5<3 ? "bg-slate-900" : "bg-white"} key={i}/>)}</div></footer>;
}
