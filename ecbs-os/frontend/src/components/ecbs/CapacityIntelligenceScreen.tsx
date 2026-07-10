import type { CapacityIntelligenceAsset, CapacityIntelligenceData } from "@/lib/trackingDashboardData";
import { DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

export function CapacityIntelligenceScreen({
  activeHref = "/enterprise/capacity-intelligence",
  data,
}: {
  activeHref?: string;
  data: CapacityIntelligenceData;
}) {
  const screenData = data;

  return (
    <EcbsAppShell activeHref={activeHref}>
      <div className="flex h-screen min-h-0 flex-col overflow-hidden px-4 py-3">
        <CapacityPortalHeader data={screenData} />

        <section className="mt-3 grid h-[100px] shrink-0 grid-cols-5 gap-3">
          {screenData.kpis.map((kpi) => (
            <CapacityWideKpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>

        <section className="mt-3 grid h-[250px] shrink-0 grid-cols-[1.75fr_0.95fr_1fr] gap-3">
          <DashboardPanel title="Capacity Utilization Over Time" variant="enterprise">
            <CapacityTrend data={screenData} />
          </DashboardPanel>

          <DashboardPanel title="Capacity Recovery Impact" variant="enterprise">
            <RecoveryImpact data={screenData} />
          </DashboardPanel>

          <DashboardPanel title="Equivalent Capacity Gain" variant="enterprise">
            <EquivalentCapacity data={screenData} />
          </DashboardPanel>
        </section>

        <section className="mt-3 grid h-[260px] shrink-0 grid-cols-[2fr_0.9fr] gap-3">
          <DashboardPanel title="Capacity By Asset" variant="enterprise">
            <CapacityAssetTable assets={screenData.assets} />
          </DashboardPanel>

          <DashboardPanel title="Capacity Health Score" variant="enterprise">
            <CapacityHealth data={screenData} />
          </DashboardPanel>
        </section>

        <section className="mt-3 grid h-[92px] shrink-0 grid-cols-4 gap-3">
          {screenData.callouts.map((callout) => (
            <CapacityCalloutCard callout={callout} key={callout.label} />
          ))}
        </section>

        <CapacityReferenceFooter updatedAt={screenData.updatedAt} />
      </div>
    </EcbsAppShell>
  );
}

function CapacityPortalHeader({ data }: { data: CapacityIntelligenceData }) {
  return (
    <header className="shrink-0">
      <div className="flex h-[46px] items-center justify-between border-b border-cyan-300/10">
        <div>
          <h1 className="text-[20px] font-semibold uppercase leading-none tracking-wide text-slate-100">XECO Energy Intelligence Portal</h1>
          <p className="mt-1 text-[11px] text-slate-300">Capacity Intelligence</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-300">
          <button className="w-[142px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">{data.siteName}⌄</button>
          <button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">▣ {data.dateRange}⌄</button>
          <span className="relative grid size-7 place-items-center rounded-full border border-slate-600">♟<span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] font-bold text-[#020a12]">3</span></span>
          <span className="grid size-7 place-items-center rounded-full border border-slate-600">?</span>
          <span className="grid size-8 place-items-center rounded-full bg-slate-700 text-sm">●</span>
          <span className="leading-tight"><b className="text-slate-100">Greg Dockery</b><br /><span className="text-slate-400">Administrator</span></span>
          <span>⌄</span>
        </div>
      </div>

      <div className="flex h-[58px] items-center justify-between">
        <div>
          <h2 className="text-2xl font-light leading-none text-slate-100">Capacity Intelligence</h2>
          <p className="mt-1 max-w-[620px] text-[11px] leading-snug text-slate-300">Understand how much electrical capacity you have, how much you&apos;re using, and how much has been recovered with XECO.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-slate-300">Asset Scope</span>
          <button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left text-slate-200">Entire Site⌄</button>
          <button className="grid size-9 place-items-center rounded border border-cyan-300/15 bg-[#061421] text-slate-300">▽</button>
          <button className="ml-10 rounded border border-cyan-300/15 bg-[#061421] px-4 py-2 text-slate-200">⇩ Export Report</button>
        </div>
      </div>
    </header>
  );
}

function CapacityWideKpiCard({ kpi }: { kpi: CapacityIntelligenceData["kpis"][number] }) {
  const color = kpi.color ?? "#05ff5e";

  return (
    <article className="grid grid-cols-[54px_1fr] items-center gap-3 rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_22px_rgba(0,220,255,0.06)]">
      <span className="grid size-11 place-items-center rounded-full text-lg font-bold text-white shadow-[0_0_20px_currentColor]" style={{ backgroundColor: color, color }}>
        {kpi.icon ?? kpi.label.charAt(0)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[8px] font-semibold uppercase tracking-wide text-slate-300">{kpi.label}</div>
        <div className="mt-1 text-[22px] font-light leading-none text-white">{kpi.value}</div>
        <div className="mt-1 truncate text-[9px] leading-none text-slate-400">{kpi.detail}</div>
      </div>
    </article>
  );
}

function CapacityCalloutCard({ callout }: { callout: CapacityIntelligenceData["callouts"][number] }) {
  return (
    <article className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
      <span className="grid size-9 place-items-center rounded-full border border-[#05ff5e]/40 bg-[#063b27]/60 text-[18px] font-semibold leading-none text-[#05ff5e]">{callout.icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{callout.label}</div>
        <div className="mt-1 text-[11px] leading-snug text-slate-400">{callout.value}</div>
      </div>
    </article>
  );
}

function CapacityReferenceFooter({ updatedAt }: { updatedAt: string }) {
  return (
    <footer className="mt-auto flex h-[34px] shrink-0 items-center justify-between border-t border-cyan-300/10 text-[10px] text-slate-500">
      <span>© 2025 XECO Energy Corporation. All rights reserved.</span>
      <span className="flex gap-8 text-[#05ff5e]"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/support">Support</a></span>
      <span>Data updated: {updatedAt} <b className="ml-4 text-[#05ff5e]">▥ Live</b></span>
    </footer>
  );
}

function CapacityTrend({ data }: { data: CapacityIntelligenceData }) {
  if (!data.trend.length) {
    return <CapacityNoData message={data.keyInsight} />;
  }

  const chartMax = Math.max(
    data.installedKva,
    ...data.trend.flatMap((point) => [point.installed, point.available, point.used]),
    1,
  );
  const installedPoints = trendPoints(data.trend.map((point) => point.installed), chartMax);
  const availablePoints = trendPoints(data.trend.map((point) => point.available), chartMax);
  const usedPoints = trendPoints(data.trend.map((point) => point.used), chartMax);

  return (
    <div className="grid h-full grid-cols-[42px_1fr_72px] gap-3">
      <div className="flex flex-col justify-between py-2 text-right text-[10px] text-slate-500">
        <span>{formatCompact(chartMax)}</span>
        <span>{formatCompact(chartMax / 2)}</span>
        <span>0</span>
      </div>
      <div>
          <svg className="h-[175px] w-full" viewBox="0 0 500 110" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="capacityUsedFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffd740" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffd740" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[28, 56, 84].map((y) => (
            <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />
          ))}
          <polyline fill="none" points={installedPoints} stroke="rgba(148,163,184,0.65)" strokeDasharray="4 4" strokeWidth="1.2" />
          <polyline fill="none" points={usedPoints} stroke="#05ff5e" strokeWidth="2.2" />
          <polygon fill="url(#capacityUsedFill)" points={`0,110 ${availablePoints} 500,110`} />
          <polyline fill="none" points={availablePoints} stroke="#147dff" strokeWidth="1.8" />
        </svg>
        <div className="mt-2 flex justify-between text-[9px] text-slate-500">
          {data.trend.filter((_, index) => index % 3 === 0).map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
        <div className="mt-2 flex gap-5 text-[10px] text-slate-400">
          <Legend color="#05ff5e" label="Utilized Capacity (kVA)" />
          <Legend color="#147dff" label="Available Capacity (kVA)" />
          <Legend color="#94a3b8" label="Connected Capacity (kVA)" />
        </div>
      </div>
      <div className="flex flex-col justify-between py-2 text-[10px] font-semibold">
        <span className="text-slate-300">{formatCompact(data.installedKva)} kVA</span>
        <span className="text-[#05ff5e]">{formatCompact(data.loadKva)} kVA</span>
        <span className="text-[#147dff]">{formatCompact(data.availableKva)} kVA</span>
      </div>
    </div>
  );
}

function RecoveryImpact({ data }: { data: CapacityIntelligenceData }) {
  const beforeLoad = data.loadKva + data.hiddenKva;
  const beforeOver = beforeLoad > data.installedKva ? ((beforeLoad - data.installedKva) / beforeLoad) * 100 : 0;
  const beforeUtil = beforeLoad > 0 ? Math.min(100, (data.installedKva / Math.max(data.installedKva, beforeLoad)) * 100) : 50;
  const afterRecovery = data.installedKva > 0 ? Math.max(4, Math.min(95, (data.recoveredKva / data.installedKva) * 100)) : 4;
  const afterUtil = data.installedKva > 0 ? Math.max(4, Math.min(95, (data.loadKva / data.installedKva) * 100)) : 50;

  return (
    <div className="flex h-full items-end justify-center gap-8 text-center">
      <CapacityColumn
        bars={[
          { color: "#ef4444", height: beforeOver },
          { color: "#64748b", height: beforeUtil },
        ]}
        label="Before ECBS"
        sublabel="Utilized / Over Capacity"
        value={`${formatCompact(beforeLoad)} kVA`}
      />
      <div className="pb-[92px] text-2xl text-slate-600">&gt;</div>
      <CapacityColumn
        bars={[
          { color: "#05ff5e", height: afterRecovery },
          { color: "#64748b", height: afterUtil },
        ]}
        label="After ECBS"
        sublabel={`${formatCompact(data.recoveredKva)} kVA recovered`}
        value={`${formatCompact(data.loadKva)} kVA`}
        valueClass="text-[#05ff5e]"
      />
    </div>
  );
}

function EquivalentCapacity({ data }: { data: CapacityIntelligenceData }) {
  if (data.recoveredKva <= 0) {
    return <CapacityNoData message="No approved equivalent-capacity conversion source was found. Recovered capacity is No Data." />;
  }

  const rows = [
    { color: "#05ff5e", label: "Recovered Capacity", value: data.recoveredKva },
    { color: "#147dff", label: "Available Capacity After Recovery", value: data.availableKva + data.recoveredKva },
  ];
  const equivalentTotal = rows.reduce((total, row) => total + row.value, 0);

  return (
    <div className="h-full space-y-1.5 overflow-y-auto pr-1 [scrollbar-color:#0ea5b7_#061521] [scrollbar-width:thin]">
      {rows.map((row) => (
        <div className="grid grid-cols-[24px_1fr_64px] items-center rounded border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px]" key={row.label}>
          <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="truncate text-slate-300">{row.label}</span>
          <span className="text-right font-semibold text-slate-400">{formatCompact(row.value)} kVA</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-white/10 pt-1.5 text-[11px] font-semibold text-slate-300">
        <span>Total Equivalent</span>
        <span className="text-[#05ff5e]">{formatCompact(equivalentTotal)} kVA</span>
      </div>
    </div>
  );
}

function CapacityAssetTable({ assets }: { assets: CapacityIntelligenceAsset[] }) {
  const totals = assets.reduce((sum, asset) => ({
    available: sum.available + parseCapacityNumber(asset.availableKva),
    connected: sum.connected + parseCapacityNumber(asset.connectedKva),
    recovered: sum.recovered + parseCapacityNumber(asset.recoveredKva),
    utilized: sum.utilized + parseCapacityNumber(asset.utilizedKva),
  }), { available: 0, connected: 0, recovered: 0, utilized: 0 });
  const totalUtilization = totals.connected > 0 ? totals.utilized / totals.connected * 100 : 0;

  return (
    <div className="h-full overflow-auto pr-1 [scrollbar-color:#0ea5b7_#061521] [scrollbar-width:thin]">
      <table className="w-full text-left text-[8.5px]">
        <thead className="sticky top-0 z-10 bg-[#092130] text-slate-400">
          <tr>
            <th className="px-2 py-1 font-medium">Asset</th>
            <th className="px-2 py-1 font-medium">Connected</th>
            <th className="px-2 py-1 font-medium">Utilized</th>
            <th className="px-2 py-1 font-medium">Util %</th>
            <th className="px-2 py-1 font-medium">Available</th>
            <th className="px-2 py-1 font-medium">Recovered</th>
            <th className="px-2 py-1 font-medium">Health</th>
            <th className="px-2 py-1 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {!assets.length ? (
            <tr className="border-b border-white/5">
              <td className="px-2 py-8 text-center text-slate-300" colSpan={8}>No applicable capacity assets were found in tracking.</td>
            </tr>
          ) : null}
          {assets.map((asset) => (
            <tr className="border-b border-white/5" key={asset.name}>
              <td className="px-2 py-[3px] font-semibold text-slate-200">{asset.name}</td>
              <td className="px-2 py-[3px] text-slate-300">{asset.connectedKva}</td>
              <td className="px-2 py-[3px] text-slate-300">{asset.utilizedKva}</td>
              <td className="px-2 py-[3px] font-semibold" style={{ color: utilizationColor(asset.utilizationValue) }}>{asset.utilizationPct}</td>
              <td className="px-2 py-[3px] text-slate-300">{asset.availableKva}</td>
              <td className="px-2 py-[3px] text-[#05ff5e]">{asset.recoveredKva}</td>
              <td className="px-2 py-[3px]">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <span className="size-2 rounded-full" style={{ backgroundColor: utilizationColor(asset.utilizationValue) }} />
                  {asset.health}
                </span>
              </td>
              <td className="px-2 py-[3px]">
                <svg className="h-4 w-14" viewBox="0 0 60 22" aria-hidden="true">
                  <polyline fill="none" points={asset.sparkline} stroke={utilizationColor(asset.utilizationValue)} strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </td>
            </tr>
          ))}
          <tr className="border-t border-white/10 font-semibold text-slate-100">
            <td className="px-2 py-1">TOTAL</td>
            <td className="px-2 py-1">{assets.length ? formatCompact(totals.connected) : "No Data"}</td>
            <td className="px-2 py-1">{assets.length ? formatCompact(totals.utilized) : "No Data"}</td>
            <td className="px-2 py-1 text-[#ffd740]">{assets.length ? `${formatCompact(totalUtilization)}%` : "No Data"}</td>
            <td className="px-2 py-1">{assets.length ? formatCompact(totals.available) : "No Data"}</td>
            <td className="px-2 py-1 text-[#05ff5e]">{assets.length ? formatCompact(totals.recovered) : "No Data"}</td>
            <td className="px-2 py-1">—</td>
            <td className="px-2 py-1" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CapacityHealth({ data }: { data: CapacityIntelligenceData }) {
  const color = utilizationColor(100 - data.capacityHealthScore);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-[126px_1fr] items-center gap-4">
        <svg className="h-[118px] w-[118px]" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" fill="none" r="36" stroke="rgba(148,163,184,0.18)" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            fill="none"
            r="36"
            stroke={color}
            strokeDasharray={`${(Math.PI * 72 * data.capacityHealthScore / 100).toFixed(1)} ${(Math.PI * 72).toFixed(1)}`}
            strokeLinecap="round"
            strokeWidth="10"
            transform="rotate(-90 50 50)"
          />
          <text fill="white" fontSize="20" fontWeight="700" textAnchor="middle" x="50" y="48">{Math.round(data.capacityHealthScore)}</text>
          <text fill="rgba(203,213,225,0.7)" fontSize="7" textAnchor="middle" x="50" y="60">{healthRating(data.capacityHealthScore)}</text>
        </svg>
        <div className="space-y-2">
          {data.subScores.map((score) => (
            <div className="grid grid-cols-[112px_1fr_48px] items-center gap-2 text-[10px]" key={score.label}>
              <span className="text-slate-400">{score.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <span className="block h-full rounded-full bg-[#05ff5e]" style={{ width: `${score.value}%` }} />
              </span>
              <span className="text-right font-semibold text-[#05ff5e]">{score.value}/100</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full rounded border border-[#05ff5e]/10 bg-[#05ff5e]/5 px-3 py-2 text-[10px] leading-snug text-slate-400">
        {data.keyInsight}
      </div>
    </div>
  );
}

function CapacityNoData({ message }: { message: string }) {
  return <div className="grid h-full place-items-center rounded border border-amber-400/25 bg-amber-500/8 p-4 text-center text-[10px] leading-relaxed text-amber-200">{message || "No Data"}</div>;
}

function parseCapacityNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function CapacityColumn({
  bars,
  label,
  sublabel,
  value,
  valueClass = "text-white",
}: {
  bars: { color: string; height: number }[];
  label: string;
  sublabel: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`text-[14px] font-bold ${valueClass}`}>{value}</div>
      <div className="flex h-[150px] w-[62px] flex-col-reverse overflow-hidden rounded border border-white/10">
        {bars.filter((bar) => bar.height > 0).map((bar) => (
          <div key={bar.color} style={{ backgroundColor: bar.color, flex: bar.height }} />
        ))}
      </div>
      <div className="text-[10px] font-semibold text-slate-300">{label}</div>
      <div className="text-[8px] text-slate-500">{sublabel}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function trendPoints(values: number[], max: number) {
  const lastIndex = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = (index / lastIndex) * 500;
      const y = 104 - (value / max) * 94;
      return `${x.toFixed(1)},${Math.max(6, Math.min(104, y)).toFixed(1)}`;
    })
    .join(" ");
}

function formatCompact(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  });
}

function utilizationColor(value: number) {
  if (value >= 85) {
    return "#ef4444";
  }

  if (value >= 70) {
    return "#ffd740";
  }

  return "#05ff5e";
}

function healthRating(value: number) {
  if (value >= 85) {
    return "Excellent";
  }

  if (value >= 70) {
    return "Good";
  }

  if (value >= 50) {
    return "Fair";
  }

  return "Needs Attention";
}
