import "server-only";

import mysql from "mysql2/promise";
import type { EnterpriseDashboardData, KpiCard, SiteSaving } from "@/data/enterpriseDashboard";
import type {
  AlarmItem,
  CapacityRecoveryRow,
  DashboardKpi,
  ElectricalPanel,
  EventItem,
  HealthLegendItem,
  ImpactMetric,
  LiveSnapshotMetric,
  NetworkNode,
  SiteInfoRow,
  TransformerMetric,
  TrendCardData,
} from "@/components/ecbs/DashboardCards";

type ClientRow = {
  id: number;
  name: string;
};

type ProjectRow = {
  id: number;
  location: string | null;
  name: string;
};

type SiteRow = {
  address: string | null;
  city: string | null;
  id: number;
  name: string;
  project_id: number | null;
  state: string | null;
  status: string | null;
};

type MetricSummaryRow = {
  avg_cbi: number | null;
  avg_pf: number | null;
  avg_thd: number | null;
  meter_count: number;
  sum_kva: number | null;
  sum_kw: number | null;
};

type CapacitySummaryRow = {
  available_capacity: number | null;
  calculated_at?: number | null;
  deferred_capital_value?: number | null;
  hidden_capacity?: number | null;
  hidden_pct?: number | null;
  installed_capacity?: number | null;
  recoverable_capacity: number | null;
  recoverable_pct?: number | null;
  used_capacity?: number | null;
  utilization_pct: number | null;
  capacity_health_score?: number | null;
  bucket_ts?: number | null;
};

type SavingsSummaryRow = {
  annual_savings: number | null;
  baseline_avg_kw: number | null;
  co2_reduction_tons: number | null;
  current_avg_kw: number | null;
  payback: number | null;
  recoverable_kva: number | null;
  roi: number | null;
};

type DeviceCountRow = {
  reporting: number | null;
  total: number | null;
  type: string;
};

type LatestMeterRow = {
  avg15MinuteKva: number | null;
  id: number;
  isFilter: number;
  isMain: number;
  isSub: number;
  lastTimestamp: number | null;
  lastTotalAmp: number | null;
  lastTotalKva: number | null;
  lastTotalKvar: number | null;
  lastTotalKw: number | null;
  lastTotalPf: number | null;
  lastTotalTHD: number | null;
  lastTotalVolt: number | null;
  name: string;
};

type AssetRow = {
  amp_rating: number | null;
  asset_uid: string | null;
  asset_type: string;
  bus_id: string | null;
  drawing_ref: string | null;
  id: number;
  kva_rating: number | null;
  meter_id: number | null;
  name: string;
  notes: string | null;
  status: string | null;
  voltage_primary: number | null;
  voltage_secondary: number | null;
};

type DigitalTwinRow = {
  approved_at: number | null;
  id: number;
  label: string | null;
  notes: string | null;
  project_id: number;
  site_id: number;
  source: string | null;
  status: string;
  updatedAt: number | null;
  version_number: number;
};

type DigitalTwinRelationshipRow = {
  child_asset_id: number;
  id: number;
  parent_asset_id: number;
  relationship_type: string;
};

export type CapacityIntelligenceAsset = {
  availableKva: string;
  connectedKva: string;
  health: "Critical" | "Healthy" | "Warning";
  name: string;
  recoveredKva: string;
  sparkline: string;
  type: string;
  utilizedKva: string;
  utilizationPct: string;
  utilizationValue: number;
};

export type CapacityIntelligenceData = {
  annualBenefit: string;
  assets: CapacityIntelligenceAsset[];
  availableKva: number;
  avoidedUpgrade: string;
  callouts: { icon: string; label: string; value: string }[];
  capacityHealthScore: number;
  co2Tons: string;
  dateRange: string;
  deferredCapitalValue: number;
  hiddenKva: number;
  installedKva: number;
  keyInsight: string;
  kpis: DashboardKpi[];
  loadKva: number;
  recoveredKva: number;
  recoveredPct: number;
  siteName: string;
  state: "data" | "empty" | "error";
  subScores: { label: string; value: number }[];
  trend: { available: number; installed: number; label: string; used: number }[];
  updatedAt: string;
  utilizationPct: number;
};

export type DigitalTwinAsset = {
  ampRating: number;
  assetUid: string;
  busId: string;
  drawingRef: string;
  id: number;
  kvaRating: number;
  meterId: number | null;
  name: string;
  notes: string;
  status: string;
  type: string;
  voltagePrimary: number;
  voltageSecondary: number;
};

export type DigitalTwinRelationship = {
  childId: number;
  id: number;
  parentId: number;
  type: string;
};

export type DigitalTwinData = {
  activeMeters: number;
  assets: DigitalTwinAsset[];
  cbiScore: number;
  currentLoadKva: number;
  dateRange: string;
  headroomKva: number;
  projectName: string;
  relationships: DigitalTwinRelationship[];
  siteName: string;
  state: "data" | "empty" | "error";
  status: string;
  transformerKva: number;
  twinId: number | null;
  twinLabel: string;
  twinNotes: string;
  updatedAt: string;
  version: number;
};

export type SiteDashboardData = {
  alarms: AlarmItem[];
  balanceTrend: TrendCardData;
  capacityAfter: CapacityRecoveryRow[];
  capacityBefore: CapacityRecoveryRow[];
  deviceHealth: HealthLegendItem[];
  electricalNodes: [NetworkNode, NetworkNode, NetworkNode];
  events: EventItem[];
  impact: ImpactMetric[];
  kpis: DashboardKpi[];
  liveSnapshot: LiveSnapshotMetric[];
  monitoringHealth: HealthLegendItem[];
  panels: ElectricalPanel[];
  savingsTrend: TrendCardData;
  siteInfo: SiteInfoRow[];
  siteName: string;
  thdTrend: TrendCardData;
  transformerMetrics: TransformerMetric[];
  transformerUtilization: string;
  updatedAt: string;
};

const ochsnerQuery = "ochsner";

export async function getEnterpriseDashboardData(): Promise<EnterpriseDashboardData> {
  try {
    const pool = createTrackingPool();

    try {
      const [clients] = await pool.query<mysql.RowDataPacket[]>(
        `
          SELECT id, name
          FROM client
          WHERE isDeleted = 0
            AND LOWER(CONCAT_WS(' ', name, legalName, address, city, state)) LIKE ?
          ORDER BY id
          LIMIT 1
        `,
        [`%${ochsnerQuery}%`],
      );

      const client = clients[0] as ClientRow | undefined;

      if (!client) {
        return emptyDashboard("No Ochsner client record was found in tracking DB.");
      }

      const [projects] = await pool.query<mysql.RowDataPacket[]>(
        `
          SELECT id, name, location
          FROM project
          WHERE isDeleted = 0 AND client = ?
          ORDER BY id
        `,
        [client.id],
      );

      const projectRows = projects as ProjectRow[];
      const projectIds = projectRows.map((project) => project.id);

      if (projectIds.length === 0) {
        return emptyDashboard("No Ochsner projects were found in tracking DB.");
      }

      const placeholders = projectIds.map(() => "?").join(",");
      const [sites] = await pool.query<mysql.RowDataPacket[]>(
        `
          SELECT id, name, address, city, state, status, project_id
          FROM site
          WHERE is_deleted = 0 AND project_id IN (${placeholders})
          ORDER BY name
        `,
        projectIds,
      );

      const [metricRows] = await pool.query<mysql.RowDataPacket[]>(
        `
          WITH latest AS (
            SELECT project_id, MAX(bucket_ts) AS bucket_ts
            FROM current_balance_metrics
            WHERE project_id IN (${placeholders})
            GROUP BY project_id
          )
          SELECT
            COUNT(*) AS meter_count,
            SUM(c.avg_kw) AS sum_kw,
            SUM(c.avg_kva) AS sum_kva,
            AVG(c.avg_pf) AS avg_pf,
            AVG(c.avg_thd) AS avg_thd,
            AVG(c.cbi_score) AS avg_cbi
          FROM current_balance_metrics c
          JOIN latest l ON l.project_id = c.project_id AND l.bucket_ts = c.bucket_ts
        `,
        projectIds,
      );

      const [capacityRows] = await pool.query<mysql.RowDataPacket[]>(
        `
          WITH ranked AS (
            SELECT
              recoverable_capacity,
              available_capacity,
              utilization_pct,
              ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY bucket_ts DESC) AS rn
            FROM capacity_intelligence
            WHERE project_id IN (${placeholders})
          )
          SELECT
            SUM(recoverable_capacity) AS recoverable_capacity,
            SUM(available_capacity) AS available_capacity,
            AVG(utilization_pct) AS utilization_pct
          FROM ranked
          WHERE rn = 1
        `,
        projectIds,
      );

      const [savingsRows] = await pool.query<mysql.RowDataPacket[]>(
        `
          WITH ranked AS (
            SELECT
              annual_savings,
              roi,
              payback,
              recoverable_kva,
              co2_reduction_tons,
              baseline_avg_kw,
              current_avg_kw,
              ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY bucket_ts DESC) AS rn
            FROM savings_intelligence
            WHERE project_id IN (${placeholders})
          )
          SELECT
            SUM(annual_savings) AS annual_savings,
            AVG(roi) AS roi,
            AVG(payback) AS payback,
            SUM(recoverable_kva) AS recoverable_kva,
            SUM(co2_reduction_tons) AS co2_reduction_tons,
            AVG(baseline_avg_kw) AS baseline_avg_kw,
            AVG(current_avg_kw) AS current_avg_kw
          FROM ranked
          WHERE rn = 1
        `,
        projectIds,
      );

      const [deviceRows] = await pool.query<mysql.RowDataPacket[]>(
        `
          SELECT 'meter' AS type, COUNT(*) AS total, SUM(isReporting = 1) AS reporting
          FROM meter
          WHERE project IN (${placeholders}) AND isDeleted = 0
          UNION ALL
          SELECT 'gateway' AS type, COUNT(*) AS total, COUNT(*) AS reporting
          FROM gateway
          WHERE project IN (${placeholders}) AND isDeleted = 0
          UNION ALL
          SELECT 'switch' AS type, COUNT(*) AS total, COUNT(*) AS reporting
          FROM \`switch\`
          WHERE project IN (${placeholders}) AND isDeleted = 0
          UNION ALL
          SELECT 'repeater' AS type, COUNT(*) AS total, COUNT(*) AS reporting
          FROM repeater
          WHERE project IN (${placeholders}) AND isDeleted = 0
        `,
        [...projectIds, ...projectIds, ...projectIds, ...projectIds],
      );

      const metrics = firstRow<MetricSummaryRow>(metricRows);
      const capacity = firstRow<CapacitySummaryRow>(capacityRows);
      const savings = firstRow<SavingsSummaryRow>(savingsRows);
      const devices = deviceRows as DeviceCountRow[];

      return {
        state: "data",
        dateRange: "Latest tracking DB rollup",
        updatedAt: new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "America/Chicago",
        }),
        kpis: buildKpis(metrics, capacity, savings),
        summary: buildSummary(client, projectRows, metrics, capacity, savings),
        sites: buildSites(sites as SiteRow[], projectRows, savings, metrics),
        networkHealth: buildNetworkHealth(metrics, devices),
        transformerCapacity: buildTransformerCapacity(capacity, savings),
        hiddenCapacity: buildHiddenCapacity(capacity, savings),
        networkLosses: buildNetworkLosses(savings),
        deviceHealth: buildEnterpriseDeviceHealth(devices),
      };
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("Failed to load enterprise dashboard data from tracking DB", error);
    return emptyDashboard("Tracking DB data is unavailable for the enterprise dashboard.");
  }
}

function createTrackingPool() {
  return mysql.createPool({
    database: process.env.TRACKING_DB_NAME ?? "tracking",
    host: process.env.TRACKING_DB_HOST ?? "mysql-tracking",
    password: process.env.TRACKING_DB_PASSWORD ?? "TrackingPass123",
    port: Number(process.env.TRACKING_DB_PORT ?? 3306),
    user: process.env.TRACKING_DB_USER ?? "tracking_user",
    waitForConnections: true,
    connectionLimit: 4,
  });
}

export async function getOchsnerSiteDashboardData(): Promise<SiteDashboardData> {
  const pool = createTrackingPool();

  try {
    const [siteRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT s.id, s.name, s.address, s.city, s.state, s.status, s.project_id, p.name AS project_name, p.location, c.name AS client_name
        FROM site s
        JOIN project p ON p.id = s.project_id
        JOIN client c ON c.id = p.client
        WHERE s.id = 3 AND p.id = 13
        LIMIT 1
      `,
    );

    const site = siteRows[0] as (SiteRow & {
      client_name: string;
      location: string | null;
      project_name: string;
    }) | undefined;

    if (!site) {
      return emptySiteDashboard("Ochsner site record was not found in tracking DB.");
    }

    const [metricRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        WITH latest AS (
          SELECT MAX(bucket_ts) AS bucket_ts
          FROM current_balance_metrics
          WHERE project_id = 13
        )
        SELECT
          COUNT(*) AS meter_count,
          SUM(c.avg_kw) AS sum_kw,
          SUM(c.avg_kva) AS sum_kva,
          AVG(c.avg_pf) AS avg_pf,
          AVG(c.avg_thd) AS avg_thd,
          AVG(c.cbi_score) AS avg_cbi
        FROM current_balance_metrics c
        JOIN latest l ON l.bucket_ts = c.bucket_ts
        WHERE c.project_id = 13
      `,
    );

    const [capacityRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT installed_capacity, used_capacity, available_capacity, recoverable_capacity, utilization_pct
        FROM capacity_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );

    const [savingsRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT annual_savings, roi, payback, recoverable_kva, co2_reduction_tons, current_avg_kw, current_avg_kva, current_avg_pf, baseline_avg_pf, pf_improvement
        FROM savings_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );

    const [meterRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name, isMain, isSub, isFilter, lastTotalVolt, lastTotalAmp, lastTotalKw, lastTotalKva, lastTotalPf, lastTotalKvar, lastTotalTHD, lastTimestamp, avg15MinuteKva
        FROM meter
        WHERE project = 13 AND isDeleted = 0
        ORDER BY isMain DESC, isSub DESC, id
      `,
    );

    const [savingsTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT annual_savings AS value
        FROM savings_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 12
      `,
    );

    const [balanceTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT AVG(cbi_score) AS value
        FROM current_balance_metrics
        WHERE project_id = 13
        GROUP BY bucket_ts
        ORDER BY bucket_ts DESC
        LIMIT 12
      `,
    );

    const [thdTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT AVG(avg_thd) AS value
        FROM current_balance_metrics
        WHERE project_id = 13
        GROUP BY bucket_ts
        ORDER BY bucket_ts DESC
        LIMIT 12
      `,
    );

    const metrics = firstRow<MetricSummaryRow>(metricRows);
    const capacity = firstRow<CapacitySummaryRow & { installed_capacity?: number | null; used_capacity?: number | null }>(capacityRows);
    const savings = firstRow<SavingsSummaryRow & {
      baseline_avg_pf?: number | null;
      current_avg_kva?: number | null;
      current_avg_kw?: number | null;
      current_avg_pf?: number | null;
      pf_improvement?: number | null;
    }>(savingsRows);
    const meters = meterRows as LatestMeterRow[];
    const mainMeter = meters.find((meter) => meter.isMain === 1) ?? meters[0];
    const transformerKva = toNumber(capacity?.installed_capacity) || 1000;
    const usedKva = toNumber(capacity?.used_capacity ?? mainMeter?.lastTotalKva);
    const utilization = toNumber(capacity?.utilization_pct) || (transformerKva ? (usedKva / transformerKva) * 100 : 0);
    const cbi = toNumber(metrics?.avg_cbi);
    const avgPf = toNumber(metrics?.avg_pf);
    const avgThd = toNumber(metrics?.avg_thd);
    const annualSavings = toNumber(savings?.annual_savings);
    const recoverableKva = toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva);

    return {
      siteName: site.name,
      updatedAt: formatTimestamp(Date.now()),
      kpis: [
        { icon: "∿", label: "Current Balance Index™", value: cbi > 0 ? cbi.toFixed(0) : "N/A", detail: cbi >= 90 ? "A+ Rating" : "Needs Review", color: cbi >= 90 ? "#0da64a" : "#f59e0b" },
        { icon: "⚡", label: "Capacity Recovered", value: `${formatNumber(recoverableKva, 0)} kVA`, detail: "Latest DB rollup", color: "#147dff" },
        { icon: "▣", label: "Transformer Utilization", value: `${formatNumber(utilization, 0)}%`, detail: transformerKva ? `${formatNumber(transformerKva, 0)} kVA rating` : "DB estimate", color: utilization > 85 ? "#f59e0b" : "#147dff" },
        { icon: "⊙", label: "Power Factor (Avg)", value: avgPf > 0 ? avgPf.toFixed(3) : "N/A", detail: avgPf >= 0.95 ? "Optimal" : "Review", color: avgPf >= 0.95 ? "#0da64a" : "#f59e0b" },
        { icon: "↕", label: "THD (Avg)", value: avgThd > 0 ? `${avgThd.toFixed(1)}%` : "N/A", detail: avgThd <= 5 ? "Good (<5%)" : "Above target", color: avgThd <= 5 ? "#0da64a" : "#f59e0b" },
        { icon: "$", label: "Annual Savings", value: formatCurrency(annualSavings), detail: "Savings intelligence", color: "#0da64a" },
      ],
      electricalNodes: [
        { label: "Utility", value: "13.8 kV" },
        { label: "Transformer T1", value: `${formatNumber(transformerKva, 0)} kVA` },
        { label: "Main Switchgear", value: `${formatNumber(toNumber(mainMeter?.lastTotalVolt), 0)} V` },
      ],
      panels: meters.map((meter) => ({
        name: meter.name,
        label: meter.isMain ? "Main Meter" : meter.isFilter ? "Filter" : meter.isSub ? "Submeter" : "Meter",
        load: `${formatNumber(toNumber(meter.lastTotalKw), 0)} kW`,
      })),
      transformerUtilization: `${formatNumber(utilization, 0)}%`,
      transformerMetrics: [
        { label: "Rating", value: `${formatNumber(transformerKva, 0)} kVA` },
        { label: "Current Load", value: `${formatNumber(usedKva, 0)} kVA` },
        { label: "Available Capacity", value: `${formatNumber(toNumber(capacity?.available_capacity), 0)} kVA` },
        { label: "Recovered Capacity", value: `${formatNumber(recoverableKva, 0)} kVA`, accent: true },
        { label: "Power Factor", value: avgPf > 0 ? avgPf.toFixed(3) : "N/A" },
        { label: "THD", value: avgThd > 0 ? `${avgThd.toFixed(1)}%` : "N/A", accent: avgThd <= 5 },
      ],
      liveSnapshot: [
        { label: "Voltage (L-L)", value: `${formatNumber(toNumber(mainMeter?.lastTotalVolt), 0)} V` },
        { label: "Current", value: `${formatNumber(toNumber(mainMeter?.lastTotalAmp), 0)} A` },
        { label: "Real Power", value: `${formatNumber(toNumber(mainMeter?.lastTotalKw), 0)} kW`, color: "#f59e0b" },
        { label: "Reactive Power", value: `${formatNumber(toNumber(mainMeter?.lastTotalKvar), 0)} kVAR`, color: "#f59e0b" },
        { label: "Power Factor", value: toNumber(mainMeter?.lastTotalPf) > 1 ? (toNumber(mainMeter?.lastTotalPf) / 100).toFixed(3) : toNumber(mainMeter?.lastTotalPf).toFixed(3) },
        { label: "THD", value: `${formatNumber(toNumber(mainMeter?.lastTotalTHD), 1)}%` },
      ],
      savingsTrend: {
        value: formatCurrency(annualSavings),
        detail: "Latest savings intelligence",
        points: pointsFromRows(savingsTrendRows),
      },
      balanceTrend: {
        value: cbi > 0 ? cbi.toFixed(0) : "N/A",
        detail: cbi >= 90 ? "A+ Rating" : "Needs Review",
        points: pointsFromRows(balanceTrendRows),
      },
      thdTrend: {
        value: avgThd > 0 ? `${avgThd.toFixed(1)}%` : "N/A",
        detail: avgThd <= 5 ? "Good (<5%)" : "Above target",
        points: pointsFromRows(thdTrendRows, true),
        color: "#2f8cff",
      },
      capacityBefore: [
        { label: "Productive Current", value: `${formatNumber(100 - toNumber(metrics?.avg_thd), 0)}%`, color: "#05ff5e" },
        { label: "Reactive Current", value: `${formatNumber(Math.max(0, 100 - avgPf * 100), 0)}%`, color: "#f59e0b" },
        { label: "Harmonic Current", value: `${formatNumber(avgThd, 0)}%`, color: "#ef4444" },
        { label: "Imbalance Current", value: "0%", color: "#ef4444" },
      ],
      capacityAfter: [
        { label: "Productive Current", value: `${formatNumber(Math.min(100, avgPf * 100), 0)}%`, color: "#05ff5e" },
        { label: "Reactive Current", value: "5%", color: "#f59e0b" },
        { label: "Harmonic Current", value: "5%", color: "#ef4444" },
        { label: "Imbalance Current", value: "0%", color: "#ef4444" },
      ],
      impact: [
        { label: "Current Reduction", value: `${formatNumber(toNumber(savings?.current_avg_kw), 0)} kW` },
        { label: "THD", value: avgThd > 0 ? `${avgThd.toFixed(1)}%` : "N/A" },
        { label: "PF Improvement", value: `${formatNumber(toNumber(savings?.baseline_avg_pf), 2)} → ${avgPf.toFixed(3)}` },
        { label: "Capacity Recovery", value: `${formatNumber(recoverableKva, 0)} kVA` },
        { label: "Annual Savings", value: formatCurrency(annualSavings) },
      ],
      deviceHealth: [
        { color: "#05ff5e", label: "Reporting", value: `${meters.length} meters` },
        { color: "#f59e0b", label: "Warnings", value: `${avgThd > 5 ? 1 : 0}` },
        { color: "#ef4444", label: "Offline", value: "0" },
      ],
      monitoringHealth: [
        { color: "#05ff5e", label: "PQ Meter", value: mainMeter ? "Online" : "Missing" },
        { color: "#05ff5e", label: "Tracking DB", value: "Online" },
        { color: "#05ff5e", label: "Analytics", value: "Online" },
        { color: "#05ff5e", label: "Sync Cron", value: "Active" },
      ],
      alarms: [
        { title: avgThd > 5 ? "High THD Detected" : "THD Normal", detail: avgThd > 0 ? `${avgThd.toFixed(1)}% average THD` : "No THD value", time: "Latest rollup", tone: avgThd > 5 ? "yellow" : "blue" },
        { title: utilization > 100 ? "Transformer Over Rating" : "Transformer Load", detail: `${formatNumber(utilization, 0)}% utilization`, time: "Latest rollup", tone: utilization > 100 ? "red" : "blue" },
        { title: "DB Sync Active", detail: "Tracking cron/backfill source", time: "Live", tone: "blue" },
      ],
      events: [
        { time: "Latest", event: `Tracking DB loaded ${meters.length} Ochsner meters` },
        { time: "Latest", event: `Savings intelligence reports ${formatCurrency(annualSavings)}` },
        { time: "Latest", event: `Current balance average THD ${avgThd.toFixed(1)}%` },
        { time: "Latest", event: `Capacity recovery ${formatNumber(recoverableKva, 0)} kVA` },
      ],
      siteInfo: [
        { label: "Site Name", value: site.name },
        { label: "Address", value: [site.address, site.city, site.state].filter(Boolean).join(", ") },
        { label: "Customer", value: site.client_name },
        { label: "Project", value: site.project_name },
        { label: "Project ID", value: "13" },
        { label: "Site ID", value: "3" },
      ],
    };
  } finally {
    await pool.end();
  }
}

export async function getOchsnerCapacityIntelligenceData(): Promise<CapacityIntelligenceData> {
  const pool = createTrackingPool();

  try {
    const [siteRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT s.id, s.name, p.name AS project_name
        FROM site s
        JOIN project p ON p.id = s.project_id
        WHERE s.id = 3 AND p.id = 13
        LIMIT 1
      `,
    );
    const site = siteRows[0] as { id: number; name: string; project_name: string } | undefined;

    if (!site) {
      return emptyCapacityIntelligence("Ochsner site record was not found in tracking DB.");
    }

    const [capacityRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT bucket_ts, installed_capacity, used_capacity, available_capacity, hidden_capacity,
               recoverable_capacity, deferred_capital_value, capacity_health_score,
               utilization_pct, hidden_pct, recoverable_pct
        FROM capacity_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );
    const capacity = firstRow<CapacitySummaryRow>(capacityRows);

    if (!capacity) {
      return emptyCapacityIntelligence("No Capacity Intelligence rollup was found for Ochsner project 13.");
    }

    const [trendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT bucket_ts, installed_capacity, used_capacity, available_capacity, recoverable_capacity
        FROM capacity_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 14
      `,
    );
    const [assetRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name, asset_type, kva_rating, amp_rating, voltage_primary, voltage_secondary, meter_id, status
        FROM asset
        WHERE site_id = 3 AND is_deleted = 0
        ORDER BY
          CASE asset_type
            WHEN 'transformer' THEN 1
            WHEN 'switchgear' THEN 2
            WHEN 'generator' THEN 3
            WHEN 'ecbs' THEN 4
            ELSE 5
          END,
          id
      `,
    );
    const [meterRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name, isMain, isSub, isFilter, lastTotalKva, avg15MinuteKva, lastTotalPf, lastTotalTHD
        FROM meter
        WHERE project = 13 AND isDeleted = 0
        ORDER BY isMain DESC, id
      `,
    );
    const [savingsRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT annual_savings, co2_reduction_tons
        FROM savings_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );

    const assets = assetRows as AssetRow[];
    const meters = meterRows as LatestMeterRow[];
    const savings = firstRow<SavingsSummaryRow>(savingsRows);
    const installed = toNumber(capacity.installed_capacity);
    const used = toNumber(capacity.used_capacity);
    const available = toNumber(capacity.available_capacity);
    const hidden = toNumber(capacity.hidden_capacity);
    const recovered = toNumber(capacity.recoverable_capacity);
    const deferred = toNumber(capacity.deferred_capital_value);
    const health = clampScore(toNumber(capacity.capacity_health_score));
    const utilization = clampScore(toNumber(capacity.utilization_pct));
    const recoveredPct = installed > 0 ? (recovered / installed) * 100 : toNumber(capacity.recoverable_pct);
    const annualBenefit = toNumber(savings?.annual_savings);
    const co2 = toNumber(savings?.co2_reduction_tons);
    const nowAvailable = available + recovered;
    const nextUpgradeKva = Math.ceil(Math.max(installed, 1) / 500) * 500;

    return {
      annualBenefit: formatCurrency(annualBenefit),
      assets: buildCapacityAssets(assets, meters, installed, used, recovered),
      availableKva: available,
      avoidedUpgrade: `${formatNumber(nextUpgradeKva, 0)} kVA transformer and switchgear upgrade`,
      callouts: [
        { icon: "i", label: "Key Insight", value: `${formatNumber(nowAvailable, 0)} kVA is available after ECBS recovery.` },
        { icon: "u", label: "Avoided Upgrade", value: `${formatNumber(nextUpgradeKva, 0)} kVA transformer upgrade deferred.` },
        { icon: "$", label: "Annual Benefit", value: `${formatCurrency(annualBenefit)} annual savings from capacity recovery.` },
        { icon: "c", label: "Carbon Impact", value: `${formatNumber(co2, 0)} tons CO2e avoided annually.` },
      ],
      capacityHealthScore: health,
      co2Tons: `${formatNumber(co2, 0)} tons`,
      dateRange: "Latest tracking DB rollup",
      deferredCapitalValue: deferred,
      hiddenKva: hidden,
      installedKva: installed,
      keyInsight: `Ochsner has ${formatNumber(nowAvailable, 0)} kVA of available capacity, including ${formatNumber(recovered, 0)} kVA recovered by ECBS.`,
      kpis: [
        { icon: "P", label: "Total Connected Capacity", value: `${formatNumber(installed, 0)} kVA`, detail: "Nameplate capacity", color: "#29b6f6" },
        { icon: "G", label: "Current Utilized Capacity", value: `${formatNumber(used, 0)} kVA`, detail: `${formatNumber(utilization, 0)}% of connected capacity`, color: utilization > 85 ? "#ef4444" : "#f59e0b" },
        { icon: "B", label: "Available Capacity", value: `${formatNumber(nowAvailable, 0)} kVA`, detail: `${formatNumber(Math.max(0, 100 - utilization), 0)}% remaining before recovery`, color: "#05ff5e" },
        { icon: "R", label: "Recovered Capacity", value: `${formatNumber(recovered, 0)} kVA`, detail: `${formatNumber(recoveredPct, 0)}% recovered by ECBS`, color: "#05ff5e" },
        { icon: "$", label: "Upgrade Deferral Value", value: formatCurrency(deferred), detail: "Estimated CapEx deferred", color: "#ab47bc" },
      ],
      loadKva: used,
      recoveredKva: recovered,
      recoveredPct,
      siteName: site.name,
      state: "data",
      subScores: [
        { label: "Load Balance", value: scoreLoadBalance(utilization) },
        { label: "Utilization Efficiency", value: scoreUtilization(utilization) },
        { label: "Voltage Stability", value: scoreVoltage(meters) },
        { label: "Harmonic Impact", value: scoreHarmonics(meters) },
        { label: "Thermal Headroom", value: scoreThermalHeadroom(utilization) },
      ],
      trend: (trendRows as CapacitySummaryRow[])
        .reverse()
        .map((row) => ({
          available: toNumber(row.available_capacity) + toNumber(row.recoverable_capacity),
          installed: toNumber(row.installed_capacity),
          label: formatShortDate(toNumber(row.bucket_ts)),
          used: toNumber(row.used_capacity),
        })),
      updatedAt: formatTimestamp(toNumber(capacity.calculated_at ?? capacity.bucket_ts) || Date.now()),
      utilizationPct: utilization,
    };
  } catch (error) {
    console.error("Failed to load Capacity Intelligence data from tracking DB", error);
    return emptyCapacityIntelligence("Tracking DB data is unavailable for Capacity Intelligence.");
  } finally {
    await pool.end();
  }
}

export async function getOchsnerDigitalTwinData(): Promise<DigitalTwinData> {
  const pool = createTrackingPool();

  try {
    const [siteRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT s.id, s.name AS site_name, p.id AS project_id, p.name AS project_name
        FROM site s
        JOIN project p ON p.id = s.project_id
        WHERE s.id = 3 AND p.id = 13
        LIMIT 1
      `,
    );
    const site = siteRows[0] as { id: number; project_id: number; project_name: string; site_name: string } | undefined;

    if (!site) {
      return emptyDigitalTwin("Ochsner site record was not found in tracking DB.");
    }

    const [twinRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, site_id, project_id, status, version_number, label, source, notes, approved_at, updatedAt
        FROM digital_twin
        WHERE project_id = 13 AND is_deleted = 0
        ORDER BY
          CASE status WHEN 'locked' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
          version_number DESC
        LIMIT 1
      `,
    );
    const twin = firstRow<DigitalTwinRow>(twinRows);

    if (!twin) {
      return emptyDigitalTwin("No Digital Twin has been configured for Ochsner project 13.");
    }

    const [assetRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name, asset_uid, asset_type, kva_rating, amp_rating, voltage_primary,
               voltage_secondary, bus_id, drawing_ref, meter_id, status, notes
        FROM asset
        WHERE digital_twin_id = ? AND is_deleted = 0
        ORDER BY id
      `,
      [twin.id],
    );
    const [relationshipRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, parent_asset_id, child_asset_id, relationship_type
        FROM asset_relationship
        WHERE digital_twin_id = ?
        ORDER BY id
      `,
      [twin.id],
    );
    const [capacityRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT installed_capacity, used_capacity, available_capacity
        FROM capacity_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );
    const [metricRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        WITH latest AS (
          SELECT MAX(bucket_ts) AS bucket_ts
          FROM current_balance_metrics
          WHERE project_id = 13
        )
        SELECT COUNT(*) AS meter_count, AVG(cbi_score) AS avg_cbi, SUM(avg_kva) AS sum_kva
        FROM current_balance_metrics c
        JOIN latest l ON l.bucket_ts = c.bucket_ts
        WHERE c.project_id = 13
      `,
    );

    const assets = (assetRows as AssetRow[]).map((asset) => ({
      ampRating: toNumber(asset.amp_rating),
      assetUid: asset.asset_uid ?? `asset-${asset.id}`,
      busId: asset.bus_id ?? "",
      drawingRef: asset.drawing_ref ?? "",
      id: asset.id,
      kvaRating: toNumber(asset.kva_rating),
      meterId: asset.meter_id,
      name: asset.name,
      notes: asset.notes ?? "",
      status: asset.status ?? "",
      type: asset.asset_type,
      voltagePrimary: toNumber(asset.voltage_primary),
      voltageSecondary: toNumber(asset.voltage_secondary),
    }));
    const relationships = (relationshipRows as DigitalTwinRelationshipRow[]).map((relationship) => ({
      childId: relationship.child_asset_id,
      id: relationship.id,
      parentId: relationship.parent_asset_id,
      type: relationship.relationship_type,
    }));
    const capacity = firstRow<CapacitySummaryRow>(capacityRows);
    const metrics = firstRow<MetricSummaryRow>(metricRows);
    const transformer = assets.find((asset) => asset.type === "transformer");
    const transformerKva = toNumber(capacity?.installed_capacity) || transformer?.kvaRating || 0;
    const currentLoadKva = toNumber(capacity?.used_capacity);
    const headroomKva = Math.max(0, transformerKva - currentLoadKva);

    return {
      activeMeters: toNumber(metrics?.meter_count),
      assets,
      cbiScore: toNumber(metrics?.avg_cbi),
      currentLoadKva,
      dateRange: "Approved Digital Twin",
      headroomKva,
      projectName: site.project_name,
      relationships,
      siteName: site.site_name,
      state: "data",
      status: twin.status,
      transformerKva,
      twinId: twin.id,
      twinLabel: twin.label ?? "Ochsner Digital Twin",
      twinNotes: twin.notes ?? "",
      updatedAt: formatTimestamp(toNumber(twin.updatedAt ?? twin.approved_at) || Date.now()),
      version: twin.version_number,
    };
  } catch (error) {
    console.error("Failed to load Digital Twin data from tracking DB", error);
    return emptyDigitalTwin("Tracking DB data is unavailable for Digital Twin.");
  } finally {
    await pool.end();
  }
}

function buildKpis(
  metrics: MetricSummaryRow | undefined,
  capacity: CapacitySummaryRow | undefined,
  savings: SavingsSummaryRow | undefined,
): KpiCard[] {
  const annualSavings = toNumber(savings?.annual_savings);
  const recoverableCapacity = toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva);
  const powerFactor = toNumber(metrics?.avg_pf);
  const thd = toNumber(metrics?.avg_thd);
  const attention = thd >= 5 ? 1 : 0;
  const co2 = toNumber(savings?.co2_reduction_tons);

  return [
    {
      label: "Annual Savings",
      value: formatCurrency(annualSavings),
      detail: "Latest savings intelligence",
      tone: "green",
    },
    {
      label: "Capacity Recovered",
      value: `${formatNumber(recoverableCapacity, 0)} kVA`,
      detail: "Latest capacity intelligence",
      tone: "blue",
    },
    {
      label: "Avg Power Factor",
      value: powerFactor > 0 ? powerFactor.toFixed(3) : "N/A",
      detail: "Current balance metrics",
      tone: "cyan",
    },
    {
      label: "THD (Avg)",
      value: thd > 0 ? `${thd.toFixed(1)}%` : "N/A",
      detail: "Current balance metrics",
      tone: thd >= 5 ? "yellow" : "green",
    },
    {
      label: "Sites Requiring Attention",
      value: String(attention),
      detail: thd >= 5 ? "THD above target" : "No open metric flags",
      tone: attention > 0 ? "yellow" : "green",
    },
    {
      label: "CO2 Reduction",
      value: formatNumber(co2, 0),
      detail: "Tons / year",
      tone: "blue",
    },
  ];
}

function buildSummary(
  client: ClientRow,
  projects: ProjectRow[],
  metrics: MetricSummaryRow | undefined,
  capacity: CapacitySummaryRow | undefined,
  savings: SavingsSummaryRow | undefined,
) {
  return [
    `${client.name} enterprise dashboard is sourced from tracking DB records.`,
    `${projects.length} project${projects.length === 1 ? "" : "s"} included in this enterprise rollup.`,
    `Average power factor is ${toNumber(metrics?.avg_pf).toFixed(3)}.`,
    `Average THD is ${toNumber(metrics?.avg_thd).toFixed(1)}%.`,
    `Recoverable capacity is ${formatNumber(toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva), 0)} kVA.`,
    `Annual savings is ${formatCurrency(toNumber(savings?.annual_savings))}.`,
  ];
}

function buildSites(
  sites: SiteRow[],
  projects: ProjectRow[],
  savings: SavingsSummaryRow | undefined,
  metrics?: MetricSummaryRow,
): SiteSaving[] {
  const firstProject = projects[0];
  const annualSavings = formatCurrency(toNumber(savings?.annual_savings));
  const powerFactor = toNumber(metrics?.avg_pf);
  const thd = toNumber(metrics?.avg_thd);

  if (sites.length === 0 && firstProject) {
    return [
      {
        site: firstProject.name,
        annualSavings,
        powerFactor: powerFactor > 0 ? powerFactor.toFixed(3) : "No DB value",
        thd: thd > 0 ? `${thd.toFixed(1)}%` : "No DB value",
        location: firstProject.location ?? "",
        status: "Healthy",
      },
    ];
  }

  return sites.map((site) => ({
    site: site.name,
    annualSavings,
    powerFactor: powerFactor > 0 ? powerFactor.toFixed(3) : "No DB value",
    thd: thd > 0 ? `${thd.toFixed(1)}%` : "No DB value",
    location: [site.address, site.city, site.state].filter(Boolean).join(", "),
    status: site.status?.toLowerCase() === "warning" ? "Warning" : "Healthy",
  }));
}

function buildNetworkHealth(metrics: MetricSummaryRow | undefined, devices: DeviceCountRow[]) {
  const cbi = clampScore(toNumber(metrics?.avg_cbi));
  const harmonicHealth = clampScore(100 - toNumber(metrics?.avg_thd));
  const assetHealth = deviceHealthPercent(devices);
  const overall = Math.round((cbi + harmonicHealth + assetHealth) / 3);

  return {
    metrics: [
      { label: "Current Balance Index", value: String(Math.round(cbi)) },
      { label: "Harmonic Health", value: String(Math.round(harmonicHealth)), tone: "cyan" as const },
      { label: "Asset Health", value: String(Math.round(assetHealth)) },
    ],
    overall: `${overall}%`,
  };
}

function buildTransformerCapacity(capacity: CapacitySummaryRow | undefined, savings: SavingsSummaryRow | undefined) {
  const recovered = toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva);
  const available = toNumber(capacity?.available_capacity);
  const utilization = toNumber(capacity?.utilization_pct);
  const loaded = utilization > 0 && available > 0 ? (available * utilization) / Math.max(1, 100 - utilization) : 0;
  const total = loaded + available || recovered;

  return {
    available: `${formatNumber(available, 0)} kVA`,
    loaded: `${formatNumber(loaded, 0)} kVA`,
    recovered: `${formatNumber(recovered, 0)} kVA`,
    total: `${formatNumber(total, 0)} kVA`,
    utilization: `${formatNumber(utilization, 0)}%`,
  };
}

function buildHiddenCapacity(capacity: CapacitySummaryRow | undefined, savings: SavingsSummaryRow | undefined) {
  const recovered = toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva);
  const deferred = recovered * 65;

  return {
    value: `${formatNumber(recovered, 0)} kVA`,
    equivalents: [
      `${formatNumber(recovered / 37.3, 0)} New 50 HP Motors`,
      `${formatNumber(recovered / 270, 0)} CNC Machines`,
      `${formatNumber(recovered / 39, 0)} Server Cabinets`,
      `${formatCurrency(deferred)} Deferred Capacity Value`,
    ],
  };
}

function buildNetworkLosses(savings: (SavingsSummaryRow & {
  current_avg_kw?: number | null;
  baseline_avg_kw?: number | null;
}) | undefined) {
  const before = toNumber(savings?.baseline_avg_kw);
  const after = toNumber(savings?.current_avg_kw);
  const reduction = before > 0 ? Math.max(0, ((before - after) / before) * 100) : 0;
  const max = Math.max(before, after, 1);

  return {
    after: `${formatNumber(after, 1)} kW`,
    afterWidth: `${Math.max(6, (after / max) * 100)}%`,
    before: `${formatNumber(before, 1)} kW`,
    beforeWidth: `${Math.max(6, (before / max) * 100)}%`,
    reduction: `${formatNumber(reduction, 0)}%`,
  };
}

function buildEnterpriseDeviceHealth(devices: DeviceCountRow[]) {
  const total = devices.reduce((sum, row) => sum + toNumber(row.total), 0);
  const reporting = devices.reduce((sum, row) => sum + toNumber(row.reporting), 0);
  const warning = Math.max(0, total - reporting);
  const percent = total > 0 ? (reporting / total) * 100 : 0;

  return {
    value: `${formatNumber(percent, 0)}%`,
    items: [
      { color: "bg-[#05ff5e]", label: "Reporting", value: `${formatNumber(reporting, 0)} (${formatNumber(percent, 0)}%)` },
      { color: "bg-yellow-300", label: "Not Reporting", value: `${formatNumber(warning, 0)} (${formatNumber(total > 0 ? (warning / total) * 100 : 0, 0)}%)` },
      { color: "bg-red-500", label: "Offline", value: "0 (0%)" },
    ],
  };
}

function buildCapacityAssets(
  assets: AssetRow[],
  meters: LatestMeterRow[],
  installed: number,
  used: number,
  recovered: number,
): CapacityIntelligenceAsset[] {
  const ratedAssets = assets
    .map((asset) => ({
      asset,
      connected: assetConnectedKva(asset),
    }))
    .filter((entry) => entry.connected > 0);
  const totalConnected = ratedAssets.reduce((sum, entry) => sum + entry.connected, 0) || installed || 1;

  return ratedAssets.map(({ asset, connected }, index) => {
    const meter = meters.find((row) => row.id === asset.meter_id);
    const share = connected / totalConnected;
    const utilized = toNumber(meter?.lastTotalKva) || used * share;
    const recoveredShare = recovered * share;
    const available = Math.max(0, connected - utilized + recoveredShare);
    const utilization = connected > 0 ? clampScore((utilized / connected) * 100) : 0;

    return {
      availableKva: formatNumber(available, 0),
      connectedKva: formatNumber(connected, 0),
      health: utilization >= 85 ? "Critical" : utilization >= 70 ? "Warning" : "Healthy",
      name: asset.name,
      recoveredKva: formatNumber(recoveredShare, 0),
      sparkline: capacitySparkline(utilization, index),
      type: titleCase(asset.asset_type),
      utilizedKva: formatNumber(utilized, 0),
      utilizationPct: `${formatNumber(utilization, 0)}%`,
      utilizationValue: utilization,
    };
  });
}

function assetConnectedKva(asset: AssetRow) {
  const kva = toNumber(asset.kva_rating);

  if (kva > 0) {
    return kva;
  }

  const amps = toNumber(asset.amp_rating);
  const volts = toNumber(asset.voltage_secondary ?? asset.voltage_primary) || 480;

  if (amps <= 0) {
    return 0;
  }

  return (Math.sqrt(3) * volts * amps) / 1000;
}

function capacitySparkline(utilization: number, offset: number) {
  const points = [-6, -2, 3, -1, 4, -3, 0].map((delta, index) => {
    const value = clampScore(utilization + delta + (offset % 3) * 1.5);
    const x = index * 10;
    const y = 20 - (value / 100) * 18;
    return `${x},${y.toFixed(1)}`;
  });

  return points.join(" ");
}

function scoreLoadBalance(utilization: number) {
  if (utilization <= 0) {
    return 0;
  }

  return Math.round(clampScore(100 - Math.abs(utilization - 70)));
}

function scoreUtilization(utilization: number) {
  if (utilization < 50) {
    return 75;
  }

  if (utilization > 90) {
    return 50;
  }

  return Math.round(clampScore(100 - Math.abs(utilization - 70) * 0.8));
}

function scoreVoltage(meters: LatestMeterRow[]) {
  const main = meters.find((meter) => meter.isMain === 1) ?? meters[0];
  const pf = toNumber(main?.lastTotalPf);
  const normalizedPf = pf > 1 ? pf / 100 : pf;

  return Math.round(clampScore(normalizedPf * 105));
}

function scoreHarmonics(meters: LatestMeterRow[]) {
  const main = meters.find((meter) => meter.isMain === 1) ?? meters[0];
  const thd = toNumber(main?.lastTotalTHD);

  return Math.round(clampScore(100 - thd * 4));
}

function scoreThermalHeadroom(utilization: number) {
  return Math.round(clampScore(100 - utilization + 50));
}

function emptyDashboard(message: string): EnterpriseDashboardData {
  return {
    state: "error",
    dateRange: "Tracking DB",
    updatedAt: new Date().toLocaleString(),
    kpis: [],
    summary: [message],
    sites: [],
  };
}

function emptySiteDashboard(message: string): SiteDashboardData {
  return {
    alarms: [{ title: "Site Data Unavailable", detail: message, time: "Now", tone: "yellow" }],
    balanceTrend: { value: "N/A", detail: message, points: pointsFromRows([]) },
    capacityAfter: [],
    capacityBefore: [],
    deviceHealth: [],
    electricalNodes: [
      { label: "Utility", value: "N/A" },
      { label: "Transformer T1", value: "N/A" },
      { label: "Main Switchgear", value: "N/A" },
    ],
    events: [{ time: "Now", event: message }],
    impact: [],
    kpis: [],
    liveSnapshot: [],
    monitoringHealth: [],
    panels: [],
    savingsTrend: { value: "N/A", detail: message, points: pointsFromRows([]) },
    siteInfo: [{ label: "Status", value: message }],
    siteName: "Ochsner Site",
    thdTrend: { value: "N/A", detail: message, points: pointsFromRows([]), color: "#2f8cff" },
    transformerMetrics: [],
    transformerUtilization: "N/A",
    updatedAt: formatTimestamp(Date.now()),
  };
}

function emptyCapacityIntelligence(message: string): CapacityIntelligenceData {
  return {
    annualBenefit: "$0",
    assets: [],
    availableKva: 0,
    avoidedUpgrade: message,
    callouts: [{ icon: "!", label: "Capacity Data Unavailable", value: message }],
    capacityHealthScore: 0,
    co2Tons: "0 tons",
    dateRange: "Tracking DB",
    deferredCapitalValue: 0,
    hiddenKva: 0,
    installedKva: 0,
    keyInsight: message,
    kpis: [],
    loadKva: 0,
    recoveredKva: 0,
    recoveredPct: 0,
    siteName: "Ochsner Site",
    state: "error",
    subScores: [],
    trend: [],
    updatedAt: formatTimestamp(Date.now()),
    utilizationPct: 0,
  };
}

function emptyDigitalTwin(message: string): DigitalTwinData {
  return {
    activeMeters: 0,
    assets: [],
    cbiScore: 0,
    currentLoadKva: 0,
    dateRange: "Tracking DB",
    headroomKva: 0,
    projectName: "Ochsner Project",
    relationships: [],
    siteName: "Ochsner Site",
    state: "error",
    status: "unavailable",
    transformerKva: 0,
    twinId: null,
    twinLabel: "Digital Twin Unavailable",
    twinNotes: message,
    updatedAt: formatTimestamp(Date.now()),
    version: 0,
  };
}

function firstRow<T>(rows: mysql.RowDataPacket[]): T | undefined {
  return rows[0] as T | undefined;
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  });
}

function formatShortDate(timestamp: number) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });
}

function pointsFromRows(rows: mysql.RowDataPacket[], invert = false) {
  const values = rows
    .map((row) => toNumber(row.value))
    .filter((value) => value > 0)
    .reverse();

  if (values.length === 0) {
    return "0,50 28,50 56,50 84,50 112,50 140,50 168,50 196,50 224,50 252,50 280,50 308,50";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lastIndex = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = (index / lastIndex) * 308;
      const normalized = (value - min) / span;
      const y = invert ? 18 + normalized * 66 : 84 - normalized * 66;
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(" ");
}

function toNumber(value: unknown): number {
  if (value == null) {
    return 0;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function deviceHealthPercent(devices: DeviceCountRow[]) {
  const total = devices.reduce((sum, row) => sum + toNumber(row.total), 0);
  const reporting = devices.reduce((sum, row) => sum + toNumber(row.reporting), 0);

  if (total <= 0) {
    return 0;
  }

  return clampScore((reporting / total) * 100);
}

function formatCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number, digits: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
