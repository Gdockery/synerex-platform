import type { EnterpriseDashboardData } from "@/data/enterpriseDashboard";
import {
  AiEnergySummaryCard,
  DashboardFooter,
  DashboardHeader,
  DashboardKpiCard,
  DashboardPanel,
  EnterpriseDeviceHealthCard,
  EnterpriseSavingsTrendCard,
  HiddenCapacityRecoveredCard,
  NetworkHealthCard,
  NetworkLossesReductionCard,
  PortfolioMapCard,
  ScreenStateBanner,
  TopSitesSavingsCard,
  TransformerCapacityOverviewCard,
} from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

const trendPoints = "0,72 28,58 58,50 88,54 118,42 148,38 178,29 208,33 238,25 268,18 300,10 330,16 360,4";

function EnterpriseSourceMissing({ message = "source_missing: Enterprise backend source contract is not available for this cheap-mode batch." }: { message?: string }) {
  return (
    <div className="grid h-full min-h-[72px] place-items-center rounded border border-cyan-300/10 bg-[#061421]/70 p-4 text-center text-[10px] text-slate-300">
      <span><b className="text-[#05ff5e]">No Data</b><br />{message}</span>
    </div>
  );
}

export function EnterpriseDashboardScreen({ data }: { data: EnterpriseDashboardData }) {
  return (
    <EcbsAppShell>
      <div className="ecbs-dashboard-content flex h-screen min-h-0 flex-col overflow-hidden px-4 py-3">
        <DashboardHeader
          dateRange={data.dateRange}
          subtitle="Enterprise Dashboard"
          title="XECO Energy Intelligence Portal"
          variant="enterprise"
        />

        <ScreenStateBanner state={data.state} />

        <section className="mt-3 grid h-[96px] shrink-0 grid-cols-6 gap-3">
          {data.kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} kpi={kpi} variant="enterprise" />
          ))}
        </section>

        <section className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid h-[255px] shrink-0 grid-cols-[2.1fr_1fr_1.58fr] gap-3">
            <DashboardPanel title="Global Site Overview" variant="enterprise">
              <PortfolioMapCard sites={data.sites} />
            </DashboardPanel>

            <DashboardPanel title="AI Energy Summary" variant="enterprise">
              <AiEnergySummaryCard summary={data.summary} />
            </DashboardPanel>

            <DashboardPanel title="Network Health" variant="enterprise">
              {data.networkHealth ? <NetworkHealthCard data={data.networkHealth} /> : null}
            </DashboardPanel>
          </div>

          <div className="grid h-[190px] shrink-0 grid-cols-[1fr_1fr] gap-3">
            <DashboardPanel title="Savings Trend (Monthly)" variant="enterprise">
              <EnterpriseSavingsTrendCard points={trendPoints} />
            </DashboardPanel>

            <DashboardPanel title="Top Sites By Annual Savings" variant="enterprise">
              <TopSitesSavingsCard sites={data.sites} />
            </DashboardPanel>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr_0.95fr_1.35fr] gap-3">
            <DashboardPanel title="Transformer Capacity Overview" variant="enterprise">
              {data.transformerCapacity ? <TransformerCapacityOverviewCard data={data.transformerCapacity} /> : null}
            </DashboardPanel>

            <DashboardPanel title="Hidden Capacity Recovered" variant="enterprise">
              {data.hiddenCapacity ? <HiddenCapacityRecoveredCard data={data.hiddenCapacity} /> : null}
            </DashboardPanel>

            <DashboardPanel title="Network Losses Reduction" variant="enterprise">
              {data.networkLosses ? <NetworkLossesReductionCard data={data.networkLosses} /> : null}
            </DashboardPanel>

            <DashboardPanel title="Device Health" variant="enterprise">
              {data.deviceHealth ? <EnterpriseDeviceHealthCard data={data.deviceHealth} /> : null}
            </DashboardPanel>
          </div>
        </section>

        <DashboardFooter updatedAt={data.updatedAt} variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

export function EnterpriseDeviceHealthDetailScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[56px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] leading-none">Device Health <span className="text-slate-400">›</span> <span className="font-semibold text-[#05ff5e]">Device Details</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[118px] items-start justify-between">
            <div>
              <div className="mb-3 text-[10px] text-[#05bfff]">‹ &nbsp; Back to All Devices</div>
              <div className="flex items-center gap-4"><h1 className="text-[24px] font-light leading-none">GW-TIJ-01</h1><span className="size-3 rounded-full bg-[#05ff5e]" /><span className="text-[12px]">Healthy</span></div>
              <div className="mt-3 text-[10px] text-slate-400">ECBS Gateway</div>
              <div className="mt-2 text-[10px]">Flex Tijuana &nbsp; • &nbsp; Site ID: TIJ-001 &nbsp; • &nbsp; Installed: Apr 15, 2024</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-end gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⋯ More</button></div>
              <div className="flex items-start gap-4">
                <div className="mt-5 h-[50px] w-[110px] rounded bg-gradient-to-b from-slate-500 to-slate-800 shadow-lg" />
                <HealthRing />
                <EnterpriseTopMetric label="Uptime (30 Days)" value="99.8%" />
                <EnterpriseTopMetric label="Firmware Version" value="v3.2.1" detail="◎ Up to date" />
                <EnterpriseTopMetric label="Last Check-In" value="May 18, 2025" detail="10:14 AM" />
                <EnterpriseTopMetric label="Device Time" value="10:15 AM" detail="Local (CDT)" />
              </div>
            </div>
          </div>
          <div className="flex h-[38px] items-end gap-1 border-b border-cyan-300/12 text-[9px]">
            {["Overview","Performance","Power Quality","Events & Alerts","Configuration","Maintenance","Logs"].map((tab) => <span className={tab==="Overview" ? "rounded-t border border-cyan-300/20 border-b-0 bg-[#061521] px-4 py-2 text-white" : "rounded-t border border-cyan-300/12 border-b-0 px-4 py-2 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-2 grid h-[174px] grid-cols-[0.78fr_1.05fr_0.86fr] gap-2">
            <DashboardPanel title="HEALTH OVERVIEW" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="PERFORMANCE SUMMARY (30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="REAL-TIME STATUS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[206px] grid-cols-[0.95fr_0.92fr_0.92fr] gap-2">
            <DashboardPanel title="HEALTH INDEX TREND (LAST 30 DAYS) ⓘ" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DATA THROUGHPUT (30 DAYS) ⓘ" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="UPTIME HISTORY (LAST 12 MONTHS) ⓘ" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[176px] grid-cols-[1.1fr_0.78fr_0.78fr] gap-2">
            <DashboardPanel title="RECENT EVENTS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="CONNECTED METERS & DEVICES" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DEVICE INFORMATION" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-2 flex h-[42px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
          <footer className="absolute bottom-2 left-4 right-4 flex h-[24px] items-center justify-between border-t border-cyan-300/10 pt-2 text-[8px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /></footer>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseDeviceHealthOverviewScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[56px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] leading-none">Device Health <span className="text-slate-400">›</span> <span>All Devices</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[40px] items-center justify-between">
            <h1 className="text-[15px] font-semibold">DEVICE HEALTH OVERVIEW</h1>
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">↗</button></div>
          </div>
          <section className="grid h-[164px] grid-cols-4 gap-3">
            <DashboardPanel title="OVERALL DEVICE HEALTH INDEX™" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="ONLINE DEVICES" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DEVICES REQUIRING ATTENTION" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DEVICE FIRMWARE COMPLIANCE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[244px] grid-cols-[1.16fr_0.82fr_0.66fr] gap-3">
            <DashboardPanel title="DEVICE HEALTH TREND (LAST 30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DEVICE HEALTH BY TYPE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DEVICE STATUS SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[244px] grid-cols-[1.62fr_0.62fr] gap-3">
            <DashboardPanel title={<span className="flex items-center justify-between"><span>DEVICE INVENTORY</span><span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1 text-[8px] font-normal text-slate-400">Search device...</span></span>} variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="TOP ISSUES" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-3 flex h-[42px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
          <footer className="absolute bottom-2 left-4 right-4 flex h-[24px] items-center justify-between border-t border-cyan-300/10 pt-2 text-[8px] text-slate-500"><span>© 2025 XECO Energy Corporation. All rights reserved.</span><span /></footer>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseAnnualSavingsDetailScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[12px] uppercase tracking-wide text-slate-300">KPI DRILL-DOWN</div><div className="mt-1 text-[20px] font-semibold leading-none">Annual Savings Detail</div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[38px] items-center justify-between">
            <div className="text-[10px]"><span className="text-slate-300">Dashboard</span><span className="mx-3 text-slate-500">›</span><span>Annual Savings</span><span className="mx-3 text-slate-500">›</span><span>Detail</span></div>
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          </div>
          <section className="grid h-[106px] grid-cols-[1.04fr_1fr_1fr_1fr_1fr_0.9fr] gap-3">
            <EnterpriseSavingsKpi active icon="$" label="ANNUAL SAVINGS" value="No Data" detail="source_missing" tone="green" />
            <EnterpriseSavingsKpi icon="⚡" label="CAPACITY RECOVERED" value="No Data" detail="source_missing" tone="blue" />
            <EnterpriseSavingsKpi icon="⌁" label="AVG POWER FACTOR" value="No Data" detail="source_missing" tone="cyan" />
            <EnterpriseSavingsKpi icon="⌁" label="THD REDUCTION" value="No Data" detail="source_missing" tone="green" />
            <EnterpriseSavingsKpi icon="⚠" label="SITES REQUIRING ATTENTION" value="No Data" detail="source_missing" tone="yellow" />
            <EnterpriseSavingsKpi icon="◒" label="CO₂ REDUCTION" value="No Data" detail="source_missing" tone="blue" />
          </section>
          <div className="flex h-[48px] items-end gap-8 border-b border-cyan-300/12 pl-2 text-[10px] font-semibold uppercase">
            {["Overview","By Site","By Region","By Utility","By Category","Trends","Insights"].map((tab) => <span className={tab==="Overview" ? "border-b-2 border-[#05ff5e] pb-3 text-[#05ff5e]" : "pb-3 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-3 grid h-[270px] grid-cols-[1.28fr_0.88fr] gap-3">
            <DashboardPanel title="ANNUAL SAVINGS OVER TIME ⓘ" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="SAVINGS BREAKDOWN" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[232px] grid-cols-[0.88fr_0.86fr_0.84fr] gap-3">
            <DashboardPanel title="SAVINGS BY SITE (Top 5)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="SAVINGS BY CATEGORY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="SAVINGS IMPACT SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-3 flex h-[40px] items-center rounded border border-[#05ff5e]/60 bg-[#061521]/92 px-4 text-[10px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseCapacityRecoveredDetailScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Capacity Recovered <span className="text-slate-400">›</span> Detail</div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[38px] items-center justify-between">
            <h1 className="text-[15px] font-semibold">CAPACITY RECOVERED OVERVIEW</h1>
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          </div>
          <section className="grid h-[106px] grid-cols-[1.25fr_1fr_1fr_1fr_1fr] gap-3">
            <EnterpriseCapacityKpi active icon="⚡" label="TOTAL CAPACITY RECOVERED" value="No Data" detail="source_missing" />
            <EnterpriseCapacityKpi label="BEFORE ECBS (TOTAL)" value="No Data" detail="source_missing" />
            <EnterpriseCapacityKpi label="AFTER ECBS (TOTAL)" value="No Data" detail="source_missing" />
            <EnterpriseCapacityKpi label="HIDDEN CAPACITY UNLOCKED" value="No Data" detail="source_missing" />
            <EnterpriseUtilizationDonut />
          </section>
          <div className="flex h-[48px] items-end gap-10 border-b border-cyan-300/12 pl-2 text-[10px] font-semibold uppercase">
            {["By Site","By Transformer","By Equipment Type","Trends","Analysis","Benchmarks"].map((tab) => <span className={tab==="By Site" ? "border-b-2 border-[#05ff5e] pb-3 text-[#05ff5e]" : "pb-3 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-3 grid h-[276px] grid-cols-[0.88fr_1.24fr] gap-3">
            <DashboardPanel title="CAPACITY RECOVERED BY SITE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="CAPACITY RECOVERED TREND (kVA)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[232px] grid-cols-[0.95fr_0.86fr_0.82fr] gap-3">
            <DashboardPanel title="CAPACITY RECOVERED BY TRANSFORMER" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="CAPACITY RECOVERED BY SOURCE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="CAPACITY UTILIZATION COMPARISON" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-3 flex h-[56px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseThdReductionDetailScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">THD Reduction <span className="text-slate-400">›</span> Detail</div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[38px] items-center justify-end">
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          </div>
          <section className="grid h-[108px] grid-cols-[1.3fr_0.86fr_0.86fr_0.86fr_0.86fr_0.96fr] gap-2.5">
            <EnterpriseThdKpi active label="THD REDUCTION (SYSTEM)" value="No Data" detail="source_missing" />
            <EnterpriseThdKpi label="CURRENT AVG THD" value="No Data" detail="source_missing" />
            <EnterpriseThdKpi label="HIGHEST SITE THD" value="No Data" detail="source_missing" />
            <EnterpriseThdKpi label="LOWEST SITE THD" value="No Data" detail="source_missing" />
            <EnterpriseThdKpi label="SITES ≤ 5% THD" value="No Data" detail="source_missing" />
            <EnterpriseThdComplianceKpi />
          </section>
          <div className="flex h-[48px] items-end gap-9 border-b border-cyan-300/12 pl-2 text-[10px] font-semibold uppercase">
            {["Overview","By Site","By Harmonic Order","Trends","Waveform Analysis","Source Analysis","Insights"].map((tab) => <span className={tab==="Overview" ? "border-b-2 border-[#05ff5e] pb-3 text-[#05ff5e]" : "pb-3 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-3 grid h-[276px] grid-cols-[0.96fr_1fr] gap-3">
            <DashboardPanel title="THD REDUCTION OVER TIME (%)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="THD BY SITE (CURRENT)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[232px] grid-cols-[0.98fr_0.86fr_0.86fr] gap-3">
            <DashboardPanel title="HARMONIC SPECTRUM (SYSTEM AVERAGE)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="THD REDUCTION BY EQUIPMENT TYPE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="COMPLIANCE SUMMARY (IEEE 519)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-3 flex h-[56px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseAvgPowerFactorDetailScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Avg Power Factor <span className="text-slate-400">›</span> Detail</div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[38px] items-center justify-end">
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          </div>
          <section className="grid h-[108px] grid-cols-[1.3fr_0.86fr_0.86fr_0.86fr_0.86fr_0.96fr] gap-2.5">
            <EnterprisePowerFactorKpi active label="AVG POWER FACTOR (SYSTEM)" value="No Data" detail="source_missing" />
            <EnterprisePowerFactorKpi label="CURRENT PERIOD AVG" value="No Data" detail="source_missing" />
            <EnterprisePowerFactorKpi label="HIGHEST SITE PF" value="No Data" detail="source_missing" />
            <EnterprisePowerFactorKpi label="LOWEST SITE PF" value="No Data" detail="source_missing" />
            <EnterprisePowerFactorKpi label="SITES ≥ 95% PF" value="No Data" detail="source_missing" />
            <EnterprisePowerFactorComplianceKpi />
          </section>
          <div className="flex h-[48px] items-end gap-9 border-b border-cyan-300/12 pl-2 text-[10px] font-semibold uppercase">
            {["Overview","By Site","By Transformer","Trends","PF Improvement","Penalty Analysis","Insights"].map((tab) => <span className={tab==="Overview" ? "border-b-2 border-[#05ff5e] pb-3 text-[#05ff5e]" : "pb-3 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-3 grid h-[276px] grid-cols-[1.14fr_0.98fr] gap-3">
            <DashboardPanel title="AVERAGE POWER FACTOR TREND (%) ⓘ" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="POWER FACTOR DISTRIBUTION (BY RANGE)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[232px] grid-cols-[0.96fr_0.82fr_0.96fr] gap-3">
            <DashboardPanel title="POWER FACTOR BY SITE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="PF IMPROVEMENT SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="POWER FACTOR BY TRANSFORMER (TOP 5)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-3 flex h-[56px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseLossAnalysisScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Loss Analysis <span className="text-slate-400">›</span> <span className="text-[#05ff5e]">Overview</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="absolute right-4 top-[70px] flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          <section className="mt-2 grid h-[92px] grid-cols-[1.15fr_1.05fr_1.08fr_0.95fr_1.05fr] gap-3 pr-[236px]">
            <EnterpriseLossKpi icon="⚡" label="TOTAL LOSSES REDUCTION (YTD)" value="No Data" detail="source_missing" tone="#12b80f" />
            <EnterpriseLossKpi icon="$" label="ANNUAL LOSS SAVINGS" value="No Data" detail="source_missing" tone="#12b80f" />
            <EnterpriseLossKpi icon="▣" label="ENERGY LOSS REDUCTION (YTD)" value="No Data" detail="source_missing" tone="#147dff" />
            <EnterpriseLossKpi icon="♨" label="AVG LOSS REDUCTION" value="No Data" detail="source_missing" tone="#8b5cf6" />
            <EnterpriseLossKpi icon="◎" label="SITES ABOVE TARGET" value="No Data" detail="source_missing" tone="#f59e0b" />
          </section>
          <section className="mt-2 grid h-[206px] grid-cols-[0.9fr_1.16fr_0.68fr] gap-3">
            <DashboardPanel title="LOSS BREAKDOWN (YTD)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="LOSS REDUCTION WATERFALL (YTD)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="LOSS SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[270px] grid-cols-[0.95fr_0.66fr_0.88fr] gap-3">
            <DashboardPanel title="LOSS TREND OVER TIME" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="LOSSES BY CATEGORY (YTD)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="LOSS REDUCTION BY SITE (TOP 5)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[198px] grid-cols-[1fr_250px] gap-3">
            <DashboardPanel title="LOSS DETAIL BY SOURCE (YTD)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="INSIGHTS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-2 grid h-[36px] grid-cols-[1fr_260px] gap-3">
            <div className="flex items-center rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[10px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
            <div className="flex items-center justify-end pr-5 text-[12px] font-semibold text-[#05ff5e]">View Full Loss Report &nbsp; ›</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseMapExpansionScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Global Site Overview <span className="text-slate-400">›</span> All Sites Map</div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <section className="mt-3 grid h-[540px] grid-cols-[1fr_184px] gap-3">
            <div className="min-h-0">
              <div className="mb-2 flex h-[38px] items-center justify-between">
                <h1 className="text-[14px] font-semibold uppercase">GLOBAL SITE MAP</h1>
                <div className="flex gap-2 text-[10px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▱ Layers</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">↗</button></div>
              </div>
              <EnterpriseExpandedMap />
            </div>
            <div className="grid h-full grid-rows-[1fr_184px] gap-3">
              <DashboardPanel title="GLOBAL SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
              <DashboardPanel title="SITES BY REGION" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            </div>
          </section>
          <section className="mt-3 grid h-[220px] grid-cols-[1fr_184px] gap-3">
            <DashboardPanel title="ALL SITES (23)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <div />
          </section>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseNetworkHealthBreakdownScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Network Health <span className="text-slate-400">›</span> <span className="text-[#05ff5e]">Asset Health Breakdown</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[42px] items-start justify-between">
            <div className="flex items-center gap-3 text-[10px]"><span>Site</span><button className="w-[190px] rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-left">Flex Juarez South <span className="float-right">⌄</span></button><span className="size-3 rounded-full bg-[#05ff5e]" /><button className="rounded px-2 py-1">Healthy <span>⌄</span></button></div>
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          </div>
          <div className="flex h-[40px] items-end gap-1 border-b border-cyan-300/12 text-[9px]">
            {["Overview","Balance","Harmonics","Asset Health","Maintenance"].map((tab) => <span className={tab==="Asset Health" ? "rounded-t border border-cyan-300/20 border-b-0 bg-[#061521] px-5 py-2 text-white shadow-[inset_0_-2px_0_#05bfff]" : "rounded-t border border-cyan-300/12 border-b-0 px-5 py-2 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-3 grid h-[152px] grid-cols-4 gap-3">
            <EnterpriseAssetHealthCard icon="▥" title="TRANSFORMER HEALTH" value="No Data" rows={[["Healthy","6 (100%)","#05ff5e"],["Warning","0 (0%)","#facc15"],["Critical","0 (0%)","#ef4444"]]} link="View Transformers" />
            <EnterpriseAssetHealthCard icon="♧" title="DEVICE HEALTH" value="No Data" rows={[["Healthy","126 (97%)","#05ff5e"],["Warning","3 (2%)","#facc15"],["Critical","1 (1%)","#ef4444"]]} link="View Devices" />
            <EnterpriseAssetHealthCard icon="▤" title="INFRASTRUCTURE HEALTH" value="No Data" rows={[["Healthy","49 (98%)","#05ff5e"],["Warning","1 (2%)","#facc15"],["Critical","0 (0%)","#ef4444"]]} link="View Infrastructure" />
            <EnterpriseAssetHealthCard icon="♢" title="MAINTENANCE HEALTH" value="No Data" rows={[["Healthy","54 (98%)","#05ff5e"],["Warning","1 (2%)","#facc15"],["Critical","0 (0%)","#ef4444"]]} link="View Maintenance" />
          </section>
          <section className="mt-3 grid h-[456px] grid-cols-[1fr_276px] gap-3">
            <DashboardPanel title="ASSET HEALTH BY CATEGORY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <div className="grid h-full grid-rows-[174px_1fr] gap-3">
              <DashboardPanel title="STATUS SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
              <DashboardPanel title="TREND SUMMARY (ALL ASSETS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            </div>
          </section>
          <div className="mt-3 flex h-[56px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseNetworkHealthOverviewScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Network Health <span className="text-slate-400">›</span> <span className="text-[#05ff5e]">Breakdown</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 – May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[42px] items-start justify-between">
            <div><h1 className="text-[14px] font-semibold uppercase">NETWORK HEALTH OVERVIEW</h1><p className="mt-2 text-[9px] text-slate-300">Network health is calculated using three key indices that measure balance, power quality, and asset condition.</p></div>
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div>
          </div>
          <section className="mt-3 grid h-[204px] grid-cols-[0.92fr_0.92fr_0.92fr_1.08fr] gap-3">
            <EnterpriseNetworkOverviewScore />
            <EnterpriseHealthIndexCard title="CURRENT BALANCE INDEX™" value="No Data" link="View Balance Details" rows={[["Phase Balance","96","#05ff5e"],["Voltage Balance","94","#05ff5e"],["Load Balance","95","#05ff5e"],["Neutral Balance","94","#05ff5e"]]} />
            <EnterpriseHealthIndexCard title="HARMONIC HEALTH INDEX™" value="No Data" link="View Harmonics Details" rows={[["THD (Voltage)","3.2%","#05ff5e"],["THD (Current)","4.1%","#05ff5e"],["Harmonic Order","25","#05ff5e"],["Distortion Trend","↓","#05ff5e"]]} />
            <EnterpriseHealthIndexCard title="ASSET HEALTH INDEX™" value="No Data" link="View Asset Details" rows={[["Transformer Health","98","#05ff5e"],["Device Health","97","#05ff5e"],["Infrastructure Health","98","#05ff5e"],["Maintenance Health","98","#05ff5e"]]} />
          </section>
          <section className="mt-3 grid h-[196px] grid-cols-[0.9fr_0.82fr_1fr] gap-3">
            <DashboardPanel title="CURRENT BALANCE INDEX BREAKDOWN" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="HARMONIC HEALTH INDEX BREAKDOWN" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="ASSET HEALTH INDEX BREAKDOWN" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[254px] grid-cols-[0.9fr_0.82fr_1fr] gap-3">
            <DashboardPanel title="BALANCE TREND (LAST 30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="HARMONIC ORDER SPECTRUM (SYSTEM AVG)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="NETWORK HEALTH ISSUES" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <div className="mt-3 flex h-[56px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseTransformerDetailScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar activeItem="Transformers" />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Transformers <span className="text-slate-400">›</span> <span className="text-[#05ff5e]">XF-TIJ-01 Details</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[30px] items-center justify-between">
            <span className="text-[10px] text-[#05bfff]">‹ &nbsp; Back to Transformers Overview</span>
            <div className="flex gap-2 text-[9px]"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">♧ Alerts</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⋯ More</button></div>
          </div>
          <section className="grid h-[150px] grid-cols-[1.35fr_0.42fr_0.42fr_0.42fr_0.42fr_0.42fr_0.72fr] gap-2">
            <EnterpriseTransformerHero />
            <EnterpriseTransformerKpi title="HEALTH INDEX" value="No Data" sub="source_missing" tone="#05b82e" detail="source_missing" />
            <EnterpriseTransformerKpi title="LOAD" value="No Data" sub="source_missing" tone="#147dff" detail="source_missing" />
            <EnterpriseTransformerKpi title="EFFICIENCY" value="No Data" sub="source_missing" tone="#00bcd4" detail="source_missing" />
            <EnterpriseTransformerKpi title="TOP OIL TEMP" value="No Data" sub="source_missing" tone="#f59e0b" detail="source_missing" />
            <EnterpriseTransformerKpi title="AGE" value="No Data" sub="source_missing" tone="#8b5cf6" detail="source_missing" />
            <EnterpriseTransformerStatus />
          </section>
          <div className="flex h-[34px] items-end gap-1 border-b border-cyan-300/12 text-[9px]">
            {["Overview","Performance","Power Quality","Events & Alerts","Configuration","Maintenance","Logs"].map((tab) => <span className={tab==="Overview" ? "border-b-2 border-[#05bfff] px-4 py-2 text-[#05bfff]" : "px-4 py-2 text-slate-300"} key={tab}>{tab}</span>)}
          </div>
          <section className="mt-2 grid h-[224px] grid-cols-[0.94fr_1fr_1.1fr] gap-2">
            <DashboardPanel title="REAL-TIME ELECTRICAL VALUES" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="LOAD TREND (LAST 30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="OIL TEMPERATURE (LAST 30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[168px] grid-cols-[0.94fr_1fr_1.1fr] gap-2">
            <DashboardPanel title="POWER QUALITY SUMMARY (30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="ENERGY SUMMARY (30 DAYS)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="MAINTENANCE & INSPECTION" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[160px] grid-cols-[1.58fr_0.74fr_0.74fr] gap-2">
            <DashboardPanel title="RECENT EVENTS & ALERTS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="TAP CHANGER STATUS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="DOCUMENTS & DRAWINGS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseTransformerOverviewScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar activeItem="Transformers" />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Transformers <span className="text-slate-400">›</span> <span className="text-[#05ff5e]">Overview</span></div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[34px] items-center justify-end gap-2 text-[9px]">
            <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button><button className="px-1 text-slate-400">›</button>
          </div>
          <section className="grid h-[122px] grid-cols-[0.76fr_1.26fr_0.96fr_0.96fr_0.86fr] gap-2">
            <EnterpriseTransformerOverviewKpi icon="▥" label="TOTAL TRANSFORMERS" value="No Data" detail="source_missing" color="#05bfff" />
            <EnterpriseTransformerHealthSummary />
            <EnterpriseTransformerOverviewKpi icon="▥" label="TOTAL CAPACITY" value="No Data" detail="source_missing" color="#00bcd4" />
            <EnterpriseTransformerOverviewKpi icon="▥" label="HIDDEN CAPACITY" value="No Data" detail="source_missing" link="View Details" color="#8b5cf6" />
            <EnterpriseTransformerOverviewKpi icon="♨" label="AVG LOADING" value="No Data" detail="source_missing" color="#f59e0b" />
          </section>
          <section className="mt-2 grid h-[270px] grid-cols-[1.02fr_1.02fr] gap-2">
            <DashboardPanel title="LOADING TREND (AVERAGE %)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="TRANSFORMER HEALTH BY SITE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-2 grid h-[286px] grid-cols-[1.58fr_0.88fr] gap-2">
            <DashboardPanel title={<span className="flex items-center justify-between"><span>TRANSFORMER INVENTORY</span><span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1 text-[8px] font-normal text-slate-400">Search transformer...</span></span>} variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <div className="grid h-full grid-rows-[1fr_0.88fr] gap-2">
              <DashboardPanel title="CAPACITY UTILIZATION SUMMARY" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
              <DashboardPanel title="TOP OVERLOADED TRANSFORMERS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            </div>
          </section>
          <div className="mt-2 flex h-[56px] items-center justify-between rounded border border-cyan-300/12 bg-[#061521]/92 px-4 text-[11px]"><span><b className="text-[#05ff5e]">INSIGHT:</b> &nbsp; No Data - source_missing: enterprise rollup/source contract is not available for this cheap-mode batch.</span></div>
        </main>
      </div>
    </div>
  );
}

export function EnterpriseTrendAnalyticsScreen() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[186px_1fr]">
        <EnterpriseDetailSidebar activeItem="Savings & Forecast" />
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.12),transparent_34%),linear-gradient(180deg,#04111c,#020910)] px-4 py-3">
          <header className="flex h-[58px] items-start justify-between border-b border-cyan-300/12">
            <div><div className="text-[15px] font-semibold leading-none">XECO ENERGY INTELLIGENCE PORTAL</div><div className="mt-2 text-[20px] font-semibold leading-none">Savings Trend Analytics <span className="text-slate-400">›</span> Monthly Trend Detail</div></div>
            <div className="flex items-center gap-3 text-[9px]"><button className="w-[178px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-left">May 12 - May 18, 2025 &nbsp; ▣</button><span className="relative text-xl">♧<b className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#020a12]">0</b></span><span className="text-lg">?</span><span>Greg Dockery<br /><span className="text-slate-400">Administrator</span></span><span className="grid size-7 place-items-center rounded-full border border-slate-500">○</span><span>⌄</span></div>
          </header>
          <div className="mt-2 flex h-[32px] items-center justify-between gap-2 text-[9px]"><h1 className="text-[13px] font-semibold uppercase text-slate-200">SAVINGS OVERVIEW</h1><div className="flex gap-2"><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">⇩ Export</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">Share</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-2">▽ Filters</button></div></div>
          <section className="grid h-[98px] grid-cols-[1.28fr_1fr_1fr_1fr_1fr] gap-3">
            <EnterpriseTrendKpi active icon="$" label="TOTAL ANNUAL SAVINGS" value="No Data" detail="source_missing" tone="#05ff5e" />
            <EnterpriseTrendKpi icon="▣" label="THIS MONTH (MAY 2025)" value="No Data" detail="source_missing" tone="#147dff" />
            <EnterpriseTrendKpi icon="▥" label="MONTHLY AVG (YTD)" value="No Data" detail="source_missing" tone="#00bcd4" />
            <EnterpriseTrendKpi icon="⌁" label="CUMULATIVE SAVINGS (YTD)" value="No Data" detail="source_missing" tone="#8b5cf6" />
            <EnterpriseTrendKpi icon="★" label="BEST MONTH" value="No Data" detail="source_missing" tone="#16a34a" />
          </section>
          <section className="mt-3 grid h-[306px] grid-cols-[1fr_246px] gap-3">
            <DashboardPanel title="SAVINGS TREND OVER TIME" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="TREND INSIGHTS" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 grid h-[210px] grid-cols-[0.88fr_0.92fr_0.88fr] gap-3">
            <DashboardPanel title="SAVINGS BY CATEGORY (YTD)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="MONTHLY SAVINGS HEATMAP" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
            <DashboardPanel title="BASELINE VS ACTUAL (YTD)" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
          <section className="mt-3 h-[118px]">
            <DashboardPanel title="MONTHLY SUMMARY TABLE" variant="enterprise"><EnterpriseSourceMissing /></DashboardPanel>
          </section>
        </main>
      </div>
    </div>
  );
}

function EnterpriseDetailSidebar({ activeItem = "Enterprise Dashboard" }: { activeItem?: string }) {
  const sections = [["ENTERPRISE", ["Energy Dashboard","Capacity Intelligence","Digital Twin","Sites","Transformers","Current Analysis","Savings & Forecast","Alerts & Events","Reports"]],["DEVICES", []],["CLIENT MANAGEMENT", []],["DATA & ANALYTICS", []],["OPERATIONS", []],["ENGINEERING", []],["ADMINISTRATION", []]];
  return <aside className="relative h-full overflow-hidden border-r border-cyan-300/10 bg-[#030c15] px-3 py-3"><div className="mb-3"><div className="text-[30px] font-black italic leading-none tracking-[-0.12em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.48em] text-[#16ff5d]">Energy</div></div><div className="mb-3 flex h-[28px] items-center gap-2 rounded bg-[#063b27] px-2 text-[10px] text-white"><span className="grid size-4 place-items-center rounded border border-[#05ff5e] text-[#05ff5e]">⌂</span>Enterprise Dashboard</div><nav className="space-y-2 text-[9px]">{sections.map(([title,items])=><section key={String(title)}><h2 className="mb-1 flex justify-between text-[#05ff5e]">{title}<span>⌄</span></h2>{(items as string[]).map((item)=><div className={item===activeItem ? "flex h-[22px] items-center justify-between rounded bg-[#063b27]/75 px-1.5 text-white" : "flex h-[22px] items-center justify-between rounded px-1.5 text-slate-300"} key={item}><span>{item}</span>{item==="Alerts & Events"?<b className="grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">0</b>:null}</div>)}</section>)}</nav><div className="absolute bottom-[110px] left-3 right-3 rounded border border-[#05ff5e]/25 bg-[#061421] p-3 text-center text-[10px]"><div>XECO Current<br/>Balance Index™</div><div className="mt-2 text-[40px] leading-none text-[#65a30d]">No Data</div><div className="mt-1 text-lg">source_missing <span className="text-[10px]">(No Data)</span></div><div>Backend source required</div><div className="mt-3 text-[#05ff5e]">Learn More &nbsp; ›</div></div><div className="absolute bottom-[54px] left-3 text-[9px]"><div className="text-white">♧ &nbsp; Need Help?</div><div className="text-slate-400">Contact Support</div></div><div className="absolute bottom-3 left-3 right-3 text-[8px] leading-relaxed text-slate-500">© 2025 XECO Energy Corporation.<br/>All rights reserved.</div></aside>;
}

function EnterpriseSavingsKpi({ active, detail, icon, label, tone, value }: { active?: boolean; detail: string; icon: string; label: string; tone: "green" | "blue" | "cyan" | "yellow"; value: string }) {
  const color = tone === "green" ? "#05ff5e" : tone === "blue" ? "#147dff" : tone === "cyan" ? "#00bcd4" : "#f59e0b";
  return <article className={active ? "grid grid-cols-[56px_1fr] items-center rounded border border-[#05ff5e] bg-[#063b27]/70 p-3" : "grid grid-cols-[56px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"}><span className="grid size-11 place-items-center rounded-full text-xl text-white" style={{background: color}}>{icon}</span><span><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[20px] leading-none">{value}</div><div className="mt-2 text-[7px]" style={{color}}>{detail}</div></span></article>;
}

function EnterpriseAnnualSavingsChart() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  const points = "44,200 94,178 144,146 194,118 244,86 294,72 344,54 394,38 444,24 494,18 544,4 590,-18";
  return <div className="h-full text-[8px]"><svg className="h-[208px] w-full" viewBox="0 0 640 220"><defs><linearGradient id="annualSavingsArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#05ff5e" stopOpacity=".42"/><stop offset="1" stopColor="#05ff5e" stopOpacity=".04"/></linearGradient></defs><g stroke="rgba(148,163,184,.16)">{[24,62,100,138,176,214].map(y=><line key={y} x1="38" x2="626" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="4" y="28">$250K</text><text x="4" y="66">$200K</text><text x="4" y="104">$150K</text><text x="4" y="142">$100K</text><text x="10" y="180">$50K</text><text x="22" y="216">$0</text></g><path d={`M${points.replaceAll(" ", " L")} L590,214 L44,214 Z`} fill="url(#annualSavingsArea)"/><polyline fill="none" points={points} stroke="#65ff00" strokeWidth="2.5"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#65ff00" key={i} r="3"/>})}<rect fill="#061421" height="48" rx="4" stroke="rgba(103,232,249,.25)" width="90" x="520" y="16"/><text fill="#e2e8f0" fontSize="9" textAnchor="middle" x="565" y="34">May 2025</text><text fill="#e2e8f0" fontSize="10" textAnchor="middle" x="565" y="50">$1,838,420</text></svg><div className="flex justify-between px-10 text-[7px] text-slate-400">{months.map(m=><span key={m}>{m}</span>)}</div></div>;
}

function EnterpriseSavingsBreakdown() {
  const rows = [["Demand Charge Reduction","$842,320","45.8%","#05b82e"],["Energy Consumption Reduction","$568,710","30.9%","#147dff"],["Power Factor Improvement","$247,650","13.5%","#f59e0b"],["Loss Reduction","$121,740","6.6%","#00bcd4"],["Other Savings","$58,000","3.2%","#64748b"]];
  return <div className="grid h-full grid-cols-[172px_1fr] items-center gap-4 text-[8px]"><div className="relative"><svg className="size-[154px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="98 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="66 214" strokeDashoffset="-100" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="29 214" strokeDashoffset="-168" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#00bcd4" strokeDasharray="14 214" strokeDashoffset="-199" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[56px] w-[154px] text-center"><b className="text-[20px]">$1.84M</b><br/>Total Savings</div></div><div className="space-y-4">{rows.map(([label,value,pct,color])=><div className="grid grid-cols-[12px_1fr_66px_40px] gap-2" key={label}><span className="mt-1 size-3 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span><span>{pct}</span></div>)}</div></div>;
}

function EnterpriseSavingsBySite() {
  const rows = [["1","Flex Tijuana","$234,500","12.7%","▲ 15.3%"],["2","Flex Juarez North","$208,300","11.3%","▲ 11.9%"],["3","Flex Juarez South","$187,600","10.2%","▲ 10.4%"],["4","Flex Guadalajara","$166,200","9.0%","▲ 8.7%"],["5","Flex Hermosillo","$149,700","8.1%","▲ 9.2%"]];
  return <EnterpriseSavingsTable headers={["","Site","Annual Savings","% of Total","Trend (vs Last Month)"]} rows={rows} link="View All Sites" />;
}

function EnterpriseSavingsByCategory() {
  const rows = [["Demand Charges","$842,320","45.8%","#05b82e"],["Energy Consumption","$568,710","30.9%","#147dff"],["Power Factor Improvement","$247,650","13.5%","#f59e0b"],["Loss Reduction","$121,740","6.6%","#00bcd4"],["Other Savings","$58,000","3.2%","#64748b"]];
  return <div className="space-y-4 text-[9px]">{rows.map(([label,value,pct,color])=><div className="grid grid-cols-[1fr_80px_82px_44px] items-center gap-3" key={label}><span>{label}</span><span>{value}</span><span className="h-2 rounded bg-white/5"><i className="block h-2 rounded" style={{background:color,width:pct}}/></span><span>{pct}</span></div>)}<div className="pt-5 text-[#05ff5e]">View Category Details</div></div>;
}

function EnterpriseSavingsImpact() {
  const rows = [["◉","CO₂ Emissions Avoided","8,400 Tons / Year"],["♧","Equivalent Trees Planted","210,000 Trees"],["⌂","Homes Powered Annually","1,650 Homes"],["▣","Fuel Saved","1,420,000 Gallons"]];
  return <div className="space-y-3 text-[9px]">{rows.map(([icon,label,value])=><div className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-white/5 pb-2.5" key={label}><span className="text-base text-slate-300">{icon}</span><span>{label}</span><span>{value}</span></div>)}<div className="pt-1 text-[#05ff5e]">View Environmental Impact</div></div>;
}

function EnterpriseSavingsTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i===4?"py-2 text-[#05ff5e]":"py-2"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-4 text-[#05ff5e]">{link}</div></div>;
}

function EnterpriseCapacityKpi({ active, detail, icon, label, value }: { active?: boolean; detail: string; icon?: string; label: string; value: string }) {
  return <article className={active ? "grid grid-cols-[58px_1fr] items-center rounded border border-[#147dff]/50 bg-[#061521]/92 p-3" : "rounded border border-cyan-300/12 bg-[#061521]/92 p-4"}>
    {active ? <span className="grid size-12 place-items-center rounded-full bg-[#147dff] text-2xl text-white">{icon}</span> : null}
    <span><div className="text-[7px] text-slate-400">{label}</div><div className="mt-2 whitespace-nowrap text-[24px] leading-none">{value}</div><div className={active ? "mt-2 text-[8px] text-[#05ff5e]" : "mt-2 text-[8px] text-slate-300"}>{detail}</div></span>
  </article>;
}

function EnterpriseUtilizationDonut() {
  return <article className="grid grid-cols-[1fr_84px] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3">
    <span><div className="text-[7px] text-slate-400">UTILIZATION IMPROVEMENT</div></span>
    <span className="relative size-[78px]"><svg className="size-[78px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#0b2233" strokeWidth="12"/><circle cx="50" cy="50" fill="none" r="35" stroke="#05b82e" strokeDasharray="52 220" strokeWidth="12" transform="rotate(-72 50 50)"/><circle cx="50" cy="50" fill="#071a28" r="27"/></svg><b className="absolute inset-0 grid place-items-center text-[18px] font-medium">24,6%</b></span>
  </article>;
}

function EnterpriseCapacityBySite() {
  const rows = [["1","Flex Tijuana","2,350","3,420","1,070","45.5%"],["2","Flex Juarez North","1,980","2,890","910","45.9%"],["3","Flex Juarez South","1,820","2,620","800","44.0%"],["4","Flex Guadalajara","1,650","2,370","720","43.6%"],["5","Flex Hermosillo","1,480","2,180","700","47.3%"],["TOTAL","","19,650","24,500","4,850","24.6%"]];
  return <EnterpriseCapacityTable headers={["","Site","Before ECBS (kVA)","After ECBS (kVA)","Recovered (kVA)","Improvement %"]} rows={rows} link="View All Sites" />;
}

function EnterpriseCapacityByTransformer() {
  const rows = [["TX-01","Flex Tijuana","1,000","1,560","560","56.0%"],["TX-02","Flex Tijuana","950","1,480","530","55.8%"],["TX-01","Flex Juarez North","900","1,400","500","55.6%"],["TX-02","Flex Juarez North","800","1,250","450","56.3%"],["TX-01","Flex Juarez South","850","1,310","460","54.1%"]];
  return <EnterpriseCapacityTable headers={["Transformer","Site","Before (kVA)","After (kVA)","Recovered (kVA)","Improvement (%)"]} rows={rows} link="View All Transformers" compact />;
}

function EnterpriseCapacityTable({ compact, headers, link, rows }: { compact?: boolean; headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[7.2px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className={ri === rows.length - 1 ? "border-t border-white/10 bg-cyan-300/5 font-semibold" : "border-t border-white/5"} key={`${row[0]}-${row[1]}`}>{row.map((cell,i)=><td className={i===5 && !compact ? "py-1.5 text-[#05ff5e]" : "py-1.5"} key={`${row[0]}-${i}`}>{i === 5 && compact ? <span className="inline-flex items-center gap-2"><i className="block h-1.5 w-14 rounded bg-[#05b82e]" />{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className={compact ? "mt-3 text-[#05ff5e]" : "mt-4 text-[#05ff5e]"}>{link}</div></div>;
}

function EnterpriseCapacityTrend() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  const points = "42,168 92,152 142,136 192,124 242,110 292,100 342,90 392,76 442,60 492,56 542,52 590,48";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end gap-1 text-[8px]">{["6M","12M","24M","YTD","All"].map(t=><span className={t==="12M" ? "rounded bg-[#147dff] px-4 py-1" : "rounded border border-cyan-300/12 px-4 py-1 text-slate-300"} key={t}>{t}</span>)}</div><svg className="h-[206px] w-full" viewBox="0 0 640 216"><defs><linearGradient id="capacityTrendArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#147dff" stopOpacity=".46"/><stop offset="1" stopColor="#147dff" stopOpacity=".05"/></linearGradient></defs><g stroke="rgba(148,163,184,.16)">{[18,52,86,120,154,188].map(y=><line key={y} x1="38" x2="626" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9"><text x="12" y="22">6,000</text><text x="12" y="56">5,000</text><text x="12" y="90">4,000</text><text x="12" y="124">3,000</text><text x="12" y="158">2,000</text><text x="12" y="192">1,000</text></g><path d={`M${points.replaceAll(" ", " L")} L590,190 L42,190 Z`} fill="url(#capacityTrendArea)"/><polyline fill="none" points={points} stroke="#147dff" strokeWidth="2.5"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#dbeafe" key={i} r="3" stroke="#147dff" strokeWidth="2"/>})}<rect fill="#061421" height="48" rx="4" stroke="rgba(103,232,249,.25)" width="92" x="524" y="16"/><text fill="#e2e8f0" fontSize="9" textAnchor="middle" x="570" y="34">May 2025</text><text fill="#e2e8f0" fontSize="10" textAnchor="middle" x="570" y="50">4,850 kVA</text></svg><div className="flex justify-between px-10 text-[7px] text-slate-400">{months.map(m=><span key={m}>{m}</span>)}</div><div className="mt-2 text-[#147dff]">● <span className="text-slate-300">Capacity Recovered (kVA)</span></div></div>;
}

function EnterpriseCapacityBySource() {
  const rows = [["Improved Power Factor","2,050 kVA","42.3%","#05b82e"],["Reduced Harmonics","1,450 kVA","29.9%","#147dff"],["Load Balancing","850 kVA","17.5%","#f59e0b"],["Voltage Optimization","300 kVA","6.2%","#00bcd4"],["Other Improvements","200 kVA","4.1%","#64748b"]];
  return <div className="grid h-full grid-cols-[116px_1fr] items-center gap-3 text-[8px]"><div className="relative"><svg className="size-[112px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="90 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="64 214" strokeDashoffset="-92" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="38 214" strokeDashoffset="-158" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#00bcd4" strokeDasharray="14 214" strokeDashoffset="-198" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[39px] w-[112px] text-center"><b className="text-[18px]">4,850</b><br/>kVA<br/><span className="text-[6px]">Total Recovered</span></div></div><div className="space-y-3">{rows.map(([label,value,pct,color])=><div className="grid grid-cols-[10px_1fr_52px_38px] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span><span>{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Source Analysis</div></div></div>;
}

function EnterpriseCapacityComparison() {
  return <div className="grid h-full grid-cols-[1fr_36px_1fr] items-center gap-3 text-center text-[8px]"><EnterpriseCapacityGauge label="BEFORE ECBS" pct="78%" value="19,650 kVA Available" color="#f97316" /><span className="text-[40px] text-[#05b82e]">➡</span><EnterpriseCapacityGauge label="AFTER ECBS" pct="62%" value="24,500 kVA Available" color="#14b8a6" /><div className="col-span-3 mt-1 text-left text-[#05ff5e]">View Utilization Analysis</div></div>;
}

function EnterpriseCapacityGauge({ color, label, pct, value }: { color: string; label: string; pct: string; value: string }) {
  return <div><div className="mb-2 font-semibold">{label}</div><div className="relative mx-auto size-[112px]"><svg className="size-[112px]" viewBox="0 0 100 100"><path d="M15 74 A38 38 0 0 1 85 74" fill="none" stroke="#112638" strokeWidth="10"/><path d="M15 74 A38 38 0 0 1 85 74" fill="none" stroke={color} strokeDasharray="88 120" strokeWidth="10"/></svg><b className="absolute inset-x-0 top-[48px] text-[24px]" style={{color}}>{pct}</b><span className="absolute inset-x-0 top-[76px] text-[7px]">Utilization<br/>(Avg)</span></div><div className="mt-1">{value}</div></div>;
}

function EnterpriseThdKpi({ active, detail, label, value }: { active?: boolean; detail: string; label: string; value: string }) {
  return <article className={active ? "grid grid-cols-[58px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3" : "rounded border border-cyan-300/12 bg-[#061521]/92 p-3"}>
    {active ? <span className="grid size-12 place-items-center rounded-full bg-[#12b80f] text-white"><svg className="size-8" viewBox="0 0 42 42"><path d="M4 22h8l4-12 6 24 5-16 4 4h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/></svg></span> : null}
    <span><div className="text-[7px] text-slate-400">{label}</div><div className="mt-2 whitespace-nowrap text-[24px] leading-none">{value}</div><div className={detail === "Excellent" ? "mt-2 text-[10px] text-[#05ff5e]" : "mt-2 text-[8px] text-slate-300"}>{detail}</div></span>
  </article>;
}

function EnterpriseThdComplianceKpi() {
  return <article className="grid grid-cols-[1fr_86px] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3">
    <span><div className="text-[7px] text-slate-400">THD COMPLIANCE<br/>(IEEE 519)</div></span>
    <span className="relative size-[82px]"><svg className="size-[82px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#0b2233" strokeWidth="14"/><circle cx="50" cy="50" fill="none" r="35" stroke="#12b80f" strokeDasharray="202 220" strokeWidth="14" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#071a28" r="27"/></svg><span className="absolute inset-0 grid place-items-center text-center"><b className="text-[22px] font-medium leading-none">92%</b><br/><span className="text-[7px]">Compliant</span></span></span>
  </article>;
}

function EnterpriseThdReductionTrend() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  const before = "58,48 98,52 138,50 178,60 218,66 258,78 298,86 338,98 378,106 418,118 458,130 498,146";
  const after = "58,126 98,130 138,136 178,146 218,150 258,154 298,158 338,164 378,168 418,174 458,182 498,186";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end gap-5 text-[8px]"><span className="text-slate-400">● Before ECBS (Baseline)</span><span className="text-[#05ff5e]">● After ECBS</span></div><svg className="h-[158px] w-full" viewBox="0 0 540 190"><g stroke="rgba(148,163,184,.16)">{[20,44,68,92,116,140,164,188].map(y=><line key={y} x1="36" x2="530" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="8" y="22">14%</text><text x="8" y="46">12%</text><text x="8" y="70">10%</text><text x="13" y="94">8%</text><text x="13" y="118">6%</text><text x="13" y="142">4%</text><text x="13" y="166">2%</text><text x="13" y="188">0%</text></g><polyline fill="none" points={before} stroke="#64748b" strokeWidth="2"/><polyline fill="none" points={after} stroke="#12b80f" strokeWidth="2.5"/>{before.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#64748b" key={`b-${i}`} r="3"/>})}{after.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#12b80f" key={`a-${i}`} r="3"/>})}<g fill="#e2e8f0" fontSize="8"><text x="50" y="40">11.4%</text><text x="60" y="120">5.6%</text><text x="486" y="142">4.8%</text><text x="488" y="182">3.2%</text></g></svg><div className="flex justify-between px-10 text-[6.8px] text-slate-400">{months.map(m=><span key={m}>{m}</span>)}</div><div className="mt-1 grid grid-cols-5 gap-2 text-[8px]"><EnterpriseThdMiniStat label="Baseline THD (Avg)" value="11.4%" /><EnterpriseThdMiniStat label="Current THD (Avg)" value="3.2%" /><EnterpriseThdMiniStat label="Absolute Reduction" value="8.2%" /><EnterpriseThdMiniStat label="Relative Reduction" value="72%" /><EnterpriseThdMiniStat label="IEEE 519 Limit (8% for < 1kV)" value="Compliant" /></div></div>;
}

function EnterpriseThdMiniStat({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[6.7px] text-slate-400">{label}</div><div className="text-[11px] leading-tight text-[#05ff5e]">{value}</div></div>;
}

function EnterpriseThdBySite() {
  const rows = [["1","Flex Tijuana","1.2%","9.8%","87.8%","Excellent","#05ff5e"],["2","Flex Juarez South","2.1%","11.2%","81.3%","Excellent","#05ff5e"],["3","Flex Guadalajara","2.6%","10.7%","75.7%","Excellent","#05ff5e"],["4","Flex Hermosillo","2.8%","10.3%","72.8%","Excellent","#05ff5e"],["5","Flex Juarez North","5.5%","13.1%","58.0%","Good","#facc15"],["SYSTEM AVERAGE","","3.2%","11.4%","72.0%","",""]];
  return <div className="h-full text-[8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["","Site","Current THD (%)","Baseline THD (%)","Reduction (%)","Status"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className={ri===rows.length-1 ? "border-t border-white/10 bg-cyan-300/5 font-semibold" : "border-t border-white/5"} key={`${row[0]}-${row[1]}`}>{row.slice(0,6).map((cell,i)=><td className="py-1.5" key={`${row[0]}-${i}`}>{i===5 && cell ? <span><b className="mr-2 inline-block size-3 rounded-full" style={{background:row[6]}}/>{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-3 text-[#05ff5e]">View All Sites</div></div>;
}

function EnterpriseHarmonicSpectrum() {
  const bars = [["THD",78,46,"3.2%","5.6%"],["3rd",28,62,"1.1%","4.3%"],["5th",20,40,"1.1%","2.8%"],["7th",12,28,"0.7%","1.9%"],["11th",9,14,"0.3%","0.9%"],["13th",7,11,"0.2%","0.6%"],["17th",6,8,"0.2%","0.4%"],["19th",4,7,"0.1%","0.3%"],["23rd",3,5,"0.1%","0.2%"],["25th",2,4,"0.1%","0.2%"]];
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end gap-5"><span className="text-slate-400">● Before ECBS (Baseline)</span><span className="text-[#05ff5e]">● After ECBS</span></div><svg className="h-[154px] w-full" viewBox="0 0 410 160"><g stroke="rgba(148,163,184,.16)">{[22,44,66,88,110,132,154].map(y=><line key={y} x1="34" x2="400" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="8" y="24">6%</text><text x="8" y="46">5%</text><text x="8" y="68">4%</text><text x="8" y="90">3%</text><text x="8" y="112">2%</text><text x="8" y="134">1%</text><text x="8" y="156">0%</text></g>{bars.map(([label,gray,green,gv,bv],i)=>{const x=42+i*35; return <g key={label}><rect fill="#64748b" height={Number(gray)} width="8" x={x} y={150-Number(gray)}/><rect fill="#12b80f" height={Number(green)} width="8" x={x+10} y={150-Number(green)}/><text fill="#e2e8f0" fontSize="8" x={x-2} y={146-Number(gray)}>{bv}</text><text fill="#e2e8f0" fontSize="8" x={x+4} y={142-Number(green)}>{gv}</text><text fill="#94a3b8" fontSize="8" textAnchor="middle" x={x+8} y="158">{label}</text></g>})}</svg><div className="mt-1 text-slate-400">Harmonic Order</div><div className="mt-5 text-[#05ff5e]">View Full Harmonic Analysis</div></div>;
}

function EnterpriseThdByEquipment() {
  const rows = [["VFDs / Drives","3.3%","40.2%","#facc15"],["UPS Systems","2.1%","25.6%","#147dff"],["Lighting Systems","1.2%","14.6%","#00bcd4"],["HVAC Equipment","1.0%","12.2%","#64748b"],["IT / Data Centers","0.6%","7.4%","#e91e63"]];
  return <div className="grid h-full grid-cols-[116px_1fr] items-center gap-3 text-[8px]"><div className="relative"><svg className="size-[112px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#facc15" strokeDasharray="86 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="55 214" strokeDashoffset="-88" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#00bcd4" strokeDasharray="31 214" strokeDashoffset="-145" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#64748b" strokeDasharray="26 214" strokeDashoffset="-178" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#e91e63" strokeDasharray="16 214" strokeDashoffset="-206" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[39px] w-[112px] text-center"><b className="text-[18px]">8.2%</b><br/>Total THD<br/>Reduction</div></div><div className="space-y-3">{rows.map(([label,value,pct,color])=><div className="grid grid-cols-[10px_1fr_36px_38px] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span><span>{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Source Analysis</div></div></div>;
}

function EnterpriseThdComplianceSummary() {
  const rows = [["Compliant (≤ Limit)","21 Sites (92%)","#05ff5e"],["Marginal (80-100% of Limit)","2 Sites (8%)","#facc15"],["Non Compliant (> Limit)","0 Sites (0%)","#ef4444"]];
  return <div className="grid h-full grid-cols-[142px_1fr] items-center gap-4 text-[8px]"><div className="relative"><svg className="size-[132px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="197 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#facc15" strokeDasharray="17 214" strokeDashoffset="-198" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[47px] w-[132px] text-center"><b className="text-[24px]">92%</b><br/>Compliant</div></div><div className="space-y-6">{rows.map(([label,value,color])=><div className="grid grid-cols-[12px_1fr] gap-2" key={label}><span className="mt-1 size-3 rounded-full" style={{background:color}}/><span>{label}<br/><b className="font-medium text-slate-200">{value}</b></span></div>)}<div className="pt-1 text-[#05ff5e]">View Compliance Report</div></div></div>;
}

function EnterprisePowerFactorKpi({ active, detail, label, value }: { active?: boolean; detail: string; label: string; value: string }) {
  return <article className={active ? "grid grid-cols-[58px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3" : "rounded border border-cyan-300/12 bg-[#061521]/92 p-3"}>
    {active ? <span className="grid size-12 place-items-center rounded-full bg-[#14b8c8] text-white"><svg className="size-8" viewBox="0 0 42 42"><path d="M4 22h8l4-11 5 22 5-15 4 5h8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/></svg></span> : null}
    <span><div className="text-[7px] text-slate-400">{label}</div><div className="mt-2 whitespace-nowrap text-[24px] leading-none">{value}</div><div className={detail.includes("Target") ? "mt-2 text-[9px] text-[#05ff5e]" : "mt-2 text-[8px] text-slate-300"}>{detail}</div></span>
  </article>;
}

function EnterprisePowerFactorComplianceKpi() {
  return <article className="grid grid-cols-[1fr_86px] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3">
    <span><div className="text-[7px] text-slate-400">PF COMPLIANCE</div></span>
    <span className="relative size-[82px]"><svg className="size-[82px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#0b2233" strokeWidth="14"/><circle cx="50" cy="50" fill="none" r="35" stroke="#12b80f" strokeDasharray="172 220" strokeWidth="14" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#071a28" r="27"/></svg><span className="absolute inset-0 grid place-items-center text-center"><b className="text-[22px] font-medium leading-none">78%</b><br/><span className="text-[7px]">≥ 95% PF</span></span></span>
  </article>;
}

function EnterprisePowerFactorTrend() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  const points = "48,164 82,148 116,132 150,118 184,102 218,86 252,72 286,62 320,58 354,52 388,44 422,36 456,30 490,24 524,18 558,14";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end gap-1 text-[8px]">{["6M","12M","24M","YTD","All"].map(t=><span className={t==="12M" ? "rounded bg-[#147dff] px-4 py-1" : "rounded border border-cyan-300/12 px-4 py-1 text-slate-300"} key={t}>{t}</span>)}</div><svg className="h-[198px] w-full" viewBox="0 0 600 206"><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,126,152,178,202].map(y=><line key={y} x1="40" x2="588" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="8" y="24">100%</text><text x="13" y="50">98%</text><text x="13" y="76">96%</text><text x="13" y="102">94%</text><text x="13" y="128">92%</text><text x="13" y="154">90%</text><text x="13" y="180">88%</text><text x="13" y="204">80%</text></g><line stroke="#eab308" strokeDasharray="6 4" strokeWidth="2" x1="40" x2="588" y1="66" y2="66"/><line stroke="#94a3b8" strokeDasharray="6 4" strokeWidth="1.5" x1="40" x2="588" y1="146" y2="146"/><polyline fill="none" points={points} stroke="#14c8d6" strokeWidth="2.5"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#14c8d6" key={i} r="3"/>})}<text fill="#eab308" fontSize="9" x="520" y="82">Target (95%)</text><text fill="#e2e8f0" fontSize="8" x="484" y="148">Baseline (84.9%)</text></svg><div className="flex justify-between px-10 text-[7px] text-slate-400">{months.map(m=><span key={m}>{m}</span>)}</div><div className="mt-2 flex gap-9 text-[8px]"><span className="text-[#14c8d6]">● <span className="text-slate-300">Avg Power Factor (%)</span></span><span className="text-[#eab308]">▬ <span className="text-slate-300">Target (95%)</span></span><span className="text-slate-400">▬ Baseline (84.9%)</span></div></div>;
}

function EnterprisePowerFactorDistribution() {
  const rows = [["≥ 95% (Excellent)","18 sites (78%)","#12b80f"],["90% - 94.9% (Good)","4 sites (17%)","#147dff"],["80% - 89.9% (Fair)","1 site (4%)","#facc15"],["< 80% (Poor)","0 sites (0%)","#ef442e"]];
  return <div className="grid h-full grid-cols-[190px_1fr] items-center gap-5 text-[9px]"><div className="relative"><svg className="size-[172px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#12b80f" strokeDasharray="168 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="36 214" strokeDashoffset="-170" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#facc15" strokeDasharray="10 214" strokeDashoffset="-208" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[62px] w-[172px] text-center"><b className="text-[28px]">23</b><br/>Total Sites</div></div><div className="space-y-6">{rows.map(([label,value,color])=><div className="grid grid-cols-[14px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}</div></div>;
}

function EnterprisePowerFactorBySite() {
  const rows = [["1","Flex Tijuana","99.6%","86.7%","▲ 12.9%","Excellent","#05ff5e"],["2","Flex Juarez North","98.9%","85.4%","▲ 13.5%","Excellent","#05ff5e"],["3","Flex Juarez South","98.2%","84.2%","▲ 14.0%","Excellent","#05ff5e"],["4","Flex Guadalajara","97.6%","83.8%","▲ 13.8%","Excellent","#05ff5e"],["5","Flex Hermosillo","92.7%","81.6%","▲ 11.1%","Good","#147dff"]];
  return <EnterprisePowerFactorTable headers={["","Site","Current PF (Avg)","Baseline PF (Avg)","Improvement","Status"]} rows={rows} link="View All Sites" />;
}

function EnterprisePowerFactorByTransformer() {
  const rows = [["TX-01","Flex Tijuana","99.7%","86.4%","▲ 13.3%"],["TX-02","Flex Tijuana","99.3%","85.9%","▲ 13.4%"],["TX-01","Flex Juarez North","98.9%","85.2%","▲ 13.7%"],["TX-02","Flex Juarez North","98.8%","84.8%","▲ 14.0%"],["TX-01","Flex Juarez South","98.4%","83.6%","▲ 14.8%"]];
  return <EnterprisePowerFactorTable headers={["Transformer","Site","Current PF","Baseline PF","Improvement"]} rows={rows} link="View All Transformers" compact />;
}

function EnterprisePowerFactorTable({ compact, headers, link, rows }: { compact?: boolean; headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[7.6px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row)=><tr className="border-t border-white/5" key={`${row[0]}-${row[1]}`}>{row.slice(0, compact ? 5 : 6).map((cell,i)=><td className={cell.includes("▲") || cell === "Excellent" ? "py-1.5 text-[#05ff5e]" : cell === "Good" ? "py-1.5 text-[#147dff]" : "py-1.5"} key={`${row[0]}-${i}`}>{!compact && i===5 ? <span><b className="mr-2 inline-block size-2.5 rounded-full" style={{background:row[6]}}/>{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-3 text-[#05ff5e]">{link}</div></div>;
}

function EnterprisePowerFactorImprovement() {
  return <div className="grid h-full grid-cols-[1fr_124px] gap-3 text-[8px]"><div className="border-r border-cyan-300/10 pr-3"><div className="mb-8 text-slate-400">AVERAGE IMPROVEMENT</div><div className="text-[28px] leading-none text-[#05ff5e]">▲ 13.2%</div><div className="mt-2 text-center text-slate-300">vs Baseline</div><div className="mt-8 flex items-center justify-between"><span>84.9%</span><span className="h-1 w-20 rounded bg-gradient-to-r from-[#14c8d6] to-white" /><span>98.1%</span></div></div><div className="relative text-center"><div className="mb-1 text-slate-400">PF TARGET COMPLIANCE</div><svg className="mx-auto size-[104px]" viewBox="0 0 100 100"><path d="M14 74 A38 38 0 0 1 86 74" fill="none" stroke="#17324a" strokeWidth="10"/><path d="M14 74 A38 38 0 0 1 86 74" fill="none" stroke="#12b80f" strokeDasharray="82 120" strokeWidth="10"/><path d="M78 38 A38 38 0 0 1 86 74" fill="none" stroke="#f97316" strokeWidth="10"/><line stroke="#e2e8f0" strokeLinecap="round" strokeWidth="2" x1="50" x2="73" y1="74" y2="50"/><circle cx="50" cy="74" fill="#e2e8f0" r="3"/><text fill="#e2e8f0" fontSize="8" x="16" y="84">80%</text><text fill="#e2e8f0" fontSize="8" x="70" y="84">100%</text><text fill="#eab308" fontSize="8" x="76" y="58">95%</text></svg><div className="-mt-5 text-[26px] leading-none">98.1%</div><div className="text-[9px]">Current Avg PF</div><div className="mt-3 text-left text-[#05ff5e]">View Improvement Analysis</div></div></div>;
}

function EnterpriseLossKpi({ detail, icon, label, tone, value }: { detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className="grid grid-cols-[46px_1fr] items-center rounded border border-cyan-300/12 bg-[#061521]/92 p-3"><span className="grid size-10 place-items-center rounded-full text-xl text-white" style={{background:tone}}>{icon}</span><span><div className="text-[7px] text-slate-400">{label}</div><div className="mt-1 whitespace-nowrap text-[18px] leading-none">{value}</div><div className="mt-2 text-[7px] text-[#05ff5e]">{detail}</div></span></article>;
}

function EnterpriseLossBreakdown() {
  const rows = [["I²R Conductor Losses","642 kW","41.1%","#12b80f"],["Transformer Losses","358 kW","22.9%","#147dff"],["Harmonic Losses","256 kW","16.4%","#f59e0b"],["Equipment Losses","198 kW","12.7%","#8b5cf6"],["Other Losses","107 kW","6.9%","#84cc16"]];
  return <div className="grid h-full grid-cols-[130px_1fr] items-center gap-3 text-[8px]"><div className="relative"><svg className="size-[118px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#12b80f" strokeDasharray="88 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="49 214" strokeDashoffset="-90" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="35 214" strokeDashoffset="-141" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#8b5cf6" strokeDasharray="27 214" strokeDashoffset="-178" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[42px] w-[118px] text-center"><span>Total Losses<br/>Baseline</span><br/><b className="text-[15px]">1,561 kW</b></div></div><div className="space-y-2.5">{rows.map(([label,value,pct,color])=><div className="grid grid-cols-[10px_1fr_44px_36px] gap-2" key={label}><span className="mt-1 size-2 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span><span>{pct}</span></div>)}<div className="pt-3 text-[#05bfff]">View Loss Breakdown Details &nbsp; ›</div></div></div>;
}

function EnterpriseLossWaterfall() {
  const bars: Array<[string, number, string, string]> = [["Baseline\nLosses",126,"#64748b","781 kW"],["I²R Conductor\nLosses",38,"#12b80f","-228 kW"],["Transformer\nLosses",18,"#12b80f","-96 kW"],["Harmonic\nLosses",24,"#12b80f","-102 kW"],["Equipment\nLosses",10,"#12b80f","-71 kW"],["Other\nLosses",6,"#12b80f","-32 kW"],["Current\nLosses",36,"#147dff","252 kW"]];
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-end"><span className="rounded bg-[#063b27] px-4 py-1 text-[#05ff5e]">40.0% Reduction</span></div><svg className="h-[142px] w-full" viewBox="0 0 520 148"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90,114,138].map(y=><line key={y} x1="38" x2="510" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="8" y="22">1,000</text><text x="14" y="46">800</text><text x="14" y="70">600</text><text x="14" y="94">400</text><text x="14" y="118">200</text><text x="24" y="140">0</text></g>{bars.map(([label,h,color,value],i)=>{const x=70+i*62; const y=136-Number(h); return <g key={label}><rect fill={color} height={h} width="34" x={x} y={y}/><text fill="#e2e8f0" fontSize="8" textAnchor="middle" x={x+17} y={y-5}>{value}</text><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+17} y="146">{String(label).split("\\n").map((line,li)=><tspan dy={li ? 8 : 0} key={line} x={x+17}>{line}</tspan>)}</text></g>})}</svg><div className="mt-4 text-[#05bfff]">View Waterfall Analysis &nbsp; ›</div></div>;
}

function EnterpriseLossSummary() {
  const rows = [["Baseline Losses","781 kW",""],["Current Losses (YTD)","252 kW",""],["Losses Reduced","312 kW","#05ff5e"],["Reduction Percentage","40.0%","#05ff5e"],["Annualized Losses Saved","2,737,680 kWh",""],["Annual Cost Savings","$524,180",""]];
  return <div className="space-y-3 text-[9px]">{rows.map(([label,value,color])=><div className="flex justify-between" key={label}><span className="text-slate-300">{label}</span><b style={{color: color || "#e2e8f0"}}>{value}</b></div>)}<div className="pt-3 text-[#05bfff]">View Summary Details &nbsp; ›</div></div>;
}

function EnterpriseLossTrend() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  const baseline = "44,42 78,44 112,45 146,47 180,48 214,49 248,51 282,52 316,54 350,56 384,58 418,60";
  const current = "44,104 78,108 112,112 146,118 180,122 214,126 248,128 282,130 316,132 350,134 384,136 418,138";
  return <div className="h-full text-[8px]"><div className="mb-1 flex justify-center gap-6"><span className="text-[#147dff]">● Baseline Losses (kW)</span><span className="text-[#12b80f]">● Current Losses (kW)</span></div><svg className="h-[122px] w-full" viewBox="0 0 450 132"><g stroke="rgba(148,163,184,.16)">{[16,38,60,82,104,126].map(y=><line key={y} x1="34" x2="440" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="4" y="18">1,000</text><text x="11" y="40">750</text><text x="11" y="62">500</text><text x="11" y="84">250</text><text x="22" y="128">0</text></g><polyline fill="none" points={baseline} stroke="#147dff" strokeWidth="2"/><polyline fill="none" points={current} stroke="#12b80f" strokeWidth="2.5"/>{baseline.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#147dff" key={`b-${i}`} r="2.5"/>})}{current.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#12b80f" key={`c-${i}`} r="2.5"/>})}</svg><div className="flex justify-between px-9 text-[6.7px] text-slate-400">{months.map(m=><span key={m}>{m}</span>)}</div><div className="mt-2 grid grid-cols-4 gap-2 text-[8px]"><EnterpriseLossMini label="Avg Reduction" value="40.0%" /><EnterpriseLossMini label="Peak Reduction" value="48.6%" sub="(Dec 2024)" /><EnterpriseLossMini label="Total Reduction (YTD)" value="312 kW" /><EnterpriseLossMini label="Best Month" value="Dec 2024" sub="48.6% reduction" /></div></div>;
}

function EnterpriseLossMini({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return <div><div className="text-[6.7px] text-slate-400">{label}</div><div className="text-[12px] leading-tight text-[#05ff5e]">{value}</div>{sub ? <div className="text-[6.5px] text-[#05ff5e]">{sub}</div> : null}</div>;
}

function EnterpriseLossCategoryTable() {
  const rows = [["I²R Conductor Losses","642","414","35.5%"],["Transformer Losses","358","214","40.2%"],["Harmonic Losses","256","126","50.8%"],["Equipment Losses","198","104","47.5%"],["Other Losses","107","63","41.1%"]];
  return <div className="h-full text-[7.6px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Category","Baseline (kW)","Current (kW)","Reduction (%)"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className="py-1.5" key={`${row[0]}-${i}`}>{i===3 ? <span className="inline-flex items-center gap-2"><i className="block h-1.5 w-10 rounded bg-[#12b80f]" />{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-4 text-[#05bfff]">View Category Analysis &nbsp; ›</div></div>;
}

function EnterpriseLossBySite() {
  const rows = [["Flex Tijuana","152","78","74","48.7%"],["Flex Juarez North","98","52","46","46.9%"],["Flex Juarez South","87","43","44","50.6%"],["Flex Guadalajara","76","37","39","51.3%"],["Flex Hermosillo","64","32","32","50.0%"]];
  return <div className="h-full text-[7.6px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Site","Baseline (kW)","Current (kW)","Reduction (kW)","Reduction (%)"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className="py-1.5" key={`${row[0]}-${i}`}>{i===4 ? <span className="inline-flex items-center gap-2">{cell}<i className="block h-1.5 w-10 rounded bg-[#12b80f]" /></span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-4 text-[#05bfff]">View All Sites &nbsp; ›</div></div>;
}

function EnterpriseLossSourceDetail() {
  const rows = [["I²R Conductor Losses","Cable & conductor resistance losses","642","414","228","35.5%","1,041,120","$187,850"],["Transformer Losses","Core & copper losses in transformers","358","214","144","40.2%","657,600","$118,370"],["Harmonic Losses","Additional losses due to harmonics","256","126","130","50.8%","595,000","$107,100"],["Equipment Losses","Motor, VFD, and equipment inefficiencies","198","104","94","47.5%","443,520","$79,830"],["Other Losses","Miscellaneous & unclassified losses","107","63","44","41.1%","347,440","$31,030"],["Total","","1,561","921","312","40.0%","3,084,680","$524,180"]];
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Loss Source","Description","Baseline (kW)","Current (kW)","Reduction (kW)","Reduction (%)","Annualized kWh Saved","Annual Savings"].map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className={ri===rows.length-1 ? "border-t border-white/10 font-semibold" : "border-t border-white/5"} key={row[0]}>{row.map((cell,i)=><td className={i>3 ? "py-0.5 text-[#e2e8f0]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05bfff]">View Full Loss Analysis Report &nbsp; ›</div></div>;
}

function EnterpriseLossInsights() {
  const rows = [["↑","Excellent Performance","Total losses reduced by 40.0% vs baseline, exceeding the 30% target.","#05ff5e"],["↗","Top Opportunity","I²R conductor losses remain the largest loss category at 414 kW.","#05bfff"],["◎","Best Performing Site","Flex Guadalajara achieved 51.3% loss reduction.","#f59e0b"],["♙","Next Review","Continue monitoring harmonic levels and transformer loading.","#8b5cf6"]];
  return <div className="space-y-2 text-[7.2px]">{rows.map(([icon,title,body,color])=><div className="grid grid-cols-[22px_1fr] gap-2" key={title}><span className="grid size-5 place-items-center rounded-full border" style={{borderColor:color,color}}>{icon}</span><span><b style={{color}}>{title}</b><br/><span className="text-slate-300">{body}</span></span></div>)}<div className="pt-0.5 text-[#05bfff]">View Insights Report &nbsp; ›</div></div>;
}

function EnterpriseExpandedMap() {
  const clusters = [
    ["8","13%","40%","#05b82e"],["12","24%","43%","#05b82e"],["3","30%","36%","#05b82e"],["2","18%","50%","#facc15"],["7","45%","39%","#05b82e"],["2","64%","48%","#facc15"],["1","55%","55%","#facc15"],["1","80%","41%","#ef4444"],["4","84%","82%","#05b82e"],["3","30%","92%","#05b82e"],["2","31%","61%","#05b82e"],["1","55%","82%","#05b82e"],["1","78%","60%","#05b82e"]
  ];
  const dots = [["16%","32%"],["20%","58%"],["25%","63%"],["35%","58%"],["43%","37%"],["72%","66%"],["82%","88%"],["88%","83%"],["74%","57%"],["26%","53%"]];
  return <div className="relative h-[488px] overflow-hidden rounded border border-cyan-300/12 bg-[#03101b]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_47%,rgba(5,255,94,.22),transparent_12%),radial-gradient(circle_at_47%_40%,rgba(5,255,94,.16),transparent_10%),radial-gradient(circle_at_82%_78%,rgba(5,255,94,.14),transparent_11%),linear-gradient(180deg,#06223a,#02101c)]" />
    <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 1000 520" preserveAspectRatio="none">
      <g fill="#073453" stroke="#0b4971" strokeWidth="1.2">
        <path d="M100 115 C150 68 250 58 330 98 C288 128 292 174 224 180 C180 188 144 168 100 115Z" />
        <path d="M210 218 C280 205 360 230 398 306 C330 318 302 396 246 360 C210 334 184 276 210 218Z" />
        <path d="M455 112 C538 62 670 78 735 126 C690 166 606 160 548 188 C500 210 456 176 455 112Z" />
        <path d="M490 215 C548 210 602 242 626 312 C592 368 536 380 496 328 C472 292 470 252 490 215Z" />
        <path d="M705 172 C802 112 902 122 942 218 C862 228 820 290 748 270 C710 250 690 212 705 172Z" />
        <path d="M800 352 C856 342 920 366 956 418 C900 450 824 438 800 352Z" />
      </g>
      <g fill="none" stroke="#0f3b5b" strokeOpacity=".55">{[130,210,290,370,450].map(y=><path d={`M0 ${y} H1000`} key={`h${y}`}/>)}{[120,250,380,510,640,770,900].map(x=><path d={`M${x} 0 V520`} key={`v${x}`}/>)}</g>
      <g fill="#94a3b8" fontSize="13" fontWeight="700" opacity=".72"><text x="190" y="150">NORTH</text><text x="190" y="168">AMERICA</text><text x="545" y="178">EUROPE</text><text x="734" y="184">ASIA</text><text x="300" y="352">SOUTH</text><text x="300" y="370">AMERICA</text><text x="560" y="340">AFRICA</text><text x="850" y="400">AUSTRALIA</text></g>
    </svg>
    <div className="absolute left-3 top-3 flex rounded border border-cyan-300/12 bg-[#061421] p-1 text-[10px]"><span className="rounded bg-[#0f7d31] px-4 py-2 text-white">Map</span><span className="px-4 py-2 text-slate-300">Satellite</span></div>
    <div className="absolute left-3 top-[70px] grid gap-2 text-xl"><span className="grid size-8 place-items-center rounded border border-cyan-300/20 bg-[#061421]">+</span><span className="grid size-8 place-items-center rounded border border-cyan-300/20 bg-[#061421]">−</span><span className="grid size-8 place-items-center rounded border border-cyan-300/20 bg-[#061421]">⊙</span><span className="grid size-8 place-items-center rounded border border-cyan-300/20 bg-[#061421]">□</span></div>
    {dots.map(([left,top],i)=><span className="absolute size-2 rounded-full bg-[#05ff5e] shadow-[0_0_10px_#05ff5e]" key={i} style={{left,top}} />)}
    {clusters.map(([label,left,top,color])=><span className="absolute grid size-8 place-items-center rounded-full text-[12px] font-bold text-[#02200e] shadow-[0_0_0_10px_rgba(5,255,94,.12),0_0_18px_rgba(5,255,94,.45)]" key={`${label}-${left}`} style={{left,top,background:color}}>{label}</span>)}
    <div className="absolute bottom-5 left-4 w-[126px] rounded border border-cyan-300/12 bg-[#061421]/88 p-3 text-[10px]"><b>SITE HEALTH</b><div className="mt-3 space-y-2">{[["Healthy","#05ff5e"],["Warning","#facc15"],["Critical","#ef4444"],["Cluster (Sites)","transparent"]].map(([label,color])=><div className="flex items-center gap-2" key={label}><span className="size-3 rounded-full border border-[#05ff5e]" style={{background:color}} />{label}</div>)}</div></div>
  </div>;
}

function EnterpriseMapGlobalSummary() {
  const rows = [["Total Sites","23",""],["Healthy","18 (78%)","#05ff5e"],["Warning","3 (13%)","#facc15"],["Critical","2 (9%)","#ef4444"],["Total Capacity Recovered","4,850 kVA","#05ff5e"],["Annual Savings","$1.84M",""],["Avg Power Factor","98.1%",""],["Avg THD","3.2%",""]];
  return <div className="space-y-3 text-[10px]">{rows.map(([label,value,color],i)=><div className={i>3 ? "border-t border-white/5 pt-3" : ""} key={label}><div className="text-slate-300">{label}</div><div className={Number.isNaN(Number(value.charAt(0))) && !value.startsWith("$") ? "mt-1" : "mt-1 text-[20px] leading-none"} style={{color:color || "#e2e8f0"}}>{i>0 && i<4 ? <span><b className="mr-2 inline-block size-2.5 rounded-full" style={{background:color}} />{value}</span> : value}</div></div>)}</div>;
}

function EnterpriseMapRegionSummary() {
  const rows = [["North America","17 (74%)","#05ff5e"],["South America","2 (9%)","#05ff5e"],["Europe","7 (30%)","#05ff5e"],["Asia","2 (9%)","#facc15"],["Africa","1 (4%)","#facc15"],["Australia","4 (17%)","#05ff5e"]];
  return <div className="space-y-4 text-[9px]">{rows.map(([label,value,color])=><div className="flex justify-between" key={label}><span>{label}</span><b style={{color}}>{value}</b></div>)}<div className="pt-2 text-[#05ff5e]">View Region Analysis &nbsp; ›</div></div>;
}

function EnterpriseMapSitesTable() {
  const rows = [["Flex Tijuana","Tijuana, Mexico","Healthy","850","99.6","1.2","$234,500","May 18, 2025 10:12 AM"],["Flex Juarez North","Juarez, Mexico","Healthy","720","98.9","2.1","$208,300","May 18, 2025 10:08 AM"],["Flex Juarez South","Juarez, Mexico","Healthy","680","98.2","2.6","$187,600","May 18, 2025 09:57 AM"],["Flex Guadalajara","Guadalajara, Mexico","Healthy","610","97.6","2.8","$166,200","May 18, 2025 09:45 AM"],["Flex Hermosillo","Hermosillo, Mexico","Warning","540","92.7","5.5","$149,700","May 18, 2025 08:50 AM"]];
  return <div className="h-full text-[6.9px]"><div className="mb-1 flex justify-end"><input className="h-6 w-[210px] rounded border border-cyan-300/12 bg-[#03101b] px-3 text-[7px]" placeholder="Search site..." readOnly /></div><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Site","Location","Status","Capacity Recovered (kVA)","Avg Power Factor (%)","THD (%)","Annual Savings","Last Updated"].map(h=><th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className="py-1" key={`${row[0]}-${i}`}>{i===2 ? <span><b className="mr-2 inline-block size-2.5 rounded-full" style={{background:cell==="Healthy"?"#05ff5e":"#facc15"}}/>{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-1 flex items-center justify-between text-slate-400"><span>Showing 1 to 5 of 23 sites</span><span className="space-x-2"><b className="rounded bg-[#0f7d31] px-3 py-1 text-white">1</b><b className="rounded border border-cyan-300/12 px-3 py-1">2</b><b className="rounded border border-cyan-300/12 px-3 py-1">0</b><span>...</span><b className="rounded border border-cyan-300/12 px-3 py-1">5</b><b className="rounded border border-cyan-300/12 px-3 py-1">›</b></span></div></div>;
}

function EnterpriseNetworkOverviewScore() {
  return <article className="flex h-full flex-col rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[8px]"><h3 className="mb-2 text-[10px] font-semibold">OVERALL NETWORK HEALTH</h3><div className="grid grid-cols-[100px_1fr] items-center gap-3"><EnterpriseOverviewRing value="97%" /><div className="space-y-4"><div><b className="text-[#05ff5e]">▲ 5%</b> vs Last Week (92%)</div><div><b className="text-[#05ff5e]">▲ 8%</b> vs Last Month (89%)</div></div></div><div className="mt-auto h-2 rounded bg-gradient-to-r from-red-500 via-yellow-400 via-60% to-[#05ff5e]" /><div className="mt-2 flex justify-between text-[7px] text-slate-300"><span>0%</span><span>50%</span><span>100%</span></div></article>;
}

function EnterpriseHealthIndexCard({ link, rows, title, value }: { link: string; rows: string[][]; title: string; value: string }) {
  return <article className="grid h-full grid-cols-[96px_1fr] gap-3 rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[8px]"><div><h3 className="mb-2 whitespace-nowrap text-[10px] font-semibold">{title}</h3><EnterpriseOverviewRing value={value} sub="/100" /></div><div className="flex h-full flex-col pt-7"><div className="space-y-3">{rows.map(([label,val,color])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={label}><span className="mt-1 size-2.5 rounded-full" style={{background:color}}/><span>{label}</span><b>{val}</b></div>)}</div><div className="mt-auto pb-1 text-[#05ff5e]">{link} &nbsp; ›</div></div></article>;
}

function EnterpriseOverviewRing({ sub = "Excellent", value }: { sub?: string; value: string }) {
  return <div className="relative size-[86px]"><svg className="size-[86px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#0f5130" strokeWidth="12"/><circle cx="50" cy="50" fill="none" r="35" stroke="#05b82e" strokeDasharray="208 220" strokeWidth="12" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="27"/><path d="M50 15 A35 35 0 0 1 61 17" stroke="#facc15" strokeWidth="12"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[20px]">{value}</b><br/><span className="text-[8px]">{sub}</span></span></div></div>;
}

function EnterpriseBalanceIndexBreakdown() {
  return <div className="grid h-full grid-cols-3 gap-2 text-center text-[7px]">{[["PHASE BALANCE","96%","Voltage Unbalance","1.2%","Target < 2%"],["VOLTAGE BALANCE","94%","Avg Voltage Deviation","1.8%","Target < 3%"],["LOAD BALANCE","95%","Load Unbalance","2.1%","Target < 5%"]].map(([title,pct,label,val,target])=><div className="rounded border border-cyan-300/12 bg-[#061421]/80 p-2" key={title}><div className="mb-1 text-[8px]">{title}</div><svg className="mx-auto h-[42px] w-[76px]" viewBox="0 0 100 54"><path d="M12 48 A38 38 0 0 1 88 48" fill="none" stroke="#1f2937" strokeWidth="10"/><path d="M12 48 A38 38 0 0 1 88 48" fill="none" stroke="#35d399" strokeWidth="10"/><line stroke="#05ff5e" strokeWidth="2" x1="50" x2="50" y1="10" y2="24"/></svg><b className="text-[15px] text-[#05ff5e]">{pct}</b><div>Excellent</div><div className="mt-1 text-slate-400">{label}</div><div className="text-[18px] leading-none text-[#05ff5e]">{val}</div><div>{target}</div></div>)}</div>;
}

function EnterpriseHarmonicBreakdown() {
  const rows = [["Voltage THD","3.2%","#05ff5e"],["Current THD","4.1%","#147dff"],["5th Harmonic","2.1%","#facc15"],["7th Harmonic","1.4%","#ef4444"],["Other Harmonics","0.8%","#7dd3fc"]];
  return <div className="grid h-full grid-cols-[94px_1fr] items-center gap-3 text-[8px]"><EnterpriseOverviewRing value="96" sub="/100" /><div className="space-y-3">{rows.map(([label,val,color])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={label}><span className="mt-1 size-2.5 rounded-full" style={{background:color}}/><span>{label}</span><b>{val}</b></div>)}</div></div>;
}

function EnterpriseAssetHealthBars() {
  const rows = [["▥","Transformer Health","98%"],["▣","Device Health","97%"],["▤","Infrastructure Health","98%"],["♧","Maintenance Health","98%"]];
  return <div className="space-y-5 text-[9px]">{rows.map(([icon,label,pct])=><div className="grid grid-cols-[22px_1fr_170px_34px] items-center gap-3" key={label}><span className="text-[#05bfff]">{icon}</span><span>{label}</span><span className="h-2 rounded bg-white/5"><i className="block h-2 rounded bg-[#05b82e]" style={{width:pct}}/></span><b>{pct}</b></div>)}</div>;
}

function EnterpriseBalanceTrend() {
  const lines = [["#05ff5e","48,84 70,78 92,74 114,78 136,72 158,74 180,70 202,70 224,68 246,65 268,63 290,64 312,66 334,60 356,58"],["#147dff","48,98 70,94 92,98 114,90 136,94 158,88 180,86 202,82 224,80 246,76 268,72 290,70 312,76 334,73 356,68"],["#f59e0b","48,92 70,98 92,94 114,102 136,90 158,92 180,88 202,86 224,82 246,84 268,76 290,82 312,80 334,76 356,74"]];
  return <div className="h-full text-[7px]"><div className="mb-1 flex gap-5 pl-10">{[["#05ff5e","Current Balance Index"],["#147dff","Voltage Balance"],["#f59e0b","Load Balance"]].map(([c,l])=><span key={l}><b className="mr-1 inline-block h-0.5 w-4" style={{background:c}}/>{l}</span>)}</div><svg className="h-[200px] w-full" viewBox="0 0 390 210"><g stroke="rgba(148,163,184,.16)">{[28,62,96,130,164,198].map(y=><line key={y} x1="42" x2="366" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8">{["100","90","80","70","60","50"].map((t,i)=><text key={t} x="12" y={32+i*34}>{t}</text>)}</g>{lines.map(([color,points])=><polyline fill="none" key={color} points={points} stroke={color} strokeWidth="2" transform="translate(0 32) scale(1 1.12)"/>)}<text fill="#f59e0b" fontSize="8" x="320" y="132">Target (90%)</text>{["Apr 19","Apr 24","Apr 29","May 04","May 09","May 14","May 18"].map((d,i)=><text fill="#94a3b8" fontSize="8" key={d} x={42+i*52} y="208">{d}</text>)}</svg><div className="-mt-1 text-[#05ff5e]">View Full Balance Analysis &nbsp; ›</div></div>;
}

function EnterpriseHarmonicSpectrumOverview() {
  const labels = ["THD","3rd","5th","7th","11th","13th","17th","19th","23rd","25th"];
  const voltage = [3.2,1.6,2.1,1.4,0.8,0.6,0.5,0.4,0.3,0.1];
  const current = [4.1,2.8,1.9,0.8,0.7,0.6,0.4,0.3,0.1,0.1];
  return <div className="h-full text-[7px]"><div className="mb-1 flex justify-end gap-5"><span><b className="mr-1 inline-block size-2 bg-[#05ff5e]"/>Voltage (%)</span><span><b className="mr-1 inline-block size-2 bg-[#147dff]"/>Current (%)</span></div><svg className="h-[200px] w-full" viewBox="0 0 330 210"><g stroke="rgba(148,163,184,.16)">{[28,62,96,130,164,198].map(y=><line key={y} x1="34" x2="322" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8">{["5%","4%","3%","2%","1%","0%"].map((t,i)=><text key={t} x="8" y={32+i*34}>{t}</text>)}</g>{labels.map((label,i)=>{const x=45+i*27; const vh=voltage[i]*34; const ch=current[i]*34; return <g key={label}><rect fill="#05ff5e" height={vh} width="8" x={x} y={198-vh}/><rect fill="#147dff" height={ch} width="8" x={x+10} y={198-ch}/><text fill="#94a3b8" fontSize="7" textAnchor="middle" x={x+9} y="208">{label}</text>{i<5 ? <text fill="#e2e8f0" fontSize="7" textAnchor="middle" x={x+9} y={192-Math.max(vh,ch)}>{current[i]}%</text> : null}</g>})}</svg><div className="-mt-1 text-[#05ff5e]">View Full Harmonic Analysis &nbsp; ›</div></div>;
}

function EnterpriseNetworkHealthIssues() {
  const rows = [["Flex Juarez South","High Current THD","Critical","High","May 18, 10:12 AM"],["Flex Hermosillo","Voltage Unbalance","Warning","Medium","May 18, 09:58 AM"],["Flex Guadalajara","Transformer Loading","Warning","Medium","May 18, 09:41 AM"],["Flex Tijuana","Device Offline","Info","Low","May 18, 09:33 AM"],["Flex Juarez North","Harmonic Trend","Info","Low","May 18, 09:21 AM"],["Flex Juarez South","Capacitor Maintenance","Info","Low","May 18, 09:05 AM"]];
  return <div className="h-full text-[7px]"><div className="mb-2 flex gap-2">{[["All (6)","#063b27"],["Critical (1)","#4c1010"],["Warning (3)","#4a3410"],["Info (2)","#0f2746"]].map(([label,bg])=><span className="rounded border border-cyan-300/12 px-2 py-1" key={label} style={{background:bg}}>{label}</span>)}</div><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Site","Issue","Severity","Impact","Detected"].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={`${row[0]}-${row[1]}`}>{row.map((cell,i)=><td className={i===2 ? (cell==="Critical"?"py-1.5 text-red-400":cell==="Warning"?"py-1.5 text-yellow-400":"py-1.5 text-[#05bfff]") : "py-1.5"} key={`${row[1]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-3 text-[#05ff5e]">View All Issues &nbsp; ›</div></div>;
}

function EnterpriseTransformerHero() {
  return <article className="grid h-full grid-cols-[112px_1fr] gap-4 rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><div className="relative"><div className="absolute bottom-1 left-3 h-16 w-[76px] rounded bg-gradient-to-b from-slate-500 to-slate-800 shadow-[0_18px_20px_rgba(0,0,0,.45)]" /><div className="absolute left-6 top-1 h-20 w-2 rounded bg-slate-500" /><div className="absolute left-11 top-0 h-20 w-2 rounded bg-slate-500" /><div className="absolute left-16 top-1 h-20 w-2 rounded bg-slate-500" /><div className="absolute left-2 top-10 h-14 w-2 rounded bg-slate-600" /><div className="absolute right-3 top-10 h-14 w-2 rounded bg-slate-600" /><div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700" /></div><div><div className="mb-2 flex items-center gap-3"><h2 className="text-[24px] font-light leading-none">XF-TIJ-01</h2><span className="size-3 rounded-full bg-[#05ff5e]" /><span>Healthy</span></div><div>3-Phase Oil-Filled Transformer</div><div className="mt-2 text-slate-300">Flex Tijuana &nbsp; • &nbsp; Main Substation</div><div className="mt-2">2,000 kVA &nbsp; • &nbsp; 13.8 kV / 480 V</div><div className="mt-2 text-slate-300">Installed: Apr 15, 2024</div><div className="mt-2">Serial: TR-00123 &nbsp; • &nbsp; Manufacturer: Siemens</div></div></article>;
}

function EnterpriseTransformerKpi({ detail, sub, title, tone, value }: { detail: string; sub: string; title: string; tone: string; value: string }) {
  return <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-2.5 text-center text-[8px]"><h3 className="mb-2 text-[9px] font-semibold">{title}</h3><div className="relative mx-auto size-[76px]"><svg className="size-[76px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#1f2937" strokeWidth="10"/><circle cx="50" cy="50" fill="none" r="35" stroke={tone} strokeDasharray="176 220" strokeLinecap="round" strokeWidth="10" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="26"/></svg><div className="absolute inset-0 grid place-items-center"><span><b className="text-[21px] leading-none">{value}</b><br/><span className="text-[7px]">{sub}</span></span></div></div><div className="mt-2 font-semibold" style={{color:tone}}>{detail}</div></article>;
}

function EnterpriseTransformerStatus() {
  const rows = [["Operational","#05ff5e"],["No Active Alerts","#05ff5e"],["All Systems Normal","#05ff5e"]];
  return <article className="rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><h3 className="mb-4 text-[9px] font-semibold">STATUS</h3><div className="space-y-4">{rows.map(([label,color])=><div className="flex items-center gap-3" key={label}><span className="grid size-4 place-items-center rounded-full border" style={{borderColor:color,color}}>✓</span><span>{label}</span></div>)}</div></article>;
}

function EnterpriseTransformerElectricalValues() {
  const rows = [["Voltage (Primary)","13.82","13.79","13.81","13.81","kV"],["Voltage (Secondary)","481","479","480","480","V"],["Current (Primary)","41.2","39.8","40.6","40.5","A"],["Current (Secondary)","1,243","1,196","1,218","1,219","A"],["kVA","1,148","1,103","1,132","1,128","kVA"],["kW","1,056","1,016","1,044","1,039","kW"],["Power Factor","0.92","0.92","0.92","0.92","PF"],["Frequency","60.00","60.01","60.00","60.00","Hz"]];
  return <div className="h-full text-[7px]"><div className="mb-1 text-right text-[6.8px] text-slate-400">Updated: 10:15:43 AM</div><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Parameter","Phase A","Phase B","Phase C","Average","Units"].map(h=><th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className="py-1" key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05bfff]">View Real-Time Trends &nbsp; ›</div></div>;
}

function EnterpriseTransformerLoadTrend() {
  return <div className="h-full text-[7px]"><div className="mb-1 flex justify-end gap-5"><span><b className="mr-1 inline-block h-0.5 w-4 bg-[#05ff5e]"/>% of Rated Capacity</span><span><b className="mr-1 inline-block h-0.5 w-4 bg-[#147dff]"/>kVA</span></div><svg className="h-[132px] w-full" viewBox="0 0 360 146"><g stroke="rgba(148,163,184,.16)">{[22,50,78,106,134].map(y=><line key={y} x1="36" x2="342" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8">{["100%","75%","50%","25%","0%"].map((t,i)=><text key={t} x="4" y={25+i*28}>{t}</text>)}</g><polyline fill="none" points="38,78 58,70 78,68 98,72 118,70 138,74 158,72 178,76 198,78 218,76 238,71 258,68 278,72 298,74 318,70 338,67" stroke="#05ff5e" strokeWidth="2"/><polyline fill="none" points="38,92 58,90 78,87 98,90 118,88 138,92 158,89 178,92 198,93 218,90 238,89 258,88 278,92 298,90 318,89 338,86" stroke="#147dff" strokeWidth="2"/>{["Apr 19","Apr 24","Apr 29","May 04","May 09","May 14","May 18"].map((d,i)=><text fill="#94a3b8" fontSize="7" key={d} x={38+i*48} y="144">{d}</text>)}</svg><div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-2 text-[8px]"><span>Avg Load<br/><b className="text-[#05ff5e] text-[15px]">62%</b></span><span>Peak Load<br/><b className="text-[#05ff5e] text-[15px]">73%</b> (May 09)</span><span>Min Load<br/><b className="text-[#05ff5e] text-[15px]">41%</b> (Apr 23)</span></div><div className="mt-1 text-[#05bfff]">View Detailed Load Report &nbsp; ›</div></div>;
}

function EnterpriseTransformerOilTrend() {
  return <div className="h-full text-[7px]"><div className="mb-1 flex justify-end gap-4"><span><b className="mr-1 inline-block h-0.5 w-4 bg-[#05ff5e]"/>Top Oil Temp (°C)</span><span><b className="mr-1 inline-block h-0.5 w-4 bg-[#f59e0b]"/>Hot Spot Temp (°C)</span><span><b className="mr-1 inline-block h-0.5 w-4 bg-[#147dff]"/>Ambient Temp (°C)</span></div><svg className="h-[132px] w-full" viewBox="0 0 400 146"><g stroke="rgba(148,163,184,.16)">{[22,50,78,106,134].map(y=><line key={y} x1="36" x2="384" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8">{["100","75","50","25","0"].map((t,i)=><text key={t} x="12" y={25+i*28}>{t}</text>)}</g><polyline fill="none" points="38,80 62,79 86,80 110,80 134,79 158,81 182,80 206,81 230,78 254,80 278,81 302,70 326,78 350,79 374,76" stroke="#05ff5e" strokeWidth="2"/><polyline fill="none" points="38,54 62,52 86,52 110,52 134,51 158,53 182,54 206,55 230,53 254,52 278,54 302,44 326,52 350,54 374,50" stroke="#f59e0b" strokeWidth="2"/><polyline fill="none" points="38,110 62,109 86,109 110,108 134,110 158,109 182,111 206,110 230,109 254,107 278,106 302,104 326,108 350,109 374,107" stroke="#147dff" strokeWidth="2"/>{["Apr 19","Apr 24","Apr 29","May 04","May 09","May 14","May 18"].map((d,i)=><text fill="#94a3b8" fontSize="7" key={d} x={38+i*56} y="144">{d}</text>)}</svg><div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-2 text-[8px]"><span>Top Oil Temp<br/><b className="text-[#05ff5e] text-[15px]">56.3 °C</b></span><span>Hot Spot Temp<br/><b className="text-[#f59e0b] text-[15px]">64.7 °C</b></span><span>Ambient Temp<br/><b className="text-[#05ff5e] text-[15px]">28.1 °C</b></span></div><div className="mt-1 text-[#05bfff]">View Temperature Analysis &nbsp; ›</div></div>;
}

function EnterpriseTransformerPowerQuality() {
  const metrics = [["Total Harmonic Distortion (THD)","2.3%","Excellent","#05ff5e"],["Voltage Unbalance","1.2%","Excellent","#05ff5e"],["Flicker","0.6","Excellent","#05ff5e"],["Transient Events","3","Normal","#05ff5e"]];
  return <div className="grid h-full grid-cols-4 gap-4 text-[7px]">{metrics.map(([label,value,state,color])=><div key={label}><div className="min-h-[30px] text-slate-300">{label}</div><div className="text-[20px] leading-none">{value}</div><div className="mt-2" style={{color}}>● {state}</div><div className="mt-1 text-[6.5px] text-slate-400">{label==="Transient Events"?"No Impact": label==="Flicker"?"<1.0 IEEE Std 1453": label==="Voltage Unbalance"?"<2% IEEE Std 1159":"<5% IEEE Std 519"}</div></div>)}<div className="col-span-4 text-[#05bfff]">View Power Quality Details &nbsp; ›</div></div>;
}

function EnterpriseTransformerEnergySummary() {
  return <div className="grid h-full grid-cols-3 gap-3 text-[9px]"><div><div className="text-slate-400">Total Energy In</div><div className="mt-3 text-[21px]">285,760 <span className="text-[10px]">kWh</span></div></div><div><div className="text-slate-400">Total Energy Out</div><div className="mt-3 text-[21px]">278,940 <span className="text-[10px]">kWh</span></div></div><div><div className="text-slate-400">Losses</div><div className="mt-3 text-[21px]">6,820 <span className="text-[10px]">kWh</span></div><div className="mt-2 text-[#05ff5e]">2.39%</div></div><div className="col-span-3 mt-auto text-[#05bfff]">View Energy Analysis &nbsp; ›</div></div>;
}

function EnterpriseTransformerMaintenance() {
  const rows = [["Last Oil Analysis","May 01, 2025","Good"],["Last Visual Inspection","May 05, 2025","Good"],["Last Load Test","Apr 15, 2024","Baseline"],["Next Scheduled Maintenance","Nov 15, 2025","180 Days"],["Warranty Expires","Apr 15, 2027","702 Days"]];
  return <div className="h-full text-[8px]"><table className="w-full text-left"><tbody>{rows.map(row=><tr className="border-b border-white/5" key={row[0]}><td className="py-1">{row[0]}</td><td className="py-1">{row[1]}</td><td className="py-1 text-[#05ff5e]">{row[2]}</td></tr>)}</tbody></table><div className="mt-2 text-[#05bfff]">View Maintenance History &nbsp; ›</div></div>;
}

function EnterpriseTransformerEvents() {
  const rows = [["May 18, 10:12 AM","Load above 60%","Info","Cleared","Load returned to normal (62%)"],["May 17, 03:22 PM","Top oil temperature high","Warning","Cleared","Top oil temp 58.1 °C (Threshold: 60 °C)"],["May 16, 11:48 AM","Cooling fan cycle","Info","Cleared","Fan started automatically"],["May 13, 08:15 PM","Tap position changed","Info","Cleared","Tap position set to 3 (Auto)"]];
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="bg-cyan-300/5 text-slate-400"><tr>{["Time","Event","Severity","Status","Details"].map(h=><th className="px-2 py-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i===2 ? (cell==="Warning"?"px-2 py-0.5 text-yellow-400":"px-2 py-0.5 text-[#05bfff]") : i===3 ? "px-2 py-0.5 text-[#05ff5e]" : "px-2 py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1.5 text-[#05bfff]">View All Events &nbsp; ›</div></div>;
}

function EnterpriseTapChangerStatus() {
  return <div className="grid h-full grid-cols-[76px_1fr] items-center gap-3 text-[7.5px]"><div className="relative size-[70px]"><svg className="size-[70px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#1f2937" strokeWidth="12"/><circle cx="50" cy="50" fill="none" r="35" stroke="#eab308" strokeDasharray="144 220" strokeLinecap="round" strokeWidth="12" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[22px]">0</b><br/>Current Tap<br/>Position</span></div></div><div className="space-y-3"><div>Tap Range<br/><b className="text-[15px]">-5 to +5</b></div><div>Operations (30 Days)<br/><b className="text-[15px]">2</b></div></div><div className="col-span-2 text-[#05bfff]">View Tap Changer History &nbsp; ›</div></div>;
}

function EnterpriseTransformerDocuments() {
  const rows = [["Transformer Nameplate","PDF • 245 KB"],["Electrical Schematic","PDF • 1.2 MB"],["Dimensional Drawing","PDF • 885 KB"],["Maintenance Manual","PDF • 3.6 MB"]];
  return <div className="h-full text-[7.2px]"><div className="space-y-1.5">{rows.map(([name,detail])=><div className="grid grid-cols-[15px_1fr_15px] items-center gap-2" key={name}><span className="text-red-500">▧</span><span>{name}<br/><span className="text-slate-400">{detail}</span></span><span>⇩</span></div>)}</div><div className="mt-1.5 text-[#05bfff]">View All Documents &nbsp; ›</div></div>;
}

function EnterpriseTransformerOverviewKpi({ color, detail, icon, label, link, value }: { color: string; detail: string; icon: string; label: string; link?: string; value: string }) {
  return <article className="grid h-full grid-cols-[54px_1fr] items-center gap-3 rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><span className="grid size-12 place-items-center rounded-full text-xl text-white" style={{background:color}}>{icon}</span><span><div className="text-[8px] text-slate-400">{label}</div><div className="mt-2 whitespace-nowrap text-[22px] leading-none">{value}</div><div className="mt-2 font-semibold" style={{color}}>{detail}</div>{link ? <div className="mt-2 text-[#05ff5e]">{link} &nbsp; ›</div> : null}</span></article>;
}

function EnterpriseTransformerHealthSummary() {
  return <article className="grid h-full grid-cols-[86px_1fr] gap-3 rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[8px]"><div><div className="mb-1 text-center text-[8px]">OVERALL TRANSFORMER HEALTH</div><EnterpriseOverviewRing value="96" sub="/100" /></div><div className="pt-7"><div className="space-y-3">{[["Healthy","29 (91%)","#05ff5e"],["Warning","3 (9%)","#facc15"],["Critical","0 (0%)","#ef4444"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-2.5 rounded-full" style={{background:c}}/><span>{l}</span><b style={{color:c}}>{v}</b></div>)}</div><div className="mt-3 text-[#05ff5e]">View Health Breakdown &nbsp; ›</div></div></article>;
}

function EnterpriseTransformerLoadingTrend() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  return <div className="h-full text-[8px]"><div className="mb-2 flex justify-end gap-8"><span><b className="mr-1 inline-block h-0.5 w-5 bg-[#147dff]"/>Before ECBS (Baseline)</span><span><b className="mr-1 inline-block h-0.5 w-5 bg-[#05ff5e]"/>After ECBS</span></div><svg className="h-[172px] w-full" viewBox="0 0 560 188"><g stroke="rgba(148,163,184,.16)">{[20,52,84,116,148,180].map(y=><line key={y} x1="44" x2="540" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="9">{["100%","80%","60%","40%","20%","0%"].map((t,i)=><text key={t} x="4" y={24+i*32}>{t}</text>)}</g><polyline fill="none" points="52,54 94,58 136,48 178,56 220,62 262,64 304,58 346,56 388,62 430,68 472,72 514,76" stroke="#147dff" strokeWidth="2.2"/><polyline fill="none" points="52,104 94,102 136,98 178,96 220,94 262,94 304,92 346,90 388,88 430,90 472,90 514,88" stroke="#05ff5e" strokeWidth="2.2"/>{[["78%","52,48"],["76%","94,52"],["79%","136,42"],["77%","178,50"],["75%","220,56"],["74%","262,58"],["76%","304,52"],["77%","346,50"],["75%","388,56"],["73%","430,62"],["72%","472,66"],["71%","514,70"]].map(([t,p])=>{const [x,y]=p.split(","); return <text fill="#7dd3fc" fontSize="8" key={p} textAnchor="middle" x={x} y={y}>{t}</text>})}{[["58%","52,118"],["59%","94,116"],["60%","136,112"],["61%","178,110"],["62%","220,108"],["62%","262,108"],["63%","304,106"],["64%","346,104"],["64%","388,102"],["63%","430,104"],["63%","472,104"],["63%","514,102"]].map(([t,p])=>{const [x,y]=p.split(","); return <text fill="#05ff5e" fontSize="8" key={p} textAnchor="middle" x={x} y={y}>{t}</text>})}{months.map((m,i)=><text fill="#94a3b8" fontSize="7" key={m} textAnchor="middle" x={52+i*42} y="186">{m}</text>)}</svg><div className="grid grid-cols-4 gap-3 border-t border-white/5 pt-2"><span>Average Reduction<br/><b className="text-[18px] text-[#05ff5e]">15%</b></span><span>Peak Reduction<br/><b className="text-[18px] text-[#05ff5e]">22%</b></span><span>Current Avg Loading<br/><b className="text-[18px] text-[#05ff5e]">63%</b></span><span>Target<br/><b className="text-[18px] text-[#05ff5e]">&lt; 80%</b></span></div></div>;
}

function EnterpriseTransformerHealthBySite() {
  const rows = [["1","Flex Tijuana","6","97","61%","Healthy","#05ff5e"],["2","Flex Juarez North","5","96","58%","Healthy","#05ff5e"],["3","Flex Juarez South","5","95","64%","Healthy","#05ff5e"],["4","Flex Guadalajara","4","94","66%","Warning","#facc15"],["5","Flex Hermosillo","4","93","67%","Warning","#facc15"],["6","Flex Monterrey","3","98","55%","Healthy","#05ff5e"],["7","Flex Saltillo","2","97","57%","Healthy","#05ff5e"],["8","Flex Puebla","2","95","62%","Healthy","#05ff5e"],["9","Flex Querétaro","1","97","52%","Healthy","#05ff5e"]];
  return <div className="h-full text-[8px]"><table className="w-full text-left"><thead className="bg-cyan-300/5 text-slate-400"><tr>{["Site","Transformers","Health Index (Avg)","Avg Loading","Status"].map(h=><th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}><td className="px-2 py-1">{row[0]} &nbsp; {row[1]}</td><td className="px-2 py-1">{row[2]}</td><td className="px-2 py-1">{row[3]}</td><td className="px-2 py-1">{row[4]}</td><td className="px-2 py-1"><b className="mr-2 inline-block size-2.5 rounded-full" style={{background:row[6]}}/>{row[5]}</td></tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">View All Sites &nbsp; ›</div></div>;
}

function EnterpriseTransformerInventory() {
  const rows = [["XF-TIJ-01","Flex Tijuana","2,000","13.8 kV / 480 V","62%","98","Healthy","May 18, 10:12 AM","#05ff5e"],["XF-TIJ-02","Flex Tijuana","1,500","13.8 kV / 480 V","58%","97","Healthy","May 18, 10:11 AM","#05ff5e"],["XF-JN-01","Flex Juarez North","2,500","13.8 kV / 480 V","61%","96","Healthy","May 18, 10:10 AM","#05ff5e"],["XF-JS-01","Flex Juarez South","2,000","13.8 kV / 480 V","66%","95","Healthy","May 18, 10:09 AM","#05ff5e"],["XF-GDL-01","Flex Guadalajara","1,750","13.8 kV / 480 V","70%","94","Warning","May 18, 10:08 AM","#facc15"],["XF-HMO-01","Flex Hermosillo","1,250","13.8 kV / 480 V","68%","93","Warning","May 18, 10:07 AM","#facc15"]];
  return <div className="h-full text-[7.2px]"><table className="w-full text-left"><thead className="bg-cyan-300/5 text-slate-400"><tr>{["Transformer ID","Site","kVA Rating","Voltage (Primary/Secondary)","Loading (%)","Health Index","Status","Last Updated"].map(h=><th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.slice(0,8).map((cell,i)=><td className="px-2 py-1.5" key={`${row[0]}-${i}`}>{i===6 ? <span><b className="mr-2 inline-block size-2.5 rounded-full" style={{background:row[8]}}/>{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-2 flex items-center justify-between text-slate-400"><span>Showing 1 to 6 of 32 transformers</span><span className="space-x-2"><b className="rounded bg-[#0f7d31] px-3 py-1.5 text-white">1</b><b className="rounded border border-cyan-300/12 px-3 py-1.5">2</b><b className="rounded border border-cyan-300/12 px-3 py-1.5">0</b><span>...</span><b className="rounded border border-cyan-300/12 px-3 py-1.5">6</b><b className="rounded border border-cyan-300/12 px-3 py-1.5">›</b></span></div></div>;
}

function EnterpriseTransformerCapacitySummary() {
  return <div className="grid h-full grid-cols-[118px_1fr] items-center gap-3 text-[8px]"><div className="relative size-[110px]"><svg className="size-[110px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="135 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#65a30d" strokeDasharray="79 214" strokeDashoffset="-135" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[18px]">15,600</b><br/>kVA<br/>Total Capacity</span></div></div><div className="space-y-4">{[["Utilized Capacity","9,842 kVA (63%)","#05ff5e"],["Hidden Capacity","5,758 kVA (37%)","#147dff"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-3 rounded-full" style={{background:c}}/><span>{l}</span><b>{v}</b></div>)}<div className="pt-2 text-[#05ff5e]">View Capacity Details &nbsp; ›</div></div></div>;
}

function EnterpriseTransformerOverloaded() {
  const rows = [["XF-GDL-02","Flex Guadalajara","89%","92","Warning"],["XF-JS-02","Flex Juarez South","86%","94","Warning"],["XF-HMO-02","Flex Hermosillo","83%","93","Warning"]];
  return <div className="h-full text-[6.8px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Transformer ID","Site","Loading","Health Index","Status"].map(h=><th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className="py-0.5" key={`${row[0]}-${i}`}>{i===4 ? <span><b className="mr-2 inline-block size-2.5 rounded-full bg-[#facc15]"/>{cell}</span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-1 text-[#05ff5e]">View All Overloaded &nbsp; ›</div></div>;
}

function EnterpriseTrendKpi({ active, detail, icon, label, tone, value }: { active?: boolean; detail: string; icon: string; label: string; tone: string; value: string }) {
  return <article className={active ? "grid h-full grid-cols-[52px_1fr] items-center gap-3 rounded border border-[#05ff5e]/60 bg-[#063b27]/70 p-3 text-[9px]" : "grid h-full grid-cols-[52px_1fr] items-center gap-3 rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"}><span className="grid size-11 place-items-center rounded-full text-xl text-white" style={{background:tone}}>{icon}</span><span><div className="text-[8px] text-slate-400">{label}</div><div className="mt-2 whitespace-nowrap text-[21px] leading-none">{value}</div><div className="mt-2 font-semibold" style={{color:tone}}>{detail}</div></span></article>;
}

function EnterpriseSavingsTrendDetail() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025"];
  const actual = "58,176 108,143 158,138 208,139 258,110 308,96 358,66 408,78 458,62 508,66 558,54 608,44";
  const baseline = "58,196 108,176 158,168 208,154 258,138 308,126 358,110 408,104 458,98 508,96 558,104 608,88";
  const cumulative = "58,238 108,228 158,216 208,202 258,188 308,172 358,154 408,136 458,108 508,92 558,56 608,38";
  return <div className="h-full text-[8px]"><div className="mb-1 flex items-center justify-end gap-2">{["6M","12M","24M","YTD","ALL"].map(t=><span className={t==="12M" ? "rounded bg-[#147dff] px-4 py-1.5 text-white" : "rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5 text-slate-300"} key={t}>{t}</span>)}<span className="ml-2 rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5">Monthly⌄</span></div><svg className="h-[228px] w-full" viewBox="0 0 670 246"><defs><linearGradient id="trendGreenArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#05ff5e" stopOpacity=".16"/><stop offset="1" stopColor="#05ff5e" stopOpacity=".02"/></linearGradient></defs><g stroke="rgba(148,163,184,.16)">{[20,56,92,128,164,200,236].map(y=><line key={y} x1="52" x2="628" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="4" y="24">$250K</text><text x="4" y="60">$200K</text><text x="4" y="96">$150K</text><text x="8" y="132">$100K</text><text x="14" y="168">$50K</text><text x="28" y="204">$0</text></g><g fill="#94a3b8" fontSize="8" textAnchor="end"><text x="662" y="24">$1.0M</text><text x="662" y="60">$800K</text><text x="662" y="96">$600K</text><text x="662" y="132">$400K</text><text x="662" y="168">$200K</text><text x="662" y="204">$0</text></g><path d={`M${actual.replaceAll(" ", " L")} L608,236 L58,236 Z`} fill="url(#trendGreenArea)"/><polyline fill="none" points={actual} stroke="#05ff5e" strokeWidth="2.4"/><polyline fill="none" points={baseline} stroke="#147dff" strokeDasharray="5 4" strokeWidth="2"/><polyline fill="none" points={cumulative} stroke="#facc15" strokeWidth="2.4"/>{actual.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#05ff5e" key={i} r="3"/>})}{baseline.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#147dff" key={i} r="2.4"/>})}{cumulative.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#facc15" key={i} r="2.8"/>})}<line stroke="#147dff" strokeDasharray="3 3" x1="558" x2="558" y1="22" y2="236"/><rect fill="#061421" height="88" rx="4" stroke="rgba(103,232,249,.25)" width="120" x="70" y="48"/><text fill="#e2e8f0" fontSize="8" x="82" y="66">Jun 2025</text><text fill="#05ff5e" fontSize="8" x="82" y="84">● Actual Savings</text><text fill="#e2e8f0" fontSize="8" textAnchor="end" x="182" y="84">$191,830</text><text fill="#147dff" fontSize="8" x="82" y="102">● Baseline Savings</text><text fill="#e2e8f0" fontSize="8" textAnchor="end" x="182" y="102">$142,350</text><text fill="#facc15" fontSize="8" x="82" y="120">● Cumulative Savings</text><text fill="#e2e8f0" fontSize="8" textAnchor="end" x="182" y="120">$768,050</text>{months.map((m,i)=><text fill="#94a3b8" fontSize="7" key={m} textAnchor="middle" x={58+i*50} y="244">{m}</text>)}</svg></div>;
}

function EnterpriseTrendInsights() {
  const rows = [["↑","Savings are up 12.6%","Annual savings increased by $206,000 compared to the previous 12 months.","#05ff5e"],["▥","Best performing month","June 2025 delivered the highest monthly savings of $191,830.","#05bfff"],["⌁","Consistent improvement","Savings have exceeded baseline in 11 of the last 12 months.","#8b5cf6"],["△","Watch: Apr 2025 dip","Savings dropped 6.2% vs Mar 2025 due to lower production at Flex Juarez South.","#f59e0b"]];
  return <div className="h-full space-y-4 text-[9px]">{rows.map(([icon,title,detail,color])=><div className="grid grid-cols-[28px_1fr] gap-3" key={title}><span className="grid size-6 place-items-center rounded-full border" style={{borderColor:color,color}}>{icon}</span><span><b style={{color}}>{title}</b><br/><span className="text-slate-300">{detail}</span></span></div>)}<div className="pt-2 text-[#05ff5e]">View Full Insights Report &nbsp; ›</div></div>;
}

function EnterpriseSavingsCategoryDetail() {
  const rows = [["Demand Charge Reduction","$342,320","44.6%","#05b82e"],["Energy Consumption Reduction","$256,710","33.4%","#147dff"],["Power Factor Improvement","$104,650","13.6%","#facc15"],["Loss Reduction","$46,210","6.0%","#00bcd4"],["Other Savings","$18,160","2.4%","#64748b"]];
  return <div className="grid h-full grid-cols-[120px_1fr] items-center gap-4 text-[8px]"><div className="relative"><svg className="size-[116px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="95 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="71 214" strokeDashoffset="-96" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#facc15" strokeDasharray="29 214" strokeDashoffset="-168" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#00bcd4" strokeDasharray="13 214" strokeDashoffset="-198" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[42px] w-[116px] text-center"><b className="text-[16px]">$768,050</b><br/>Total Savings</div></div><div className="space-y-3">{rows.map(([label,value,pct,color])=><div className="grid grid-cols-[12px_1fr_58px_34px] gap-2" key={label}><span className="mt-1 size-2.5 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span><span>{pct}</span></div>)}<div className="pt-2 text-[#05ff5e]">View Category Analysis &nbsp; ›</div></div></div>;
}

function EnterpriseMonthlySavingsHeatmap() {
  const sites = ["Flex Tijuana","Flex Juarez North","Flex Juarez South","Flex Guadalajara","Flex Hermosillo"];
  const months = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];
  const colors = ["#65a30d","#84cc16","#05b82e","#15803d","#facc15","#ca8a04"];
  return <div className="h-full text-[7px]"><div className="mb-1 grid grid-cols-[92px_1fr]"><span /><div className="grid grid-cols-12 text-center">{months.map(m=><span key={m}>{m}</span>)}</div></div>{sites.map((site,r)=><div className="grid grid-cols-[92px_1fr] items-center" key={site}><span className="text-slate-300">{site}</span><div className="grid grid-cols-12 gap-[2px]">{months.map((m,c)=><span className="h-5 rounded-[1px]" key={`${site}-${m}`} style={{background:colors[(r+c)%colors.length]}} />)}</div></div>)}<div className="mt-3 flex items-center justify-between"><span>Lower Savings</span><span className="flex gap-1">{["#ef4444","#f59e0b","#84cc16","#05b82e","#15803d"].map(c=><i className="h-2 w-7" key={c} style={{background:c}} />)}</span><span>Higher Savings</span></div><div className="mt-2 text-[#05ff5e]">View Site Breakdown &nbsp; ›</div></div>;
}

function EnterpriseBaselineVsActual() {
  const rows = [["Baseline Savings (YTD)","$654,000","48%","#147dff"],["Actual Savings (YTD)","$768,050","64%","#05b82e"],["Variance","$114,050","38%","#00bcd4"],["Variance %","17.4%","20%","#8b5cf6"]];
  return <div className="h-full space-y-5 text-[9px]">{rows.map(([label,value,width,color])=><div className="grid grid-cols-[130px_72px_1fr] items-center gap-2" key={label}><span>{label}</span><span>{value}</span><span className="h-2 rounded bg-white/5"><i className="block h-2 rounded" style={{width,background:color}} /></span></div>)}<div className="pt-2 text-[#05ff5e]">View Baseline Details &nbsp; ›</div></div>;
}

function EnterpriseMonthlySummaryTable() {
  const months = ["Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025","YTD Total","YTD vs LY"];
  const rows = [
    ["Actual Savings ($)","$134,250","$142,300","$148,760","$152,410","$158,230","$162,880","$171,020","$168,340","$172,650","$181,220","$165,890","$175,420","$1.84M","▲ 13.2%"],
    ["Baseline Savings ($)","$105,600","$112,450","$116,980","$120,230","$124,500","$127,980","$131,450","$131,450","$133,620","$135,780","$139,050","$142,350","$1.57M","▲ 4.6%"],
    ["Savings ($)","$28,650","$29,850","$31,780","$32,180","$33,730","$34,900","$40,820","$39,030","$39,030","$45,440","$26,840","$33,070","$768,050","▲ 13.2%"],
    ["Savings (%)","27.1%","26.6%","27.2%","26.8%","27.1%","27.3%","31.3%","28.1%","29.2%","33.4%","19.3%","23.2%","24.6%","--"],
  ];
  return <div className="h-full text-[6.6px]"><table className="w-full text-left"><thead className="text-slate-400"><tr><th className="pb-1.5 font-medium">Month</th>{months.map(m=><th className="pb-1.5 font-medium" key={m}>{m}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={i>0 && (row[0].includes("Savings ($)") || i===14) ? "py-0.5 text-[#05ff5e]" : "py-0.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-1.5 flex items-center justify-between text-slate-400"><span>All values are rounded. Savings are calculated based on actual performance vs baseline (pre-ECBS implementation).</span><span className="text-[#05ff5e]">Download Full Trend Report &nbsp; ›</span></div></div>;
}

function EnterpriseAssetHealthCard({ icon, link, rows, title, value }: { icon: string; link: string; rows: string[][]; title: string; value: string }) {
  return <article className="grid h-full grid-cols-[86px_1fr] gap-4 rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[8px]"><div><div className="mb-1 text-[24px] text-slate-300">{icon}</div><div className="relative size-[74px]"><svg className="size-[74px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="35" stroke="#0f5130" strokeWidth="12"/><circle cx="50" cy="50" fill="none" r="35" stroke="#05b82e" strokeDasharray="208 220" strokeWidth="12" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="26"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[20px]">{value}</b><br/>Healthy</span></div></div><div className="mt-2 text-[#05bfff]">{link} &nbsp; ›</div></div><div><h3 className="mb-4 text-[10px] font-semibold">{title}</h3><div className="space-y-3">{rows.map(([label,val,color])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={label}><span className="mt-1 size-2.5 rounded-full" style={{background:color}}/><span>{label}</span><b style={{color}}>{val}</b></div>)}</div></div></article>;
}

function EnterpriseAssetHealthTable() {
  const rows = [
    ["⌄","▣","XF-JS-01","TR-00123","Transformer","98","Healthy","—","#05ff5e","May 18, 10:10 AM"],
    ["⌄","▣","PF-JS-MAIN","PF-00045","Power Filter","97","Healthy","—","#05ff5e","May 18, 10:08 AM"],
    ["⌄","▣","RACK-JS-01","RACK-00012","Rack System","96","Healthy","—","#05ff5e","May 18, 10:09 AM"],
    ["⌄","▣","SWGR-JS-01","SWGR-00078","Switchgear","97","Healthy","—","#05ff5e","May 18, 10:07 AM"],
    ["⌄","▣","CAP-JS-01","CAP-00034","Capacitor Bank","94","Healthy","Capacitor aging 18% ⓘ","#05ff5e","May 18, 10:06 AM"],
    ["⌄","▣","XF-JS-02","TR-00124","Transformer","92","Warning","Voltage imbalance ⓘ","#facc15","May 18, 09:58 AM"],
    ["⌄","▣","METER-JS-05","MTR-00211","Meter","91","Warning","Communication delays ⓘ","#facc15","May 18, 09:57 AM"],
    ["⌄","▣","UPS-JS-03","UPS-00102","UPS System","87","Critical","Battery runtime low ⓘ","#ef4444","May 18, 09:52 AM"],
  ];
  return <div className="h-full text-[6.7px]"><div className="mb-1.5 flex items-center justify-between"><div className="flex gap-1.5 text-[7px]">{["All (235)","Transformers (6)","Devices (130)","Infrastructure (50)","Maintenance (49)"].map((tab,i)=><span className={i===0 ? "rounded bg-[#063b27] px-2.5 py-1.5 text-[#05ff5e]" : "rounded border border-cyan-300/12 bg-[#061421] px-2.5 py-1.5"} key={tab}>{tab}</span>)}</div><div className="flex items-center gap-1.5"><input className="h-7 w-[150px] rounded border border-cyan-300/12 bg-[#03101b] px-3 text-[7px]" placeholder="Search assets..." readOnly /><span>Group By:</span><button className="rounded border border-cyan-300/12 bg-[#061421] px-2.5 py-1.5">Asset Type</button><button className="rounded bg-[#063b27] px-2.5 py-1.5 text-[#05ff5e]">☷</button><button className="rounded border border-cyan-300/12 bg-[#061421] px-2.5 py-1.5">▦</button></div></div><table className="w-full text-left"><thead className="bg-cyan-300/5 text-slate-400"><tr>{["","","Asset Name","Asset ID","Asset Type","Health Index","Status","Key Issue (if any)","Trend (30 Days)","Last Updated",""].map((h,i)=><th className="px-2 py-1.5 font-medium" key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[2]}>{row.map((cell,i)=><td className={i===7 && cell!=="—" ? "px-2 py-0.5 text-[#facc15]" : "px-2 py-0.5"} key={`${row[2]}-${i}`}>{i===5 ? <span className="grid size-6 place-items-center rounded-full border text-[7px] text-[#05ff5e]" style={{borderColor:row[8]}}>{cell}</span> : i===6 ? <span><b className="mr-2 inline-block size-2.5 rounded-full" style={{background:row[8]}}/>{cell}</span> : i===8 ? <EnterpriseAssetSpark color={String(row[8])} /> : cell}</td>)}</tr>)}</tbody></table><div className="mt-1.5 flex items-center justify-between text-slate-400"><span>Showing 1 to 8 of 235 assets</span><span className="space-x-2"><b className="rounded bg-[#0f7d31] px-3 py-1.5 text-white">1</b><b className="rounded border border-cyan-300/12 px-3 py-1.5">2</b><b className="rounded border border-cyan-300/12 px-3 py-1.5">0</b><span>...</span><b className="rounded border border-cyan-300/12 px-3 py-1.5">30</b><b className="rounded border border-cyan-300/12 px-3 py-1.5">›</b></span></div></div>;
}

function EnterpriseAssetSpark({ color }: { color: string }) {
  const points = color === "#ef4444" ? "4,18 18,10 32,17 46,14 60,16 74,15 88,17" : color === "#facc15" ? "4,18 18,17 32,16 46,14 60,10 74,12 88,11" : "4,18 18,16 32,17 46,15 60,11 74,10 88,8";
  return <svg className="h-5 w-24" viewBox="0 0 92 24"><polyline fill="none" points={points} stroke={color} strokeWidth="2"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill={color} key={i} r="1.8"/>})}</svg>;
}

function EnterpriseAssetStatusSummary() {
  const rows = [["Healthy","231 (98%)","#05ff5e"],["Warning","4 (2%)","#facc15"],["Critical","0 (0%)","#ef4444"]];
  return <div className="grid h-full grid-cols-[116px_1fr] items-center gap-3 text-[8px]"><div className="relative"><svg className="size-[112px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="208 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#facc15" strokeDasharray="6 214" strokeDashoffset="-208" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[41px] w-[112px] text-center"><b className="text-[22px]">235</b><br/>Total Assets</div></div><div className="space-y-5">{rows.map(([label,value,color])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3 rounded-full" style={{background:color}}/><span>{label}</span><b>{value}</b></div>)}</div></div>;
}

function EnterpriseAssetTrendSummary() {
  return <div className="h-full text-[8px]"><div className="text-slate-400">Overall Health Index (Avg)</div><div className="mt-2 flex items-end gap-3"><span className="text-[24px] leading-none">96</span><span className="text-[#05ff5e]">↑ 4% vs Last 30 Days</span></div><svg className="mt-3 h-[98px] w-full" viewBox="0 0 240 106"><g stroke="rgba(148,163,184,.16)">{[18,42,66,90].map(y=><line key={y} x1="26" x2="232" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="3" y="20">100</text><text x="8" y="68">90</text><text x="8" y="94">80</text></g><polyline fill="none" points="30,54 44,54 58,55 72,50 86,50 100,45 114,48 128,44 142,45 156,38 170,50 184,47 198,48 212,44 228,42" stroke="#05b82e" strokeWidth="2"/>{["Apr 19","Apr 29","May 09","May 18"].map((d,i)=><text fill="#94a3b8" fontSize="8" key={d} x={30+i*62} y="104">{d}</text>)}</svg></div>;
}

function EnterpriseOverallHealthCard() {
  return <div className="grid h-full grid-cols-[112px_1fr] items-center gap-3 text-[9px]"><div className="relative"><svg className="size-[100px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#0f5130" strokeWidth="14"/><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="207 214" strokeWidth="14" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[34px] w-[100px] text-center"><b className="text-[24px]">98%</b><br/>Healthy</div></div><div className="space-y-3">{[["Healthy","94 (98%)","#05ff5e"],["Warning","3 (3%)","#f59e0b"],["Offline","1 (1%)","#ef4444"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-3 rounded-full" style={{background:c}}/><span>{l}</span><b style={{color:c}}>{v}</b></div>)}<div className="pt-4 text-[#05bfff]">Total Devices: 98</div></div></div>;
}

function EnterpriseOnlineDevicesCard() {
  return <div className="grid h-full grid-cols-[112px_1fr] items-center gap-3 text-[9px]"><div className="relative"><svg className="size-[100px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#0f5130" strokeWidth="14"/><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="211 214" strokeWidth="14" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[34px] w-[100px] text-center"><b className="text-[24px]">97</b><br/>/98</div></div><div className="space-y-3">{[["Online","97 (99%)","#05ff5e"],["Offline","1 (1%)","#ef4444"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-3 rounded-full" style={{background:c}}/><span>{l}</span><b style={{color:c}}>{v}</b></div>)}<div className="pt-9 text-[#05bfff]">Uptime (Avg) &nbsp; 99.6%</div></div></div>;
}

function EnterpriseAttentionCard() {
  return <div className="flex h-full items-center gap-5 px-4 text-[10px]"><span className="text-[42px] text-yellow-400">⚠</span><span className="text-[34px] leading-none">4</span><span className="ml-auto space-y-3">{[["Critical","1 (1%)","#ef4444"],["Warning","3 (3%)","#f59e0b"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-3 rounded-full" style={{background:c}}/><span>{l}</span><b>{v}</b></div>)}<div className="pt-8 text-[#05bfff]">View All Issues</div></span></div>;
}

function EnterpriseFirmwareCard() {
  return <div className="grid h-full grid-cols-[112px_1fr] items-center gap-3 text-[9px]"><div className="relative"><svg className="size-[100px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#0f5130" strokeWidth="14"/><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="205 214" strokeWidth="14" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[34px] w-[100px] text-center"><b className="text-[24px]">96%</b><br/>Compliant</div></div><div className="space-y-3">{[["Compliant","94 (96%)","#05ff5e"],["Outdated","4 (4%)","#f59e0b"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-3 rounded-full" style={{background:c}}/><span>{l}</span><b style={{color:c}}>{v}</b></div>)}<div className="pt-9 text-[#05bfff]">View Firmware Status</div></div></div>;
}

function EnterpriseDeviceHealthTrend() {
  return <div className="h-full text-[8px]"><div className="mb-2 flex gap-4"><span className="text-[#05ff5e]">● Overall Health Index</span><span className="text-[#65a30d]">● Healthy Devices (%)</span><span className="text-yellow-400">● Warning Devices (%)</span><span className="text-red-400">● Offline Devices (%)</span></div><svg className="h-[158px] w-full" viewBox="0 0 590 166"><g stroke="rgba(148,163,184,.16)">{[20,46,72,98,124,150].map(y=><line key={y} x1="34" x2="580" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="0" y="22">100%</text><text x="5" y="48">95%</text><text x="5" y="74">90%</text><text x="5" y="100">85%</text><text x="5" y="126">80%</text></g><polyline fill="none" points="44,48 76,42 108,48 140,42 172,40 204,34 236,38 268,30 300,28 332,26 364,26 396,26 428,24 460,24 492,22 524,20 558,18" stroke="#05ff5e" strokeWidth="2"/><polyline fill="none" points="44,58 76,52 108,56 140,54 172,52 204,48 236,52 268,44 300,42 332,40 364,40 396,39 428,38 460,38 492,36 524,34 558,32" stroke="#65a30d" strokeWidth="2"/><polyline fill="none" points="44,128 558,128" stroke="#f59e0b" strokeWidth="2"/><polyline fill="none" points="44,140 558,140" stroke="#ef4444" strokeWidth="2"/><rect fill="#061421" height="72" rx="4" stroke="rgba(103,232,249,.25)" width="118" x="376" y="50"/><text fill="#e2e8f0" fontSize="9" x="392" y="68">May 18, 2025</text><text fill="#05ff5e" fontSize="8" x="392" y="84">● Overall Health Index</text><text fill="#e2e8f0" fontSize="8" x="470" y="84">98%</text><text fill="#65a30d" fontSize="8" x="392" y="98">● Healthy Devices</text><text fill="#e2e8f0" fontSize="8" x="470" y="98">98%</text><text fill="#f59e0b" fontSize="8" x="392" y="112">● Warning Devices</text><text fill="#e2e8f0" fontSize="8" x="470" y="112">3%</text></svg><div className="flex justify-between px-10 text-slate-400">{["Apr 19","Apr 24","Apr 29","May 04","May 09","May 14","May 18"].map(d=><span key={d}>{d}</span>)}</div><div className="mt-2 text-[#05bfff]">View Trend Analysis &nbsp; ›</div></div>;
}

function EnterpriseHealthByType() {
  const rows = [["ECBS Gateways","100% (10 / 10)","#05ff5e"],["Power Filters","98% (49 / 50)","#65a30d"],["Rack Systems","98% (24 / 25)","#65a30d"],["Switch Gear Boosters","97% (29 / 30)","#147dff"],["Load Controllers","96% (22 / 23)","#f59e0b"],["Meters","100% (10 / 10)","#00bcd4"]];
  return <div className="grid h-full grid-cols-[128px_1fr] gap-3 text-[8px]"><div className="relative"><svg className="size-[124px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeDasharray="80 214" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#147dff" strokeDasharray="52 214" strokeDashoffset="-82" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#00bcd4" strokeDasharray="32 214" strokeDashoffset="-136" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#f59e0b" strokeDasharray="16 214" strokeDashoffset="-170" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="none" r="34" stroke="#65a30d" strokeDasharray="34 214" strokeDashoffset="-188" strokeWidth="18" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" fill="#061421" r="25"/></svg><div className="absolute left-0 top-[40px] w-[124px] text-center"><b className="text-[24px]">98%</b><br/>Healthy<br/>by Type</div></div><div className="space-y-2">{rows.map(([label,value,color])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={label}><span className="mt-1 size-3 rounded-full" style={{background:color}}/><span>{label}</span><span>{value}</span></div>)}<div className="pt-2 text-[#05bfff]">View Type Breakdown</div></div></div>;
}

function EnterpriseStatusSummary() {
  const rows = [["Healthy","94","96%","#05ff5e"],["Warning","3","3%","#f59e0b"],["Critical","0","0%","#ef4444"],["Offline","1","1%","#ef4444"],["Total","98","100%","#e2e8f0"]];
  return <div className="h-full text-[9px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Status","Devices","% of Total"].map(h=><th className="pb-3 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([status,devices,pct,color])=><tr className="border-t border-white/5" key={status}><td className="py-2"><span className="mr-2 inline-block size-3 rounded-full" style={{background:color}} />{status}</td><td>{devices}</td><td>{pct}</td></tr>)}</tbody></table></div>;
}

function EnterpriseDeviceInventory() {
  const rows = [["GW-TIJ-01","Flex Tijuana","ECBS Gateway","● Healthy","100%","v3.2.1","May 18, 2025 10:14 AM","99.8%","—"],["PF-TIJ-MAIN","Flex Tijuana","Power Filter","● Healthy","99%","v2.4.3","May 18, 2025 10:13 AM","99.6%","—"],["RACK-TIJ-01","Flex Tijuana","Rack System","● Healthy","98%","v2.1.0","May 18, 2025 10:12 AM","99.5%","—"],["SGB-TIJ-MAIN","Flex Tijuana","Switch Gear Booster","● Warning","92%","v1.9.7","May 18, 2025 09:58 AM","97.2%","Voltage Unbalance"],["METER-TIJ-01","Flex Tijuana","Bi-Directional Meter","● Healthy","100%","v3.0.2","May 18, 2025 10:14 AM","99.7%","—"]];
  return <div className="h-full text-[7.4px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{["Device Name","Site","Type","Status","Health Index","Firmware","Last Check-In","Uptime","Issues",""].map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr className="border-t border-white/5" key={row[0]}>{row.map((cell,i)=><td className={cell.includes("Warning") ? "py-2 text-[#f59e0b]" : cell.includes("Healthy") || cell.includes("100%") || cell.includes("99%") || cell.includes("98%") ? "py-2 text-[#05ff5e]" : "py-2"} key={`${row[0]}-${i}`}>{i===4 ? <span className="inline-flex items-center gap-2">{cell}<i className="block h-1.5 w-14 rounded bg-[#05b82e]" /></span> : cell}</td>)}</tr>)}</tbody></table><div className="mt-3 flex items-center justify-between text-slate-400"><span>Showing 1 to 5 of 98 devices</span><span className="space-x-2"><b className="rounded bg-[#0f7d31] px-3 py-2 text-white">1</b><b className="rounded border border-cyan-300/12 px-3 py-2">2</b><b className="rounded border border-cyan-300/12 px-3 py-2">0</b><span>...</span><b className="rounded border border-cyan-300/12 px-3 py-2">20</b><b className="rounded border border-cyan-300/12 px-3 py-2">›</b></span></div></div>;
}

function EnterpriseTopIssues() {
  const rows = [["⚠","Voltage Unbalance","2","#f59e0b"],["♧","High THD","1","#ef4444"],["ⓘ","Communication Loss","1","#ef4444"],["ⓘ","Firmware Outdated","0","#147dff"],["ⓘ","Temperature High","0","#147dff"]];
  return <div className="space-y-4 text-[9px]">{rows.map(([icon,label,value,color])=><div className="grid grid-cols-[24px_1fr_auto_14px] gap-2" key={label}><span style={{color}}>{icon}</span><span>{label}</span><b>{value}</b><span>›</span></div>)}<div className="pt-5 text-[#05bfff]">View All Issues &nbsp; ›</div></div>;
}

function HealthRing() {
  return <div className="relative size-[82px]"><svg className="size-[82px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="#061421" r="42" stroke="#0f5130" strokeWidth="9"/><circle cx="50" cy="50" fill="none" r="42" stroke="#05ff5e" strokeDasharray="264 264" strokeWidth="9" transform="rotate(-90 50 50)"/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><b className="text-[22px]">100%</b><br/><span className="text-[8px] text-[#05ff5e]">Excellent</span></span></div></div>;
}

function EnterpriseTopMetric({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return <div className="h-[72px] min-w-[112px] rounded border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><div className="text-slate-400">{label}</div><div className="mt-2 text-[18px] leading-none">{value}</div><div className="mt-2 text-[8px] text-[#05ff5e]">{detail}</div></div>;
}

function EnterpriseHealthOverview() {
  return <div className="grid h-full grid-cols-[120px_1fr] items-center gap-4 text-[9px]"><div className="relative"><svg className="size-[110px]" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" r="34" stroke="#05b82e" strokeWidth="16"/><circle cx="50" cy="50" fill="#061421" r="24"/></svg><div className="absolute left-0 top-[38px] w-[110px] text-center"><b className="text-2xl">100%</b><br/>Excellent</div></div><div className="space-y-3">{[["Healthy","10 (100%)","#05ff5e"],["Warning","0 (0%)","#f59e0b"],["Critical","0 (0%)","#ef4444"]].map(([l,v,c])=><div className="grid grid-cols-[12px_1fr_auto] gap-2" key={l}><span className="mt-1 size-3 rounded-full" style={{background:c}}/><span>{l}</span><b style={{color:c}}>{v}</b></div>)}<div className="pt-5 text-slate-300">No active issues</div></div></div>;
}

function EnterprisePerformanceSummary() {
  const rows = [["Data Transmission","100%","Success Rate"],["Response Time (Avg)","128 ms","▼ 12% vs Last 30 Days"],["Data Points Received","1.24M","▲ 8.7% vs Last 30 Days"],["Storage Usage","42%","1.3 GB / 3.0 GB"]];
  return <div className="grid h-full grid-cols-4 gap-4 text-center text-[8px]">{rows.map(([label,value,detail])=><div className="border-r border-cyan-300/10 last:border-r-0" key={label}><div className="text-slate-400">{label}</div><div className="mt-5 text-[20px] leading-none">{value}</div><div className="mt-2 text-[#05ff5e]">{detail}</div></div>)}</div>;
}

function EnterpriseRealtimeStatus() {
  const rows = [["Connection Status","Online",""],["Signal Strength","-58 dBm (Excellent)","▂▅▇"],["Internet Temperature","34.2 °C (Normal)",""],["Power Supply","24.1 VDC (Normal)",""],["Memory Usage","38%","38"],["CPU Usage","22%","22"]];
  return <div className="space-y-2 text-[8px]">{rows.map(([label,value,bar])=><div className="grid grid-cols-[1fr_86px_52px] items-center gap-2" key={label}><span><b className="mr-1 text-[#05ff5e]">●</b>{label}</span><span>{value}</span><span>{bar === "38" || bar === "22" ? <i className="block h-2 rounded bg-[#65a30d]" style={{width:`${Number(bar)}px`}}/> : bar}</span></div>)}</div>;
}

function EnterpriseHealthTrend() {
  return <EnterpriseMiniLine link="View Full Trend Analysis →" points="40,40 72,42 104,38 136,45 168,43 200,39 232,41 264,36 296,38 328,34 360,36 392,35" />;
}

function EnterpriseThroughput() {
  return <div className="h-full text-[8px]"><svg className="h-[128px] w-full" viewBox="0 0 360 136"><g stroke="rgba(148,163,184,.16)">{[22,50,78,106,132].map(y=><line key={y} x1="30" x2="350" y1={y} y2={y}/>)}</g>{[38,50,58,82,70,76,96,64,90,72,62,80,68,58,86,104,72,66,90,78,102,82,74,98,84,94,76,108,92,88].map((h,i)=><rect fill="#147dff" height={h*.85} key={i} width="7" x={38+i*10} y={128-h*.85}/>)}</svg><div className="flex justify-between px-8 text-slate-400"><span>Apr 19</span><span>Apr 24</span><span>Apr 29</span><span>May 04</span><span>May 09</span><span>May 14</span><span>May 18</span></div><div className="mt-3 text-[#05ff5e]">View Detailed Throughput →</div></div>;
}

function EnterpriseUptimeHistory() {
  return <EnterpriseMiniLine link="View Uptime Report →" points="38,38 68,38 98,39 128,38 158,39 188,38 218,38 248,39 278,38 308,38 338,39" months />;
}

function EnterpriseMiniLine({ link, months, points }: { link: string; months?: boolean; points: string }) {
  return <div className="h-full text-[8px]"><svg className="h-[128px] w-full" viewBox="0 0 380 136"><g stroke="rgba(148,163,184,.16)">{[22,48,74,100,126].map(y=><line key={y} x1="34" x2="370" y1={y} y2={y}/>)}</g><g fill="#94a3b8" fontSize="8"><text x="5" y="24">100</text><text x="10" y="50">95</text><text x="10" y="76">90</text><text x="10" y="102">85</text><text x="10" y="128">80</text></g><polyline fill="none" points={points} stroke="#05b82e" strokeWidth="2"/>{points.split(" ").map((p,i)=>{const [x,y]=p.split(","); return <circle cx={x} cy={y} fill="#05b82e" key={i} r="2"/>})}</svg><div className="flex justify-between px-10 text-slate-400">{(months ? ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"] : ["Apr 19","Apr 24","Apr 29","May 04","May 09","May 14","May 18"]).map(d=><span key={d}>{d}</span>)}</div><div className="mt-3 text-[#05ff5e]">{link}</div></div>;
}

function EnterpriseRecentEvents() {
  const rows = [["May 18, 10:14 AM","Device Online","●","Info","Cleared","Device reconnected successfully"],["May 17, 11:32 PM","Configuration Updated","●","Info","Cleared","Schedule settings updated"],["May 16, 02:18 PM","High CPU Usage","●","Warning","Cleared","CPU usage was above 80% for 5 min"],["May 15, 09:45 AM","Firmware Check","●","Info","Cleared","Firmware is up to date"],["May 14, 03:21 AM","Power Cycle","●","Info","Cleared","Device restarted remotely"]];
  return <EnterpriseSmallTable headers={["Time","Event","Severity","Status","Details"]} rows={rows} link="View All Events →" />;
}

function EnterpriseConnectedDevices() {
  const rows = [["◉ Power Meters","8","● Online"],["◉ Current Sensors","24","● Online"],["◉ Temperature Sensors","6","● Online"],["◉ Digital Inputs","4","● Online"],["◉ Relays/Outputs","2","● Online"]];
  return <EnterpriseSmallTable headers={["Device Type","Connected","Status"]} rows={rows} link="View All Connections →" />;
}

function EnterpriseDeviceInfo() {
  const rows = [["Serial Number","GW-TIJ-01-240415-0023"],["MAC Address","00:1A:2B:3C:4D:5E"],["IP Address","192.168.10.45"],["Model","ECBS Gateway Pro"],["Installation Date","Apr 15, 2024"],["Warranty Expires","Apr 15, 2027"]];
  return <div className="h-full text-[8px]">{rows.map(([a,b])=><div className="grid grid-cols-[92px_1fr] border-b border-white/5 py-1.5" key={a}><span className="text-slate-400">{a}</span><b className="font-medium">{b}</b></div>)}<div className="mt-3 text-[#05ff5e]">View Full Device Profile →</div></div>;
}

function EnterpriseSmallTable({ headers, link, rows }: { headers: string[]; link: string; rows: string[][] }) {
  return <div className="h-full text-[7.4px]"><table className="w-full text-left"><thead className="text-slate-400"><tr>{headers.map(h=><th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr className="border-t border-white/5" key={`${row[0]}-${ri}`}>{row.map((cell,i)=><td className={cell.includes("Online") || cell==="Cleared" || cell==="●" ? "py-1.5 text-[#05ff5e]" : cell==="Warning" ? "py-1.5 text-[#f59e0b]" : "py-1.5"} key={`${row[0]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><div className="mt-2 text-[#05ff5e]">{link}</div></div>;
}
