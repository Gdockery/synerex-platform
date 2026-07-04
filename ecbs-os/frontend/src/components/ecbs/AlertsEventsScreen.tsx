import type { ReactNode } from "react";
import type { AlertsEventsData } from "@/lib/trackingDashboardData";

const navItems = [
  { href: "/enterprise/dashboard", label: "Enterprise Dashboard" },
  { href: "/enterprise/energy-dashboard", label: "Energy Dashboard" },
  { href: "/enterprise/capacity-intelligence", label: "Capacity Intelligence" },
  { href: "/enterprise/digital-twin", label: "Digital Twin" },
  { href: "/enterprise/sites", label: "Sites" },
  { href: "/enterprise/transformers", label: "Transformers" },
  { href: "/enterprise/current-analysis", label: "Current Analysis" },
  { href: "/enterprise/savings-forecast", label: "Savings & Forecast" },
  { href: "/enterprise/alerts-events", label: "Alerts & Events" },
  { href: "/enterprise/reports", label: "Reports" },
];

const devices = [
  { href: "/devices/gateways", label: "Gateways" },
  { href: "/devices/meters", label: "Meters" },
  { href: "/devices/switches", label: "Switches" },
  { href: "/devices/repeaters", label: "Repeaters" },
];

export function AlertsEventsScreen({ data }: { data: AlertsEventsData }) {
  return (
    <div className="h-[682px] w-[1024px] overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[106px_918px]">
        <AlertsSidebar cbi={data.cbiScore} />

        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,0.08),transparent_32%),linear-gradient(180deg,#03101a,#020910)] px-2.5">
          <Topbar />

          <div className="flex h-[50px] items-start justify-between pt-2">
            <div>
              <h1 className="text-[15px] font-semibold uppercase leading-none tracking-wide text-slate-100">Alerts & Events™</h1>
              <p className="mt-1 text-[8px] text-slate-400">Real-Time Alerting. Faster Response. Greater Reliability.</p>
              <p className="mt-2 text-[8px] text-slate-400">
                Energy & Savings Dashboard <span className="mx-1 text-slate-600">›</span> <span className="text-[#05ff5e]">Alerts & Events</span>
              </p>
            </div>
            <div className="flex gap-2 pt-1 text-[8px]">
              <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">◎ Acknowledge All</button>
              <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">⚙ Configure Alerts</button>
              <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">⇩ Export</button>
            </div>
          </div>

          <section className="grid h-[78px] grid-cols-6 gap-1.5">
            {data.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="mt-2 grid h-[164px] grid-cols-[1fr_1.2fr_1.32fr] gap-2">
            <Panel title="Alerts By Severity">
              <SeverityDonut data={data} />
            </Panel>
            <Panel title="Alert Trend (Last 7 Days)">
              <AlertTrend data={data} />
            </Panel>
            <Panel title="Alert Status Over Time">
              <StatusBars data={data} />
            </Panel>
          </section>

          <section className="mt-2 grid h-[164px] grid-cols-[1.63fr_1.2fr] gap-2">
            <Panel title="Active Alerts (6)">
              <ActiveAlertsTable data={data} />
            </Panel>
            <Panel title="Alert Priority Matrix">
              <PriorityMatrix data={data} />
            </Panel>
          </section>

          <section className="mt-2 grid h-[150px] grid-cols-[1.25fr_1fr_0.92fr_0.92fr] gap-2">
            <Panel title="Alert Response Performance (Last 7 Days)">
              <ResponsePerformance data={data} />
            </Panel>
            <Panel title="Alert Categories">
              <CategoryBars data={data} />
            </Panel>
            <Panel title="Alert Notifications (Last 7 Days)">
              <Notifications data={data} />
            </Panel>
            <Panel title="Quick Actions">
              <QuickActions />
            </Panel>
          </section>

          <footer className="mt-auto flex h-[28px] items-center justify-between border-t border-cyan-300/10 text-[8px] text-slate-500">
            <span>ⓘ Alerts are generated in real time based on system thresholds and predictive analytics.</span>
            <span><i className="mr-1 inline-block size-1.5 rounded-full bg-[#05ff5e]" />All Systems Operational</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function AlertsSidebar({ cbi }: { cbi: number }) {
  return (
    <aside className="flex h-full flex-col border-r border-cyan-300/10 bg-[#030c15] px-2 py-2">
      <div className="mb-3">
        <div className="text-[25px] font-black italic leading-none tracking-[-0.13em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div>
        <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.48em] text-[#16ff5d]">Energy</div>
      </div>
      <nav className="space-y-1 text-[8px]">
        {navItems.map((item) => (
          <a className={`flex h-[20px] items-center gap-1.5 rounded px-1 ${item.href === "/enterprise/alerts-events" ? "border-l-2 border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : "text-slate-300"}`} href={item.href} key={item.href}>
            <span>{item.href === "/enterprise/alerts-events" ? "⚠" : "⌾"}</span>
            <span className="truncate">{item.label}</span>
            {item.href === "/enterprise/alerts-events" ? <b className="ml-auto rounded-full bg-red-500 px-1 text-[7px] text-white">6</b> : null}
          </a>
        ))}
      </nav>
      <div className="mt-2 border-t border-white/8 pt-1">
        <div className="mb-1 flex justify-between text-[8px] text-slate-300">Devices <span>⌄</span></div>
        {devices.map((device) => <a className="block h-[18px] px-2 text-[8px] text-slate-300" href={device.href} key={device.href}>⊙ {device.label}</a>)}
      </div>
      <a className="mt-2 block text-[8px] text-slate-300" href="/administration/settings">⚙ Settings</a>
      <div className="mt-auto rounded border border-cyan-300/12 bg-[#041722] p-2 text-center">
        <div className="text-[8px] leading-snug text-slate-300">XECO Current<br />Balance Index™</div>
        <div className="mt-1 text-[31px] font-light leading-none text-[#7ed321]">{formatInt(cbi)}</div>
        <div className="mt-1 text-[8px] text-slate-300">A+ Rating</div>
        <a className="mt-2 block text-[8px] text-[#7ed321]" href="/enterprise/current-analysis">View Details →</a>
      </div>
      <div className="mt-4 text-[7px] leading-snug text-slate-500">Last Updated<br />May 18, 2025 10:15 AM<br /><span className="text-[#7ed321]">●</span> Real-time</div>
      <div className="mt-6 text-[6px] leading-snug text-slate-500">© 2025 XECO Energy Corporation.<br />All rights reserved.</div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="flex h-[42px] items-center justify-end border-b border-cyan-300/10">
      <div className="flex items-center gap-3 text-[8px] text-slate-300">
        <button className="min-w-[88px] rounded border border-slate-700 bg-[#061421] px-2 py-1.5 text-left">Flex Tijuana <span className="float-right">⌄</span></button>
        <button className="min-w-[130px] rounded border border-slate-700 bg-[#061421] px-2 py-1.5">▣ May 12 - May 18, 2025 ⌄</button>
        <div className="relative text-[15px]">♧<span className="absolute -right-1 -top-1 grid size-3 place-items-center rounded-full bg-red-500 text-[7px] text-white">6</span></div>
        <div className="grid size-5 place-items-center rounded-full border border-slate-500">?</div>
        <div className="grid size-5 place-items-center rounded-full border border-slate-500">⚙</div>
        <div className="grid size-7 place-items-center rounded-full border border-slate-500 bg-slate-200 text-[#020a12]">●</div>
        <div className="leading-tight"><b className="text-slate-100">Greg Dockery</b><br /><span className="text-slate-500">Administrator</span></div>
        <span>⌄</span>
      </div>
    </header>
  );
}

function MetricCard({ metric }: { metric: AlertsEventsData["metrics"][number] }) {
  return (
    <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-2">
      <div className="flex gap-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full border text-[18px]" style={{ borderColor: metric.accent, color: metric.accent }}>{metric.icon}</div>
        <div>
          <div className="text-[8px] font-semibold uppercase text-slate-400">{metric.label}</div>
          <div className="mt-1 text-[22px] font-light leading-none text-white">{metric.value}</div>
          <div className="mt-1 text-[8px] text-slate-400">{metric.detail}</div>
          <div className="mt-1 text-[7px]" style={{ color: metric.accent }}>{metric.subdetail}</div>
        </div>
      </div>
    </article>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="overflow-hidden rounded border border-cyan-300/12 bg-[#061521]/92 p-2">
      <h2 className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function SeverityDonut({ data }: { data: AlertsEventsData }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-center gap-3">
      <div className="relative size-[104px] rounded-full p-[18px]" style={{ background: "conic-gradient(#dc2626 0 13.6%, #f59e0b 13.6% 45.4%, #0ea5e9 45.4% 100%)" }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center">
          <div><div className="text-[25px] leading-none text-white">{data.totalAlerts}</div><div className="text-[8px] text-slate-400">Total Alerts</div></div>
        </div>
      </div>
      <div className="space-y-4 text-[9px]">
        {data.severity.map((item) => (
          <div className="grid grid-cols-[1fr_28px_48px] gap-2" key={item.label}>
            <span><i className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
            <span className="text-right text-white">{item.value}</span>
            <span className="text-slate-400">({item.pct})</span>
          </div>
        ))}
      </div>
      <a className="col-span-2 text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View Severity Report →</a>
    </div>
  );
}

function AlertTrend({ data }: { data: AlertsEventsData }) {
  return (
    <div>
      <LineLegend items={[["#dc2626", "Critical"], ["#f59e0b", "Warning"], ["#0ea5e9", "Info"]]} />
      <svg className="h-[92px] w-full" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
        {[20, 40, 60, 80].map((y) => <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgba(148,163,184,0.15)" />)}
        <TrendLine color="#dc2626" values={data.trend.map((point) => point.critical)} max={50} />
        <TrendLine color="#f59e0b" values={data.trend.map((point) => point.warning)} max={50} />
        <TrendLine color="#0ea5e9" values={data.trend.map((point) => point.info)} max={50} />
      </svg>
      <Labels labels={data.trend.map((point) => point.label)} />
      <a className="mt-2 block text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View Trend Analysis →</a>
    </div>
  );
}

function StatusBars({ data }: { data: AlertsEventsData }) {
  return (
    <div>
      <LineLegend items={[["#dc2626", "Active"], ["#f59e0b", "Acknowledged"], ["#65a30d", "Resolved"]]} />
      <div className="flex h-[92px] items-end justify-between border-l border-b border-slate-700/60 px-4">
        {data.statusBars.map((bar) => (
          <div className="flex w-5 flex-col-reverse" key={bar.label}>
            <span className="bg-[#65a30d]" style={{ height: `${bar.resolved * 2}px` }} />
            <span className="bg-[#f59e0b]" style={{ height: `${bar.acknowledged * 2}px` }} />
            <span className="bg-[#dc2626]" style={{ height: `${bar.active * 2}px` }} />
          </div>
        ))}
      </div>
      <Labels labels={data.statusBars.map((bar) => bar.label)} />
      <a className="mt-2 block text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View Status History →</a>
    </div>
  );
}

function ActiveAlertsTable({ data }: { data: AlertsEventsData }) {
  const tone: Record<string, string> = { Critical: "text-[#dc2626]", Info: "text-[#0ea5e9]", Warning: "text-[#f59e0b]" };

  return (
    <div>
      <table className="w-full text-left text-[7px]">
        <thead className="text-slate-500">
          <tr>{["Severity", "Alert Name", "Device / Location", "Category", "Triggered", "Duration", "Status", "Actions"].map((head) => <th className="pb-1 font-medium" key={head}>{head}</th>)}</tr>
        </thead>
        <tbody>
          {data.activeAlerts.map((alert) => (
            <tr className="border-t border-white/5" key={alert.name}>
              <td className={`py-1 ${tone[alert.severity]}`}>△ {alert.severity}</td>
              <td className="py-1 text-slate-200">{alert.name}</td>
              <td className="py-1 text-slate-300">{alert.device}</td>
              <td className="py-1 text-slate-300">{alert.category}</td>
              <td className="py-1 text-slate-300">{alert.triggered}</td>
              <td className="py-1 text-slate-300">{alert.duration}</td>
              <td className="py-1 text-red-400">{alert.status}</td>
              <td className="py-1 text-slate-400">{alert.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <a className="mt-1 block text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View All Active Alerts →</a>
    </div>
  );
}

function PriorityMatrix({ data }: { data: AlertsEventsData }) {
  const rows = ["5 Critical", "4 High", "3 Medium", "2 Low", "1 Minimal"];
  const cols = ["1 Rare", "2 Unlikely", "3 Possible", "4 Likely", "5 Almost Certain"];

  return (
    <div className="grid grid-cols-[42px_1fr] gap-1 text-[8px]">
      <div className="[writing-mode:vertical-rl] rotate-180 self-center text-center text-slate-400">IMPACT</div>
      <div>
        <div className="grid grid-cols-[52px_repeat(5,1fr)]">
          {rows.map((row, rowIndex) => (
            <div className="contents" key={row}>
              <div className="grid h-[18px] items-center text-slate-300">{row}</div>
              {data.priorityMatrix[rowIndex].map((value, colIndex) => (
                <div className="grid h-[18px] place-items-center border border-[#153522]" key={`${row}-${colIndex}`} style={{ backgroundColor: matrixColor(rowIndex, colIndex) }}>{value}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[52px_repeat(5,1fr)] text-center text-[7px] text-slate-400">
          <span />
          {cols.map((col) => <span key={col}>{col}</span>)}
        </div>
        <div className="mt-1 text-center text-[8px] text-slate-400">LIKELIHOOD</div>
        <a className="mt-2 block text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View Risk Analysis →</a>
      </div>
    </div>
  );
}

function ResponsePerformance({ data }: { data: AlertsEventsData }) {
  return (
    <div>
      <div className="grid grid-cols-4 text-center text-[8px]">
        <Summary value="62" label="Total Alerts" />
        <Summary value={`${data.responseMinutes} min`} label="Avg Response Time" />
        <Summary value="15 min" label="SLA Target" />
        <Summary value={`${data.compliancePct}%`} label="Within SLA" />
      </div>
      <div className="mt-2 flex h-[54px] items-end justify-between border-l border-b border-slate-700/60 px-3">
        {data.responseBars.map((value, index) => <span className="w-4 bg-[#65a30d]" key={index} style={{ height: `${value * 2}px` }} />)}
      </div>
      <Labels labels={["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"]} />
      <a className="mt-1 block text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View Performance Report →</a>
    </div>
  );
}

function CategoryBars({ data }: { data: AlertsEventsData }) {
  return (
    <div className="space-y-2 pt-1 text-[8px]">
      {data.categories.map((category) => (
        <div className="grid grid-cols-[64px_1fr_50px] items-center gap-2" key={category.label}>
          <span className="text-slate-300">{category.label}</span>
          <span className="h-2.5 rounded-sm" style={{ width: `${category.value * 8}px`, backgroundColor: category.color }} />
          <span className="text-slate-400">{category.value} ({category.pct})</span>
        </div>
      ))}
      <a className="block pt-2 text-[8px] text-[#0ea5e9]" href="/enterprise/alerts-events">View Category Report →</a>
    </div>
  );
}

function Notifications({ data }: { data: AlertsEventsData }) {
  return (
    <div className="space-y-3 pt-1 text-[8px]">
      {data.notifications.map((item) => <MetricLine key={item.label} label={item.label} value={`${item.value}`} />)}
      <a className="block pt-1 text-[#0ea5e9]" href="/enterprise/alerts-events">View Notification Log →</a>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="space-y-2 text-[8px]">
      {["Acknowledge All Alerts", "Manage Alert Rules", "Alert Escalation Setup", "Notification Preferences", "Maintenance Mode"].map((action) => (
        <div className="border-b border-white/5 pb-1 text-slate-300" key={action}>◎ {action}</div>
      ))}
      <a className="block pt-1 text-[#0ea5e9]" href="/enterprise/alerts-events">View All Actions →</a>
    </div>
  );
}

function TrendLine({ color, max, values }: { color: string; max: number; values: number[] }) {
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 320},${100 - (value / max) * 82}`).join(" ");
  return <polyline fill="none" points={points} stroke={color} strokeWidth="2" />;
}

function LineLegend({ items }: { items: [string, string][] }) {
  return <div className="mb-1 flex justify-center gap-5 text-[7px] text-slate-400">{items.map(([color, label]) => <span key={label}><i className="mr-1 inline-block h-0.5 w-4 align-middle" style={{ backgroundColor: color }} />{label}</span>)}</div>;
}

function Labels({ labels }: { labels: string[] }) {
  return <div className="mt-1 flex justify-between text-[7px] text-slate-500">{labels.map((label) => <span key={label}>{label}</span>)}</div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[13px] text-white">{value}</div><div className="text-[7px] text-slate-400">{label}</div></div>;
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-slate-300">□ {label}</span><span className="font-semibold text-slate-100">{value}</span></div>;
}

function matrixColor(row: number, col: number) {
  if (row <= 1 && col >= 2) return "#991b1b";
  if (row <= 2 && col >= 1) return "#b45309";
  if (row <= 3 && col >= 1) return "#4d7c0f";
  return "#14532d";
}

function formatInt(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
