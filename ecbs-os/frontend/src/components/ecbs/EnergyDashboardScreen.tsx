import {
  ActiveAlarmsCard,
  DashboardFooter,
  DashboardHeader,
  DashboardKpiCard,
  DashboardPanel,
  DeviceHealthCard,
  EcbsImpactCard,
  ElectricalNetworkOverviewCard,
  HiddenCapacityRecoveryCard,
  LivePowerSnapshotCard,
  MonitoringHealthCard,
  QuickActionsCard,
  RecentEventsCard,
  SiteInformationCard,
  TransformerStatusCard,
  TrendCard,
  type QuickActionItem,
} from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";
import type { SiteDashboardData } from "@/lib/trackingDashboardData";

const quickActions: QuickActionItem[] = [
  { label: "Generate Assessment", icon: "assessment", color: "#147dff" },
  { label: "Generate Proposal", icon: "proposal", color: "#f59e0b" },
  { label: "View Digital Twin", icon: "digitalTwin", color: "#05ff5e" },
  { label: "Export Meter Data", icon: "export", color: "#cbd5e1" },
  { label: "View Reports", icon: "reports", color: "#147dff" },
  { label: "Open Deployment", icon: "deployment", color: "#f59e0b" },
  { label: "Schedule Maintenance", icon: "maintenance", color: "#cbd5e1" },
  { label: "Add Note", icon: "note", color: "#f59e0b" },
];

export function EnergyDashboardScreen({
  activeHref = "/enterprise/energy-dashboard",
  data,
}: {
  activeHref?: string;
  data: SiteDashboardData;
}) {
  return (
    <EcbsAppShell activeHref={activeHref}>
      <div className="flex h-[682px] flex-col overflow-hidden px-2 py-1.5">
        <DashboardHeader dateRange="Latest tracking DB rollup" subtitle={data.siteName} title="Site Dashboard" />

        <section className="grid h-[70px] grid-cols-6 gap-1.5">
          {data.kpis.map((kpi) => (
            <DashboardKpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>

        <section className="mt-1.5 grid h-[188px] grid-cols-[1.28fr_1.05fr_1.35fr] gap-1.5">
          <DashboardPanel title="Electrical Network Overview" action="View Full Network →">
            <ElectricalNetworkOverviewCard nodes={data.electricalNodes} panels={data.panels} />
          </DashboardPanel>

          <DashboardPanel title="Transformer T1">
            <TransformerStatusCard value={data.transformerUtilization} metrics={data.transformerMetrics} />
          </DashboardPanel>

          <DashboardPanel title="Live Power Snapshot" action="View Live Data →">
            <LivePowerSnapshotCard metrics={data.liveSnapshot} />
          </DashboardPanel>
        </section>

        <section className="mt-1.5 grid h-[118px] grid-cols-3 gap-1.5">
          <DashboardPanel title="Savings Trend (12 Months)" action="View Report →">
            <TrendCard {...data.savingsTrend} />
          </DashboardPanel>
          <DashboardPanel title="Current Balance Index™ Trend (30 Days)" action="View Report →">
            <TrendCard {...data.balanceTrend} />
          </DashboardPanel>
          <DashboardPanel title="THD Trend (30 Days)" action="View Report →">
            <TrendCard {...data.thdTrend} />
          </DashboardPanel>
        </section>

        <section className="mt-1.5 grid h-[96px] grid-cols-[1.25fr_1.65fr_0.85fr_0.85fr] gap-1.5">
          <DashboardPanel title="Hidden Capacity Recovery (ECBS Impact)" action="View Analysis →">
            <HiddenCapacityRecoveryCard before={data.capacityBefore} after={data.capacityAfter} />
          </DashboardPanel>
          <DashboardPanel title="ECBS Impact (vs. Baseline)">
            <EcbsImpactCard metrics={data.impact} />
          </DashboardPanel>
          <DashboardPanel title="Device Health">
            <DeviceHealthCard items={data.deviceHealth} />
          </DashboardPanel>
          <DashboardPanel title="Monitoring Health">
            <MonitoringHealthCard items={data.monitoringHealth} />
          </DashboardPanel>
        </section>

        <section className="mt-1.5 grid h-[116px] grid-cols-[1fr_1fr_0.9fr_1.6fr] gap-1.5">
          <DashboardPanel title="Active Alarms (3)" action="View All Alarms →">
            <ActiveAlarmsCard alarms={data.alarms} />
          </DashboardPanel>
          <DashboardPanel title="Recent Events" action="View All Events →">
            <RecentEventsCard events={data.events} />
          </DashboardPanel>
          <DashboardPanel title="Quick Actions">
            <QuickActionsCard actions={quickActions} />
          </DashboardPanel>
          <DashboardPanel title="Site Information" action="View Site Details →">
            <SiteInformationCard rows={data.siteInfo} />
          </DashboardPanel>
        </section>

        <DashboardFooter updatedAt={data.updatedAt} />
      </div>
    </EcbsAppShell>
  );
}
