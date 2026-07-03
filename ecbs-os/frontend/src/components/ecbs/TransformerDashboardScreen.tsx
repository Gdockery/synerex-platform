import type { TransformerDashboardData, TransformerDetailRow, TransformerPhaseSummary } from "@/lib/trackingDashboardData";

export function TransformerDashboardScreen({ data }: { data: TransformerDashboardData }) {
  const currentLoadPct = `${formatNumber(data.utilizationPct)}%`;

  return (
    <div className="h-[682px] w-[1024px] overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[126px_898px]">
        <TransformerSidebar cbi={data.cbiScore} />

        <main className="flex h-full min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,0.08),transparent_32%),linear-gradient(180deg,#03101a,#020910)] px-2.5">
          <PortalTopbar />

          <section className="border-b border-cyan-300/10 pb-1.5 pt-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 text-[9px] text-slate-400">
                  Transformers <span className="mx-1 text-slate-600">›</span> <span className="text-slate-200">Main Transformer</span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[19px] font-semibold leading-none text-slate-100">Main Transformer</h1>
                  <span className="size-2 rounded-full bg-[#05ff5e]" />
                  <span className="text-[9px] font-semibold text-[#05ff5e]">Active</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] text-slate-400">
                  <span>ID: XF-001</span>
                  <span><b className="font-medium text-slate-300">Location:</b> Flex Tijuana</span>
                  <span><b className="font-medium text-slate-300">Type:</b> Pad Mounted</span>
                  <span><b className="font-medium text-slate-300">Manufacturer:</b> Schneider Electric</span>
                  <span><b className="font-medium text-slate-300">Rating:</b> {formatNumber(data.ratingKva)} kVA</span>
                  <span><b className="font-medium text-slate-300">Voltage:</b> 480Y/277 V</span>
                  <span><b className="font-medium text-slate-300">Feed:</b> Main Switchgear 1</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1 text-[9px]">
                <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">⇩ Download Report</button>
                <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">⚙ Transformer Settings</button>
              </div>
            </div>

            <nav className="mt-4 flex h-[22px] gap-6 text-[9px] text-slate-400">
              {["Overview", "Performance", "Load Profile", "Power Quality", "Capacity & Savings", "Alarms & Events", "Maintenance", "Documents"].map((tab) => (
                <span className={tab === "Overview" ? "border-b-2 border-[#05ff5e] pb-1.5 font-semibold text-[#05ff5e]" : ""} key={tab}>
                  {tab}{tab === "Alarms & Events" ? <b className="ml-1 rounded-full bg-orange-500 px-1 text-[8px] text-white">2</b> : null}
                </span>
              ))}
            </nav>
          </section>

          <section className="mt-1.5 grid h-[116px] grid-cols-[148px_140px_150px_140px_140px_132px] gap-1.5">
            <KpiPanel title="Utilization">
              <div className="grid grid-cols-[62px_1fr] items-center gap-2">
                <RingGauge value={data.utilizationPct} />
                <div className="pt-1">
                  <div className="text-[18px] font-light leading-none text-white">{formatNumber(data.loadKva)} <span className="text-[11px]">kVA</span></div>
                  <div className="mt-1 text-[8px] text-slate-400">Current Load</div>
                  <div className="mt-3 text-[8px] leading-snug text-slate-400">of {formatNumber(data.ratingKva)} kVA<br />Rated Capacity</div>
                </div>
              </div>
            </KpiPanel>

            <KpiPanel title="Capacity Recovered">
              <BigMetric value={`${formatNumber(data.capacityRecoveredKva)} kVA`} color="#05ff5e" />
              <p className="text-[8px] text-slate-400">{formatNumber(data.capacityRecoveredKva / Math.max(data.ratingKva, 1) * 100)}% of Rated Capacity</p>
              <MiniCompare before={data.loadKva + data.capacityRecoveredKva} after={data.loadKva} />
            </KpiPanel>

            <KpiPanel title="Available Capacity">
              <BigMetric value={`${formatNumber(data.availableCapacityKva)} kVA`} color="#147dff" />
              <p className="text-[8px] text-slate-400">{formatNumber(data.availableCapacityKva / Math.max(data.ratingKva, 1) * 100)}% of Rated Capacity</p>
              <p className="mt-3 text-[8px] text-slate-400">Equivalent to:<br />⚕ 4 x 50 hp motors &nbsp; 🧊 35 Server Racks</p>
            </KpiPanel>

            <KpiPanel title="Current Balance Index™">
              <div className="mx-auto -mt-1 w-[92px] text-center">
                <SemiGauge value={data.cbiScore} />
                <div className="-mt-4 text-[8px] text-slate-400">A+ Rating</div>
                <div className="text-[8px] text-slate-400">Excellent Balance</div>
              </div>
            </KpiPanel>

            <KpiPanel title="Transformer Health">
              <div className="mt-2 flex gap-2">
                <div className="grid size-7 place-items-center rounded-full bg-[#09c957] text-[16px] font-bold">✓</div>
                <div>
                  <div className="text-[13px] font-semibold text-[#05ff5e]">{data.health}</div>
                  <div className="text-[8px] text-slate-400">From active issues</div>
                </div>
              </div>
              <div className="mt-5 space-y-1 text-[8px] text-slate-400">
                <MetricLine label="Oil Temp:" value="49 °C" />
                <MetricLine label="Load Temp Rise:" value="37 °C" />
              </div>
            </KpiPanel>

            <KpiPanel title="Total Annual Savings">
              <div className="mt-2 flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-purple-600 text-[17px]">$</div>
                <div>
                  <div className="text-[20px] font-light leading-none text-white">{data.annualSavings}</div>
                  <div className="mt-1 text-[8px] text-slate-400">From this Transformer</div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-[8px] text-slate-400">
                <MetricLine label="Energy:" value={data.savingsRows[0]?.value ?? "$0"} />
                <MetricLine label="Demand:" value={data.savingsRows[1]?.value ?? "$0"} />
              </div>
            </KpiPanel>
          </section>

          <section className="mt-1.5 grid h-[154px] grid-cols-[1.05fr_0.95fr] gap-1.5">
            <Panel title="KVA Load Trend" action="Last 7 Days⌄">
              <LineChart
                labels={["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"]}
                primary={data.kvaTrend.points}
                secondary="0,60 28,68 56,62 84,70 112,58 140,64 168,55 196,62 224,50 252,58 280,52 308,60"
                rating={data.ratingKva}
              />
            </Panel>
            <Panel title="Load Profile (Today)" action="kVA⌄">
              <AreaChart labels={["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "12 AM"]} points={data.loadProfile.points} rating={data.ratingKva} value={data.loadKva} />
            </Panel>
          </section>

          <section className="mt-1.5 grid h-[128px] grid-cols-[1.25fr_1.06fr_1.05fr_1fr] gap-1.5">
            <Panel title="Capacity & Utilization">
              <div className="grid h-[98px] grid-cols-[90px_1fr] items-center gap-2">
                <Donut value={data.utilizationPct} />
                <div className="space-y-1 text-[8px]">
                  <LegendLine color="#05ff5e" label="Current Load" value={`${formatNumber(data.loadKva)} kVA (${currentLoadPct})`} />
                  <LegendLine color="#147dff" label="Available Capacity" value={`${formatNumber(data.availableCapacityKva)} kVA`} />
                  <LegendLine color="#ef4444" label="Over Capacity" value="0 kVA (0%)" />
                  <LegendLine color="#94a3b8" label="Rate Capacity" value={`${formatNumber(data.ratingKva)} kVA (100%)`} />
                </div>
              </div>
            </Panel>

            <Panel title="Phase Summary">
              <PhaseSummary phases={data.phaseSummary} />
            </Panel>

            <Panel title="Power Quality Snapshot">
              <QualityRows rows={data.powerQuality} />
            </Panel>

            <Panel title="Transformer Details">
              <DetailRows rows={data.details} />
            </Panel>
          </section>

          <section className="mt-1.5 grid h-[101px] grid-cols-[1.65fr_1fr] gap-1.5">
            <Panel title="Capacity Recovery Over Time">
              <BarChart labels={["Jun '24", "Jul '24", "Aug '24", "Sep '24", "Oct '24", "Nov '24", "Dec '24", "Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25"]} value={data.capacityRecoveredKva} />
            </Panel>
            <Panel title="Savings From This Transformer (Annual)">
              <div className="space-y-1.5 pt-1 text-[9px]">
                {data.savingsRows.map((row, index) => (
                  <MetricLine green={index === data.savingsRows.length - 1} key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </Panel>
          </section>

          <footer className="mt-auto flex h-[22px] items-center justify-between text-[8px] text-slate-500">
            <div />
            <div className="flex gap-7 text-[#05ff5e]">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/support">Support</a>
            </div>
            <div>Data updated: {data.updatedAt} <span className="ml-4 text-[#05ff5e]">▥ Live</span></div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function TransformerSidebar({ cbi }: { cbi: number }) {
  const items = [
    "Enterprise Dashboard",
    "Energy Dashboard",
    "Capacity Intelligence",
    "Digital Twin",
    "Sites",
    "Transformers",
    "Electrical Network",
    "Current Analysis",
    "Savings & Forecast",
    "Alarms & Events",
    "Reports",
  ];
  const devices = ["Gateways", "Meters", "Switches", "Repeaters"];

  return (
    <aside className="flex h-full flex-col border-r border-cyan-300/10 bg-[#030c15] px-2 py-2">
      <div className="mb-3">
        <div className="text-[31px] font-black italic leading-none tracking-[-0.13em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div>
        <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.48em] text-[#16ff5d]">Energy</div>
      </div>

      <nav className="space-y-1 text-[9px]">
        {items.map((item) => (
          <a className={`flex h-[22px] items-center gap-1.5 rounded px-1.5 ${item === "Transformers" ? "border-l-2 border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : "text-slate-300"}`} href={item === "Transformers" ? "/enterprise/transformers" : "#"} key={item}>
            <span className="text-[11px]">{item === "Transformers" ? "♜" : item === "Alarms & Events" ? "⚠" : "⌾"}</span>
            <span>{item}</span>
            {item === "Alarms & Events" ? <b className="ml-auto rounded-full bg-orange-500 px-1 text-[8px] text-white">2</b> : null}
          </a>
        ))}
      </nav>

      <div className="mt-2 border-t border-white/8 pt-1">
        <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase text-slate-300">Devices <span>⌄</span></div>
        <div className="space-y-1">
          {devices.map((item) => (
            <a className="flex h-[20px] items-center gap-1.5 rounded px-2 text-[9px] text-slate-300" href="#" key={item}>⊙ {item}</a>
          ))}
        </div>
      </div>

      <a className="mt-2 flex h-[22px] items-center gap-1.5 rounded px-1.5 text-[9px] text-slate-300" href="#">⚙ Settings</a>

      <div className="mt-auto rounded border border-cyan-300/12 bg-[#041722] p-2 text-center">
        <div className="text-[9px] leading-snug text-slate-300">XECO Current<br />Balance Index™</div>
        <div className="mt-1 text-[36px] font-light leading-none text-[#05ff5e]">{formatNumber(cbi)}</div>
        <div className="mt-1 text-[9px] text-slate-300">A+ Rating</div>
        <a className="mt-3 block text-[9px] text-[#05ff5e]" href="#">View Details →</a>
      </div>

      <div className="mt-3 text-[7px] leading-snug text-slate-500">© 2025 XECO Energy Corporation.<br />All rights reserved.</div>
    </aside>
  );
}

function PortalTopbar() {
  return (
    <header className="flex h-[48px] items-center justify-between border-b border-cyan-300/10">
      <div>
        <div className="text-[12px] font-semibold tracking-wide text-slate-100">XECO ENERGY INTELLIGENCE PORTAL</div>
        <div className="mt-1 text-[8px] text-slate-400">Transformers</div>
      </div>
      <div className="flex items-center gap-3 text-[9px] text-slate-300">
        <button className="min-w-[102px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Flex Tijuana <span className="float-right">⌄</span></button>
        <button className="min-w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5">▣ May 12 - May 18, 2025 ⌄</button>
        <div className="relative text-[17px]">♧<span className="absolute -right-1 -top-1 grid size-3 place-items-center rounded-full bg-[#05ff5e] text-[7px] text-[#02110a]">3</span></div>
        <div className="grid size-7 place-items-center rounded-full border border-slate-500 bg-slate-200 text-[#020a12]">●</div>
        <div className="leading-tight"><b className="text-slate-100">Greg Dockery</b><br /><span className="text-slate-500">Administrator</span></div>
        <span>⌄</span>
      </div>
    </header>
  );
}

function KpiPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <article className="overflow-hidden rounded border border-cyan-300/12 bg-[#061521]/92 p-2 shadow-[0_0_18px_rgba(0,220,255,0.04)]">
      <h2 className="mb-1.5 text-center text-[9px] font-semibold uppercase text-slate-300">{title}</h2>
      {children}
    </article>
  );
}

function Panel({ action, children, title }: { action?: string; children: React.ReactNode; title: string }) {
  return (
    <section className="overflow-hidden rounded border border-cyan-300/12 bg-[#061521]/92 p-2 shadow-[0_0_18px_rgba(0,220,255,0.04)]">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[9px] font-semibold uppercase tracking-wide text-slate-100">{title}</h2>
        {action ? <button className="rounded border border-slate-700 bg-[#061421] px-2 py-1 text-[8px] text-slate-400">{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

function BigMetric({ color, value }: { color: string; value: string }) {
  return <div className="text-[21px] font-light leading-none" style={{ color }}>{value}</div>;
}

function MiniCompare({ after, before }: { after: number; before: number }) {
  return (
    <div className="mt-3 space-y-1 text-[8px] text-slate-400">
      <MetricLine label="Before XECO:" value={`${formatNumber(before)} kVA`} />
      <MetricLine label="After XECO:" value={`${formatNumber(after)} kVA`} />
    </div>
  );
}

function PhaseSummary({ phases }: { phases: TransformerPhaseSummary[] }) {
  return (
    <div className="h-[96px] overflow-hidden">
      <table className="w-full text-left text-[9px]">
        <thead className="text-slate-500">
          <tr>
            <th className="pb-1 font-medium">Phase</th>
            <th className="pb-1 font-medium">Voltage</th>
            <th className="pb-1 font-medium">Current</th>
            <th className="pb-1 font-medium">kVA</th>
            <th className="pb-1 font-medium">% Imb.</th>
          </tr>
        </thead>
        <tbody>
          {phases.map((phase) => (
            <tr className="border-t border-white/5" key={phase.phase}>
              <td className="py-1 text-slate-200">{phase.phase}</td>
              <td className="py-1 text-slate-300">{phase.voltage}</td>
              <td className="py-1 text-slate-300">{phase.currentA}</td>
              <td className="py-1 text-slate-300">{phase.kva}</td>
              <td className="py-1 text-[#05ff5e]">{phase.imbalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailRows({ rows }: { rows: TransformerDetailRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px]">
      {rows.slice(0, 10).map((row) => (
        <MetricLine key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

function QualityRows({ rows }: { rows: TransformerDetailRow[] }) {
  return (
    <div className="space-y-1 text-[8px]">
      {rows.map((row) => (
        <div className="grid grid-cols-[1fr_40px_42px] gap-2" key={row.label}>
          <span className="text-slate-400">{row.label}</span>
          <span className="text-right text-slate-100">{row.value}</span>
          <span className="text-[#05ff5e]">● Good</span>
        </div>
      ))}
    </div>
  );
}

function MetricLine({ green = false, label, value }: { green?: boolean; label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right font-semibold ${green ? "text-[#05ff5e]" : "text-slate-100"}`}>{value}</span>
    </div>
  );
}

function LegendLine({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span><i className="mr-1 inline-block size-1.5 rounded-full align-middle" style={{ backgroundColor: color }} />{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function RingGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative mx-auto size-[58px] rounded-full p-[7px]" style={{ background: `conic-gradient(#05ff5e 0 ${clamped}%, #243447 ${clamped}% 100%)` }}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#061825] text-center">
        <div className="text-[15px] font-semibold leading-none text-[#05ff5e]">{formatNumber(clamped)}%</div>
      </div>
    </div>
  );
}

function SemiGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative h-[62px]">
      <div className="absolute left-1/2 top-0 h-[72px] w-[72px] -translate-x-1/2 rounded-full p-[8px]" style={{ background: `conic-gradient(from 270deg, #05ff5e 0 ${clamped / 2}%, #263747 ${clamped / 2}% 50%, transparent 50% 100%)` }}>
        <div className="h-full w-full rounded-full bg-[#061825]" />
      </div>
      <div className="absolute left-0 right-0 top-[24px] text-center text-[31px] font-light leading-none text-white">{formatNumber(clamped)}</div>
    </div>
  );
}

function Donut({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative mx-auto size-[76px] rounded-full p-[10px]" style={{ background: `conic-gradient(#05ff5e 0 ${clamped}%, #147dff ${clamped}% 100%)` }}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#061825] text-center">
        <div>
          <div className="text-[13px] leading-none text-white">{formatNumber(clamped)}%</div>
          <div className="mt-1 text-[7px] text-slate-400">Utilized</div>
        </div>
      </div>
    </div>
  );
}

function LineChart({ labels, primary, rating, secondary }: { labels: string[]; primary: string; rating: number; secondary: string }) {
  return (
    <div className="grid h-[122px] grid-cols-[26px_1fr] gap-1">
      <YAxis max={Math.max(rating, 1)} />
      <div>
        <svg className="h-[94px] w-full" viewBox="0 0 308 100" preserveAspectRatio="none" aria-hidden="true">
          {[25, 50, 75].map((y) => <line key={y} x1="0" x2="308" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          <line x1="0" x2="308" y1="18" y2="18" stroke="#147dff" strokeDasharray="4 3" />
          <polyline fill="none" points={secondary} stroke="rgba(203,213,225,0.75)" strokeWidth="1.2" />
          <polygon fill="rgba(5,255,94,0.25)" points={`0,100 ${primary} 308,100`} />
          <polyline fill="none" points={primary} stroke="#05ff5e" strokeWidth="1.8" />
        </svg>
        <Labels labels={labels} />
      </div>
    </div>
  );
}

function AreaChart({ labels, points, rating, value }: { labels: string[]; points: string; rating: number; value: number }) {
  return (
    <div className="grid h-[122px] grid-cols-[26px_1fr_62px] gap-1">
      <YAxis max={Math.max(rating, 1)} />
      <div>
        <svg className="h-[94px] w-full" viewBox="0 0 308 100" preserveAspectRatio="none" aria-hidden="true">
          {[25, 50, 75].map((y) => <line key={y} x1="0" x2="308" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          <line x1="0" x2="308" y1="18" y2="18" stroke="#147dff" strokeDasharray="4 3" />
          <polygon fill="rgba(5,255,94,0.42)" points={`0,100 ${points} 308,100`} />
          <polyline fill="none" points={points} stroke="#05ff5e" strokeWidth="1.8" />
        </svg>
        <Labels labels={labels} />
      </div>
      <div className="pt-8 text-[8px] leading-snug">
        <div className="text-[#147dff]">Rated Capacity<br />{formatNumber(rating)} kVA</div>
        <div className="mt-3 text-[#05ff5e]">Current Load<br />{formatNumber(value)} kVA</div>
      </div>
    </div>
  );
}

function BarChart({ labels, value }: { labels: string[]; value: number }) {
  return (
    <div className="grid h-[74px] grid-cols-[26px_1fr] gap-1">
      <div className="flex flex-col justify-between text-right text-[8px] text-slate-500"><span>300</span><span>200</span><span>100</span><span>0</span></div>
      <div>
        <div className="flex h-[54px] items-end justify-between gap-2 border-l border-b border-slate-700/60 pl-1">
          {labels.map((label, index) => (
            <div className="flex flex-1 flex-col items-center gap-1" key={label}>
              <div className="w-full rounded-t-sm bg-[#08bf55]" style={{ height: `${18 + (index % 5) * 5}px` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[7px] text-slate-500">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="absolute right-12 top-auto rounded border border-slate-700 bg-[#07131f] px-2 py-1 text-[8px] text-slate-300">May 18, 2025<br />{formatNumber(value)} kVA<br />Recovered</div>
      </div>
    </div>
  );
}

function YAxis({ max }: { max: number }) {
  return (
    <div className="flex h-[94px] flex-col justify-between text-right text-[8px] text-slate-500">
      <span>{formatNumber(max)}</span>
      <span>{formatNumber(max * 0.75)}</span>
      <span>{formatNumber(max * 0.5)}</span>
      <span>{formatNumber(max * 0.25)}</span>
      <span>0</span>
    </div>
  );
}

function Labels({ labels }: { labels: string[] }) {
  return <div className="mt-1 flex justify-between text-[7px] text-slate-500">{labels.map((label) => <span key={label}>{label}</span>)}</div>;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
