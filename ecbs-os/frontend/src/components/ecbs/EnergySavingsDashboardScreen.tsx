import type { ReactNode } from "react";
import type { CapacityIntelligenceData } from "@/lib/trackingDashboardData";
import { DashboardHeader, DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

type EnergySavingsScreenProps = {
  data?: CapacityIntelligenceData;
};

function formatKva(value?: number) {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return "No Data";
  if (raw >= 1000) return `${(raw / 1000).toFixed(2)} MVA`;
  return `${raw.toLocaleString("en-US", { maximumFractionDigits: 0 })} kVA`;
}

function formatCurrencyValue(value?: number) {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return "No Data";
  return raw.toLocaleString("en-US", { currency: "USD", maximumFractionDigits: 0, style: "currency" });
}

function formatPctValue(value?: number) {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return "No Data";
  return `${raw.toFixed(1)}%`;
}

function energyDateRange(data?: CapacityIntelligenceData) {
  return data ? `Tracking DB • ${data.updatedAt}` : "Tracking DB unavailable";
}

function hasCapacityData(data?: CapacityIntelligenceData) {
  return Boolean(data && data.state === "data");
}

function annualBenefitValue(data?: CapacityIntelligenceData) {
  return data?.annualBenefit && data.annualBenefit !== "$0" ? data.annualBenefit : "No Data";
}

function energyKpis(data?: CapacityIntelligenceData) {
  return [
    ["Lifetime Savings", "No Data", "No approved lifetime rollup", "green"],
    ["Savings This Year", annualBenefitValue(data), "Latest savings_intelligence row", "blue"],
    ["Savings This Month", "No Data", "No approved monthly rollup", "cyan"],
    ["Savings Today", "No Data", "No approved daily rollup", "yellow"],
    ["Capacity Recovered", formatKva(data?.recoveredKva), "Latest capacity_intelligence row", "cyan"],
    ["Deferred Capital Value", formatCurrencyValue(data?.deferredCapitalValue), "Latest capacity_intelligence row", "purple"],
  ];
}

function energyBaselineRows(data?: CapacityIntelligenceData) {
  return [
    ["Energy (kWh)", "No Data", "No Data", "No baseline energy contract"],
    ["Peak Demand (kW)", "No Data", "No Data", "No approved demand baseline"],
    ["kVA Demand (kVA)", "No Data", formatKva(data?.loadKva), "Current direct only"],
    ["Power Factor (avg)", "No Data", "No Data", "No PF baseline contract"],
    ["Current Balance Index", "No Data", "No Data", "No baseline CBI contract"],
    ["Avoidable Cost ($)", "No Data", formatCurrencyValue(data?.deferredCapitalValue), "Deferred value direct only"],
    ["Annual Utility Cost", "No Data", "No Data", "No utility-cost source"],
  ];
}

function NoDataBlock({ message = "No Data" }: { message?: string }) {
  return <div className="grid h-full place-items-center px-4 text-center text-[9px] leading-snug text-slate-400">{message}</div>;
}

export function EnergySavingsDashboardScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="flex h-screen min-h-0 flex-col overflow-hidden px-4 py-3">
        <DashboardHeader dateRange={energyDateRange(data)} subtitle="Real-Time Intelligence. Measurable Value. Continuous Improvement." title="Energy & Savings Dashboard™" />

        <section className="mt-2 grid h-[86px] shrink-0 grid-cols-6 gap-3">
          {energyKpis(data).map(([label, value, detail, tone]) => <SavingsKpi detail={detail} key={label} label={label} tone={tone} value={value} />)}
        </section>

        <section className="mt-3 grid h-[198px] shrink-0 grid-cols-[0.7fr_1.3fr] gap-3">
          <DashboardPanel title="ECBS Value Created - Real Time" variant="enterprise">
            <div className="text-[9px] text-slate-400">Savings are calculated in real time vs. approved baseline.</div>
            <div className="mt-3 text-[11px] uppercase text-slate-400">Current Savings Rate</div>
            <div className="text-[38px] leading-none text-[#05ff5e]">$3.72 <span className="text-lg text-slate-400">/ Minute</span></div>
            <div className="mt-4 grid grid-cols-4 gap-3 text-center text-[11px]">
              {["$223|/ Hour", "$5,352|/ Day", "$160,560|/ Month", "$1,926,720|/ Year"].map((item) => {
                const [value, label] = item.split("|");
                return <div className="rounded border border-cyan-300/10 bg-[#061421] p-3" key={item}><b className="text-slate-200">{value}</b><br /><span className="text-slate-500">{label}</span></div>;
              })}
            </div>
            <div className="mt-3 text-[9px] text-slate-400">Every minute. Every hour. Every day. <span className="text-[#05ff5e]">Real measurable value.</span></div>
          </DashboardPanel>
          <DashboardPanel title="Cumulative Savings Since Activation" variant="enterprise">
            <NoDataBlock message="No Data - cumulative savings trend source is not approved." />
          </DashboardPanel>
        </section>

        <section className="mt-3 grid h-[205px] shrink-0 grid-cols-[1.15fr_1.15fr_0.95fr] gap-3">
          <DashboardPanel title="Baseline vs Current Performance" variant="enterprise">
            <CompactTable headers={["Metric", "Baseline", "Current", "Improvement"]} rows={energyBaselineRows(data)} />
          </DashboardPanel>
          <DashboardPanel title="Savings Waterfall" variant="enterprise">
            <NoDataBlock message="No Data - savings waterfall requires an approved trend/split model." />
          </DashboardPanel>
          <DashboardPanel title="ROI & Payback" variant="enterprise">
            <div className="grid h-full grid-cols-2 gap-3 text-center">
              <Gauge label="Return on Investment" value="No Data" />
              <Gauge label="Payback Period" value="No Data" />
            </div>
          </DashboardPanel>
        </section>

        <section className="mt-3 grid h-[126px] shrink-0 grid-cols-[1.1fr_0.92fr_1.05fr_1.08fr] gap-3">
          <DashboardPanel title="Current Balance Intelligence" variant="enterprise"><NoDataBlock message="No Data - current balance breakdown source is not approved for this Energy screen." /></DashboardPanel>
          <DashboardPanel title="Capacity Intelligence" variant="enterprise"><CapacityBlock data={data} /></DashboardPanel>
          <DashboardPanel title="Utility Intelligence" variant="enterprise"><UtilityBlock /></DashboardPanel>
          <DashboardPanel title="Active Alerts" variant="enterprise"><AlertBlock /></DashboardPanel>
        </section>

        <section className="mt-3 grid h-[104px] shrink-0 grid-cols-[1.15fr_0.75fr_0.75fr_0.52fr] gap-3">
          <DashboardPanel title="Savings Breakdown" variant="enterprise"><SavingsBreakdown data={data} /></DashboardPanel>
          <DashboardPanel title="Top Saving Opportunities" variant="enterprise"><OpportunityList /></DashboardPanel>
          <DashboardPanel title="System Health & Status" variant="enterprise"><HealthList /></DashboardPanel>
          <DashboardPanel title="Alerts" variant="enterprise"><AlertCounts /></DashboardPanel>
        </section>

        <EnergySavingsFooter />
      </div>
    </EcbsAppShell>
  );
}

function EnergySavingsFooter() {
  return (
    <footer className="mt-auto flex h-[30px] shrink-0 items-center justify-between text-[9px] text-slate-500">
      <span>Savings are calculated using an approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</span>
      <span>Data updated: May 18, 2025 10:15 AM &nbsp; <b className="text-[#05ff5e]">● Real-time</b></span>
    </footer>
  );
}

export function EnergySavingsAlertsScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">ALERTS & EVENTS(TM)</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time Alerting. Faster Response. Greater Reliability.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span>⚙</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div><span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Alerts & Events</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">◎ Acknowledge All</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⚙ Configure Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <AlertStatusKpi icon="△" label="ACTIVE ALERTS" value="No Data" detail="No approved alert source" trend="Blocked" tone="red" />
          <AlertStatusKpi icon="△" label="WARNING ALERTS" value="No Data" detail="No approved alert source" trend="Blocked" tone="orange" />
          <AlertStatusKpi icon="ⓘ" label="INFO ALERTS" value="No Data" detail="No approved alert source" trend="Blocked" tone="blue" />
          <AlertStatusKpi icon="✓" label="RESOLVED (24H)" value="No Data" detail="No response source" trend="Blocked" tone="purple" />
          <AlertStatusKpi icon="⌁" label="ALERT RESPONSE (AVG)" value="No Data" detail="No SLA source" trend="Blocked" tone="cyan" />
          <AlertStatusKpi icon="✓" label="ALERT COMPLIANCE" value="No Data" detail="No compliance source" trend="Blocked" tone="green" />
        </section>
        <section className="mt-2 grid h-[184px] grid-cols-[0.9fr_1.06fr_1.18fr] gap-2">
          <DashboardPanel title="ALERTS BY SEVERITY" variant="enterprise"><NoDataBlock message="No Data - no approved alert severity source." /></DashboardPanel>
          <DashboardPanel title="ALERT TREND (Last 7 Days)" variant="enterprise"><NoDataBlock message="No Data - no approved alert trend source." /></DashboardPanel>
          <DashboardPanel title="ALERT STATUS OVER TIME" variant="enterprise"><NoDataBlock message="No Data - no approved alert status source." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[206px] grid-cols-[1.42fr_1fr] gap-2">
          <DashboardPanel title="ACTIVE ALERTS" variant="enterprise"><NoDataBlock message="No Data - active alert rows require an approved alert/event model." /></DashboardPanel>
          <DashboardPanel title="ALERT PRIORITY MATRIX" variant="enterprise"><NoDataBlock message="No Data - priority scoring has no approved source." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[224px] grid-cols-[1.05fr_0.86fr_0.74fr_0.74fr] gap-2">
          <DashboardPanel title="ALERT RESPONSE PERFORMANCE (Last 7 Days)" variant="enterprise"><NoDataBlock message="No Data - response performance requires an approved SLA source." /></DashboardPanel>
          <DashboardPanel title="ALERT CATEGORIES" variant="enterprise"><NoDataBlock message="No Data - alert category source is not approved." /></DashboardPanel>
          <DashboardPanel title="ALERT NOTIFICATIONS (Last 7 Days)" variant="enterprise"><NoDataBlock message="No Data - notification history source is not approved." /></DashboardPanel>
          <DashboardPanel title="QUICK ACTIONS" variant="enterprise"><AlertQuickActions /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[32px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Alerts are generated in real time based on system thresholds and predictive analytics.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

export function EnergySavingsBaselineComparisonScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">BASELINE COMPARISON</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div><span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Baseline Comparison</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">More⌄</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <BaselineKpi label="TOTAL ENERGY (kWh)" baseline="No Data" current="No Data" diff="No Data" reduction="No Data" />
          <BaselineKpi label="PEAK DEMAND (kW)" baseline="No Data" current="No Data" diff="No Data" reduction="No Data" />
          <BaselineKpi label="AVERAGE POWER FACTOR" baseline="No Data" current="No Data" diff="No Data" reduction="No Data" />
          <BaselineKpi label="TOTAL kVA" baseline="No Data" current={formatKva(data?.loadKva)} diff="No Data" reduction="No Data" />
          <BaselineKpi label="THD (AVG %)" baseline="No Data" current="No Data" diff="No Data" reduction="No Data" />
          <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-[8px] text-slate-400">EST. ANNUAL SAVINGS</div><div className="mt-1 text-3xl leading-none text-[#05ff5e]">{annualBenefitValue(data)}</div><div className="mt-1 text-[9px] text-slate-300">Latest savings_intelligence row</div><div className="mt-1 text-[8px] text-[#05ff5e]">Direct Data</div></article>
        </section>
        <section className="mt-2 grid h-[214px] grid-cols-[1.18fr_1.04fr_1.02fr] gap-2">
          <DashboardPanel title="BASELINE vs CURRENT - ENERGY (kWh)" variant="enterprise"><NoDataBlock message="No Data - baseline energy contract is not approved." /></DashboardPanel>
          <DashboardPanel title="LOAD PROFILE COMPARISON (Average Day)" variant="enterprise"><NoDataBlock message="No Data - baseline load profile source is not approved." /></DashboardPanel>
          <DashboardPanel title="BASELINE vs CURRENT SUMMARY" variant="enterprise"><CompactTable headers={["Metric", "Baseline", "Current", "Improvement"]} rows={energyBaselineRows(data)} /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[190px] grid-cols-3 gap-2">
          <DashboardPanel title="BASELINE vs CURRENT - DEMAND (kW)" variant="enterprise"><NoDataBlock message="No Data - demand baseline model is not approved." /></DashboardPanel>
          <DashboardPanel title="BASELINE vs CURRENT - POWER FACTOR" variant="enterprise"><NoDataBlock message="No Data - PF baseline model is not approved." /></DashboardPanel>
          <DashboardPanel title="BASELINE vs CURRENT - THD (%)" variant="enterprise"><NoDataBlock message="No Data - THD baseline model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[160px] grid-cols-[1.03fr_0.96fr_1.03fr] gap-2">
          <DashboardPanel title="BASELINE vs CURRENT BY SYSTEM" variant="enterprise"><NoDataBlock message="No Data - system-level baseline allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS IMPACT SUMMARY" variant="enterprise"><NoDataBlock message="No Data - savings impact requires an approved baseline model." /></DashboardPanel>
          <DashboardPanel title="BASELINE INFORMATION" variant="enterprise"><NoDataBlock message="No Data - baseline source metadata is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Baseline comparison uses approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

export function EnergySavingsCapacityIntelligenceScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/capacity-intelligence">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">CAPACITY INTELLIGENCE(TM)</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time Capacity Optimization. Maximize Available Infrastructure. Reduce Risk.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div><span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Capacity Intelligence</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts⌄</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <CapacityIntelKpi icon="⌁" label="CAPACITY RECOVERED(TM)" value={formatKva(data?.recoveredKva)} detail="Latest capacity_intelligence row" trend="Direct Data" tone="cyan" />
          <CapacityIntelKpi icon="▱" label="AVAILABLE CAPACITY" value={formatKva(data?.availableKva)} detail="Currently Available" trend="Direct Data" tone="blue" />
          <CapacityIntelKpi icon="○" label="SYSTEM LOADING" value={formatKva(data?.loadKva)} detail="Current utilized capacity" trend="Direct Data" tone="orange" />
          <CapacityIntelKpi icon="▥" label="CAPACITY UTILIZATION" value={formatPctValue(data?.utilizationPct)} detail="% of rated capacity" trend="Direct Data" tone="purple" />
          <CapacityIntelKpi icon="▿" label="OVERLOAD RISK" value={hasCapacityData(data) ? (data!.utilizationPct >= 90 ? "High" : data!.utilizationPct >= 75 ? "Warning" : "Low") : "No Data"} detail="Calculated from utilization" trend="Calculated" tone="green" />
          <CapacityIntelKpi icon="▧" label="CAPACITY RESERVE" value={formatKva((data?.availableKva ?? 0) + (data?.recoveredKva ?? 0))} detail="Available + recovered" trend="Calculated" tone="yellow" />
        </section>
        <section className="mt-2 grid h-[210px] grid-cols-3 gap-2">
          <DashboardPanel title="CAPACITY UTILIZATION OVER TIME ⓘ" variant="enterprise"><NoDataBlock message="No Data - Energy dashboard trend contract is not approved for this screen." /></DashboardPanel>
          <DashboardPanel title="AVAILABLE CAPACITY (MVA) ⓘ" variant="enterprise"><CapacityBlock data={data} /></DashboardPanel>
          <DashboardPanel title="CAPACITY RECOVERY OVER TIME (CUMULATIVE) ⓘ" variant="enterprise"><NoDataBlock message="No Data - cumulative recovery trend source is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[198px] grid-cols-[1.05fr_1fr_1fr] gap-2">
          <DashboardPanel title="CAPACITY BY TRANSFORMER ⓘ" variant="enterprise"><CapacityBlock data={data} /></DashboardPanel>
          <DashboardPanel title="CAPACITY BY SYSTEM ⓘ" variant="enterprise"><NoDataBlock message="No Data - system-level capacity allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="CAPACITY UTILIZATION ZONES ⓘ" variant="enterprise"><NoDataBlock message="No Data - utilization-zone model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[178px] grid-cols-3 gap-2">
          <DashboardPanel title="CAPACITY FORECAST (Next 30 Days) ⓘ" variant="enterprise"><NoDataBlock message="No Data - forecast model is not approved." /></DashboardPanel>
          <DashboardPanel title="CAPACITY OPTIMIZATION OPPORTUNITIES ⓘ" variant="enterprise"><NoDataBlock message="No Data - opportunity model is not approved on this screen." /></DashboardPanel>
          <DashboardPanel title="CAPACITY HEALTH INDICATORS ⓘ" variant="enterprise"><NoDataBlock message="No Data - health indicator model is not approved for Energy dashboard." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Capacity Intelligence uses advanced analytics and real-time data to optimize system capacity and extend infrastructure life.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

export function EnergySavingsCapacityRecoveredScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/capacity-intelligence">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">CAPACITY RECOVERED™</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>‹ &nbsp; <span className="text-[#147dff]">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Capacity Recovered</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">More</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <CapacityIntelKpi icon="⌁" label="TOTAL CAPACITY RECOVERED™" value={formatKva(data?.recoveredKva)} detail="Latest capacity_intelligence row" trend="Direct Data" tone="cyan" />
          <CapacityIntelKpi icon="▥" label="AVAILABLE CAPACITY NOW" value={formatKva((data?.availableKva ?? 0) + (data?.recoveredKva ?? 0))} detail="Available + recovered" trend="Calculated" tone="purple" />
          <CapacityIntelKpi icon="⌁" label="SYSTEM LOADING REDUCTION" value="No Data" detail="No approved baseline" trend="Blocked" tone="green" />
          <CapacityIntelKpi icon="▤" label="MAX DEMAND REDUCTION" value="No Data" detail="No approved peak baseline" trend="Blocked" tone="orange" />
          <CapacityIntelKpi icon="▣" label="POWER FACTOR IMPROVEMENT" value="No Data" detail="No approved PF baseline" trend="Blocked" tone="cyan" />
          <CapacityIntelKpi icon="▥" label="TRANSFORMER RELIEF" value={formatPctValue(data?.recoveredPct)} detail="Recovered / installed" trend="Calculated" tone="purple" />
        </section>
        <section className="mt-2 grid h-[210px] grid-cols-[1.45fr_0.72fr_0.86fr] gap-2">
          <DashboardPanel title="CAPACITY RECOVERED TREND (SINCE ACTIVATION)" variant="enterprise"><NoDataBlock message="No Data - cumulative recovery trend source is not approved." /></DashboardPanel>
          <DashboardPanel title="CAPACITY RECOVERY BY SOURCE (THIS MONTH)" variant="enterprise"><NoDataBlock message="No Data - recovery source allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="CAPACITY RECOVERY SUMMARY" variant="enterprise"><CapacityBlock data={data} /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[198px] grid-cols-[1fr_1fr_1fr] gap-2">
          <DashboardPanel title="CAPACITY RECOVERED BY TRANSFORMER" variant="enterprise"><CapacityBlock data={data} /></DashboardPanel>
          <DashboardPanel title="CAPACITY RECOVERY BY SYSTEM" variant="enterprise"><NoDataBlock message="No Data - system-level recovery allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="LOADING BEFORE vs AFTER ECBS" variant="enterprise"><NoDataBlock message="No Data - before/after baseline is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[178px] grid-cols-[1fr_1fr_1fr] gap-2">
          <DashboardPanel title="CAPACITY RECOVERY INSIGHTS" variant="enterprise"><NoDataBlock message={data?.keyInsight ?? "No Data - capacity insight source is unavailable."} /></DashboardPanel>
          <DashboardPanel title="CAPACITY VALUES (THIS MONTH)" variant="enterprise"><NoDataBlock message="No Data - monthly capacity value rollup is not approved." /></DashboardPanel>
          <DashboardPanel title="CAPACITY RECOVERY EVENTS" variant="enterprise"><NoDataBlock message="No Data - recovery event source is not approved." /></DashboardPanel>
        </section>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function RecoveredTrend() {
  const points = "30,128 76,118 122,108 168,96 214,84 260,72 306,58 352,44 398,32 444,20 492,10";
  return <div className="h-full text-[8px]"><svg className="h-[146px] w-full" viewBox="0 0 540 154"><g stroke="rgba(148,163,184,.16)">{[22,52,82,112,142].map((y)=><line key={y} x1="32" x2="530" y1={y} y2={y}/>)}</g><polygon fill="rgba(5,255,94,.18)" points={`${points} 492,144 30,144`} /><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="3" />{["0","85kVA","146kVA","265kVA","361kVA","470kVA","603kVA","742kVA","883kVA","1.05MVA","1.82MVA"].map((v,i)=><text fill="#e2e8f0" fontSize="8" key={v} textAnchor="middle" x={30+i*46} y={126-i*11}>{v}</text>)}</svg><div className="flex justify-between px-6 text-[7px] text-slate-400">{["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","May '25"].map((d)=><span key={d}>{d}</span>)}</div><div className="mt-2 flex justify-between text-[#05ff5e]"><span>Total Capacity Recovered Since Activation:</span><b>1.82 MVA</b><span>View Trend Analysis →</span></div></div>;
}

function RecoveredSourceDonut() {
  const rows = [["HVAC Systems","620 kVA (34.1%)","#65a30d"],["Motor Systems","510 kVA (28.0%)","#147dff"],["Lighting Systems","230 kVA (12.6%)","#ff8a00"],["Process Equipment","280 kVA (15.4%)","#a855f7"],["Power Factor Improvement","120 kVA (6.6%)","#06b6d4"],["Other Optimizations","60 kVA (3.3%)","#94a3b8"]];
  return <div className="grid h-full grid-cols-[134px_1fr] gap-2 text-[7.5px]"><div className="relative"><svg className="size-[122px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="68 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="56 201" strokeDashoffset="-70" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#ff8a00" strokeDasharray="26 201" strokeDashoffset="-128" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#a855f7" strokeDasharray="31 201" strokeDashoffset="-156" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[43px] w-[122px] text-center">Total<br /><b className="text-lg">1.82 MVA</b></div></div><div className="space-y-1">{rows.map(([a,b,c])=><div className="grid grid-cols-[8px_1fr] gap-1" key={a}><span className="mt-1 size-2 rounded-full" style={{background:c}}/><span>{a}<br/><b>{b}</b></span></div>)}<div className="pt-1 text-[#05ff5e]">View Source Breakdown →</div></div></div>;
}

function RecoveredSummary() {
  const rows = [["Metric","This Month","Last Month","Change"],["Total Capacity Recovered","1,820 kVA","1,560 kVA","▲ 16.7%"],["Available Capacity Now","1,240 kVA","1,050 kVA","▲ 18.1%"],["System Loading (Avg)","68.3%","74.6%","▼ -6.3%"],["Peak Loading (Max)","82.1%","87.9%","▼ -5.8%"],["Transformer Relief (Avg)","26.4%","22.8%","▲ 3.6%"],["Max Demand Reduction","742 kW","603 kW","▲ 23.1%"],["Power Factor (Avg)","0.98","0.93","▲ 0.05"]];
  return <div className="text-[7px]"><table className="w-full text-left"><tbody>{rows.map((r,i)=><tr className={i?"border-t border-white/5": "text-slate-400"} key={r[0]}>{r.map((c,j)=><td className={j===3&&i?"py-1 text-[#05ff5e]":"py-1"} key={`${r[0]}-${c}`}>{c}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">View Full Summary →</div></div>;
}

function RecoveredTransformerTable() {
  const rows = [["TX-01 Main","1,500","1,245","832","413","33.2%","Optimal"],["TX-02 Plant","1,000","876","612","264","30.1%","Optimal"],["TX-03 HVAC","750","642","426","216","33.6%","Optimal"],["TX-04 Process","1,250","1,032","742","290","28.1%","Optimal"],["TX-05 Lighting","500","412","258","154","37.4%","Optimal"],["TOTAL / AVERAGE","5,000","4,207","2,870","1,337","31.7%",""]];
  return <CapacityTinyTable headers={["Transformer","Rating (kVA)","Baseline Load (kVA)","Current Load (kVA)","Recovered (kVA)","Relief (%)","Status"]} rows={rows} link="View Transformer Details →" />;
}

function RecoveredSystemTable() {
  const rows = [["HVAC Systems","620 kVA","34.1%","Improved Cooling Efficiency"],["Motor Systems","510 kVA","28.0%","Reduced Load & Heat"],["Lighting Systems","230 kVA","12.6%","Optimized Power Draw"],["Process Equipment","280 kVA","15.4%","Stabilized Performance"],["Power Factor Improvement","120 kVA","6.6%","Reduced Reactive Load"],["Other Optimizations","60 kVA","3.3%","System Enhancements"],["TOTAL","1,820 kVA","100%",""]];
  return <CapacityTinyTable headers={["System","Recovered (kVA)","% of Total","Impact on Operations"]} rows={rows} link="View System Analysis →" />;
}

function RecoveredBeforeAfter() {
  const labels = ["TX-01 Main","TX-02 Plant","TX-03 HVAC","TX-04 Process","TX-05 Lighting","Average"];
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-slate-400">■ Baseline Load (%)</span><span className="text-[#65a30d]">■ Current Load (%)</span></div><svg className="h-[118px] w-full" viewBox="0 0 360 126">{labels.map((l,i)=>{const x=28+i*54; const b=[83,88,86,83,82,84][i]; const c=[55,61,57,59,52,57][i]; return <g key={l}><rect fill="#94a3b8" height={b*.8} width="16" x={x} y={104-b*.8}/><rect fill="#65a30d" height={c*.8} width="16" x={x+18} y={104-c*.8}/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+8} y={98-b*.8}>{b}%</text><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+26} y={98-c*.8}>{c}%</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+18} y="122">{l}</text></g>})}</svg><div className="text-[#05ff5e]">View Loading Analysis →</div></div>;
}

function RecoveredInsights() {
  const rows = ["Total 1.82 MVA of capacity has been recovered since system activation.","System loading reduced by 31.7% on average, increasing operational headroom.","Transformer TX-05 Lighting showed the highest relief at 37.4%.","Peak demand reduced by 742 kW on May 15 at 2:00 PM."];
  return <div className="space-y-3 text-[8px]">{rows.map((r)=><div className="grid grid-cols-[18px_1fr]" key={r}><span className="text-[#05ff5e]">●</span><span>{r}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Insights Report →</div></div>;
}

function RecoveredValues() {
  const rows = [["Recovered Capacity Value","$78,640","Based on $43/kVA"],["Demand Reduction Value","$22,180","Based on $29.90/kW"],["Risk Mitigation Value","$15,420","Avoided Infrastructure"],["Total Capacity Value","$116,240","This Month"]];
  return <div className="grid h-full grid-cols-4 gap-2 text-center text-[7.4px]">{rows.map(([a,b,c])=><div key={a}><div className="mx-auto mb-2 grid size-8 place-items-center rounded-full border border-cyan-300 text-cyan-300">▧</div><div>{a}</div><b className="text-lg">{b}</b><br/><span className="text-slate-400">{c}</span></div>)}<div className="col-span-4 text-left text-[#05ff5e]">View Value Analysis →</div></div>;
}

function RecoveredEvents() {
  const rows = [["May 18, 9:42 AM","HVAC Optimization","+85 kVA","HVAC Systems"],["May 17, 3:21 PM","Motor Load Balance","+120 kVA","Motor Systems"],["May 16, 11:18 AM","PF Improvement","+60 kVA","Power Factor"],["May 15, 2:00 PM","Peak Shave Event","+145 kVA","Demand Reduction"],["May 14, 10:05 AM","Lighting Optimization","+42 kVA","Lighting Systems"]];
  return <div className="text-[7.2px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Date/Time","Event","Recovered (kVA)","Source"].map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr className="border-t border-white/5" key={r[0]}>{r.map((c,i)=><td className={i===2?"py-1 text-[#05ff5e]":"py-1"} key={`${r[0]}-${c}`}>{c}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">View All Events →</div></div>;
}

export function EnergySavingsCumulativeSavingsScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">CUMULATIVE SAVINGS SINCE ACTIVATION</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[190px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>‹ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Cumulative Savings Since Activation</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">More</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <CumulativeKpi icon="$" label="TOTAL CUMULATIVE SAVINGS" value="No Data" detail="No approved lifetime rollup" trend="Blocked" tone="green" />
          <CumulativeKpi icon="▣" label="ENERGY SAVINGS (kWh)" value="No Data" detail="No approved kWh rollup" trend="Blocked" tone="cyan" />
          <CumulativeKpi icon="▤" label="DEMAND SAVINGS (kW)" value="No Data" detail="No approved demand baseline" trend="Blocked" tone="orange" />
          <CumulativeKpi icon="▥" label="PF IMPROVEMENT" value="No Data" detail="No approved PF baseline" trend="Blocked" tone="purple" />
          <CumulativeKpi icon="⌁" label="CAPACITY RECOVERED™" value={formatKva(data?.recoveredKva)} detail="Latest capacity_intelligence row" trend="Direct Data" tone="cyan" />
          <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-[8px] text-slate-400">VALUE SINCE ACTIVATION</div><div className="mt-1 text-2xl leading-none">No Data</div><div className="mt-3 text-[9px] text-slate-300">No lifetime value rollup</div></article>
        </section>
        <section className="mt-2 grid h-[218px] grid-cols-[1.25fr_0.95fr] gap-2">
          <DashboardPanel title="CUMULATIVE SAVINGS OVER TIME ⓘ" variant="enterprise"><NoDataBlock message="No Data - cumulative savings trend source is not approved." /></DashboardPanel>
          <DashboardPanel title="CUMULATIVE SAVINGS BREAKDOWN ⓘ" variant="enterprise"><NoDataBlock message="No Data - savings category split is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[196px] grid-cols-[1fr_0.78fr_0.9fr] gap-2">
          <DashboardPanel title="CUMULATIVE SAVINGS BY CATEGORY (Stacked) ⓘ" variant="enterprise"><NoDataBlock message="No Data - category-over-time model is not approved." /></DashboardPanel>
          <DashboardPanel title="PERCENT CONTRIBUTION TO TOTAL SAVINGS ⓘ" variant="enterprise"><NoDataBlock message="No Data - contribution split is not approved." /></DashboardPanel>
          <DashboardPanel title="CUMULATIVE SAVINGS SUMMARY ⓘ" variant="enterprise"><NoDataBlock message="No Data - cumulative summary requires an approved lifetime rollup." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[174px] grid-cols-[0.86fr_0.86fr_1fr] gap-2">
          <DashboardPanel title="CUMULATIVE SAVINGS BY SITE ⓘ" variant="enterprise"><NoDataBlock message="No Data - site savings allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="MONTHLY CUMULATIVE SAVINGS ⓘ" variant="enterprise"><NoDataBlock message="No Data - monthly savings rollup is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE MILESTONE ACHIEVEMENTS ⓘ" variant="enterprise"><NoDataBlock message="No Data - milestone source is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Savings are calculated using an approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function CumulativeKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "orange" | "purple"; trend: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : tone === "orange" ? "#ff8a00" : "#a855f7";
  return <article className="grid grid-cols-[52px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-11 place-items-center rounded-full border-2 text-xl" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[8px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[21px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div><div className="mt-1 text-[7px] text-[#05ff5e]">{trend}</div></div></article>;
}

function CumulativeSavingsTrend() {
  const points = "40,144 86,132 132,120 178,108 224,96 270,82 316,68 362,54 408,40 454,26 500,12";
  return <div className="h-full text-[8px]"><svg className="h-[150px] w-full" viewBox="0 0 540 158"><g stroke="rgba(148,163,184,.16)">{[20,50,80,110,140].map((y)=><line key={y} x1="34" x2="528" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="2" y="24">$2.0M</text><text x="2" y="54">$1.6M</text><text x="2" y="84">$1.2M</text><text x="2" y="114">$800K</text><text x="8" y="144">$0</text></g><polygon fill="rgba(5,255,94,.18)" points={`${points} 500,146 40,146`} /><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="3" />{["$0","$85K","$166K","$265K","$361K","$470K","$603K","$742K","$893K","$1.05M","$1.86M"].map((v,i)=><text fill="#e2e8f0" fontSize="8" key={v} textAnchor="middle" x={40+i*46} y={140-i*12}>{v}</text>)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","May '25"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-2 flex justify-between text-[#05ff5e]"><span>Total Cumulative Savings Since Activation:</span><b>$1,862,744</b><span>View Trend Analysis →</span></div></div>;
}

function CumulativeBreakdownTable() {
  const rows = [["Energy Savings","$1,024,218","55.0%","▲ 1.35%","⌁"],["Demand Savings","$412,885","22.2%","▲ 1.28%","⌁"],["PF & Penalty Savings","$203,764","11.0%","▲ 1.18%","⌁"],["Capacity Value","$143,912","7.7%","▲ 0.96%","⌁"],["Other Optimizations","$77,965","4.2%","▲ 0.89%","⌁"],["TOTAL","$1,862,744","100%","▲ 1.24%",""]];
  return <CumulativeTable headers={["Category","Savings ($)","% of Total","vs Last 30 Days","Trend (30 Days)"]} rows={rows} link="View Breakdown Details →" />;
}

function CumulativeStackedBars() {
  const months = ["May '24","Jun '24","Jul '24","Aug '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25","May '25"];
  return <div className="h-full text-[8px]"><div className="mb-1 flex gap-4 text-[7px]"><span className="text-[#65a30d]">■ Energy Savings</span><span className="text-[#147dff]">■ Demand Savings</span><span className="text-[#ff8a00]">■ PF & Penalty Savings</span><span className="text-[#a855f7]">■ Capacity Value</span><span className="text-cyan-300">■ Other Optimizations</span></div><svg className="h-[120px] w-full" viewBox="0 0 500 126"><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,122].map(y=><line key={y} x1="34" x2="490" y1={y} y2={y}/>)}</g>{months.map((m,i)=>{const x=44+i*35; const base=22+i*7; return <g key={m}><rect fill="#65a30d" height={base*.45} width="18" x={x} y={112-base*.45}/><rect fill="#147dff" height={base*.24} width="18" x={x} y={112-base*.69}/><rect fill="#ff8a00" height={base*.14} width="18" x={x} y={112-base*.83}/><rect fill="#a855f7" height={base*.1} width="18" x={x} y={112-base*.93}/><rect fill="#06b6d4" height={base*.07} width="18" x={x} y={112-base}/><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+9} y="124">{m}</text></g>})}</svg><div className="text-[#05ff5e]">View Category Analysis →</div></div>;
}

function CumulativeContribution() {
  const rows = [["Energy Savings","55.0%","#65a30d"],["Demand Savings","22.2%","#147dff"],["PF & Penalty Savings","11.0%","#ff8a00"],["Capacity Value","7.7%","#a855f7"],["Other Optimizations","4.2%","#06b6d4"]];
  return <div className="grid h-full grid-cols-[128px_1fr] gap-2 text-[8px]"><div className="relative"><svg className="size-[122px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="111 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="45 201" strokeDashoffset="-113" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#ff8a00" strokeDasharray="22 201" strokeDashoffset="-160" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#a855f7" strokeDasharray="16 201" strokeDashoffset="-184" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[43px] w-[122px] text-center"><b className="text-lg">$1.86M</b><br/>Total Savings</div></div><div className="space-y-2">{rows.map(([a,b,c])=><div className="grid grid-cols-[10px_1fr_38px] gap-2" key={a}><span className="mt-1 size-2 rounded-full" style={{background:c}}/><span>{a}</span><span>{b}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Contribution Details →</div></div></div>;
}

function CumulativeSummaryTable() {
  const rows = [["Metric","Since Activation","Last 12 Months","This Year (YTD)"],["Total Savings ($)","$1,862,744","$1,862,744","$412,885"],["Energy Savings (kWh)","4,286,154","4,286,154","1,034,210"],["Peak Demand Reduction (kW)","742","742","312"],["PF Improvement (Avg)","+0.30","+0.30","+0.12"],["Capacity Recovered (MVA)","1.82","1.82","0.46"],["CO₂ Avoided (Tons)","2,145","2,145","518"],["Baseline Locked On","May 12, 2024","May 12, 2024","May 12, 2024"]];
  return <CumulativeTable rows={rows.slice(1)} headers={rows[0]} link="View Summary Report →" />;
}

function CumulativeSiteTable() {
  const rows = [["Main Facility","$1,024,218","55.0%","▲ 1.35%","⌁"],["Production Area","$412,885","22.2%","▲ 1.28%","⌁"],["Warehouse","$203,764","11.0%","▲ 1.18%","⌁"],["Office Building","$143,912","7.7%","▲ 0.96%","⌁"],["Auxiliary Systems","$77,965","4.2%","▲ 0.89%","⌁"],["TOTAL","$1,862,744","100%","▲ 1.24%",""]];
  return <CumulativeTable headers={["Site / Area","Savings ($)","% of Total","vs Last 30 Days","Trend (30 Days)"]} rows={rows} link="View Site Details →" />;
}

function CumulativeMonthlyTable() {
  const rows = [["May 2024 (Activation)","$85,140","$85,140","-"],["Jun 2024","$81,385","$166,525","▲ 1.9%"],["Jul 2024","$99,136","$265,661","▲ 21.8%"],["Aug 2024","$95,424","$361,085","▲ 15.4%"],["Sep 2024","$108,957","$470,042","▲ 14.2%"],["...","","",""],["May 2025","$193,654","$1,862,744","▲ 12.7%"]];
  return <CumulativeTable headers={["Month","Monthly Savings ($)","Cumulative Savings ($)","vs Prior Month"]} rows={rows} link="View Full Monthly Report →" />;
}

function CumulativeMilestones() {
  const rows = [["$250K Milestone","Jun 20, 2024","Achieved 38 days after activation"],["$500K Milestone","Aug 13, 2024","Achieved 93 days after activation"],["$1.0M Milestone","Nov 27, 2024","Achieved 199 days after activation"],["$1.5M Milestone","Mar 15, 2025","Achieved 307 days after activation"],["$1.86M Current","May 18, 2025","363 days since activation"]];
  return <div className="space-y-2 text-[7.6px]">{rows.map(([a,b,c],i)=><div className="grid grid-cols-[18px_1fr_82px_1.2fr] items-center gap-2" key={a}><span className="grid size-3 place-items-center rounded-full bg-[#65a30d] text-[6px]">{i+1}</span><b>{a}</b><span>{b}</span><span className="text-slate-400">{c}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Milestone History →</div></div>;
}

function CumulativeTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={i===3 || (cell.startsWith?.("▲")) ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[7px] text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsRoiPaybackScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">ROI & PAYBACK ANALYSIS</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[190px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>‹ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">ROI & Payback Analysis</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button></div></div>
        <section className="grid h-[112px] grid-cols-[1.05fr_1fr_1fr_1fr_1fr_1fr] gap-2">
          <RoiGaugeCard value="No Data" />
          <RoiTopMetric label="PAYBACK PERIOD" value="No Data" suffix="No approved investment basis" detail="Blocked" trend="No Data" />
          <RoiTopMetric label="TOTAL INVESTMENT" value="No Data" suffix="No approved investment source" detail="Blocked" />
          <RoiTopMetric label="TOTAL ANNUAL BENEFIT" value={annualBenefitValue(data)} suffix="Latest annual savings" detail="Direct Data" />
          <RoiTopMetric label="NET ANNUAL BENEFIT" value="No Data" suffix="No operating cost source" detail="Blocked" trend="" />
          <RoiTopMetric label="IRR (INTERNAL RATE OF RETURN)" value="No Data" suffix="No approved financial model" detail="Blocked" />
        </section>
        <section className="mt-2 grid h-[224px] grid-cols-[1.08fr_0.78fr_1fr] gap-2">
          <DashboardPanel title="CASH FLOW OVER TIME" variant="enterprise"><NoDataBlock message="No Data - cash flow model is not approved." /></DashboardPanel>
          <DashboardPanel title="PAYBACK TIMELINE" variant="enterprise"><NoDataBlock message="No Data - payback model is not approved." /></DashboardPanel>
          <DashboardPanel title="ROI OVER TIME" variant="enterprise"><NoDataBlock message="No Data - ROI trend model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[186px] grid-cols-3 gap-2">
          <DashboardPanel title="BENEFIT BREAKDOWN (Annualized)" variant="enterprise"><NoDataBlock message="No Data - benefit split is not approved." /></DashboardPanel>
          <DashboardPanel title="COST BREAKDOWN (Total Investment)" variant="enterprise"><NoDataBlock message="No Data - cost model is not approved." /></DashboardPanel>
          <DashboardPanel title="KEY FINANCIAL METRICS" variant="enterprise"><NoDataBlock message="No Data - financial metrics model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[172px] grid-cols-[0.9fr_1fr_1fr] gap-2">
          <DashboardPanel title="SAVINGS VS INVESTMENT COMPARISON" variant="enterprise"><NoDataBlock message="No Data - investment comparison source is not approved." /></DashboardPanel>
          <DashboardPanel title="SENSITIVITY ANALYSIS (Impact on Payback Period)" variant="enterprise"><NoDataBlock message="No Data - sensitivity model is not approved." /></DashboardPanel>
          <DashboardPanel title="INVESTMENT MILESTONES" variant="enterprise"><NoDataBlock message="No Data - milestone model is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>ROI and Payback calculations are based on approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function RoiGaugeCard({ value = "No Data" }: { value?: string }) {
  return <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-center"><div className="text-[8px] text-slate-300">RETURN ON INVESTMENT (ROI)</div><div className="relative mx-auto mt-1 h-[68px] w-[132px]"><svg viewBox="0 0 132 72"><path d="M20 62 A46 46 0 0 1 112 62" fill="none" stroke="#1f2937" strokeWidth="14" /><path d="M20 62 A46 46 0 0 1 42 22" fill="none" stroke="#ef4444" strokeWidth="14" /><path d="M42 22 A46 46 0 0 1 78 18" fill="none" stroke="#ff8a00" strokeWidth="14" /><path d="M78 18 A46 46 0 0 1 112 62" fill="none" stroke="#65a30d" strokeWidth="14" /><text fill="#e2e8f0" fontSize={value === "No Data" ? "16" : "24"} textAnchor="middle" x="66" y="58">{value}</text></svg></div><div className="flex justify-between text-[7px]"><span>0%</span><span>200%+</span></div><div className="text-[9px]">No approved model</div><div className="text-[8px] text-[#05ff5e]">No Data</div></article>;
}

function RoiTopMetric({ detail, label, suffix, trend, value }: { detail: string; label: string; suffix: string; trend?: string; value: string }) {
  return <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-center"><div className="text-[8px] text-slate-400">{label}</div><div className="mt-3 text-[28px] leading-none text-slate-100">{value}</div><div className="mt-1 text-[10px]">{suffix}</div><div className="mt-2 text-[8px] text-slate-300">{detail}</div>{trend !== undefined && <div className="mt-1 text-[8px] text-[#05ff5e]">{trend}</div>}</article>;
}

function RoiCashFlowChart() {
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-[#65a30d]">■ Net Cash Flow</span><span className="text-[#147dff]">━ Cumulative Cash Flow</span></div><svg className="h-[150px] w-full" viewBox="0 0 520 158"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104,132].map(y=><line key={y} x1="34" x2="510" y1={y} y2={y}/>)}</g><line stroke="rgba(148,163,184,.4)" x1="34" x2="510" y1="88" y2="88"/>{Array.from({length:61}).map((_,i)=>{const x=36+i*7.5; const h=i<25?28-i*.4:10+(i-25)*1.8; return <rect fill={i<25?"#dc2626":"#65a30d"} height={h} key={i} width="4" x={x} y={i<25?88:88-h}/>})}<polyline fill="none" points="36,116 92,112 148,108 204,98 260,82 316,64 372,46 428,30 500,12" stroke="#147dff" strokeWidth="2"/><rect fill="#061421" height="46" rx="4" stroke="#65a30d" width="92" x="190" y="28"/><text fill="#65a30d" fontSize="8" textAnchor="middle" x="236" y="44">Break-Even Achieved</text><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="236" y="58">Month 25</text><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="236" y="70">Cumulative: $0</text></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["0","6","12","18","24","30","36","42","48","54","60"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Cash Flow Details →</div></div>;
}

function RoiPaybackTimeline() {
  return <div className="grid h-full content-center text-center text-[8px]"><div className="text-slate-300">Break-Even Point</div><div className="text-3xl leading-none text-[#9cff4d]">Month 25</div><div className="mt-1 text-xl">2.1 Years</div><div>Investment Recovered</div><div className="relative mx-auto mt-7 h-3 w-[86%] rounded-full bg-slate-700"><div className="absolute left-[43%] top-[-16px] text-3xl text-[#9cff4d]">●</div></div><div className="mx-auto mt-2 grid w-[86%] grid-cols-3 text-[7px]"><span>Activation<br/>May 12, 2024</span><span>Break-Even<br/>Jun 12, 2026</span><span>5 Year Mark<br/>May 12, 2029</span></div><div className="mt-4 text-left text-[#05ff5e]">View Timeline Details →</div></div>;
}

function RoiOverTimeChart() {
  const points = "34,130 62,118 90,108 118,88 146,76 174,72 202,64 230,60 258,54 286,42 314,38 342,30 370,26 398,24 426,20 454,18 488,16";
  return <div className="h-full text-[8px]"><svg className="h-[156px] w-full" viewBox="0 0 520 164"><g stroke="rgba(148,163,184,.16)">{[22,54,86,118,150].map(y=><line key={y} x1="32" x2="510" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="2" y="24">200%</text><text x="2" y="56">150%</text><text x="2" y="88">100%</text><text x="6" y="120">50%</text><text x="4" y="152">-50%</text></g><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#65a30d" key={i} r="2.6"/>})}<rect fill="#365314" height="30" rx="4" width="72" x="426" y="16"/><text fill="#d9f99d" fontSize="8" textAnchor="middle" x="462" y="30">Current ROI</text><text fill="#d9f99d" fontSize="8" textAnchor="middle" x="462" y="42">143%</text></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["0","6","12","18","24","30","36","42","48","54","60"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View ROI Trend Analysis →</div></div>;
}

function RoiBenefitBreakdown() {
  const rows = [["Energy Savings","$142,000","29.0%","▲ 12.4%"],["Demand Savings","$98,100","20.0%","▲ 11.1%"],["PF & Penalty Avoidance","$81,000","16.6%","▲ 11.1%"],["Capacity Value","$91,000","18.6%","▲ 14.0%"],["THD & Power Quality","$32,000","6.5%","▲ 12.3%"],["Other Optimizations","$45,220","9.3%","▲ 9.4%"],["TOTAL","$489,320","100%","▲ 12.1%"]];
  return <RoiTable headers={["Benefit Category","Annual Benefit ($)","% of Total","vs Prior Year"]} rows={rows} link="View Benefit Details →" />;
}

function RoiCostBreakdown() {
  const rows = [["Equipment","$780,000","60.9%"],["Installation","$280,000","21.9%"],["Engineering & Design","$110,000","8.6%"],["Integration & Testing","$70,000","5.5%"],["Training & Commissioning","$40,000","3.1%"],["TOTAL","$1,280,000","100%"]];
  return <RoiTable headers={["Cost Category","Amount ($)","% of Total"]} rows={rows} link="View Cost Details →" />;
}

function RoiFinancialMetrics() {
  const rows = [["ROI (Return on Investment)","143%"," > 100%","Excellent"],["Payback Period","2.1 Years","< 3.5 Years","Excellent"],["IRR (Internal Rate of Return)","68.7%","> 20%","Excellent"],["NPV (5 Year @ 10%)","$1,342,580","> $0","Excellent"],["Benefit / Cost Ratio","2.42","> 1.5","Excellent"]];
  return <RoiTable headers={["Metric","Value","Target","Status"]} rows={rows} link="View Financial Model →" />;
}

function RoiSavingsInvestment() {
  const rows = [["Total Investment","$1,280,000","#147dff",48],["5 Year Total Benefits","$2,446,600","#65a30d",92],["Net Benefit","$1,166,600","#65a30d",44]];
  return <div className="space-y-3 text-[8px]">{rows.map(([label,value,color,width])=><div className="grid grid-cols-[88px_1fr_78px] items-center gap-2" key={label as string}><span>{label}</span><span className="h-4 rounded-sm" style={{background: color as string, width: `${width}%`}}/><span>{value}</span></div>)}<div className="grid grid-cols-4 px-[88px] text-slate-400"><span>$0</span><span>$1M</span><span>$2M</span><span>$3M</span></div></div>;
}

function RoiSensitivity() {
  const rows = [["Base Case","$0.10 / kWh","$20.62 / kW","0.96","2.1 Years"],["Lower Rates (-20%)","$0.08 / kWh","$16.50 / kW","0.98","2.6 Years"],["Higher Rates (+20%)","$0.12 / kWh","$24.74 / kW","0.98","1.7 Years"],["Lower PF (0.93)","$0.10 / kWh","$20.62 / kW","0.93","2.8 Years"],["Higher PF (0.99)","$0.10 / kWh","$20.62 / kW","0.99","1.9 Years"]];
  return <RoiTable headers={["Scenario","Energy Rate","Demand Rate","PF Improvement","Payback Period"]} rows={rows} link="View Sensitivity Details →" />;
}

function RoiMilestones() {
  const rows = [["Project Approved","May 1, 2024","Completed"],["Equipment Installed","May 20, 2024","Completed"],["System Commissioned","Jun 1, 2024","Completed"],["ECBS Activated","May 12, 2024","Completed"],["Break-Even Achieved","Jun 12, 2026","On Track"],["5 Year Review","May 12, 2029","Upcoming"]];
  return <div className="space-y-1.5 text-[7.4px]">{rows.map(([a,b,c])=><div className="grid grid-cols-[16px_1fr_82px_68px] items-center gap-2" key={a}><span className="size-2.5 rounded-full bg-[#65a30d]"/><span>{a}</span><span>{b}</span><span className={c==="Completed"?"text-[#05ff5e]":c==="On Track"?"text-orange-300":"text-slate-400"}>{c}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Milestone History →</div></div>;
}

function RoiTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.9px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={i===row.length-1 || cell.startsWith("▲") || cell==="Excellent" ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsRoiPaybackDetailsScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">ROI & PAYBACK ANALYSIS - DETAILS</h1><p className="mt-1 text-[10px] text-slate-300">Deep dive into returns, cash flows, costs, and financial performance.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[190px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>‹ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-slate-400">ROI & Payback Analysis</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">ROI & Payback Analysis - Details</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <RoiDetailKpi icon="$" label="RETURN ON INVESTMENT (ROI)" value="No Data" detail="No approved investment model" trend="Blocked" tone="green" />
          <RoiDetailKpi icon="▣" label="PAYBACK PERIOD" value="No Data" detail="No approved cost basis" trend="Blocked" tone="cyan" />
          <RoiDetailKpi icon="⌁" label="NET PRESENT VALUE (NPV)" value="No Data" detail="No approved financial model" trend="Blocked" tone="purple" />
          <RoiDetailKpi icon="◴" label="INTERNAL RATE OF RETURN (IRR)" value="No Data" detail="No approved financial model" trend="Blocked" tone="orange" />
          <RoiDetailKpi icon="▥" label="TOTAL INVESTMENT" value="No Data" detail="No approved investment source" trend="Blocked" tone="cyan" />
          <RoiDetailKpi icon="◎" label="TOTAL ANNUAL BENEFIT" value={annualBenefitValue(data)} detail="Latest annual savings" trend="Direct Data" tone="yellow" />
        </section>
        <section className="mt-2 grid h-[214px] grid-cols-[1.08fr_0.78fr_1fr] gap-2">
          <DashboardPanel title="DETAILED CASH FLOW ANALYSIS" variant="enterprise"><NoDataBlock message="No Data - cash flow model is not approved." /></DashboardPanel>
          <DashboardPanel title="PAYBACK ANALYSIS DETAIL" variant="enterprise"><NoDataBlock message="No Data - payback model is not approved." /></DashboardPanel>
          <DashboardPanel title="ROI OVER TIME (Cumulative)" variant="enterprise"><NoDataBlock message="No Data - ROI trend model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[178px] grid-cols-3 gap-2">
          <DashboardPanel title="ANNUAL BENEFIT BREAKDOWN" variant="enterprise"><NoDataBlock message="No Data - benefit split is not approved." /></DashboardPanel>
          <DashboardPanel title="INVESTMENT BREAKDOWN" variant="enterprise"><NoDataBlock message="No Data - investment breakdown is not approved." /></DashboardPanel>
          <DashboardPanel title="COST OF DOING NOTHING (Avoided Costs)" variant="enterprise"><NoDataBlock message="No Data - avoided cost model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[180px] grid-cols-[1fr_0.86fr_0.94fr] gap-2">
          <DashboardPanel title="SENSITIVITY ANALYSIS (Impact on Payback Period)" variant="enterprise"><NoDataBlock message="No Data - sensitivity model is not approved." /></DashboardPanel>
          <DashboardPanel title="CUMULATIVE VALUE CREATION" variant="enterprise"><NoDataBlock message="No Data - cumulative value model is not approved." /></DashboardPanel>
          <DashboardPanel title="KEY TAKEAWAYS" variant="enterprise"><NoDataBlock message="No Data - financial insight model is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>ROI and Payback calculations are based on an approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function RoiDetailKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "purple" | "orange" | "yellow"; trend: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : tone === "purple" ? "#a855f7" : tone === "orange" ? "#ff8a00" : "#f59e0b";
  return <article className="grid grid-cols-[48px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-10 place-items-center rounded-full border-2 text-lg" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[22px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div><div className="mt-1 text-[7px] text-[#05ff5e]">{trend}</div></div></article>;
}

function RoiPaybackAnalysisDetail() {
  const rows = [["Activation Date","May 12, 2024"],["Break-Even Date","Jun 12, 2026"],["Payback Period","2.1 Years"],["Remaining Payback","1.9 Years"],["Target Payback","3.5 Years"],["Payback Variance","+1.4 Years Better"]];
  return <div className="grid h-full grid-rows-[1fr_70px_20px] text-[7.4px]"><div>{rows.map(([a,b])=><div className="flex justify-between border-b border-white/5 py-1" key={a}><span className="text-slate-400">{a}</span><b className={b.includes("Years") || b.includes("Better") ? "text-[#05ff5e]" : ""}>{b}</b></div>)}</div><div className="pt-4"><div className="relative mx-auto h-2 w-[90%] rounded-full bg-slate-700"><div className="absolute left-[43%] top-[-13px] text-2xl text-[#9cff4d]">●</div></div><div className="mx-auto mt-2 grid w-[90%] grid-cols-3 text-[6.7px]"><span>Activation<br/>May 12, 2024</span><span>Break-Even<br/>Jun 12, 2026</span><span>5 Year Mark<br/>May 12, 2029</span></div></div><div className="text-[#05ff5e]">View Timeline Details →</div></div>;
}

function RoiAvoidedCosts() {
  const rows = [["Energy Waste","$142,000","29.0%"],["Demand Charges","$98,100","20.0%"],["PF Penalties","$81,000","16.6%"],["Capacity Constraints","$91,000","18.6%"],["Equipment Stress / Maintenance","$32,000","6.5%"],["Risk & Downtime","$45,220","9.3%"],["TOTAL AVOIDED COSTS","$489,320","100%"]];
  return <RoiTable headers={["Cost Type","Annual Avoided Cost ($)","% of Total"]} rows={rows} link="View Avoided Cost Details →" />;
}

function RoiSensitivityDetail() {
  const rows = [["Base Case","$0.10","$20.62","0.98","$489,320","2.1 Years"],["Energy Rate -20%","$0.08","$20.62","0.98","$395,120","2.6 Years"],["Energy Rate +20%","$0.12","$20.62","0.98","$583,520","1.8 Years"],["Demand Rate -20%","$0.10","$16.50","0.98","$432,890","2.4 Years"],["Demand Rate +20%","$0.10","$24.74","0.98","$545,750","1.9 Years"],["PF Improvement 0.93","$0.10","$20.62","0.93","$412,210","2.5 Years"],["PF Improvement 0.99","$0.10","$20.62","0.99","$502,630","2.0 Years"]];
  return <RoiTable headers={["Scenario","Energy Rate ($/kWh)","Demand Rate ($/kW)","PF Improvement","Annual Benefit ($)","Payback Period"]} rows={rows} link="View Full Sensitivity Report →" />;
}

function RoiCumulativeValueCreation() {
  const rows = [["Total Benefits (5 Years)","$2,446,600","#65a30d",92],["Total Investment","$1,280,000","#147dff",48],["Net Value Created","$1,166,600","#65a30d",44]];
  return <div className="space-y-3 text-[8px]">{rows.map(([label,value,color,width])=><div className="grid grid-cols-[112px_1fr_78px] items-center gap-2" key={label as string}><span>{label}</span><span className="h-4 rounded-sm" style={{background: color as string, width: `${width}%`}}/><span>{value}</span></div>)}<div className="grid grid-cols-6 px-[112px] text-[7px] text-slate-400"><span>$0</span><span>$500K</span><span>$1M</span><span>$1.5M</span><span>$2M</span><span>$2.5M</span></div><div className="pt-2 text-[#05ff5e]">View Value Creation Details →</div></div>;
}

function RoiKeyTakeaways() {
  const rows = ["ECBS delivers 143% ROI, exceeding the target of 100%.","Payback achieved in 2.1 years, 1.4 years better than target.","Annual benefits of $489,320 drive strong cash flow and NPV.","IRR of 68.7% significantly outperforms cost of capital.","System continues to deliver increasing value year over year."];
  return <div className="space-y-3 text-[8px]">{rows.map(row=><div className="grid grid-cols-[18px_1fr]" key={row}><span className="text-[#65a30d]">●</span><span>{row}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Executive Summary →</div></div>;
}

export function EnergySavingsRealTimeValueDetailScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">REAL-TIME VALUE ENGINE™ &nbsp; &gt; &nbsp; VALUE CREATION DETAIL</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[210px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}<br/>Tracking</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>⌂ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-slate-400">Real-Time Value Engine</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Value Creation Detail</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button></div></div>
        <section className="grid h-[88px] grid-cols-6 gap-2">
          <ValueKpi icon="⚡" label="CURRENT VALUE CREATION RATE" value="No Data" unit="" detail="No approved real-time value model" trend="Blocked" tone="green" />
          <ValueKpi icon="▣" label="REAL-TIME ENERGY VALUE" value="No Data" unit="" detail="No approved split model" trend="Blocked" tone="cyan" />
          <ValueKpi icon="⌁" label="REAL-TIME DEMAND VALUE" value="No Data" unit="" detail="No approved demand model" trend="Blocked" tone="orange" />
          <ValueKpi icon="☆" label="PF & PENALTY VALUE" value="No Data" unit="" detail="No approved PF penalty model" trend="Blocked" tone="purple" />
          <ValueKpi icon="▥" label="CAPACITY VALUE" value={formatCurrencyValue(data?.deferredCapitalValue)} unit="" detail="Latest deferred value" trend="Direct Data" tone="cyan" />
          <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-[8px] text-slate-400">VALUE SINCE ACTIVATION</div><div className="mt-1 text-2xl leading-none">No Data</div><div className="mt-3 text-[9px] text-slate-300">No lifetime value rollup</div></article>
        </section>
        <section className="mt-2 grid h-[206px] grid-cols-[0.98fr_0.88fr_1fr] gap-2">
          <DashboardPanel title="LIVE VALUE STREAM (Per Minute)" variant="enterprise"><NoDataBlock message="No Data - real-time value stream model is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE CREATION BREAKDOWN (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - value split model is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE CONTRIBUTION (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - contribution trend source is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[182px] grid-cols-3 gap-2">
          <DashboardPanel title="VALUE CREATION BY DRIVER (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - driver allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE CREATION BY SOURCE (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - source allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE CREATION BY SITE / AREA (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - site allocation is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[188px] grid-cols-[0.92fr_0.88fr_1.08fr] gap-2">
          <DashboardPanel title="VALUE FLOW DIAGRAM (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - value flow model is not approved." /></DashboardPanel>
          <DashboardPanel title="INSTANT VALUE CALCULATOR (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - value calculator formula is not approved." /></DashboardPanel>
          <DashboardPanel title="REAL-TIME VALUE EVENTS" variant="enterprise"><NoDataBlock message="No Data - value event source is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Real-Time Value is calculated using approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function ValueKpi({ detail, icon, label, tone, trend, unit, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "orange" | "purple"; trend: string; unit: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : tone === "orange" ? "#ff8a00" : "#a855f7";
  return <article className="grid grid-cols-[48px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-10 place-items-center rounded-full border-2 text-lg" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[22px] leading-none" style={{ color }}>{value} <span className="text-[13px] text-slate-100">{unit}</span></div><div className="mt-1 text-[8px] text-slate-300">{detail}</div><div className="mt-1 text-[7px] text-[#05ff5e]">{trend}</div></div></article>;
}

function ValueLiveStream() {
  const points = "28,102 54,98 80,92 106,96 132,84 158,88 184,86 210,82 236,88 262,84 288,78 314,82 340,74 366,78 392,72 418,66 444,88 470,52 496,70";
  return <div className="h-full text-[8px]"><svg className="h-[132px] w-full" viewBox="0 0 520 140"><g stroke="rgba(148,163,184,.16)">{[18,44,70,96,122].map(y=><line key={y} x1="28" x2="510" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="22">$6.00</text><text x="0" y="48">$4.00</text><text x="0" y="74">$2.00</text><text x="0" y="126">$0.00</text></g><polygon fill="rgba(5,255,94,.17)" points={`${points} 496,126 28,126`} /><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2"/><rect fill="#061421" height="42" rx="4" stroke="rgba(103,232,249,.25)" width="66" x="430" y="18"/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="463" y="33">10:15 AM</text><text fill="#e2e8f0" fontSize="9" textAnchor="middle" x="463" y="47">$3.72 / Min</text></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["9:15 AM","9:30 AM","9:45 AM","10:00 AM","10:15 AM"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-2 flex justify-center gap-2 text-[7px]"><span className="rounded bg-[#063b27] px-3 py-1">1H</span><span>6H</span><span>12H</span><span>24H</span><span>7D</span><span>30D</span></div></div>;
}

function ValueBreakdownDonut() {
  const rows = [["Energy Value","$2.18 (58.6%)","#65a30d"],["Demand Value","$1.02 (27.4%)","#ff8a00"],["PF & Penalty Value","$0.37 (9.9%)","#a855f7"],["Capacity Value","$0.15 (4.0%)","#06b6d4"]];
  return <div className="grid h-full grid-cols-[140px_1fr] items-center gap-2 text-[8px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="118 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#ff8a00" strokeDasharray="55 201" strokeDashoffset="-120" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#a855f7" strokeDasharray="20 201" strokeDashoffset="-177" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[42px] w-[132px] text-center"><b className="text-2xl">$3.72</b><br/>Per Minute</div></div><div className="space-y-3">{rows.map(([a,b,c])=><div className="grid grid-cols-[10px_1fr] gap-2" key={a}><span className="mt-1 size-2 rounded-full" style={{background:c}}/><span>{a}<br/><b>{b}</b></span></div>)}<div className="pt-1 text-[#05ff5e]">View Breakdown Details →</div></div></div>;
}

function ValueContributionArea() {
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5 text-[7px]"><span className="text-[#65a30d]">■ Energy Value</span><span className="text-[#ff8a00]">■ Demand Value</span><span className="text-[#a855f7]">■ PF & Penalty Value</span><span className="text-cyan-300">■ Capacity Value</span></div><svg className="h-[132px] w-full" viewBox="0 0 500 140"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104,132].map(y=><line key={y} x1="32" x2="490" y1={y} y2={y}/>)}</g><polygon fill="#06b6d4" points="34,126 86,126 138,124 190,123 242,122 294,121 346,120 398,119 456,118 456,132 34,132"/><polygon fill="#a855f7" points="34,104 86,102 138,101 190,100 242,99 294,98 346,96 398,96 456,94 456,118 34,126"/><polygon fill="#ff8a00" points="34,74 86,70 138,72 190,68 242,66 294,64 346,60 398,58 456,54 456,94 34,104"/><polygon fill="#65a30d" points="34,46 86,40 138,44 190,38 242,36 294,34 346,28 398,30 456,24 456,54 34,74"/></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["9:15 AM","9:30 AM","9:45 AM","10:00 AM","10:15 AM"].map(d=><span key={d}>{d}</span>)}</div></div>;
}

function ValueDriverTable() {
  const rows = [["Energy Efficiency","$2.18","58.6%","▲ $1.31","⌁"],["Demand Reduction","$1.02","27.4%","▲ $0.61","⌁"],["PF & Penalty Avoidance","$0.37","9.9%","▲ $0.23","⌁"],["Capacity Optimization","$0.15","4.0%","▲ $0.08","⌁"],["TOTAL","$3.72","100%","▲ $2.23",""]];
  return <ValueTable headers={["Driver","Value ($/Min)","% of Total","vs Baseline ($/Min)","Trend (5 Min)"]} rows={rows} link="View Driver Analysis →" />;
}

function ValueSourceTable() {
  const rows = [["HVAC Systems","$1.48","39.8%","▲ $0.89","⌁"],["Motor Systems","$0.89","24.0%","▲ $0.54","⌁"],["Lighting Systems","$0.41","11.0%","▲ $0.25","⌁"],["Process Equipment","$0.54","14.5%","▲ $0.32","⌁"],["Compressed Air","$0.25","6.7%","▲ $0.16","⌁"],["Other Systems","$0.15","4.0%","▲ $0.07","⌁"],["TOTAL","$3.72","100%","▲ $2.23",""]];
  return <ValueTable headers={["Source","Value ($/Min)","% of Total","vs Baseline ($/Min)","Trend (5 Min)"]} rows={rows} link="View Source Analytics →" />;
}

function ValueSiteTable() {
  const rows = [["Main Facility","$2.46","66.1%","▲ $1.44","⌁"],["Production Area","$0.72","19.4%","▲ $0.43","⌁"],["Warehouse","$0.24","6.5%","▲ $0.13","⌁"],["Office Building","$0.18","4.8%","▲ $0.11","⌁"],["Auxiliary Systems","$0.12","3.2%","▲ $0.08","⌁"],["TOTAL","$3.72","100%","▲ $2.23",""]];
  return <ValueTable headers={["Site / Area","Value ($/Min)","% of Total","vs Baseline ($/Min)","Trend (5 Min)"]} rows={rows} link="View Site Analytics →" />;
}

function ValueFlowDiagram() {
  return <div className="relative grid h-full place-items-center text-center text-[7px]"><div className="grid w-full grid-cols-[74px_24px_112px_24px_78px] items-center justify-center gap-2"><div className="rounded border border-cyan-300/20 bg-[#061421] p-2">INPUT<br/>Utility Supply<br/><b>$8.94 / Min</b></div><div className="text-xl">→</div><div className="rounded border border-[#65a30d]/50 bg-[#063b27]/40 p-3">ECBS Optimization<br/>Engine™<br/><b className="text-3xl text-[#65a30d]">X</b></div><div className="text-xl">→</div><div className="rounded-full border border-orange-400/60 bg-[#061421] p-3">VALUE CREATED<br/><b>$3.72 / Min</b><br/>41.6% Improvement</div></div><div className="mt-3 grid w-[82%] grid-cols-4 gap-2">{[["Loss Reduction","$1.80 / Min"],["Load Optimization","$1.12 / Min"],["Power Quality","$0.52 / Min"],["Capacity Recovery","$0.28 / Min"]].map(([a,b])=><div className="rounded border border-[#65a30d]/30 bg-[#061421] p-2" key={a}>{a}<br/><b>{b}</b></div>)}</div><div className="absolute bottom-0 left-0 text-[#05ff5e]">View Flow Analysis →</div></div>;
}

function ValueCalculator() {
  const rows = [["Energy Value","214.6 kWh/min × $0.1016 /kWh","$2.18"],["Demand Value","18.9 kW/min × $0.0541 /kW","$1.02"],["PF & Penalty Value","PF Improvement to 0.98","$0.37"],["Capacity Value","Recovered Capacity Utilization","$0.15"],["TOTAL","","$3.72 / Minute"]];
  return <ValueTable headers={["Component","Calculation","Value ($/Min)"]} rows={rows} link="View Calculation Details →" />;
}

function ValueEvents() {
  const rows = [["10:15:12 AM","HVAC Load Optimization","+$0.42","Energy","Applied"],["10:14:55 AM","Motor Load Balance","+$0.31","Demand","Applied"],["10:14:37 AM","PF Correction Adjustment","+$0.21","PF & Penalty","Applied"],["10:14:18 AM","Peak Demand Shaving","+$0.18","Demand","Applied"],["10:13:59 AM","Lighting Optimization","+$0.08","Energy","Applied"]];
  return <ValueTable headers={["Time","Event","Impact ($/Min)","Driver","Status"]} rows={rows} link="View All Events →" />;
}

function ValueTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={cell.startsWith("▲") || cell.startsWith("+") || cell==="Applied" ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[7px] text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsRealTimeValueEngineScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">REAL-TIME VALUE ENGINE™</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}⌄</button><span className="text-[8px]">Tracking DB<br/>Read-only</span><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>⌂ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Real-Time Value Engine</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Configure</button></div></div>
        <section className="grid h-[104px] grid-cols-6 gap-2">
          <ValueKpi icon="⚡" label="CURRENT VALUE CREATION RATE" value="No Data" unit="" detail="No approved real-time value model" trend="Blocked" tone="green" />
          <ValueKpi icon="▣" label="REAL-TIME ENERGY VALUE" value="No Data" unit="" detail="No approved split model" trend="Blocked" tone="cyan" />
          <ValueKpi icon="⌁" label="REAL-TIME DEMAND VALUE" value="No Data" unit="" detail="No approved demand model" trend="Blocked" tone="orange" />
          <ValueKpi icon="☆" label="PF & PENALTY VALUE" value="No Data" unit="" detail="No approved PF penalty model" trend="Blocked" tone="purple" />
          <ValueKpi icon="▥" label="CAPACITY VALUE" value={formatCurrencyValue(data?.deferredCapitalValue)} unit="" detail="Latest deferred value" trend="Direct Data" tone="cyan" />
          <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-[8px] text-slate-400">VALUE SINCE ACTIVATION</div><div className="mt-3 text-2xl leading-none">No Data</div><div className="mt-3 text-[9px] text-slate-300">No lifetime value rollup</div></article>
        </section>
        <section className="mt-2 grid h-[206px] grid-cols-[0.96fr_0.86fr_1.1fr] gap-2">
          <DashboardPanel title="VALUE CREATION RATE (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - real-time value model is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE CREATION BREAKDOWN (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - value split model is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE CONTRIBUTION TREND (Real-Time)" variant="enterprise"><NoDataBlock message="No Data - contribution trend source is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[184px] grid-cols-[0.94fr_0.9fr_1.1fr] gap-2">
          <DashboardPanel title="REAL-TIME VALUE BY SOURCE" variant="enterprise"><NoDataBlock message="No Data - source allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="REAL-TIME VALUE BY SITE / AREA" variant="enterprise"><NoDataBlock message="No Data - site allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="REAL-TIME SYSTEM IMPACT" variant="enterprise"><NoDataBlock message="No Data - system impact model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[180px] grid-cols-[0.78fr_1.08fr_0.78fr] gap-2">
          <DashboardPanel title="VALUE ACCUMULATION (Today)" variant="enterprise"><NoDataBlock message="No Data - daily value accumulation source is not approved." /></DashboardPanel>
          <DashboardPanel title="LIVE VALUE STREAM (Per Minute)" variant="enterprise"><NoDataBlock message="No Data - minute stream source is not approved." /></DashboardPanel>
          <DashboardPanel title="REAL-TIME VALUE DRIVERS" variant="enterprise"><NoDataBlock message="No Data - value driver model is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Real-Time Value is calculated using approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function ValueSystemImpact() {
  const gauges = [["Power Factor","Improvement","0.98","Target: 0.95","#65a30d"],["Demand Reduction","(kW)","742","Peak Reduction","#ff8a00"],["THD Improvement","(%)","-62%","vs Baseline","#65a30d"],["System Efficiency","Gain (%)","31.7%","vs Baseline","#f59e0b"]];
  return <div className="grid h-full grid-cols-4 gap-2 text-center text-[7px]">{gauges.map(([a,b,value,detail,color])=><div className="flex flex-col items-center justify-center" key={a}><div>{a}<br/>{b}</div><svg className="mt-2 h-[72px] w-[86px]" viewBox="0 0 100 78"><path d="M18 62 A32 32 0 0 1 82 62" fill="none" stroke="#1f2937" strokeWidth="12"/><path d="M18 62 A32 32 0 0 1 78 44" fill="none" stroke={color} strokeWidth="12"/><text fill="#e2e8f0" fontSize="18" textAnchor="middle" x="50" y="61">{value}</text></svg><span>{detail}</span></div>)}<div className="col-span-4 text-left text-[#05ff5e]">View System Impact Details →</div></div>;
}

function ValueAccumulation() {
  return <div className="grid h-full grid-cols-[132px_1fr] gap-3 text-[8px]"><div className="relative"><svg className="size-[128px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="36" stroke="#1f2937" strokeWidth="12"/><circle cx="50" cy="50" fill="none" r="36" stroke="#65a30d" strokeDasharray="118 226" strokeWidth="12" transform="rotate(-120 50 50)"/><text fill="#e2e8f0" fontSize="16" textAnchor="middle" x="50" y="52">$1,284</text><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="50" y="64">Today</text></svg><div className="absolute bottom-1 left-2 text-[7px]">$0</div><div className="absolute bottom-1 right-2 text-[7px]">$5,000</div></div><div className="space-y-3 pt-5"><div>Projected Today<br/><b>$1,540</b></div><div>Yesterday<br/><b>$1,128</b></div><div>7-Day Average (Daily)<br/><b>$1,167</b></div></div><div className="col-span-2 text-[#05ff5e]">View Accumulation Details →</div></div>;
}

function ValueMinuteBars() {
  const rows = ["10:05","10:06","10:07","10:08","10:09","10:10","10:11","10:12","10:13","10:14","10:15"];
  const values = ["$3.21","$3.48","$3.72","$3.68","$3.74","$3.69","$3.72","$3.70","$3.72","$3.72","$3.72"];
  return <div className="h-full text-[8px]"><svg className="h-[112px] w-full" viewBox="0 0 620 120"><g stroke="rgba(148,163,184,.16)">{[20,50,80,110].map(y=><line key={y} x1="34" x2="610" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">$6.00</text><text x="0" y="54">$4.00</text><text x="0" y="84">$2.00</text><text x="0" y="112">$0.00</text></g>{rows.map((r,i)=>{const x=48+i*50; const h=42+(i%3)*3; return <g key={r}><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+12} y={104-h}>{values[i]}</text><rect fill="#65a30d" height={h} width="22" x={x} y={106-h}/><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+11} y="118">{r}</text></g>})}</svg><div className="mt-2 text-[#05ff5e]">View Full Stream →</div></div>;
}

function ValueDriversList() {
  const rows = [["Energy Efficiency","Strong","$2.18 / Min"],["Demand Reduction","Strong","$1.02 / Min"],["PF & Penalty Avoidance","Strong","$0.37 / Min"],["Capacity Optimization","Moderate","$0.15 / Min"],["System Stability","Strong","Optimal"]];
  return <div className="space-y-2 text-[8px]">{rows.map(([a,b,c])=><div className="grid grid-cols-[16px_1fr_62px_60px] items-center gap-2 border-b border-white/5 pb-1" key={a}><span className="text-[#65a30d]">●</span><span>{a}</span><span className={b==="Moderate"?"text-cyan-300":"text-[#05ff5e]"}>{b}</span><b>{c}</b></div>)}<div className="pt-1 text-[#05ff5e]">View Driver Analysis →</div></div>;
}

export function EnergySavingsEngineEnergySavingsDetailScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">SAVINGS ENGINE™ &nbsp; &gt; &nbsp; SAVINGS BREAKDOWN DETAIL &nbsp; &gt; &nbsp; <span className="text-[#05ff5e]">ENERGY SAVINGS DETAIL</span></h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>⌂ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-slate-400">Savings Engine</span> &nbsp; › &nbsp; <span className="text-slate-400">Savings Breakdown Detail</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Energy Savings Detail</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">More</button></div></div>
        <section className="grid h-[86px] grid-cols-6 gap-2">
          <SavingsDetailKpi icon="ϟ" label="ENERGY SAVINGS - THIS MONTH" value="No Data" detail="No monthly split source" trend="Blocked" tone="green" />
          <SavingsDetailKpi icon="▣" label="kWh SAVED - THIS MONTH" value="No Data" detail="No kWh rollup source" trend="" tone="cyan" />
          <SavingsDetailKpi icon="◴" label="AVERAGE SAVINGS RATE" value="No Data" detail="No hourly model" trend="" tone="cyan" />
          <SavingsDetailKpi icon="↗" label="PEAK HOURLY SAVINGS" value="No Data" detail="No peak savings model" trend="" tone="purple" />
          <SavingsDetailKpi icon="◎" label="CUMULATIVE kWh SAVED" value="No Data" detail="No lifetime kWh rollup" trend="" tone="cyan" />
          <SavingsDetailKpi icon="⌁" label="ENERGY SAVINGS RATE" value="No Data" detail="No approved rate source" trend="" tone="purple" />
        </section>
        <SavingsDetailTabs />
        <section className="mt-2 grid h-[270px] grid-cols-[1.02fr_1.02fr_0.86fr] gap-2">
          <DashboardPanel title="kWh SAVINGS TREND - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - kWh savings trend source is not approved." /></DashboardPanel>
          <DashboardPanel title="HOURLY SAVINGS PROFILE - THIS MONTH (Average kWh Saved)" variant="enterprise"><NoDataBlock message="No Data - hourly savings source is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS BY DAY OF WEEK - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - day-of-week savings source is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[284px] grid-cols-[1fr_1fr_0.88fr] gap-2">
          <DashboardPanel title="SAVINGS BY SYSTEM - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - system savings allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="BASELINE vs CURRENT - ENERGY (kWh)" variant="enterprise"><NoDataBlock message="No Data - baseline energy contract is not approved." /></DashboardPanel>
          <DashboardPanel title="ENERGY SAVINGS INSIGHTS" variant="enterprise"><NoDataBlock message="No Data - savings insight model is not approved." /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Savings are calculated using an approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function SavingsDetailKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "purple"; trend: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : "#a855f7";
  return <article className="grid grid-cols-[46px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-10 place-items-center rounded-full border-2 text-lg" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[21px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div>{trend && <div className="mt-1 text-[7px] text-[#05ff5e]">{trend}</div>}</div></article>;
}

function SavingsDetailTabs() {
  const tabs = ["Overview","kWh Savings Trend","Savings By System","Savings By Time","Baseline Comparison","Drivers & Insights","Data Quality","Reports"];
  return <div className="mt-2 flex h-[30px] items-center border-b border-cyan-300/10 text-[8px]">{tabs.map((tab)=><span className={tab==="kWh Savings Trend"?"mr-8 border-b-2 border-cyan-300 pb-2 text-cyan-300":"mr-8 pb-2 text-slate-300"} key={tab}>{tab}</span>)}</div>;
}

function KwhSavingsTrend() {
  const points = "34,136 66,104 98,96 130,100 162,94 194,74 226,62 258,48 290,36 322,26 354,20 386,10 418,28 450,8 482,16 514,6";
  return <div className="h-full text-[8px]"><svg className="h-[148px] w-full" viewBox="0 0 540 156"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104,132].map(y=><line key={y} x1="34" x2="528" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="2" y="22">20K</text><text x="2" y="50">16K</text><text x="2" y="78">12K</text><text x="8" y="106">8K</text><text x="8" y="134">2K</text></g><polygon fill="rgba(5,255,94,.18)" points={`${points} 514,140 34,140`} /><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#65a30d" key={i} r="2.5"/>})}<rect fill="#061421" height="42" rx="4" stroke="rgba(103,232,249,.25)" width="72" x="436" y="10"/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="472" y="26">May 18, 2025</text><text fill="#e2e8f0" fontSize="9" textAnchor="middle" x="472" y="40">18,674 kWh</text></svg><div className="flex justify-between px-7 text-[7px] text-slate-400">{["May 1","May 3","May 5","May 7","May 9","May 11","May 13","May 15","May 17"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-2 grid grid-cols-5 gap-1 text-[7px]"><SavingsMiniStat label="Total kWh Saved" value="336,812 kWh" /><SavingsMiniStat label="Daily Average" value="18,712 kWh" /><SavingsMiniStat label="Highest Day" value="24,836 kWh" detail="May 15" /><SavingsMiniStat label="Lowest Day" value="12,548 kWh" detail="May 3" /><SavingsMiniStat label="Week of May 12-18" value="109,342 kWh" detail="32.4% of Monthly Total" /></div><div className="mt-1 text-[#05ff5e]">View Trend Analysis →</div></div>;
}

function SavingsMiniStat({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return <div><span className="text-slate-400">{label}</span><br/><b className="text-[#05ff5e]">{value}</b>{detail && <><br/><span>{detail}</span></>}</div>;
}

function HourlySavingsProfile() {
  const hours = ["12 AM","2 AM","4 AM","6 AM","8 AM","10 AM","12 PM","2 PM","4 PM","6 PM","8 PM","10 PM"];
  return <div className="h-full text-[8px]"><svg className="h-[150px] w-full" viewBox="0 0 520 158"><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,126,150].map(y=><line key={y} x1="34" x2="510" y1={y} y2={y}/>)}</g>{Array.from({length:24}).map((_,i)=>{const x=42+i*19; const h=[52,50,54,72,82,88,96,104,112,118,104,108,112,120,132,144,124,112,102,88,72,58,44,34][i]; return <rect fill="#65a30d" height={h*.75} key={i} width="12" x={x} y={136-h*.75}/>})}<rect fill="#061421" height="38" rx="4" stroke="rgba(103,232,249,.25)" width="72" x="366" y="14"/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="402" y="28">2:00 PM</text><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="402" y="42">412.6 kWh</text></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{hours.map(h=><span key={h}>{h}</span>)}</div><div className="mt-2 grid grid-cols-4 text-[7px]"><SavingsMiniStat label="Off-Peak (12 AM - 6 AM)" value="82.3 kWh / hr" /><SavingsMiniStat label="Mid-Peak (6 AM - 4 PM)" value="208.7 kWh / hr" /><SavingsMiniStat label="Peak (4 PM - 9 PM)" value="274.6 kWh / hr" /><SavingsMiniStat label="On-Peak (9 PM - 12 AM)" value="121.4 kWh / hr" /></div><div className="mt-1 text-[#05ff5e]">View Hourly Analysis →</div></div>;
}

function SavingsDayOfWeek() {
  const rows = [["Monday","51,842 kWh",74],["Tuesday","52,904 kWh",77],["Wednesday","51,211 kWh",73],["Thursday","55,328 kWh",82],["Friday","54,918 kWh",80],["Saturday","34,287 kWh",50],["Sunday","36,322 kWh",53]];
  return <div className="space-y-3 text-[8px]">{rows.map(([day,value,width])=><div className="grid grid-cols-[72px_1fr_74px] items-center gap-3" key={day as string}><span>{day}</span><span className="h-4 rounded-sm bg-[#65a30d]" style={{width:`${width}%`}}/><span>{value}</span></div>)}<div className="pt-3 text-[#05ff5e]">View Day of Week Analysis →</div></div>;
}

function SavingsSystemTable() {
  const rows = [["HVAC Systems","182,451","128,349","54,102","29.7%","$2,981","⌁"],["Motor Systems","96,245","66,713","29,532","30.7%","$1,626","⌁"],["Process Equipment","64,318","44,875","19,443","30.2%","$1,069","⌁"],["Lighting Systems","22,871","14,556","8,315","36.4%","$457","⌁"],["Compressed Air","17,562","11,896","5,666","32.2%","$311","⌁"],["Other Systems","9,482","6,200","3,282","34.6%","$181","⌁"],["TOTAL","393,009","272,589","336,812","31.2%","$6,625",""]];
  return <SavingsDetailTable headers={["System","Baseline kWh","Current kWh","kWh Saved","Savings (%)","Savings ($)","Trend vs Last Month"]} rows={rows} link="View System Attribution →        Export CSV ⇩" />;
}

function SavingsBaselineComparison() {
  const groups = [["HVAC\nSystems",64512,45378],["Motor\nSystems",34218,24671],["Process\nEquip.",22146,15892],["Lighting\nSystems",7845,5306],["Others",6156,5464]];
  return <div className="h-full text-[8px]"><div className="mb-1 flex gap-4 text-[7px]"><span className="text-slate-300">■ Baseline (May 12 - May 18, 2024)</span><span className="text-[#65a30d]">■ Current (May 12 - May 18, 2025)</span></div><svg className="h-[148px] w-full" viewBox="0 0 500 156"><g stroke="rgba(148,163,184,.16)">{[22,50,78,106,134].map(y=><line key={y} x1="34" x2="490" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="4" y="24">100K</text><text x="8" y="78">60K</text><text x="12" y="132">20K</text></g>{groups.map(([label,b,c],i)=>{const x=64+i*78; const bh=Number(b)/650; const ch=Number(c)/650; return <g key={String(label)}><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+10} y={132-bh}>{String(b).replace(/\\B(?=(\\d{3})+(?!\\d))/g,",")}</text><rect fill="#94a3b8" height={bh} width="22" x={x} y={138-bh}/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+37} y={132-ch}>{String(c).replace(/\\B(?=(\\d{3})+(?!\\d))/g,",")}</text><rect fill="#65a30d" height={ch} width="22" x={x+26} y={138-ch}/><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+24} y="152">{String(label)}</text></g>})}</svg><div className="mt-1 text-[#05ff5e]">View Baseline Comparison →</div></div>;
}

function SavingsInsights() {
  const rows = ["Energy Savings of 336,812 kWh this month represents a 31.2% reduction vs baseline.","Peak savings occurred on May 15 at 2:00 PM with 412.6 kWh saved in that hour.","HVAC Systems contributed the most with 54,102 kWh saved (29.7% of total).","Weekend savings average 33,305 kWh/day, 17% lower than weekday average.","Savings rate of $0.055 / kWh is 8.6% better than blended utility rate."];
  return <div className="space-y-5 text-[8px]">{rows.map(row=><div className="grid grid-cols-[20px_1fr] items-start" key={row}><span className="grid size-4 place-items-center rounded-full bg-[#65a30d] text-[#020a12]">✓</span><span>{row}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Insights Report →</div></div>;
}

function SavingsDetailTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={i>=3 || cell==="⌁" ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsEngineValueDriversDetailScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/energy-dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">SAVINGS ENGINE™ &nbsp; &gt; &nbsp; VALUE DRIVERS DETAIL</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>⌂ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-slate-400">Savings Engine</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Value Drivers Detail</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">More</button></div></div>
        <section className="grid h-[76px] grid-cols-[1fr_1.05fr_1.05fr_1.05fr_1.05fr_0.8fr] gap-2">
          <SavingsDriverKpi icon="$" label="TOTAL SAVINGS - THIS MONTH" value="No Data" detail="No monthly rollup" tone="green" />
          <SavingsDriverKpi icon="▣" label="ENERGY SAVINGS" value="No Data" detail="No approved split" trend="Blocked" tone="cyan" />
          <SavingsDriverKpi icon="⌘" label="DEMAND SAVINGS" value="No Data" detail="No approved split" trend="Blocked" tone="orange" />
          <SavingsDriverKpi icon="⌁" label="PF & PENALTY SAVINGS" value="No Data" detail="No approved split" trend="Blocked" tone="purple" />
          <SavingsDriverKpi icon="▣" label="CAPACITY VALUE" value={formatCurrencyValue(data?.deferredCapitalValue)} detail="Latest deferred value" trend="Direct Data" tone="cyan" />
          <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-2"><div className="text-[7px] text-slate-400">SAVINGS RATE</div><div className="mt-1 text-lg leading-none">No Data</div><div className="mt-1 text-[9px]">No approved rate model</div><TinyDriverSpark /></article>
        </section>
        <SavingsDriverTabs />
        <section className="mt-2 grid h-[218px] grid-cols-[0.96fr_0.86fr_0.76fr] gap-2">
          <DashboardPanel title="VALUE DRIVERS BREAKDOWN - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - value driver split is not approved." /></DashboardPanel>
          <DashboardPanel title="VALUE DRIVER TREND (LAST 30 DAYS)" variant="enterprise"><NoDataBlock message="No Data - driver trend source is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS CONTRIBUTION (STACKED)" variant="enterprise"><NoDataBlock message="No Data - savings contribution model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[212px] grid-cols-[1.02fr_0.7fr_0.74fr] gap-2">
          <DashboardPanel title="VALUE DRIVERS BY SYSTEM" variant="enterprise"><NoDataBlock message="No Data - system value driver allocation is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS PER UNIT" variant="enterprise"><NoDataBlock message="No Data - unit economics model is not approved." /></DashboardPanel>
          <DashboardPanel title="TIME OF DAY IMPACT - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - time-of-day savings source is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[196px] grid-cols-[0.88fr_1.2fr] gap-2">
          <DashboardPanel title="VALUE DRIVER INSIGHTS" variant="enterprise"><NoDataBlock message="No Data - driver insight model is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS HISTORY" variant="enterprise"><NoDataBlock message="No Data - savings history rollup is not approved." /></DashboardPanel>
        </section>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function SavingsDriverKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "orange" | "purple"; trend?: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : tone === "orange" ? "#f59e0b" : "#a855f7";
  return <article className="grid grid-cols-[43px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-2.5"><div className="grid size-9 place-items-center rounded-full border-2 text-base" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[20px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[7.5px] text-slate-300">{detail}</div>{trend && <div className="mt-0.5 text-[7px] text-[#05ff5e]">{trend}</div>}</div></article>;
}

function TinyDriverSpark() {
  return <svg className="mt-1 h-3 w-full" viewBox="0 0 120 20"><polyline fill="none" points="0,14 10,12 20,14 30,10 40,12 50,8 60,11 70,6 80,9 90,5 100,7 118,3" stroke="#65a30d" strokeWidth="2" /></svg>;
}

function SavingsDriverTabs() {
  const tabs = ["Overview","Savings Breakdown","Time Analysis","Value Drivers","Savings Attribution","Reports"];
  return <div className="mt-2 flex h-[28px] items-center border-b border-cyan-300/10 text-[8px]">{tabs.map((tab)=><span className={tab==="Value Drivers"?"mr-9 border-b-2 border-cyan-300 pb-2 text-cyan-300":"mr-9 pb-2 text-slate-300"} key={tab}>{tab}</span>)}</div>;
}

function ValueDriversBreakdownTable() {
  const rows = [["●","Energy Savings","Reduced kWh consumption","$18,674","49.2%","↑ 10.8%"],["●","Demand Savings","Lower peak demand charges","$11,483","30.3%","↑ 13.5%"],["●","PF & Penalty Savings","Improved power factor / avoided penalties","$4,912","12.9%","↑ 9.4%"],["●","Capacity Recovery","Recovered kVA capacity value","$2,853","7.5%","↑ 8.7%"],["●","Other Optimizations","System tuning & efficiency gains","$1,284","3.4%","↑ 6.2%"],["","TOTAL","","$37,922","100%","↑ 11.7%"]];
  return <div className="h-full text-[7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Value Driver","Description","Savings ($)","% of Total","Trend vs Last Month"].map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr className="border-t border-white/5" key={r[1]}><td className="py-1"><span className={i===0?"text-[#65a30d]":i===1?"text-[#147dff]":i===2?"text-[#f59e0b]":i===3?"text-[#a855f7]":i===4?"text-cyan-300":"text-slate-300"}>{r[0]}</span> {r[1]}</td><td className="py-1">{r[2]}</td><td className="py-1">{r[3]}</td><td className="py-1">{r[4]}</td><td className="py-1 text-[#05ff5e]">{r[5]}</td></tr>)}</tbody></table></div>;
}

function ValueDriverTrend() {
  const lines = [["#65a30d","40,82 70,76 100,78 130,72 160,74 190,66 220,62 250,64 280,62 310,58 340,60 370,56 400,58 430,54 460,52"],["#147dff","40,126 70,118 100,120 130,116 160,118 190,112 220,110 250,104 280,108 310,104 340,102 370,104 400,108 430,100 460,104"],["#f59e0b","40,144 70,140 100,142 130,140 160,138 190,134 220,136 250,132 280,136 310,134 340,132 370,134 400,130 430,128 460,130"],["#a855f7","40,166 70,164 100,162 130,160 160,158 190,156 220,154 250,152 280,150 310,148 340,148 370,146 400,144 430,144 460,142"],["#00bcd4","40,178 70,176 100,174 130,172 160,171 190,168 220,166 250,164 280,163 310,162 340,160 370,160 400,158 430,156 460,155"]];
  return <div className="h-full text-[7px]"><div className="mb-1 flex justify-center gap-3"><span className="text-[#65a30d]">● Energy Savings</span><span className="text-[#147dff]">● Demand Savings</span><span className="text-[#f59e0b]">● PF & Penalty Savings</span><span className="text-[#a855f7]">● Capacity Value</span><span className="text-cyan-300">● Other Optimizations</span></div><svg className="h-[150px] w-full" viewBox="0 0 500 184"><g stroke="rgba(148,163,184,.16)">{[26,58,90,122,154,180].map(y=><line key={y} x1="34" x2="488" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="30">$2.0K</text><text x="2" y="62">$1.6K</text><text x="4" y="94">$1.2K</text><text x="8" y="126">$800</text><text x="8" y="158">$400</text></g>{lines.map(([color,points])=><polyline fill="none" key={color} points={points} stroke={color} strokeWidth="2"/>)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["Apr 19","Apr 24","Apr 29","May 04","May 09","May 14","May 18"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Trend Analysis →</div></div>;
}

function SavingsContributionDonut() {
  const rows = [["Energy Savings","$18,674 (49.2%)","#65a30d"],["Demand Savings","$11,483 (30.3%)","#147dff"],["PF & Penalty Savings","$4,912 (12.9%)","#f59e0b"],["Capacity Value","$2,853 (7.5%)","#a855f7"],["Other Optimizations","$1,284 (3.4%)","#00bcd4"]];
  return <div className="grid h-full grid-cols-[148px_1fr] items-center gap-3 text-[8px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="99 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="61 201" strokeDashoffset="-101" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#f59e0b" strokeDasharray="26 201" strokeDashoffset="-164" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#a855f7" strokeDasharray="15 201" strokeDashoffset="-192" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[46px] w-[132px] text-center">Total<br/><b className="text-xl">$37,922</b></div></div><div className="space-y-2">{rows.map(([label,value,color])=><div className="grid grid-cols-[10px_1fr_auto] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Contribution Analysis →</div></div></div>;
}

function ValueDriversBySystemTable() {
  const rows = [["HVAC Systems","$6,821","$4,128","$1,824","$1,142","$362","$14,277"],["Motor Systems","$5,413","$3,267","$1,284","$862","$281","$11,107"],["Lighting Systems","$2,143","$562","$421","$312","$106","$3,544"],["Process Equipment","$2,967","$2,451","$892","$381","$221","$6,912"],["Compressed Air","$1,310","$583","$267","$96","$72","$2,328"],["Other Systems","$20","$40","$224","$60","$242","$526"],["TOTAL","$18,674","$11,483","$4,912","$2,853","$1,284","$37,922"]];
  return <SavingsDriverSmallTable headers={["System","Energy Savings","Demand Savings","PF & Penalty Savings","Capacity Value","Other Opt.","Total Savings"]} rows={rows} link="View System Attribution →" />;
}

function SavingsPerUnitTable() {
  const rows = [["Per kWh Saved","$0.128","↑ 8.6%"],["Per kW Demand Reduced","$4.72","↑ 11.3%"],["Per kVA Recovered","$15.67","↑ 9.1%"],["Per PF Point Improved","$312.40","↑ 10.4%"],["Per Ton (HVAC)","$28.40","↑ 7.8%"],["Per Motor HP","$19.60","↑ 9.5%"],["Baseline Method","ANSI C12.20 Class 0.5",""]];
  return <SavingsDriverSmallTable headers={["","", ""]} rows={rows} link="View Unit Economics →" />;
}

function TimeOfDayImpactHeatmap() {
  const hours = ["12 AM","4 AM","8 AM","12 PM","4 PM","8 PM"];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return <div className="h-full text-[7px]"><div className="grid grid-cols-[44px_1fr]"><span>Hour</span><div className="grid grid-cols-7 text-center">{days.map(d=><span key={d}>{d}</span>)}</div></div><div className="mt-1 grid grid-cols-[44px_1fr]"><div className="grid grid-rows-6 gap-0.5">{hours.map(h=><span key={h}>{h}</span>)}</div><div className="grid h-[126px] grid-cols-7 grid-rows-6 overflow-hidden rounded border border-white/10">{Array.from({length:42}).map((_,i)=>{const r=Math.floor(i/7); const mid=r===2 || r===3; const color=mid && i%7>0 && i%7<5 ? "#dc4b00" : mid ? "#facc15" : r===1 || r===4 ? "#65a30d" : "#166534"; return <div className="border border-black/10" key={i} style={{background:color}}/>})}</div></div><div className="mt-3 grid grid-cols-[56px_1fr_64px] items-center gap-2"><span>Low Impact</span><span className="h-3 bg-gradient-to-r from-[#166534] via-[#facc15] to-[#dc4b00]" /><span>High Impact</span></div><div className="mt-2 text-[#05ff5e]">View Time Analysis →</div></div>;
}

function ValueDriverInsights() {
  const rows = [["↑","Energy Savings are the largest contributor at 49.2% of total savings this month.","Key contributors: HVAC Systems, Motor Systems"],["▣","Demand Savings increased 13.5% vs last month due to peak shaving from load management algorithms.",""],["⌁","PF & Penalty Savings improved 9.4% driven by power factor optimization and penalty avoidance.",""],["□","Capacity Recovery delivered $2,853 in value by unlocking 1.82 MVA of additional capacity.",""]];
  return <div className="space-y-1 text-[7px]">{rows.map(([icon,title,detail],i)=><div className="grid grid-cols-[24px_1fr] rounded border border-cyan-300/10 bg-[#061421] p-1.5" key={title}><span className={i===0?"grid size-4 place-items-center rounded-full border border-[#65a30d] text-[#65a30d]":i===1?"grid size-4 place-items-center rounded-full border border-[#147dff] text-[#147dff]":i===2?"grid size-4 place-items-center rounded-full border border-[#f59e0b] text-[#f59e0b]":"grid size-4 place-items-center rounded-full border border-[#a855f7] text-[#a855f7]"}>{icon}</span><span>{title}{detail && <><br/><span className="text-slate-400">{detail}</span></>}</span></div>)}<div className="pt-0.5 text-[#05ff5e]">View Insights Report →</div></div>;
}

function SavingsHistoryTable() {
  const rows = [["Dec 2024","$13,245","$8,935","$3,812","$2,241","$1,052","$29,285"],["Jan 2025","$15,102","$9,241","$4,102","$2,487","$1,136","$32,068"],["Feb 2025","$16,184","$10,023","$4,556","$2,641","$1,204","$34,608"],["Mar 2025","$17,456","$10,734","$4,761","$2,712","$1,157","$36,820"],["Apr 2025","$16,846","$10,127","$4,491","$2,623","$1,165","$35,252"],["May 1 - 18, 2025","$18,674","$11,483","$4,912","$2,853","$1,284","$37,922"]];
  return <SavingsDriverSmallTable headers={["Month","Energy Savings","Demand Savings","PF & Penalty Savings","Capacity Value","Other Optimizations","Total Savings"]} rows={rows} link="View Full Savings History →                                      Export History CSV ⇩" />;
}

function SavingsDriverSmallTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map((h,i)=><th className="pb-1 font-medium" key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={i===row.length-1 || cell.startsWith("↑") ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsEngineOverviewScreen({ data }: EnergySavingsScreenProps) {
  return (
    <EcbsAppShell activeHref="/enterprise/dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">SAVINGS ENGINE™</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time. Measurable Value. Continuous Improvement.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">{data?.siteName ?? "Ochsner"}⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; {energyDateRange(data)}</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>⌂ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Savings Engine</span></div></div>
        <section className="grid h-[76px] grid-cols-6 gap-2">
          <SavingsOverviewKpi icon="$" label="LIFETIME SAVINGS" value="No Data" detail="No approved lifetime rollup" trend="Blocked" tone="green" />
          <SavingsOverviewKpi icon="▣" label="SAVINGS THIS YEAR (YTD)" value={annualBenefitValue(data)} detail="Latest annual savings" trend="Direct Data" tone="cyan" />
          <SavingsOverviewKpi icon="▰" label="SAVINGS THIS MONTH" value="No Data" detail="No approved monthly rollup" trend="Blocked" tone="cyan" />
          <SavingsOverviewKpi icon="○" label="SAVINGS TODAY" value="No Data" detail="No approved daily rollup" trend="Blocked" tone="orange" />
          <SavingsOverviewKpi icon="⌁" label="CAPACITY RECOVERED™" value={formatKva(data?.recoveredKva)} detail="Latest capacity_intelligence row" trend="Direct Data" tone="cyan" />
          <SavingsOverviewKpi icon="⌂" label="DEFERRED CAPITAL VALUE™" value={formatCurrencyValue(data?.deferredCapitalValue)} detail="Latest capacity_intelligence row" trend="Direct Data" tone="purple" />
        </section>
        <div className="mt-2 flex h-[28px] items-center justify-between border-b border-cyan-300/10 text-[8px]"><SavingsOverviewTabs /><div className="flex overflow-hidden rounded border border-cyan-300/12"><span className="px-3 py-1">Today</span><span className="bg-[#147dff] px-3 py-1 text-white">This Month</span><span className="px-3 py-1">This Year</span><span className="px-3 py-1">Lifetime</span></div></div>
        <section className="mt-2 grid h-[226px] grid-cols-[1fr_0.94fr_1.04fr] gap-2">
          <DashboardPanel title="SAVINGS TREND - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - monthly savings trend source is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS BY CATEGORY - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - savings category split is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS CONTRIBUTION - TODAY" variant="enterprise"><NoDataBlock message="No Data - daily contribution model is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[216px] grid-cols-[1.05fr_0.72fr_0.88fr] gap-2">
          <DashboardPanel title="SAVINGS BREAKDOWN - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - savings breakdown model is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS DRIVERS - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - savings driver model is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS vs BASELINE - THIS MONTH" variant="enterprise"><NoDataBlock message="No Data - baseline savings contract is not approved." /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[194px] grid-cols-[0.8fr_0.62fr_0.64fr_0.7fr] gap-2">
          <DashboardPanel title="SAVINGS FORECAST" variant="enterprise"><NoDataBlock message="No Data - savings forecast model is not approved." /></DashboardPanel>
          <DashboardPanel title="TOP SAVING OPPORTUNITIES" variant="enterprise"><NoDataBlock message="No Data - opportunity model is not approved." /></DashboardPanel>
          <DashboardPanel title="SAVINGS QUALITY & VERIFICATION" variant="enterprise"><NoDataBlock message="No Data - verification model is not approved." /></DashboardPanel>
          <DashboardPanel title="RECENT SAVINGS EVENTS" variant="enterprise"><NoDataBlock message="No Data - savings event source is not approved." /></DashboardPanel>
        </section>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function SavingsOverviewKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "orange" | "purple"; trend: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : tone === "orange" ? "#f59e0b" : "#a855f7";
  return <article className="grid grid-cols-[43px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-2.5"><div className="grid size-9 place-items-center rounded-full border-2 text-base" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[20px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[7.5px] text-slate-300">{detail}</div><div className="mt-0.5 text-[7px] text-[#05ff5e]">{trend}</div></div></article>;
}

function SavingsOverviewTabs() {
  const tabs = ["Overview","Savings Breakdown","Time Analysis","Value Drivers","Savings Attribution","Reports"];
  return <div className="flex items-center">{tabs.map((tab)=><span className={tab==="Overview"?"mr-9 border-b-2 border-cyan-300 pb-2 text-cyan-300":"mr-9 pb-2 text-slate-300"} key={tab}>{tab}</span>)}</div>;
}

function SavingsOverviewTrend() {
  const points = "34,136 64,108 94,104 124,104 154,84 184,72 214,68 244,66 274,62 304,52 334,42 364,36 394,26 424,42 454,30 484,20 514,10";
  return <div className="h-full text-[8px]"><svg className="h-[136px] w-full" viewBox="0 0 540 150"><g stroke="rgba(148,163,184,.16)">{[20,48,76,104,132].map(y=><line key={y} x1="34" x2="528" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="8" y="24">$5K</text><text x="8" y="52">$4K</text><text x="8" y="80">$3K</text><text x="8" y="108">$2K</text><text x="12" y="136">$0</text></g><polygon fill="rgba(5,255,94,.18)" points={`${points} 514,140 34,140`} /><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#65a30d" key={i} r="2.5"/>})}<rect fill="#061421" height="42" rx="4" stroke="rgba(103,232,249,.25)" width="72" x="410" y="6"/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x="446" y="22">May 18, 2025</text><text fill="#e2e8f0" fontSize="9" textAnchor="middle" x="446" y="36">$1,284</text></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["May 1","May 4","May 7","May 10","May 13","May 16","May 18"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-2 grid grid-cols-4 text-[7px]"><SavingsMiniStat label="Total Savings" value="$37,922" /><SavingsMiniStat label="Daily Average" value="$2,531" /><SavingsMiniStat label="Highest Day" value="$4,162" detail="May 16" /><SavingsMiniStat label="Lowest Day" value="$1,102" detail="May 3" /></div></div>;
}

function SavingsCategoryDonut() {
  const rows = [["Energy Savings","$18,674 (49.2%)","#65a30d"],["Demand Savings","$11,483 (30.3%)","#147dff"],["PF & Penalty Savings","$4,912 (12.9%)","#f59e0b"],["Capacity Value","$2,853 (7.5%)","#a855f7"]];
  return <div className="grid h-full grid-cols-[154px_1fr] items-center gap-3 text-[8px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="99 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="61 201" strokeDashoffset="-101" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#f59e0b" strokeDasharray="26 201" strokeDashoffset="-164" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#a855f7" strokeDasharray="15 201" strokeDashoffset="-192" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[46px] w-[132px] text-center">Total<br/><b className="text-xl">$37,922</b></div></div><div className="space-y-3">{rows.map(([label,value,color])=><div className="grid grid-cols-[10px_1fr_auto] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Category Details →</div></div></div>;
}

function SavingsContributionToday() {
  const rows = [["Demand Reduction","$562","43.8%","↑ 12.3%"],["Energy Efficiency","$384","29.9%","↑ 8.9%"],["PF Improvement","$201","15.7%","↑ 5.2%"],["Capacity Recovery","$95","7.4%","↑ 10.1%"],["Other Optimizations","$42","3.2%","↑ 2.4%"],["Total","$1,284","100%",""]];
  return <SavingsOverviewTable headers={["Source","Savings ($)","% of Total","Trend (vs Yesterday)"]} rows={rows} link="View Full Contribution Analysis →" />;
}

function SavingsBreakdownOverviewTable() {
  const rows = [["May 1, 2025","$1,842","$1,103","$482","$268","$3,695"],["May 2, 2025","$1,954","$1,196","$511","$291","$3,952"],["May 3, 2025","$1,218","$742","$317","$217","$2,494"],["May 4, 2025","$1,688","$1,032","$438","$256","$3,414"],["May 5, 2025","$2,102","$1,281","$564","$313","$4,260"],["...","...","...","...","...","..."],["May 16, 2025","$2,512","$1,532","$639","$412","$5,095"],["May 17, 2025","$2,231","$1,361","$581","$366","$4,539"],["May 18, 2025","$2,145","$1,483","$612","$416","$4,656"],["Total","$18,674","$11,483","$4,912","$2,853","$37,922"]];
  return <SavingsOverviewTable headers={["Date","Energy Savings","Demand Savings","PF & Penalty Savings","Capacity Value","Total Savings"]} rows={rows} link="Showing 1 to 18 of 18 days                                      Export CSV ⇩" />;
}

function SavingsDriversBars() {
  const rows = [["Motor Efficiency Improvements","$12,845","33.9%",82],["Demand Load Management","$9,214","24.3%",61],["Power Factor Optimization","$4,912","12.9%",38],["Harmonic Reduction","$5,001","13.2%",44],["Transformer Loss Reduction","$3,276","8.6%",30],["Voltage Stabilization","$2,674","7.1%",25]];
  return <div className="space-y-3 text-[8px]">{rows.map(([label,value,pct,width])=><div className="grid grid-cols-[148px_1fr_54px_42px] items-center gap-2" key={String(label)}><span>{label}</span><span className="h-3 rounded-sm bg-[#65a30d]" style={{width:`${width}%`}}/><span>{value}</span><span>{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Drivers Analysis →</div></div>;
}

function SavingsVsBaseline() {
  return <div className="h-full text-[8px]"><div className="grid grid-cols-4 text-center"><span>Baseline Cost<br/><b>$61,124</b></span><span>Current Cost<br/><b>$23,202</b></span><span>Savings<br/><b className="text-xl text-[#05ff5e]">$37,922</b></span><span>Savings %<br/><b className="text-xl text-[#05ff5e]">62.0%</b></span></div><svg className="mt-2 h-[104px] w-full" viewBox="0 0 430 112"><rect fill="#64748b" height="72" width="58" x="50" y="24"/><rect fill="#65a30d" height="28" width="58" x="180" y="68"/><rect fill="#147dff" height="46" width="58" x="310" y="50"/><path d="M79 24 C180 30 240 36 339 50" fill="none" stroke="#94a3b8" strokeDasharray="3 3"/><g fill="#e2e8f0" fontSize="8" textAnchor="middle"><text x="79" y="18">$61,124</text><text x="209" y="62">$23,202</text><text x="339" y="44">$37,922</text><text x="79" y="108">Baseline Cost</text><text x="209" y="108">Current Cost</text><text x="339" y="108">Savings</text></g></svg><div className="mt-1 text-[#05ff5e]">View Baseline Comparison →</div></div>;
}

function SavingsForecast() {
  return <div className="grid h-full grid-cols-[1fr_100px] gap-2 text-[7px]"><div><div className="mb-1 flex justify-end gap-4"><span className="text-[#65a30d]">Projected Savings</span><span className="text-[#147dff]">Baseline Cost</span></div><svg className="h-[90px] w-full" viewBox="0 0 300 96"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90].map(y=><line key={y} x1="28" x2="290" y1={y} y2={y}/>)}</g><polyline fill="none" points="30,70 54,62 78,58 102,55 126,50 150,48 174,45 198,42 222,38 246,34 276,28" stroke="#65a30d" strokeWidth="2"/><polyline fill="none" points="30,20 54,28 78,32 102,40 126,46 150,48 174,47 198,45 222,44 246,42 276,38" stroke="#147dff" strokeWidth="2"/></svg><div className="flex justify-between text-[6.5px] text-slate-400">{["May 25","Jun 25","Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25"].map(d=><span key={d}>{d}</span>)}</div></div><div className="space-y-2"><div>Forecast Next Month<br/><b className="text-lg">$98,100</b><br/><span className="text-[#05ff5e]">▲ 14.9% vs May</span></div><div>Annual Forecast<br/><b className="text-lg">$1.15M</b><br/><span className="text-[#05ff5e]">▲ 14.9% vs Baseline</span></div></div><div className="col-span-2 text-right text-[#05ff5e]">View Full Forecast →</div></div>;
}

function TopSavingOpportunities() {
  const rows = [["1","Optimize HVAC Schedule - Building 2","$18,600 /yr"],["2","Additional Harmonic Reduction on Feeder C","$28,400 /yr"],["3","Load Balancing - Panel D1","$12,300 /yr"]];
  return <div className="space-y-3 text-[7px]">{rows.map(([n,label,value])=><div className="grid grid-cols-[18px_1fr_58px] items-center gap-2" key={n}><span className="grid size-4 place-items-center rounded border border-[#65a30d] text-[#65a30d]">{n}</span><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}<div className="pt-4 text-[#05ff5e]">View All Opportunities →</div></div>;
}

function SavingsQualityVerification() {
  const rows = [["Measurement Methodology","ANSI C12.20 Class 0.5"],["Baseline Verification","Verified"],["Data Accuracy","99.6%"],["Anomaly Adjustments","$143"],["Savings Confidence","High"]];
  return <div className="space-y-2 text-[7px]">{rows.map(([a,b],i)=><div className="grid grid-cols-[1fr_auto_16px] border-b border-white/5 pb-1" key={a}><span>{a}</span><span>{b}</span><span className={i===1||i===2||i===4?"text-[#05ff5e]":"text-slate-400"}>{i===3?"ⓘ":"✓"}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Verification Report →</div></div>;
}

function RecentSavingsEvents() {
  const rows = [["10:14 AM","PF Improved to 0.98","+$128"],["09:47 AM","Demand reduced 120 kW","+$412"],["08:32 AM","Transformer 1 optimized","+$95"],["07:15 AM","HVAC load shed event","+$362"],["06:01 AM","Daily optimization cycle","+$87"]];
  return <div className="space-y-2 text-[7px]">{rows.map(([time,label,value])=><div className="grid grid-cols-[42px_16px_1fr_40px] border-b border-white/5 pb-1" key={label}><span>{time}</span><span className="text-[#65a30d]">⇅</span><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}<div className="pt-1 text-[#05ff5e]">View All Events →</div></div>;
}

function SavingsOverviewTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={i===row.length-1 || cell.startsWith("↑") ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsSystemHealthScreen() {
  return (
    <EcbsAppShell activeHref="/enterprise/dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">SYSTEM HEALTH & STATUS™</h1><p className="mt-1 text-[10px] text-slate-300">Real-Time System Monitoring. Ensure Reliability. Prevent Issues.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Flex Tijuana⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; May 12 - May 18, 2025</button><span className="text-red-400">●</span><span>?</span><span>⚙</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div><span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">System Health & Status</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⚙ Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts⌄</button></div></div>
        <section className="grid h-[86px] grid-cols-6 gap-2">
          <HealthKpi icon="⌁" label="OVERALL SYSTEM HEALTH" value="98.7%" detail="Excellent" trend="▲ 1.2% vs Last 7 Days" tone="green" />
          <HealthKpi icon="▣" label="DEVICES ONLINE" value="142 / 146" detail="97.3% Online" trend="▲ 2 Devices vs Last 7 Days" tone="cyan" />
          <HealthKpi icon="△" label="ALERTS" value="8" detail="Active Alerts" trend="▼ -3 vs Last 7 Days" tone="orange" />
          <HealthKpi icon="✚" label="CRITICAL ALERTS" value="2" detail="Requires Attention" trend="No Change vs Last 7 Days" tone="red" />
          <HealthKpi icon="▤" label="DATA RELIABILITY" value="99.8%" detail="Excellent" trend="▲ 0.3% vs Last 7 Days" tone="purple" />
          <HealthKpi icon="◴" label="LAST COMMUNICATION" value="23 sec" detail="Average Latency" trend="▼ -7 sec vs Last 7 Days" tone="cyan" />
        </section>
        <section className="mt-2 grid h-[214px] grid-cols-[1.12fr_0.84fr_0.72fr_0.72fr] gap-2">
          <DashboardPanel title="SYSTEM HEALTH OVER TIME (Last 7 Days)" variant="enterprise"><SystemHealthTrend /></DashboardPanel>
          <DashboardPanel title="DEVICE STATUS DISTRIBUTION" variant="enterprise"><DeviceStatusDistribution /></DashboardPanel>
          <DashboardPanel title="ALERT BREAKDOWN" variant="enterprise"><HealthAlertBreakdown /></DashboardPanel>
          <DashboardPanel title="TOP ACTIVE ALERTS" variant="enterprise"><TopActiveAlerts /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[176px] grid-cols-[1.45fr_1fr] gap-2">
          <DashboardPanel title="DEVICE HEALTH OVERVIEW" variant="enterprise"><DeviceHealthOverview /></DashboardPanel>
          <DashboardPanel title="DATA & COMMUNICATION PERFORMANCE" variant="enterprise"><CommunicationPerformance /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[178px] grid-cols-[0.78fr_0.78fr_0.72fr_0.92fr] gap-2">
          <DashboardPanel title="SYSTEM COMPONENT HEALTH" variant="enterprise"><SystemComponentHealth /></DashboardPanel>
          <DashboardPanel title="PREDICTIVE HEALTH INDICATORS" variant="enterprise"><PredictiveHealthIndicators /></DashboardPanel>
          <DashboardPanel title="MAINTENANCE & SUPPORT" variant="enterprise"><MaintenanceSupport /></DashboardPanel>
          <DashboardPanel title="SYSTEM RESILIENCY" variant="enterprise"><SystemResiliency /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>System health is calculated using real-time telemetry, device diagnostics, and machine learning predictive analytics.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function HealthKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "green" | "cyan" | "orange" | "red" | "purple"; trend: string; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "cyan" ? "#00bcd4" : tone === "orange" ? "#f59e0b" : tone === "red" ? "#ef4444" : "#a855f7";
  return <article className="grid grid-cols-[44px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-10 place-items-center rounded-full border-2 text-lg" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[22px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div><div className={tone === "red" ? "mt-1 text-[7px] text-slate-400" : "mt-1 text-[7px] text-[#05ff5e]"}>{trend}</div></div></article>;
}

function SystemHealthTrend() {
  const points = "42,100 92,82 142,90 192,76 242,68 292,62 342,56 392,48";
  return <div className="h-full text-[8px]"><svg className="h-[140px] w-full" viewBox="0 0 430 150"><g stroke="rgba(148,163,184,.16)">{[28,58,88,118,144].map(y=><line key={y} x1="34" x2="418" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="4" y="32">100%</text><text x="10" y="62">95%</text><text x="10" y="92">90%</text><text x="10" y="122">85%</text><text x="10" y="146">80%</text></g><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); const labels=["96.5%","97.1%","95.8%","97.6%","98.0%","98.3%","98.7%"]; return <g key={i}><circle cx={x} cy={y} fill="#65a30d" r="3"/>{labels[i] && <text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x} y={Number(y)-10}>{labels[i]}</text>}</g>})}</svg><div className="flex justify-between px-10 text-[7px] text-slate-400">{["May 12","May 13","May 14","May 14","May 16","May 17","May 18"].map((d,i)=><span key={`${d}-${i}`}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Historical Health Report →</div></div>;
}

function DeviceStatusDistribution() {
  const rows = [["Online","142 (97.3%)","#65a30d"],["Offline","2 (1.4%)","#147dff"],["Warning","2 (1.4%)","#f59e0b"],["Critical","0 (0.0%)","#ef4444"],["Maintenance","0 (0.0%)","#a855f7"]];
  return <div className="grid h-full grid-cols-[132px_1fr] items-center gap-4 text-[8px]"><div className="relative"><svg className="size-[126px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="194 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="3 201" strokeDashoffset="-194" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#f59e0b" strokeDasharray="3 201" strokeDashoffset="-198" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[44px] w-[126px] text-center"><b className="text-2xl">146</b><br/>Total Devices</div></div><div className="space-y-2">{rows.map(([label,value,color])=><div className="grid grid-cols-[10px_1fr_auto] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}<div className="pt-2 text-[#05ff5e]">View All Devices →</div></div></div>;
}

function HealthAlertBreakdown() {
  const rows = [["Critical","Requires immediate attention","2","#ef4444"],["Warning","Monitor and review","6","#f59e0b"],["Info","Informational","18","#147dff"],["Resolved (Last 7 Days)","","24","#64748b"]];
  return <div className="space-y-4 text-[8px]">{rows.map(([label,detail,count,color])=><div className="grid grid-cols-[12px_1fr_24px] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}<br/><span className="text-slate-400">{detail}</span></span><b>{count}</b></div>)}<div className="pt-1 text-[#05ff5e]">View All Alerts →</div></div>;
}

function TopActiveAlerts() {
  const rows = [["△","Transformer TX-01 Overload","Site: Main Campus","Since: May 18, 9:42 AM","#ef4444"],["△","PF Below Target (0.90)","Site: Building 2","Since: May 18, 8:15 AM","#f59e0b"],["△","High Harmonics Detected","Site: Production Line 1","Since: May 18, 7:05 AM","#f59e0b"]];
  return <div className="space-y-3 text-[7.5px]">{rows.map(([icon,title,site,time,color])=><div className="grid grid-cols-[18px_1fr]" key={title}><span style={{color}}>{icon}</span><span><b>{title}</b><br/>{site}<br/><span className="text-slate-400">{time}</span></span></div>)}<div className="pt-1 text-[#05ff5e]">View Alerts Center →</div></div>;
}

function DeviceHealthOverview() {
  const rows = [["Gateway GW-01","Gateway","Main Campus","● Online","100%","8 sec ago","100%","99.8%"],["Meter MTR-01","Meter","Main Switchgear","● Online","99%","12 sec ago","99.9%","99.6%"],["Transformer TX-01","Transformer","Utility Yard","▲ Warning","82%","15 sec ago","98.7%","98.2%"],["Switch SW-01","Switch","Bldg 1 - Electrical Room","● Online","100%","9 sec ago","100%","99.9%"],["Repeater RP-01","Repeater","Parking Structure","● Online","98%","18 sec ago","99.6%","97.5%"]];
  return <div className="h-full text-[7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Device Name","Type","Site / Location","Status","Health Score","Last Seen","Data Quality","Uptime"].map(h=><th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i===3 ? cell.includes("Warning") ? "py-1 text-[#f59e0b]" : "py-1 text-[#05ff5e]" : i===4 ? "py-1 text-[#05ff5e]" : "py-1"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 flex justify-between text-[#05ff5e]"><span>View All Devices →</span><span>Device Map View →</span></div></div>;
}

function CommunicationPerformance() {
  const cards = [["NETWORK AVAILABILITY","⌁","99.9%","Excellent","▲ 0.4% vs Last 7 Days","#00bcd4"],["AVERAGE LATENCY","◷","23 sec","Excellent","▼ -7 sec vs Last 7 Days","#00bcd4"],["PACKET DELIVERY","▱","99.7%","Excellent","▲ 0.6% vs Last 7 Days","#147dff"],["DATA COMPLETENESS","▤","99.8%","Excellent","▲ 0.3% vs Last 7 Days","#a855f7"]];
  return <div className="grid h-full grid-rows-[1fr_20px] gap-2 text-[7px]"><div className="grid grid-cols-4 gap-2">{cards.map(([label,icon,value,detail,trend,color])=><div className="rounded border border-cyan-300/12 bg-[#061421] p-3" key={label}><div className="text-slate-400">{label}</div><div className="mt-3 text-[22px] leading-none" style={{color}}>{icon} {value}</div><div className="mt-1">{detail}</div><div className="mt-3 text-[#05ff5e]">{trend}</div></div>)}</div><div className="text-[#05ff5e]">View Network Diagnostics →</div></div>;
}

function SystemComponentHealth() {
  const rows = [["Gateways","100%"],["Meters","99%"],["Transformers","97%"],["Switches","100%"],["Repeaters","98%"],["Cloud Services","100%"],["Data Storage","100%"]];
  return <div className="space-y-2 text-[7.5px]">{rows.map(([label,pct])=><div className="grid grid-cols-[82px_1fr_34px] items-center gap-2" key={label}><span>{label}</span><span className="h-2.5 rounded-sm bg-[#65a30d]" style={{width:pct}}/><span>{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Component Details →</div></div>;
}

function PredictiveHealthIndicators() {
  const rows = ["No failure predictions","Low risk across all systems","Normal operating conditions","Optimal performance trend","System stable"];
  return <div className="grid h-full grid-cols-[116px_1fr] items-center gap-3 text-[7px]"><div className="relative"><svg className="size-[110px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="36" stroke="#1f2937" strokeWidth="12"/><circle cx="50" cy="50" fill="none" r="36" stroke="#65a30d" strokeDasharray="219 226" strokeWidth="12" transform="rotate(-90 50 50)"/></svg><div className="absolute left-0 top-[34px] w-[110px] text-center"><b className="text-3xl">97%</b><br/>Predictive Score<br/>Excellent</div></div><div className="space-y-2">{rows.map(row=><div className="grid grid-cols-[16px_1fr]" key={row}><span className="text-[#65a30d]">✓</span><span>{row}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Predictive Insights →</div></div></div>;
}

function MaintenanceSupport() {
  const rows = [["Maintenance Due","0","Next 30 Days"],["Firmware Updates","2","Available"],["Support Cases","1","Open"],["Last Preventive Check","May 17, 2025","Completed"]];
  return <div className="space-y-3 text-[7.5px]">{rows.map(([label,value,detail])=><div className="grid grid-cols-[1fr_64px] border-b border-white/5 pb-1" key={label}><span>{label}</span><span className="text-right"><b>{value}</b><br/><span className="text-slate-400">{detail}</span></span></div>)}<div className="pt-1 text-[#05ff5e]">View Maintenance Schedule →</div></div>;
}

function SystemResiliency() {
  const rows = [["Fault Tolerance","Excellent"],["Redundancy","Excellent"],["Backup Systems","Active"],["Failover Status","Ready"],["System Stability","Excellent"],["Disaster Recovery","Ready"]];
  return <div className="grid h-full grid-cols-[1fr_94px] gap-3 text-[7.5px]"><div className="space-y-2">{rows.map(([label,value])=><div className="flex justify-between border-b border-white/5 pb-1" key={label}><span>{label}</span><b className="text-[#05ff5e]">{value}</b></div>)}<div className="pt-1 text-[#05ff5e]">View Resiliency Details →</div></div><div className="flex flex-col items-center justify-center text-center"><svg className="size-20 text-slate-400" viewBox="0 0 80 80"><path d="M40 7 66 18v19c0 17-10 29-26 36-16-7-26-19-26-36V18L40 7Z" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M40 18v42M27 30h26M27 42h26" stroke="currentColor" strokeWidth="3"/></svg><div className="mt-2">All Systems<br/><span className="text-xl text-[#05ff5e]">Operational</span></div></div></div>;
}

export function EnergySavingsUtilityForecastingDetailsScreen() {
  return (
    <EcbsAppShell activeHref="/enterprise/dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">UTILITY FORECASTING - DETAILS</h1><p className="mt-1 text-[10px] text-slate-300">Advanced forecasting, cost projections, and scenario modeling.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Flex Tijuana⌄</button><button className="w-[188px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; May 12, 2025 - May 18, 2025</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div><span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-slate-400">Utility Forecasting</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Utility Forecasting - Details</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⚙ Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button></div></div>
        <section className="grid h-[86px] grid-cols-6 gap-2">
          <UtilityForecastKpi icon="$" label="FORECASTED NEXT MONTH COST" value="$98,100" detail="Projected Cost" trend="▲ 5.0% vs Current Month" tone="orange" />
          <UtilityForecastKpi icon="▰" label="FORECASTED NEXT MONTH DEMAND" value="742 kW" detail="Peak Demand" trend="▼ 3.2% vs Current Month" tone="blue" />
          <UtilityForecastKpi icon="⌂" label="FORECASTED ANNUAL COST" value="$1.15M" detail="Annual Forecast" trend="▼ 14.3% vs Baseline Year" tone="purple" />
          <UtilityForecastKpi icon="⌁" label="FORECASTED ANNUAL DEMAND" value="1,028 kW" detail="Annual Peak Demand" trend="▼ 8.7% vs Baseline Year" tone="cyan" />
          <UtilityForecastKpi icon="ϟ" label="FORECASTED ANNUAL USAGE" value="18.62M kWh" detail="Annual Energy Usage" trend="▼ 12.6% vs Baseline Year" tone="yellow" />
          <UtilityForecastKpi icon="✓" label="FORECAST CONFIDENCE" value="92%" detail="High Confidence" trend="" tone="green" />
        </section>
        <section className="mt-2 grid h-[226px] grid-cols-[0.92fr_1fr_1.04fr] gap-2">
          <DashboardPanel title="FORECAST SUMMARY" variant="enterprise"><UtilityForecastSummary /></DashboardPanel>
          <DashboardPanel title="MONTHLY COST FORECAST (12 MONTHS)" variant="enterprise"><UtilityCostForecastChart /></DashboardPanel>
          <DashboardPanel title="DEMAND FORECAST (12 MONTHS)" variant="enterprise"><UtilityDemandForecastChart /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[202px] grid-cols-[0.92fr_1fr_1.04fr] gap-2">
          <DashboardPanel title="USAGE FORECAST (kWh)" variant="enterprise"><UtilityUsageForecastChart /></DashboardPanel>
          <DashboardPanel title="COST COMPONENT FORECAST (12 MONTHS)" variant="enterprise"><UtilityCostComponentBars /></DashboardPanel>
          <DashboardPanel title="FORECAST vs BASELINE (ANNUAL)" variant="enterprise"><UtilityBaselineVariance /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[170px] grid-cols-[0.88fr_0.74fr_0.92fr_0.72fr] gap-2">
          <DashboardPanel title="SEASONAL IMPACT ANALYSIS" variant="enterprise"><UtilitySeasonalImpact /></DashboardPanel>
          <DashboardPanel title="RATE & ASSUMPTION SUMMARY" variant="enterprise"><UtilityRateAssumptions /></DashboardPanel>
          <DashboardPanel title="SCENARIO MODELING" variant="enterprise"><UtilityScenarioModeling /></DashboardPanel>
          <DashboardPanel title="FORECAST ALERTS" variant="enterprise"><UtilityForecastAlerts /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Forecasts are based on real-time data, historical trends, and advanced predictive analytics. Accuracy improves with more data.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

export function EnergySavingsUtilityForecastingScreen() {
  return (
    <EcbsAppShell activeHref="/enterprise/dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">UTILITY FORECASTING™</h1><p className="mt-1 text-[10px] text-slate-300">Predict future utility costs, demand, and savings with confidence.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Flex Tijuana⌄</button><button className="w-[188px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; May 12, 2025 - May 18, 2025</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div><span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Utility Forecasting</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⚙ Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts</button></div></div>
        <section className="grid h-[86px] grid-cols-6 gap-2">
          <UtilityForecastKpi icon="$" label="FORECASTED NEXT MONTH COST" value="$98,100" detail="Projected Cost" trend="▲ 5.0% vs Current Month" tone="orange" />
          <UtilityForecastKpi icon="▰" label="FORECASTED NEXT MONTH DEMAND" value="742 kW" detail="Peak Demand" trend="▼ 3.2% vs Current Month" tone="blue" />
          <UtilityForecastKpi icon="⌂" label="FORECASTED ANNUAL COST" value="$1.15M" detail="Annual Forecast" trend="▼ 14.3% vs Baseline Year" tone="purple" />
          <UtilityForecastKpi icon="⌁" label="FORECASTED ANNUAL DEMAND" value="1,028 kW" detail="Annual Peak Demand" trend="▼ 8.7% vs Baseline Year" tone="cyan" />
          <UtilityForecastKpi icon="ϟ" label="FORECASTED ANNUAL USAGE" value="18.62M kWh" detail="Annual Energy Usage" trend="▼ 12.6% vs Baseline Year" tone="yellow" />
          <UtilityForecastKpi icon="✓" label="FORECAST CONFIDENCE" value="92%" detail="High Confidence" trend="" tone="green" />
        </section>
        <section className="mt-2 grid h-[236px] grid-cols-2 gap-2">
          <DashboardPanel title="UTILITY COST FORECAST (12 MONTHS)" variant="enterprise"><UtilityCostForecastChart /></DashboardPanel>
          <DashboardPanel title="DEMAND FORECAST (12 MONTHS)" variant="enterprise"><UtilityDemandForecastChart /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[204px] grid-cols-[0.66fr_0.84fr_0.86fr] gap-2">
          <DashboardPanel title="FORECAST SUMMARY" variant="enterprise"><UtilityOverviewForecastSummary /></DashboardPanel>
          <DashboardPanel title="COST COMPONENT FORECAST (NEXT 12 MONTHS)" variant="enterprise"><UtilityCostComponentBars /></DashboardPanel>
          <DashboardPanel title="SAVINGS FORECAST (NEXT 5 YEARS)" variant="enterprise"><UtilitySavingsForecastFiveYear /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[166px] grid-cols-[0.72fr_0.7fr_0.86fr_0.7fr] gap-2">
          <DashboardPanel title="RATE & ASSUMPTION SETTINGS" variant="enterprise"><UtilityRateAssumptions /></DashboardPanel>
          <DashboardPanel title="FORECAST DRIVERS" variant="enterprise"><UtilityForecastDrivers /></DashboardPanel>
          <DashboardPanel title="SCENARIO ANALYSIS" variant="enterprise"><UtilityScenarioModeling /></DashboardPanel>
          <DashboardPanel title="FORECAST ALERTS" variant="enterprise"><UtilityForecastAlerts /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Forecasts are based on real-time data, historical trends, and advanced predictive analytics. Accuracy improves with more data.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function UtilityOverviewForecastSummary() {
  const rows = [["Next Month Cost", "$98,100", "▲ 5.0%"], ["Next Month Demand", "742 kW", "▼ 3.2%"], ["Annual Cost Forecast", "$1.15M", "▼ 14.3%"], ["Annual Usage Forecast", "18.62M kWh", "▼ 12.6%"], ["Forecast Confidence", "92%", "High"]];
  return <div className="space-y-3 text-[8px]">{rows.map(([label,value,trend])=><div className="grid grid-cols-[1fr_68px_54px] border-b border-white/5 pb-1" key={label}><span>{label}</span><b>{value}</b><span className={trend.startsWith("▲")?"text-orange-400":"text-[#05ff5e]"}>{trend}</span></div>)}<div className="pt-2 text-slate-400">Forecast Methodology<br/>AI + Statistical Model + Historical Trends</div><div className="text-[#05ff5e]">View Forecast Methodology →</div></div>;
}

function UtilitySavingsForecastFiveYear() {
  const years = [["Year 1","$186K","$186K"],["Year 2","$228K","$414K"],["Year 3","$254K","$668K"],["Year 4","$278K","$946K"],["Year 5","$299K","$1.25M"]];
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-[#65a30d]">Annual Savings</span><span className="text-[#147dff]">Cumulative Savings</span></div><svg className="h-[122px] w-full" viewBox="0 0 470 132"><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,126].map(y=><line key={y} x1="34" x2="455" y1={y} y2={y}/>)}</g>{years.map(([year,annual,cum],i)=>{const x=62+i*78; const h=28+i*5; return <g key={year}><rect fill="#65a30d" height={h} width="28" x={x} y={118-h}/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+14} y={112-h}>{annual}</text><text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x+14} y="130">{year}</text><text fill="#147dff" fontSize="8" textAnchor="middle" x={x+28} y={90-i*18}>{cum}</text></g>})}<polyline fill="none" points="76,88 154,70 232,50 310,30 388,16" stroke="#147dff" strokeWidth="2"/></svg><div className="mt-1 text-[#05ff5e]">View 5 Year Projection Details →</div></div>;
}

function UtilityForecastDrivers() {
  const rows = ["Historical consumption patterns and trends", "Seasonal usage adjustments", "Weather normalization (Temperature, HDD/CDD)", "Rate escalation and tariff structure", "Demand response and load optimization", "PF improvement and penalty avoidance"];
  return <div className="space-y-1.5 text-[7px]">{rows.map((row,i)=><div className="grid grid-cols-[16px_1fr]" key={row}><span className="text-[#65a30d]">{i===0?"△":"◎"}</span><span>{row}</span></div>)}<div className="pt-2 text-[#05ff5e]">View All Drivers →</div></div>;
}

function UtilityForecastKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "orange" | "blue" | "purple" | "cyan" | "yellow" | "green"; trend: string; value: string }) {
  const color = tone === "orange" ? "#f59e0b" : tone === "blue" ? "#147dff" : tone === "purple" ? "#a855f7" : tone === "cyan" ? "#00bcd4" : tone === "yellow" ? "#eab308" : "#65a30d";
  return <article className="grid grid-cols-[44px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-10 place-items-center rounded-full border-2 text-lg" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[22px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div>{trend && <div className={trend.startsWith("▲") ? "mt-1 text-[7px] text-orange-400" : "mt-1 text-[7px] text-[#05ff5e]"}>{trend}</div>}</div></article>;
}

function UtilityForecastSummary() {
  const rows = [["Total Cost","$93,400","$98,100","+$4,700","+5.0%","▲"],["Peak Demand (kW)","719","742","+23","+3.2%","▲"],["Energy Usage (kWh)","1,657,000","1,551,000","-106,000","-6.4%","▼"],["Demand Charges","$62,300","$66,100","+$3,800","+6.1%","▲"],["Energy Charges","$27,100","$28,600","+$1,500","+5.5%","▲"],["PF Penalties","$4,000","$3,400","-$600","-15.0%","▼"],["Other Charges","$6,000","$6,000","$0","0.0%","--"]];
  return <UtilityTinyTable headers={["Metric","Current Month (Actual)","Next Month (Forecast)","Change","% Change","Trend"]} rows={rows} link="View Forecast Summary Report →" />;
}

function UtilityCostForecastChart() {
  const pointsA = "40,112 76,108 112,116 148,114 184,106 220,102 256,94 292,88 328,80 364,72 400,62 436,54";
  const pointsB = "40,116 76,110 112,112 148,108 184,100 220,92 256,86 292,78 328,70 364,62 400,54 436,46";
  return <UtilityLineChart lines={[["#65a30d", pointsA], ["#147dff", pointsB], ["#94a3b8", "40,74 76,74 112,76 148,76 184,74 220,70 256,64 292,58 328,54 364,50 400,46 436,42"]]} labels={["Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25","May '25"]} legend={["Actual Cost","Forecasted Cost","Baseline Cost"]} link="View Detailed Cost Forecast Table →" valueLabels={["$74.2K","$76.8K","$71.3K","$68.9K","$72.4K","$79.6K","$83.7K","$88.2K","$94.8K","$98.3K","$101.2K"]} />;
}

function UtilityDemandForecastChart() {
  const labels = ["Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25","May '25"];
  return <UtilityLineChart lines={[["#65a30d","40,78 76,82 112,86 148,90 184,94 220,96 256,92 292,88 328,84 364,80 400,82 436,86"],["#147dff","40,104 76,104 112,102 148,100 184,98 220,96 256,92 292,88 328,82 364,78 400,80 436,78"],["#94a3b8","40,48 76,48 112,48 148,48 184,48 220,48 256,48 292,48 328,48 364,48 400,48 436,48"]]} labels={labels} legend={["Actual Peak Demand","Forecasted Peak Demand","Baseline Peak Demand"]} link="View Detailed Demand Forecast Table →" valueLabels={["812","798","785","721","703","712","741","752","768","742","735","742"]} />;
}

function UtilityUsageForecastChart() {
  return <UtilityLineChart lines={[["#65a30d","40,84 76,88 112,94 148,98 184,94 220,90 256,86 292,82 328,78 364,76 400,76 436,78"],["#147dff","40,58 76,68 112,76 148,86 184,92 220,90 256,88 292,86 328,84 364,83 400,82 436,82"],["#94a3b8","40,44 76,44 112,44 148,44 184,44 220,44 256,44 292,44 328,44 364,44 400,44 436,44"]]} labels={["Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25","May '25"]} legend={["Actual Usage","Forecasted Usage","Baseline Usage"]} link="View Usage Forecast Details →" valueLabels={["17.8M","17.5M","17.2M","16.0M","17.9M","18.2M","18.4M","18.6M","18.9M","18.9M","18.6M"]} />;
}

function UtilityLineChart({ labels, legend, lines, link, valueLabels }: { labels: string[]; legend: string[]; lines: string[][]; link: string; valueLabels?: string[] }) {
  return <div className="h-full text-[7px]"><div className="mb-1 flex justify-center gap-5">{legend.map((label,i)=><span className={i===0?"text-[#65a30d]":i===1?"text-[#147dff]":"text-slate-400"} key={label}>• {label}</span>)}</div><svg className="h-[132px] w-full" viewBox="0 0 470 142"><g stroke="rgba(148,163,184,.16)">{[24,52,80,108,136].map(y=><line key={y} x1="34" x2="460" y1={y} y2={y}/>)}</g>{lines.map(([color,points],i)=><polyline fill="none" key={color+i} points={points} stroke={color} strokeDasharray={i===2?"4 4":undefined} strokeWidth="2"/>)}{valueLabels?.map((v,i)=>{const x=40+i*36; const y=i<5?112-i*2:106-(i-5)*8; return <text fill="#e2e8f0" fontSize="7" key={`${v}-${i}`} textAnchor="middle" x={x} y={y}>{v}</text>})}</svg><div className="flex justify-between px-8 text-[6.5px] text-slate-400">{labels.map(label=><span key={label}>{label}</span>)}</div><div className="mt-1 text-[#05ff5e]">{link}</div></div>;
}

function UtilityCostComponentBars() {
  const months = ["Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","May '25"];
  return <div className="h-full text-[7px]"><div className="mb-1 flex gap-4"><span className="text-[#65a30d]">Energy Charges</span><span className="text-[#147dff]">Demand Charges</span><span className="text-[#f59e0b]">PF Penalties</span><span className="text-[#a855f7]">Other Charges</span></div><svg className="h-[126px] w-full" viewBox="0 0 460 132"><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,126].map(y=><line key={y} x1="34" x2="450" y1={y} y2={y}/>)}</g>{months.map((month,i)=>{const x=45+i*36; const e=50+(i%3)*5; const d=28+(i%4)*4; const p=10+(i%2)*3; const o=18+(i%3)*2; return <g key={month}><rect fill="#65a30d" height={e} width="18" x={x} y={124-e}/><rect fill="#147dff" height={d} width="18" x={x} y={124-e-d}/><rect fill="#f59e0b" height={p} width="18" x={x} y={124-e-d-p}/><rect fill="#a855f7" height={o} width="18" x={x} y={124-e-d-p-o}/><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+9} y="132">{month}</text></g>})}</svg><div className="text-[#05ff5e]">View Component Forecast Table →</div></div>;
}

function UtilityBaselineVariance() {
  const rows = [["Annual Cost","$1.34M","$1.15M","-$190K","-14.3%"],["Peak Demand (kW)","1,126","1,028","-98","-8.7%"],["Energy Usage (kWh)","21.32M","18.62M","-2.70M","-12.6%"],["Demand Charges","$854K","$733K","-$121K","-14.2%"],["Energy Charges","$412K","$361K","-$51K","-12.4%"],["PF Penalties","$74K","$58K","-$16K","-21.6%"],["Other Charges","$0","$0","$0","0.0%"]];
  return <UtilityTinyTable headers={["Metric","Baseline Year","Forecasted Year","Variance","% Variance"]} rows={rows} link="View Baseline Comparison Report →" />;
}

function UtilitySeasonalImpact() {
  const rows = [["Summer (Jun - Aug)","+$18.2K (18.6%)","+72 kW (9.1%)","+2.1M kWh (11.3%)","Cooling Load"],["Fall (Sep - Nov)","-$6.4K (-6.5%)","-36 kW (-4.6%)","-1.2M kWh (-6.7%)","Lower Temps"],["Winter (Dec - Feb)","+$7.8K (8.0%)","+18 kW (2.3%)","+0.8M kWh (4.3%)","Heating Load"],["Spring (Mar - May)","-$4.7K (-4.8%)","-26 kW (-3.3%)","-1.1M kWh (-5.9%)","Mild Weather"]];
  return <UtilityTinyTable headers={["Season","Cost Impact","Demand Impact","Usage Impact","Key Driver"]} rows={rows} link="View Seasonal Analysis Details →" />;
}

function UtilityRateAssumptions() {
  const rows = [["Energy Rate ($/kWh)","$0.05645","+2% Annual Increase","Moderate"],["Demand Rate ($/kW)","$20.62","+20% Annual Increase","High"],["PF Target","0.95","Maintain","Low"],["Inflation Rate","2.6%","2.6% Annual","Moderate"],["Utility Rate Class","General Service","No Change","Low"]];
  return <UtilityTinyTable headers={["Parameter","Current Value","Assumption","Impact"]} rows={rows} link="Edit Assumptions →" />;
}

function UtilityScenarioModeling() {
  const rows = [["Baseline (No Change)","$1.34M","--","--","N/A"],["Conservative","$1.22M","-9.0%","-5.1%","Low Risk"],["Expected (Current)","$1.15M","-14.3%","-0.0%","Medium Risk"],["Aggressive Optimization","$1.01M","-24.6%","-8.8%","High Reward"]];
  return <UtilityTinyTable headers={["Scenario","Annual Cost","vs Baseline","vs Current","Payback / Risk"]} rows={rows} link="View Scenario Comparison →" />;
}

function UtilityForecastAlerts() {
  const rows = [["△","High Cost Forecast","Next 3 Months","#ef4444"],["△","Demand Approaching Limit","May 2025","#f59e0b"],["ⓘ","Rate Increase Scheduled","July 2025","#eab308"],["ⓘ","PF Below Target Risk","Low Risk","#147dff"]];
  return <div className="space-y-3 text-[7px]"><div className="text-right text-[#147dff]">View All Alerts →</div>{rows.map(([icon,label,value,color])=><div className="grid grid-cols-[16px_1fr_62px] gap-2 border-b border-white/5 pb-1" key={label}><span style={{color}}>{icon}</span><span>{label}</span><span className={value==="Low Risk"?"text-[#05ff5e]":"text-slate-300"}>{value}</span></div>)}</div>;
}

function UtilityTinyTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={cell.startsWith("+") || cell.startsWith("-") || cell.includes("Low") || cell.includes("High") || cell==="Medium Risk" || cell==="Moderate" ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">{link}</div></div>;
}

export function EnergySavingsWaterfallAnalysisScreen() {
  return (
    <EcbsAppShell activeHref="/enterprise/dashboard">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[54px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="whitespace-nowrap text-lg font-semibold leading-none">SAVINGS WATERFALL ANALYSIS <span className="text-[12px]">(ANNUALIZED)</span></h1><p className="mt-1 text-[10px] text-slate-300">Understand how savings are generated and where value is created across the system.</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[130px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Flex Tijuana⌄</button><button className="w-[188px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; May 12, 2024 - May 18, 2025</button><span className="text-red-400">●</span><span>?</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[34px] items-center justify-between text-[9px]"><div>⌂ &nbsp; <span className="text-slate-400">Energy & Savings Dashboard</span> &nbsp; › &nbsp; <span className="text-[#05ff5e]">Savings Waterfall Analysis</span></div><div className="flex gap-3"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⚙ Configure</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Alerts⌄</button></div></div>
        <section className="grid h-[92px] grid-cols-6 gap-2">
          <WaterfallKpi label="TOTAL ANNUAL SAVINGS" value="$489,320" detail="Annualized Savings" sub="Since Activation (May 12, 2024)" tone="green" />
          <WaterfallKpi label="BASELINE UTILITY COST" value="$2,340,000" detail="Annual Cost" sub="May 12, 2023 - May 11, 2024" tone="blue" />
          <WaterfallKpi label="CURRENT UTILITY COST" value="$1,850,680" detail="Annual Cost" sub="May 12, 2024 - May 11, 2025" tone="blue" />
          <WaterfallKpi label="TOTAL COST REDUCTION" value="$489,320" detail="Annual Reduction" sub="20.9% vs Baseline" tone="orange" />
          <WaterfallKpi label="TOTAL kWh REDUCTION" value="1,024,218 kWh" detail="Annual Reduction" sub="18.9% vs Baseline" tone="green" />
          <WaterfallKpi label="PEAK DEMAND REDUCTION" value="540 kW" detail="Annual Reduction" sub="12.8% vs Baseline" tone="purple" />
        </section>
        <section className="mt-2 grid h-[318px] grid-cols-[1.35fr_0.95fr] gap-2">
          <DashboardPanel title="SAVINGS WATERFALL (Annualized) ⓘ" variant="enterprise"><AnnualSavingsWaterfallChart /></DashboardPanel>
          <DashboardPanel title="SAVINGS COMPONENT BREAKDOWN (Annualized)" variant="enterprise"><WaterfallComponentBreakdown /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[318px] grid-cols-[0.58fr_0.94fr_0.52fr] gap-2">
          <DashboardPanel title="COMPONENT INSIGHTS" variant="enterprise"><WaterfallComponentInsights /></DashboardPanel>
          <DashboardPanel title="MONTHLY WATERFALL DETAIL" variant="enterprise"><WaterfallMonthlyDetail /></DashboardPanel>
          <DashboardPanel title="KEY SAVINGS DRIVERS" variant="enterprise"><WaterfallKeyDrivers /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[30px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Savings are calculated using an approved baseline and verified measurement methodology in accordance with ANSI C12.20 Class 0.5.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function WaterfallKpi({ detail, label, sub, tone, value }: { detail: string; label: string; sub: string; tone: "green" | "blue" | "orange" | "purple"; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "blue" ? "#147dff" : tone === "orange" ? "#f59e0b" : "#a855f7";
  return <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-[7px] text-slate-400">{label}</div><div className="mt-2 whitespace-nowrap text-[24px] leading-none" style={{color}}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div><div className={tone==="orange" || tone==="green" || tone==="purple" ? "mt-1 text-[7px] text-[#05ff5e]" : "mt-1 text-[7px] text-slate-300"}>{sub}</div></article>;
}

function AnnualSavingsWaterfallChart() {
  const bars = [
    ["Baseline\nUtility Cost", 205, "#9ca3af", "$2,340,000", 0],
    ["Demand\nSavings", 44, "#65a30d", "-$378,000", 170],
    ["Energy\nSavings", 28, "#65a30d", "-$142,000", 152],
    ["PF & Penalty\nSavings", 16, "#65a30d", "-$81,000", 140],
    ["THD & Power\nQuality Savings", 11, "#65a30d", "-$32,000", 132],
    ["Capacity\nValue", 9, "#65a30d", "-$28,320", 126],
    ["Other\nOptimizations", 6, "#65a30d", "-$7,000", 122],
    ["Current\nUtility Cost", 136, "#147dff", "$1,850,680", 68],
  ];
  return <div className="h-full text-[8px]"><svg className="h-[230px] w-full" viewBox="0 0 760 245"><g stroke="rgba(148,163,184,.16)">{[30,66,102,138,174,210].map(y=><line key={y} x1="38" x2="744" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="34">$600K</text><text x="0" y="70">$500K</text><text x="0" y="106">$400K</text><text x="0" y="142">$300K</text><text x="0" y="178">$200K</text><text x="8" y="214">$0</text></g>{bars.map(([label,height,color,value,offset],i)=>{const x=72+i*88; const y=214-Number(offset)-Number(height); return <g key={String(label)}><rect fill={String(color)} height={Number(height)} width="42" x={x} y={y}/>{i>0 && i<7 && <line stroke="#94a3b8" strokeDasharray="4 4" x1={x-46} x2={x} y1={y} y2={y}/>}<text fill="#e2e8f0" fontSize="9" textAnchor="middle" x={x+21} y={y-7}>{value}</text><text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x+21} y="228">{String(label).split("\\n").map((t,j)=><tspan dy={j?9:0} x={x+21} key={t}>{t}</tspan>)}</text></g>})}<rect fill="#061421" height="72" rx="4" stroke="rgba(103,232,249,.25)" width="170" x="300" y="92"/><text fill="#e2e8f0" fontSize="10" textAnchor="middle" x="385" y="118">TOTAL ANNUAL SAVINGS</text><text fill="#65a30d" fontSize="26" textAnchor="middle" x="385" y="144">$489,320</text><text fill="#e2e8f0" fontSize="9" textAnchor="middle" x="385" y="158">20.9% of Baseline</text></svg><div className="flex items-center justify-between text-[8px]"><span>Total Savings (Annualized): <b className="text-[#05ff5e]">$489,320</b></span><span>Total Cost Reduction: 20.9%</span><span className="text-[#05ff5e]">View Trend Over Time →</span></div></div>;
}

function WaterfallComponentBreakdown() {
  const rows = [["Demand Savings","$378,000","77.2%","$326,400","▲ 15.8%"],["Energy Savings","$142,000","29.0%","$126,300","▲ 12.4%"],["PF & Penalty Savings","$81,000","16.6%","$72,900","▲ 11.1%"],["THD & Power Quality Savings","$32,000","6.5%","$28,500","▲ 12.3%"],["Capacity Value","$28,320","5.8%","$24,850","▲ 14.0%"],["Other Optimizations","$7,000","1.4%","$6,400","▲ 9.4%"],["TOTAL","$489,320","100%","$485,350","▲ 13.8%"]];
  return <div className="h-full text-[7px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Component","Savings ($)","% of Total","vs Last Year ($)","Trend (12 Mo)"].map(h=><th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i===4 || i===1 && ri===6 ? "py-1 text-[#05ff5e]" : "py-1"} key={`${row[0]}-${i}`}>{i===4 && ri<6 ? <span>{cell} &nbsp;⌁⌁⌁</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">View Component Details →</div></div>;
}

function WaterfallComponentInsights() {
  const rows = [["1","Demand Savings is the largest contributor, reducing peak demand by 540 kW."],["2","Energy Savings reduced annual consumption by 1,024,218 kWh (18.9%)."],["3","PF improvement to 0.98 eliminated utility penalties and reduced line losses."],["4","THD reduction improved system efficiency and reduced equipment stress."],["5","Capacity value represents recovered electrical capacity and deferred upgrades."]];
  return <div className="space-y-4 text-[8px] leading-relaxed">{rows.map(([,text],i)=><div className="grid grid-cols-[18px_1fr]" key={text}><span className={i===0?"text-[#65a30d]":i===1?"text-[#65a30d]":i===2?"text-[#f59e0b]":i===3?"text-[#ef4444]":"text-[#a855f7]"}>●</span><span>{text}</span></div>)}<div className="pt-5 text-[#05ff5e]">View Insights Report →</div></div>;
}

function WaterfallMonthlyDetail() {
  const rows = [["May '24","$195,000","-$31,500","-$11,800","-$6,800","-$2,500","-$2,200","-$500","$55,400","28.4%"],["Jun '24","$190,000","-$29,800","-$11,300","-$6,200","-$2,400","-$2,000","-$550","$52,250","27.5%"],["Jul '24","$205,000","-$32,400","-$12,500","-$7,100","-$2,700","-$2,400","-$650","$57,750","28.2%"],["Aug '24","$198,000","-$30,900","-$11,900","-$6,600","-$2,600","-$2,300","-$600","$54,900","27.7%"],["Sep '24","$200,000","-$31,200","-$12,200","-$6,900","-$2,800","-$2,500","-$500","$56,400","28.2%"],["...","...","...","...","...","...","...","...","...","..."],["Apr '25","$205,000","-$33,000","-$13,100","-$7,300","-$2,800","-$2,600","-$850","$59,450","29.0%"],["May '25","$215,000","-$34,300","-$13,800","-$7,400","-$2,850","-$2,720","-$700","$61,770","28.7%"],["TOTAL","$2,340,000","-$378,000","-$142,000","-$81,000","-$32,000","-$28,320","-$7,000","$489,320","20.9%"]];
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Month","Baseline Cost","Demand Savings","Energy Savings","PF & Penalty Savings","THD & PQ Savings","Capacity Value","Other Optimizations","Net Savings","% Savings"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={i>1 ? "py-1.5 text-[#05ff5e]" : "py-1.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">View Full Monthly Report →</div></div>;
}

function WaterfallKeyDrivers() {
  const rows = [["1","Peak Demand Reduction","540 kW","$378,000","#147dff"],["2","Energy Efficiency Improvement","1,024,218 kWh","$142,000","#65a30d"],["3","Power Factor Optimization","0.68 → 0.98","$81,000","#a855f7"],["4","Harmonic Reduction (THD)","16.2% → 4.1%","$32,000","#f59e0b"],["5","Capacity Recovery","1.82 MVA","$28,320","#f59e0b"],["6","Operational Optimizations","Various","$7,000","#147dff"]];
  return <div className="space-y-5 text-[7.8px]">{rows.map(([n,label,metric,value,color])=><div className="grid grid-cols-[18px_1fr_72px_58px] gap-2" key={label}><span className="grid size-4 place-items-center rounded text-white" style={{background:color}}>{n}</span><span>{label}</span><span>{metric}</span><b>{value}</b></div>)}<div className="pt-3 text-[#05ff5e]">View Driver Analysis →</div></div>;
}

export function SavingsFinancialsScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[176px_1fr]">
        <SavingsFinancialSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-3 py-3">
          <header className="flex h-[56px] items-start justify-between border-b border-cyan-300/12">
            <div><h1 className="text-[22px] font-medium leading-none">Savings Intelligence™</h1><p className="mt-2 text-[10px] text-slate-300">Measure. Verify, Quantify the Value of ECBS.</p></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[204px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12, 2025 - May 12, 2026⌄</button><button className="w-[174px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">Site: &nbsp; Austin Data Center⌄</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[8px]">6</b></span><span className="text-lg">?</span><span className="text-lg">⇩</span><span className="grid size-8 place-items-center rounded-full bg-slate-700 text-[10px]">JD</span><span>John D.<br /><span className="text-slate-400">Facility Manager</span></span><span>⌄</span></div>
          </header>
          <section className="mt-2 grid h-[88px] grid-cols-[1fr_1fr_1fr_1fr_0.74fr_0.92fr] gap-2">
            <FinancialKpi icon="$" label="ANNUAL SAVINGS" value="$487,320" detail="▲ 13.6% vs prior year" tone="green" />
            <FinancialKpi icon="▥" label="CAPACITY RECOVERED" value="1.82 MVA" detail="▲ 920 kVA recovered" tone="blue" />
            <FinancialKpi icon="◒" label="ENERGY REDUCTION" value="8.4%" detail="▲ 1,450,000 kWh" tone="green" />
            <FinancialKpi icon="⚡" label="DEMAND REDUCTION" value="12.7%" detail="▲ 540 kW" tone="yellow" />
            <FinancialKpi icon="ROI" label="ROI" value="143%" detail="▲ Excellent" tone="purple" />
            <FinancialKpi icon="◷" label="PAYBACK PERIOD" value="2.1 Years" detail="Target: 3.0 Years" tone="cyan" status="ECBS System Status: OPTIMAL" />
          </section>
          <section className="mt-2 grid h-[288px] grid-cols-[0.98fr_0.76fr_0.94fr] gap-2">
            <FinancialPanel title="BASELINE vs CURRENT PERFORMANCE"><SavingsFinancialBaselineTable /></FinancialPanel>
            <FinancialPanel title="SAVINGS WATERFALL (Annual)"><SavingsFinancialWaterfall /></FinancialPanel>
            <FinancialPanel title="CUMULATIVE SAVINGS SINCE ACTIVATION"><SavingsFinancialCumulative /></FinancialPanel>
          </section>
          <section className="mt-2 grid h-[214px] grid-cols-[0.86fr_1.02fr_0.72fr] gap-2">
            <FinancialPanel title="CAPACITY RECOVERY VALUE™"><SavingsFinancialCapacityValue /></FinancialPanel>
            <FinancialPanel title="CURRENT BALANCE IMPROVEMENT"><SavingsFinancialBalanceImprovement /></FinancialPanel>
            <FinancialPanel title="FINANCIAL INTELLIGENCE"><SavingsFinancialIntelligence /></FinancialPanel>
          </section>
          <section className="mt-2 h-[136px]">
            <FinancialPanel title="BASELINE INFORMATION (LOCKED)"><SavingsFinancialBaselineInfo /></FinancialPanel>
          </section>
          <footer className="absolute bottom-2 left-3 right-3 flex h-[32px] items-center justify-between border-t border-cyan-300/10 pt-2 text-[9px] text-slate-400"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-6 text-[#05ff5e]"><a>Privacy Policy</a><a>Terms of Service</a><a>Support</a></span><span>All times shown in local time &nbsp;&nbsp; ◷ Last Updated: 2 min ago &nbsp;&nbsp; <b className="text-[#05ff5e]">▥ Live</b></span></footer>
        </main>
      </div>
    </div>
  );
}

function SavingsFinancialSidebar() {
  const sections = [
    ["HOME", [["⌘","Enterprise Dashboard"],["◉","Energy Dashboard"]]],
    ["INTELLIGENCE", [["▥","Capacity Intelligence"],["◇","Digital Twin"],["▤","Sites"],["▦","Transformers"],["⌁","Current Analysis"],["$","Savings & Forecast","12"]]],
    ["OPERATIONS", [["♧","Alarms & Events","12"],["▤","Reports"]]],
    ["DEVICES", [["▣","Devices","⌄"]]],
    ["SYSTEM", [["⚙","Settings"]]],
  ];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-5"><div className="text-[26px] font-black leading-none tracking-[-0.08em]"><span className="text-white">ECB</span><span className="text-[#7cff00]">S</span></div><div className="mt-1 text-[6px] font-bold uppercase tracking-[0.48em] text-white">Operating System™</div></div><nav className="space-y-4">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-2 border-b border-white/10 pb-1 text-[8px] font-bold text-[#05ff5e]">{title}</h2><div className="space-y-1">{(items as string[][]).map(([icon,label,badge])=><div className={label==="Savings & Forecast"?"flex h-[24px] items-center justify-between rounded bg-[#063b27] px-2 text-[9px] text-[#05ff5e]":"flex h-[24px] items-center justify-between rounded px-2 text-[9px] text-slate-300"} key={label}><span className="flex items-center gap-2"><span>{icon}</span>{label}</span>{badge==="12"?<span className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">{badge}</span>:badge?<span>{badge}</span>:null}</div>)}</div></section>)}</nav><div className="absolute bottom-[78px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-3 text-[9px]"><div className="mb-2 flex items-center gap-2"><span className="size-3 rounded-full bg-[#05ff5e]" />ECBS System</div><div className="text-[#05ff5e]">All Systems Operational</div><div className="mt-3 text-slate-400">Last Updated: 2 min ago</div></div><div className="absolute bottom-10 left-3 text-[9px]"><div className="text-white">Need Help?</div><div className="text-[#05ff5e]">Contact Support</div></div></aside>;
}

function FinancialPanel({ children, title }: { children: ReactNode; title: string }) {
  return <article className="h-full overflow-hidden rounded border border-cyan-300/14 bg-[#061521]/88"><div className="h-[30px] px-3 pt-2 text-[10px] font-semibold">{title}</div><div className="h-[calc(100%-30px)] px-3 pb-3">{children}</div></article>;
}

function FinancialKpi({ detail, icon, label, status, tone, value }: { detail: string; icon: string; label: string; status?: string; tone: "green" | "blue" | "yellow" | "purple" | "cyan"; value: string }) {
  const color = tone === "green" ? "#65a30d" : tone === "blue" ? "#00a8ff" : tone === "yellow" ? "#f59e0b" : tone === "purple" ? "#a855f7" : "#00e5d4";
  return <article className="relative grid grid-cols-[48px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3">{status ? <span className="absolute -top-6 right-0 rounded border border-cyan-300/12 bg-[#061421] px-3 py-1 text-[8px]"><b className="text-[#05ff5e]">●</b> {status}</span> : null}<div className="grid size-10 place-items-center rounded-full border-2 text-sm" style={{borderColor: color, color}}>{icon}</div><div><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[19px] leading-none">{value}</div><div className="mt-1 text-[7px]" style={{color}}>{detail}</div></div></article>;
}

function SavingsFinancialBaselineTable() {
  const rows = [["Energy (kWh)","18,400,000","16,950,000","▼ 1,450,000 (7.9%)"],["Peak Demand (kW)","4,210","3,670","▼ 540 (12.8%)"],["Power Factor (avg)","82%","98%","▲ 16%"],["Current Balance Index™","63%","81%","▲ 18%"],["Available Capacity","410 kVA","1,220 kVA","▲ 810 kVA"],["Annual Energy Cost","$2,340,000","$1,850,680","▼ $489,320 (20.9%)"]];
  return <div className="h-full text-[8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["METRIC","BASELINE\nMay 12, 2024 - May 11, 2025","CURRENT\nMay 12, 2025 - May 12, 2026","IMPROVEMENT"].map(h=><th className="whitespace-pre-line pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i===3?"py-1.5 text-[#05ff5e]":"py-1.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 flex items-center justify-between rounded bg-white/5 p-2 text-[8px] text-slate-300"><span className="mr-2 grid size-6 place-items-center rounded-full bg-slate-400 text-[#061421]">▣</span><span>Baseline is locked and approved. Changes require administrative authorization.</span><span className="text-[#05ff5e]">View Baseline Details →</span></div></div>;
}

function SavingsFinancialWaterfall() {
  const bars = [["Baseline\nCost",180,"#9ca3af","$2,340,000",0],["Demand\nSavings",28,"#65a30d","-$280,000",146],["Energy\nSavings",18,"#65a30d","-$140,000",134],["Power Factor\nSavings",12,"#65a30d","-$70,000",126],["Current\nCost",140,"#147dff","$1,850,680",40]];
  return <div className="h-full text-[8px]"><svg className="h-[148px] w-full" viewBox="0 0 360 158"><g stroke="rgba(148,163,184,.16)">{[18,48,78,108,138].map(y=><line key={y} x1="28" x2="352" y1={y} y2={y}/>)}</g><g fill="#e2e8f0" fontSize="7">{bars.map(([label,height,color,value,offset],i)=>{const x=60+i*62; const y=144-Number(height)-Number(offset); return <g key={String(label)}><rect fill={String(color)} height={Number(height)} width="32" x={x} y={y}/><text textAnchor="middle" x={x+16} y={y-5}>{value}</text><text fill="#94a3b8" textAnchor="middle" x={x+16} y="154">{String(label).split("\\n").map((t,j)=><tspan dy={j?8:0} x={x+16} key={t}>{t}</tspan>)}</text></g>})}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="20">$2.5M</text><text x="2" y="50">$2.0M</text><text x="2" y="80">$1.5M</text><text x="2" y="110">$1.0M</text><text x="10" y="140">$0</text></g></svg><div className="grid grid-cols-2 border-t border-cyan-300/10 pt-3 text-center"><span>Total Annual Savings<br /><b className="text-[22px] leading-none text-[#65a30d]">$489,320</b></span><span>Total Cost Reduction<br /><b className="text-[22px] leading-none text-[#65a30d]">20.9%</b></span></div></div>;
}

function SavingsFinancialCumulative() {
  const labels = ["Jun 25","Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25","Jan 26","Feb 26","Mar 26","Apr 26","May 26"];
  const values = ["$0","$18K","$39K","$85K","$112K","$145K","$183K","$223K","$289K","$324K","$487K"];
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end gap-2"><span className="rounded bg-[#123a63] px-3 py-1 text-white">Cumulative ($)</span><span className="rounded bg-[#061421] px-3 py-1">Cumulative (kWh)</span></div><svg className="h-[160px] w-full" viewBox="0 0 420 170"><defs><linearGradient id="sfCum" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#65a30d" stopOpacity=".45"/><stop offset="1" stopColor="#65a30d" stopOpacity=".05"/></linearGradient></defs><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,126,152].map(y=><line key={y} x1="34" x2="410" y1={y} y2={y}/>)}</g><path d="M42 150 L74 146 L106 140 L138 132 L170 122 L202 110 L234 96 L266 82 L298 66 L330 50 L362 36 L402 22 L402 152 L42 152 Z" fill="url(#sfCum)"/><polyline fill="none" points="42,150 74,146 106,140 138,132 170,122 202,110 234,96 266,82 298,66 330,50 362,36 402,22" stroke="#65a30d" strokeWidth="2"/><g fill="#e2e8f0" fontSize="8">{values.map((v,i)=><text key={v} textAnchor="middle" x={42+i*32} y={i<1?148:146-i*11}>{v}</text>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">$600K</text><text x="0" y="50">$500K</text><text x="0" y="76">$400K</text><text x="0" y="102">$300K</text><text x="0" y="128">$100K</text><text x="14" y="154">$0</text></g></svg><div className="flex justify-between px-7 text-[7px] text-slate-400">{labels.map(d=><span key={d}>{d}</span>)}</div><div className="mt-3 text-center">TOTAL SAVINGS SINCE ACTIVATION &nbsp; <b className="text-[20px] text-[#65a30d]">$487,320</b></div></div>;
}

function SavingsFinancialCapacityValue() {
  return <div className="grid h-full grid-cols-[98px_1fr] gap-3 text-[8px]"><div><div className="text-center">Transformer Rating<br /><b>2500 kVA</b></div><div className="mx-auto mt-3 h-[56px] w-[64px] rounded border border-slate-600 bg-gradient-to-b from-slate-500 to-slate-800" /><div className="mt-2 text-center text-[#05ff5e]">▥</div></div><div><div className="grid grid-cols-3 gap-3 text-center"><span>Baseline<br />Available Capacity<br /><b>320 kVA</b><i className="mt-2 block h-2 bg-red-500" /></span><span>Current<br />Available Capacity<br /><b>1,220 kVA</b><i className="mt-2 block h-2 bg-[#65a30d]" /></span><span>Recovered Capacity<br /><b className="text-[20px] text-[#65a30d]">920 kVA</b></span></div><div className="mt-5 rounded border border-cyan-300/10 bg-[#061421] p-3 text-center">EQUIVALENT DEFERRED CAPITAL VALUE<br /><b className="text-[24px] text-[#65a30d]">$460,000</b><br /><span className="text-slate-400">Avoided Transformer Upgrade</span></div></div></div>;
}

function SavingsFinancialBalanceImprovement() {
  const gauges = [["Productive Current","63%","81%","Baseline","Current","▲ 18% Improvement","#65a30d"],["Harmonic Distortion (THD)","8.7%","3.2%","Baseline","Current","▲ 5.5% Improvement","#00a8ff"],["Current Imbalance","12.4%","3.6%","Baseline","Current","▲ 8.8% Improvement","#65a30d"]];
  return <div className="h-full"><div className="grid grid-cols-3 gap-3">{gauges.map(([title,a,b,al,bl,trend,color])=><div className="border-r border-cyan-300/10 text-center last:border-r-0" key={title}><div className="text-[8px]">{title}</div><svg className="mx-auto mt-2 h-[72px] w-[92px]" viewBox="0 0 100 72"><path d="M18 58 A32 32 0 0 1 82 58" fill="none" stroke="#1f2937" strokeWidth="13"/><path d="M18 58 A32 32 0 0 1 38 30" fill="none" stroke="#ef4444" strokeWidth="13"/><path d="M38 30 A32 32 0 0 1 60 26" fill="none" stroke="#f59e0b" strokeWidth="13"/><path d="M60 26 A32 32 0 0 1 82 58" fill="none" stroke={color} strokeWidth="13"/><line x1="50" x2="72" y1="58" y2="38" stroke="#e2e8f0" strokeWidth="2"/></svg><div className="grid grid-cols-2 text-[8px]"><span><b className="text-base">{a}</b><br />{al}</span><span><b className="text-base">{b}</b><br />{bl}</span></div><div className="mt-2 text-[8px] text-[#05ff5e]">{trend}</div></div>)}</div><div className="mt-3 text-[8px] text-slate-300">ⓘ Improved current quality leads to lower losses, cooler equipment and longer asset life.</div></div>;
}

function SavingsFinancialIntelligence() {
  const rows = [["▣","Savings Today","$1,876"],["▣","Savings This Month","$40,560"],["▣","Savings This Year","$487,320"],["▣","Lifetime Savings","$487,320"],["▣","Cost Avoidance (Capacity)","$460,000"]];
  return <div className="space-y-3 text-[10px]">{rows.map(([icon,label,value],i)=><div className="grid grid-cols-[20px_1fr_76px_58px] items-center gap-1" key={label}><span className={i===0?"text-cyan-300":i===1?"text-blue-400":i===2?"text-purple-400":i===3?"text-orange-400":"text-blue-300"}>{icon}</span><span>{label}</span><b className="text-[#65a30d]">{value}</b><svg className="h-4 w-14" viewBox="0 0 58 18"><polyline fill="none" points="0,12 8,10 16,13 24,8 32,10 40,5 48,8 56,3" stroke="#65a30d" strokeWidth="1.5"/></svg></div>)}</div>;
}

function SavingsFinancialBaselineInfo() {
  const items = [["▣","Baseline Created:","May 12, 2025","Baseline Period:\nMay 12, 2024 - May 11, 2025\n(12 Months)"],["◇","Approved By (XECO Engineering):","Michael R.","May 12, 2025"],["○","Approved By (Customer):","John D.","May 12, 2025"],["▣","Status:","LOCKED","Baseline locked on May 12, 2025."],["","Baseline can only be modified with administrative authorization and documentation of significant operational changes.","","View Audit Log →"]];
  return <div className="grid h-full grid-cols-[1.05fr_1fr_1fr_0.76fr_1.02fr] gap-5 text-[9px]">{items.map(([icon,a,b,c],i)=><div className="grid grid-cols-[42px_1fr] border-r border-cyan-300/10 pr-4 last:border-r-0" key={`${a}-${i}`}>{icon?<span className="grid size-10 place-items-center rounded-full bg-[#1f3b17] text-[20px] text-white">{icon}</span>:<span /> }<span className={i===4?"text-slate-300":""}><span className="text-slate-400">{a}</span><br /><b className={b==="LOCKED"?"text-[15px] text-[#05ff5e]":"text-slate-100"}>{b}</b><br /><span className="whitespace-pre-line text-slate-300">{c}</span></span></div>)}</div>;
}

export function UBillForecastPreviewScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[156px_1fr]">
        <UBillSidebar active="uBillForecast" />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_32%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><h1 className="text-[17px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</h1><div className="mt-4 text-[10px]"><span className="text-slate-300">Savings & Financials</span><span className="mx-3 text-slate-500">›</span><span>uBillForecast</span><span className="mx-3 text-slate-500">›</span><span className="text-[#05ff5e]">Forecast Preview</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[140px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">Flex Tijuana⌄</button><button className="w-[176px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025⌄</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">3</b></span><span className="text-lg">?</span><span className="text-lg">⚙</span><span className="grid size-8 place-items-center rounded-full bg-slate-700">●</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[64px] items-start justify-between">
            <div><h2 className="text-[20px] font-semibold leading-none">Forecast Preview</h2><p className="mt-2 text-[11px] text-slate-300">Predicted utility costs based on usage, demand, and rates.</p></div>
            <button className="mt-1 rounded border border-cyan-300/12 bg-[#061421] px-5 py-2 text-[10px]">⇩ Export Forecast</button>
          </div>
          <section className="grid h-[42px] grid-cols-[1fr_1fr_1.15fr_0.95fr_1.15fr] gap-3 text-[8px]">
            <UBillSelect label="Utility Account" value="All Accounts" />
            <UBillSelect label="Forecast Horizon" value="Next 12 Months" />
            <UBillSelect label="Forecast As Of" value="May 18, 2025" icon="▣" />
            <UBillToggle label="View By" active="Cost ($)" other="Usage (kWh)" />
            <UBillToggle label="Comparison" active="Actuals" other="Budget        None" />
          </section>
          <section className="mt-3 grid h-[92px] grid-cols-6 gap-2">
            <UBillKpi icon="$" label="FORECASTED COST (12 MO)" value="$941,200" detail="May 2025 - Apr 2026" tone="blue" />
            <UBillKpi icon="↗" label="PROJECTED VS LAST 12 MO" value="▼ 5.6%" detail="$991,800 (May 2024 - Apr 2025)" tone="green" />
            <UBillKpi icon="◎" label="FORECASTED AVG MONTHLY" value="$78,433" detail="May 2025 - Apr 2026" tone="purple" />
            <UBillKpi icon="⚡" label="PEAK DEMAND (FORECAST)" value="1,520 kW" detail="Aug 2025" tone="orange" />
            <UBillKpi icon="◔" label="LARGEST COST MONTH" value="July 2025" detail="$93,400" tone="cyan" />
            <UBillKpi icon="◔" label="LOWEST COST MONTH" value="February 2026" detail="$63,100" tone="cyan" />
          </section>
          <section className="mt-3 grid h-[330px] grid-cols-[1.58fr_0.65fr] gap-3">
            <FinancialPanel title="FORECAST TREND (COST)"><UBillForecastTrend /></FinancialPanel>
            <FinancialPanel title="KEY HIGHLIGHTS"><UBillHighlights /></FinancialPanel>
          </section>
          <section className="mt-3 grid h-[226px] grid-cols-[0.95fr_1.06fr_0.8fr] gap-3">
            <FinancialPanel title="FORECASTED COST BREAKDOWN (12 MONTHS)"><UBillCostBreakdown /></FinancialPanel>
            <FinancialPanel title="MONTHLY FORECAST SUMMARY"><UBillMonthlySummary /></FinancialPanel>
            <FinancialPanel title="FORECAST CONFIDENCE"><UBillConfidence /></FinancialPanel>
          </section>
          <footer className="absolute bottom-2 left-4 right-4 flex h-[32px] items-center justify-between border-t border-cyan-300/10 pt-2 text-[9px] text-slate-400"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-8 text-[#05ff5e]"><a>Privacy Policy</a><a>Terms of Service</a><a>Support</a></span><span>Data updated: May 18, 2025 10:15 AM &nbsp;&nbsp; <b className="text-[#05ff5e]">▥ Live</b></span></footer>
        </main>
      </div>
    </div>
  );
}

export function UBillTrackerUsageSummaryScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[156px_1fr]">
        <UBillSidebar active="uBillTracker" />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_32%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><h1 className="text-[17px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</h1><div className="mt-4 text-[10px]"><span className="text-slate-300">Savings & Financials</span><span className="mx-3 text-slate-500">›</span><span>uBillTracker</span><span className="mx-3 text-slate-500">›</span><span className="text-[#05ff5e]">Usage Summary</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[140px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">Flex Tijuana⌄</button><button className="w-[176px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">▣ &nbsp; May 12 - May 18, 2025⌄</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">1</b></span><span className="text-lg">?</span><span className="text-lg">⚙</span><span className="grid size-8 place-items-center rounded-full bg-slate-700">●</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[54px] items-start justify-between">
            <div><h2 className="text-[20px] font-semibold leading-none">Usage Summary</h2><p className="mt-2 text-[11px] text-slate-300">Detailed view of energy usage across all meters and time periods.</p></div>
            <div className="flex gap-3 text-[10px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-5 py-2">↗ View Full Report</button></div>
          </div>
          <section className="grid h-[42px] grid-cols-[1fr_1fr_0.9fr_1fr_0.55fr] gap-3 text-[8px]">
            <UBillSelect label="Utility Account" value="All Accounts" />
            <UBillSelect label="Meter" value="All Meters" />
            <UBillSelect label="Time Granularity" value="Daily" />
            <UBillSelect label="Date Range" value="Apr 1 - Apr 30, 2025" icon="▣" />
            <button className="mt-[14px] h-9 rounded border border-cyan-300/12 bg-[#061421] text-[10px]">▽ &nbsp; Filters</button>
          </section>
          <section className="mt-3 grid h-[84px] grid-cols-5 gap-2">
            <UBillKpi icon="▥" label="TOTAL USAGE" value="1,125,000 kWh" detail="▲ 6.7% vs Mar 1 - Mar 31" tone="blue" />
            <UBillKpi icon="♙" label="PEAK DEMAND" value="1,480 kW" detail="▲ 3.2% vs Mar 1 - Mar 31" tone="green" />
            <UBillKpi icon="⚡" label="AVG POWER FACTOR" value="0.96" detail="▲ 0.02 vs Mar 1 - Mar 31" tone="blue" />
            <UBillKpi icon="◔" label="TOTAL OPERATING HOURS" value="720 hrs" detail="▲ 2.1% vs Mar 1 - Mar 31" tone="green" />
            <UBillKpi icon="▧" label="USAGE INTENSITY" value="0.42 kWh / ft²" detail="▲ 5.3% vs Mar 1 - Mar 31" tone="blue" />
          </section>
          <section className="mt-3 grid h-[242px] grid-cols-[1.38fr_0.75fr] gap-3">
            <FinancialPanel title="USAGE & DEMAND OVER TIME"><UBillUsageDemandChart /></FinancialPanel>
            <FinancialPanel title="USAGE DISTRIBUTION"><UBillUsageDistribution /></FinancialPanel>
          </section>
          <section className="mt-3 grid h-[218px] grid-cols-[0.9fr_0.86fr_0.98fr] gap-3">
            <FinancialPanel title="DAILY USAGE SUMMARY"><UBillDailySummary /></FinancialPanel>
            <FinancialPanel title="USAGE BY TIME OF DAY (kWh)"><UBillHeatmap /></FinancialPanel>
            <FinancialPanel title="USAGE COMPARISON"><UBillUsageComparison /></FinancialPanel>
          </section>
          <section className="mt-3 grid h-[86px] grid-cols-4 gap-3">
            <UBillInsightCard icon="▣" title="INSIGHT" text="Total usage increased by 6.7% compared to the previous period, mainly due to higher production activity and longer operating hours." tone="green" />
            <UBillInsightCard icon="▥" title="PEAK DAY" text="Highest usage on Apr 24, 2025 41,200 kWh | 1,580 kW" tone="green" />
            <UBillInsightCard icon="▦" title="LOWEST DAY" text="Lowest usage on Apr 27, 2025 28,900 kWh | 1,120 kW" tone="blue" />
            <UBillInsightCard icon="♙" title="RECOMMENDATION" text="Optimize HVAC scheduling during off-peak hours to reduce usage by up to 8%." tone="green" />
          </section>
          <footer className="absolute bottom-2 left-4 right-4 flex h-[32px] items-center justify-between border-t border-cyan-300/10 pt-2 text-[9px] text-slate-400"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="space-x-8 text-[#05ff5e]"><a>Privacy Policy</a><a>Terms of Service</a><a>Support</a></span><span><b className="text-[#05ff5e]">●</b> All Systems Operational &nbsp;&nbsp; <b className="text-[#05ff5e]">▥ Live</b></span></footer>
        </main>
      </div>
    </div>
  );
}

function UBillSidebar({ active = "uBillForecast" }: { active?: "uBillForecast" | "uBillTracker" }) {
  const top = [["▦","Dashboard"],["◎","Capacity Intelligence"],["◇","Digital Twin"],["▤","Sites"],["▦","Transformers"],["⚡","Electrical Network"],["⌁","Current Analysis"]];
  const sub = ["Overview","uBillTracker","uBillForecast","Rate Analysis","Bill History","Invoices","Settings"];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-4"><div className="text-[28px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#16ff5d]">Energy</div></div><nav className="space-y-1 text-[9px]">{top.map(([icon,label])=><div className="flex h-[24px] items-center gap-2 rounded px-1.5 text-slate-300" key={label}><span>{icon}</span>{label}</div>)}<div className="flex h-[24px] items-center gap-2 rounded px-1.5 text-[#05ff5e]"><span>$</span>Savings & Financials</div><div className="ml-5 space-y-1">{sub.map(label=><div className={label===active?"h-[23px] border-l-2 border-[#05ff5e] bg-[#063b27] pl-2 leading-[23px] text-[#05ff5e]":"h-[23px] pl-2 leading-[23px] text-slate-300"} key={label}>{label}</div>)}</div>{[["♧","Alerts & Events","2"],["▤","Reports"],["◇","Devices"],["⚙","Settings"]].map(([icon,label,badge])=><div className="flex h-[24px] items-center justify-between rounded px-1.5 text-slate-300" key={label}><span className="flex items-center gap-2"><span>{icon}</span>{label}</span>{badge?<span className="grid size-4 place-items-center rounded-full bg-orange-500 text-[8px] text-white">{badge}</span>:null}</div>)}</nav><div className="absolute bottom-[102px] left-3 right-3 rounded border border-cyan-300/12 bg-[#061421] p-3 text-center text-[9px]"><div>XECO Current<br />Balance Index™</div><div className="mt-2 text-[36px] leading-none text-[#65a30d]">96</div><div>A+ Rating</div><div className="mt-2 text-[#05ff5e]">View Details →</div></div><div className="absolute bottom-10 left-3 text-[9px] text-slate-400">Last Updated:<br />May 18, 2025 10:15 AM<br /><span className="text-[#05ff5e]">● Real-time</span></div></aside>;
}

function UBillSelect({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return <label className="block"><span className="text-slate-400">{label}</span><span className="mt-1 flex h-9 items-center justify-between rounded border border-cyan-300/12 bg-[#061421] px-3 text-[10px]">{value}<b>{icon || "⌄"}</b></span></label>;
}

function UBillToggle({ active, label, other }: { active: string; label: string; other: string }) {
  return <div><div className="text-slate-400">{label}</div><div className="mt-1 flex h-9 items-center rounded border border-cyan-300/12 bg-[#061421] p-1"><span className="rounded bg-[#0b4a8f] px-4 py-1.5 text-white">{active}</span><span className="px-4 text-slate-300">{other}</span></div></div>;
}

function UBillKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "blue" | "green" | "purple" | "orange" | "cyan"; value: string }) {
  const color = tone === "blue" ? "#147dff" : tone === "green" ? "#65a30d" : tone === "purple" ? "#a855f7" : tone === "orange" ? "#f59e0b" : "#00bcd4";
  return <article className="grid grid-cols-[48px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><span className="grid size-10 place-items-center rounded-full text-[20px] text-white" style={{background: color}}>{icon}</span><span><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[18px] leading-none">{value}</div><div className="mt-2 text-[7px]" style={{color}}>{detail}</div></span></article>;
}

function UBillForecastTrend() {
  const months = ["May '25","Jun '25","Jul '25","Aug '25","Sep '25","Oct '25","Nov '25","Dec '25","Jan '26","Feb '26","Mar '26","Apr '26"];
  return <div className="h-full text-[8px]"><div className="mb-2 flex justify-between"><div className="flex gap-4"><span className="text-[#65a30d]">━ Forecasted Cost ($)</span><span className="text-[#147dff]">-- Actual Cost ($)</span><span className="text-slate-300">-- Budget ($)</span></div><div><span className="rounded bg-[#0b4a8f] px-4 py-2">Monthly</span><span className="rounded bg-[#061421] px-4 py-2">Cumulative</span></div></div><svg className="h-[218px] w-full" viewBox="0 0 770 230"><defs><linearGradient id="ubillArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#65a30d" stopOpacity=".38"/><stop offset="1" stopColor="#65a30d" stopOpacity=".05"/></linearGradient></defs><g stroke="rgba(148,163,184,.16)">{[24,56,88,120,152,184,216].map(y=><line key={y} x1="38" x2="760" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="0" y="28">$125K</text><text x="2" y="60">$100K</text><text x="8" y="92">$75K</text><text x="8" y="124">$50K</text><text x="8" y="156">$25K</text><text x="18" y="218">$0</text></g><path d="M54 124 L118 106 L182 82 L246 86 L310 96 L374 98 L438 100 L502 112 L566 126 L630 130 L694 124 L752 112 L752 218 L54 218 Z" fill="url(#ubillArea)"/><polyline fill="none" points="54,124 118,106 182,82 246,86 310,96 374,98 438,100 502,112 566,126 630,130 694,124 752,112" stroke="#65a30d" strokeWidth="2.5"/><polyline fill="none" points="54,146 118,128 182,104 246,108 310,112 374,116 438,122 502,132 566,142 630,144 694,136 752,130" stroke="#147dff" strokeDasharray="7 5" strokeWidth="2"/><polyline fill="none" points="54,156 118,148 182,138 246,140 310,140 374,140 438,140 502,146 566,150 630,150 694,148 752,144" stroke="#94a3b8" strokeDasharray="6 5" strokeWidth="2"/>{months.map((m,i)=><text fill="#94a3b8" fontSize="8" key={m} textAnchor="middle" x={54+i*64} y="228">{m}</text>)}<rect fill="#061421" height="82" rx="4" stroke="rgba(103,232,249,.2)" width="150" x="188" y="112"/><text fill="#e2e8f0" fontSize="11" x="204" y="132">July 2025</text><text fill="#65a30d" fontSize="9" x="204" y="154">● Forecasted Cost</text><text fill="#e2e8f0" fontSize="9" x="300" y="154">$93,400</text><text fill="#147dff" fontSize="9" x="204" y="172">● Actual Cost</text><text fill="#e2e8f0" fontSize="9" x="300" y="172">$89,100</text><text fill="#94a3b8" fontSize="9" x="204" y="190">● Budget</text><text fill="#e2e8f0" fontSize="9" x="300" y="190">$88,000</text></svg></div>;
}

function UBillHighlights() {
  const rows = [["▥","Forecasted cost is 5.6% lower than the last 12 months."],["▣","July 2025 is projected to be the highest cost month."],["◎","Forecast is based on current rates, usage trends, and seasonal factors."],["⚡","Peak demand expected in August 2025."],["$","Continued PF improvement is reducing forecasted costs."]];
  return <div className="space-y-5 text-[10px]">{rows.map(([icon,text],i)=><div className="grid grid-cols-[30px_1fr]" key={text}><span className={i===0?"text-[#65a30d]":i===1?"text-[#147dff]":i===2?"text-[#a855f7]":i===3?"text-[#f59e0b]":"text-[#00bcd4]"}>{icon}</span><span>{text}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Detailed Analysis →</div></div>;
}

function UBillCostBreakdown() {
  const rows = [["Energy Charges","$452,200 (48.0%)","#65a30d"],["Demand Charges","$302,800 (32.2%)","#147dff"],["Taxes & Fees","$112,600 (12.0%)","#a855f7"],["Other Charges","$73,600 (7.8%)","#f59e0b"]];
  return <div className="grid h-full grid-cols-[146px_1fr] gap-4 text-[9px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#65a30d" strokeDasharray="96 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="65 214" strokeDashoffset="-98" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#a855f7" strokeDasharray="26 214" strokeDashoffset="-164" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="17 214" strokeDashoffset="-190" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[42px] w-[132px] text-center"><b className="text-xl">$941,200</b><br/>Total Forecast</div></div><div className="space-y-4 pt-4">{rows.map(([label,value,color])=><div className="grid grid-cols-[14px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}<div className="pt-3 text-[#05ff5e]">View Full Breakdown →</div></div></div>;
}

function UBillMonthlySummary() {
  const rows = [["May 2025","$74,800","▼ 4.1%","▲ 1.6%"],["Jun 2025","$82,100","▼ 3.2%","▼ 0.3%"],["Jul 2025","$93,400","▼ 2.8%","▲ 6.1%"],["Aug 2025","$91,600","▼ 6.0%","▲ 4.0%"],["Sep 2025","$86,200","▼ 5.5%","▲ 2.1%"]];
  return <div className="h-full text-[8.6px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Month","Forecasted Cost ($)","Vs Last Year (%)","Vs Budget (%)"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i===2?"py-1.5 text-[#05ff5e]":i===3 && cell.includes("▲")?"py-1.5 text-red-400":"py-1.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">View Full Forecast Table →</div></div>;
}

function UBillConfidence() {
  return <div className="grid h-full grid-cols-[150px_1fr] items-center gap-4 text-[9px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#064e3b" strokeWidth="14"/><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="188 214" strokeWidth="14" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[42px] w-[132px] text-center"><b className="text-[28px]">88%</b><br/><span className="text-[#05ff5e]">High</span><br/>Confidence</div></div><div className="leading-relaxed">Forecast accuracy is high based on data quality, seasonality, and trend consistency.<div className="mt-9 text-[#05ff5e]">View Confidence Details →</div></div></div>;
}

function UBillUsageDemandChart() {
  const labels = ["Apr 1","Apr 6","Apr 11","Apr 16","Apr 21","Apr 26","Apr 30"];
  const bars = [28,34,31,26,24,36,41,32,45,48,38,31,36,43,35,33,31,38,29,36,43,39,34,28,33,40,36,35,38,46];
  const line = "42,86 70,106 98,78 126,58 154,91 182,48 210,66 238,36 266,58 294,84 322,64 350,42 378,56 406,66 434,54 462,70 490,52 518,38 546,50 574,30 602,54 630,72 658,88 686,56 714,64 742,44 770,60 798,48 826,38 854,108";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-between"><div className="flex gap-5"><span className="text-[#147dff]">● Usage (kWh)</span><span className="text-[#05ff5e]">● Demand (kW)</span></div><div><span className="rounded bg-[#0b4a8f] px-4 py-1.5">Daily</span><span className="px-4">Weekly</span><span>Monthly</span></div></div><svg className="h-[170px] w-full" viewBox="0 0 890 180"><g stroke="rgba(148,163,184,.16)">{[24,56,88,120,152].map(y=><line key={y} x1="38" x2="876" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="4" y="28">50K</text><text x="4" y="60">40K</text><text x="4" y="92">30K</text><text x="4" y="124">20K</text><text x="4" y="156">10K</text><text x="22" y="176">0</text><text x="850" y="28">2.5K</text><text x="850" y="76">2.0K</text><text x="850" y="124">1.0K</text><text x="858" y="176">0</text></g>{bars.map((h,i)=><rect fill="#1264d8" height={h*2.05} key={i} width="10" x={48+i*27} y={166-h*2.05}/>) }<polyline fill="none" points={line} stroke="#05b82e" strokeWidth="2"/>{line.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#05b82e" key={i} r="2.4"/>})}{labels.map((l,i)=><text fill="#94a3b8" fontSize="9" key={l} textAnchor="middle" x={52+i*132} y="178">{l}</text>)}</svg></div>;
}

function UBillUsageDistribution() {
  const rows = [["Production Lines","520,000 kWh (46.2%)","#1264d8"],["HVAC Systems","230,000 kWh (20.4%)","#65a30d"],["Compressed Air","145,000 kWh (12.9%)","#a855f7"],["Lighting","120,000 kWh (10.7%)","#f59e0b"],["Other Loads","110,000 kWh (9.8%)","#00bcd4"]];
  return <div className="grid h-full grid-cols-[150px_1fr] gap-3 text-[9px]"><div className="relative"><svg className="size-[136px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#1264d8" strokeDasharray="99 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#65a30d" strokeDasharray="44 214" strokeDashoffset="-101" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#a855f7" strokeDasharray="28 214" strokeDashoffset="-147" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="23 214" strokeDashoffset="-177" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#00bcd4" strokeDasharray="20 214" strokeDashoffset="-202" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[45px] w-[136px] text-center"><b>1,125,000</b><br/>kWh</div></div><div className="space-y-3 pt-2">{rows.map(([label,value,color])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Load Breakdown →</div></div></div>;
}

function UBillDailySummary() {
  const rows = [["Apr 30, 2025","37,200","1,420","0.96","24.0"],["Apr 29, 2025","36,800","1,380","0.96","24.0"],["Apr 28, 2025","36,100","1,360","0.97","24.0"],["Apr 27, 2025","28,900","1,120","0.96","20.5"],["Apr 26, 2025","35,600","1,330","0.95","24.0"],["Apr 25, 2025","36,900","1,430","0.96","24.0"]];
  return <div className="h-full text-[7.4px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Date","Total Usage (kWh)","Peak Demand (kW)","Avg PF","Operating Hours"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className="py-1.5" key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">View Full Daily Data →</div></div>;
}

function UBillHeatmap() {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return <div className="h-full text-[8px]"><div className="mb-2 grid grid-cols-[36px_repeat(4,1fr)] text-center text-slate-400"><span/><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div><div className="grid grid-cols-[36px_1fr] gap-2"><div className="grid grid-rows-7 gap-0.5 text-right text-slate-300">{days.map(d=><span key={d}>{d}</span>)}</div><div className="grid h-[112px] grid-cols-12 grid-rows-7 gap-0.5">{Array.from({length:84}).map((_,i)=>{const c=i%12; const r=Math.floor(i/12); const hot=c>5&&c<10&&r<5; const med=c>3&&c<6&&r<5; return <span key={i} style={{background: hot ? "#65a30d" : med ? "#0b5f92" : "#0b3470"}}/>})}</div></div><div className="mt-3 flex items-center gap-2"><span>Low</span><span className="h-3 flex-1 bg-gradient-to-r from-[#0b3470] via-[#05b82e] to-[#f59e0b]"/><span>High</span></div><div className="mt-2 text-[#05ff5e]">View Heatmap Details →</div></div>;
}

function UBillUsageComparison() {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const blue = [44,42,43,40,43,36,38];
  const green = [41,40,34,31,41,30,32];
  return <div className="h-full text-[8px]"><div className="mb-2 flex justify-between"><div className="flex gap-4"><span className="text-[#147dff]">● Apr 1 - Apr 30, 2025</span><span className="text-[#65a30d]">● Mar 1 - Mar 31, 2025</span></div><div><span className="rounded bg-[#0b4a8f] px-3 py-1">kWh</span><span className="rounded bg-[#061421] px-3 py-1">kW</span></div></div><svg className="h-[128px] w-full" viewBox="0 0 360 136"><g stroke="rgba(148,163,184,.16)">{[20,45,70,95,120].map(y=><line key={y} x1="30" x2="350" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="22">50K</text><text x="0" y="47">40K</text><text x="0" y="72">30K</text><text x="0" y="97">20K</text><text x="8" y="122">0</text></g>{days.map((d,i)=>{const x=44+i*42; return <g key={d}><rect fill="#1264d8" height={blue[i]*1.8} width="12" x={x} y={122-blue[i]*1.8}/><rect fill="#65a30d" height={green[i]*1.8} width="12" x={x+14} y={122-green[i]*1.8}/><text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x+12} y="134">{d}</text></g>})}</svg><div className="mt-1 text-[#05ff5e]">View Comparison Report →</div></div>;
}

function UBillInsightCard({ icon, text, title, tone }: { icon: string; text: string; title: string; tone: "green" | "blue" }) {
  const color = tone === "green" ? "#16a34a" : "#147dff";
  return <article className="grid grid-cols-[32px_1fr] rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[8px]"><span className="grid size-7 place-items-center rounded-full text-white" style={{background: color}}>{icon}</span><span><b className="text-[9px]">{title}</b><br/><span className="text-slate-300">{text}</span></span></article>;
}

function CapacityIntelKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "cyan" | "blue" | "orange" | "purple" | "green" | "yellow"; trend: string; value: string }) {
  const color = tone === "cyan" ? "#00bcd4" : tone === "blue" ? "#147dff" : tone === "orange" ? "#ff8a00" : tone === "purple" ? "#a855f7" : tone === "green" ? "#65a30d" : "#f59e0b";
  return <article className="grid grid-cols-[52px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-11 place-items-center rounded-full border-2 text-xl" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[8px] text-slate-400">{label}</div><div className="mt-1 text-2xl leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-300">{detail}</div><div className="mt-1 text-[7px] text-[#05ff5e]">{trend}</div></div></article>;
}

function CapacityUtilizationTrend() {
  return <div className="h-full text-[8px]"><div className="mb-1 flex gap-5"><span className="text-[#65a30d]">━ Utilization (%)</span><span className="text-[#147dff]">━ Optimal Range</span><span className="text-red-400">-- High Risk</span></div><svg className="h-[124px] w-full" viewBox="0 0 430 132"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90,114].map((y)=><line key={y} x1="30" x2="420" y1={y} y2={y}/>)}</g><line stroke="#ef4444" strokeDasharray="5 4" x1="30" x2="420" y1="30" y2="30"/><line stroke="#147dff" strokeDasharray="5 4" x1="30" x2="420" y1="62" y2="62"/><polyline fill="none" points="44,82 98,78 152,80 206,84 260,88 314,90 376,86" stroke="#65a30d" strokeWidth="2" />{["52.8%","54.3%","53.1%","51.2%","48.7%","47.9%","49.1%"].map((v,i)=><text fill="#e2e8f0" fontSize="8" key={v} textAnchor="middle" x={44+i*55} y={76+i}>{v}</text>)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["May 12","May 13","May 14","May 15","May 16","May 17","May 18"].map((d)=><span key={d}>{d}</span>)}</div><div className="mt-2 text-[#05ff5e]">View Trend Analysis →</div></div>;
}

function AvailableCapacityTrend() {
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-6"><span className="text-[#65a30d]">━ Available Capacity</span><span className="text-[#147dff]">━ Reserve Margin</span></div><svg className="h-[124px] w-full" viewBox="0 0 430 132"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90,114].map((y)=><line key={y} x1="34" x2="420" y1={y} y2={y}/>)}</g><polyline fill="none" points="44,82 96,80 148,76 200,72 252,68 304,72 366,70" stroke="#65a30d" strokeWidth="2" /><polyline fill="none" points="44,106 96,102 148,98 200,96 252,92 304,96 366,94" stroke="#147dff" strokeWidth="2" />{["1.16","1.18","1.22","1.21","1.26","1.23","1.24"].map((v,i)=><text fill="#e2e8f0" fontSize="8" key={v} textAnchor="middle" x={44+i*53} y={76+i%2}>{v}</text>)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["May 12","May 13","May 14","May 15","May 16","May 17","May 18"].map((d)=><span key={d}>{d}</span>)}</div><div className="mt-2 text-[#05ff5e]">View Capacity Forecast →</div></div>;
}

function CapacityRecoveryTrend() {
  return <div className="h-full text-[8px]"><div className="mb-1 text-center text-[#65a30d]">━ Cumulative Recovered (MVA)</div><svg className="h-[130px] w-full" viewBox="0 0 430 138"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90,114].map((y)=><line key={y} x1="34" x2="420" y1={y} y2={y}/>)}</g><polyline fill="none" points="40,120 82,110 124,98 166,86 208,72 250,58 292,44 334,34 376,25 414,18" stroke="#65a30d" strokeWidth="3" />{["0.00","0.18","0.32","0.48","0.67","0.89","1.10","1.28","1.45","1.82"].map((v,i)=><text fill="#e2e8f0" fontSize="8" key={v} textAnchor="middle" x={40+i*42} y={116-i*10}>{v}</text>)}</svg><div className="flex justify-between px-6 text-[7px] text-slate-400">{["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","May '25"].map((d)=><span key={d}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Recovery Details →</div></div>;
}

function CapacityTransformerTable() {
  const rows = [["TX-01 Main","2,500","1,228","49.1%","1,272","1.27","Optimal"],["TX-02 HVAC","1,500","654","43.6%","846","0.85","Optimal"],["TX-03 Production","2,000","1,045","52.3%","955","0.96","Optimal"],["TX-04 Lighting","750","248","33.1%","502","0.50","Optimal"],["TX-05 Utilities","1,000","356","35.6%","644","0.64","Optimal"],["TOTAL","7,750","3,531","45.5%","4,219","4.22","Optimal"]];
  return <CapacityTinyTable headers={["Transformer","Rated (kVA)","Current Load (kVA)","Load %","Available (kVA)","Available (MVA)","Status"]} rows={rows} link="View All Transformers →" />;
}

function CapacitySystemTable() {
  const rows = [["HVAC Systems","2,350","1,128","48.0%","1,222","28.9%"],["Motor Systems","2,100","986","47.0%","1,114","26.4%"],["Process Equipment","1,600","768","48.0%","832","19.7%"],["Lighting Systems","850","248","29.2%","602","14.3%"],["Other Systems","850","401","47.2%","449","10.6%"],["TOTAL","7,750","3,531","45.5%","4,219","100%"]];
  return <CapacityTinyTable headers={["System","Connected Load (kVA)","Current Load (kVA)","Load %","Available (kVA)","% of Total Available"]} rows={rows} link="View System Breakdown →" />;
}

function CapacityTinyTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[6.6px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map((h)=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row)=><tr className="border-t border-white/5" key={row[0]}>{row.map((c,i)=><td className={i===row.length-1?"py-0.5 text-[#05ff5e]":"py-0.5"} key={`${row[0]}-${c}`}>{c}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">{link}</div></div>;
}

function CapacityZones() {
  const rows = [["Optimal","0 - 60%","4.22","74.8%","#65a30d"],["Moderate","60 - 80%","1.18","20.9%","#147dff"],["High","80 - 90%","0.25","4.4%","#f59e0b"],["Critical","90 - 100%","0.00","0.0%","#ef4444"],["TOTAL","","5.65","100%","#e2e8f0"]];
  return <div className="grid h-full grid-cols-[134px_1fr] gap-2 text-[8px]"><div className="relative"><svg className="size-[120px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#65a30d" strokeDasharray="150 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="42 201" strokeDashoffset="-152" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#f59e0b" strokeDasharray="9 201" strokeDashoffset="-196" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[42px] w-[120px] text-center">System<br />Utilization<br />Zones</div></div><div className="space-y-1">{rows.map(([zone,range,mva,pct,color])=><div className="grid grid-cols-[58px_58px_42px_42px] gap-1" key={zone}><span><i className="mr-1 inline-block size-2 rounded-full" style={{background:color}} />{zone}</span><span>{range}</span><span>{mva}</span><span>{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Zone Analysis →</div></div></div>;
}

function CapacityForecast() {
  return <div className="grid h-full grid-cols-[1fr_108px] gap-2 text-[8px]"><div><div className="mb-1 flex gap-4 text-[7px]"><span className="text-[#65a30d]">━ Forecasted Load %</span><span className="text-[#147dff]">-- Optimal Range</span><span className="text-red-400">-- High Risk</span></div><svg className="h-[94px] w-full" viewBox="0 0 300 100"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90].map((y)=><line key={y} x1="24" x2="292" y1={y} y2={y}/>)}</g><line stroke="#ef4444" strokeDasharray="4 4" x1="24" x2="292" y1="26" y2="26"/><line stroke="#147dff" strokeDasharray="4 4" x1="24" x2="292" y1="52" y2="52"/><polyline fill="none" points="30,70 58,68 86,69 114,67 142,68 170,66 198,67 226,65 254,66 286,64" stroke="#65a30d" strokeWidth="2"/></svg><div className="text-[#05ff5e]">View Full Forecast →</div></div><div className="rounded border border-cyan-300/12 bg-[#061421] p-2 text-center"><div>Max Forecasted Load</div><b className="text-xl text-[#05ff5e]">56.2%</b><div>Average Forecasted Load</div><b>50.7%</b><div>Capacity at Risk</div><b className="text-[#05ff5e]">0.00 MVA</b></div></div>;
}

function CapacityOpportunitiesTable() {
  const rows = [["HVAC Schedule Optimization","185","4.4%","Available"],["Motor Load Balancing","142","3.4%","Available"],["Power Factor Improvement","96","2.3%","In Progress"],["Peak Shaving Strategy","210","5.0%","Available"],["Harmonic Reduction","68","1.6%","Available"],["Total Potential Capacity","701","16.7%",""]];
  return <CapacityTinyTable headers={["Opportunity","Potential Capacity (kVA)","Impact","Status"]} rows={rows} link="View All Opportunities →" />;
}

function CapacityHealthIndicators() {
  const rows = [["Transformer Loading","45.5%"],["System Balance","98.6%"],["Voltage Stability","99.1%"],["Thermal Status","Normal"],["Infrastructure Stress","Low"]];
  return <div className="space-y-1 text-[7.2px]">{rows.map(([label,value],i)=><div className="grid grid-cols-[1fr_28px_42px_68px] items-center gap-2 border-b border-white/5 pb-0.5" key={label}><span>{label}</span><span className="text-[#05ff5e]">●</span><span>{value}</span><TinyCapacitySpark seed={i}/></div>)}<div className="pt-0.5 text-[8px] text-[#05ff5e]">View Health Report →</div></div>;
}

function TinyCapacitySpark({ seed }: { seed: number }) {
  const points = seed % 2 ? "0,15 8,10 16,12 24,7 32,9 40,5 48,8 56,3" : "0,14 8,12 16,13 24,8 32,10 40,6 48,7 56,4";
  return <svg className="h-4 w-14" viewBox="0 0 58 20"><polyline fill="none" points={points} stroke="#65a30d" strokeWidth="1.5" /></svg>;
}

function BaselineKpi({ baseline, current, diff, label, reduction }: { baseline: string; current: string; diff: string; label: string; reduction: string }) {
  return <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-center text-[7px] text-slate-400">{label}</div><div className="mt-2 grid grid-cols-2 gap-2 text-[8px] text-slate-400"><span>BASELINE</span><span className="text-right">CURRENT</span></div><div className="grid grid-cols-2 gap-2 text-xl leading-none"><span>{baseline}</span><span className="text-right">{current}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-[8px]"><span>Difference<br /><b className="text-[#05ff5e]">{diff}</b></span><span className="text-right">%<br /><b className="text-[#05ff5e]">{reduction}</b></span></div></article>;
}

function BaselineEnergyChart() {
  const months = ["May","Jun","Jul","Aug","Sep","Oct","Dec","Jan","Feb","Mar","Apr","May"];
  return <div className="h-full text-[8px]"><div className="mb-1 flex gap-4 text-[7px]"><span className="text-slate-300">■ Baseline (May 12, 2023 - May 11, 2024)</span><span className="text-[#9cff4d]">■ Current</span><span className="text-[#147dff]">✦ % Difference</span></div><svg className="h-[130px] w-full" viewBox="0 0 500 136"><g stroke="rgba(148,163,184,.16)">{[20,45,70,95,120].map((y) => <line key={y} x1="34" x2="490" y1={y} y2={y} />)}</g>{months.map((month, i) => { const x = 44 + i * 36; const base = 62 + (i % 4) * 8; const cur = 46 + (i % 5) * 7; return <g key={`${month}-${i}`}><rect fill="#d1d5db" height={base} width="12" x={x} y={122 - base} opacity=".85" /><rect fill="#65a30d" height={cur} width="12" x={x + 14} y={122 - cur} /><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x + 13} y="134">{month}</text></g>; })}<polyline fill="none" points="50,76 86,70 122,66 158,58 194,66 230,76 266,80 302,74 338,68 374,64 410,70 446,64" stroke="#147dff" strokeWidth="2" /></svg><div className="grid grid-cols-3 pt-1 text-center"><span>Total Difference<br /><b>-999,970 kWh</b></span><span>Average Daily Difference<br /><b>-2,738 kWh/day</b></span><span>% Difference<br /><b className="text-[#05ff5e]">-18.9%</b></span></div><div className="mt-1 text-[#05ff5e]">View Energy Analysis →</div></div>;
}

function BaselineLoadProfile() {
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-slate-400">◆ Baseline</span><span className="text-[#9cff4d]">◆ Current</span><span className="text-[#147dff]">◆ Difference</span></div><svg className="h-[128px] w-full" viewBox="0 0 420 136"><g stroke="rgba(148,163,184,.16)">{[20,45,70,95,120].map((y) => <line key={y} x1="28" x2="410" y1={y} y2={y} />)}</g><polyline fill="none" points="32,96 68,82 104,54 140,36 176,30 212,28 248,24 284,18 320,38 356,70 398,96" stroke="#6b7280" strokeDasharray="4 4" strokeWidth="2" /><polyline fill="none" points="32,100 68,92 104,80 140,68 176,56 212,48 248,42 284,28 320,54 356,74 398,98" stroke="#9cff4d" strokeWidth="2" /><polyline fill="none" points="32,102 68,104 104,110 140,106 176,108 212,100 248,104 284,92 320,100 356,94 398,104" stroke="#147dff" strokeDasharray="3 3" strokeWidth="2" /></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["12 AM","3 AM","6 AM","9 AM","12 PM","3 PM","6 PM","9 PM"].map((d) => <span key={d}>{d}</span>)}</div><div className="grid grid-cols-3 pt-2 text-center"><span>Peak Reduction<br /><b>540 kW</b></span><span>Load Factor Improvement<br /><b>+12.4%</b></span><span>Energy Shifted<br /><b>182 kWh</b></span></div><div className="mt-1 text-[#05ff5e]">View Load Profile Details →</div></div>;
}

function BaselineSummaryTable() {
  const rows = [["Energy (kWh)","5,286,124","4,286,154","-999,970","-18.9%"],["Peak Demand (kW)","4,210","3,670","-540","-12.8%"],["Average Demand (kW)","2,203","1,786","-417","-18.9%"],["kVA","6,189,930","4,365,210","-1,824,720","-29.5%"],["Power Factor (Avg)","0.68","0.98","+0.30","+44.1%"],["THD (Avg %)","16.2%","4.1%","-12.1%","-74.7%"],["CO2 Avoided (Tons)","1,865","1,433","-432","-23.2%"]];
  return <div className="h-full text-[7.2px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Metric","Baseline","Current","Difference","% Change"].map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((c, i) => <td className={i > 2 ? "py-1 text-[#05ff5e]" : "py-1"} key={`${row[0]}-${c}`}>{c}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">View Full Summary →</div></div>;
}

function BaselineDemandChart() {
  return <MiniBaselineBars footer={["Peak Reduction|540 kW", "Max Reduction Day|Jan 18, 2025", "% Reduction|-12.8%"]} line="42,92 80,88 118,86 156,82 194,80 232,76 270,72 308,70 346,68 384,66" title="View Demand Analysis →" />;
}

function BaselinePowerFactorChart() {
  return <MiniBaselineLine footer={["PF Improvement|+0.30", "Utility Target|0.95", "Penalty Avoided|$81,000"]} green="36,78 76,72 116,50 156,40 196,38 236,38 276,38 316,38 356,38" gray="36,88 76,86 116,88 156,90 196,88 236,89 276,91 316,86 356,84" link="View PF Analysis →" />;
}

function BaselineThdChart() {
  return <MiniBaselineLine footer={["THD Reduction|-12.1%", "Max Reduction|-78.4%", "Power Quality|Excellent"]} green="36,72 76,80 116,84 156,84 196,86 236,86 276,86 316,90 356,92" gray="36,34 76,42 116,48 156,50 196,54 236,62 276,66 316,70 356,62" link="View Power Quality Analysis →" />;
}

function MiniBaselineBars({ footer, line, title }: { footer: string[]; line: string; title: string }) {
  return <div className="h-full text-[8px]"><svg className="h-[110px] w-full" viewBox="0 0 420 118"><g stroke="rgba(148,163,184,.16)">{[20,45,70,95].map((y) => <line key={y} x1="28" x2="410" y1={y} y2={y} />)}</g>{Array.from({ length: 12 }).map((_, i) => { const x = 42 + i * 30; return <g key={i}><rect fill="#d1d5db" height={58 - (i % 4) * 2} width="10" x={x} y={100 - (58 - (i % 4) * 2)} /><rect fill="#65a30d" height={42 - (i % 3) * 2} width="10" x={x + 12} y={100 - (42 - (i % 3) * 2)} /></g>; })}<polyline fill="none" points={line} stroke="#a855f7" strokeDasharray="4 3" strokeWidth="2" /></svg><div className="grid grid-cols-3 text-center">{footer.map((item) => { const [a,b]=item.split("|"); return <span key={item}>{a}<br /><b>{b}</b></span>; })}</div><div className="mt-1 text-right text-[#05ff5e]">{title}</div></div>;
}

function MiniBaselineLine({ footer, gray, green, link }: { footer: string[]; gray: string; green: string; link: string }) {
  return <div className="h-full text-[8px]"><svg className="h-[110px] w-full" viewBox="0 0 400 118"><g stroke="rgba(148,163,184,.16)">{[20,45,70,95].map((y) => <line key={y} x1="28" x2="390" y1={y} y2={y} />)}</g><polyline fill="none" points={gray} stroke="#6b7280" strokeDasharray="4 4" strokeWidth="2" /><polyline fill="none" points={green} stroke="#9cff4d" strokeWidth="2" /></svg><div className="grid grid-cols-3 text-center">{footer.map((item) => { const [a,b]=item.split("|"); return <span key={item}>{a}<br /><b>{b}</b></span>; })}</div><div className="mt-1 text-right text-[#05ff5e]">{link}</div></div>;
}

function BaselineSystemTable() {
  const rows = [["HVAC Systems","2,186,542","1,845","-456,302","+20.9%"],["Motor Systems","1,451,298","1,102","-268,414","+18.5%"],["Lighting Systems","585,441","312","-112,773","+19.3%"],["Process Equipment","712,663","538","-124,908","+17.5%"],["Other Systems","350,180","231","-37,573","+10.7%"],["TOTAL","5,286,124","4,028","-999,970","-18.9%"]];
  return <div className="text-[7.2px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["System","Energy (kWh)","Demand (kW)","Savings (kWh)","% Savings"].map((h)=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r)=><tr className="border-t border-white/5" key={r[0]}>{r.map((c,i)=><td className={i===4?"py-1 text-[#05ff5e]":"py-1"} key={`${r[0]}-${c}`}>{c}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">View System Comparison Details →</div></div>;
}

function BaselineSavingsImpact() {
  const rows = [["Energy Savings","999,970 kWh","$142,000","#65a30d"],["Demand Savings","540 kW","$98,100","#ff8a00"],["PF & Penalty Savings","+0.30 PF","$81,000","#a855f7"],["Capacity Value","1.82 MVA","$168,220","#00bcd4"]];
  return <div className="grid h-full grid-cols-4 gap-1.5 text-center text-[7.2px]">{rows.map(([label,value,cost,color]) => <div key={label}><div className="mx-auto mb-1 grid size-8 place-items-center rounded-full border" style={{ borderColor: color, color }}>⚡</div><div>{label}</div><b>{value}</b><br /><span>{cost}</span></div>)}<div className="col-span-4 mt-auto grid grid-cols-2 text-[10px] text-[#05ff5e]"><b>Total Annual Benefit</b><b>20.9% Total Reduction</b></div><div className="col-span-4 text-left text-[8px] text-[#05ff5e]">View Savings Impact Details →</div></div>;
}

function BaselineInformation() {
  const rows = [["Baseline Period","May 12, 2023 - May 11, 2024"],["Baseline Status","● Verified"],["Baseline Method","ANSI C12.20 Class 0.5"],["Baseline Weather Normalized","● Yes"],["Baseline Locked On","May 12, 2024"]];
  return <div className="space-y-2 text-[8px]">{rows.map(([a,b]) => <div className="flex justify-between border-b border-white/5 pb-1" key={a}><span className="text-slate-400">{a}</span><b className={b.includes("●") ? "text-[#05ff5e]" : ""}>{b}</b></div>)}<div className="pt-2 text-[#05ff5e]">View Baseline Details →</div></div>;
}

function AlertStatusKpi({ detail, icon, label, tone, trend, value }: { detail: string; icon: string; label: string; tone: "red" | "orange" | "blue" | "purple" | "cyan" | "green"; trend: string; value: string }) {
  const color = tone === "red" ? "#ef4444" : tone === "orange" ? "#ff8a00" : tone === "blue" ? "#147dff" : tone === "purple" ? "#a855f7" : tone === "cyan" ? "#00bcd4" : "#65a30d";
  return <article className="grid grid-cols-[54px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-11 place-items-center rounded-full border-2 text-xl" style={{ borderColor: color, color }}>{icon}</div><div><div className="text-[8px] text-slate-400">{label}</div><div className="mt-1 text-2xl leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[9px] text-slate-300">{detail}</div><div className="mt-1 text-[7px]" style={{ color }}>{trend}</div></div></article>;
}

function AlertsSeverityDonut() {
  const rows = [["Critical", "6 (13.6%)", "#ef4444"], ["Warning", "14 (31.8%)", "#ff8a00"], ["Info", "24 (54.6%)", "#147dff"]];
  return <div className="grid h-full grid-cols-[150px_1fr] items-center gap-4 text-[9px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="32" stroke="#147dff" strokeDasharray="110 201" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#ff8a00" strokeDasharray="64 201" strokeDashoffset="-112" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="32" stroke="#ef4444" strokeDasharray="27 201" strokeDashoffset="-178" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="23" /></svg><div className="absolute left-0 top-[46px] w-[132px] text-center"><b className="text-2xl">44</b><br />Total Alerts</div></div><div className="space-y-4">{rows.map(([label,value,color]) => <div className="grid grid-cols-[16px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3 rounded-full" style={{ background: color }} /><span>{label}</span><span>{value}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Severity Report →</div></div></div>;
}

function AlertsTrendChart() {
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-red-400">● Critical</span><span className="text-orange-400">● Warning</span><span className="text-[#147dff]">● Info</span></div><svg className="h-[110px] w-full" viewBox="0 0 440 120"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90,114].map((y) => <line key={y} x1="30" x2="430" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="22">50</text><text x="0" y="46">40</text><text x="0" y="70">30</text><text x="0" y="94">20</text><text x="5" y="116">0</text></g>{[["#ef4444","44,94 96,92 148,91 200,89 252,91 304,92 356,90 408,89"],["#ff8a00","44,78 96,72 148,71 200,66 252,72 304,66 356,65 408,64"],["#147dff","44,48 96,40 148,39 200,28 252,36 304,27 356,24 408,22"]].map(([color,points]) => <polyline fill="none" key={color} points={points} stroke={color} strokeWidth="2" />)}</svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{["May 12","May 13","May 14","May 15","May 16","May 17","May 18"].map((d) => <span key={d}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Trend Analysis →</div></div>;
}

function AlertStatusStacked() {
  const days = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-5"><span className="text-red-400">■ Active</span><span className="text-orange-400">■ Acknowledged</span><span className="text-[#65a30d]">■ Resolved</span></div><svg className="h-[112px] w-full" viewBox="0 0 460 120"><g stroke="rgba(148,163,184,.16)">{[20,44,68,92,116].map((y) => <line key={y} x1="34" x2="450" y1={y} y2={y} />)}</g>{days.map((d, i) => { const x = 54 + i * 58; return <g key={d}><rect fill="#65a30d" height={26 + i} width="24" x={x} y={92 - i} /><rect fill="#ff8a00" height={18 + i} width="24" x={x} y={74 - i * 2} /><rect fill="#ef4444" height={18 + i} width="24" x={x} y={56 - i * 3} /></g>; })}</svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{days.map((d) => <span key={d}>{d}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Status History →</div></div>;
}

function ActiveAlertsReferenceTable() {
  const rows = [["Critical","Transformer TX-01 Overload","Main Campus","Transformers","May 18, 9:42 AM","32 min","Active"],["Critical","PF Below Target (0.90)","Building 2","Power Quality","May 18, 8:15 AM","1h 59m","Active"],["Warning","High Harmonics Detected","Production Line 1","Power Quality","May 18, 7:05 AM","3h 09m","Active"],["Warning","Gateway Offline","GW-03","Communication","May 18, 6:21 AM","3h 53m","Active"],["Info","Firmware Update Available","Meter MTR-07","Maintenance","May 18, 5:10 AM","5h 04m","Active"],["Info","Data Latency Warning","Gateway GW-02","Communication","May 18, 4:55 AM","5h 19m","Active"]];
  return <div className="h-full text-[7.5px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Severity","Alert Name","Device / Location","Category","Triggered","Duration","Status","Actions"].map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[1]}>{row.map((cell, i) => <td className={i === 0 ? row[0] === "Critical" ? "py-1 text-red-400" : row[0] === "Warning" ? "py-1 text-orange-400" : "py-1 text-[#147dff]" : i === 6 ? "py-1 text-red-400" : "py-1"} key={`${row[1]}-${cell}`}>{cell}</td>)}<td className="py-1 text-slate-400">◎ ✓ ⚙</td></tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">View All Active Alerts →</div></div>;
}

function AlertPriorityMatrix() {
  const data = [[0,1,2,2,1],[0,1,2,3,1],[0,2,3,2,1],[0,1,1,0,0],[0,0,1,0,0]];
  return <div className="grid h-full grid-cols-[44px_1fr] gap-2 text-[8px]"><div className="flex flex-col justify-around text-right text-slate-300"><span>5 Critical</span><span>4 High</span><span>3 Medium</span><span>2 Low</span><span>1 Minimal</span></div><div><div className="grid h-[132px] grid-cols-5 grid-rows-5 overflow-hidden rounded border border-white/10">{data.flatMap((row, r) => row.map((v, c) => <div className="grid place-items-center border border-white/10 text-[12px]" key={`${r}-${c}`} style={{ background: v >= 3 ? "#b91c1c" : v === 2 ? "#b45309" : v === 1 ? "#365314" : "#064e3b" }}>{v}</div>))}</div><div className="mt-1 grid grid-cols-5 text-center text-[7px] text-slate-300"><span>Rare</span><span>Unlikely</span><span>Possible</span><span>Likely</span><span>Almost Certain</span></div><div className="mt-1 text-center text-[8px]">LIKELIHOOD</div><div className="mt-2 text-[#05ff5e]">View Risk Analysis →</div></div></div>;
}

function AlertResponsePerformance() {
  return <div className="grid h-full grid-rows-[42px_1fr] text-[8px]"><div className="grid grid-cols-4 text-center"><span>Total Alerts<br /><b>62</b></span><span>Avg Response Time<br /><b>8.3 min</b></span><span>SLA Target<br /><b>15 min</b></span><span>Within SLA<br /><b>98.6%</b></span></div><div><svg className="h-[84px] w-full" viewBox="0 0 330 90"><g stroke="rgba(148,163,184,.16)">{[20,42,64,84].map((y) => <line key={y} x1="28" x2="320" y1={y} y2={y} />)}</g>{[32,76,120,164,208,252,296].map((x, i) => <rect fill="#65a30d" height={28 + (i % 2) * 4} key={x} width="18" x={x} y={58 - (i % 2) * 4} />)}<line stroke="#d8ff00" strokeDasharray="4 4" x1="28" x2="320" y1="48" y2="48" /></svg><div className="text-[#05ff5e]">View Performance Report →</div></div></div>;
}

function AlertCategoriesBars() {
  const rows = [["Power Quality","12 (27.3%)","#dc2626"],["Equipment","11 (25.0%)","#ff8a00"],["Communication","9 (20.5%)","#147dff"],["Capacity","6 (13.6%)","#65a30d"],["Maintenance","6 (13.6%)","#a855f7"]];
  return <div className="space-y-2 text-[8px]">{rows.map(([label,value,color]) => <div className="grid grid-cols-[82px_1fr_66px] items-center gap-2" key={label}><span>{label}</span><span className="h-3 rounded-sm" style={{ width: value.startsWith("12") ? "100%" : value.startsWith("11") ? "88%" : value.startsWith("9") ? "70%" : "52%", background: color }} /><span>{value}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Category Report →</div></div>;
}

function AlertNotificationsList() {
  return <div className="space-y-3 text-[8px]">{[["✉","Email Notifications","48"],["☏","SMS Notifications","14"],["♧","Push Notifications","26"],["ⓘ","In-App Notifications","62"]].map(([icon,label,value]) => <div className="grid grid-cols-[22px_1fr_auto] border-b border-white/5 pb-2" key={label}><span>{icon}</span><span>{label}</span><b>{value}</b></div>)}<div className="pt-1 text-[#05ff5e]">View Notification Log →</div></div>;
}

function AlertQuickActions() {
  return <div className="space-y-2 text-[8px]">{["Acknowledge All Alerts","Manage Alert Rules","Alert Escalation Setup","Notification Preferences","Maintenance Mode"].map((label) => <div className="border-b border-white/5 pb-2" key={label}>◎ &nbsp; {label}</div>)}<div className="pt-1 text-[#05ff5e]">View All Actions →</div></div>;
}

function SavingsKpi({ detail, label, tone, value }: { detail: string; label: string; tone: string; value: string }) {
  const color = tone === "green" ? "text-[#05ff5e]" : tone === "blue" ? "text-[#147dff]" : tone === "purple" ? "text-purple-400" : tone === "yellow" ? "text-yellow-300" : "text-cyan-300";
  return <article className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="text-[7.5px] uppercase leading-[0.95] text-slate-400">{label}</div><div className={`mt-2 whitespace-nowrap text-[22px] leading-none ${color}`}>{value}</div><div className="mt-1 truncate text-[8px] leading-none text-slate-500">{detail}</div><div className="mt-1 text-[7.5px] text-[#05ff5e]">▲ 168.3% vs Baseline Cost</div></article>;
}

function CompactTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[7.8px]"><thead className="text-slate-500"><tr>{headers.map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}>{row.map((cell, index) => <td className={index === row.length - 1 ? "py-[4px] text-[#05ff5e]" : "py-[4px] text-slate-300"} key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function LineChart() {
  return <div className="relative h-full text-[8px]"><div className="absolute right-2 top-0 flex gap-1 text-[8px]"><span className="rounded border border-cyan-300/10 bg-[#061421] px-2 py-1">This Year</span><span className="rounded bg-[#0b3158] px-2 py-1 text-white">Last 12 Months</span><span className="rounded border border-cyan-300/10 bg-[#061421] px-2 py-1">Lifetime</span></div><div className="absolute inset-x-10 bottom-7 top-8 rounded bg-gradient-to-t from-[#123b18] to-transparent" /><svg className="absolute inset-0 size-full" viewBox="0 0 680 170" preserveAspectRatio="none"><g stroke="rgba(148,163,184,.16)">{[26,54,82,110,138].map((y) => <line key={y} x1="34" x2="664" y1={y} y2={y} />)}</g><polyline fill="none" points="34,142 88,134 142,126 196,118 250,108 304,98 358,88 412,76 466,64 520,50 574,34 650,18" stroke="#05ff5e" strokeWidth="3" /></svg><div className="absolute bottom-2 left-12 right-7 flex justify-between text-[7.5px] text-slate-400">{["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25","May '25"].map((m) => <span key={m}>{m}</span>)}</div><div className="absolute bottom-7 right-3 text-[12px] text-[#05ff5e]">Total Savings Since Activation &nbsp; <b>$1,862,744</b></div></div>;
}

function Waterfall() {
  return <div className="flex h-full items-end gap-6 px-5 pb-5 text-center text-[8px]">{[["Baseline", 122, "bg-slate-400"], ["Demand", 78, "bg-[#05ff5e]"], ["Energy", 58, "bg-[#05ff5e]"], ["PF", 44, "bg-[#05ff5e]"], ["Current", 92, "bg-[#147dff]"]].map(([label, height, color]) => <div className="flex flex-1 flex-col items-center" key={label}><div className={`${color} w-full rounded-t`} style={{ height: Number(height) }} /><span className="mt-2 text-slate-400">{label}</span></div>)}</div>;
}

function Gauge({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col items-center justify-center"><div className="grid size-24 place-items-center rounded-full border-[12px] border-[#05ff5e] border-b-orange-500 border-l-red-500 bg-[#061421]"><span className="text-2xl text-slate-100">{value}</span></div><div className="mt-3 text-[8.5px] uppercase text-slate-400">{label}</div></div>;
}

function MiniGauges() {
  return <div className="grid h-full grid-cols-4 gap-3 text-center text-[8px]">{[["Productive", "81%"], ["Harmonic", "8.7%"], ["Reactive", "12.4%"], ["Imbalance", "3.6%"]].map(([label, value]) => <div className="flex flex-col items-center justify-center" key={label}><div className="grid size-[58px] place-items-center rounded-full border-[6px] border-[#05ff5e] border-b-orange-500 bg-[#061421] text-base">{value}</div><span className="mt-1 text-slate-400">{label}</span><span className="text-[7px] text-[#05ff5e]">▲ 5.5%</span></div>)}</div>;
}

function CapacityBlock({ data }: EnergySavingsScreenProps) {
  const rows = [
    ["Installed Capacity", formatKva(data?.installedKva)],
    ["Current Loading", formatKva(data?.loadKva)],
    ["Available Capacity", formatKva(data?.availableKva)],
    ["Recovered Capacity", formatKva(data?.recoveredKva)],
    ["Deferred Capital Value", formatCurrencyValue(data?.deferredCapitalValue)],
  ];

  return <div className="grid h-full grid-cols-[96px_1fr] gap-4 text-[8px]"><div className="grid size-24 place-items-center rounded-full border-[14px] border-[#05ff5e] border-r-slate-700 bg-[#061421] text-2xl">{formatPctValue(data?.utilizationPct)}</div><div className="space-y-1.5">{rows.map(([l, v]) => <div className="flex justify-between" key={l}><span className="text-slate-400">{l}</span><b className="text-[#05ff5e]">{v}</b></div>)}<div className="pt-1 text-[#05ff5e]">View Capacity Details →</div></div></div>;
}

function UtilityBlock() {
  return <NoDataBlock message="No Data - utility billing/forecast source is not approved." />;
}

function AlertBlock() {
  return <NoDataBlock message="No Data - no approved alert source." />;
}

function SavingsBreakdown({ data }: EnergySavingsScreenProps) {
  const rows = [
    ["Annual Savings", annualBenefitValue(data), "Direct latest value"],
    ["Demand Savings", "No Data", "No approved split"],
    ["Energy Savings", "No Data", "No approved split"],
    ["Capacity Value", formatCurrencyValue(data?.deferredCapitalValue), "Direct latest value"],
  ];

  return <div className="grid h-full grid-cols-4 gap-3 text-[8px]">{rows.map(([l, v, detail]) => <div className="rounded border border-cyan-300/10 bg-[#061421] p-3" key={l}><div className="text-slate-400">{l}</div><b className="text-[#05ff5e]">{v}</b><div className="mt-1 text-[7px] text-slate-500">{detail}</div></div>)}</div>;
}

function OpportunityList() {
  return <NoDataBlock message="No Data - savings opportunity model is not approved." />;
}

function HealthList() {
  return <NoDataBlock message="No Data - system health source is not approved for this screen." />;
}

function AlertCounts() {
  return <NoDataBlock message="No Data - alert count source is not approved." />;
}
