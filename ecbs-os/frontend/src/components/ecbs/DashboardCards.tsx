import type { ReactNode } from "react";
import { LeafletPortfolioMap } from "./LeafletPortfolioMap";

export type DashboardKpiTone = "green" | "blue" | "cyan" | "yellow";

export type DashboardKpi = {
  color?: string;
  detail: string;
  icon?: string;
  label: string;
  tone?: DashboardKpiTone;
  value: string;
};

export type PortfolioSite = {
  annualSavings: string;
  lat?: number;
  lng?: number;
  location: string;
  powerFactor?: string;
  site: string;
  status: "Healthy" | "Warning";
  thd?: string;
};

export type TrendCardData = {
  color?: string;
  detail: string;
  labels?: string[];
  points: string;
  value: string;
};

export type LiveSnapshotMetric = {
  color?: string;
  label: string;
  value: string;
};

export type ElectricalPanel = {
  label?: string;
  load: string;
  name: string;
};

export type NetworkNode = {
  label: string;
  value: string;
};

export type TransformerMetric = {
  accent?: boolean;
  label: string;
  value: string;
};

export type CapacityRecoveryRow = {
  color: string;
  label: string;
  value: string;
};

export type ImpactMetric = {
  icon?: string;
  label: string;
  value: string;
};

export type HealthLegendItem = {
  color: string;
  label: string;
  value: string;
};

export type AlarmItem = {
  detail: string;
  time: string;
  title: ReactNode;
  tone: "blue" | "red" | "yellow";
};

export type EventItem = {
  event: string;
  time: string;
};

export type QuickActionIconName =
  | "assessment"
  | "deployment"
  | "digitalTwin"
  | "export"
  | "maintenance"
  | "note"
  | "proposal"
  | "reports";

export type QuickActionItem = {
  color: string;
  icon: QuickActionIconName;
  label: string;
};

export type SiteInfoRow = {
  label: string;
  value: string;
};

export type NetworkHealthMetric = {
  label: string;
  tone?: "cyan" | "green";
  value: string;
};

export type NetworkHealthData = {
  metrics: NetworkHealthMetric[];
  overall: string;
};

export type TransformerCapacityData = {
  available: string;
  loaded: string;
  recovered: string;
  total: string;
  utilization: string;
};

export type HiddenCapacityRecoveredData = {
  equivalents: string[];
  value: string;
};

export type NetworkLossesReductionData = {
  after: string;
  afterWidth: string;
  before: string;
  beforeWidth: string;
  reduction: string;
};

export type EnterpriseDeviceHealthData = {
  items: HealthLegendItem[];
  value: string;
};

const sparkPoints = "0,18 12,20 24,15 36,16 48,10 60,12 72,7 84,11 96,8 108,9";

const enterpriseToneClass: Record<DashboardKpiTone, string> = {
  green: "from-[#05ff5e] to-[#029d35]",
  blue: "from-[#3ba1ff] to-[#0064ff]",
  cyan: "from-[#23e9ff] to-[#058ca0]",
  yellow: "from-[#ffc400] to-[#ff8a00]",
};

const solidToneColor: Record<DashboardKpiTone, string> = {
  green: "#0da64a",
  blue: "#147dff",
  cyan: "#00bcd4",
  yellow: "#f59e0b",
};

export function DashboardPanel({
  action,
  actionHref,
  children,
  className = "",
  title,
  variant = "site",
}: {
  action?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
  title: ReactNode;
  variant?: "enterprise" | "site";
}) {
  if (variant === "enterprise") {
    return (
      <article className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2 shadow-[0_0_22px_rgba(0,220,255,0.05)] ${className}`}>
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <h2 className="truncate text-[12px] font-semibold text-slate-100">
            {title}
          </h2>
          {action ? <a className="whitespace-nowrap rounded border border-cyan-300/10 bg-[#061421] px-2 py-1 text-[8px] font-medium text-slate-300" href={actionHref ?? "#"}>{action}</a> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
          {children}
        </div>
      </article>
    );
  }

  return (
    <section className={`flex h-full min-h-0 flex-col overflow-hidden rounded border border-cyan-300/12 bg-[#061825]/88 p-1.5 shadow-[0_0_18px_rgba(0,220,255,0.04)] ${className}`}>
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <h2 className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-100">{title}</h2>
        {action && actionHref ? <a className="whitespace-nowrap text-[7px] font-semibold text-[#05ff5e]" href={actionHref}>{action}</a> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        {children}
      </div>
    </section>
  );
}

export function DashboardKpiCard({
  kpi,
  variant = "site",
}: {
  kpi: DashboardKpi;
  variant?: "enterprise" | "site";
}) {
  if (variant === "enterprise") {
    const tone = kpi.tone ?? "green";

    return (
      <article className="h-full min-h-[88px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_22px_rgba(0,220,255,0.06)]">
        <div className="flex items-start gap-3">
          <div className={`grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${enterpriseToneClass[tone]} text-sm font-black text-white`}>
            {kpi.icon ?? kpi.label.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className={tone === "yellow" ? "text-[7.5px] font-bold uppercase leading-[0.95] text-yellow-300" : "text-[7.5px] font-semibold uppercase leading-[0.95] text-slate-300"}>
              {kpi.label}
            </div>
            <div className="mt-1 whitespace-nowrap text-[20px] font-light leading-none text-white">{kpi.value}</div>
            <div className="mt-1 truncate text-[8px] leading-none text-slate-400">{kpi.detail}</div>
          </div>
        </div>
        <Sparkline color={tone === "yellow" ? "#ffbf00" : "#05ff5e"} />
      </article>
    );
  }

  return (
    <article className="rounded border border-cyan-300/12 bg-[#061825]/90 p-1.5 shadow-[0_0_18px_rgba(0,220,255,0.06)]">
      <div className="flex items-start gap-2">
        <div className="grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white" style={{ backgroundColor: kpi.color ?? solidToneColor[kpi.tone ?? "green"] }}>
          {kpi.icon ?? kpi.label.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[6.5px] font-bold uppercase leading-[0.95] text-slate-300">{kpi.label}</div>
          <div className="mt-0.5 whitespace-nowrap text-[15px] font-light leading-none text-white">{kpi.value}</div>
          <div className="mt-0.5 truncate text-[7px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
      <Sparkline />
    </article>
  );
}

export function DashboardHeader({
  dateRange,
  subtitle,
  title,
  variant = "site",
}: {
  dateRange: string;
  subtitle: string;
  title: string;
  variant?: "enterprise" | "site";
}) {
  if (variant === "enterprise") {
    return (
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold uppercase tracking-wide text-slate-100">
            {title}
          </h1>
          <p className="text-[13px] font-semibold text-[#05ff5e]">{subtitle}</p>
        </div>

        <div className="flex items-center gap-5 text-slate-300">
          <button className="rounded border border-slate-600/70 bg-[#061421] px-4 py-1.5 text-[11px] text-slate-200">
            {dateRange}
          </button>
          <div className="relative text-xl">^</div>
          <div className="grid size-7 place-items-center rounded-full border border-slate-500 text-[13px]">?</div>
          <div className="text-right text-[11px] leading-tight">
            <div className="font-semibold text-slate-100">Greg Dockery</div>
            <div className="text-slate-500">Administrator</div>
          </div>
          <div className="grid size-8 place-items-center rounded-full border border-slate-500 text-slate-300">GD</div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-[36px] items-start justify-between">
      <div>
        <h1 className="text-[14px] font-semibold leading-none text-slate-100">{title}</h1>
        <p className="mt-1 text-[9px] text-slate-300">
          {subtitle} <span className="ml-2 text-[#05ff5e]">● Online</span>
        </p>
      </div>

      <div className="flex items-center gap-3 text-[9px] text-slate-300">
        <button className="rounded border border-slate-600/70 bg-[#061421] px-3 py-1 text-[9px]">
          {dateRange}
        </button>
        <span><span className="text-[#05ff5e]">●</span> Real-time</span>
        <span className="relative grid size-6 place-items-center rounded-full border border-slate-600">
          !
          <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-red-500 text-[8px] font-bold text-white">3</span>
        </span>
        <span className="grid size-6 place-items-center rounded-full border border-slate-600">?</span>
        <span className="grid size-7 place-items-center rounded-full bg-[#0b3158] text-[10px]">GD</span>
        <span className="leading-tight">
          <span className="block font-semibold text-slate-100">Greg Dockery</span>
          <span className="text-slate-500">Administrator</span>
        </span>
      </div>
    </header>
  );
}

export function ScreenStateBanner({ state }: { state: string }) {
  if (state === "data") {
    return null;
  }

  const copy: Record<string, string> = {
    loading: "Loading enterprise dashboard data...",
    empty: "No enterprise dashboard data is available for this view.",
    error: "Enterprise dashboard data is unavailable.",
  };

  return (
    <div className="mt-3 rounded border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
      {copy[state] ?? copy.error}
    </div>
  );
}

export function TrendCard({ color = "#05ff5e", detail, labels, points, value }: TrendCardData) {
  return (
    <>
      <div className="whitespace-nowrap text-[16px] font-light leading-none text-white">{value}</div>
      <p className={color === "#05ff5e" ? "text-[8px] text-[#05ff5e]" : "text-[8px] text-slate-400"}>{detail}</p>
      <TrendChart color={color} labels={labels} points={points} />
    </>
  );
}

export function ElectricalNetworkOverviewCard({
  nodes,
  panels,
}: {
  nodes: [NetworkNode, NetworkNode, NetworkNode];
  panels: ElectricalPanel[];
}) {
  return (
    <div className="relative h-[152px] text-[8px]">
      <div className="absolute left-[43%] top-0 grid grid-cols-[24px_96px] items-center gap-2">
        <ElectricalGlyph kind="utility" />
        <NetworkLabel {...nodes[0]} />
      </div>
      <div className="absolute left-[46.3%] top-[22px] h-[8px] w-px bg-[#05ff5e]/80" />

      <div className="absolute left-[43%] top-[28px] grid grid-cols-[24px_112px] items-center gap-2">
        <ElectricalGlyph kind="transformer" />
        <NetworkLabel {...nodes[1]} />
      </div>
      <div className="absolute left-[46.3%] top-[50px] h-[8px] w-px bg-[#05ff5e]/80" />

      <div className="absolute left-[43%] top-[56px] grid grid-cols-[24px_118px] items-center gap-2">
        <ElectricalGlyph kind="switchgear" />
        <NetworkLabel {...nodes[2]} />
      </div>

      <div className="absolute left-[46.3%] top-[78px] h-[8px] w-px bg-[#05ff5e]/80" />
      <div className="absolute left-[9%] right-[9%] top-[85px] h-px bg-[#05ff5e]/80" />

      <div
        className="absolute left-[9%] right-[9%] top-[85px] grid text-center leading-[1.15]"
        style={{ gridTemplateColumns: `repeat(${panels.length}, minmax(0, 1fr))` }}
      >
        {panels.map((panel, index) => (
          <div className="relative pt-[20px]" key={panel.name}>
            <div className="absolute left-1/2 top-0 h-3.5 w-px -translate-x-1/2 bg-[#05ff5e]/80" />
            <div className="absolute left-1/2 top-[10px] size-2.5 -translate-x-1/2 rounded-full bg-[#05ff5e]" />
            <div className="text-[7px] font-semibold text-slate-100">{panel.name}</div>
            <div className="text-[7px] text-slate-300">{panel.label || "\u00a0"}</div>
            <div className="text-[7px] text-slate-400">Load: {panel.load}</div>
            {index === 0 ? <div className="absolute -left-[9%] top-0 h-px w-[18%] bg-[#05ff5e]/80" /> : null}
            {index === panels.length - 1 ? <div className="absolute -right-[9%] top-0 h-px w-[18%] bg-[#05ff5e]/80" /> : null}
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-8 pt-1 text-[8px] text-slate-300">
        <LegendDot color="#05ff5e" label="Healthy" />
        <LegendDot color="#f59e0b" label="Warning" />
        <LegendDot color="#ef4444" label="Critical" />
        <LegendDot color="#94a3b8" label="Offline" />
      </div>
    </div>
  );
}

export function TransformerStatusCard({
  metrics,
  value,
}: {
  metrics: TransformerMetric[];
  value: string;
}) {
  return (
    <div className="grid h-[142px] grid-cols-[95px_1fr] items-center gap-2">
      <Gauge value={value} label="Loaded" />
      <div className="space-y-1.5 text-[8px]">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} {...metric} />
        ))}
      </div>
    </div>
  );
}

export function LivePowerSnapshotCard({ metrics }: { metrics: LiveSnapshotMetric[] }) {
  return (
    <div className="space-y-1.5">
      {metrics.map((metric) => (
        <div className="grid grid-cols-[78px_58px_1fr] items-center gap-2 text-[8px]" key={metric.label}>
          <span className="text-slate-400">{metric.label}</span>
          <span className="text-right text-[12px] text-slate-100">{metric.value}</span>
          <Sparkline color={metric.color ?? "#05ff5e"} compact />
        </div>
      ))}
      <div className="flex justify-between text-[8px] text-slate-500">
        <span>Last Updated: 10:15:23 AM</span>
        <span className="text-[#05ff5e]">● Live</span>
      </div>
    </div>
  );
}

export function HiddenCapacityRecoveryCard({
  after,
  before,
}: {
  after: CapacityRecoveryRow[];
  before: CapacityRecoveryRow[];
}) {
  return (
    <div className="grid grid-cols-[1fr_24px_1fr] gap-1 text-[7px]">
      <div className="space-y-1">
        <div className="font-semibold text-slate-400">Before ECBS</div>
        {before.map((row) => <Bar key={row.label} {...row} />)}
      </div>
      <div className="grid place-items-center text-[18px] text-slate-500">≫</div>
      <div className="space-y-1">
        <div className="font-semibold text-slate-400">After ECBS</div>
        {after.map((row) => <Bar key={row.label} {...row} />)}
      </div>
    </div>
  );
}

export function EcbsImpactCard({ metrics }: { metrics: ImpactMetric[] }) {
  return (
    <div className="grid grid-cols-5 gap-1 text-center text-[7px]">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <div className="mx-auto mb-1 grid size-6 place-items-center rounded-full border border-[#05ff5e]/70 text-[#05ff5e]">
            {metric.icon ?? "↓"}
          </div>
          <div className="text-slate-500">{metric.label}</div>
          <div className="mt-1 text-[12px] text-[#05ff5e]">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DeviceHealthCard({ items, value = "98%" }: { items: HealthLegendItem[]; value?: string }) {
  return (
    <div className="grid grid-cols-[58px_1fr] items-center gap-2">
      <Gauge value={value} label="Healthy" small />
      <div className="space-y-1 text-[8px]">
        {items.map((item) => <LegendLine key={item.label} {...item} />)}
      </div>
    </div>
  );
}

export function MonitoringHealthCard({ items }: { items: HealthLegendItem[] }) {
  return (
    <>
      <div className="space-y-1 text-[8px]">
        {items.map((item) => <LegendLine key={item.label} {...item} />)}
      </div>
      <div className="mt-2 text-[8px] text-slate-500">
        Last Data Update <span className="float-right">10 sec ago</span>
      </div>
    </>
  );
}

export function ActiveAlarmsCard({ alarms }: { alarms: AlarmItem[] }) {
  const toneClass: Record<AlarmItem["tone"], string> = {
    blue: "text-blue-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
  };

  return (
    <div className="space-y-1">
      {alarms.map((alarm) => (
        <div className="grid grid-cols-[18px_1fr_54px] items-center rounded bg-slate-100 px-1.5 py-1 text-[8px] text-slate-800" key={alarm.title}>
          <span className={toneClass[alarm.tone]}>△</span>
          <span><b>{alarm.title}</b><br />{alarm.detail}</span>
          <span className="text-right text-[7px]">{alarm.time}</span>
        </div>
      ))}
    </div>
  );
}

export function RecentEventsCard({ events }: { events: EventItem[] }) {
  return (
    <div className="space-y-1.5 text-[8px]">
      {events.map((event, index) => (
        <div className="grid grid-cols-[8px_56px_1fr] gap-1" key={`${event.time}-${event.event}`}>
          <span className={index === 0 ? "mt-1 size-1.5 rounded-full bg-slate-400" : "mt-1 size-1.5 rounded-full bg-[#05ff5e]"} />
          <span className="text-slate-500">{event.time}</span>
          <span className="text-slate-300">{event.event}</span>
        </div>
      ))}
    </div>
  );
}

export function QuickActionsCard({ actions }: { actions: QuickActionItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {actions.map((action) => (
        <button className="h-10 rounded border border-slate-700 bg-[#041421] px-1 text-[7px] leading-tight text-slate-300" key={action.label}>
          <QuickActionIcon color={action.color} icon={action.icon} />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SiteInformationCard({ rows }: { rows: SiteInfoRow[] }) {
  return (
    <div className="grid grid-cols-[1fr_124px] gap-2 text-[8px]">
      <div className="grid grid-cols-[80px_1fr] gap-y-1">
        {rows.map((row) => (
          <div className="contents" key={row.label}>
            <span className="text-slate-500">{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="rounded bg-gradient-to-br from-sky-200 via-slate-300 to-slate-700" />
    </div>
  );
}

export function PortfolioMapCard({ sites }: { sites: PortfolioSite[] }) {
  const mappedSites = sites.filter((site) => site.lat != null && site.lng != null);

  return (
    <div className="relative h-full min-h-[200px] overflow-hidden rounded-md bg-[#03111d]">
      {mappedSites.length > 0 ? (
        <LeafletPortfolioMap sites={mappedSites} />
      ) : (
        <div className="grid h-full place-items-center px-6 text-center text-[11px] text-slate-400">
          Map coordinates are not stored for these DB sites yet.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-4 flex gap-5 text-[11px] text-slate-300">
        <span><Dot className="bg-[#05ff5e]" /> Healthy ({sites.filter((site) => site.status === "Healthy").length})</span>
        <span><Dot className="bg-yellow-300" /> Warning ({sites.filter((site) => site.status === "Warning").length})</span>
        <span><Dot className="bg-red-500" /> Critical (0)</span>
      </div>
    </div>
  );
}

export function AiEnergySummaryCard({ summary }: { summary: string[] }) {
  return (
    <>
      <div className="flex gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border border-[#05ff5e] text-sm text-[#05ff5e]">
          AI
        </div>
        <div className="space-y-2 text-[11px] leading-snug text-slate-300">
          {summary.map((item, index) => (
            <div className="flex items-start gap-1.5" key={item}>
              <span className={index === summary.length - 1 ? "text-yellow-300" : "text-[#05ff5e]"}>
                {index === summary.length - 1 ? "!" : "o"}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <a className="mt-4 inline-block rounded border border-[#05ff5e]/60 px-8 py-2 text-[11px] font-semibold text-[#05ff5e]" href="/enterprise/reports">
        View Full Report
      </a>
    </>
  );
}

export function NetworkHealthCard({ data }: { data: NetworkHealthData }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {data.metrics.map((metric) => (
          <EnterpriseGauge key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="text-[10px] text-slate-400">Overall Network Health</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xl font-semibold leading-none text-[#05ff5e]">{data.overall}</span>
          <div className="h-2 flex-1 rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-[#05ff5e]" style={{ width: data.overall }} />
          </div>
        </div>
      </div>
    </>
  );
}

export function EnterpriseSavingsTrendCard({ points }: { points: string }) {
  return (
    <div className="relative h-full min-h-[158px] overflow-hidden rounded bg-[#03111d] px-3 py-2">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:100%_25%,8.33%_100%]" />
      <svg className="relative h-full w-full" viewBox="0 0 370 96" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#05ff5e" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#05ff5e" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <polygon fill="url(#trendFill)" points={`0,96 ${points} 370,96`} />
        <polyline fill="none" points={points} stroke="#05ff5e" strokeWidth="2" />
        {parseTrendPoints(points).map(([x, y]) => <circle cx={x} cy={y} fill="#03111d" key={`${x}-${y}`} r="3" stroke="#05ff5e" strokeWidth="2" />)}
      </svg>
      <div className="absolute left-3 top-3 space-y-[16px] text-[10px] text-slate-400">
        <div>$250K</div>
        <div>$200K</div>
        <div>$150K</div>
        <div>$100K</div>
        <div>$50K</div>
      </div>
      <div className="absolute bottom-1 left-9 right-4 flex justify-between text-[10px] text-slate-400">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

export function TopSitesSavingsCard({ sites }: { sites: PortfolioSite[] }) {
  return (
    <>
      <div className="max-h-[132px] overflow-y-auto pr-1 [scrollbar-color:#0ea5b7_#061521] [scrollbar-width:thin]">
        <table className="w-full text-left text-[9px]">
          <thead className="sticky top-0 z-10 bg-[#092130] text-slate-400">
            <tr>
              <th className="px-2 py-1 font-medium">Site</th>
              <th className="px-2 py-1 font-medium">Annual Savings</th>
              <th className="px-2 py-1 font-medium">PF (Avg)</th>
              <th className="px-2 py-1 font-medium">THD (Avg)</th>
              <th className="px-2 py-1 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site, index) => (
              <tr className="border-b border-white/5" key={site.site}>
                <td className="px-2 py-1 text-slate-300">{index + 1}. {site.site}</td>
                <td className="px-2 py-1 text-slate-300">{site.annualSavings}</td>
                <td className="px-2 py-1 text-slate-300">{site.powerFactor}</td>
                <td className="px-2 py-1 text-slate-300">{site.thd}</td>
                <td className="px-2 py-1">
                  <span className={`inline-flex items-center gap-1.5 ${site.status === "Healthy" ? "text-[#05ff5e]" : "text-yellow-300"}`}>
                    <span className={`size-2 rounded-full ${site.status === "Healthy" ? "bg-[#05ff5e]" : "bg-yellow-300"}`} />
                    {site.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a className="mt-1 inline-block text-[11px] font-semibold text-[#05ff5e]" href="/enterprise/sites">
        View All Sites
      </a>
    </>
  );
}

export function TransformerCapacityOverviewCard({ data }: { data: TransformerCapacityData }) {
  return (
    <>
      <div className="grid grid-cols-[64px_76px_1fr] items-center gap-3">
        <div className="rounded bg-slate-800/70 p-2 text-center text-[9px] text-slate-400">
          Transformer
          <div className="mt-2 grid h-14 place-items-center rounded bg-gradient-to-b from-slate-700 to-slate-900">
            <TransformerSymbol />
          </div>
        </div>
        <EnterpriseMiniDonut value={data.utilization.replace("%", "")} />
        <div className="space-y-1 text-[8.5px] leading-tight text-slate-300">
          <p>Total Capacity</p>
          <p className="font-semibold text-white">{data.total}</p>
          <p><Dot className="bg-yellow-300" /> Loaded {data.loaded}</p>
          <p><Dot className="bg-[#2b7cff]" /> Available {data.available}</p>
          <p><Dot className="bg-[#05ff5e]" /> Recovered {data.recovered}</p>
        </div>
      </div>
      <a className="mt-3 inline-block text-[10px] font-semibold text-[#05ff5e]" href="/enterprise/transformers">
        View Transformer Fleet
      </a>
    </>
  );
}

export function HiddenCapacityRecoveredCard({ data }: { data: HiddenCapacityRecoveredData }) {
  return (
    <div className="grid h-full min-h-[126px] grid-cols-[1fr_72px] gap-3">
      <div>
        <div className="whitespace-nowrap text-[22px] font-semibold leading-none text-[#05ff5e]">{data.value}</div>
        <p className="mt-1 text-[9px] text-slate-400">Equivalent to:</p>
        <ul className="mt-2 space-y-1 text-[8.5px] leading-tight text-[#05ff5e]">
          {data.equivalents.map((equivalent) => (
            <li key={equivalent}>{equivalent}</li>
          ))}
        </ul>
      </div>
      <BarChart />
    </div>
  );
}

export function NetworkLossesReductionCard({ data }: { data: NetworkLossesReductionData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-300">
        <MetricBar label="Before ECBS" value={data.before} tone="yellow" width={data.beforeWidth} />
        <MetricBar label="After ECBS" value={data.after} tone="green" width={data.afterWidth} />
      </div>
      <div className="mt-4 text-[11px] text-slate-400">
        Reduction <span className="ml-3 whitespace-nowrap text-[28px] font-light text-[#05ff5e]">{data.reduction}</span>
      </div>
    </>
  );
}

export function EnterpriseDeviceHealthCard({ data }: { data: EnterpriseDeviceHealthData }) {
  return (
    <>
      <div className="grid grid-cols-[92px_1fr] items-center gap-4">
        <EnterpriseMiniDonut value={data.value.replace("%", "")} label="Healthy" />
        <div className="space-y-3 text-[10px]">
          {data.items.map((item) => (
            <EnterpriseLegend key={item.label} color={item.color} label={item.label} value={item.value} />
          ))}
        </div>
      </div>
      <a className="mt-3 inline-block text-[10px] font-semibold text-[#05ff5e]" href="/devices">
        View All Devices
      </a>
    </>
  );
}

export function DashboardFooter({ updatedAt, variant = "site" }: { updatedAt: string; variant?: "enterprise" | "site" }) {
  if (variant === "enterprise") {
    return (
      <footer className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
        <div className="mx-auto flex gap-5">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/support">Support</a>
        </div>
        <div>Data updated: {updatedAt} <span className="text-[#05ff5e]">Live</span></div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto flex h-[17px] items-center justify-between text-[8px] text-slate-500">
      <div className="mx-auto flex gap-6">
        <a className="text-[#05ff5e]" href="/privacy">Privacy Policy</a>
        <a className="text-[#05ff5e]" href="/terms">Terms of Service</a>
        <a className="text-[#05ff5e]" href="/support">Support</a>
      </div>
      <div>Data updated: {updatedAt} <span className="text-[#05ff5e]">Live</span></div>
    </footer>
  );
}

function Sparkline({ color = "#05ff5e", compact = false }: { color?: string; compact?: boolean }) {
  return (
    <svg className={compact ? "h-3 w-full" : "mt-1 h-3.5 w-full"} viewBox="0 0 112 26" aria-hidden="true">
      <polyline fill="none" points={sparkPoints} stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

function TrendChart({ color, labels, points }: { color: string; labels?: string[]; points: string }) {
  return (
    <div className="mt-1">
      <svg className="h-[58px] w-full" viewBox="0 0 308 100" aria-hidden="true">
        {[25, 50, 75].map((y) => <line key={y} x1="0" x2="308" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
        <polyline fill="none" points={points} stroke={color} strokeWidth="2" />
        <polyline fill="none" opacity="0.25" points={`${points} 308,100 0,100`} stroke={color} />
        {parseTrendPoints(points).map(([x, y]) => <circle cx={x} cy={y} fill="#061825" key={`${x}-${y}`} r="3" stroke={color} strokeWidth="2" />)}
      </svg>
      {labels && labels.length > 0 ? (
        <div className="mt-0.5 flex justify-between text-[7px] text-slate-500">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      ) : null}
    </div>
  );
}

function parseTrendPoints(points: string) {
  return points.split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return [x, y] as const;
  }).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

function Gauge({ label, small = false, value }: { label: string; small?: boolean; value: string }) {
  const size = small ? "size-14" : "size-24";

  return (
    <div className={`relative ${size} rounded-full bg-[conic-gradient(#05ff5e_0_75%,#263747_75%_100%)] p-2`}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#061825] text-center">
        <div>
          <div className={small ? "text-[12px] text-white" : "text-[24px] text-white"}>{value}</div>
          <div className="text-[7px] text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ accent = false, label, value }: TransformerMetric) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-1">
      <span className="text-slate-400">{label}</span>
      <span className={accent ? "text-[#05ff5e]" : "text-slate-100"}>{value}</span>
    </div>
  );
}

function Bar({ color, label, value }: CapacityRecoveryRow) {
  return (
    <div className="grid grid-cols-[1fr_46px_24px] items-center gap-1">
      <span className="truncate text-slate-400">{label}</span>
      <span className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color} 0 ${value}, #263747 ${value} 100%)` }} />
      <span className="text-right text-slate-300">{value}</span>
    </div>
  );
}

function LegendLine({ color, label, value }: HealthLegendItem) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-400">
        <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}

function NetworkLabel({ label, value }: NetworkNode) {
  return (
    <div>
      <div className="text-[7px] font-bold uppercase text-slate-200">{label}</div>
      <div className="text-[7px] font-semibold text-slate-300">{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ElectricalGlyph({ kind }: { kind: "switchgear" | "transformer" | "utility" }) {
  if (kind === "utility") {
    return (
      <svg aria-hidden="true" className="h-6 w-6 text-slate-300" viewBox="0 0 28 32">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
          <path d="M14 2 6 30M14 2l8 28M8 11h12M6 18h16M10 11l8 7M18 11l-8 7" />
        </g>
      </svg>
    );
  }

  if (kind === "transformer") {
    return (
      <svg aria-hidden="true" className="h-6 w-6 text-slate-300" viewBox="0 0 28 28">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
          <path d="M14 2v5M14 21v5M7 8l-3 3 3 3M21 8l3 3-3 3M8 14l3 3-3 3M20 14l-3 3 3 3" />
          <path d="M10 7h8v14h-8z" />
        </g>
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-6 w-6 text-slate-300" viewBox="0 0 28 28">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
        <rect height="18" rx="1.5" width="16" x="6" y="5" />
        <path d="M10 9h2M16 9h2M10 14h2M16 14h2M10 19h8" />
      </g>
    </svg>
  );
}

function QuickActionIcon({ color, icon }: { color: string; icon: QuickActionIconName }) {
  const paths: Record<QuickActionIconName, ReactNode> = {
    assessment: <path d="M6 4h8l2 2v12H6V4Zm8 0v3h3M8 9h3M8 12h4M8 15h3M14 11l4-4M18 7v3M18 7h-3" />,
    deployment: <path d="M11 3 18 7v8l-7 4-7-4V7l7-4Zm0 0v8M4 7l7 4 7-4M7 13l4 2 4-2" />,
    digitalTwin: <path d="M5 7h5v5H5V7Zm9 1h5v5h-5V8ZM8 14h5v5H8v-5Zm2-4h4M12 12v2M10 16H7" />,
    export: <path d="M5 4h9l4 4v11H5V4Zm9 0v5h4M8 13h7M12 10l3 3-3 3" />,
    maintenance: <path d="M12 6a6 6 0 0 1 4 10l2 2M9 3l2 4-4 2-2-4M8 15l4-4M5 18h6" />,
    note: <path d="M5 16v3h3L18 9l-3-3L5 16Zm8-8 3 3M6 5h8M6 9h5" />,
    proposal: <path d="M6 4h9l3 3v12H6V4Zm9 0v4h3M8 10h7M8 13h6M8 16h4" />,
    reports: <path d="M6 4h9l3 3v12H6V4Zm9 0v4h3M8 16h8M9 14v2M12 11v5M15 13v3" />,
  };

  return (
    <svg aria-hidden="true" className="mx-auto mb-0.5 h-4 w-4" viewBox="0 0 22 22">
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        {paths[icon]}
      </g>
    </svg>
  );
}

function EnterpriseGauge({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "cyan" }) {
  const color = tone === "cyan" ? "#1ed7ff" : "#05ff5e";

  return (
    <div className="min-w-0 text-center">
      <div
        className="mx-auto grid aspect-square w-full max-w-[74px] min-w-[46px] place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} 0deg 255deg, #0b2733 255deg 360deg)`,
        }}
      >
        <div className="grid size-[72%] place-items-center rounded-full bg-[#061521]">
          <div>
            <div className="text-[clamp(17px,2.6vw,24px)] font-light leading-none text-white">{value}</div>
            <div className="mt-1 text-[clamp(8px,1.3vw,10px)] text-slate-400">/100</div>
          </div>
        </div>
      </div>
      <div className="mt-1 text-[clamp(8px,1.1vw,10px)] leading-tight text-slate-300">{label}</div>
    </div>
  );
}

function EnterpriseMiniDonut({ value, label = "Loaded" }: { value: string; label?: string }) {
  return (
    <div
      className="grid aspect-square w-full max-w-[76px] min-w-[48px] place-items-center rounded-full"
      style={{ background: "conic-gradient(#05ff5e 0deg 260deg, #ffd000 260deg 315deg, #0b2733 315deg 360deg)" }}
    >
      <div className="grid size-[74%] place-items-center rounded-full bg-[#061521] text-center">
        <div>
          <div className="text-[clamp(12px,1.9vw,17px)] font-light leading-none text-white">{value}%</div>
          <div className="mt-0.5 text-[clamp(6px,0.9vw,8px)] uppercase text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function BarChart() {
  return (
    <div className="flex h-full items-end gap-3">
      {[42, 58, 76, 94].map((height, index) => (
        <div className="w-6 rounded-t bg-gradient-to-t from-[#0064ff] to-[#20d8ff]" key={height} style={{ height: `${height}%`, opacity: 0.55 + index * 0.12 }} />
      ))}
    </div>
  );
}

function MetricBar({
  label,
  value,
  tone,
  width,
}: {
  label: string;
  value: string;
  tone: "green" | "yellow";
  width: string;
}) {
  return (
    <div>
      <div className="text-slate-400">{label}</div>
      <div className="whitespace-nowrap text-[16px] font-light text-white">{value}</div>
      <div className="mt-2 h-2 rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${tone === "green" ? "bg-[#05ff5e]" : "bg-yellow-400"}`} style={{ width }} />
      </div>
    </div>
  );
}

function EnterpriseLegend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-slate-300">
      <span className="flex items-center gap-2">
        <span className={`size-3 rounded-full ${color}`} />
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`mr-1 inline-block size-2 rounded-full ${className}`} />;
}

function TransformerSymbol() {
  return (
    <svg aria-hidden="true" className="h-9 w-10 text-slate-300" viewBox="0 0 48 48">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
        <path d="M14 8v32M34 8v32" />
        <path d="M8 13h12M8 18h12M8 23h12M8 28h12M8 33h12" />
        <path d="M28 13h12M28 18h12M28 23h12M28 28h12M28 33h12" />
        <path d="M20 16h8M20 24h8M20 32h8" />
        <path d="M12 42h24" />
      </g>
    </svg>
  );
}
