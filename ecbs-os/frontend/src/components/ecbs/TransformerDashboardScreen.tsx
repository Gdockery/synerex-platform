import type { TransformerDashboardData, TransformerDetailRow, TransformerPhaseSummary } from "@/lib/trackingDashboardData";
import { DashboardFooter, DashboardHeader, DashboardKpiCard, DashboardPanel, TrendCard } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

export function TransformerDashboardScreen({ data }: { data: TransformerDashboardData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/transformers">
      <div className="flex h-[682px] flex-col overflow-hidden px-3 py-2">
        <DashboardHeader
          dateRange={data.dateRange}
          subtitle={`${data.siteName} / ${data.transformerName}`}
          title="Transformers"
          variant="enterprise"
        />

        <div className="mt-1.5 flex items-center justify-between border-b border-cyan-300/10 pb-1.5">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-100">{data.transformerName}</h1>
            <div className="text-[10px] text-slate-400">
              Rating: {formatNumber(data.ratingKva)} kVA <span className="mx-2 text-slate-600">|</span>
              Load: {formatNumber(data.loadKva)} kVA <span className="mx-2 text-slate-600">|</span>
              <span className={data.health === "Healthy" ? "text-[#05ff5e]" : "text-yellow-300"}>{data.health}</span>
            </div>
          </div>
          <div className="flex gap-2 text-[10px]">
            <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">Download Report</button>
            <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">Transformer Settings</button>
          </div>
        </div>

        <section className="mt-2 grid h-[78px] grid-cols-6 gap-1.5">
          {data.kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} kpi={kpi} variant="enterprise" />
          ))}
        </section>

        <section className="mt-2 grid h-[150px] grid-cols-[1.1fr_1fr_1fr] gap-2">
          <DashboardPanel title="KVA Load Trend" variant="enterprise">
            <TrendCard {...data.kvaTrend} />
          </DashboardPanel>
          <DashboardPanel title="Load Profile (1-Min)" variant="enterprise">
            <TrendCard {...data.loadProfile} />
          </DashboardPanel>
          <DashboardPanel title="Capacity & Utilization" variant="enterprise">
            <CapacityUtilization data={data} />
          </DashboardPanel>
        </section>

        <section className="mt-2 grid h-[124px] grid-cols-[1.1fr_1fr_1fr] gap-2">
          <DashboardPanel title="Phase Summary" variant="enterprise">
            <PhaseSummary phases={data.phaseSummary} />
          </DashboardPanel>
          <DashboardPanel title="Power Quality Snapshot" variant="enterprise">
            <DetailRows rows={data.powerQuality} />
          </DashboardPanel>
          <DashboardPanel title="Transformer Details" variant="enterprise">
            <DetailRows rows={data.details} compact />
          </DashboardPanel>
        </section>

        <section className="mt-2 grid h-[116px] grid-cols-[1.35fr_1fr] gap-2">
          <DashboardPanel title="Capacity Recovery Over Time" variant="enterprise">
            <TrendCard {...data.recoveryTrend} />
          </DashboardPanel>
          <DashboardPanel title="Savings From This Transformer" variant="enterprise">
            <DetailRows rows={data.savingsRows} highlightLast />
          </DashboardPanel>
        </section>

        <DashboardFooter updatedAt={data.updatedAt} variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function CapacityUtilization({ data }: { data: TransformerDashboardData }) {
  return (
    <div className="grid h-[116px] grid-cols-[80px_1fr] items-center gap-3">
      <MiniGauge label="Loaded" value={data.utilizationPct} />
      <div className="space-y-1.5 text-[10px]">
        <Metric label="Current Load" value={`${formatNumber(data.loadKva)} kVA (${formatNumber(data.utilizationPct)}%)`} />
        <Metric label="Available Capacity" value={`${formatNumber(data.availableCapacityKva)} kVA`} accent="#29b6f6" />
        <Metric label="Recovered Capacity" value={`${formatNumber(data.capacityRecoveredKva)} kVA`} accent="#05ff5e" />
        <Metric label="Rating" value={`${formatNumber(data.ratingKva)} kVA`} />
      </div>
    </div>
  );
}

function PhaseSummary({ phases }: { phases: TransformerPhaseSummary[] }) {
  return (
    <div className="h-[92px] overflow-hidden">
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

function DetailRows({
  compact = false,
  highlightLast = false,
  rows,
}: {
  compact?: boolean;
  highlightLast?: boolean;
  rows: TransformerDetailRow[];
}) {
  return (
    <div className={compact ? "grid grid-cols-2 gap-x-3 gap-y-1 text-[8px]" : "space-y-1.5 text-[10px]"}>
      {rows.map((row, index) => (
        <Metric
          accent={highlightLast && index === rows.length - 1 ? "#05ff5e" : undefined}
          key={row.label}
          label={row.label}
          value={row.value}
        />
      ))}
    </div>
  );
}

function Metric({ accent, label, value }: { accent?: string; label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-white/5 pb-1">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-100" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}

function MiniGauge({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative mx-auto size-20 rounded-full p-2" style={{ background: `conic-gradient(#05ff5e 0 ${clamped}%, #243447 ${clamped}% 100%)` }}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#061825] text-center">
        <div>
          <div className="text-[20px] font-light leading-none text-white">{formatNumber(clamped)}%</div>
          <div className="mt-1 text-[8px] text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
