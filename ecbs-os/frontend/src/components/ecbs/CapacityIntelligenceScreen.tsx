import type { CapacityIntelligenceAsset, CapacityIntelligenceData } from "@/lib/trackingDashboardData";
import { DashboardFooter, DashboardHeader, DashboardKpiCard, DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

export function CapacityIntelligenceScreen({
  activeHref = "/enterprise/capacity-intelligence",
  data,
}: {
  activeHref?: string;
  data: CapacityIntelligenceData;
}) {
  return (
    <EcbsAppShell activeHref={activeHref}>
      <div className="flex h-[682px] flex-col overflow-hidden px-3 py-2">
        <DashboardHeader
          dateRange={data.dateRange}
          subtitle={`${data.siteName} - Engineering Analytics`}
          title="Capacity Intelligence"
          variant="enterprise"
        />

        {data.state !== "data" ? (
          <div className="mt-3 rounded border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-sm text-yellow-100">
            Capacity Intelligence data is unavailable.
          </div>
        ) : null}

        <section className="mt-2 grid h-[78px] grid-cols-5 gap-2">
          {data.kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} kpi={kpi} variant="enterprise" />
          ))}
        </section>

        <section className="mt-2 grid h-[190px] grid-cols-[1.75fr_0.95fr_1fr] gap-2">
          <DashboardPanel title="Capacity Utilization Over Time" variant="enterprise">
            <CapacityTrend data={data} />
          </DashboardPanel>

          <DashboardPanel title="Capacity Recovery Impact" variant="enterprise">
            <RecoveryImpact data={data} />
          </DashboardPanel>

          <DashboardPanel title="Equivalent Capacity Gain" variant="enterprise">
            <EquivalentCapacity data={data} />
          </DashboardPanel>
        </section>

        <section className="mt-2 grid h-[228px] grid-cols-[2fr_0.9fr] gap-2">
          <DashboardPanel title="Capacity By Asset" variant="enterprise">
            <CapacityAssetTable assets={data.assets} />
          </DashboardPanel>

          <DashboardPanel title="Capacity Health Score" variant="enterprise">
            <CapacityHealth data={data} />
          </DashboardPanel>
        </section>

        <section className="mt-2 grid h-[82px] grid-cols-4 gap-2">
          {data.callouts.map((callout) => (
            <div className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2" key={callout.label}>
              <div className="text-[17px] font-semibold leading-none text-[#05ff5e]">{callout.icon}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">{callout.label}</div>
              <div className="mt-1 text-[10px] leading-snug text-slate-400">{callout.value}</div>
            </div>
          ))}
        </section>

        <DashboardFooter updatedAt={data.updatedAt} variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function CapacityTrend({ data }: { data: CapacityIntelligenceData }) {
  const chartMax = Math.max(
    data.installedKva,
    ...data.trend.flatMap((point) => [point.installed, point.available, point.used]),
    1,
  );
  const installedPoints = trendPoints(data.trend.map((point) => point.installed), chartMax);
  const availablePoints = trendPoints(data.trend.map((point) => point.available), chartMax);
  const usedPoints = trendPoints(data.trend.map((point) => point.used), chartMax);

  return (
    <div className="grid h-[158px] grid-cols-[34px_1fr_66px] gap-2">
      <div className="flex flex-col justify-between py-1 text-right text-[9px] text-slate-500">
        <span>{formatCompact(chartMax)}</span>
        <span>{formatCompact(chartMax / 2)}</span>
        <span>0</span>
      </div>
      <div>
        <svg className="h-[112px] w-full" viewBox="0 0 500 110" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="capacityUsedFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffd740" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffd740" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[28, 56, 84].map((y) => (
            <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />
          ))}
          <polyline fill="none" points={installedPoints} stroke="rgba(41,182,246,0.45)" strokeDasharray="4 4" strokeWidth="1.2" />
          <polyline fill="none" points={availablePoints} stroke="#05ff5e" strokeWidth="1.8" />
          <polygon fill="url(#capacityUsedFill)" points={`0,110 ${usedPoints} 500,110`} />
          <polyline fill="none" points={usedPoints} stroke="#ffd740" strokeWidth="2.2" />
        </svg>
        <div className="mt-1 flex justify-between text-[8px] text-slate-500">
          {data.trend.filter((_, index) => index % 3 === 0).map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
        <div className="mt-1 flex gap-4 text-[9px] text-slate-400">
          <Legend color="#ffd740" label="Utilized kVA" />
          <Legend color="#05ff5e" label="Available kVA" />
          <Legend color="#29b6f6" label="Connected kVA" />
        </div>
      </div>
      <div className="flex flex-col justify-between py-1 text-[9px] font-semibold">
        <span className="text-[#29b6f6]">{formatCompact(data.installedKva)} kVA</span>
        <span className="text-[#05ff5e]">{formatCompact(data.availableKva + data.recoveredKva)} kVA</span>
        <span className="text-[#ffd740]">{formatCompact(data.loadKva)} kVA</span>
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
    <div className="flex h-[150px] items-end justify-center gap-4 text-center">
      <CapacityColumn
        bars={[
          { color: "#ef4444", height: beforeOver },
          { color: "#64748b", height: beforeUtil },
        ]}
        label="Before ECBS"
        sublabel="Utilized / Over Capacity"
        value={`${formatCompact(beforeLoad)} kVA`}
      />
      <div className="pb-16 text-2xl text-slate-600">&gt;</div>
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
  const rows = [
    { color: "#29b6f6", label: `${Math.max(1, Math.floor(data.recoveredKva * 0.35 / 37.3))} x 50 HP Motors`, value: data.recoveredKva * 0.35 },
    { color: "#ab47bc", label: `${Math.max(1, Math.floor(data.recoveredKva * 0.25 / 10))} Server Racks`, value: data.recoveredKva * 0.25 },
    { color: "#05ff5e", label: `${Math.max(1, Math.floor(data.recoveredKva * 0.2 / 7.2))} EV Chargers`, value: data.recoveredKva * 0.2 },
    { color: "#ffd740", label: "Additional HVAC", value: data.recoveredKva * 0.12 },
    { color: "#94a3b8", label: "Other Capacity", value: Math.max(0, data.recoveredKva * 0.08) },
  ];

  return (
    <div className="h-[154px] space-y-1.5 overflow-y-auto pr-1 [scrollbar-color:#0ea5b7_#061521] [scrollbar-width:thin]">
      {rows.map((row) => (
        <div className="grid grid-cols-[18px_1fr_50px] items-center rounded border border-white/5 bg-white/[0.03] px-2 py-1.5 text-[10px]" key={row.label}>
          <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="truncate text-slate-300">{row.label}</span>
          <span className="text-right font-semibold text-slate-400">{formatCompact(row.value)} kVA</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-white/10 pt-1.5 text-[10px] font-semibold text-slate-300">
        <span>Total Equivalent</span>
        <span className="text-[#05ff5e]">{formatCompact(data.recoveredKva)} kVA</span>
      </div>
    </div>
  );
}

function CapacityAssetTable({ assets }: { assets: CapacityIntelligenceAsset[] }) {
  return (
    <div className="h-[194px] overflow-auto pr-1 [scrollbar-color:#0ea5b7_#061521] [scrollbar-width:thin]">
      <table className="w-full text-left text-[9px]">
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
          {assets.map((asset) => (
            <tr className="border-b border-white/5" key={asset.name}>
              <td className="px-2 py-1 text-slate-200">
                <div className="font-semibold">{asset.name}</div>
                <div className="text-[8px] text-slate-500">{asset.type}</div>
              </td>
              <td className="px-2 py-1 text-slate-300">{asset.connectedKva}</td>
              <td className="px-2 py-1 text-slate-300">{asset.utilizedKva}</td>
              <td className="px-2 py-1 font-semibold" style={{ color: utilizationColor(asset.utilizationValue) }}>{asset.utilizationPct}</td>
              <td className="px-2 py-1 text-slate-300">{asset.availableKva}</td>
              <td className="px-2 py-1 text-[#05ff5e]">{asset.recoveredKva}</td>
              <td className="px-2 py-1">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <span className="size-2 rounded-full" style={{ backgroundColor: utilizationColor(asset.utilizationValue) }} />
                  {asset.health}
                </span>
              </td>
              <td className="px-2 py-1">
                <svg className="h-5 w-14" viewBox="0 0 60 22" aria-hidden="true">
                  <polyline fill="none" points={asset.sparkline} stroke={utilizationColor(asset.utilizationValue)} strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CapacityHealth({ data }: { data: CapacityIntelligenceData }) {
  const color = utilizationColor(100 - data.capacityHealthScore);

  return (
    <div className="flex h-[194px] flex-col items-center gap-2">
      <svg className="h-24 w-24" viewBox="0 0 100 100" aria-hidden="true">
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
      <div className="w-full space-y-1">
        {data.subScores.map((score) => (
          <div className="grid grid-cols-[86px_1fr_38px] items-center gap-2 text-[9px]" key={score.label}>
            <span className="text-slate-400">{score.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <span className="block h-full rounded-full bg-[#05ff5e]" style={{ width: `${score.value}%` }} />
            </span>
            <span className="text-right font-semibold text-[#05ff5e]">{score.value}/100</span>
          </div>
        ))}
      </div>
      <div className="w-full rounded border border-[#05ff5e]/10 bg-[#05ff5e]/5 px-2 py-1 text-[9px] leading-snug text-slate-400">
        {data.keyInsight}
      </div>
    </div>
  );
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
    <div className="flex flex-col items-center gap-1">
      <div className={`text-[14px] font-bold ${valueClass}`}>{value}</div>
      <div className="flex h-24 w-12 flex-col-reverse overflow-hidden rounded border border-white/10">
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
