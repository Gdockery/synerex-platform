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

export function EnterpriseDashboardScreen({ data }: { data: EnterpriseDashboardData }) {
  return (
    <EcbsAppShell>
      <div className="ecbs-dashboard-content flex h-[682px] flex-col overflow-hidden px-4 py-2">
        <DashboardHeader
          dateRange={data.dateRange}
          subtitle="Enterprise Dashboard"
          title="XECO Energy Intelligence Portal"
          variant="enterprise"
        />

        <ScreenStateBanner state={data.state} />

        <section className="mt-2 grid grid-cols-6 gap-3">
          {data.kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} kpi={kpi} variant="enterprise" />
          ))}
        </section>

        <section className="mt-2 space-y-2.5">
          <div className="grid h-[190px] grid-cols-[2.1fr_1fr_1.58fr] gap-2.5">
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

          <div className="grid h-[145px] grid-cols-[1fr_1fr] gap-2.5">
            <DashboardPanel title="Savings Trend (Monthly)" variant="enterprise">
              <EnterpriseSavingsTrendCard points={trendPoints} />
            </DashboardPanel>

            <DashboardPanel title="Top Sites By Annual Savings" variant="enterprise">
              <TopSitesSavingsCard sites={data.sites} />
            </DashboardPanel>
          </div>

          <div className="grid h-[138px] grid-cols-[1.35fr_1fr_0.95fr_1.35fr] gap-2.5">
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
