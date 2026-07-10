import type { ReactNode } from "react";
import type { CapacityHealthDiagnosticsData } from "@/lib/capacityHealthDiagnosticsData";
import type { CapacityRecoveryBreakdownData } from "@/lib/capacityRecoveryBreakdownData";
import type { CapacityUtilizationTrendData } from "@/lib/capacityUtilizationTrendData";
import { DashboardFooter, DashboardHeader, DashboardKpiCard, DashboardPanel, type DashboardKpi } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

export type CapacityDrilldownVariant =
  | "asset"
  | "capex"
  | "carbon"
  | "equivalent"
  | "financialImpact"
  | "health"
  | "insight"
  | "networkDetail"
  | "opportunities"
  | "recovery"
  | "simulate"
  | "trend";

type CapacityScreenConfig = {
  breadcrumb: string[];
  kpis: DashboardKpi[];
  subtitle: string;
  title: string;
};

const configs: Record<CapacityDrilldownVariant, CapacityScreenConfig> = {
  recovery: {
    breadcrumb: ["Capacity Intelligence", "Capacity Recovery Impact", "Recovery Breakdown"],
    subtitle: "Detailed breakdown of capacity recovered through ECBS optimization.",
    title: "Capacity Recovery Impact",
    kpis: [
      { icon: "R", label: "Total Capacity Recovered", value: "425 kVA", detail: "15% of connected capacity", tone: "green" },
      { icon: "!", label: "Before ECBS (Peak)", value: "2,863 kVA", detail: "88% utilized", tone: "yellow" },
      { icon: "✓", label: "After ECBS (Peak)", value: "2,438 kVA", detail: "75% utilized", tone: "green" },
      { icon: "%", label: "Recovery Percentage", value: "14.8%", detail: "Capacity recovered", tone: "blue" },
      { icon: "O", label: "Over-Capacity Eliminated", value: "225 kVA", detail: "Overload removed", tone: "cyan" },
      { icon: "S", label: "Sustained Recovery", value: "98.2%", detail: "Consistency (7 days)", tone: "green" },
    ],
  },
  health: {
    breadcrumb: ["Capacity Intelligence", "Capacity Health Score", "Diagnostics"],
    subtitle: "Comprehensive diagnostics of electrical system capacity health and performance.",
    title: "Capacity Health Diagnostics",
    kpis: [
      { icon: "H", label: "Overall Health Score", value: "92", detail: "Excellent", tone: "green" },
      { icon: "B", label: "Load Balance", value: "96/100", detail: "+4 vs last 7 days", tone: "green" },
      { icon: "U", label: "Utilization Efficiency", value: "90/100", detail: "+3 vs last 7 days", tone: "green" },
      { icon: "V", label: "Voltage Stability", value: "94/100", detail: "+2 vs last 7 days", tone: "blue" },
      { icon: "W", label: "Harmonic Impact", value: "88/100", detail: "+5 vs last 7 days", tone: "yellow" },
      { icon: "T", label: "Thermal Headroom", value: "92/100", detail: "+3 vs last 7 days", tone: "green" },
    ],
  },
  trend: {
    breadcrumb: ["Capacity Intelligence", "Capacity Utilization Over Time", "Trend Detail"],
    subtitle: "Detailed view of capacity utilization trends over time.",
    title: "Capacity Trend Detail",
    kpis: [
      { icon: "C", label: "Total Connected Capacity", value: "3,250 kVA", detail: "Nameplate capacity", tone: "blue" },
      { icon: "U", label: "Current Utilized Capacity", value: "2,438 kVA", detail: "75% of connected capacity", tone: "green" },
      { icon: "A", label: "Available Capacity", value: "812 kVA", detail: "25% remaining", tone: "blue" },
      { icon: "P", label: "Peak Utilized Capacity", value: "2,712 kVA", detail: "83% of connected capacity", tone: "green" },
      { icon: "A", label: "Average Utilization", value: "72%", detail: "Last 7 days", tone: "green" },
      { icon: "L", label: "Load Factor", value: "0.76", detail: "Last 7 days", tone: "green" },
    ],
  },
  asset: {
    breadcrumb: ["Capacity Intelligence", "Capacity by Asset", "Asset Detail"],
    subtitle: "Asset Detail Tree",
    title: "Capacity By Asset",
    kpis: [
      { icon: "C", label: "Total Connected Capacity", value: "3,250 kVA", detail: "Connected capacity", tone: "blue" },
      { icon: "U", label: "Total Utilized Capacity", value: "2,438 kVA", detail: "75% of connected", tone: "green" },
      { icon: "A", label: "Total Available Capacity", value: "812 kVA", detail: "25% remaining", tone: "blue" },
      { icon: "R", label: "Total Recovered Capacity", value: "425 kVA", detail: "15% recovered by XECO", tone: "green" },
      { icon: "M", label: "Assets Monitored", value: "23", detail: "All healthy", tone: "green" },
      { icon: "W", label: "Assets Warning", value: "3", detail: "Requires attention", tone: "yellow" },
    ],
  },
  equivalent: {
    breadcrumb: ["Capacity Intelligence", "Equivalent Capacity Gain", "Attribution"],
    subtitle: "Attribution Analysis",
    title: "Equivalent Capacity Gain",
    kpis: [
      { icon: "E", label: "Total Equivalent Capacity Gain", value: "1,425 kVA", detail: "100% of total recovery", tone: "blue" },
      { icon: "M", label: "Motor Systems", value: "400 kVA", detail: "28.1% of total", tone: "green" },
      { icon: "H", label: "HVAC Systems", value: "150 kVA", detail: "10.5% of total", tone: "cyan" },
      { icon: "P", label: "Production Lines", value: "300 kVA", detail: "21.1% of total", tone: "green" },
      { icon: "S", label: "Server / IT Loads", value: "350 kVA", detail: "24.6% of total", tone: "yellow" },
      { icon: "O", label: "Other Loads", value: "225 kVA", detail: "15.8% of total", tone: "yellow" },
    ],
  },
  financialImpact: {
    breadcrumb: ["Capacity Intelligence", "Annual Benefit", "Financial Impact"],
    subtitle: "Financial Impact",
    title: "Annual Benefit",
    kpis: [
      { icon: "$", label: "Total Annual Benefit", value: "$184,200", detail: "Total Estimated Annual Savings", tone: "green" },
      { icon: "B", label: "Capacity Value Benefit", value: "$112,600", detail: "61.1% of Total Benefit", tone: "blue" },
      { icon: "D", label: "Demand Charge Savings", value: "$45,800", detail: "24.8% of Total Benefit", tone: "cyan" },
      { icon: "E", label: "Energy Efficiency Savings", value: "$16,300", detail: "8.9% of Total Benefit", tone: "yellow" },
      { icon: "O", label: "Operational Cost Avoidance", value: "$9,500", detail: "5.2% of Total Benefit", tone: "cyan" },
    ],
  },
  capex: {
    breadcrumb: ["Capacity Intelligence", "Upgrade Deferral Value", "CAPEX Deferral"],
    subtitle: "CAPEX Deferral Analysis",
    title: "Upgrade Deferral Value",
    kpis: [
      { icon: "$", label: "Total Upgrade Deferral Value", value: "$1,240,000", detail: "Estimated CAPEX deferred", tone: "green" },
      { icon: "I", label: "Immediate Deferral", value: "$320,000", detail: "0 - 12 months", tone: "blue" },
      { icon: "S", label: "Short Term Deferral", value: "$620,000", detail: "1 - 3 years", tone: "cyan" },
      { icon: "L", label: "Long Term Deferral", value: "$300,000", detail: "3 - 5 years", tone: "yellow" },
      { icon: "R", label: "Average ROI On Deferral", value: "3.8x", detail: "Capital efficiency", tone: "green" },
      { icon: "P", label: "Payback Period Avoided", value: "2.1 years", detail: "Average", tone: "cyan" },
    ],
  },
  insight: {
    breadcrumb: ["Capacity Intelligence", "Key Insight", "Intelligence Summary"],
    subtitle: "Intelligence Summary",
    title: "Key Insight",
    kpis: [
      { icon: "A", label: "Available Capacity", value: "812 kVA", detail: "25% remaining", tone: "green" },
      { icon: "R", label: "Recovered Capacity", value: "425 kVA", detail: "15% recovered by XECO", tone: "blue" },
      { icon: "$", label: "Upgrade Deferral Value", value: "$1.24M", detail: "Estimated CAPEX deferred", tone: "cyan" },
      { icon: "H", label: "Capacity Health Score", value: "92/100", detail: "Excellent", tone: "yellow" },
      { icon: "CO", label: "Carbon Impact", value: "41.2 tons", detail: "CO2e avoided annually", tone: "cyan" },
      { icon: "B", label: "Annual Benefit", value: "$184,200", detail: "Estimated annual savings", tone: "blue" },
    ],
  },
  carbon: {
    breadcrumb: ["Capacity Intelligence", "Carbon Impact", "Emissions Impact"],
    subtitle: "Emissions Impact",
    title: "Carbon Impact",
    kpis: [
      { icon: "C", label: "CO2e Avoided (Annual)", value: "41.2 tons", detail: "Total emissions avoided", tone: "green" },
      { icon: "T", label: "Equivalent Trees Planted", value: "2,137", detail: "Trees (10-year growth)", tone: "blue" },
      { icon: "P", label: "Passenger Cars Off The Road", value: "9.8", detail: "Cars for 1 year", tone: "cyan" },
      { icon: "E", label: "Clean Energy Generated", value: "94,600 kWh", detail: "Equivalent clean energy", tone: "yellow" },
      { icon: "R", label: "Emission Reduction", value: "18.6%", detail: "vs. baseline", tone: "cyan" },
    ],
  },
  simulate: {
    breadcrumb: ["Electrical Network", "Capacity Detail", "Optimization Opportunities", "Simulate Capacity Expansion"],
    subtitle: "Model and simulate capacity expansion scenarios to optimize system performance and defer capital expenses.",
    title: "Simulate Capacity Expansion",
    kpis: [
      { icon: "C", label: "Current Effective Capacity", value: "2.60 MW", detail: "After optimization", tone: "blue" },
      { icon: "+", label: "Additional Capacity Simulated", value: "650 kVA", detail: "Scenario result", tone: "blue" },
      { icon: "N", label: "New Effective Capacity", value: "3.25 MW", detail: "+25.0% increase", tone: "cyan" },
      { icon: "$", label: "Deferred CAPEX", value: "$1,780,000", detail: "Avoided investment", tone: "yellow" },
      { icon: "V", label: "Annual Value Created", value: "$214,800", detail: "Savings + efficiency", tone: "green" },
      { icon: "CO", label: "CO2 Reduction", value: "52.6", detail: "tons / year", tone: "cyan" },
    ],
  },
  opportunities: {
    breadcrumb: ["Electrical Network", "Capacity Detail", "Optimization Opportunities"],
    subtitle: "Actionable opportunities to unlock usable capacity, improve utilization, and defer infrastructure costs.",
    title: "Optimization Opportunities - Capacity",
    kpis: [
      { icon: "O", label: "Total Optimization Potential", value: "420 kVA", detail: "Recoverable capacity", tone: "green" },
      { icon: "A", label: "Immediate Usable Capacity", value: "812 kVA", detail: "Available now", tone: "blue" },
      { icon: "E", label: "Effective Capacity Gain", value: "+18%", detail: "After optimization", tone: "cyan" },
      { icon: "$", label: "Deferred CAPEX Avoidance", value: "$1.24M", detail: "Projected value", tone: "yellow" },
      { icon: "G", label: "Efficiency Gain Potential", value: "+6.2%", detail: "Improvement", tone: "cyan" },
      { icon: "CO", label: "CO2 Reduction Potential", value: "41.2", detail: "tons / year", tone: "green" },
    ],
  },
  networkDetail: {
    breadcrumb: ["Electrical Network", "Capacity Detail"],
    subtitle: "Analyze capacity availability, utilization, and reserve margins across your electrical network.",
    title: "Capacity Detail",
    kpis: [
      { icon: "A", label: "Total Capacity Available", value: "2.18 MW", detail: "27% of system", tone: "blue" },
      { icon: "L", label: "Total Connected Load", value: "5.82 MW", detail: "+4.3% vs last 7 days", tone: "green" },
      { icon: "P", label: "Total Apparent Power", value: "6.41 MVA", detail: "Power factor 0.91", tone: "cyan" },
      { icon: "U", label: "Capacity Utilization", value: "73%", detail: "Good", tone: "yellow" },
      { icon: "R", label: "Reserve Capacity", value: "2.18 MW", detail: "Enough", tone: "cyan" },
      { icon: "X", label: "Projected Peak Utilization", value: "81%", detail: "May 22, 2:00 PM", tone: "yellow" },
    ],
  },
};

export function CapacityDrilldownScreen({ healthData, recoveryData, trendData, variant }: { healthData?: CapacityHealthDiagnosticsData; recoveryData?: CapacityRecoveryBreakdownData; trendData?: CapacityUtilizationTrendData; variant: CapacityDrilldownVariant }) {
  const config = configs[variant];
  const kpis = variant === "recovery" && recoveryData ? recoveryData.kpis : variant === "health" && healthData ? healthData.kpis : variant === "trend" && trendData ? trendData.kpis : config.kpis;

  if (variant === "simulate") return <SimulateCapacityExpansionShell />;
  if (variant === "opportunities") return <OptimizationOpportunitiesShell />;
  if (variant === "networkDetail") return <ElectricalCapacityDetailShell />;
  if (variant === "financialImpact") return <AnnualBenefitFinancialImpactReferenceScreen />;

  const isRecovery = variant === "recovery";
  const isHealth = variant === "health";
  const isTrend = variant === "trend";
  const isAsset = variant === "asset";
  const isCapex = variant === "capex";
  const isWideDrilldown = isRecovery || isHealth || isTrend || isAsset || isCapex;

  return (
    <EcbsAppShell activeHref="/enterprise/capacity-intelligence">
      <div className={isWideDrilldown ? "flex h-screen min-h-0 flex-col overflow-hidden px-4 py-3" : "flex h-full min-h-[682px] flex-col overflow-hidden px-3 py-2"}>
        <DashboardHeader dateRange={isRecovery && recoveryData ? `Tracking DB • ${recoveryData.updatedAt}` : isHealth && healthData ? `Tracking DB • ${healthData.updatedAt}` : isTrend && trendData ? `Tracking DB • ${trendData.updatedAt}` : "May 12 - May 18, 2025"} subtitle={config.subtitle} title={config.title} variant="enterprise" />
        <div className={isWideDrilldown ? "mt-2 flex h-[32px] shrink-0 items-center justify-between text-[10px]" : "mt-1 flex items-center justify-between text-[9px]"}>
          <Breadcrumb items={config.breadcrumb} />
          <div className="flex gap-2">
            <ToolbarButton>Export</ToolbarButton>
            <ToolbarButton>Share</ToolbarButton>
            <ToolbarButton>{isTrend ? "View Report" : "View Full Report"}</ToolbarButton>
          </div>
        </div>

        <section className={variant === "recovery" ? "mt-2 grid h-[96px] shrink-0 grid-cols-6 gap-3" : variant === "health" ? "mt-2 grid h-[120px] shrink-0 grid-cols-[1.45fr_repeat(5,1fr)] gap-3" : variant === "trend" || variant === "asset" || variant === "capex" ? "mt-2 grid h-[86px] shrink-0 grid-cols-6 gap-3" : variant === "carbon" ? "mt-2 grid h-[70px] grid-cols-5 gap-2" : "mt-2 grid h-[70px] grid-cols-6 gap-2"}>
          {kpis.map((kpi, index) => (
            variant === "recovery" ? <RecoveryKpiCard key={kpi.label} kpi={kpi} /> : variant === "capex" ? <CapexKpiCard key={kpi.label} kpi={kpi} /> : variant === "asset" ? <AssetKpiCard key={kpi.label} kpi={kpi} /> : variant === "equivalent" ? <EquivalentKpiCard key={kpi.label} kpi={kpi} /> : variant === "insight" ? <InsightKpiCard key={kpi.label} kpi={kpi} /> : variant === "carbon" ? <CarbonKpiCard key={kpi.label} kpi={kpi} /> : variant === "health" ? <HealthKpiCard healthData={healthData} index={index} key={kpi.label} kpi={kpi} /> : variant === "trend" ? <TrendKpiCard key={kpi.label} kpi={kpi} /> : <DashboardKpiCard key={kpi.label} kpi={kpi} variant="enterprise" />
          ))}
        </section>

        {variant === "recovery" && recoveryData ? <RecoveryBreakdown data={recoveryData} /> : null}
        {variant === "health" && healthData ? <HealthDiagnostics data={healthData} /> : null}
        {variant === "trend" && trendData ? <TrendDetail data={trendData} /> : null}
        {variant === "asset" ? <AssetDetailTree /> : null}
        {variant === "equivalent" ? <EquivalentAttribution /> : null}
        {variant === "capex" ? <CapexDeferral /> : null}
        {variant === "insight" ? <IntelligenceSummary /> : null}
        {variant === "carbon" ? <CarbonImpact /> : null}

        {isRecovery ? <RecoveryFooter data={recoveryData} /> : isHealth ? <HealthFooter data={healthData} /> : isTrend ? <TrendFooter data={trendData} /> : isCapex ? <CapexFooter /> : isAsset ? <TrendFooter /> : <DashboardFooter updatedAt="May 18, 2025 10:15 AM" variant="enterprise" />}
      </div>
    </EcbsAppShell>
  );
}

function AnnualBenefitFinancialImpactReferenceScreen() {
  return (
    <EcbsAppShell activeHref="/enterprise/capacity-intelligence">
      <div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-3 py-2">
        <header className="flex h-[44px] items-center justify-between border-b border-cyan-300/10">
          <div><h1 className="text-xl font-semibold leading-none">ANNUAL BENEFIT</h1><p className="mt-1 text-[10px] text-slate-300">Financial Impact</p></div>
          <div className="flex items-center gap-3 text-[9px]"><button className="w-[132px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">Flex Tijuana⌄</button><button className="w-[170px] rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-left">▣ &nbsp; May 12 - May 18, 2025⌄</button><span className="text-[#05ff5e]">●</span><span>?</span><span>⚙</span><span className="grid size-7 place-items-center rounded-full bg-slate-700">GD</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span>⌄</span></div>
        </header>
        <div className="flex h-[38px] items-center justify-between text-[9px]"><Breadcrumb items={["Capacity Intelligence", "Annual Benefit", "Financial Impact"]} /><div className="flex gap-3"><ToolbarButton>⇩ Export</ToolbarButton><ToolbarButton>Share</ToolbarButton><ToolbarButton>⇩ View Full Report⌄</ToolbarButton></div></div>
        <section className="grid h-[88px] grid-cols-5 gap-2">
          <FinancialBenefitKpi icon="$" label="TOTAL ANNUAL BENEFIT" value="$184,200" detail="Total Estimated Annual Savings" tone="green" />
          <FinancialBenefitKpi icon="▥" label="CAPACITY VALUE BENEFIT" value="$112,600" detail="61.1% of Total Benefit" tone="blue" />
          <FinancialBenefitKpi icon="↯" label="DEMAND CHARGE SAVINGS" value="$45,800" detail="24.8% of Total Benefit" tone="purple" />
          <FinancialBenefitKpi icon="⚙" label="ENERGY EFFICIENCY SAVINGS" value="$16,300" detail="8.9% of Total Benefit" tone="orange" />
          <FinancialBenefitKpi icon="▣" label="OPERATIONAL COST AVOIDANCE" value="$9,500" detail="5.2% of Total Benefit" tone="cyan" />
        </section>
        <section className="mt-2 grid h-[198px] grid-cols-[1.62fr_1.08fr] gap-2">
          <DashboardPanel title="ANNUAL BENEFIT OVER TIME" variant="enterprise"><FinancialAnnualBenefitTrend /></DashboardPanel>
          <DashboardPanel title="BENEFIT BREAKDOWN" variant="enterprise"><FinancialBenefitBreakdown /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[228px] grid-cols-[1.28fr_0.82fr_0.72fr] gap-2">
          <DashboardPanel title="BENEFIT BY CATEGORY OVER TIME" variant="enterprise"><FinancialCategoryStackedBars /></DashboardPanel>
          <DashboardPanel title="SAVINGS BY DRIVER" variant="enterprise"><FinancialSavingsDriverTable /></DashboardPanel>
          <div className="grid min-h-0 grid-rows-[92px_1fr] gap-2">
            <DashboardPanel title="FINANCIAL IMPACT SUMMARY" variant="enterprise"><FinancialImpactSummary /></DashboardPanel>
            <DashboardPanel title="BENEFIT COMPARISON" variant="enterprise"><FinancialBenefitComparison /></DashboardPanel>
          </div>
        </section>
        <section className="mt-2 grid h-[188px] grid-cols-[1.38fr_0.9fr] gap-2">
          <DashboardPanel title="DEMAND CHARGE REDUCTION IMPACT" variant="enterprise"><FinancialDemandReductionImpact /></DashboardPanel>
          <DashboardPanel title="PROJECTED BENEFITS (NEXT 3 YEARS)" variant="enterprise"><FinancialProjectedBenefits /></DashboardPanel>
        </section>
        <div className="mt-2 flex h-[28px] items-center rounded border border-cyan-300/10 bg-[#061421] px-3 text-[9px] text-slate-300"><span className="mr-2 grid size-5 place-items-center rounded-full bg-slate-500 text-[#020a12]">i</span>Annual benefits are calculated based on recovered capacity, reduced demand charges, improved efficiency, and operational cost avoidance.</div>
        <footer className="absolute bottom-2 left-3 right-3 flex h-[26px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span className="text-[#05ff5e]">Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</span><span><b className="text-[#05ff5e]">●</b> All Systems Operational</span></footer>
      </div>
    </EcbsAppShell>
  );
}

function FinancialBenefitKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: "green" | "blue" | "purple" | "orange" | "cyan"; value: string }) {
  const color = tone === "green" ? "#05ff5e" : tone === "blue" ? "#147dff" : tone === "purple" ? "#a855f7" : tone === "orange" ? "#ff8a00" : "#23e9ff";
  return <article className="grid grid-cols-[54px_1fr] items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="grid size-11 place-items-center rounded-full text-xl text-white" style={{ background: color }}>{icon}</div><div><div className="text-[8px] text-slate-400">{label}</div><div className="mt-1 text-2xl leading-none text-slate-100">{value}</div><div className="mt-1 text-[9px] text-slate-400">{detail}</div></div></article>;
}

function FinancialAnnualBenefitTrend() {
  const points = "34,144 84,132 134,119 184,105 234,94 284,82 334,70 384,58 434,48 484,38 534,26";
  return <div className="relative h-full text-[8px]"><div className="absolute right-0 top-0 flex gap-1">{["6 Months","12 Months","24 Months","YTD","All"].map((label, index) => <span className={index === 1 ? "rounded bg-[#147dff] px-3 py-1 text-white" : "rounded border border-cyan-300/10 px-3 py-1 text-slate-400"} key={label}>{label}</span>)}</div><svg className="mt-5 h-[128px] w-full" viewBox="0 0 620 150"><g stroke="rgba(148,163,184,.16)">{[20,50,80,110,140].map((y) => <line key={y} x1="32" x2="590" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">$200K</text><text x="0" y="54">$150K</text><text x="0" y="84">$100K</text><text x="0" y="114">$50K</text><text x="0" y="144">$0</text></g><polygon fill="rgba(5,255,94,.14)" points={`${points} 534,142 34,142`} /><polyline fill="none" points={points} stroke="#9cff4d" strokeWidth="2" />{parseFinancialPoints(points).map(([x,y], index) => <g key={x}><circle cx={x} cy={y} fill="#d8ff7a" r="3" /><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x} y={y - 9}>{["$15K","$29K","$44K","$59K","$73K","$88K","$103K","$118K","$133K","$148K","$184K"][index]}</text></g>)}<text fill="#05ff5e" fontSize="14" x="548" y="72">Total Annual</text><text fill="#05ff5e" fontSize="14" x="548" y="90">Benefit</text><text fill="#05ff5e" fontSize="22" x="548" y="116">$184,200</text></svg><div className="flex justify-between px-8 text-[8px] text-slate-400">{["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25"].map((m) => <span key={m}>{m}</span>)}</div></div>;
}

function FinancialBenefitBreakdown() {
  const rows = [["Capacity Value Benefit", "$112,600 (61.1%)", "#0da64a"],["Demand Charge Savings", "$45,800 (24.8%)", "#147dff"],["Energy Efficiency Savings", "$16,300 (8.9%)", "#a855f7"],["Operational Cost Avoidance", "$9,500 (5.2%)", "#ff8a00"]];
  return <div className="grid h-full grid-cols-[220px_1fr] items-center gap-4 text-[9px]"><div className="relative"><svg className="size-[160px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="33" stroke="#0da64a" strokeDasharray="128 207" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="33" stroke="#147dff" strokeDasharray="52 207" strokeDashoffset="-130" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="33" stroke="#a855f7" strokeDasharray="19 207" strokeDashoffset="-184" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="none" r="33" stroke="#ff8a00" strokeDasharray="11 207" strokeDashoffset="-204" strokeWidth="18" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" fill="#061521" r="24" /></svg><div className="absolute left-0 top-[58px] w-[160px] text-center"><b className="text-xl">$184,200</b><br />Total</div></div><div className="space-y-2">{rows.map(([label,value,color]) => <div className="grid grid-cols-[14px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3 rounded-sm" style={{ background: color }} /><span>{label}</span><span>{value}</span></div>)}<div className="pt-4 text-[#05ff5e]">View Breakdown Details →</div></div></div>;
}

function FinancialCategoryStackedBars() {
  const months = ["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Mar '25","Apr '25"];
  return <div className="h-full text-[8px]"><div className="mb-1 flex gap-4 text-[7px]"><span className="text-[#0da64a]">■ Capacity Value Benefit</span><span className="text-[#147dff]">■ Demand Charge Savings</span><span className="text-[#a855f7]">■ Energy Efficiency Savings</span><span className="text-[#ff8a00]">■ Operational Cost Avoidance</span></div><svg className="h-[145px] w-full" viewBox="0 0 560 150"><g stroke="rgba(148,163,184,.16)">{[20,50,80,110,140].map((y) => <line key={y} x1="34" x2="550" y1={y} y2={y} />)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="24">$200K</text><text x="0" y="54">$150K</text><text x="0" y="84">$100K</text><text x="0" y="114">$50K</text></g>{months.map((month, i) => { const x = 48 + i * 45; const total = 24 + i * 9; return <g key={month}><rect fill="#0da64a" height={total * .52} width="18" x={x} y={140 - total * .52} /><rect fill="#147dff" height={total * .25} width="18" x={x} y={140 - total * .77} /><rect fill="#a855f7" height={total * .14} width="18" x={x} y={140 - total * .91} /><rect fill="#ff8a00" height={total * .09} width="18" x={x} y={140 - total} /><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x + 9} y={134 - total}>{["$15K","$29K","$44K","$59K","$73K","$88K","$103K","$118K","$133K","$164K","$184K"][i]}</text></g>; })}</svg><div className="flex justify-between px-9 text-[7px] text-slate-400">{months.map((month) => <span key={month}>{month}</span>)}</div><div className="mt-1 text-[#05ff5e]">View Category Trend Details →</div></div>;
}

function FinancialSavingsDriverTable() {
  const rows = [["Capacity Value (kVA Recovered)","$112,600","61.1%"],["Demand Charge Reduction","$45,800","24.8%"],["Energy Efficiency Improvement","$16,300","8.9%"],["Reduced Equipment Stress","$5,900","3.2%"],["Maintenance Cost Avoidance","$3,600","2.0%"],["TOTAL","$184,200","100%"]];
  return <div className="h-full text-[8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr><th className="pb-2 font-medium">Driver</th><th className="pb-2 text-right font-medium">Annual Savings</th><th className="pb-2 text-right font-medium">% of Total</th><th className="pb-2 text-right font-medium">Trend (12M)</th></tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}><td className="py-1.5">{row[0]}</td><td className="text-right">{row[1]}</td><td className="text-right">{row[2]}</td><td><TinyGreenSpark /></td></tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">View Driver Impact Details →</div></div>;
}

function FinancialImpactSummary() {
  return <div className="space-y-0.5 text-[6.8px] leading-tight">{[["Annual Benefit","$184,200"],["Total CAPEX Deferred","$1,240,000"],["Average Annual ROI","14.9x"],["Payback Period","2.1 years"],["Net Present Value (5 Years)","$746,300"]].map(([label,value]) => <div className="flex justify-between border-b border-white/5 pb-[1px]" key={label}><span className="text-slate-400">{label}</span><b className={label === "Annual Benefit" ? "text-[#05ff5e]" : ""}>{value}</b></div>)}<div className="text-[#05ff5e]">View Financial Model →</div></div>;
}

function FinancialBenefitComparison() {
  return <div className="space-y-0.5 text-[6.8px] leading-tight"><div className="grid grid-cols-[1fr_70px_70px] text-slate-400"><span /> <span className="text-right">Without ECBS</span><span className="text-right">With ECBS</span></div>{[["Annual Operating Cost","$1,248,000","$1,063,800"],["Demand Charges","$642,000","$596,200"],["Energy Cost","$438,000","$421,700"],["Maintenance Cost","$168,000","$142,100"]].map((row) => <div className="grid grid-cols-[1fr_70px_70px] border-b border-white/5 pb-[1px]" key={row[0]}><span>{row[0]}</span><span className="text-right">{row[1]}</span><span className="text-right">{row[2]}</span></div>)}<div className="grid grid-cols-[1fr_70px_70px]"><b>TOTAL ANNUAL COST</b><b className="text-right">$1,248,000</b><b className="text-right">$1,063,800</b></div><div className="flex justify-between text-[#05ff5e]"><span>Annual Savings</span><b className="text-[13px] leading-none">$184,200</b></div><div className="text-[#05ff5e]">View Comparison Details →</div></div>;
}

function FinancialDemandReductionImpact() {
  const months = ["May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25","Apr '25"];
  return <div className="grid h-full grid-cols-[1fr_176px] gap-3 text-[8px]"><div><div className="mb-1 flex gap-4 text-[7px]"><span className="text-[#0da64a]">■ Demand Charges (Without ECBS)</span><span className="text-[#147dff]">■ Demand Charges (With ECBS)</span><span className="text-purple-400">--- Savings</span></div><svg className="h-[118px] w-full" viewBox="0 0 600 120"><g stroke="rgba(148,163,184,.16)">{[20,45,70,95].map((y) => <line key={y} x1="30" x2="590" y1={y} y2={y} />)}</g>{months.map((month, i) => { const x = 44 + i * 45; return <g key={month}><rect fill="#0da64a" height="54" width="14" x={x} y="54" /><rect fill="#147dff" height={30 + i * 2} width="14" x={x + 16} y={108 - (30 + i * 2)} /></g>; })}<polyline fill="none" points="52,92 96,82 142,78 188,71 234,66 280,58 326,52 372,48 418,43 464,39 510,35 556,31" stroke="#a855f7" strokeDasharray="4 3" strokeWidth="2" /></svg><div className="flex justify-between px-8 text-[7px] text-slate-400">{months.map((month) => <span key={month}>{month}</span>)}</div></div><div className="space-y-2"><div>Total Annual Demand<br />Charge Savings<br /><b className="text-2xl text-[#05ff5e]">$45,800</b></div><div>Lowest Month<br /><b>$2,800 (May &apos;24)</b></div><div>Highest Month<br /><b>$4,600 (Apr &apos;25)</b></div></div></div>;
}

function FinancialProjectedBenefits() {
  const groups = [["Year 1 (Current)","$184,200"],["Year 2 (Projected)","$194,600"],["Year 3 (Projected)","$205,900"]];
  return <div className="h-full text-[8px]"><div className="grid h-[124px] grid-cols-3 gap-4">{groups.map(([label,value], groupIndex) => <div key={label}><div className="mb-2 text-slate-400">{label}</div><b>{value}</b><div className="mt-3 flex h-[62px] items-end gap-1">{[28,38,48,56,46,60].map((h, i) => <span className="w-3 bg-[#05ff5e]" key={`${groupIndex}-${i}`} style={{ height: h + groupIndex * 4 }} />)}</div></div>)}</div><div className="text-[7px] text-slate-400">Assumes consistent operations and ECBS optimization.</div><div className="mt-1 text-[#05ff5e]">View Projection Details →</div></div>;
}

function TinyGreenSpark() {
  return <svg className="ml-auto h-5 w-12" viewBox="0 0 50 20"><polyline fill="none" points="0,12 6,6 12,13 18,5 25,11 32,4 39,12 46,7" stroke="#65a30d" strokeWidth="1.5" /></svg>;
}

function parseFinancialPoints(points: string) {
  return points.split(" ").map((point) => point.split(",").map(Number) as [number, number]);
}

function RecoveryBreakdown({ data }: { data: CapacityRecoveryBreakdownData }) {
  const chartMax = Math.max(
    ...data.trend.flatMap((point) => [point.baselineUsed, point.used, point.recovered]),
    1,
  );
  const contributionRows = data.contributionRows.map((row) => [row.label, row.value, row.percent, row.color] as [string, string, string, string]);
  const assetTypeRows = data.recoveryByAssetType.map((row) => [row.label, row.value, row.color] as [string, string, string]);
  const timeRows = data.timePeriodRows.map((row) => [row.timePeriod, row.avgKva, row.maxKva, row.consistency]);
  const summaryRows = data.summaryRows.map((row) => [row.label, row.value] as [string, string]);

  return (
    <>
      <section className="mt-3 grid h-[250px] shrink-0 grid-cols-[1.65fr_0.82fr_1.05fr] gap-3">
        <DashboardPanel title="Capacity Recovery Over Time (Last 7 Days)" variant="enterprise">
          {data.trend.length ? (
            <LineChart
              legend={["Recovered Capacity (kVA)", "Utilized Capacity After Recovery", "Baseline Utilized Capacity"]}
              maxLabel={`${formatRecoveryNumber(chartMax)} kVA`}
              points={[
                recoveryPoints(data.trend.map((point) => point.recovered), chartMax),
                recoveryPoints(data.trend.map((point) => point.used), chartMax),
                recoveryPoints(data.trend.map((point) => point.baselineUsed), chartMax),
              ]}
              showDots
              wide
            />
          ) : <RecoveryNoData message={data.message} />}
        </DashboardPanel>
        <DashboardPanel title="Before vs After ECBS" variant="enterprise">
          <BeforeAfterBars data={data} />
        </DashboardPanel>
        <DashboardPanel title="Recovery Contribution By System" variant="enterprise">
          {contributionRows.length ? <BarRows rows={contributionRows} /> : <RecoveryNoData message="No asset-type recovery contribution source was found in tracking." />}
        </DashboardPanel>
      </section>
      <section className="mt-3 grid h-[205px] shrink-0 grid-cols-[1fr_0.95fr_1.2fr] gap-3">
        <DashboardPanel title="Recovery By Asset Type" variant="enterprise">
          {assetTypeRows.length ? <DonutWithLegend value={data.kpis[0]?.value.replace(" kVA", "") ?? "No Data"} subtitle="kVA Recovered" rows={assetTypeRows} /> : <RecoveryNoData message="No asset-type recovery rows were found in tracking." />}
        </DashboardPanel>
        <DashboardPanel title="Over-Capacity Elimination" variant="enterprise">
          <div className="grid h-full grid-rows-[78px_1fr] gap-3">
            <div className="grid grid-cols-[1fr_26px_1fr] items-center gap-2">
            <StatusTile label="Over-capacity before ECBS" value={data.beforeOverCapacity} tone="red" />
              <div className="text-center text-[18px] text-slate-300">→</div>
            <StatusTile label="Over-capacity after ECBS" value={data.afterOverCapacity} tone="green" />
            </div>
            <div className="grid grid-cols-[38px_1fr] items-center gap-3 rounded border border-[#05ff5e]/20 bg-[#05ff5e]/5 p-3 text-[11px] leading-tight text-slate-300">
              <span className="grid size-8 place-items-center rounded-full border border-[#84cc16] text-[#84cc16]"><RecoveryIcon kind="check" /></span>
              <span><b className="text-[16px] text-[#84cc16]">{data.recoveryPercent}</b> of over-capacity eliminated<br />Calculated from tracking capacity rollups for Ochsner project 13.</span>
            </div>
          </div>
        </DashboardPanel>
        <DashboardPanel title="Recovery By Time Period" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <SimpleTable headers={["Time Period", "Avg kVA", "Max kVA", "Consistency"]} rows={timeRows} />
          </div>
        </DashboardPanel>
      </section>
      <section className="mt-3 grid h-[170px] shrink-0 grid-cols-[1.2fr_1fr] gap-3">
        <DashboardPanel title="Recovery Events Log (Last 7 Days)" variant="enterprise">
          <RecoveryEventsLog data={data} />
        </DashboardPanel>
        <DashboardPanel title="Recovery Impact Summary" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <MetricGrid rows={summaryRows} />
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function RecoveryFooter({ data }: { data?: CapacityRecoveryBreakdownData }) {
  return (
    <footer className="mt-auto flex h-[31px] shrink-0 items-center justify-between rounded border border-cyan-300/10 bg-[#061421]/80 px-3 text-[9px] text-slate-400">
      <span className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-slate-600 text-[11px] font-semibold text-[#020a12]">i</span>
        Capacity recovery values are calculated using real-time telemetry, ECBS optimization data, and verified asset measurements.
      </span>
      <span className="flex items-center gap-2 text-slate-300">
        <span className="size-2 rounded-full bg-[#05ff5e]" />
        {data?.state === "data" ? "Recovery Data Loaded" : "No Applicable Recovery Data"}
      </span>
    </footer>
  );
}

function RecoveryKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const iconConfig = recoveryIconConfig(kpi.label);

  return (
    <article className="h-[96px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_22px_rgba(0,220,255,0.06)]">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full border-2 bg-[#061421] shadow-[0_0_18px_currentColor]" style={{ borderColor: iconConfig.color, color: iconConfig.color }}>
          <RecoveryIcon kind={iconConfig.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[8px] font-semibold uppercase leading-[1.05] text-slate-300">{kpi.label}</div>
          <div className="mt-1 whitespace-nowrap text-[20px] font-light leading-none text-white">{kpi.value}</div>
          <div className="mt-1 truncate text-[8px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
      <SparkStroke className="mt-2 h-4 w-full" color={iconConfig.color} />
    </article>
  );
}

function recoveryIconConfig(label: string) {
  if (label.includes("Before")) return { color: "#ef4444", kind: "bars" as const };
  if (label.includes("After")) return { color: "#84cc16", kind: "bars" as const };
  if (label.includes("Percentage")) return { color: "#147dff", kind: "percent" as const };
  if (label.includes("Over-Capacity")) return { color: "#a855f7", kind: "shield" as const };
  if (label.includes("Sustained")) return { color: "#06b6d4", kind: "check" as const };
  return { color: "#05ff5e", kind: "arrows" as const };
}

function RecoveryIcon({ kind }: { kind: "arrows" | "bars" | "check" | "percent" | "shield" }) {
  if (kind === "bars") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <rect height="6" rx="1" width="3" x="6" y="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect height="10" rx="1" width="3" x="11" y="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect height="14" rx="1" width="3" x="16" y="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (kind === "percent") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 18 18 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <circle cx="7" cy="7" fill="none" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="17" fill="none" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (kind === "shield") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.5-2.7 8-7 10-4.3-2-7-5.5-7-10V6l7-3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="m8.5 12 2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }
  if (kind === "check") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" fill="none" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m7.8 12.1 2.8 2.8 5.8-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h7.5a3.5 3.5 0 0 1 0 7H10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m9 4-3 3 3 3M17 20l3-3-3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M17 17H9.5a3.5 3.5 0 0 1 0-7H14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SparkStroke({ className = "mt-1 h-3 w-full", color }: { className?: string; color: string }) {
  return <svg className={className} viewBox="0 0 120 14" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" points="0,10 14,8 28,11 42,5 56,7 70,3 84,8 98,4 120,7" stroke={color} strokeWidth="1.5" /></svg>;
}

type CapexIconKind = "cash" | "tower" | "calendar" | "trend" | "grid" | "payback" | "check" | "debt" | "flex";

function CapexKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const iconConfig = capexIconConfig(kpi.label);

  return (
    <article className="h-[86px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 bg-[#062030] shadow-[0_0_18px_currentColor]" style={{ borderColor: iconConfig.color, color: iconConfig.color }}>
          <CapexIcon kind={iconConfig.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[7.5px] font-semibold uppercase leading-[0.95] text-slate-300">{kpi.label}</div>
          <div className="mt-1 whitespace-nowrap text-[19px] font-light leading-none text-white">{kpi.value}</div>
          <div className="mt-1 truncate text-[7.5px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
      <SparkStroke className="mt-1 h-3 w-full" color={iconConfig.color} />
    </article>
  );
}

function capexIconConfig(label: string) {
  if (label.includes("Immediate")) return { color: "#147dff", kind: "tower" as const };
  if (label.includes("Short Term")) return { color: "#a855f7", kind: "calendar" as const };
  if (label.includes("Long Term")) return { color: "#f59e0b", kind: "calendar" as const };
  if (label.includes("ROI")) return { color: "#05ff5e", kind: "grid" as const };
  if (label.includes("Payback")) return { color: "#14b8a6", kind: "payback" as const };
  return { color: "#05ff5e", kind: "cash" as const };
}

function CapexIcon({ kind }: { kind: CapexIconKind }) {
  if (kind === "cash") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <rect fill="none" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" width="16" x="4" y="6" />
        <path d="M7 10.5h1.7M15.3 14H17M12 15.8v-1.2M12 9.4V8.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        <path d="M10.2 13.7c.3.8 1 1.2 1.9 1.2 1 0 1.8-.5 1.8-1.3 0-.9-.8-1.2-2-1.5-.9-.3-1.6-.6-1.6-1.4 0-.8.7-1.4 1.7-1.4.8 0 1.4.3 1.8.9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "tower") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 5 20M12 3l7 17M8 11h8M7 15h10M9.2 7h5.6M10 20l2-17 2 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }
  if (kind === "calendar") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <rect fill="none" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" width="16" x="4" y="5" />
        <path d="M8 3.5V7M16 3.5V7M4 9h16M8 13h2M12 13h2M16 13h1M8 16.5h2M12 16.5h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "trend") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 17 10 12l3 3 6-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M15 7h4v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }
  if (kind === "grid") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <rect fill="none" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="6" x="5" y="5" />
        <rect fill="none" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="6" x="13" y="5" />
        <rect fill="none" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="6" x="5" y="13" />
        <rect fill="none" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" width="6" x="13" y="13" />
      </svg>
    );
  }
  if (kind === "payback") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 10.2-3.8L18 6M18 6h-4M18 6V2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M18 16A6 6 0 0 1 7.8 19.8L6 18M6 18h4M6 18v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }
  if (kind === "debt") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 10h14M7 10v8M11 10v8M15 10v8M19 18H5M4 8l8-4 8 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }
  if (kind === "flex") {
    return (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8h7a3 3 0 0 1 0 6H10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        <path d="m9 5-3 3 3 3M15 19l3-3-3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }
  return <RecoveryIcon kind="check" />;
}

function HealthDiagnostics({ data }: { data: CapacityHealthDiagnosticsData }) {
  return (
    <>
      <section className="mt-3 grid h-[210px] shrink-0 grid-cols-[1.48fr_0.9fr_1.35fr] gap-3">
        <DashboardPanel title={<span className="flex items-center justify-between"><span>Health Score Over Time</span><span className="text-[8px] normal-case text-slate-400">Last 7 Days v</span></span>} variant="enterprise">
          <HealthScoreTrend data={data} />
        </DashboardPanel>
        <DashboardPanel title="Health Score Distribution" variant="enterprise">
          <HealthDistribution data={data} />
        </DashboardPanel>
        <DashboardPanel title="Health Score By Asset Type" variant="enterprise">
          <HealthAssetBars data={data} />
        </DashboardPanel>
      </section>
      <section className="mt-3 grid h-[215px] shrink-0 grid-cols-5 gap-3">
        {data.diagnostics.map((item) => (
          <DashboardPanel key={item.title} title={item.title} variant="enterprise">
            <HealthDiagnosticCard item={item} />
          </DashboardPanel>
        ))}
      </section>
      <section className="mt-3 grid h-[172px] shrink-0 grid-cols-[1.35fr_1.05fr_0.9fr] gap-3">
        <DashboardPanel title="Top Issues & Risks" variant="enterprise">
          <HealthIssuesTable data={data} />
        </DashboardPanel>
        <DashboardPanel title="Recommendations" variant="enterprise">
          <HealthRecommendations data={data} />
        </DashboardPanel>
        <DashboardPanel title="System Summary" variant="enterprise">
          <HealthSystemSummary data={data} />
        </DashboardPanel>
      </section>
    </>
  );
}

function HealthFooter({ data }: { data?: CapacityHealthDiagnosticsData }) {
  return (
    <footer className="mt-auto flex h-[31px] shrink-0 items-center justify-between rounded border border-cyan-300/10 bg-[#061421]/80 px-3 text-[9px] text-slate-400">
      <span className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-slate-600 text-[11px] font-semibold text-[#020a12]">i</span>
        Health scores are calculated using real-time telemetry, asset ratings, and AI-driven diagnostics.
      </span>
      <span className="flex items-center gap-2 text-slate-300">
        <span className="size-2 rounded-full bg-[#05ff5e]" />
        {data?.state === "data" ? "Health Data Loaded" : "No Applicable Health Data"}
      </span>
    </footer>
  );
}

function HealthKpiCard({ healthData, index, kpi }: { healthData?: CapacityHealthDiagnosticsData; index: number; kpi: DashboardKpi }) {
  const row = healthData?.diagnostics[index - 1];
  if (index === 0) {
    const score = parseHealthScore(kpi.value);
    return (
      <article className="grid h-[120px] grid-cols-[88px_1fr] gap-4 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
        <HealthRing score={score} size={78} status={kpi.detail} />
        <div className="min-w-0 text-[9px]">
          <div className="text-[8px] font-semibold uppercase text-slate-300">Overall Capacity Health Score</div>
          <p className="mt-2 leading-tight text-slate-300">Overall capacity health is calculated from tracking capacity rollups and latest meter telemetry.</p>
          <div className="mt-2 text-[8px] text-[#65a30d]">How Score Is Calculated {"->"}</div>
        </div>
      </article>
    );
  }
  const color = row?.tone ?? kpi.color ?? "#65a30d";
  const score = kpi.value.split("/")[0];
  return (
    <article className="h-[120px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="grid grid-cols-[44px_1fr] gap-3">
        <div className="grid size-10 place-items-center rounded-full border bg-[#061421] shadow-[0_0_14px_currentColor]" style={{ borderColor: color, color }}>
          <HealthMiniIcon index={index} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[8px] font-semibold uppercase leading-none text-slate-300">{kpi.label}</div>
          <div className="mt-2 whitespace-nowrap text-[22px] font-light leading-none text-slate-100"><span style={{ color }}>{score}</span><span className="text-[14px] text-slate-300">/100</span></div>
          <div className="mt-1 text-[8px] text-slate-400">{row?.status ?? kpi.detail}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-[8px] font-semibold" style={{ color }}>
        <CapexIcon kind="trend" /> {kpi.detail}
      </div>
    </article>
  );
}

function HealthMiniIcon({ index }: { index: number }) {
  const icons: AssetIconKind[] = ["check", "arrows", "grid", "bolt", "thermo", "leaf"];
  return <AssetIcon kind={icons[index] ?? "check"} />;
}

function parseHealthScore(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
}

function healthStatus(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return score > 0 ? "Poor" : "No Data";
}

function healthTrendPoints(rows: CapacityHealthDiagnosticsData["trend"]) {
  if (!rows.length) return "";
  const maxIndex = Math.max(rows.length - 1, 1);
  return rows.map((row, index) => {
    const x = index * (500 / maxIndex);
    const y = 118 - Math.max(0, Math.min(100, row.score)) * 0.94;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function parseHealthCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function HealthNoData({ message }: { message?: string }) {
  return <div className="grid h-full place-items-center px-4 text-center text-[9px] leading-snug text-slate-400">{message || "No Data"}</div>;
}

function HealthRing({ score, size = 58, status = healthStatus(score) }: { score: number; size?: number; status?: string }) {
  return (
    <div className="grid place-items-center rounded-full p-[7px]" style={{ width: size, height: size, background: `conic-gradient(#65a30d 0 ${score}%, #243447 ${score}% 100%)` }}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center">
        <div><div className="text-[18px] leading-none text-white">{score || "No Data"}</div><div className="text-[7px] text-slate-300">{status}</div></div>
      </div>
    </div>
  );
}

function HealthScoreTrend({ data }: { data: CapacityHealthDiagnosticsData }) {
  const points = healthTrendPoints(data.trend);
  return (
    <div className="h-full overflow-hidden text-[9px]">
      <div className="mb-2 text-slate-400"><i className="mr-1 inline-block h-0.5 w-3 bg-[#05ff5e] align-middle" />Overall Health Score</div>
      <div className="grid grid-cols-[34px_1fr] gap-2">
        <div className="flex h-[158px] flex-col justify-between text-right text-[8px] text-slate-500"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
        {data.trend.length ? (
          <svg className="h-[158px] w-full" viewBox="0 0 500 132" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="healthTrendArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#65a30d" stopOpacity="0.35" /><stop offset="100%" stopColor="#65a30d" stopOpacity="0.03" /></linearGradient></defs>
            {[24, 50, 76, 102].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.16)" />)}
            <polygon fill="url(#healthTrendArea)" points={`${points} 500,118 0,118`} />
            <polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2" />
            {parseChartPoints(points).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r="2.4" stroke="#65a30d" strokeWidth="1.6" />)}
            {data.trend.map((point, index) => <text fill="#94a3b8" fontSize="10" key={`${point.label}-${index}`} textAnchor={index === 0 ? "start" : index === data.trend.length - 1 ? "end" : "middle"} x={index * (500 / Math.max(data.trend.length - 1, 1))} y="128">{point.label}</text>)}
          </svg>
        ) : <HealthNoData message={data.message} />}
      </div>
    </div>
  );
}

function HealthDistribution({ data }: { data: CapacityHealthDiagnosticsData }) {
  if (!data.distribution.length) {
    return <HealthNoData message="No asset health distribution source was found in tracking." />;
  }

  return <DonutWithLegend value={String(data.distribution.reduce((total, row) => total + parseHealthCount(row.value), 0))} subtitle="Assets" rows={data.distribution.map((row) => [row.label, row.value, row.color])} />;
}

function HealthAssetBars({ data }: { data: CapacityHealthDiagnosticsData }) {
  return (
    <div className="h-full text-[9px]">
      <div className="grid h-[156px] grid-cols-[30px_1fr] gap-2">
        <div className="flex flex-col justify-between text-right text-slate-500"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
        <div className="flex items-end justify-between gap-3 border-l border-b border-slate-700/60 px-3">
          {data.assetBars.length ? data.assetBars.map(({ color, label, value }) => <div className="flex flex-1 flex-col items-center" key={label}><span className="mb-1 text-slate-300">{value}</span><span className="w-full rounded-t" style={{ height: `${value * 1.08}px`, backgroundColor: color }} /><span className="mt-1 text-center text-[7px] leading-none text-slate-500">{label}</span></div>) : <HealthNoData message="No asset-type health rows were found in tracking." />}
        </div>
      </div>
      <div className="mt-2 text-[9px] text-[#65a30d]">Average Score: {data.assetBars.length ? Math.round(data.assetBars.reduce((sum, row) => sum + row.value, 0) / data.assetBars.length) : "No Data"}</div>
    </div>
  );
}

function HealthDiagnosticCard({ item }: { item: CapacityHealthDiagnosticsData["diagnostics"][number] }) {
  return (
    <div className="grid h-full grid-cols-[80px_1fr] gap-3 overflow-hidden text-[9px]">
      <div className="pt-3"><HealthRing score={item.score} size={72} status={item.status} /></div>
      <div className="min-w-0">
        <div className="text-[16px] leading-none" style={{ color: item.tone }}>{item.score}</div>
        <div className="text-[8px] text-slate-400">{item.status}</div>
        <p className="mt-2 h-11 overflow-hidden leading-tight text-slate-300">{item.status === "No Data" ? "No applicable diagnostic source was found." : "Calculated from tracking capacity and latest meter telemetry."}</p>
        <div className="mt-2 text-[8px] font-semibold text-slate-300">Key Factors</div>
        <div className="mt-1 space-y-0.5">
          {item.factors.map(({ label, value }) => <div className="flex justify-between border-b border-white/5 pb-0.5" key={label}><span className="truncate text-slate-400"><i className="mr-1 inline-block size-1.5 rounded-full bg-[#65a30d]" />{label}</span><span className="whitespace-nowrap text-slate-300">{value}</span></div>)}
        </div>
        <div className="mt-2 text-[8px] text-[#147dff]">View Details {"->"}</div>
      </div>
    </div>
  );
}

function HealthIssuesTable({ data }: { data: CapacityHealthDiagnosticsData }) {
  const rows = data.issues;
  return (
    <div className="text-[8px] leading-none">
      <div className="grid grid-cols-[0.6fr_1.45fr_1fr_0.55fr_0.9fr] gap-2 border-b border-white/8 pb-1.5 text-slate-500"><span>Severity</span><span>Issue</span><span>Affected Asset</span><span>Impact</span><span>Recommendation</span></div>
      <div className="space-y-1 py-1.5">{rows.length ? rows.map(({ asset, impact, issue, recommendation, severity }) => <div className="grid grid-cols-[0.6fr_1.45fr_1fr_0.55fr_0.9fr] gap-2 border-b border-white/5 pb-1.5 text-slate-300" key={`${issue}-${asset}`}><span className={severity === "High" ? "rounded bg-[#ef4444]/25 px-1 py-0.5 text-[#ef4444]" : severity === "Medium" ? "rounded bg-[#f59e0b]/30 px-1 py-0.5 text-[#f59e0b]" : "rounded bg-[#147dff]/25 px-1 py-0.5 text-[#29b6f6]"}>{severity}</span><span className="truncate">{issue}</span><span className="truncate">{asset}</span><span>{impact}</span><span className="truncate">{recommendation}</span></div>) : <div className="py-7 text-center text-slate-400">{data.message || "No calculated health issues were found in tracking."}</div>}</div>
      <div className="mt-1 text-[#147dff]">View All Issues {"->"}</div>
    </div>
  );
}

function HealthRecommendations({ data }: { data: CapacityHealthDiagnosticsData }) {
  const rows = data.recommendations;
  return (
    <div className="space-y-2 text-[8px]">
      {rows.map((label, index) => <div className="grid grid-cols-[22px_1fr_68px_62px] items-center gap-2 border-b border-white/5 pb-1.5 text-slate-300" key={label}><i className="grid size-5 place-items-center rounded-full border border-[#65a30d] text-[#65a30d] [&>svg]:size-3"><HealthMiniIcon index={index + 1} /></i><span className="truncate">{label}</span><span className={data.issues[index]?.impact === "High" ? "rounded bg-[#65a30d]/20 px-1 py-0.5 text-[#65a30d]" : "rounded bg-[#f59e0b]/20 px-1 py-0.5 text-[#f59e0b]"}>{data.issues[index]?.impact ?? "No Data"}</span><span className="rounded bg-slate-700/30 px-1 py-0.5 text-slate-300">Calculated</span></div>)}
      <div className="text-[#147dff]">View All Recommendations {"->"}</div>
    </div>
  );
}

function HealthSystemSummary({ data }: { data: CapacityHealthDiagnosticsData }) {
  const rows = data.summaryRows;
  return (
    <div className="space-y-0.5 text-[7px] leading-none">
      {rows.map(({ label, value }, index) => <div className="flex items-center justify-between border-b border-white/5 pb-[2px]" key={label}><span className="flex items-center gap-1 text-slate-400"><i className="grid size-3 place-items-center rounded-full border border-slate-600 text-slate-400 [&>svg]:size-2"><HealthMiniIcon index={index + 1} /></i>{label}</span><span className={value === "Excellent" ? "font-semibold text-[#65a30d]" : "font-semibold text-slate-100"}>{value}</span></div>)}
      <div className="pt-0.5 text-[#147dff]">View System Summary {"->"}</div>
    </div>
  );
}

function TrendDetail({ data }: { data: CapacityUtilizationTrendData }) {
  return (
    <>
      <section className="mt-3 grid h-[265px] shrink-0 grid-cols-[1.75fr_0.85fr] gap-3">
        <DashboardPanel title={<span className="flex items-center justify-between"><span>Capacity Utilization Over Time</span><TrendRangeButtons /></span>} variant="enterprise">
          <TrendMainChart data={data} />
        </DashboardPanel>
        <div className="grid min-h-0 grid-rows-[170px_1fr] gap-3 overflow-hidden">
          <DashboardPanel title={<span>Utilization Summary <span className="text-[8px] normal-case text-slate-500">(Last 7 Days)</span></span>} variant="enterprise">
            <TrendUtilizationSummary data={data} />
          </DashboardPanel>
          <DashboardPanel title={<span>Utilization Distribution <span className="text-[8px] normal-case text-slate-500">(Last 7 Days)</span></span>} variant="enterprise">
            <TrendDistribution data={data} />
          </DashboardPanel>
        </div>
      </section>
      <section className="mt-3 grid h-[220px] shrink-0 grid-cols-[1.22fr_1.22fr_0.86fr] gap-3">
        <DashboardPanel title="Daily Utilization Summary" variant="enterprise">
          <TrendDailyTable data={data} />
        </DashboardPanel>
        <DashboardPanel title={<span>Utilization By Time Of Day <span className="text-[8px] normal-case text-slate-500">(Average %)</span></span>} variant="enterprise">
          <TrendHeatmap data={data} />
        </DashboardPanel>
        <DashboardPanel title={<span>Peak Utilization Events <span className="text-[8px] normal-case text-slate-500">(Last 7 Days)</span></span>} variant="enterprise">
          <TrendPeakEvents data={data} />
        </DashboardPanel>
      </section>
      <section className="mt-3 grid h-[145px] shrink-0 grid-cols-[1.05fr_1.05fr_0.95fr] gap-3">
        <DashboardPanel title="Utilization Benchmarking" variant="enterprise">
          <TrendBenchmark data={data} />
        </DashboardPanel>
        <DashboardPanel title="Forecast & Projection" variant="enterprise">
          <TrendForecast data={data} />
        </DashboardPanel>
        <DashboardPanel title="Recommendations" variant="enterprise">
          <TrendRecommendations data={data} />
        </DashboardPanel>
      </section>
    </>
  );
}

function TrendFooter({ data }: { data?: CapacityUtilizationTrendData }) {
  return (
    <footer className="mt-auto flex h-[31px] shrink-0 items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500">
      <span>© 2025 XECO Energy Corporation. All rights reserved.</span>
      <span className="flex gap-8 text-[#05ff5e]"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/support">Support</a></span>
      <span>Data updated: {data?.updatedAt ?? "No Data"} <b className="ml-4 text-[#05ff5e]">▥ {data?.state === "data" ? "Live" : "No Data"}</b></span>
    </footer>
  );
}

function TrendKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = trendKpiIconConfig(kpi.label);
  return (
    <article className="h-[86px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="grid grid-cols-[42px_1fr] gap-3">
        <div className="grid size-10 place-items-center rounded-full border bg-[#061421] shadow-[0_0_14px_currentColor]" style={{ borderColor: config.color, color: config.color }}>
          <AssetIcon kind={config.icon} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[7.5px] font-semibold uppercase leading-none text-slate-300">{kpi.label}</div>
          <div className="mt-1.5 whitespace-nowrap text-[19px] font-light leading-none text-slate-100">{kpi.value}</div>
          <div className="mt-1 truncate text-[7.5px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
      <SparkStroke className="mt-1 h-3 w-full" color={config.color} />
    </article>
  );
}

function trendKpiIconConfig(label: string) {
  if (label.includes("Connected")) return { color: "#147dff", icon: "site" as const };
  if (label.includes("Utilized")) return { color: "#05ff5e", icon: "hex" as const };
  if (label.includes("Available")) return { color: "#147dff", icon: "tower" as const };
  if (label.includes("Peak")) return { color: "#05ff5e", icon: "arrows" as const };
  if (label.includes("Average")) return { color: "#05ff5e", icon: "grid" as const };
  return { color: "#05ff5e", icon: "trend" as const };
}

function TrendRangeButtons() {
  return <span className="flex gap-1 text-[7px] font-medium normal-case tracking-normal">{["7D", "30D", "90D", "12M"].map((item) => <span className={item === "7D" ? "rounded bg-[#1f4db8] px-2 py-0.5 text-white" : "rounded border border-cyan-300/12 bg-[#061421] px-2 py-0.5 text-slate-400"} key={item}>{item}</span>)}</span>;
}

function TrendMainChart({ data }: { data: CapacityUtilizationTrendData }) {
  const chart = trendChartPoints(data.trend);
  const peakPoints = [...data.trend]
    .sort((left, right) => right.utilizationPct - left.utilizationPct)
    .slice(0, 4)
    .map((point) => chart.usedPoints.find((item) => item.source === point));
  return (
    <div className="h-full overflow-hidden text-[8px]">
      <div className="mb-2 flex flex-wrap gap-4 text-slate-400">
        {["Utilized Capacity (kVA)", "Available Capacity (kVA)", "Connected Capacity (kVA)", "Peak Utilization"].map((label, index) => <span className="whitespace-nowrap" key={label}><i className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ backgroundColor: index === 0 ? "#65a30d" : index === 1 ? "#147dff" : index === 2 ? "#94a3b8" : "#a855f7" }} />{label}</span>)}
      </div>
      <div className="grid grid-cols-[40px_1fr_62px] gap-2">
        <div className="flex h-[164px] flex-col justify-between text-right text-[7px] text-slate-500"><span>4,000</span><span>3,500</span><span>3,000</span><span>2,500</span><span>2,000</span><span>1,500</span><span>1,000</span><span>500</span><span>0</span></div>
        {data.trend.length ? (
          <svg className="h-[164px] w-full" viewBox="0 0 500 165" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="trendUtilArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#65a30d" stopOpacity="0.4" /><stop offset="100%" stopColor="#65a30d" stopOpacity="0.03" /></linearGradient>
            </defs>
            {[20, 40, 60, 80, 100, 120, 140].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
            <polygon fill="url(#trendUtilArea)" points={`${chart.used} 500,150 0,150`} />
            <polyline fill="none" points={chart.used} stroke="#65a30d" strokeWidth="2.2" />
            <polyline fill="none" points={chart.available} stroke="#29b6f6" strokeDasharray="4 4" strokeWidth="2" />
            <line x1="0" x2="500" y1={chart.connectedY} y2={chart.connectedY} stroke="#94a3b8" strokeDasharray="6 5" strokeWidth="1.4" />
            {chart.usedPoints.map(({ x, y }) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r="2.4" stroke="#05ff5e" strokeWidth="1.5" />)}
            {parseChartPoints(chart.available).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`a-${x}-${y}`} r="2" stroke="#29b6f6" strokeWidth="1.4" />)}
            {peakPoints.filter(Boolean).map((point) => <circle cx={point!.x} cy={point!.y} fill="#a855f7" key={`p-${point!.x}`} r="3.4" />)}
            {trendAxisLabels(data.trend).map(({ label, x }, index) => <text fill="#94a3b8" fontSize="10" key={`${label}-${index}`} textAnchor={index === 0 ? "start" : index === trendAxisLabels(data.trend).length - 1 ? "end" : "middle"} x={x} y="162">{label}</text>)}
          </svg>
        ) : <TrendNoData message={data.message} />}
        <div className="flex h-[164px] flex-col justify-between text-[8px] font-semibold"><span className="text-slate-300">{data.trend.at(-1)?.connected.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "No Data"} kVA</span><span className="text-[#65a30d]">{data.trend.at(-1)?.used.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "No Data"} kVA</span><span className="text-[#29b6f6]">{data.trend.at(-1)?.available.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "No Data"} kVA</span></div>
      </div>
      <div className="mt-2 h-6 rounded border border-cyan-300/10 bg-[#061421] px-2 py-0.5">
        <svg className="h-full w-full" viewBox="0 0 500 26" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" points={trendMiniPoints(data.trend)} stroke="#94a3b8" strokeWidth="1.2" /><rect fill="none" height="20" stroke="#94a3b8" width="496" x="2" y="3" /></svg>
      </div>
      <div className="mt-1 flex justify-around text-[7px] text-slate-400"><span>Utilization %</span><span>{data.summaryRows[0]?.label}: {data.summaryRows[0]?.value}</span><span>Max: {data.summaryRows[1]?.value}</span><span>Min: {data.summaryRows[2]?.value}</span></div>
    </div>
  );
}

function TrendUtilizationSummary({ data }: { data: CapacityUtilizationTrendData }) {
  const rows = data.summaryRows;
  return (
    <div className="space-y-0.5 text-[7.5px] leading-none">
      {rows.map(({ label, value }) => (
        <div className="flex justify-between border-b border-white/5 pb-[3px]" key={label}>
          <span className="text-slate-400">{label}</span>
          <span className="font-semibold text-slate-100">{value}</span>
        </div>
      ))}
    </div>
  );
}

function TrendDistribution({ data }: { data: CapacityUtilizationTrendData }) {
  const rows = data.distribution;
  const gradient = rows.length ? rows.map(({ color }, index) => `${color} ${index * 25}% ${(index + 1) * 25}%`).join(", ") : "#64748b 0% 100%";
  return (
    <div className="grid h-full grid-cols-[70px_1fr] items-start gap-2 overflow-hidden pt-0.5 text-[6.5px]">
      <div className="relative size-[66px] rounded-full p-[13px]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[12px] leading-none text-white">{trendDataPoints(data)}</div><div className="text-[5.5px] leading-none text-slate-400">Data Points</div></div></div>
      </div>
      <div className="space-y-1 pt-1">
        {rows.length ? rows.map(({ color, label, value }) => <div className="grid grid-cols-[58px_1fr] gap-1" key={label}><span className="whitespace-nowrap"><i className="mr-1 inline-block size-1.5 rounded-full" style={{ backgroundColor: color }} />{label}</span><span className="whitespace-nowrap text-right text-slate-300">{value}</span></div>) : <TrendNoData message="No utilization distribution was found in tracking." />}
      </div>
      <div className="col-span-2 text-[#147dff]">View Distribution Analysis {"->"}</div>
    </div>
  );
}

function TrendDailyTable({ data }: { data: CapacityUtilizationTrendData }) {
  const rows = data.dailyRows;
  return (
    <div className="text-[7.5px] leading-none">
      <div className="grid grid-cols-[0.92fr_0.42fr_0.42fr_0.52fr_0.52fr_0.48fr_0.48fr_0.6fr] gap-1.5 border-b border-white/8 pb-1 text-slate-500"><span>Date</span><span>Avg (%)</span><span>Peak (%)</span><span>Off-Peak</span><span>Time &gt; 80%</span><span>Max kVA</span><span>Min kVA</span><span>Trend</span></div>
      <div className="space-y-0.5 py-1">{rows.length ? rows.map(({ averageUtilization, color, date, maxKva, minKva, offPeakUtilization, peakUtilization, timeOver80 }) => <div className="grid grid-cols-[0.92fr_0.42fr_0.42fr_0.52fr_0.52fr_0.48fr_0.48fr_0.6fr] gap-1.5 border-b border-white/5 pb-1 text-slate-300" key={date}><span>{date}</span><span>{averageUtilization}</span><span>{peakUtilization}</span><span>{offPeakUtilization}</span><span>{timeOver80}</span><span>{maxKva}</span><span>{minKva}</span><AssetMiniSpark color={color} /></div>) : <div className="py-14 text-center text-slate-400">{data.message || "No daily utilization rows were found in tracking."}</div>}</div>
      <div className="mt-1 text-[#147dff]">View Full Daily Report {"->"}</div>
    </div>
  );
}

function TrendHeatmap({ data }: { data: CapacityUtilizationTrendData }) {
  const days = data.heatmapDays;
  const hours = data.heatmapHours;
  return (
    <div className="text-[8px]">
      <div className="ml-8 grid grid-cols-6 text-center text-[7px] text-slate-400">{hours.map((hour) => <span key={hour}>{hour}</span>)}</div>
      <div className="grid grid-cols-[28px_1fr] gap-1.5">
        <div className="grid grid-rows-7 gap-[2px] text-right text-[7px] text-slate-400">{days.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="grid grid-cols-6 grid-rows-7 gap-[2px]">
          {Array.from({ length: 42 }).map((_, index) => {
            const col = index % 6;
            const row = Math.floor(index / 6);
            const value = data.heatmap.find((cell) => cell.column === col && cell.row === row)?.value;
            const color = trendHeatColor(value);
            return <span className="h-[19px] rounded-sm border border-white/10" key={index} style={{ backgroundColor: color, opacity: value === undefined ? 0.18 : 0.45 + Math.min(0.45, value / 180) }} />;
          })}
        </div>
      </div>
      <div className="mt-2 h-2.5 rounded border border-white/15 bg-gradient-to-r from-[#14532d] via-[#eab308] to-[#ef4444]" />
      <div className="mt-1 flex justify-between text-[7px] text-slate-400"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
      <div className="mt-1 text-[7px] text-[#147dff]">View Heatmap Analysis {"->"}</div>
    </div>
  );
}

function TrendPeakEvents({ data }: { data: CapacityUtilizationTrendData }) {
  const rows = data.peakEvents;
  return (
    <div className="text-[8px] leading-none">
      <div className="grid grid-cols-[0.35fr_1fr_0.45fr_0.45fr_0.45fr] gap-1 border-b border-white/8 pb-1.5 text-slate-500"><span>Rank</span><span>Date / Time</span><span>Utilization</span><span>kVA</span><span>Duration</span></div>
      <div className="space-y-1.5 py-1.5">{rows.length ? rows.map(({ duration, kva, rank, timestamp, utilization }) => <div className="grid grid-cols-[0.35fr_1fr_0.45fr_0.45fr_0.45fr] gap-1 border-b border-white/5 pb-1 text-slate-300" key={rank}><span>{rank}</span><span className="truncate">{timestamp}</span><span>{utilization}</span><span>{kva}</span><span>{duration}</span></div>) : <div className="py-12 text-center text-slate-400">{data.message || "No peak utilization events were found in tracking."}</div>}</div>
      <div className="text-[#147dff]">View All Peak Events {"->"}</div>
    </div>
  );
}

function TrendBenchmark({ data }: { data: CapacityUtilizationTrendData }) {
  const rows = data.benchmarks;
  return (
    <div className="space-y-2 text-[8px]">
      {rows.map(({ color, label, value }) => <div className="grid grid-cols-[112px_1fr_34px] items-center gap-2" key={label}><span className="truncate text-slate-300">{label}</span><span className="h-2.5 rounded bg-slate-800"><span className="block h-full rounded" style={{ width: value === "No Data" ? "0%" : value, backgroundColor: color }} /></span><span className="text-right text-slate-400">{value}</span></div>)}
      <div className="pt-1 text-[#147dff]">View Benchmark Report {"->"}</div>
    </div>
  );
}

function TrendForecast({ data }: { data: CapacityUtilizationTrendData }) {
  return (
    <div className="grid h-full grid-cols-[96px_1fr] gap-3 text-[8px]">
      <div><div className="text-[32px] leading-none text-[#05ff5e]">{data.forecast.projectedUtilization}</div><div className="text-slate-400">Projected utilization</div><div className="mt-2 font-semibold text-[#65a30d]">{data.forecast.deltaLabel}</div><div className="mt-2 text-[#147dff]">View Forecast Details {"->"}</div></div>
      <LineChart compact legend={["Projected"]} maxLabel="100%" points={[trendForecastPoints(data.forecast.points)]} />
    </div>
  );
}

function TrendRecommendations({ data }: { data: CapacityUtilizationTrendData }) {
  return (
    <div className="space-y-2 text-[8px] text-slate-300">
      {data.recommendations.map((item) => <div className="flex items-start gap-2" key={item}><i className="mt-0.5 size-2 shrink-0 rounded-full bg-[#05ff5e]" /> <span className="leading-tight">{item}</span></div>)}
      <div className="pt-1 text-[#147dff]">View All Recommendations {"->"}</div>
    </div>
  );
}

function trendChartPoints(rows: CapacityUtilizationTrendData["trend"]) {
  const maxKva = Math.max(...rows.flatMap((row) => [row.connected, row.used, row.available]), 1);
  const maxIndex = Math.max(rows.length - 1, 1);
  const toPoint = (value: number, index: number) => {
    const x = index * (500 / maxIndex);
    const y = 150 - Math.max(0, Math.min(maxKva, value)) / maxKva * 126;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  };
  const usedPoints = rows.map((row, index) => ({ ...toPoint(row.used, index), source: row }));
  const availablePoints = rows.map((row, index) => toPoint(row.available, index));
  const connectedY = Number((150 - rows[0]?.connected / maxKva * 126 || 30).toFixed(1));

  return {
    available: availablePoints.map(({ x, y }) => `${x},${y}`).join(" "),
    connectedY,
    used: usedPoints.map(({ x, y }) => `${x},${y}`).join(" "),
    usedPoints,
  };
}

function trendAxisLabels(rows: CapacityUtilizationTrendData["trend"]) {
  if (!rows.length) return [];
  const labels = rows.filter((_, index) => index === 0 || index === rows.length - 1 || index % Math.max(1, Math.floor(rows.length / 6)) === 0);
  const maxIndex = Math.max(rows.length - 1, 1);
  return labels.map((row) => ({ label: row.label, x: rows.indexOf(row) * (500 / maxIndex) }));
}

function trendMiniPoints(rows: CapacityUtilizationTrendData["trend"]) {
  if (!rows.length) return "";
  const maxIndex = Math.max(rows.length - 1, 1);
  return rows.map((row, index) => {
    const x = index * (500 / maxIndex);
    const y = 22 - Math.max(0, Math.min(100, row.utilizationPct)) / 100 * 18;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function trendForecastPoints(rows: CapacityUtilizationTrendData["forecast"]["points"]) {
  if (!rows.length) return "0,20 420,20";
  const maxIndex = Math.max(rows.length - 1, 1);
  return rows.map((row, index) => {
    const x = index * (420 / maxIndex);
    const y = 58 - Math.max(0, Math.min(100, row.score)) / 100 * 52;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function trendHeatColor(value: number | undefined) {
  if (value === undefined) return "#64748b";
  if (value >= 90) return "#ef4444";
  if (value >= 80) return "#f59e0b";
  if (value >= 60) return "#147dff";
  return "#65a30d";
}

function trendDataPoints(data: CapacityUtilizationTrendData) {
  const row = data.summaryRows.find((item) => item.label === "Data Points");
  return row?.value ?? "No Data";
}

function TrendNoData({ message }: { message?: string }) {
  return <div className="grid h-full place-items-center px-4 text-center text-[9px] leading-snug text-slate-400">{message || "No Data"}</div>;
}

function AssetDetailTree() {
  return (
    <section className="mt-3 grid h-[620px] shrink-0 grid-cols-[0.86fr_1.95fr_1.25fr] gap-3">
      <DashboardPanel title="Asset Hierarchy" variant="enterprise">
        <AssetTree />
      </DashboardPanel>
      <div className="grid min-h-0 grid-rows-[198px_174px_1fr] gap-3 overflow-hidden">
        <DashboardPanel title="Asset Details" variant="enterprise">
          <AssetDetailsPanel />
        </DashboardPanel>
        <div className="grid min-h-0 grid-cols-2 gap-3">
          <DashboardPanel title={<span className="whitespace-nowrap">Utilization Trend <span className="text-[8px] normal-case text-slate-500">(Last 7 Days)</span></span>} variant="enterprise"><AssetTrendChart kind="utilization" /></DashboardPanel>
          <DashboardPanel title={<span className="whitespace-nowrap">Load Profile <span className="text-[8px] normal-case text-slate-500">(Today)</span></span>} variant="enterprise"><AssetTrendChart kind="load" /></DashboardPanel>
        </div>
        <DashboardPanel title="Capacity Utilization By Sub-Asset" variant="enterprise">
          <AssetSubAssetTable />
        </DashboardPanel>
      </div>
      <div className="grid min-h-0 grid-rows-[168px_134px_130px_1fr] gap-3 overflow-hidden">
        <DashboardPanel title="Capacity Breakdown" variant="enterprise"><AssetBreakdown /></DashboardPanel>
        <DashboardPanel title="Performance Metrics" variant="enterprise"><AssetPerformanceMetrics /></DashboardPanel>
        <DashboardPanel title="Asset Health Score" variant="enterprise"><AssetHealthScore /></DashboardPanel>
        <DashboardPanel title={<span>Recent Events <span className="normal-case text-slate-500">(Last 7 Days)</span></span>} variant="enterprise">
          <AssetRecentEvents />
        </DashboardPanel>
      </div>
    </section>
  );
}

type AssetIconKind = "site" | "hex" | "tower" | "arrows" | "grid" | "bell" | "check" | "bolt" | "thermo" | "leaf" | "trend";

function AssetKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const iconConfig = assetIconConfig(kpi.label);

  return (
    <article className="h-[86px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 bg-[#062030] shadow-[0_0_18px_currentColor]" style={{ borderColor: iconConfig.color, color: iconConfig.color }}>
          <AssetIcon kind={iconConfig.kind} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[7.5px] font-semibold uppercase leading-[0.95] text-slate-300">{kpi.label}</div>
          <div className="mt-1 whitespace-nowrap text-[19px] font-light leading-none text-white">{kpi.value}</div>
          <div className="mt-1 truncate text-[7.5px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
      <SparkStroke className="mt-1 h-3 w-full" color={iconConfig.color} />
    </article>
  );
}

function assetIconConfig(label: string) {
  if (label.includes("Utilized")) return { color: "#05ff5e", kind: "hex" as const };
  if (label.includes("Available")) return { color: "#147dff", kind: "tower" as const };
  if (label.includes("Recovered")) return { color: "#05ff5e", kind: "arrows" as const };
  if (label.includes("Monitored")) return { color: "#05ff5e", kind: "grid" as const };
  if (label.includes("Warning")) return { color: "#f59e0b", kind: "bell" as const };
  return { color: "#147dff", kind: "site" as const };
}

function AssetIcon({ kind }: { kind: AssetIconKind }) {
  if (kind === "site") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9l7-4 7 4v10M8 19v-6h8v6M9 9h1M14 9h1M4 19h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "hex") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M9 12h6M12 9v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "tower") return <CapexIcon kind="tower" />;
  if (kind === "arrows") return <RecoveryIcon kind="arrows" />;
  if (kind === "grid") return <CapexIcon kind="grid" />;
  if (kind === "bell") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10M9 18a3 3 0 0 0 6 0M6.5 16c1-1.1 1.5-2.5 1.5-4.5 0-2.8 1.6-5 4-5s4 2.2 4 5c0 2 .5 3.4 1.5 4.5H6.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "bolt") return <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "trend") return <CapexIcon kind="trend" />;
  if (kind === "thermo") return <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "leaf") return <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c8 0 13-5 14-14-9 1-14 6-14 14Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M5 19 15 9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  return <RecoveryIcon kind="check" />;
}

function AssetDetailsPanel() {
  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 text-[20px] leading-none text-slate-100">Main Transformer <span className="text-[10px] font-semibold text-[#05ff5e]">● Healthy</span></div>
          <div className="mt-2 text-[9px] text-slate-400">ID: TRF-MAIN-01 <span className="mx-2">|</span> Type: Dry-Type <span className="mx-2">|</span> Location: Main Electrical Room</div>
        </div>
        <ToolbarButton>Actions</ToolbarButton>
      </div>
      <div className="mt-4 grid grid-cols-[1.05fr_1fr_0.75fr_0.95fr_0.95fr_0.9fr] border-y border-white/8 text-center">
        {[
          ["Connected Capacity", "1,500 kVA", ""],
          ["Current Utilized", "1,125 kVA", ""],
          ["Utilization", "75%", ""],
          ["Available Capacity", "375 kVA", ""],
          ["Recovered Capacity", "225 kVA", ""],
          ["Health Score", "100/100", "Excellent"],
        ].map(([label, value, detail]) => (
          <div className="min-w-0 overflow-hidden border-r border-white/8 px-1 py-3 last:border-r-0" key={label}>
            <div className="truncate text-[6.5px] font-semibold uppercase leading-none text-slate-400">{label}</div>
            <div className="mt-1.5 truncate whitespace-nowrap text-[15px] font-light leading-none text-slate-100">{value}</div>
            {detail ? <div className="mt-1 truncate text-[7px] leading-none text-slate-400">{detail}</div> : null}
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#16a34a] via-[#eab308] to-[#ef4444]">
          <div className="ml-[75%] h-full w-0.5 bg-white/90" />
        </div>
        <div className="mt-1.5 flex justify-between text-[8px] text-slate-400"><span>0%</span><span>50%</span><span>75%</span><span>100%</span></div>
      </div>
    </div>
  );
}

function AssetTrendChart({ kind }: { kind: "load" | "utilization" }) {
  const color = kind === "load" ? "#147dff" : "#65a30d";
  const title = kind === "load" ? "Load" : "Utilization";
  const points = kind === "load" ? "0,88 35,88 70,82 105,44 140,52 175,44 210,34 245,42 280,52 315,50 350,28 385,20 420,30 455,42 500,48" : "0,62 35,48 70,54 105,42 140,50 175,38 210,45 245,52 280,44 315,48 350,42 385,51 420,44 455,48 500,43";
  const area = `${points} 500,118 0,118`;
  const labels = kind === "load" ? ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "12 AM"] : ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];

  return (
    <div className="h-full overflow-hidden text-[8px]">
      <div className="mb-1 flex items-center justify-between text-slate-400"><span><i className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ backgroundColor: color }} />{title}</span><span className="font-semibold" style={{ color }}>{kind === "load" ? "Peak: 1,268 kVA" : "Peak: 1,268 kVA"}</span></div>
      <svg className="h-[112px] w-full" viewBox="0 0 500 132" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`asset-${kind}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.38" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[26, 52, 78, 104].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
        <polygon fill={`url(#asset-${kind}-area)`} points={area} />
        <polyline fill="none" points={points} stroke={color} strokeWidth="2" />
        {parseChartPoints(points).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r="2.2" stroke={color} strokeWidth="1.5" />)}
        {labels.map((label, index) => <text fill="#94a3b8" fontSize="10" key={label} textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"} x={index * (500 / (labels.length - 1))} y="128">{label}</text>)}
      </svg>
      <div className="mt-2 flex justify-between text-slate-400"><span>Average: {kind === "load" ? "1,110 kVA" : "1,125 kVA"}</span><span>Current: {kind === "load" ? "1,058 kVA" : "1,125 kVA"}</span></div>
      <div className="mt-2 text-[#147dff]">{kind === "load" ? <>View Load Profile {"->"}</> : <>View Full Trend {"->"}</>}</div>
    </div>
  );
}

function AssetSubAssetTable() {
  const rows = [
    ["Primary Winding", "1,500", "1,125", "75%", "375", "225", "Healthy", "#65a30d"],
    ["Secondary Winding", "1,500", "1,125", "75%", "375", "225", "Healthy", "#65a30d"],
    ["Cooling System", "--", "--", "--", "--", "--", "Healthy", "#65a30d"],
    ["Monitoring System", "--", "--", "--", "--", "--", "Healthy", "#65a30d"],
    ["TOTAL", "1,500", "1,125", "75%", "375", "225", "--", "#94a3b8"],
  ];

  return (
    <div className="h-full overflow-hidden text-[8px] leading-none">
      <div className="grid grid-cols-[1.25fr_0.75fr_0.7fr_0.7fr_0.75fr_0.75fr_0.65fr_0.8fr] gap-2 border-b border-white/8 pb-1.5 text-slate-500">
        <span>Sub-Asset</span><span>Connected</span><span>Utilized</span><span>Utilization</span><span>Available</span><span>Recovered</span><span>Health</span><span>Trend (7 Days)</span>
      </div>
      <div className="space-y-1 py-1.5">
        {rows.map(([name, connected, utilized, utilization, available, recovered, health, color]) => (
          <div className="grid grid-cols-[1.25fr_0.75fr_0.7fr_0.7fr_0.75fr_0.75fr_0.65fr_0.8fr] items-center gap-2 border-b border-white/5 pb-1 text-slate-300" key={name}>
            <span className={name === "TOTAL" ? "font-semibold text-slate-100" : ""}>{name}</span><span>{connected}</span><span>{utilized}</span><span className="font-semibold text-[#65a30d]">{utilization}</span><span>{available}</span><span>{recovered}</span><span><i className="mr-1 inline-block size-1.5 rounded-full" style={{ backgroundColor: color }} />{health}</span><AssetMiniSpark color={color} />
          </div>
        ))}
      </div>
      <div className="mt-2 text-[8px] text-[#147dff]">View Sub-asset Details {"->"}</div>
    </div>
  );
}

function AssetMiniSpark({ color }: { color: string }) {
  return <svg className="h-4 w-full" viewBox="0 0 70 20" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" points="0,14 8,10 16,13 24,6 32,12 40,5 48,9 56,4 70,8" stroke={color} strokeWidth="1.5" /></svg>;
}

function AssetBreakdown() {
  return <DonutWithLegend value="1,125" subtitle="kVA Utilized" rows={[["Motor Loads", "600 kVA (53.3%)", "#65a30d"], ["HVAC Systems", "270 kVA (24.0%)", "#147dff"], ["Other Loads", "180 kVA (16.0%)", "#f59e0b"], ["Lighting", "50 kVA (4.4%)", "#facc15"], ["Spare / Misc.", "25 kVA (2.3%)", "#ec4899"]]} />;
}

function AssetPerformanceMetrics() {
  const rows: [AssetIconKind, string, string, string][] = [["check", "Efficiency", "98.7%", "#65a30d"], ["bolt", "Power Factor", "0.97", "#65a30d"], ["bolt", "Voltage (Avg)", "480 V", "#65a30d"], ["thermo", "Temperature (Avg)", "63 C", "#65a30d"], ["leaf", "THD (Avg)", "3.2%", "#65a30d"]];
  return (
    <div className="h-full text-[7px] leading-none">
      <div className="space-y-0.5">
        {rows.map(([icon, label, value, color]) => <div className="flex items-center justify-between border-b border-white/5 pb-[2px]" key={label}><span className="flex items-center gap-1.5 text-slate-400"><i className="grid size-3 place-items-center rounded-full border [&>svg]:size-2" style={{ borderColor: color, color }}><AssetIcon kind={icon} /></i>{label}</span><span className="font-semibold text-slate-100">{value}</span></div>)}
      </div>
      <div className="mt-1 text-[7px] text-[#147dff]">View All Metrics {"->"}</div>
    </div>
  );
}

function AssetHealthScore() {
  return (
    <div className="grid h-full grid-cols-[50px_1fr] items-start gap-2 pt-0.5 text-[7px]">
      <div className="grid size-[48px] place-items-center rounded-full p-[5px]" style={{ background: "conic-gradient(#65a30d 0 100%, #243447 100% 100%)" }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><span className="text-[13px] text-white">100</span></div>
      </div>
      <div className="space-y-0.5 text-slate-300">
        {["Load Balance", "Voltage Stability", "Thermal Condition", "Insulation Health", "Harmonic Impact"].map((item) => <div className="flex items-center gap-1.5" key={item}><i className="grid size-3 place-items-center rounded-full bg-[#65a30d]/25 text-[#65a30d] [&>svg]:size-2"><AssetIcon kind="check" /></i>{item}</div>)}
        <div className="pt-0.5 text-[#147dff]">View Health Details {"->"}</div>
      </div>
    </div>
  );
}

function AssetRecentEvents() {
  return (
    <div className="h-full overflow-hidden text-[7.5px] leading-none">
      <div className="mb-1 text-right text-[7.5px] text-[#147dff]">View All Events {"->"}</div>
      <div className="grid grid-cols-[0.95fr_1.15fr_0.55fr_0.55fr] gap-2 border-b border-white/8 pb-1 text-slate-500">
        <span>Date / Time</span><span>Event</span><span>Severity</span><span>Impact</span>
      </div>
      <div className="space-y-1 py-1">
        {[["May 18, 9:45 AM", "Load Optimization", "Info", "Positive"], ["May 17, 3:20 PM", "Power Factor Improvement", "Info", "Positive"], ["May 16, 11:05 AM", "Temp Normalized", "Info", "None"], ["May 15, 4:35 PM", "Peak Load Detected", "Warning", "Medium"], ["May 14, 8:15 AM", "ECBS Optimization", "Info", "Positive"]].map(([date, event, severity, impact]) => (
          <div className="grid grid-cols-[0.95fr_1.15fr_0.55fr_0.55fr] gap-2 border-b border-white/5 pb-0.5 text-slate-300" key={`${date}-${event}`}>
            <span className="truncate">{date}</span><span className="truncate">{event}</span><span className={severity === "Warning" ? "text-[#f59e0b]" : "text-[#147dff]"}>{severity}</span><span>{impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquivalentAttribution() {
  return (
    <>
      <section className="mt-2 grid h-[300px] grid-cols-[1fr_1.45fr_1fr] gap-2">
        <DashboardPanel title="Equivalent Capacity Gain By Category" variant="enterprise">
          <EquivalentCategoryDonut />
        </DashboardPanel>
        <DashboardPanel title="Equivalent Capacity Gain Over Time (Last 7 Days)" variant="enterprise">
          <EquivalentStackedArea />
        </DashboardPanel>
        <DashboardPanel title="Contribution Breakdown (kVA)" variant="enterprise">
          <EquivalentContributionTable />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[255px] grid-cols-[1fr_1.55fr_1fr] gap-2">
        <DashboardPanel title="Equivalent Capacity Gain By Location" variant="enterprise">
          <EquivalentLocationBars />
        </DashboardPanel>
        <DashboardPanel title="How Equivalent Capacity Is Calculated" variant="enterprise">
          <EquivalentCalculationTable />
        </DashboardPanel>
        <DashboardPanel title="Equivalent Gain vs Recovered Capacity" variant="enterprise">
          <EquivalentComparison />
        </DashboardPanel>
      </section>
      <section className="mt-2 h-[132px]">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">At A Glance Insights</h3>
        <div className="grid h-[112px] grid-cols-5 gap-2">
          {[
            ["Motor optimization contributes", "400 kVA (28.1%)"],
            ["HVAC load shifting provides", "150 kVA (10.5%)"],
            ["Production line sequencing delivers", "300 kVA (21.1%)"],
            ["IT load management contributes", "350 kVA (24.6%)"],
            ["Overall impact multiplier", "3.35x recovered capacity"],
          ].map(([label, value], index) => <EquivalentInsightCard index={index} key={label} label={label} value={value} />)}
        </div>
      </section>
    </>
  );
}

function EquivalentKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = equivalentKpiIconConfig(kpi.label);
  return (
    <article className="h-[70px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-2 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="grid grid-cols-[36px_1fr] gap-2">
        <div className="grid size-9 place-items-center rounded-full border bg-[#061421] shadow-[0_0_15px_currentColor]" style={{ borderColor: config.color, color: config.color }}>
          <AssetIcon kind={config.icon} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[6.5px] font-semibold uppercase leading-none text-slate-300">{kpi.label}</div>
          <div className="mt-1 whitespace-nowrap text-[17px] font-light leading-none text-slate-100">{kpi.value}</div>
          <div className="mt-0.5 truncate text-[6.5px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
    </article>
  );
}

function equivalentKpiIconConfig(label: string) {
  if (label.includes("Total")) return { color: "#147dff", icon: "tower" as const };
  if (label.includes("Motor")) return { color: "#65a30d", icon: "hex" as const };
  if (label.includes("HVAC")) return { color: "#22d3ee", icon: "thermo" as const };
  if (label.includes("Production")) return { color: "#a855f7", icon: "trend" as const };
  if (label.includes("Server")) return { color: "#f97316", icon: "grid" as const };
  return { color: "#eab308", icon: "site" as const };
}

function EquivalentInsightCard({ index, label, value }: { index: number; label: string; value: string }) {
  const colors = ["#65a30d", "#22d3ee", "#a855f7", "#f97316", "#eab308"];
  const color = colors[index] ?? "#65a30d";
  return (
    <article className="grid h-full grid-cols-[44px_1fr] items-center gap-3 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3">
      <div className="grid size-10 place-items-center rounded-full border bg-[#061421] shadow-[0_0_14px_currentColor]" style={{ borderColor: color, color }}>
        <AssetIcon kind={index === 1 ? "thermo" : index === 2 ? "trend" : index === 3 ? "grid" : index === 4 ? "site" : "hex"} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] leading-tight text-slate-300">{label}</div>
        <div className="mt-1 text-[10px] font-semibold" style={{ color }}>{value}</div>
      </div>
    </article>
  );
}

function EquivalentCategoryDonut() {
  const rows = [["Motor Systems", "400", "28.1%", "#65a30d"], ["HVAC Systems", "150", "10.5%", "#22d3ee"], ["Production Lines", "300", "21.1%", "#a855f7"], ["Server / IT Loads", "350", "24.6%", "#f97316"], ["Other Loads", "225", "15.8%", "#eab308"]] as const;
  const gradient = rows.map(([, , , color], index) => `${color} ${index * 20}% ${(index + 1) * 20}%`).join(", ");
  return (
    <div className="grid h-full grid-cols-[132px_1fr] items-center gap-4 text-[9px]">
      <div className="relative size-[128px] rounded-full p-[28px]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[22px] leading-none text-white">1,425</div><div className="text-[7px] text-slate-400">kVA<br />Total Gain</div></div></div>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_42px_42px] gap-2 text-[7px] text-slate-500"><span>Category</span><span>Equivalent Capacity</span><span>% Contribution</span></div>
        {rows.map(([label, value, pct, color]) => <div className="grid grid-cols-[1fr_42px_42px] gap-2 border-b border-white/5 pb-1.5" key={label}><span className="whitespace-nowrap"><i className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><span>{value}</span><span className="font-semibold" style={{ color }}>{pct}</span></div>)}
        <div className="pt-2 text-[9px] text-[#147dff]">View Category Details {"->"}</div>
      </div>
    </div>
  );
}

function EquivalentStackedArea() {
  const layers = [
    { color: "#65a30d", points: "0,135 70,119 140,97 210,104 280,91 350,98 420,76 500,63 500,148 0,148" },
    { color: "#22d3ee", points: "0,117 70,102 140,80 210,88 280,73 350,82 420,61 500,48 500,63 420,76 350,98 280,91 210,104 140,97 70,119 0,135" },
    { color: "#a855f7", points: "0,96 70,82 140,58 210,67 280,52 350,60 420,39 500,28 500,48 420,61 350,82 280,73 210,88 140,80 70,102 0,117" },
    { color: "#f97316", points: "0,78 70,61 140,39 210,46 280,33 350,41 420,22 500,11 500,28 420,39 350,60 280,52 210,67 140,58 70,82 0,96" },
  ];
  return (
    <div className="h-full text-[9px]">
      <div className="mb-1 flex gap-3 text-[8px] text-slate-400">{["Motor Systems", "HVAC Systems", "Production Lines", "Server / IT Loads", "Total Gain"].map((label, index) => <span className="whitespace-nowrap" key={label}><i className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: ["#65a30d", "#22d3ee", "#a855f7", "#f97316", "#eab308"][index] }} />{label}</span>)}</div>
      <div className="grid grid-cols-[32px_1fr_64px] gap-2">
        <div className="flex h-[178px] flex-col justify-between text-right text-[8px] text-slate-500"><span>2,000</span><span>1,500</span><span>1,000</span><span>500</span><span>0</span></div>
        <svg className="h-[178px] w-full" viewBox="0 0 500 170" preserveAspectRatio="none" aria-hidden="true">
          {[28, 58, 88, 118, 148].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          {layers.map((layer) => <polygon fill={layer.color} key={layer.color} opacity="0.85" points={layer.points} />)}
          <polyline fill="none" points="0,78 70,61 140,39 210,46 280,33 350,41 420,22 500,11" stroke="#eab308" strokeWidth="2.4" />
          <line x1="0" x2="500" y1="150" y2="150" stroke="rgba(148,163,184,0.2)" />
          {["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"].map((label, index) => <text fill="#94a3b8" fontSize="10" key={label} textAnchor={index === 0 ? "start" : index === 6 ? "end" : "middle"} x={index * (500 / 6)} y="166">{label}</text>)}
        </svg>
        <div className="flex h-[178px] flex-col justify-between text-[8px] font-semibold"><span className="text-slate-100">1,425 kVA</span><span className="text-[#f97316]">350 kVA</span><span className="text-[#a855f7]">300 kVA</span><span className="text-[#22d3ee]">150 kVA</span><span className="text-[#65a30d]">400 kVA</span></div>
      </div>
    </div>
  );
}

function EquivalentContributionTable() {
  const sections = [["MOTOR SYSTEMS (400 kVA)", "#65a30d", [["4 x 50 HP Motors", "160", "40.0%"], ["Packaging Line Motors", "90", "22.5%"], ["Conveyor Motors", "80", "20.0%"], ["Chiller Pumps", "70", "17.5%"], ["Total", "400", "100%"]]], ["HVAC SYSTEMS (150 kVA)", "#22d3ee", [["AHU-1", "60", "40.0%"], ["AHU-2", "50", "33.3%"], ["Chilled Water Plant", "40", "26.7%"], ["Total", "150", "100%"]]]] as const;
  return (
    <div className="text-[8px] leading-none">
      <div className="grid grid-cols-[1.4fr_0.75fr_0.75fr] gap-2 border-b border-white/8 pb-1 text-slate-500"><span>System / Equipment</span><span>Recovered (kVA)</span><span>% of Category</span></div>
      <div className="space-y-1 py-1">{sections.map(([title, color, rows]) => <div key={title}><div className="py-1 font-semibold" style={{ color }}>{title}</div>{rows.map(([name, recovered, pct]) => <div className="grid grid-cols-[1.4fr_0.75fr_0.75fr] gap-2 border-b border-white/5 py-1 text-slate-300" key={`${title}-${name}`}><span>{name}</span><span>{recovered}</span><span>{pct}</span></div>)}</div>)}</div>
      <div className="mt-2 text-[#147dff]">View Full Attribution Report {"->"}</div>
    </div>
  );
}

function EquivalentLocationBars() {
  const rows = [["Main Plant", "820", ["#65a30d", "#22d3ee", "#a855f7", "#f97316", "#eab308"]], ["Building 2", "320", ["#65a30d", "#22d3ee", "#a855f7", "#f97316"]], ["Utility Yard", "185", ["#65a30d", "#22d3ee", "#f97316"]], ["Data Center", "100", ["#65a30d", "#eab308", "#a855f7"]], ["TOTAL", "1,425", ["#65a30d", "#22d3ee", "#a855f7", "#f97316", "#eab308"]]] as const;
  return (
    <div className="text-[9px]">
      <div className="grid grid-cols-[95px_70px_1fr] gap-2 border-b border-white/8 pb-1 text-slate-500"><span>Location</span><span>Total Gain</span><span>Motor / HVAC / Prod / IT / Other</span></div>
      <div className="space-y-2 py-2">{rows.map(([label, value, colors]) => <div className="grid grid-cols-[95px_70px_1fr] items-center gap-2" key={label}><span className={label === "TOTAL" ? "font-semibold text-slate-100" : "text-slate-300"}>{label}</span><span>{value}</span><span className="flex h-3 overflow-hidden rounded bg-slate-800">{colors.map((color) => <i className="h-full" key={color} style={{ width: `${100 / colors.length}%`, backgroundColor: color }} />)}</span></div>)}</div>
      <div className="text-[#147dff]">View Location Breakdown {"->"}</div>
    </div>
  );
}

function EquivalentCalculationTable() {
  return <SimpleTable headers={["Source System", "Optimization Method", "Calculation Basis", "Equivalent Factor", "Example"]} rows={[["Motor Systems", "VFD Optimization", "Demand Reduction", "0.85", "200 kW -> 170 kVA"], ["HVAC Systems", "ECBS Load Shifting", "Peak Shaving", "0.90", "100 kW -> 90 kVA"], ["Production Lines", "Load Sequencing", "Simultaneous Reduction", "0.80", "150 kW -> 120 kVA"], ["Server / IT Loads", "Dynamic Throttling", "Peak Cap Reduction", "0.70", "120 kW -> 84 kVA"], ["Other Loads", "Misc. Optimization", "Load Management", "0.80", "80 kW -> 64 kVA"]]} />;
}

function EquivalentComparison() {
  return (
    <div className="grid h-full grid-cols-[34px_1fr] gap-2 text-[9px]">
      <div className="flex flex-col justify-between text-right text-[8px] text-slate-500"><span>2,000</span><span>1,500</span><span>1,000</span><span>500</span><span>0</span></div>
      <div className="flex items-end justify-around border-l border-b border-slate-700/60 px-8 pb-4">
        <div className="text-center"><div className="mb-1 text-slate-300">425 kVA</div><div className="w-16 rounded-t bg-slate-500" style={{ height: 58 }} /><div className="mt-1 text-slate-400">Recovered Capacity</div></div>
        <div className="pb-14 text-center text-[#05ff5e]">3.35x<br />Impact Multiplier</div>
        <div className="text-center"><div className="mb-1 text-slate-100">1,425 kVA</div><div className="w-20 rounded-t bg-gradient-to-t from-[#65a30d] to-[#4ade80]" style={{ height: 134 }} /><div className="mt-1 text-slate-400">Equivalent Capacity Gain</div></div>
      </div>
    </div>
  );
}

function CapexDeferral() {
  return (
    <>
      <section className="mt-3 grid h-[255px] shrink-0 grid-cols-[1.65fr_0.9fr] gap-3">
        <DashboardPanel title={<span className="flex items-center justify-between gap-3"><span>Deferral Value Over Time</span><DeferralRangeButtons /></span>} variant="enterprise">
          <DeferralValueChart />
        </DashboardPanel>
        <DashboardPanel title="Deferral Value By Asset Category" variant="enterprise">
          <DonutWithLegend value="$1.24M" subtitle="Total" rows={[["Transformers", "$450,000 (36.3%)", "#65a30d"], ["Switchgear", "$320,000 (25.8%)", "#147dff"], ["Feeder Upgrades", "$220,000 (17.7%)", "#a855f7"], ["Panel Upgrades", "$150,000 (12.1%)", "#f97316"], ["Other Infrastructure", "$100,000 (8.1%)", "#14b8a6"]]} />
        </DashboardPanel>
      </section>
      <section className="mt-3 grid h-[205px] shrink-0 grid-cols-[1.35fr_0.9fr_0.9fr] gap-3">
        <DashboardPanel title="Deferral By Upgrade Type" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <CapexUpgradeTable />
          </div>
        </DashboardPanel>
        <DashboardPanel title="Deferral Impact Summary" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <CapexImpactSummary />
          </div>
        </DashboardPanel>
        <DashboardPanel title="Cash Flow Impact" variant="enterprise">
          <CapexCashFlowImpact />
        </DashboardPanel>
      </section>
      <section className="mt-3 grid h-[168px] shrink-0 grid-cols-[1fr_1fr_1fr] gap-3">
        <DashboardPanel title="Key Insights" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <CapexIconList items={["$1.24M in capital expenditures successfully deferred.", "Transformer and switchgear upgrades represent 62% of total deferral value.", "Average deferral period of 2.6 years improves cash flow.", "Continued optimization can unlock additional $310K in future deferrals."]} />
          </div>
        </DashboardPanel>
        <DashboardPanel title="What This Means For You" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <CapexMeaningList />
          </div>
        </DashboardPanel>
        <DashboardPanel title="Next Upgrade Windows" variant="enterprise">
          <div className="h-full overflow-y-auto pr-1">
            <CapexUpgradeWindows />
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function CapexFooter() {
  return (
    <footer className="mt-auto flex h-[31px] shrink-0 items-center justify-between rounded border border-cyan-300/10 bg-[#061421]/80 px-3 text-[9px] text-slate-400">
      <span className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-slate-600 text-[11px] font-semibold text-[#020a12]">i</span>
        Deferral values are calculated using real-time capacity recovery, asset condition, and benchmark upgrade costs.
      </span>
      <span className="flex items-center gap-2 text-slate-300">
        <span className="size-2 rounded-full bg-[#05ff5e]" />
        All Systems Operational
      </span>
    </footer>
  );
}

function DeferralValueChart() {
  const points = [
    [18, 126, "$58K"],
    [68, 118, "$116K"],
    [118, 108, "$168K"],
    [168, 98, "$265K"],
    [218, 86, "$361K"],
    [268, 76, "$470K"],
    [318, 64, "$603K"],
    [368, 52, "$742K"],
    [418, 40, "$893K"],
    [468, 28, "$1.05M"],
    [518, 16, "$1.28M"],
    [568, 7, "$1.56M"],
    [618, 0, "$1.86M"],
  ] as const;
  const months = ["May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24", "Oct '24", "Nov '24", "Dec '24", "Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25"];
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${line} 618,150 18,150`;

  return (
    <div className="relative h-full overflow-hidden">
      <div className="mb-1 flex gap-5 text-[8px] text-slate-400">
        <span className="whitespace-nowrap"><i className="mr-1 inline-block h-0.5 w-4 bg-[#65a30d] align-middle" />Cumulative Deferral Value</span>
        <span className="whitespace-nowrap"><i className="mr-1 inline-block h-0.5 w-4 border-t border-dashed border-[#147dff] align-middle" />Realized Deferral</span>
        <span className="whitespace-nowrap"><i className="mr-1 inline-block h-0.5 w-4 border-t border-dashed border-slate-400 align-middle" />Projected Deferral</span>
      </div>
      <div className="grid h-[204px] grid-cols-[40px_1fr_126px] gap-3">
        <div className="flex flex-col justify-between text-right text-[8px] text-slate-400"><span>$1.5M</span><span>$1.2M</span><span>$900K</span><span>$600K</span><span>$300K</span><span>$0</span></div>
        <svg className="h-full w-full" viewBox="0 0 636 162" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="deferralArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#65a30d" stopOpacity="0.64" />
              <stop offset="100%" stopColor="#65a30d" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {[30, 58, 86, 114, 142].map((y) => <line key={y} x1="0" x2="636" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          <polygon fill="url(#deferralArea)" points={area} />
          <polyline fill="none" points={line} stroke="#65a30d" strokeWidth="2.4" />
          <polyline fill="none" points="518,16 568,7 618,0" stroke="#d1d5db" strokeDasharray="6 5" strokeWidth="2.2" />
          {points.map(([x, y, label], index) => (
            <g key={label}>
              <circle cx={x} cy={y} fill="#061521" r="4" stroke="#65a30d" strokeWidth="2.2" />
              <text fill="#d1d5db" fontSize="10" fontWeight="700" textAnchor="middle" x={x} y={Math.max(10, y - 10)}>{label}</text>
              <text fill="#94a3b8" fontSize="9" textAnchor="middle" x={x} y="160">{months[index]}</text>
            </g>
          ))}
        </svg>
        <div className="grid content-center text-[10px]">
          <div className="text-[16px] font-semibold text-[#65a30d]">Total Deferral</div>
          <div className="mt-1 whitespace-nowrap text-[24px] font-light leading-none text-[#65a30d]">$1,240,000</div>
          <div className="mt-2 text-slate-300">(As of May 18, 2025)</div>
        </div>
      </div>
    </div>
  );
}

function DeferralRangeButtons() {
  return (
    <span className="flex shrink-0 gap-1 text-[8px] font-medium normal-case tracking-normal">
      {["12 Months", "3 Years", "5 Years", "Lifetime"].map((range) => (
        <span className={range === "3 Years" ? "rounded bg-[#1f4db8] px-2 py-1 text-white" : "rounded border border-cyan-300/12 bg-[#061421] px-2 py-1 text-slate-400"} key={range}>{range}</span>
      ))}
    </span>
  );
}

function CapexUpgradeTable() {
  const rows: [CapexIconKind, string, string, string, string, string, string][] = [
    ["tower", "Transformer Upgrade", "Avoided 3,000 kVA transformer upgrade", "$450,000", "1 - 3 Years", "High", "#ef4444"],
    ["grid", "Switchgear Expansion", "Avoided main switchgear upgrade", "$320,000", "1 - 3 Years", "High", "#ef4444"],
    ["trend", "Feeder Upgrades", "Avoided feeder capacity enhancements", "$220,000", "1 - 5 Years", "Medium", "#f59e0b"],
    ["calendar", "Panel Upgrades", "Avoided distribution panel upgrades", "$150,000", "0 - 2 Years", "Medium", "#f59e0b"],
    ["cash", "Other Infrastructure", "Misc. electrical infrastructure upgrades", "$100,000", "1 - 5 Years", "Low", "#65a30d"],
  ];

  return (
    <div className="text-[7.5px] leading-none">
      <div className="grid grid-cols-[1.05fr_1.55fr_0.8fr_0.75fr_0.55fr] gap-2 border-b border-white/5 pb-0.5 text-slate-500">
        <span>Upgrade Type</span><span>Description</span><span>Deferred Cost (USD)</span><span>Deferral Timeline</span><span>Priority</span>
      </div>
      <div className="space-y-0.5 py-1">
        {rows.map(([icon, type, description, cost, timeline, priority, color]) => (
          <div className="grid grid-cols-[1.05fr_1.55fr_0.8fr_0.75fr_0.55fr] items-center gap-2 border-b border-white/5 pb-0.5 text-slate-300" key={type}>
            <span className="flex min-w-0 items-center gap-1.5"><i className="grid size-3.5 shrink-0 place-items-center rounded border [&>svg]:size-2.5" style={{ borderColor: color, color }}><CapexIcon kind={icon} /></i><span className="truncate">{type}</span></span>
            <span className="truncate">{description}</span>
            <span className="whitespace-nowrap text-slate-100">{cost}</span>
            <span className="whitespace-nowrap">{timeline}</span>
            <span className="rounded px-1.5 py-0.5 text-center text-[6.5px] leading-none" style={{ backgroundColor: `${color}24`, color }}>{priority}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-white/8 pt-1 text-[8px] font-semibold text-slate-100"><span>TOTAL</span><span>$1,240,000</span></div>
      <div className="mt-1 text-[7.5px] text-[#147dff]">View Full Upgrade Plan {"->"}</div>
    </div>
  );
}

function CapexImpactSummary() {
  const rows: [CapexIconKind, string, string, string][] = [
    ["trend", "Active Capacity Recovered", "425 kVA", "#65a30d"],
    ["grid", "Upgrades Avoided", "11", "#65a30d"],
    ["cash", "CAPEX Deferred", "$1,240,000", "#65a30d"],
    ["cash", "Average Upgrade Cost", "$112,727", "#65a30d"],
    ["calendar", "Weighted Deferral Years", "2.6 Years", "#65a30d"],
    ["grid", "Capital Efficiency (ROI)", "3.8x", "#65a30d"],
    ["trend", "IRR On Deferred Capital", "28.4%", "#65a30d"],
  ];

  return (
    <div className="text-[7.5px] leading-none">
      <div className="space-y-0.5">
        {rows.map(([icon, label, value, color]) => (
          <div className="flex items-center justify-between border-b border-white/5 pb-0.5" key={label}>
            <span className="flex min-w-0 items-center gap-1.5 text-slate-300"><i className="grid size-3.5 shrink-0 place-items-center rounded-full border [&>svg]:size-2.5" style={{ borderColor: color, color }}><CapexIcon kind={icon} /></i><span className="truncate">{label}</span></span>
            <span className="whitespace-nowrap font-semibold text-slate-100">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[7.5px] text-[#147dff]">View Financial Impact Details {"->"}</div>
    </div>
  );
}

function CapexCashFlowImpact() {
  const rows: [string, number, string, string][] = [["0-12 mo", 64, "#65a30d", "$320K"], ["1-2 yr", 56, "#147dff", "$280K"], ["2-3 yr", 68, "#7c3aed", "$340K"], ["3-5 yr", 60, "#f97316", "$300K"]];
  return (
    <div className="h-full text-[8px]">
      <div className="grid h-[140px] grid-cols-[32px_1fr] gap-2">
        <div className="flex flex-col justify-between text-right text-slate-500"><span>$600K</span><span>$400K</span><span>$200K</span><span>$0</span></div>
        <div className="flex items-end justify-between gap-5 border-l border-b border-slate-700/60 px-5">
          {rows.map(([label, height, color, value]) => (
            <div className="flex flex-1 flex-col items-center" key={label}>
              <span className="mb-1 text-slate-300">{value}</span>
              <span className="w-full rounded-t" style={{ height, backgroundColor: color }} />
              <span className="mt-1 text-center text-[7px] leading-none text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 text-[8px] text-[#147dff]">View Cash Flow Analysis {"->"}</div>
    </div>
  );
}

function CapexIconList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2 text-[9px] text-slate-300">
      {items.map((item) => (
        <div className="flex items-start gap-2" key={item}>
          <i className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#65a30d]/20 text-[#65a30d] [&>svg]:size-3"><CapexIcon kind="check" /></i>
          <span className="leading-tight">{item}</span>
        </div>
      ))}
    </div>
  );
}

function CapexMeaningList() {
  const rows: [CapexIconKind, string, string][] = [
    ["cash", "Improved working capital availability", "#05ff5e"],
    ["debt", "Lower debt requirements", "#65a30d"],
    ["trend", "Higher ROI on existing assets", "#14b8a6"],
    ["flex", "Flexibility for future expansion", "#22d3ee"],
  ];

  return (
    <div className="space-y-2.5 text-[9px] text-slate-300">
      {rows.map(([icon, label, color]) => (
        <div className="flex items-center gap-2" key={label}>
          <i className="grid size-5 shrink-0 place-items-center rounded-full border bg-[#061421] [&>svg]:size-3.5" style={{ borderColor: color, color }}><CapexIcon kind={icon} /></i>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function CapexUpgradeWindows() {
  const rows: [CapexIconKind, string, string, string, string][] = [
    ["tower", "Transformer Upgrade", "Q3 2027", "$450,000", "#65a30d"],
    ["grid", "Switchgear Expansion", "Q1 2026", "$320,000", "#147dff"],
    ["trend", "Feeder Upgrades", "Q2 2026", "$220,000", "#a855f7"],
    ["calendar", "Panel Upgrades", "Q4 2025", "$150,000", "#f97316"],
  ];

  return (
    <div className="text-[8px] leading-none">
      <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr] gap-2 border-b border-white/5 pb-1 text-slate-500">
        <span>Upgrade Type</span><span>Recommended Window</span><span>Deferral Value</span>
      </div>
      <div className="space-y-1.5 py-1.5">
        {rows.map(([icon, type, window, value, color]) => (
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr] items-center gap-2 text-slate-300" key={type}>
            <span className="flex min-w-0 items-center gap-1.5"><i className="grid size-3.5 shrink-0 place-items-center rounded border [&>svg]:size-2.5" style={{ borderColor: color, color }}><CapexIcon kind={icon} /></i><span className="truncate">{type}</span></span>
            <span className="whitespace-nowrap">{window}</span>
            <span className="whitespace-nowrap text-slate-100">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[8px] text-[#147dff]">View Full Upgrade Roadmap {"->"}</div>
    </div>
  );
}

function IntelligenceSummary() {
  return (
    <>
      <section className="mt-2 grid h-[220px] grid-cols-[1.35fr_1fr] gap-2">
        <DashboardPanel title="Capacity Intelligence Summary" variant="enterprise">
          <InsightCapacitySummary />
        </DashboardPanel>
        <DashboardPanel title="Expansion Readiness" variant="enterprise">
          <InsightExpansionReadiness />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[250px] grid-cols-[1.35fr_1fr] gap-2">
        <DashboardPanel title="Future Capacity Outlook" variant="enterprise">
          <InsightFutureOutlook />
        </DashboardPanel>
        <DashboardPanel title="Key Drivers Behind Insights" variant="enterprise">
          <InsightDrivers />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[205px] grid-cols-[0.85fr_0.95fr_1.05fr_1.05fr] gap-2">
        <DashboardPanel title="Risk Of Overload" variant="enterprise">
          <InsightRisk />
        </DashboardPanel>
        <DashboardPanel title="Bottleneck Analysis" variant="enterprise">
          <InsightBottleneck />
        </DashboardPanel>
        <DashboardPanel title="Recommended Actions" variant="enterprise">
          <InsightRecommendedActions />
        </DashboardPanel>
        <DashboardPanel title="Growth Capacity Potential" variant="enterprise">
          <InsightGrowthPotential />
        </DashboardPanel>
      </section>
      <section className="mt-2 flex h-[22px] items-center justify-between text-[10px] text-slate-400">
        <span><i className="mr-2 inline-grid size-4 place-items-center rounded-full bg-slate-500/25 text-[10px] text-slate-300">i</i>Insights are generated using real-time telemetry, historical data, AI analytics, and industry best practices.</span>
        <span className="text-[#65a30d]"><i className="mr-1 inline-block size-2 rounded-full bg-[#65a30d]" />All Systems Operational</span>
      </section>
    </>
  );
}

function InsightKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = insightKpiIconConfig(kpi.label);
  return (
    <article className="h-[70px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-2 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="grid grid-cols-[38px_1fr] gap-2">
        <div className="grid size-9 place-items-center rounded-full border bg-[#061421] shadow-[0_0_15px_currentColor]" style={{ borderColor: config.color, color: config.color }}>
          <AssetIcon kind={config.icon} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[6.5px] font-semibold uppercase leading-none text-slate-300">{kpi.label}</div>
          <div className="mt-1 whitespace-nowrap text-[17px] font-light leading-none text-slate-100">{kpi.value}</div>
          <div className="mt-0.5 truncate text-[6.5px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
    </article>
  );
}

function insightKpiIconConfig(label: string) {
  if (label.includes("Available")) return { color: "#22c55e", icon: "check" as const };
  if (label.includes("Recovered")) return { color: "#147dff", icon: "trend" as const };
  if (label.includes("Deferral")) return { color: "#a855f7", icon: "site" as const };
  if (label.includes("Health")) return { color: "#f97316", icon: "hex" as const };
  if (label.includes("Carbon")) return { color: "#14b8a6", icon: "leaf" as const };
  return { color: "#147dff", icon: "grid" as const };
}

function InsightCapacitySummary() {
  const rows = [["Utilized Capacity", "2,438 kVA (75%)", "#65a30d"], ["Available Capacity", "812 kVA (25%)", "#147dff"], ["Unused Capacity", "0 kVA (0%)", "#94a3b8"]] as const;
  return (
    <div className="grid h-full grid-cols-[1.1fr_0.82fr] items-center gap-5 text-[10px]">
      <div className="space-y-4">
        <p className="max-w-[390px] leading-relaxed text-slate-300">Your facility has 812 kVA (25%) of available electrical capacity. ECBS optimization has already recovered 425 kVA (15%) of capacity, providing significant headroom for current operations and future growth.</p>
        <div className="grid grid-cols-[34px_1fr] items-center gap-3 rounded border border-[#05ff5e]/25 bg-[#05ff5e]/5 p-3 text-slate-300">
          <div className="grid size-8 place-items-center rounded border border-[#65a30d] text-[#65a30d]"><AssetIcon kind="check" /></div>
          <span>Your system is operating efficiently with healthy capacity headroom available.</span>
        </div>
      </div>
      <div className="grid grid-cols-[130px_1fr] items-center gap-4">
        <div className="relative size-[122px] rounded-full p-[27px]" style={{ background: "conic-gradient(#65a30d 0 75%, #147dff 75% 100%)" }}>
          <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[23px] leading-none text-white">3,250</div><div className="text-[8px] text-slate-400">kVA<br />Total Connected</div></div></div>
        </div>
        <div className="space-y-2">{rows.map(([label, value, color]) => <div className="grid grid-cols-[1fr_96px] gap-2 text-[9px]" key={label}><span><i className="mr-2 inline-block size-2 rounded-sm" style={{ backgroundColor: color }} />{label}</span><span className="text-right">{value}</span></div>)}</div>
      </div>
    </div>
  );
}

function InsightExpansionReadiness() {
  return (
    <div className="grid h-full grid-cols-[150px_1fr] items-center gap-6 text-[10px]">
      <div className="relative h-[112px] w-[150px]">
        <svg className="h-[112px] w-[150px]" viewBox="0 0 150 112" aria-hidden="true">
          <path d="M22 92a53 53 0 0 1 106 0" fill="none" stroke="#334155" strokeLinecap="butt" strokeWidth="26" />
          <path d="M22 92a53 53 0 0 1 86 -41" fill="none" stroke="#65a30d" strokeLinecap="butt" strokeWidth="26" />
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center"><div className="text-[34px] font-light text-slate-100">85%</div><div className="text-[12px] text-slate-400">Ready</div></div>
      </div>
      <div className="space-y-3">
        <p className="mb-2 text-slate-300">Your facility is well-positioned for expansion.</p>
        {["Sufficient capacity for near-term growth", "Electrical infrastructure in good condition", "Low overload risk", "Strong system stability"].map((item) => <div className="flex items-center gap-2" key={item}><span className="grid size-4 place-items-center rounded-full bg-[#65a30d] text-[9px] text-[#061521]">✓</span><span>{item}</span></div>)}
        <div className="pt-2 text-[#147dff]">View Expansion Planning {"->"}</div>
      </div>
    </div>
  );
}

function InsightFutureOutlook() {
  const projection = "0,126 42,122 84,118 126,112 168,108 210,103 252,98 294,92 336,87 378,82 420,80 462,78 500,74";
  const available = "0,150 42,149 84,148 126,147 168,146 210,145 252,144 294,143 336,142 378,141 420,140 462,139 500,138";
  return (
    <div className="h-full text-[9px]">
      <div className="mb-1 flex gap-4 text-[8px] text-slate-400"><span className="whitespace-nowrap"><i className="mr-1 inline-block h-0.5 w-4 bg-[#65a30d]" />Projected Utilized Capacity (kVA)</span><span className="whitespace-nowrap"><i className="mr-1 inline-block h-0.5 w-4 border-t border-dashed border-[#147dff]" />Available Capacity (kVA)</span><span className="whitespace-nowrap"><i className="mr-1 inline-block h-0.5 w-4 border-t border-dashed border-slate-400" />Total Connected Capacity (kVA)</span></div>
      <div className="grid grid-cols-[34px_1fr_72px] gap-2">
        <div className="flex h-[145px] flex-col justify-between text-right text-[8px] text-slate-500"><span>4,000</span><span>3,000</span><span>2,000</span><span>1,000</span><span>0</span></div>
        <svg className="h-[145px] w-full" viewBox="0 0 500 170" preserveAspectRatio="none" aria-hidden="true">
          {[30, 62, 94, 126, 150].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          <line x1="0" x2="500" y1="46" y2="46" stroke="#94a3b8" strokeDasharray="6 5" />
          <polyline fill="none" points={available} stroke="#147dff" strokeDasharray="5 4" strokeWidth="1.5" />
          <polyline fill="none" points={projection} stroke="#65a30d" strokeWidth="2" />
          {parseChartPoints(projection).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r="2.2" stroke="#65a30d" strokeWidth="1.4" />)}
          {["May '25", "Aug '25", "Nov '25", "Feb '26", "May '26", "Aug '26", "Nov '26", "Feb '27", "May '27"].map((label, index) => <text fill="#94a3b8" fontSize="9" key={label} textAnchor={index === 0 ? "start" : index === 8 ? "end" : "middle"} x={index * (500 / 8)} y="166">{label}</text>)}
        </svg>
        <div className="flex h-[145px] flex-col justify-center gap-4 text-[8px] font-semibold"><span className="text-slate-100">3,250 kVA</span><span className="text-[#65a30d]">Projected Peak<br />2,650 kVA (81%)</span><span className="text-[#147dff]">Available Today<br />812 kVA (25%)</span></div>
      </div>
      <div className="mt-1 flex items-center justify-between rounded border border-[#65a30d]/20 bg-[#65a30d]/5 px-3 py-1.5 text-[8.5px] text-slate-300"><span><i className="mr-2 inline-grid size-5 place-items-center rounded-full bg-[#65a30d]/25 text-[#65a30d]">⚡</i>Even with projected growth, you will maintain 600 kVA (18%) of available capacity through May 2027 without requiring infrastructure upgrades.</span><span className="whitespace-nowrap text-[#147dff]">View Forecast Details {"->"}</span></div>
    </div>
  );
}

function InsightDrivers() {
  const rows = [["ECBS Optimization", "Real-time load balancing and peak shaving", "+425 kVA", "#65a30d", "bolt"], ["Load Management", "Optimized scheduling and load sequencing", "+185 kVA", "#147dff", "tower"], ["Harmonic Mitigation", "Reduced harmonic distortion improving efficiency", "+95 kVA", "#a855f7", "hex"], ["Power Factor Correction", "Improved power factor reducing reactive load", "+70 kVA", "#f97316", "grid"], ["Thermal Management", "Better cooling and equipment efficiency", "+45 kVA", "#14b8a6", "thermo"]] as const;
  return (
    <div className="h-full text-[9px]">
      <div className="mb-1 grid grid-cols-[1fr_70px] text-[8px] text-slate-500"><span />Impact</div>
      <div className="space-y-2">{rows.map(([title, detail, impact, color, icon]) => <div className="grid grid-cols-[28px_1fr_70px] items-center gap-2 border-b border-white/5 pb-1.5" key={title}><span className="grid size-6 place-items-center rounded-full border" style={{ borderColor: color, color }}><AssetIcon kind={icon} /></span><span><span className="block text-slate-200">{title}</span><span className="text-[8px] text-slate-500">{detail}</span></span><span className="text-right font-semibold" style={{ color }}>{impact}</span></div>)}</div>
      <div className="mt-2 text-[#147dff]">View All Drivers {"->"}</div>
    </div>
  );
}

function InsightRisk() {
  return <InsightMetricCard badge="Low Risk" badgeColor="#65a30d" icon="check" link="View Risk Analysis" rows={[["Current Risk Level", "Low"], ["Probability (Next 30 Days)", "2%"], ["Probability (Next 90 Days)", "8%"], ["Main Risk Factor", "Load Growth"]]} subtitle="Overload probability is very low" />;
}

function InsightBottleneck() {
  return <InsightMetricRows link="View Bottleneck Details" rows={[["Primary Bottleneck", "None"], ["Secondary Bottleneck", "Feeder B (72%)"], ["Tertiary Bottleneck", "DP-2 Panel (80%)"], ["System Limiting Factor", "Transformer Capacity"], ["Utilization Headroom", "812 kVA (25%)"]]} />;
}

function InsightRecommendedActions() {
  return (
    <div className="space-y-3 text-[9px]">
      {["Continue ECBS optimization during peak hours", "Optimize Feeder B load distribution", "Monitor DP-2 panel for future capacity needs", "Plan expansion if growth exceeds 25%"].map((item) => <div className="flex items-start gap-2" key={item}><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#65a30d] text-[9px] text-[#061521]">✓</span><span>{item}</span></div>)}
      <div className="pt-2 text-[#147dff]">View All Recommendations {"->"}</div>
    </div>
  );
}

function InsightGrowthPotential() {
  return (
    <div className="grid h-full grid-cols-[96px_1fr] items-center gap-4 text-[9px]">
      <div className="relative size-[86px] rounded-full p-[16px]" style={{ background: "conic-gradient(#65a30d 0 72%, #334155 72% 100%)" }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[24px] leading-none text-white">600</div><div className="text-[9px] text-slate-400">kVA<br />Growth Headroom</div></div></div>
      </div>
      <div className="space-y-3">
        <p className="leading-snug text-slate-300">You can support additional load growth with current infrastructure.</p>
        <InsightMetricRows compact rows={[["Potential Additional Load", "600 kVA"], ["Growth Percentage", "+18%"], ["Timeframe", "Through May 2027"]]} />
        <div className="text-[#147dff]">View Growth Planning {"->"}</div>
      </div>
    </div>
  );
}

function InsightMetricCard({ badge, badgeColor, icon, link, rows, subtitle }: { badge: string; badgeColor: string; icon: AssetIconKind; link: string; rows: string[][]; subtitle: string }) {
  return (
    <div className="space-y-3 text-[9px]">
      <div className="grid grid-cols-[34px_1fr] items-center gap-3"><span className="grid size-8 place-items-center rounded-full border" style={{ borderColor: badgeColor, color: badgeColor }}><AssetIcon kind={icon} /></span><span><span className="block font-semibold" style={{ color: badgeColor }}>{badge}</span><span className="text-[8px] text-slate-400">{subtitle}</span></span></div>
      <InsightMetricRows rows={rows} />
      <div className="text-[#147dff]">{link} {"->"}</div>
    </div>
  );
}

function InsightMetricRows({ compact = false, link, rows }: { compact?: boolean; link?: string; rows: string[][] }) {
  return (
    <div className={`${compact ? "space-y-1 text-[8px]" : "space-y-2 text-[9px]"}`}>
      {rows.map(([label, value]) => <div className="flex items-center justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><span className="font-semibold text-slate-200">{value}</span></div>)}
      {link ? <div className="pt-1 text-[#147dff]">{link} {"->"}</div> : null}
    </div>
  );
}

function CarbonImpact() {
  return (
    <>
      <section className="mt-2 grid h-[230px] grid-cols-[1.55fr_1fr] gap-2">
        <DashboardPanel title={<span className="flex items-center justify-between gap-3"><span>Emissions Avoided Over Time</span><CarbonRangeButtons /></span>} variant="enterprise">
          <CarbonAvoidedChart />
        </DashboardPanel>
        <DashboardPanel title="Emissions Breakdown By Source" variant="enterprise">
          <CarbonSourceDonut />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[205px] grid-cols-3 gap-2">
        <DashboardPanel title="Monthly Emissions Impact" variant="enterprise">
          <CarbonMonthlyBars />
        </DashboardPanel>
        <DashboardPanel title="Emissions Comparison" variant="enterprise">
          <CarbonComparison />
        </DashboardPanel>
        <DashboardPanel title="Emissions Intensity" variant="enterprise">
          <CarbonIntensityChart />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[190px] grid-cols-[0.85fr_1fr_1.28fr] gap-2">
        <DashboardPanel title="Environmental Equivalents" variant="enterprise">
          <CarbonEquivalents />
        </DashboardPanel>
        <DashboardPanel title="Emissions By Asset Category" variant="enterprise">
          <CarbonAssetBars />
        </DashboardPanel>
        <DashboardPanel title="Carbon Impact Summary" variant="enterprise">
          <CarbonImpactSummary />
        </DashboardPanel>
      </section>
      <section className="mt-2 flex h-[22px] items-center justify-between text-[10px] text-slate-400">
        <span><i className="mr-2 inline-grid size-4 place-items-center rounded-full bg-slate-500/25 text-[10px] text-slate-300">i</i>CO2e (Carbon Dioxide equivalent) calculations are based on regional grid emissions factor of 0.45 kg CO2e / kWh.</span>
        <span className="text-[#65a30d]"><i className="mr-1 inline-block size-2 rounded-full bg-[#65a30d]" />All Systems Operational</span>
      </section>
    </>
  );
}

function CarbonKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = carbonKpiIconConfig(kpi.label);
  return (
    <article className="h-[70px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-2 shadow-[0_0_20px_rgba(0,220,255,0.05)]">
      <div className="grid grid-cols-[38px_1fr] gap-2">
        <div className="grid size-9 place-items-center rounded-full border bg-[#061421] shadow-[0_0_15px_currentColor]" style={{ borderColor: config.color, color: config.color }}>
          <AssetIcon kind={config.icon} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[6.5px] font-semibold uppercase leading-none text-slate-300">{kpi.label}</div>
          <div className="mt-1 whitespace-nowrap text-[18px] font-light leading-none text-slate-100">{kpi.value}</div>
          <div className="mt-0.5 truncate text-[7px] leading-none text-slate-400">{kpi.detail}</div>
        </div>
      </div>
    </article>
  );
}

function carbonKpiIconConfig(label: string) {
  if (label.includes("CO2e")) return { color: "#22c55e", icon: "leaf" as const };
  if (label.includes("Trees")) return { color: "#147dff", icon: "site" as const };
  if (label.includes("Cars")) return { color: "#a855f7", icon: "grid" as const };
  if (label.includes("Clean")) return { color: "#f97316", icon: "bolt" as const };
  return { color: "#14b8a6", icon: "leaf" as const };
}

function CarbonRangeButtons() {
  return <span className="flex overflow-hidden rounded border border-cyan-300/10 text-[8px] font-medium text-slate-400">{["6 Months", "12 Months", "24 Months", "YTD", "All"].map((label) => <span className={`px-2 py-1 ${label === "12 Months" ? "bg-[#147dff] text-white" : "bg-[#061421]"}`} key={label}>{label}</span>)}</span>;
}

function CarbonAvoidedChart() {
  const points = "0,140 42,135 84,130 126,125 168,119 210,111 252,103 294,94 336,84 378,72 420,60 462,46 500,32";
  const values = ["1.8", "3.7", "5.6", "7.9", "10.2", "12.8", "16.0", "19.5", "23.4", "27.6", "32.1", "36.7", "41.2"];
  const months = ["May '24", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan '25", "Feb", "Mar", "Apr", "May '25"];
  return (
    <div className="h-full text-[9px]">
      <div className="mb-1 flex items-center justify-between text-[8px] text-slate-400"><span>Tonnes CO2e</span><span className="mr-auto ml-4"><i className="mr-1 inline-block h-0.5 w-4 align-middle bg-[#65a30d]" />Cumulative CO2e Avoided</span></div>
      <div className="grid grid-cols-[30px_1fr_88px] gap-2">
        <div className="flex h-[156px] flex-col justify-between text-right text-[8px] text-slate-500"><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
        <svg className="h-[156px] w-full" viewBox="0 0 500 170" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="carbonArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#65a30d" stopOpacity="0.35" /><stop offset="1" stopColor="#65a30d" stopOpacity="0.02" /></linearGradient></defs>
          {[28, 56, 84, 112, 140].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          <polygon fill="url(#carbonArea)" points={`${points} 500,146 0,146`} />
          <polyline fill="none" points={points} stroke="#65a30d" strokeWidth="2.2" />
          {parseChartPoints(points).map(([x, y], index) => <g key={`${x}-${y}`}><circle cx={x} cy={y} fill="#061521" r="2.5" stroke="#a3e635" strokeWidth="1.4" />{index % 2 === 0 ? <text fill="#d9f99d" fontSize="8" textAnchor="middle" x={x} y={y - 8}>{values[index]}</text> : null}</g>)}
          {months.map((label, index) => <text fill="#94a3b8" fontSize="7.5" key={label} textAnchor={index === 0 ? "start" : index === months.length - 1 ? "end" : "middle"} x={index * (500 / (months.length - 1))} y="166">{label}</text>)}
        </svg>
        <div className="flex h-[156px] flex-col justify-center gap-3 text-[9px]"><span className="text-[#65a30d]">Total CO2e Avoided</span><span className="text-[22px] leading-none text-[#65a30d]">41.2 Tons</span><span className="text-[8px] text-slate-400">As of May 18, 2025</span></div>
      </div>
    </div>
  );
}

function CarbonSourceDonut() {
  return (
    <div className="grid h-full grid-cols-[145px_1fr] items-center gap-4 text-[9px]">
      <div className="relative size-[132px] rounded-full p-[31px]" style={{ background: "conic-gradient(#65a30d 0 56.8%, #147dff 56.8% 80.6%, #7c3aed 80.6% 94.2%, #f97316 94.2% 100%)" }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[24px] leading-none text-white">41.2</div><div className="text-[9px] text-slate-400">Tons CO2e</div></div></div>
      </div>
      <div className="space-y-2">{[["Reduced Energy Consumption", "23.4 Tons (56.8%)", "#65a30d"], ["Reduced Demand Charges", "9.8 Tons (23.8%)", "#147dff"], ["Equipment Efficiency", "5.6 Tons (13.6%)", "#7c3aed"], ["Reduced Thermal Stress", "2.4 Tons (5.8%)", "#f97316"]].map(([label, value, color]) => <div className="grid grid-cols-[1fr_92px] gap-2" key={label}><span className="whitespace-nowrap"><i className="mr-2 inline-block size-2 rounded-sm" style={{ backgroundColor: color }} />{label}</span><span className="text-right">{value}</span></div>)}<div className="pt-3 text-[#147dff]">View Source Details {"->"}</div></div>
    </div>
  );
}

function CarbonMonthlyBars() {
  const rows = [["May '24", 1.8], ["Jun '24", 1.9], ["Jul '24", 2.1], ["Aug '24", 2.3], ["Sep '24", 2.3], ["Oct '24", 2.6], ["Nov '24", 3.2], ["Dec '24", 3.5], ["Jan '25", 3.9], ["Feb '25", 4.2], ["Mar '25", 4.5], ["Apr '25", 4.6], ["May '25", 4.5]] as const;
  return (
    <div className="h-full text-[8px]">
      <div className="mb-1 text-slate-400">Tonnes CO2e</div>
      <div className="grid h-[132px] grid-cols-[24px_1fr] gap-2">
        <div className="flex flex-col justify-between text-right text-slate-500"><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span></div>
        <div className="flex items-end gap-2 border-l border-b border-slate-700/50 px-2 pb-3">{rows.map(([label, value]) => <div className="flex flex-1 flex-col items-center gap-1" key={label}><span className="text-[8px] text-slate-300">{value}</span><span className="w-full rounded-t bg-[#65a30d]" style={{ height: `${value * 16}px` }} /><span className="text-[6.5px] text-slate-500">{label}</span></div>)}</div>
      </div>
      <div className="mt-2 text-[#147dff]">View Monthly Data {"->"}</div>
    </div>
  );
}

function CarbonComparison() {
  return (
    <div className="grid h-full grid-cols-[34px_1fr_110px] gap-2 text-[8px]">
      <div className="flex flex-col justify-between text-right text-slate-500"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div>
      <div className="flex items-end justify-center gap-12 border-l border-b border-slate-700/50 pb-5">
        <div className="flex items-end gap-3"><div className="text-center"><div>88.4</div><div className="w-12 rounded-t bg-slate-500" style={{ height: 100 }} /><div className="mt-1">Baseline<br />(12 Months)</div></div><div className="text-center"><div>47.2</div><div className="w-12 rounded-t bg-[#65a30d]" style={{ height: 54 }} /><div className="mt-1">With ECBS</div></div></div>
        <div className="flex items-end gap-3"><div className="text-center"><div>47.2</div><div className="w-12 rounded-t bg-slate-500" style={{ height: 54 }} /><div className="mt-1">Baseline</div></div><div className="text-center"><div>6.0</div><div className="w-12 rounded-t bg-[#65a30d]" style={{ height: 10 }} /><div className="mt-1">With ECBS</div></div></div>
      </div>
      <div className="flex flex-col justify-center text-center"><span className="text-slate-300">CO2e Avoided</span><span className="text-[22px] leading-none text-[#65a30d]">41.2 Tons</span><span className="text-slate-400">18.6% Reduction</span></div>
    </div>
  );
}

function CarbonIntensityChart() {
  const withEcbs = "0,56 35,62 70,78 105,72 140,76 175,83 210,80 245,84 280,82 315,85 350,84 385,83 420,84 455,83 500,82";
  const baseline = "0,44 35,42 70,41 105,40 140,40 175,40 210,39 245,39 280,39 315,39 350,39 385,39 420,39 455,39 500,39";
  return (
    <div className="h-full text-[8px]">
      <div className="mb-1 text-slate-400">kg CO2e / kWh</div>
      <div className="grid grid-cols-[28px_1fr_54px] gap-2">
        <div className="flex h-[130px] flex-col justify-between text-right text-slate-500"><span>0.40</span><span>0.30</span><span>0.20</span><span>0.10</span><span>0.00</span></div>
        <svg className="h-[130px] w-full" viewBox="0 0 500 140" preserveAspectRatio="none" aria-hidden="true">
          {[22, 50, 78, 106, 130].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          <polyline fill="none" points={baseline} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth="1.6" />
          <polyline fill="none" points={withEcbs} stroke="#65a30d" strokeWidth="2" />
          {parseChartPoints(withEcbs).map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r="2" stroke="#65a30d" strokeWidth="1.2" />)}
          {["May '24", "Jul '24", "Sep '24", "Nov '24", "Jan '25", "Mar '25", "May '25"].map((label, index) => <text fill="#94a3b8" fontSize="9" key={label} textAnchor={index === 0 ? "start" : index === 6 ? "end" : "middle"} x={index * (500 / 6)} y="138">{label}</text>)}
        </svg>
        <div className="flex h-[130px] flex-col justify-center gap-4 text-[10px]"><span className="text-slate-300">0.32<br /><span className="text-[8px]">Baseline</span></span><span className="text-[#65a30d]">0.22<br /><span className="text-[8px]">Current</span></span></div>
      </div>
      <div className="mt-2 text-[#147dff]">View Intensity Analysis {"->"}</div>
    </div>
  );
}

function CarbonEquivalents() {
  const rows = [["Trees Planted", "2,137 Trees", "10-year growth", "leaf"], ["Passenger Cars Off the Road", "9.8 Cars", "for 1 Year", "grid"], ["Homes' Energy Use", "4.6 Homes", "for 1 Year", "site"], ["Gallons of Gasoline Not Used", "439 Gallons", "per Year", "bolt"]] as const;
  return <div className="space-y-2 text-[9px]">{rows.map(([label, value, detail, icon]) => <div className="grid grid-cols-[28px_1fr_78px] items-center gap-2 border-b border-white/5 pb-1.5" key={label}><span className="text-[#65a30d]"><AssetIcon kind={icon} /></span><span>{label}</span><span className="text-right"><span className="block font-semibold text-slate-200">{value}</span><span className="text-[7px] text-slate-500">{detail}</span></span></div>)}<div className="pt-1 text-[#147dff]">View All Equivalents {"->"}</div></div>;
}

function CarbonAssetBars() {
  const rows = [["Transformer", "18.6", "45.1%"], ["Switchgear", "9.2", "22.3%"], ["Feeders", "6.4", "15.5%"], ["Panels", "4.2", "10.2%"], ["Other Infrastructure", "2.8", "6.8%"]] as const;
  return <div className="text-[8px]"><div className="mb-2 text-slate-400">Tonnes CO2e Avoided (Annual)</div><div className="space-y-2">{rows.map(([label, value, pct]) => <div className="grid grid-cols-[95px_1fr_74px] items-center gap-2" key={label}><span>{label}</span><span className="h-3 rounded bg-slate-800"><i className="block h-full rounded bg-[#65a30d]" style={{ width: pct }} /></span><span className="text-right">{value} ({pct})</span></div>)}</div><div className="mt-3 text-[#147dff]">View Category Details {"->"}</div></div>;
}

function CarbonImpactSummary() {
  return (
    <div className="grid h-full grid-cols-[1fr_112px] items-center gap-4 text-[9px]">
      <div className="space-y-3">{["ECBS optimization reduced annual emissions by 41.2 tons CO2e.", "This represents an 18.6% reduction compared to baseline operations.", "Equivalent to planting 2,137 trees and removing 9.8 cars from the road.", "Continued optimization will further reduce our environmental footprint."].map((item) => <div className="flex items-start gap-2" key={item}><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#65a30d] text-[9px] text-[#061521]">✓</span><span>{item}</span></div>)}<div className="pt-2 text-[#147dff]">View Summary Report {"->"}</div></div>
      <svg className="size-[104px] text-[#65a30d]" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" fill="none" r="46" stroke="currentColor" strokeWidth="3" />
        <path d="M18 62c18-10 27-4 34 5 11 14 31 11 49-3M26 37c10 8 18 9 24 5 10-7 17-4 22 5 8 14 19 13 30 5M58 15c-4 15-3 27 5 36 8 10 8 22-2 34-6 8-8 14-5 21M32 86c10-6 19-6 28 0 9 7 18 8 29 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
        <path d="M42 25c-8 9-9 16-3 21M83 23c7 10 8 19 3 28M21 55c5 3 10 3 15 0M92 82c5 4 7 9 6 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    </div>
  );
}

function SimulateCapacityExpansionShell() {
  const kpis = [
    ["Current Effective Capacity", "2.60 MW", "After Optimization", "#147dff", "gauge"],
    ["Additional Capacity Simulated", "650 kVA", "Scenario Result", "#147dff", "bolt"],
    ["New Effective Capacity", "3.25 MW", "+25.0% Increase", "#a855f7", "trend"],
    ["Deferred CAPEX", "$1,780,000", "Avoided Investment", "#f97316", "site"],
    ["Annual Value Created", "$214,800", "Savings + Efficiency", "#05ff5e", "leaf"],
    ["CO2 Reduction", "52.6", "tons / year", "#14b8a6", "leaf"],
  ] as const;

  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-full min-h-[682px] flex-col overflow-hidden px-3 py-2">
        <div className="flex h-[32px] items-center justify-between">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-slate-200">XECO Energy Intelligence Portal</div>
          <div className="flex items-center gap-2 text-[10px]">
            <ToolbarButton>Flex Tijuana</ToolbarButton>
            <ToolbarButton>May 12 - May 18, 2025</ToolbarButton>
            <ToolbarButton>Export Report</ToolbarButton>
            <ToolbarButton>Save Scenario</ToolbarButton>
            <ToolbarButton>Configure Alerts</ToolbarButton>
          </div>
        </div>
        <div className="mt-1 flex h-[64px] items-start justify-between">
          <div>
            <Breadcrumb items={["Electrical Network", "Capacity Detail", "Optimization Opportunities", "Simulate Capacity Expansion"]} />
            <h1 className="mt-2 text-[24px] font-light leading-none text-slate-100">Simulate Capacity Expansion</h1>
            <p className="mt-1 text-[10px] text-slate-400">Model and simulate capacity expansion scenarios to optimize system performance and defer capital expenses.</p>
          </div>
          <ToolbarButton>Back to Optimization Opportunities</ToolbarButton>
        </div>
        <section className="mt-2 grid h-[78px] grid-cols-6 gap-2">
          {kpis.map(([label, value, detail, color, icon]) => <SimulateKpiCard color={color} detail={detail} icon={icon} key={label} label={label} value={value} />)}
        </section>
        <section className="mt-2 grid h-[448px] grid-cols-[0.8fr_1.55fr_1.18fr] grid-rows-[260px_180px] gap-2">
          <div className="row-span-2 min-h-0">
            <DashboardPanel title="1. Scenario Configuration" variant="enterprise">
              <SimulateScenarioConfig />
            </DashboardPanel>
          </div>
          <DashboardPanel title="2. Simulation Results Summary" variant="enterprise">
            <SimulateResultsSummary />
          </DashboardPanel>
          <DashboardPanel title="3. Financial Impact Analysis (Annual)" variant="enterprise">
            <SimulateFinancialImpact />
          </DashboardPanel>
          <div className="col-start-2 grid grid-cols-[0.92fr_1.08fr] gap-2">
            <DashboardPanel title="Capacity By Voltage Level (After Simulation)" variant="enterprise"><SimulateVoltageDonut /></DashboardPanel>
            <DashboardPanel title="Utilization Profile (Average)" variant="enterprise"><SimulateUtilizationProfile /></DashboardPanel>
          </div>
          <DashboardPanel title="4. Scenario Comparison" variant="enterprise"><SimulateScenarioComparison /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[120px] grid-cols-[1.05fr_1fr_0.9fr_0.95fr] gap-2">
          <DashboardPanel title="AI Insight" variant="enterprise"><SimulateAiInsight /></DashboardPanel>
          <DashboardPanel title="Top Impact Drivers" variant="enterprise"><SimulateImpactDrivers /></DashboardPanel>
          <DashboardPanel title="Assumptions" variant="enterprise"><SimulateAssumptions /></DashboardPanel>
          <DashboardPanel title="Download & Export" variant="enterprise"><SimulateDownloads /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[40px] grid-cols-[1fr_1fr_1fr_1fr] gap-3">
          {["Apply Scenario to Network", "Generate Implementation Plan", "Export Engineering Report", "Push to Deployment Module"].map((label, index) => <button className={`rounded border px-3 text-[11px] ${index === 0 ? "border-[#05ff5e]/30 bg-[#05ff5e]/70 text-[#04111c]" : "border-cyan-300/12 bg-[#061421] text-slate-300"}`} key={label}>{label}</button>)}
        </section>
        <DashboardFooter updatedAt="May 18, 2025 10:15 AM" variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function SimulateKpiCard({ color, detail, icon, label, value }: { color: string; detail: string; icon: AssetIconKind | "gauge"; label: string; value: string }) {
  return (
    <article className="h-full rounded-lg border border-cyan-300/12 bg-[#061825]/90 p-3">
      <div className="grid grid-cols-[44px_1fr] items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full border bg-[#061421] shadow-[0_0_16px_currentColor]" style={{ borderColor: color, color }}>
          {icon === "gauge" ? <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15a8 8 0 0 1 16 0M12 15l4-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg> : <AssetIcon kind={icon} />}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[7px] font-semibold uppercase text-slate-300">{label}</div>
          <div className="mt-1 whitespace-nowrap text-[20px] font-light leading-none text-slate-100">{value}</div>
          <div className="mt-1 truncate text-[8px]" style={{ color }}>{detail}</div>
        </div>
      </div>
    </article>
  );
}

function SimulateScenarioConfig() {
  return (
    <div className="space-y-3 text-[9px]">
      <label className="block"><span className="mb-1 block text-slate-400">Select Expansion Strategy</span><div className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1.5">Balanced Optimization (Recommended)</div></label>
      <div><div className="mb-1 flex justify-between text-slate-400"><span>Target Capacity Increase</span><span className="font-semibold text-white">650 kVA</span></div><div className="relative h-1.5 rounded bg-slate-700"><i className="absolute left-0 top-0 h-full w-[65%] rounded bg-[#65a30d]" /><i className="absolute left-[65%] top-1/2 size-3 -translate-y-1/2 rounded-full bg-white" /></div><div className="mt-1 flex justify-between text-[7px] text-slate-500"><span>0 kVA</span><span>1,000 kVA</span></div></div>
      <div className="space-y-1"><div className="text-slate-400">Methodology</div>{["Load Rebalancing", "Power Factor Optimization", "Harmonic Reduction", "Transformer Load Redistribution", "Motor Efficiency Optimization"].map((item) => <div className="flex items-center gap-2" key={item}><span className="grid size-3 place-items-center rounded-sm bg-[#65a30d] text-[8px] text-[#061421]">✓</span>{item}</div>)}</div>
      <div className="space-y-1"><div className="text-slate-400">Include Infrastructure Investment</div>{["No (Optimization Only)", "Yes (Include Infrastructure)", "Hybrid (Minimal Infrastructure)"].map((item, index) => <div className="flex items-center gap-2" key={item}><span className={`size-3 rounded-full border ${index === 0 ? "border-[#05ff5e] bg-[#05ff5e]/30" : "border-slate-500"}`} />{item}</div>)}</div>
      <div className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1.5">Time Horizon <span className="float-right">12 Months</span></div>
      <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5 text-[9px] text-slate-300">Reset to Defaults</button>
    </div>
  );
}

function SimulateResultsSummary() {
  return (
    <div className="grid h-full grid-cols-[1.65fr_0.9fr] gap-4 text-[8px]">
      <div>
        <div className="mb-2 text-[10px] uppercase text-slate-300">Capacity Expansion Waterfall (kVA)</div>
        <div className="mb-1 flex justify-center gap-4 text-[7px] text-slate-400"><span><i className="mr-1 inline-block size-2 bg-[#22c55e]" />Increase</span><span><i className="mr-1 inline-block size-2 bg-[#ef4444]" />Decrease</span><span><i className="mr-1 inline-block size-2 bg-[#147dff]" />Subtotal</span><span><i className="mr-1 inline-block h-0.5 w-3 bg-slate-300" />Total</span></div>
        <svg className="h-[190px] w-full" viewBox="0 0 520 210" preserveAspectRatio="none" aria-hidden="true">
          {[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500, 0].map((label, index) => <text fill="#94a3b8" fontSize="8" key={label} textAnchor="end" x="28" y={18 + index * 19}>{label}</text>)}
          {[35, 70, 105, 140, 175].map((y) => <line key={y} x1="35" x2="510" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
          {([
            ["Current", 55, 86, 58, "#94a3b8", "2,600"],
            ["Load", 130, 66, 40, "#22c55e", "+220"],
            ["PF", 205, 52, 34, "#22c55e", "+150"],
            ["Harmonic", 280, 43, 29, "#22c55e", "+120"],
            ["Transformer", 355, 36, 25, "#22c55e", "+110"],
            ["Motor", 430, 26, 20, "#22c55e", "+50"],
            ["New Effective", 490, 17, 83, "#147dff", "3,250"],
          ] as Array<[string, number, number, number, string, string]>).map(([label, x, y, h, color, value]) => <g key={label}><rect fill={color} height={h} rx="2" width="38" x={x} y={y} /><text fill="#dbeafe" fontSize="9" textAnchor="middle" x={x + 19} y={y - 5}>{value}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x + 19} y="198">{label}</text></g>)}
        </svg>
      </div>
      <SimulateMetricRows rows={[["Current Effective Capacity", "2.60 MW", "#05ff5e"], ["Simulated Additional Capacity", "650 kVA", "#05ff5e"], ["New Effective Capacity", "3.25 MW", "#05ff5e"], ["Percent Increase", "+25.0%", "#05ff5e"], ["Capacity Utilization (Projected)", "68%", "#cbd5e1"], ["Reserve Margin (Projected)", "24%", "#cbd5e1"], ["Peak Demand (Projected)", "2.47 MW", "#cbd5e1"], ["Deferred CAPEX", "$1,780,000", "#cbd5e1"]]} />
    </div>
  );
}

function SimulateFinancialImpact() {
  return <div className="space-y-3 text-[9px]"><SimulateMetricRows rows={[["Demand Charge Reduction", "$92,400", "#cbd5e1"], ["Loss Reduction Savings", "$48,600", "#cbd5e1"], ["Efficiency Gains", "$73,800", "#cbd5e1"], ["Total Annual Savings", "$214,800", "#05ff5e"], ["Investment Required", "$0", "#cbd5e1"], ["Net Annual Benefit", "$214,800", "#05ff5e"]]} /><div className="rounded border border-[#05ff5e]/30 bg-[#05ff5e]/10 p-3 text-[#05ff5e]"><span>Return on Optimization (ROI)</span><span className="float-right text-[22px] leading-none">100%+</span></div></div>;
}

function SimulateVoltageDonut() {
  return <DonutWithLegend value="3.25 MW" subtitle="Total" rows={[["480 V", "1.45 MW (44.6%)", "#147dff"], ["69 kV", "1.20 MW (36.9%)", "#65a30d"], ["115 kV", "0.45 MW (13.8%)", "#7c3aed"], ["Other", "0.15 MW (4.6%)", "#f97316"]]} />;
}

function SimulateUtilizationProfile() {
  return <LineChart compact legend={["Current (2.60 MW)", "Simulated (3.25 MW)", "Optimal (80%)"]} maxLabel="100%" points={["0,52 70,58 140,60 210,55 280,48 350,54 420,60 500,56", "0,72 70,78 140,80 210,75 280,68 350,74 420,80 500,76", "0,36 500,36"]} />;
}

function SimulateScenarioComparison() {
  return <div className="space-y-3 text-[8px]"><SimpleTable headers={["Scenario", "Total Capacity", "Increase", "Annual Value", "Payback"]} rows={[["Conservative", "2.95 MW", "+350 kVA", "$112,200", "5.1 mo"], ["Balanced", "3.25 MW", "+650 kVA", "$214,800", "Immediate"], ["Aggressive", "3.60 MW", "+1,000 kVA", "$312,600", "2.3 mo"]]} /><button className="w-full rounded border border-cyan-300/12 bg-[#061421] py-2 text-[10px] text-slate-300">View Comparison Details {"->"}</button></div>;
}

function SimulateAiInsight() {
  return <div className="text-[8.5px] leading-relaxed text-slate-300"><div className="mb-2 text-[#14b8a6]"><AssetIcon kind="hex" /></div>The Balanced Optimization scenario provides the best combination of capacity increase and financial return without requiring infrastructure investment. Implementing these optimization actions can unlock 650 kVA of additional usable capacity.<div className="mt-2 text-[#05ff5e]">View Recommendation Details {"->"}</div></div>;
}

function SimulateImpactDrivers() {
  return <BarRows rows={[["Load Rebalancing", "220", "kVA", "#65a30d"], ["Power Factor Optimization", "150", "kVA", "#65a30d"], ["Harmonic Reduction", "120", "kVA", "#65a30d"], ["Transformer Redistribution", "110", "kVA", "#65a30d"], ["Motor Efficiency", "50", "kVA", "#147dff"]]} />;
}

function SimulateAssumptions() {
  return <Recommendations items={["Load growth rate: 2% annually", "Power factor target: 0.95", "Harmonic compliance: IEEE 519", "Utility rate escalation: 3% annually", "Analysis period: 12 months"]} />;
}

function SimulateDownloads() {
  return <div className="grid h-full grid-cols-4 gap-2 text-center text-[8px]">{[["Simulation Report", "PDF", "#94a3b8"], ["Financial Analysis", "Excel", "#05ff5e"], ["Engineering Summary", "PDF", "#ef4444"], ["Data Export", "CSV", "#147dff"]].map(([label, type, color]) => <div className="grid place-items-center rounded border border-cyan-300/12 bg-[#061421] p-2" key={label}><span className="text-[20px]" style={{ color }}><AssetIcon kind="grid" /></span><span>{label}</span><span className="text-slate-500">({type})</span></div>)}</div>;
}

function SimulateMetricRows({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return <div className="space-y-2 text-[9px]">{rows.map(([label, value, color]) => <div className="flex items-center justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><span className="font-semibold" style={{ color }}>{value}</span></div>)}</div>;
}

function OptimizationOpportunitiesShell() {
  const kpis = [
    ["Total Optimization Potential", "420 kVA", "Recoverable Capacity", "#05ff5e", "gauge"],
    ["Immediate Usable Capacity", "812 kVA", "Available Now", "#147dff", "bolt"],
    ["Effective Capacity Gain", "+18%", "After Optimization", "#a855f7", "trend"],
    ["Deferred CAPEX Avoidance", "$1.24M", "Projected Value", "#f97316", "site"],
    ["Efficiency Gain Potential", "+6.2%", "Improvement", "#14b8a6", "arrows"],
    ["CO2 Reduction Potential", "41.2", "tons / year", "#65a30d", "leaf"],
  ] as const;

  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-full min-h-[682px] flex-col overflow-hidden px-3 py-2">
        <div className="flex h-[32px] items-center justify-between">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-slate-200">XECO Energy Intelligence Portal</div>
          <div className="flex items-center gap-2 text-[10px]">
            <ToolbarButton>Flex Tijuana</ToolbarButton>
            <ToolbarButton>May 12 - May 18, 2025</ToolbarButton>
            <ToolbarButton>Export Report</ToolbarButton>
            <ToolbarButton>Configure Alerts</ToolbarButton>
          </div>
        </div>
        <div className="mt-1 flex h-[64px] items-start justify-between">
          <div>
            <Breadcrumb items={["Electrical Network", "Capacity Detail", "Optimization Opportunities"]} />
            <h1 className="mt-2 text-[24px] font-light leading-none text-slate-100">Optimization Opportunities - Capacity</h1>
            <p className="mt-1 text-[10px] text-slate-400">Actionable opportunities to unlock usable capacity, improve utilization, and defer infrastructure costs.</p>
          </div>
          <ToolbarButton>Back to Capacity Detail</ToolbarButton>
        </div>
        <section className="mt-2 grid h-[78px] grid-cols-6 gap-2">
          {kpis.map(([label, value, detail, color, icon]) => <SimulateKpiCard color={color} detail={detail} icon={icon} key={label} label={label} value={value} />)}
        </section>
        <section className="mt-2 grid h-[32px] grid-cols-[180px_170px_190px_180px_130px_1fr] items-center gap-3 text-[9px]">
          {["May 12 - May 18, 2025", "All Feeders", "All Equipment Types", "All Priority Levels", "All Actions"].map((label) => <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left text-slate-300" key={label}>{label}<span className="float-right text-slate-500">⌄</span></button>)}
          <span className="text-slate-500">× Clear Filters</span>
        </section>
        <section className="mt-2 grid h-[305px] grid-cols-[1.58fr_0.9fr] gap-2">
          <DashboardPanel title="Optimization Opportunities (Ranked By Impact)" variant="enterprise"><OptimizationOpportunitiesTable /></DashboardPanel>
          <div className="grid grid-rows-[0.95fr_1fr] gap-2">
            <DashboardPanel title="AI Capacity Engine Insights" variant="enterprise"><OptimizationAiInsights /></DashboardPanel>
            <DashboardPanel title="Capacity Unlock Summary" variant="enterprise"><OptimizationUnlockSummary /></DashboardPanel>
          </div>
        </section>
        <section className="mt-2 grid h-[205px] grid-cols-[0.95fr_1fr_1.05fr] gap-2">
          <DashboardPanel title="Capacity Impact Waterfall (kVA)" variant="enterprise"><OptimizationWaterfall /></DashboardPanel>
          <DashboardPanel title="Financial Impact (Annual)" variant="enterprise"><OptimizationFinancialDonut /></DashboardPanel>
          <DashboardPanel title="Implementation Roadmap" variant="enterprise"><OptimizationRoadmap /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[40px] grid-cols-[1fr_1fr_1fr_1fr] gap-3">
          {["Generate Implementation Plan", "Simulate Capacity Expansion", "Export Engineering Report", "Push to Deployment Module"].map((label, index) => <button className={`rounded border px-3 text-[11px] ${index === 0 ? "border-[#05ff5e]/30 bg-[#05ff5e]/70 text-[#04111c]" : "border-cyan-300/12 bg-[#061421] text-slate-300"}`} key={label}>{label}</button>)}
        </section>
        <DashboardFooter updatedAt="May 18, 2025 10:15 AM" variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function OptimizationOpportunitiesTable() {
  const rows = [
    ["1", "Load Rebalancing on Feeder 4", "Capacity", "Feeder 4", "120", "High", "Low", "2.1 mo", "Ready", "#05ff5e", "tower"],
    ["2", "Transformer Load Redistribution", "Asset", "Main Transformer", "110", "High", "Medium", "3.2 mo", "Recommended", "#05ff5e", "grid"],
    ["3", "Phase Balancing Optimization", "Electrical", "Panel C", "65", "Medium", "Low", "1.6 mo", "Ready", "#05ff5e", "trend"],
    ["4", "Harmonic Load Correction", "PQ", "Feeder 2", "85", "Medium", "Medium", "4.0 mo", "Recommended", "#f97316", "bolt"],
    ["5", "Motor Efficiency Optimization", "Load", "Chiller Plant", "40", "Medium", "Medium", "5.1 mo", "Optional", "#147dff", "hex"],
    ["6", "Capacitor Bank Optimization", "Reactive", "Feeder 5", "30", "Low", "Low", "1.2 mo", "Optional", "#147dff", "site"],
  ] as const;
  return (
    <div className="h-full overflow-hidden text-[7.5px]">
      <div className="grid grid-cols-[36px_1.45fr_0.55fr_0.75fr_0.5fr_0.5fr_0.48fr_0.55fr_0.65fr_0.65fr] gap-2 border-b border-white/8 pb-1 text-slate-500">
        {["Priority", "Opportunity", "Type", "Location / Asset", "Capacity Gain", "Impact Level", "Effort", "Payback", "Status", "Action"].map((header) => <span key={header}>{header}</span>)}
      </div>
      <div className="space-y-1 py-1">{rows.map(([priority, opportunity, type, location, gain, impact, effort, payback, status, color, icon]) => <div className="grid grid-cols-[36px_1.45fr_0.55fr_0.75fr_0.5fr_0.5fr_0.48fr_0.55fr_0.65fr_0.65fr] items-center gap-2 border-b border-white/5 py-1 text-slate-300" key={opportunity}><span className="flex items-center gap-2"><i className="grid size-5 place-items-center rounded-full border text-[10px]" style={{ borderColor: color, color }}>{priority}</i></span><span className="grid grid-cols-[22px_1fr] items-center gap-2"><i style={{ color }}><AssetIcon kind={icon} /></i><span>{opportunity}</span></span><span>{type}</span><span>{location}</span><span>{gain}</span><span className={impact === "High" ? "text-red-400" : impact === "Medium" ? "text-amber-400" : "text-[#05ff5e]"}>{impact}</span><span className={effort === "Low" ? "text-[#05ff5e]" : "text-amber-400"}>{effort}</span><span>{payback}</span><span className={status === "Ready" || status === "Recommended" ? "text-[#05ff5e]" : "text-[#147dff]"}>{status}</span><button className="rounded border border-[#147dff]/40 px-2 py-1 text-[#147dff]">View Details</button></div>)}</div>
      <div className="mt-1 flex items-center justify-between text-[9px]"><span>Total Recoverable Capacity</span><span className="text-[14px] font-semibold text-[#05ff5e]">420 kVA</span></div>
    </div>
  );
}

function OptimizationAiInsights() {
  const rows = [["System operating at 73% utilization. Target range: 60% - 80%.", "#05ff5e", "check"], ["3 feeders exceed optimal load band (>80% utilization).", "#f97316", "bolt"], ["Transformer headroom underutilized by 18%.", "#147dff", "tower"], ["Phase imbalance detected in 2 zones impacting usable capacity.", "#a855f7", "hex"], ["Optimization actions can defer 650 kVA of new infrastructure.", "#65a30d", "leaf"]] as const;
  return <div className="space-y-2 text-[9px]">{rows.map(([text, color, icon]) => <div className="flex items-start gap-2" key={text}><span style={{ color }}><AssetIcon kind={icon} /></span><span>{text}</span></div>)}</div>;
}

function OptimizationUnlockSummary() {
  const rows = [["Load Rebalancing", "120 kVA (28%)", 92, "#05ff5e"], ["Transformer Optimization", "110 kVA (26%)", 84, "#05ff5e"], ["Phase Balancing", "65 kVA (15%)", 56, "#05ff5e"], ["Harmonic Correction", "85 kVA (20%)", 70, "#147dff"], ["Motor Efficiency", "40 kVA (9%)", 38, "#f97316"]] as const;
  return (
    <div className="h-full overflow-hidden text-[8px]">
      <div className="space-y-1.5">
        {rows.map(([label, value, width, color]) => <div className="grid grid-cols-[112px_1fr_70px] items-center gap-2" key={label}><span>{label}</span><span className="h-2.5 rounded bg-slate-800"><i className="block h-full rounded" style={{ backgroundColor: color, width: `${width}%` }} /></span><span className="text-right">{value}</span></div>)}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5"><span>Total Recoverable Capacity</span><span className="font-semibold text-[#05ff5e]">420 kVA</span></div>
    </div>
  );
}

function OptimizationWaterfall() {
  return (
    <svg className="h-full w-full" viewBox="0 0 500 180" preserveAspectRatio="none" aria-hidden="true">
      {[35, 70, 105, 140].map((y) => <line key={y} x1="35" x2="490" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
      {([
        ["Installed", 55, 52, 46, "#94a3b8", "3,250"],
        ["Used", 130, 52, 92, "#ef4444", "-2,438"],
        ["Available", 205, 92, 38, "#147dff", "812"],
        ["Recovery", 300, 64, 34, "#65a30d", "420"],
        ["Effective", 410, 38, 106, "#05ff5e", "3,670"],
      ] as Array<[string, number, number, number, string, string]>).map(([label, x, y, h, color, value]) => <g key={label}><rect fill={color} height={h} rx="2" width="45" x={x} y={y} /><text fill="#cbd5e1" fontSize="9" textAnchor="middle" x={x + 22} y={y - 5}>{value}</text><text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x + 22} y="168">{label}</text></g>)}
      {[4000, 3000, 2000, 1000, 0].map((label, index) => <text fill="#94a3b8" fontSize="8" key={label} textAnchor="end" x="28" y={36 + index * 34}>{label}</text>)}
    </svg>
  );
}

function OptimizationFinancialDonut() {
  return (
    <div className="grid h-full grid-cols-[118px_1fr] items-center gap-4 text-[9px]">
      <div className="relative size-[108px] rounded-full p-[30px]" style={{ background: "conic-gradient(#65a30d 0 42%, #147dff 42% 65%, #a855f7 65% 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="whitespace-nowrap text-[11px] leading-none text-white">$184,200</div><div className="mt-0.5 whitespace-nowrap text-[5.5px] leading-none text-slate-400">Total Annual Value</div></div></div></div>
      <div className="space-y-2">{[["Demand Optimization Savings", "$78,000 (42%)", "#65a30d"], ["Loss Reduction Benefit", "$42,000 (23%)", "#147dff"], ["Efficiency Gain Value", "$64,200 (35%)", "#a855f7"]].map(([label, value, color]) => <div className="grid grid-cols-[1fr_86px] gap-2" key={label}><span><i className="mr-2 inline-block size-2 rounded-sm" style={{ backgroundColor: color }} />{label}</span><span className="text-right">{value}</span></div>)}<div className="pt-4 text-right text-[#05ff5e]">Deferred CAPEX Avoidance: $1,240,000</div></div>
    </div>
  );
}

function OptimizationRoadmap() {
  const phases = [["Phase 1", "0 - 30 Days", "120 - 180 kVA Unlock", "#05ff5e"], ["Phase 2", "30 - 90 Days", "180 - 260 kVA Unlock", "#f97316"], ["Phase 3", "90 - 180 Days", "420 kVA Total Unlock", "#147dff"]] as const;
  return <div className="grid h-full grid-cols-3 gap-2 text-center text-[8px]">{phases.map(([title, days, value, color]) => <div className="rounded border p-2" style={{ borderColor: `${color}66`, color }} key={title}><div className="text-[12px] font-semibold uppercase">{title}</div><div>{days}</div><div className="my-2 space-y-0.5 text-left text-slate-300"><div>• Load Rebalancing</div><div>• Phase Balancing</div><div>• System Tuning</div></div><div className="text-[13px] font-semibold">{value}</div></div>)}</div>;
}

function ElectricalCapacityDetailShell() {
  const kpis = [
    ["Total Capacity Available", "2.18 MW", "27% of System", "#147dff", "gauge"],
    ["Total Connected Load", "5.82 MW", "+4.3% vs Last 7 Days", "#05ff5e", "trend"],
    ["Total Apparent Power", "6.41 MVA", "Power Factor 0.91", "#a855f7", "gauge"],
    ["Capacity Utilization", "73%", "Good", "#f97316", "grid"],
    ["Reserve Capacity", "2.18 MW", "Enough", "#14b8a6", "site"],
    ["Projected Peak Utilization", "81%", "May 22, 2:00 PM", "#eab308", "bolt"],
  ] as const;

  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin/electrical-network">
      <div className="flex h-full min-h-[682px] flex-col overflow-hidden px-3 py-2">
        <div className="flex h-[32px] items-center justify-between">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-slate-200">XECO Energy Intelligence Portal</div>
          <div className="flex items-center gap-2 text-[10px]">
            <ToolbarButton>Flex Tijuana</ToolbarButton>
            <ToolbarButton>May 12 - May 18, 2025</ToolbarButton>
            <ToolbarButton>Export Report</ToolbarButton>
            <ToolbarButton>Configure Alerts</ToolbarButton>
          </div>
        </div>
        <div className="mt-1 flex h-[64px] items-start justify-between">
          <div>
            <Breadcrumb items={["Electrical Network", "Capacity Detail"]} />
            <h1 className="mt-2 text-[24px] font-light leading-none text-slate-100">Capacity Detail</h1>
            <p className="mt-1 text-[10px] text-slate-400">Analyze capacity availability, utilization, and reserve margins across your electrical network.</p>
          </div>
          <ToolbarButton>Back to Overview</ToolbarButton>
        </div>
        <section className="mt-2 grid h-[78px] grid-cols-6 gap-2">
          {kpis.map(([label, value, detail, color, icon]) => <SimulateKpiCard color={color} detail={detail} icon={icon} key={label} label={label} value={value} />)}
        </section>
        <section className="mt-2 grid h-[32px] grid-cols-[190px_170px_190px_190px_1fr] items-center gap-3 text-[9px]">
          {["May 12 - May 18, 2025", "All Feeders", "All Equipment Types", "All Voltage Levels"].map((label) => <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left text-slate-300" key={label}>{label}<span className="float-right text-slate-500">⌄</span></button>)}
          <span className="text-slate-500">× Clear Filters</span>
        </section>
        <section className="mt-2 grid h-[200px] grid-cols-[1.25fr_1fr_1.12fr] gap-2">
          <DashboardPanel title="Capacity Utilization Trend (7 Days)" variant="enterprise"><DetailUtilizationTrend /></DashboardPanel>
          <DashboardPanel title="Capacity Distribution By Voltage Level" variant="enterprise"><DetailVoltageDonut /></DashboardPanel>
          <DashboardPanel title="Capacity Summary" variant="enterprise"><DetailCapacitySummary /></DashboardPanel>
        </section>
        <section className="mt-2 grid h-[280px] grid-cols-[1.35fr_1.35fr] gap-2">
          <DashboardPanel title="Capacity By Feeder" variant="enterprise"><DetailFeederTable /></DashboardPanel>
          <div className="grid grid-rows-[1fr_1fr] gap-2">
            <DashboardPanel title="Capacity Utilization By Time Of Day (Average)" variant="enterprise"><DetailHeatmap /></DashboardPanel>
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <DashboardPanel title="Capacity Forecast (Next 7 Days)" variant="enterprise"><DetailForecastTable /></DashboardPanel>
              <DashboardPanel title="Capacity Insights" variant="enterprise"><DetailCapacityInsights /></DashboardPanel>
            </div>
          </div>
        </section>
        <DashboardFooter updatedAt="May 18, 2025 10:15 AM" variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function DetailUtilizationTrend() {
  return <LineChart legend={["Utilization (%)", "Warning (80%)", "Critical (90%)"]} maxLabel="100%" points={["0,92 45,86 90,74 135,76 180,82 225,72 270,78 315,90 360,84 405,72 450,62 500,54", "0,48 500,48", "0,30 500,30"]} />;
}

function DetailVoltageDonut() {
  return (
    <div className="grid h-full grid-cols-[126px_1fr] items-center gap-4 text-[9px]">
      <div className="relative size-[116px] rounded-full p-[28px]" style={{ background: "conic-gradient(#147dff 0 40%, #65a30d 40% 71%, #a855f7 71% 94%, #f97316 94% 100%)" }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[18px] leading-none text-white">8.00 MW</div><div className="text-[7px] text-slate-400">Total Capacity</div></div></div>
      </div>
      <div className="space-y-2">{[["480 V", "3.20 MW", "(40%)", "#147dff"], ["69 kV", "2.50 MW", "(31%)", "#65a30d"], ["115 kV", "1.80 MW", "(23%)", "#a855f7"], ["Other", "0.50 MW", "(6%)", "#f97316"]].map(([label, value, pct, color]) => <div className="grid grid-cols-[1fr_70px_42px] gap-2" key={label}><span><i className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><span>{value}</span><span>{pct}</span></div>)}</div>
    </div>
  );
}

function DetailCapacitySummary() {
  const rows = [["Total Installed Capacity", "8.00 MW", "#cbd5e1"], ["Total Connected Load", "5.82 MW", "#cbd5e1"], ["Total Apparent Power", "6.41 MVA", "#cbd5e1"], ["Capacity Utilization", "73%", "#cbd5e1"], ["Reserve Capacity", "2.18 MW", "#cbd5e1"], ["Reserve Capacity %", "27%", "#cbd5e1"], ["Projected Peak Load", "6.50 MW", "#cbd5e1"], ["Projected Peak Utilization", "81%", "#cbd5e1"], ["Capacity Status", "Good", "#05ff5e"]] as const;
  return <div className="space-y-1 text-[8px] leading-none">{rows.map(([label, value, color]) => <div className="flex items-center justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><span className="font-semibold" style={{ color }}>{value}</span></div>)}</div>;
}

function DetailFeederTable() {
  return <SimpleTable headers={["Feeder", "Voltage", "Installed Capacity (MW)", "Connected Load (MW)", "Utilization (%)", "Reserve Capacity (MW)", "Status"]} rows={[["Feeder 4", "480 V", "1.50", "1.42", "95%", "0.08", "Warning"], ["Feeder 2", "480 V", "1.25", "0.99", "79%", "0.26", "Good"], ["Feeder 3", "480 V", "1.25", "0.81", "65%", "0.44", "Good"], ["Feeder 1", "69 kV", "2.50", "1.88", "75%", "0.62", "Good"], ["Feeder 5", "480 V", "1.00", "0.58", "58%", "0.42", "Good"], ["Utility Service", "115 kV", "1.50", "0.92", "61%", "0.58", "Good"], ["TOTAL", "", "8.00", "5.82", "73%", "2.18", "Good"]]} />;
}

function DetailHeatmap() {
  const rows = ["12 AM", "6 AM", "12 PM", "6 PM"];
  const cols = ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];
  const colors = ["#65a30d", "#84cc16", "#eab308", "#f97316", "#ef4444"];
  return (
    <div className="grid h-full grid-cols-[34px_1fr_34px] gap-2 text-[7px]">
      <div className="pt-4 space-y-2.5 text-right text-slate-400">{rows.map((row) => <div key={row}>{row}</div>)}</div>
      <div>
        <div className="grid grid-cols-8 gap-1 pb-1 text-center text-slate-400">{cols.map((col) => <span key={col}>{col}</span>)}</div>
        <div className="grid grid-cols-8 gap-1">{Array.from({ length: 32 }, (_, index) => <span className="h-[14px] rounded-sm border border-white/5" key={index} style={{ backgroundColor: colors[(index + Math.floor(index / 5)) % colors.length] }} />)}</div>
      </div>
      <div className="pt-4 space-y-1.5 text-slate-400"><div>100%</div><div>75%</div><div>50%</div><div>25%</div><div>0%</div></div>
    </div>
  );
}

function DetailForecastTable() {
  return <SimpleTable headers={["Date", "Projected Peak Load (MW)", "Projected Utilization (%)", "Status"]} rows={[["May 19, Mon", "6.20", "78%", "Good"], ["May 20, Tue", "6.35", "79%", "Good"], ["May 21, Wed", "6.42", "80%", "Warning"], ["May 22, Thu", "6.50", "81%", "Warning"], ["May 23, Fri", "6.38", "80%", "Warning"], ["May 24, Sat", "6.10", "76%", "Good"], ["May 25, Sun", "5.95", "74%", "Good"]]} />;
}

function DetailCapacityInsights() {
  const rows = [["Feeder 4 is operating at 95% utilization. Consider load balancing or capacity increase.", "#f97316", "bolt"], ["Overall system has 2.18 MW reserve capacity (27%).", "#05ff5e", "check"], ["Peak utilization of 81% expected on May 22 at 2:00 PM.", "#147dff", "site"], ["Capacitor banks and PF improvement can increase effective capacity by up to 8%.", "#65a30d", "leaf"]] as const;
  return <div className="space-y-2 text-[8.5px]">{rows.map(([text, color, icon]) => <div className="flex items-start gap-2" key={text}><span style={{ color }}><AssetIcon kind={icon} /></span><span>{text}</span></div>)}<div className="pt-1 text-right text-[#05ff5e]">View Optimization Opportunities {"->"}</div></div>;
}

function SimulateCapacityExpansion() {
  return (
    <>
      <section className="mt-2 grid h-[215px] grid-cols-[0.75fr_1.45fr_1.15fr] gap-2">
        <DashboardPanel title="1. Scenario Configuration" variant="enterprise">
          <MetricList rows={[["Strategy", "Balanced Optimization"], ["Target Unlock", "650 kVA"], ["Load Rebalancing", "Enabled"], ["Power Factor Optimization", "Enabled"], ["Harmonic Reduction", "Enabled"], ["Motor Efficiency Optimization", "Enabled"], ["Time Horizon", "12 months"]]} />
        </DashboardPanel>
        <DashboardPanel title="2. Simulation Results Summary" variant="enterprise">
          <Waterfall />
        </DashboardPanel>
        <DashboardPanel title="3. Financial Impact Analysis (Annual)" variant="enterprise">
          <MetricList rows={[["Demand Charge Reduction", "$92,400"], ["Loss Reduction Savings", "$48,600"], ["Efficiency Gains", "$73,800"], ["Total Annual Savings", "$214,800"], ["Investment Required", "$0"], ["Net Annual Benefit", "$214,800"], ["Return On Optimization", "100%+"]]} />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[160px] grid-cols-[1fr_1fr_0.95fr] gap-2">
        <DashboardPanel title="Capacity By Voltage Level" variant="enterprise">
          <DonutWithLegend value="3.25 MW" subtitle="Total" rows={[["480 V", "1.45 MW (44.6%)", "#147dff"], ["69 kV", "1.20 MW (36.9%)", "#65a30d"], ["115 kV", "0.45 MW (13.8%)", "#7c3aed"], ["Other", "0.15 MW (4.6%)", "#f97316"]]} />
        </DashboardPanel>
        <DashboardPanel title="Utilization Profile (Average)" variant="enterprise">
          <LineChart compact legend={["Current", "Simulated", "Optimal"]} maxLabel="100%" points={["0,42 70,48 140,52 210,46 280,40 350,44 420,50 500,46", "0,62 70,68 140,72 210,66 280,60 350,64 420,70 500,66"]} />
        </DashboardPanel>
        <DashboardPanel title="4. Scenario Comparison" variant="enterprise">
          <SimpleTable headers={["Scenario", "Capacity", "Increase", "Annual", "Payback"]} rows={[["Conservative", "2.95 MW", "+350 kVA", "$112,200", "5.1 mo"], ["Balanced", "3.25 MW", "+650 kVA", "$214,800", "Immediate"], ["Aggressive", "3.60 MW", "+1,000 kVA", "$312,600", "2.3 mo"]]} />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[125px] grid-cols-[1.05fr_0.85fr_0.9fr_0.9fr] gap-2">
        <DashboardPanel title="AI Insight" variant="enterprise">
          <p className="text-[9px] leading-relaxed text-slate-300">The Balanced Optimization scenario provides the best combination of capacity increase and financial return without requiring infrastructure investment.</p>
        </DashboardPanel>
        <DashboardPanel title="Top Impact Drivers" variant="enterprise">
          <BarRows rows={[["Load Rebalancing", "220", "kVA", "#65a30d"], ["Power Factor", "150", "kVA", "#65a30d"], ["Harmonic Reduction", "120", "kVA", "#65a30d"], ["Transformer Redistribution", "110", "kVA", "#147dff"]]} />
        </DashboardPanel>
        <DashboardPanel title="Assumptions" variant="enterprise">
          <Recommendations items={["Load growth rate: 2% annually", "Power factor target: 0.95", "Harmonic compliance: IEEE 519", "Utility rate escalation: 3% annually"]} />
        </DashboardPanel>
        <DashboardPanel title="Download & Export" variant="enterprise">
          <MetricGrid rows={[["Simulation Report", "PDF"], ["Financial Analysis", "Excel"], ["Engineering Summary", "PDF"]]} />
        </DashboardPanel>
      </section>
    </>
  );
}

function OptimizationOpportunities() {
  return (
    <>
      <section className="mt-2 grid h-[250px] grid-cols-[1.6fr_0.95fr] gap-2">
        <DashboardPanel title="Optimization Opportunities (Ranked By Impact)" variant="enterprise">
          <SimpleTable headers={["Priority", "Opportunity", "Type", "Location / Asset", "Gain", "Impact", "Effort", "Payback", "Status"]} rows={[["1", "Load Rebalancing on Feeder 4", "Capacity", "Feeder 4", "120", "High", "Low", "2.1 mo", "Ready"], ["2", "Transformer Load Redistribution", "Asset", "Main Transformer", "110", "High", "Medium", "3.2 mo", "Recommended"], ["3", "Phase Balancing Optimization", "Electrical", "Panel C", "65", "Medium", "Low", "1.6 mo", "Ready"], ["4", "Harmonic Load Correction", "PQ", "Feeder 2", "85", "Medium", "Medium", "4.0 mo", "Recommended"], ["5", "Motor Efficiency Optimization", "Load", "Chiller Plant", "40", "Medium", "Medium", "5.1 mo", "Optional"], ["6", "Capacitor Bank Optimization", "Reactive", "Feeder 5", "30", "Low", "Low", "1.2 mo", "Optional"]]} />
          <div className="mt-3 text-right text-[12px] font-semibold text-[#05ff5e]">Total Recoverable Capacity 420 kVA</div>
        </DashboardPanel>
        <div className="space-y-2 overflow-hidden">
          <DashboardPanel title="AI Capacity Engine Insights" variant="enterprise">
            <Recommendations items={["System operating at 73% utilization. Target range: 60% - 80%.", "3 feeders exceed optimal load band (>80% utilization).", "Transformer headroom underutilized by 18%.", "Phase imbalance detected in 2 zones impacting usable capacity.", "Optimization actions can defer 650 kVA of new infrastructure."]} />
          </DashboardPanel>
          <DashboardPanel title="Capacity Unlock Summary" variant="enterprise">
            <BarRows rows={[["Load Rebalancing", "120", "kVA (28%)", "#65a30d"], ["Transformer Optimization", "110", "kVA (26%)", "#65a30d"], ["Phase Balancing", "65", "kVA (15%)", "#65a30d"], ["Harmonic Correction", "85", "kVA (20%)", "#147dff"], ["Motor Efficiency", "40", "kVA (9%)", "#f97316"]]} />
          </DashboardPanel>
        </div>
      </section>
      <section className="mt-2 grid h-[190px] grid-cols-[1fr_1fr_1.05fr] gap-2">
        <DashboardPanel title="Capacity Impact Waterfall (kVA)" variant="enterprise">
          <Waterfall />
        </DashboardPanel>
        <DashboardPanel title="Financial Impact (Annual)" variant="enterprise">
          <DonutWithLegend value="$184,200" subtitle="Total Annual Value" rows={[["Demand Optimization Savings", "$78,000 (42%)", "#65a30d"], ["Loss Reduction Benefit", "$42,000 (23%)", "#147dff"], ["Efficiency Gain Value", "$64,200 (35%)", "#a855f7"]]} />
        </DashboardPanel>
        <DashboardPanel title="Implementation Roadmap" variant="enterprise">
          <div className="grid h-full grid-cols-3 gap-2 text-center text-[9px]">
            <StatusTile label="0 - 30 days | 120 - 180 kVA unlock" value="Phase 1" tone="green" />
            <StatusTile label="30 - 90 days | 180 - 260 kVA unlock" value="Phase 2" tone="red" />
            <StatusTile label="90 - 180 days | 420 kVA total unlock" value="Phase 3" tone="green" />
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function ElectricalCapacityDetail() {
  return (
    <>
      <div className="mt-2 flex h-[28px] items-center gap-4 text-[9px] text-slate-300">
        {["May 12 - May 18, 2025", "All Feeders", "All Equipment Types", "All Voltage Levels"].map((item) => (
          <ToolbarButton key={item}>{item}</ToolbarButton>
        ))}
        <span className="text-slate-500">x Clear Filters</span>
      </div>
      <section className="mt-2 grid h-[165px] grid-cols-[1.25fr_1fr_1.15fr] gap-2">
        <DashboardPanel title="Capacity Utilization Trend (7 Days)" variant="enterprise">
          <LineChart legend={["Utilization (%)", "Warning (80%)", "Critical (90%)"]} maxLabel="100%" points={["0,88 45,82 90,70 135,72 180,78 225,68 270,74 315,86 360,80 405,68 450,58 500,50", "0,42 500,42", "0,25 500,25"]} />
        </DashboardPanel>
        <DashboardPanel title="Capacity Distribution By Voltage Level" variant="enterprise">
          <DonutWithLegend value="8.00 MW" subtitle="Total Capacity" rows={[["480 V", "3.20 MW (40%)", "#147dff"], ["69 kV", "2.50 MW (31%)", "#65a30d"], ["115 kV", "1.80 MW (23%)", "#a855f7"], ["Other", "0.50 MW (6%)", "#f97316"]]} />
        </DashboardPanel>
        <DashboardPanel title="Capacity Summary" variant="enterprise">
          <MetricList rows={[["Total Installed Capacity", "8.00 MW"], ["Total Connected Load", "5.82 MW"], ["Total Apparent Power", "6.41 MVA"], ["Capacity Utilization", "73%"], ["Reserve Capacity", "2.18 MW"], ["Reserve Capacity %", "27%"], ["Projected Peak Load", "6.50 MW"], ["Projected Peak Utilization", "81%"], ["Capacity Status", "Good"]]} />
        </DashboardPanel>
      </section>
      <section className="mt-2 grid h-[255px] grid-cols-[1.25fr_1.35fr] gap-2">
        <DashboardPanel title="Capacity By Feeder" variant="enterprise">
          <SimpleTable headers={["Feeder", "Voltage", "Installed", "Connected", "Utilization", "Reserve", "Status"]} rows={[["Feeder 4", "480 V", "1.50", "1.42", "95%", "0.08", "Warning"], ["Feeder 2", "480 V", "1.25", "0.99", "79%", "0.26", "Good"], ["Feeder 3", "480 V", "1.25", "0.81", "65%", "0.44", "Good"], ["Feeder 1", "69 kV", "2.50", "1.88", "75%", "0.62", "Good"], ["Feeder 5", "480 V", "1.00", "0.58", "58%", "0.42", "Good"], ["Utility Service", "115 kV", "1.50", "0.92", "61%", "0.58", "Good"], ["TOTAL", "", "8.00", "5.82", "73%", "2.18", "Good"]]} />
        </DashboardPanel>
        <div className="grid grid-rows-[1fr_1fr] gap-2">
          <DashboardPanel title="Capacity Utilization By Time Of Day (Average)" variant="enterprise">
            <Heatmap />
          </DashboardPanel>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <DashboardPanel title="Capacity Forecast (Next 7 Days)" variant="enterprise">
              <SimpleTable headers={["Date", "Peak", "Projected", "Status"]} rows={[["May 19, Mon", "6.20", "78%", "Good"], ["May 20, Tue", "6.35", "79%", "Good"], ["May 21, Wed", "6.42", "80%", "Warning"], ["May 22, Thu", "6.50", "81%", "Warning"], ["May 23, Fri", "6.38", "80%", "Warning"], ["May 24, Sat", "6.10", "76%", "Good"]]} />
            </DashboardPanel>
            <DashboardPanel title="Capacity Insights" variant="enterprise">
              <Recommendations items={["Feeder 4 is operating at 95% utilization. Consider load balancing.", "Overall system has 2.18 MW reserve capacity (27%).", "Peak utilization of 81% expected on May 22 at 2:00 PM.", "Capacitor banks and PF improvement can increase capacity by up to 8%."]} />
            </DashboardPanel>
          </div>
        </div>
      </section>
    </>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="text-slate-400">
      {items.map((item, index) => (
        <span key={item}>
          {index ? <span className="mx-1 text-slate-600">›</span> : null}
          <span className={index === items.length - 1 ? "text-[#05ff5e]" : ""}>{item}</span>
        </span>
      ))}
    </div>
  );
}

function ToolbarButton({ children }: { children: ReactNode }) {
  return <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-[9px] text-slate-300">{children}</button>;
}

function LineChart({ compact = false, legend, maxLabel, points, showDots = true, wide = false }: { compact?: boolean; legend: string[]; maxLabel: string; points: string[]; showDots?: boolean; wide?: boolean }) {
  const xLabels = compact ? ["May 12", "May 14", "May 16", "May 18"] : ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];

  return (
    <div className={compact ? "h-[74px]" : "h-full"}>
      <div className={wide ? "mb-2 flex gap-4 overflow-hidden text-[8px] text-slate-400" : "mb-1 flex gap-2 overflow-hidden text-[7px] text-slate-400"}>
        {legend.map((label, index) => <span className="whitespace-nowrap" key={label}><i className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ backgroundColor: index === 0 ? "#05ff5e" : index === 1 ? "#29b6f6" : "#94a3b8" }} />{label}</span>)}
      </div>
      <div className={wide ? "grid grid-cols-[42px_1fr_64px] gap-2" : "grid grid-cols-[32px_1fr_54px] gap-1"}>
        <div className="flex flex-col justify-between text-right text-[8px] text-slate-500"><span>{maxLabel}</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
        <div className="min-w-0">
          <svg className={compact ? "h-[56px] w-full" : wide ? "h-[190px] w-full" : "h-[124px] w-full"} viewBox="0 0 500 150" preserveAspectRatio="none" aria-hidden="true">
            {[28, 56, 84, 112].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
            {points.map((point, index) => {
              const color = index === 0 ? "#05ff5e" : index === 1 ? "#29b6f6" : "#94a3b8";
              const densePoints = densifyChartPoints(point, 4);
              return (
                <g key={point}>
                  <polyline fill="none" points={densePoints.map(([x, y]) => `${x},${y}`).join(" ")} stroke={color} strokeDasharray={index > 1 ? "4 4" : undefined} strokeWidth="2" />
                  {showDots ? densePoints.map(([x, y]) => <circle cx={x} cy={y} fill="#061521" key={`${x}-${y}`} r={index > 1 ? "1.6" : "2.4"} stroke={color} strokeWidth={index > 1 ? "1.4" : "1.8"} />) : null}
                </g>
              );
            })}
            {xLabels.map((label, index) => <text fill="#94a3b8" fontSize="13" key={label} textAnchor={index === 0 ? "start" : index === xLabels.length - 1 ? "end" : "middle"} x={index * (500 / (xLabels.length - 1))} y="138">{label}</text>)}
          </svg>
        </div>
        <div className="flex flex-col justify-between text-[8px] font-semibold"><span className="text-slate-300">3,250</span><span className="text-[#05ff5e]">2,438</span><span className="text-[#29b6f6]">812</span></div>
      </div>
    </div>
  );
}

function parseChartPoints(points: string) {
  return points.split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return [x, y] as [number, number];
  }).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

function densifyChartPoints(points: string, factor: number) {
  const parsed = parseChartPoints(points);
  if (parsed.length < 2 || factor <= 1) {
    return parsed;
  }

  const dense: [number, number][] = [];
  for (let index = 0; index < parsed.length - 1; index += 1) {
    const [x1, y1] = parsed[index];
    const [x2, y2] = parsed[index + 1];
    dense.push([x1, y1]);
    for (let step = 1; step < factor; step += 1) {
      const ratio = step / factor;
      dense.push([
        Number((x1 + (x2 - x1) * ratio).toFixed(2)),
        Number((y1 + (y2 - y1) * ratio).toFixed(2)),
      ]);
    }
  }
  dense.push(parsed[parsed.length - 1]);

  return dense;
}

function BeforeAfterBars({ data }: { data: CapacityRecoveryBreakdownData }) {
  const before = parseRecoveryValue(data.beforePeak);
  const after = parseRecoveryValue(data.afterPeak);
  const recovered = Math.max(0, before - after);
  const max = Math.max(before, after, 1);
  const beforeHeight = Math.max(12, before / max * 148);
  const afterHeight = Math.max(12, after / max * 148);

  return (
    <div className="grid h-full grid-cols-[1fr_82px_1fr] items-end text-center text-[10px]">
      <div><div className="mx-auto w-[74px] bg-gradient-to-t from-slate-700 0 62%, #ef4444 62% 100%" style={{ height: beforeHeight }} /><div className="mt-2">Before ECBS</div><b>{data.beforePeak}</b></div>
      <div className="pb-[92px] text-[10px] text-[#05ff5e]">{formatRecoveryNumber(recovered)} kVA<br />Recovered →</div>
      <div><div className="mx-auto w-[74px] bg-gradient-to-t from-slate-700 0 75%, #05ff5e 75% 100%" style={{ height: afterHeight }} /><div className="mt-2">After ECBS</div><b>{data.afterPeak}</b></div>
    </div>
  );
}

function RecoveryEventsLog({ data }: { data: CapacityRecoveryBreakdownData }) {
  return (
    <div className="h-full overflow-y-auto pr-1 text-[9px]">
      <div className="grid grid-cols-[112px_160px_112px_72px_1fr] pb-1.5 text-slate-500">
        {["Date / Time", "Event Type", "System", "Recovered", "Impact"].map((header) => <span key={header}>{header}</span>)}
      </div>
      {!data.eventRows.length ? (
        <div className="mt-3 rounded border border-amber-400/25 bg-amber-500/8 p-3 text-center text-amber-200">No recovery event log source was found in tracking.</div>
      ) : null}
      {data.eventRows.map((row) => (
        <div className="grid grid-cols-[112px_160px_112px_72px_1fr] items-center border-t border-white/5 py-1.5" key={`${row.date}-${row.event}`}>
          <span className="text-slate-300">{row.date}</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <i className="grid size-5 shrink-0 place-items-center rounded-full border bg-[#061421] text-[10px] not-italic" style={{ borderColor: row.color, color: row.color }}>{row.icon}</i>
            {row.event}
          </span>
          <span className="text-slate-300">{row.system}</span>
          <span className="font-semibold text-[#05ff5e]">{row.recovered}</span>
          <span className="text-slate-400">{row.impact}</span>
        </div>
      ))}
      <a className="mt-1.5 block text-[9px] text-[#05ff5e]" href="/enterprise/capacity-intelligence/capacity-inteligence-capacity-recovery-impact-recovery-breakdown-screen">View Full Recovery Events →</a>
    </div>
  );
}

function RecoveryNoData({ message }: { message: string }) {
  return <div className="grid h-full place-items-center rounded border border-amber-400/25 bg-amber-500/8 p-3 text-center text-[9px] leading-relaxed text-amber-200">{message || "No Data"}</div>;
}

function recoveryPoints(values: number[], max: number) {
  const lastIndex = Math.max(values.length - 1, 1);
  return values.map((value, index) => {
    const x = index / lastIndex * 480;
    const y = 132 - value / max * 108;
    return `${x.toFixed(1)},${Math.max(24, Math.min(132, y)).toFixed(1)}`;
  }).join(" ");
}

function parseRecoveryValue(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRecoveryNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: value >= 100 ? 0 : 1 });
}

function DonutWithLegend({ rows, subtitle, value }: { rows: [string, string, string][]; subtitle: string; value: string }) {
  const colors = rows.map((row) => row[2]);
  const gradient = colors.map((color, index) => `${color} ${index * (100 / colors.length)}% ${(index + 1) * (100 / colors.length)}%`).join(", ");
  return (
    <div className="grid h-full grid-cols-[118px_1fr] items-start gap-3 overflow-hidden pt-1">
      <div className="relative size-[112px] rounded-full p-[20px]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center">
          <div><div className="whitespace-nowrap text-[18px] leading-none text-white">{value}</div><div className="whitespace-nowrap text-[7px] leading-none text-slate-400">{subtitle}</div></div>
        </div>
      </div>
      <div className="min-w-0 space-y-1 pt-2 text-[8px]">
        {rows.map(([label, valueText, color]) => <div className="grid grid-cols-[82px_1fr] items-center gap-2" key={label}><span className="whitespace-nowrap"><i className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span><span className="whitespace-nowrap text-right text-slate-300">{valueText}</span></div>)}
      </div>
    </div>
  );
}

function BarRows({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <div className="space-y-3 text-[10px]">
      {rows.map(([label, value, suffix, color]) => <div className="grid grid-cols-[118px_1fr_64px] items-center gap-3" key={label}><span className="truncate text-slate-300">{label}</span><span className="h-2.5 rounded bg-slate-800"><span className="block h-full rounded" style={{ width: `${Math.min(100, parseRecoveryValue(value) || 70)}%`, backgroundColor: color }} /></span><span className="text-right text-slate-400">{value}{suffix ? ` ${suffix}` : ""}</span></div>)}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-left text-[8.5px]">
      <thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-1 font-medium" key={header}>{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={index}>{row.map((cell, cellIndex) => <td className={cellIndex === 0 ? "py-[5px] text-slate-200" : "py-[5px] text-slate-300"} key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

function StatusTile({ label, tone, value }: { label: string; tone: "green" | "red"; value: string }) {
  const color = tone === "green" ? "#84cc16" : "#ef4444";
  return (
    <div className="grid h-full grid-cols-[42px_1fr] items-center gap-3 rounded border border-cyan-300/12 bg-[#07131f] p-3 text-left">
      <div className="grid size-9 place-items-center rounded-full border bg-[#061421] shadow-[0_0_14px_currentColor]" style={{ borderColor: color, color }}>
        <RecoveryIcon kind="shield" />
      </div>
      <div>
        <div className={tone === "green" ? "whitespace-nowrap text-[18px] leading-none text-[#05ff5e]" : "whitespace-nowrap text-[18px] leading-none text-red-400"}>{value}</div>
        <div className="mt-1 text-[8px] uppercase leading-[0.95] text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function MetricGrid({ rows }: { rows: [string, string][] }) {
  return <div className="grid h-full grid-cols-3 gap-2 text-[9px]">{rows.map(([label, value]) => <MetricBlock key={label} label={label} value={value} />)}</div>;
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  const iconConfig = recoverySummaryIconConfig(label);
  return (
    <div className="grid grid-cols-[30px_1fr] items-center gap-2 rounded border border-cyan-300/12 bg-[#07131f]/80 p-2">
      <div className="grid size-7 place-items-center rounded-full border bg-[#061421] shadow-[0_0_12px_currentColor]" style={{ borderColor: iconConfig.color, color: iconConfig.color }}>
        <RecoveryIcon kind={iconConfig.kind} />
      </div>
      <div>
        <div className="text-[14px] font-semibold text-[#05ff5e]">{value}</div>
        <div className="mt-0.5 text-[7px] leading-tight text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function recoverySummaryIconConfig(label: string) {
  if (label.includes("Maximum")) return { color: "#05ff5e", kind: "arrows" as const };
  if (label.includes("Average")) return { color: "#84cc16", kind: "bars" as const };
  if (label.includes("Consistency")) return { color: "#147dff", kind: "check" as const };
  if (label.includes("Peak")) return { color: "#a855f7", kind: "bars" as const };
  if (label.includes("Overload")) return { color: "#f59e0b", kind: "shield" as const };
  return { color: "#84cc16", kind: "check" as const };
}

function MetricList({ rows }: { rows: [string, string][] }) {
  return <div className="space-y-1.5 text-[9px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><span className="font-semibold text-slate-100">{value}</span></div>)}</div>;
}

function Recommendations({ items }: { items: string[] }) {
  return <div className="space-y-2 text-[9px] text-slate-300">{items.map((item) => <div key={item}><span className="mr-2 text-[#05ff5e]">●</span>{item}</div>)}</div>;
}

function Heatmap() {
  return <div className="grid grid-cols-7 gap-1">{Array.from({ length: 49 }).map((_, index) => <span className="h-4 rounded-sm" key={index} style={{ backgroundColor: index % 9 > 4 ? "#ef4444" : index % 5 > 2 ? "#f59e0b" : "#65a30d", opacity: 0.45 + (index % 4) * 0.13 }} />)}</div>;
}

function AssetTree() {
  const rows: [number, AssetIconKind, string, string, string, boolean?][] = [
    [0, "site", "Entire Site", "3,250 kVA", "75%", true],
    [1, "tower", "Main Transformer", "1,500 kVA", "75%", true],
    [2, "hex", "Primary", "1,500 kVA", "75%"],
    [2, "hex", "Secondary", "1,500 kVA", "75%"],
    [1, "grid", "Main Switchgear", "1,200 kVA", "75%", true],
    [1, "bolt", "Feeders", "750 kVA", "72%", true],
    [2, "hex", "Feeder A", "250 kVA", "72%"],
    [2, "hex", "Feeder B", "250 kVA", "72%"],
    [2, "hex", "Feeder C", "250 kVA", "70%"],
    [1, "grid", "Distribution Panels", "400 kVA", "80%", true],
    [2, "hex", "DP-1 Manufacturing", "150 kVA", "82%"],
    [2, "hex", "DP-2 HVAC Systems", "120 kVA", "78%"],
    [2, "hex", "DP-3 Utilities", "80 kVA", "81%"],
    [1, "arrows", "Other Loads", "150 kVA", "85%", true],
    [2, "hex", "Lighting Systems", "60 kVA", "85%"],
    [2, "hex", "Misc. Equipment", "50 kVA", "85%"],
    [2, "hex", "Future Expansion Reserve", "40 kVA", "85%"],
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden text-[7.5px]">
      <div className="mb-2 grid grid-cols-[1fr_22px] gap-2">
        <div className="rounded border border-cyan-300/10 bg-[#061421] px-2 py-1 text-slate-500">Search assets...</div>
        <div className="grid place-items-center rounded border border-cyan-300/10 text-slate-400"><AssetIcon kind="grid" /></div>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {rows.map(([level, icon, name, kva, pct, open]) => (
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1 text-slate-300" key={`${name}-${kva}`} style={{ paddingLeft: `${level * 10}px` }}>
            <span className={level <= 1 ? "flex min-w-0 items-center gap-1.5 font-semibold text-slate-200" : "flex min-w-0 items-center gap-1.5 text-slate-400"}>
              <span className="w-2 text-slate-500">{open ? "v" : level <= 1 ? ">" : ""}</span>
              <i className="grid size-3.5 shrink-0 place-items-center rounded border border-[#65a30d]/60 text-[#65a30d] [&>svg]:size-2.5"><AssetIcon kind={icon} /></i>
              <span className="truncate">{name}</span>
            </span>
            <span className="whitespace-nowrap text-slate-400">{kva}</span>
            <span className={Number.parseInt(pct, 10) >= 80 ? "font-semibold text-[#f59e0b]" : "font-semibold text-[#65a30d]"}>{pct}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between border-t border-white/8 pt-1 text-[8px] text-[#147dff]"><span>+ Add Asset</span><span>View Asset Map {"->"}</span></div>
    </div>
  );
}

function Waterfall() {
  return (
    <svg className="h-[160px] w-full" viewBox="0 0 520 170" preserveAspectRatio="none" aria-hidden="true">
      {[34, 68, 102, 136].map((y) => <line key={y} x1="30" x2="500" y1={y} y2={y} stroke="rgba(148,163,184,0.16)" />)}
      {[
        [48, 70, 55, "#94a3b8", "2,600"],
        [120, 57, 26, "#22c55e", "+220"],
        [190, 48, 22, "#22c55e", "+150"],
        [260, 42, 18, "#22c55e", "+120"],
        [330, 36, 16, "#22c55e", "+110"],
        [400, 28, 14, "#22c55e", "+50"],
        [470, 32, 78, "#147dff", "3,250"],
      ].map(([x, y, height, color, label]) => (
        <g key={`${x}-${label}`}>
          <rect fill={String(color)} height={Number(height)} rx="2" width="38" x={Number(x)} y={Number(y)} />
          <text fill="#cbd5e1" fontSize="8" textAnchor="middle" x={Number(x) + 19} y={Number(y) - 4}>{label}</text>
        </g>
      ))}
      <text fill="#94a3b8" fontSize="8" x="36" y="160">Current</text>
      <text fill="#94a3b8" fontSize="8" x="438" y="160">New Effective Capacity</text>
    </svg>
  );
}
