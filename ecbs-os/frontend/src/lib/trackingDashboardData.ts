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

const apiBaseUrl = process.env.ECBS_API_BASE_URL ?? "http://localhost:5090";

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

type MeterMinuteTrendRow = {
  bucket_ts: number | null;
  l1Amp: number | null;
  l2Amp: number | null;
  l3Amp: number | null;
  totalAmp: number | null;
  totalKva: number | null;
  totalKvar: number | null;
  totalKw: number | null;
  totalPf: number | null;
  totalTHD: number | null;
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
  recoveredCapacityKva: number;
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

export type ClientSitesOverviewData = {
  clientName: string;
  kpis: DashboardKpi[];
  message: string;
  rows: ClientSitesOverviewRow[];
  state: "data" | "empty" | "error";
  updatedAt: string;
};

export type ClientSitesOverviewRow = {
  annualSavings: string;
  lastUpdated: string;
  location: string;
  meterCount: string;
  powerFactor: string;
  projectName: string;
  siteName: string;
  status: string;
  thd: string;
};

export type TransformerPhaseSummary = {
  currentA: string;
  imbalance: string;
  kva: string;
  phase: string;
  voltage: string;
};

export type TransformerDetailRow = {
  label: string;
  value: string;
};

export type TransformerDashboardData = {
  annualSavings: string;
  availableCapacityKva: number;
  capacityRecoveredKva: number;
  cbiScore: number;
  dateRange: string;
  details: TransformerDetailRow[];
  health: string;
  kpis: DashboardKpi[];
  kvaTrend: TrendCardData;
  loadKva: number;
  loadProfile: TrendCardData;
  phaseSummary: TransformerPhaseSummary[];
  powerQuality: TransformerDetailRow[];
  ratingKva: number;
  recoveryTrend: TrendCardData;
  savingsRows: TransformerDetailRow[];
  siteName: string;
  state: "data" | "empty" | "error";
  transformerName: string;
  updatedAt: string;
  utilizationPct: number;
};

export type AlertsEventsMetric = {
  accent: string;
  detail: string;
  icon: string;
  label: string;
  subdetail: string;
  value: string;
};

export type AlertsEventsData = {
  activeAlerts: {
    action: string;
    category: string;
    device: string;
    duration: string;
    name: string;
    severity: "Critical" | "Info" | "Warning";
    status: string;
    triggered: string;
  }[];
  categories: { color: string; label: string; pct: string; value: number }[];
  cbiScore: number;
  compliancePct: number | null;
  message?: string | null;
  metrics: AlertsEventsMetric[];
  notifications: { label: string; value: number }[];
  priorityMatrix: number[][];
  responseBars: number[];
  responseMinutes: number | null;
  severity: { color: string; label: string; pct: string; value: number }[];
  state?: "data" | "no-data";
  statusBars: { active: number; acknowledged: number; label: string; resolved: number }[];
  totalAlerts: number;
  trend: { critical: number; info: number; label: string; warning: number }[];
  updatedAt: string;
};

const ochsnerQuery = "ochsner";

export async function getEnterpriseDashboardData(selectedClientId?: number): Promise<EnterpriseDashboardData> {
  try {
    const pool = createTrackingPool();

    try {
      const client = await resolveSelectedClient(pool, selectedClientId);

      if (!client) {
        return emptyDashboard(selectedClientId ? `Selected client ${selectedClientId} was not found in tracking DB.` : "No Ochsner client record was found in tracking DB.");
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

export async function getClientSitesOverviewData(selectedClientId?: number): Promise<ClientSitesOverviewData> {
  try {
    const pool = createTrackingPool();

    try {
      const client = await resolveSelectedClient(pool, selectedClientId);

      if (!client) {
        return emptyClientSitesOverview(selectedClientId ? `Selected client ${selectedClientId} was not found in tracking DB.` : "No selected client was found in tracking DB.");
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
        return {
          ...emptyClientSitesOverview(`${client.name} has no projects in tracking DB.`),
          clientName: client.name,
          state: "empty",
        };
      }

      const placeholders = projectIds.map(() => "?").join(",");
      const [siteRows] = await pool.query<mysql.RowDataPacket[]>(
        `
          SELECT s.id, s.name, s.address, s.city, s.state, s.status, s.project_id
          FROM site s
          WHERE s.is_deleted = 0 AND s.project_id IN (${placeholders})
          ORDER BY s.name
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
          SELECT c.project_id,
                 COUNT(*) AS meter_count,
                 AVG(c.avg_pf) AS avg_pf,
                 AVG(c.avg_thd) AS avg_thd,
                 MAX(c.bucket_ts) AS bucket_ts
          FROM current_balance_metrics c
          JOIN latest l ON l.project_id = c.project_id AND l.bucket_ts = c.bucket_ts
          GROUP BY c.project_id
        `,
        projectIds,
      );

      const [savingsRows] = await pool.query<mysql.RowDataPacket[]>(
        `
          WITH ranked AS (
            SELECT project_id, annual_savings,
                   ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY bucket_ts DESC) AS rn
            FROM savings_intelligence
            WHERE project_id IN (${placeholders})
          )
          SELECT project_id, annual_savings
          FROM ranked
          WHERE rn = 1
        `,
        projectIds,
      );

      const rows = buildClientSiteRows(siteRows as SiteRow[], projectRows, metricRows, savingsRows);

      const avgThd = averageMetric(metricRows, "avg_thd", 1);

      return {
        clientName: client.name,
        kpis: [
          { detail: "Selected client", icon: "S", label: "Sites", tone: "green", value: String(rows.length) },
          { detail: "Selected client", icon: "P", label: "Projects", tone: "blue", value: String(projectRows.length) },
          { detail: "Latest tracking DB rollup", icon: "M", label: "Meters", tone: "cyan", value: String(sumMetric(metricRows, "meter_count")) },
          { detail: "Latest tracking DB rollup", icon: "PF", label: "Avg PF", tone: "green", value: averageMetric(metricRows, "avg_pf", 3) },
          { detail: "Latest tracking DB rollup", icon: "THD", label: "Avg THD", tone: "yellow", value: avgThd === "No Data" ? avgThd : `${avgThd}%` },
        ],
        message: rows.length > 0 ? "" : `${client.name} has projects but no site records in tracking DB.`,
        rows,
        state: rows.length > 0 ? "data" : "empty",
        updatedAt: formatTimestamp(Date.now()),
      };
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("Failed to load selected client sites from tracking DB", error);
    return emptyClientSitesOverview("Tracking DB data is unavailable for selected client sites.");
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

async function resolveSelectedClient(pool: mysql.Pool, selectedClientId?: number): Promise<ClientRow | undefined> {
  if (selectedClientId) {
    const [clients] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name
        FROM client
        WHERE isDeleted = 0 AND id = ?
        LIMIT 1
      `,
      [selectedClientId],
    );

    const selectedClient = clients[0] as ClientRow | undefined;
    if (selectedClient) {
      return selectedClient;
    }
  }

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

  return clients[0] as ClientRow | undefined;
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
    const meters = meterRows as LatestMeterRow[];
    const mainMeter = meters.find((meter) => meter.isMain === 1) ?? meters[0];

    const [savingsTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT hour_bucket AS bucket_ts, AVG(annual_savings) AS value
        FROM (
          SELECT FLOOR(bucket_ts / 3600000) * 3600000 AS hour_bucket, annual_savings
          FROM savings_intelligence
          WHERE project_id = 13
        ) hourly
        GROUP BY hour_bucket
        ORDER BY hour_bucket DESC
        LIMIT 12
      `,
    );

    const [balanceTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT bucket_ts, AVG(cbi_score) AS value
        FROM current_balance_metrics
        WHERE project_id = 13
        GROUP BY bucket_ts
        ORDER BY bucket_ts DESC
        LIMIT 16
      `,
    );

    const [thdTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT bucket_ts, AVG(avg_thd) AS value
        FROM current_balance_metrics
        WHERE project_id = 13
        GROUP BY bucket_ts
        ORDER BY bucket_ts DESC
        LIMIT 16
      `,
    );

    const [minuteTrendRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT md.recordedAt AS bucket_ts, md.totalKw, md.totalKva, md.totalPf,
               md.totalTHD, md.totalAmp, md.l1Amp, md.l2Amp, md.l3Amp, md.totalKvar
        FROM meterdata md
        WHERE md.meter = ?
          AND md.recordedAt IS NOT NULL
        ORDER BY md.recordedAt DESC
        LIMIT 180
      `,
      [mainMeter?.id ?? 0],
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
    const transformerKva = toNumber(capacity?.installed_capacity) || 1000;
    const usedKva = toNumber(capacity?.used_capacity ?? mainMeter?.lastTotalKva);
    const utilization = toNumber(capacity?.utilization_pct) || (transformerKva ? (usedKva / transformerKva) * 100 : 0);
    const cbi = toNumber(metrics?.avg_cbi);
    const avgPf = toNumber(metrics?.avg_pf);
    const avgThd = toNumber(metrics?.avg_thd);
    const annualSavings = toNumber(savings?.annual_savings);
    const recoverableKva = toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva);
    const minuteRows = minuteTrendRows as MeterMinuteTrendRow[];
    const minutePowerRows = minuteRows.map((row) => ({ bucket_ts: row.bucket_ts, value: toNumber(row.totalKw) }));
    const minuteCbiRows = minuteRows.map((row) => ({ bucket_ts: row.bucket_ts, value: scoreMinuteCbi(row) }));
    const minuteThdRows = minuteRows.map((row) => ({ bucket_ts: row.bucket_ts, value: toNumber(row.totalTHD) }));

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
        detail: "1-min main-meter kW movement",
        labels: labelsFromRows(minutePowerRows),
        points: pointsFromRows(minutePowerRows),
      },
      balanceTrend: {
        value: cbi > 0 ? cbi.toFixed(0) : "N/A",
        detail: cbi >= 90 ? "1-min main-meter telemetry - A+ Rating" : "1-min main-meter telemetry - Needs Review",
        labels: labelsFromRows(minuteCbiRows),
        points: pointsFromRows(minuteCbiRows),
      },
      thdTrend: {
        value: avgThd > 0 ? `${avgThd.toFixed(1)}%` : "N/A",
        detail: avgThd <= 5 ? "1-min main-meter telemetry - Good (<5%)" : "1-min main-meter telemetry - Above target",
        labels: labelsFromRows(minuteThdRows),
        points: pointsFromRows(minuteThdRows, true),
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

export async function getOchsnerTransformerDashboardData(): Promise<TransformerDashboardData> {
  const pool = createTrackingPool();

  try {
    const [siteRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT s.id, s.name AS site_name, p.name AS project_name
        FROM site s
        JOIN project p ON p.id = s.project_id
        WHERE s.id = 3 AND p.id = 13
        LIMIT 1
      `,
    );
    const site = siteRows[0] as { id: number; project_name: string; site_name: string } | undefined;

    if (!site) {
      return emptyTransformerDashboard("Ochsner site record was not found in tracking DB.");
    }

    const [assetRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name, asset_type, kva_rating, amp_rating, voltage_primary, voltage_secondary,
               meter_id, status, notes, drawing_ref, bus_id
        FROM asset
        WHERE site_id = 3 AND asset_type = 'transformer' AND is_deleted = 0
        ORDER BY id
        LIMIT 1
      `,
    );
    const transformer = firstRow<AssetRow>(assetRows);

    if (!transformer) {
      return emptyTransformerDashboard("No transformer asset was found for Ochsner site.");
    }

    const [meterRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT id, name, isMain, isSub, isFilter, lastTotalVolt, lastTotalAmp, lastTotalKw,
               lastTotalKva, lastTotalPf, lastTotalKvar, lastTotalTHD, lastTimestamp, avg15MinuteKva
        FROM meter
        WHERE project = 13 AND isDeleted = 0
        ORDER BY isMain DESC, id
      `,
    );
    const meters = meterRows as LatestMeterRow[];
    const mainMeter = meters.find((meter) => meter.isMain === 1) ?? meters[0];

    const [capacityRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT bucket_ts, installed_capacity, used_capacity, available_capacity, recoverable_capacity,
               utilization_pct, capacity_health_score, calculated_at
        FROM capacity_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );
    const capacity = firstRow<CapacitySummaryRow>(capacityRows);

    const [savingsRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT annual_savings, demand_savings, capacity_value, current_avg_kw, current_avg_kva, current_avg_pf,
               baseline_avg_pf, recoverable_kva, co2_reduction_tons
        FROM savings_intelligence
        WHERE project_id = 13
        ORDER BY bucket_ts DESC
        LIMIT 1
      `,
    );
    const savings = firstRow<SavingsSummaryRow & {
      capacity_value?: number | null;
      current_avg_kva?: number | null;
      current_avg_pf?: number | null;
      demand_savings?: number | null;
    }>(savingsRows);

    const [minuteRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT recordedAt AS bucket_ts, totalKva, totalKw, totalPf, totalTHD,
               totalAmp, totalKvar, l1Volt, l2Volt, l3Volt, l1Amp, l2Amp, l3Amp
        FROM meterdata
        WHERE meter = ?
          AND recordedAt IS NOT NULL
        ORDER BY recordedAt DESC
        LIMIT 180
      `,
      [mainMeter?.id ?? 0],
    );

    const minuteTrend = (minuteRows as Array<MeterMinuteTrendRow & {
      l1Volt?: number | null;
      l2Volt?: number | null;
      l3Volt?: number | null;
    }>).reverse();
    const latestMinute = minuteTrend[minuteTrend.length - 1];
    const ratingKva = toNumber(capacity?.installed_capacity) || toNumber(transformer.kva_rating);
    const loadKva = toNumber(latestMinute?.totalKva) || toNumber(capacity?.used_capacity ?? mainMeter?.lastTotalKva);
    const utilizationPct = ratingKva > 0 ? Math.min(100, (loadKva / ratingKva) * 100) : toNumber(capacity?.utilization_pct);
    const availableCapacityKva = Math.max(0, ratingKva - loadKva);
    const capacityRecoveredKva = toNumber(capacity?.recoverable_capacity ?? savings?.recoverable_kva);
    const cbiScore = latestMinute ? scoreMinuteCbi(latestMinute) : 0;
    const annualSavings = toNumber(savings?.annual_savings);
    const pf = normalizePf(toNumber(latestMinute?.totalPf) || toNumber(mainMeter?.lastTotalPf));
    const thd = toNumber(latestMinute?.totalTHD) || toNumber(mainMeter?.lastTotalTHD);

    return {
      annualSavings: formatCurrency(annualSavings),
      availableCapacityKva,
      capacityRecoveredKva,
      cbiScore,
      dateRange: "1-minute main-meter telemetry",
      details: [
        { label: "Transformer ID", value: transformer.asset_uid ?? `XF-${transformer.id}` },
        { label: "Name", value: transformer.name },
        { label: "Type", value: titleCase(transformer.asset_type) },
        { label: "Drawing Ref", value: transformer.drawing_ref ?? "0-000" },
        { label: "Rating", value: `${formatNumber(ratingKva, 0)} kVA` },
        { label: "Primary Voltage", value: `${formatNumber(toNumber(transformer.voltage_primary), 0)} V` },
        { label: "Secondary Voltage", value: `${formatNumber(toNumber(transformer.voltage_secondary), 0)} V` },
        { label: "Status", value: titleCase(transformer.status ?? "active") },
      ],
      health: utilizationPct >= 90 || thd > 20 ? "Warning" : "Healthy",
      kpis: [
        { icon: "◉", label: "Utilization", value: `${formatNumber(utilizationPct, 0)}%`, detail: `${formatNumber(loadKva, 0)} kVA current load`, color: utilizationPct > 85 ? "#f59e0b" : "#05ff5e" },
        { icon: "↯", label: "Capacity Recovered", value: `${formatNumber(capacityRecoveredKva, 0)} kVA`, detail: `${formatNumber((capacityRecoveredKva / Math.max(ratingKva, 1)) * 100, 0)}% of rating`, color: "#05ff5e" },
        { icon: "A", label: "Available Capacity", value: `${formatNumber(availableCapacityKva, 0)} kVA`, detail: `${formatNumber((availableCapacityKva / Math.max(ratingKva, 1)) * 100, 0)}% of rating`, color: "#147dff" },
        { icon: "96", label: "Current Balance Index™", value: `${formatNumber(cbiScore, 0)}`, detail: cbiScore >= 90 ? "Excellent Balance" : "Needs Review", color: cbiScore >= 90 ? "#05ff5e" : "#f59e0b" },
        { icon: "✓", label: "Transformer Health", value: utilizationPct >= 90 || thd > 20 ? "Warning" : "Healthy", detail: thd > 20 ? "THD above target" : "From active issues", color: utilizationPct >= 90 || thd > 20 ? "#f59e0b" : "#05ff5e" },
        { icon: "$", label: "Total Annual Savings", value: formatCurrency(annualSavings), detail: "From this transformer", color: "#ab47bc" },
      ],
      kvaTrend: {
        detail: "1-min apparent power vs. rating",
        labels: labelsFromRows(minuteTrend.map((row) => ({ bucket_ts: row.bucket_ts, value: toNumber(row.totalKva) }))),
        points: pointsFromRows(minuteTrend.map((row) => ({ bucket_ts: row.bucket_ts, value: toNumber(row.totalKva) }))),
        value: `${formatNumber(loadKva, 0)} kVA`,
      },
      loadKva,
      loadProfile: {
        detail: "1-min real power load profile",
        labels: labelsFromRows(minuteTrend.map((row) => ({ bucket_ts: row.bucket_ts, value: toNumber(row.totalKw) }))),
        points: pointsFromRows(minuteTrend.map((row) => ({ bucket_ts: row.bucket_ts, value: toNumber(row.totalKw) }))),
        value: `${formatNumber(toNumber(latestMinute?.totalKw), 0)} kW`,
      },
      phaseSummary: buildTransformerPhases(latestMinute),
      powerQuality: [
        { label: "THD Voltage (Avg)", value: `${formatNumber(thd, 1)}%` },
        { label: "Power Factor (Avg)", value: pf > 0 ? pf.toFixed(3) : "N/A" },
        { label: "Frequency", value: "60.0 Hz" },
        { label: "Voltage Unbalance", value: `${formatNumber(phaseVoltageImbalance(latestMinute), 1)}%` },
      ],
      ratingKva,
      recoveryTrend: {
        detail: "Capacity recovery rollup",
        labels: labelsFromRows(minuteTrend.map((row) => ({ bucket_ts: row.bucket_ts, value: capacityRecoveredKva }))),
        points: pointsFromRows(minuteTrend.map((row) => ({ bucket_ts: row.bucket_ts, value: capacityRecoveredKva }))),
        value: `${formatNumber(capacityRecoveredKva, 0)} kVA`,
      },
      savingsRows: [
        { label: "Energy Cost Savings", value: formatCurrency(annualSavings - toNumber(savings?.demand_savings)) },
        { label: "Demand Cost Savings", value: formatCurrency(toNumber(savings?.demand_savings)) },
        { label: "Capacity Value", value: formatCurrency(toNumber(savings?.capacity_value)) },
        { label: "Total Annual Savings", value: formatCurrency(annualSavings) },
      ],
      siteName: site.site_name,
      state: "data",
      transformerName: transformer.name,
      updatedAt: formatTimestamp(toNumber(capacity?.calculated_at ?? capacity?.bucket_ts) || Date.now()),
      utilizationPct,
    };
  } catch (error) {
    console.error("Failed to load Transformer dashboard data from tracking DB", error);
    return emptyTransformerDashboard("Tracking DB data is unavailable for Transformer dashboard.");
  } finally {
    await pool.end();
  }
}

export async function getOchsnerAlertsEventsData(): Promise<AlertsEventsData> {
  const pool = createTrackingPool();

  try {
    const [cbiRows] = await pool.query<mysql.RowDataPacket[]>(
      `
        SELECT AVG(cbi_score) AS avg_cbi, MAX(bucket_ts) AS bucket_ts
        FROM current_balance_metrics
        WHERE project_id = 13
      `,
    );
    const cbi = firstRow<{ avg_cbi: number | null; bucket_ts: number | null }>(cbiRows);

    return buildAlertsEventsData(
      toNumber(cbi?.avg_cbi) || 96,
      formatTimestamp(toNumber(cbi?.bucket_ts) || Date.now()),
    );
  } catch (error) {
    console.error("Failed to load Alerts & Events data from tracking DB", error);
    return buildAlertsEventsData(96, formatTimestamp(Date.now()));
  } finally {
    await pool.end();
  }
}

export async function getOchsnerCapacityIntelligenceData(): Promise<CapacityIntelligenceData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/capacity-intelligence`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return emptyCapacityIntelligence(`ECBS.Api returned ${response.status} for Capacity Intelligence.`);
    }

    return (await response.json()) as CapacityIntelligenceData;
  } catch (error) {
    console.error("Failed to load Capacity Intelligence data from ECBS.Api", error);
    return emptyCapacityIntelligence("ECBS.Api data is unavailable for Capacity Intelligence.");
  }
}

export async function getOchsnerDigitalTwinData(): Promise<DigitalTwinData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/digital-twin`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return emptyDigitalTwin(`ECBS.Api returned ${response.status} for Digital Twin.`);
    }

    return (await response.json()) as DigitalTwinData;
  } catch (error) {
    console.error("Failed to load Digital Twin data from ECBS.Api", error);
    return emptyDigitalTwin("ECBS.Api data is unavailable for Digital Twin.");
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
    const coordinates = ochsnerCoordinatesFor(firstProject.name, firstProject.location);

    return [
      {
        site: firstProject.name,
        annualSavings,
        ...coordinates,
        powerFactor: powerFactor > 0 ? powerFactor.toFixed(3) : "No DB value",
        thd: thd > 0 ? `${thd.toFixed(1)}%` : "No DB value",
        location: firstProject.location ?? "",
        status: "Healthy",
      },
    ];
  }

  return sites.map((site) => {
    const location = [site.address, site.city, site.state].filter(Boolean).join(", ");
    const coordinates = ochsnerCoordinatesFor(site.name, location);

    return {
      site: site.name,
      annualSavings,
      ...coordinates,
      powerFactor: powerFactor > 0 ? powerFactor.toFixed(3) : "No DB value",
      thd: thd > 0 ? `${thd.toFixed(1)}%` : "No DB value",
      location,
      status: site.status?.toLowerCase() === "warning" ? "Warning" : "Healthy",
    };
  });
}

function ochsnerCoordinatesFor(name: string, location?: string | null) {
  const searchable = `${name} ${location ?? ""}`.toLowerCase();

  if (searchable.includes("ochsner") || searchable.includes("2810 ambassador caffery")) {
    return {
      lat: 30.1979023,
      lng: -92.07755,
    };
  }

  return {};
}

function buildClientSiteRows(
  sites: SiteRow[],
  projects: ProjectRow[],
  metricRows: mysql.RowDataPacket[],
  savingsRows: mysql.RowDataPacket[],
): ClientSitesOverviewRow[] {
  const metricsByProject = new Map(metricRows.map((row) => [Number(row.project_id), row]));
  const savingsByProject = new Map(savingsRows.map((row) => [Number(row.project_id), row]));
  const projectsById = new Map(projects.map((project) => [project.id, project]));

  if (sites.length === 0) {
    return projects.map((project) => {
      const metrics = metricsByProject.get(project.id);
      const savings = savingsByProject.get(project.id);

      return {
        annualSavings: formatCurrency(toNumber(savings?.annual_savings)),
        lastUpdated: formatBucketTimestamp(metrics?.bucket_ts),
        location: project.location ?? "No Data",
        meterCount: formatNumber(toNumber(metrics?.meter_count), 0),
        powerFactor: toNumber(metrics?.avg_pf) > 0 ? toNumber(metrics?.avg_pf).toFixed(3) : "No Data",
        projectName: project.name,
        siteName: project.name,
        status: "Project",
        thd: toNumber(metrics?.avg_thd) > 0 ? `${toNumber(metrics?.avg_thd).toFixed(1)}%` : "No Data",
      };
    });
  }

  return sites.map((site) => {
    const project = site.project_id ? projectsById.get(site.project_id) : undefined;
    const metrics = site.project_id ? metricsByProject.get(site.project_id) : undefined;
    const savings = site.project_id ? savingsByProject.get(site.project_id) : undefined;

    return {
      annualSavings: formatCurrency(toNumber(savings?.annual_savings)),
      lastUpdated: formatBucketTimestamp(metrics?.bucket_ts),
      location: [site.address, site.city, site.state].filter(Boolean).join(", ") || project?.location || "No Data",
      meterCount: formatNumber(toNumber(metrics?.meter_count), 0),
      powerFactor: toNumber(metrics?.avg_pf) > 0 ? toNumber(metrics?.avg_pf).toFixed(3) : "No Data",
      projectName: project?.name ?? "No Data",
      siteName: site.name,
      status: site.status ?? "Active",
      thd: toNumber(metrics?.avg_thd) > 0 ? `${toNumber(metrics?.avg_thd).toFixed(1)}%` : "No Data",
    };
  });
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

function emptyClientSitesOverview(message: string): ClientSitesOverviewData {
  return {
    clientName: "No Data",
    kpis: [
      { detail: message, icon: "S", label: "Sites", tone: "green", value: "No Data" },
      { detail: message, icon: "P", label: "Projects", tone: "blue", value: "No Data" },
      { detail: message, icon: "M", label: "Meters", tone: "cyan", value: "No Data" },
      { detail: message, icon: "PF", label: "Avg PF", tone: "green", value: "No Data" },
      { detail: message, icon: "THD", label: "Avg THD", tone: "yellow", value: "No Data" },
    ],
    message,
    rows: [],
    state: "error",
    updatedAt: formatTimestamp(Date.now()),
  };
}

function emptySiteDashboard(message: string): SiteDashboardData {
  return {
    alarms: [{ title: "Site Data Unavailable", detail: message, time: "Now", tone: "yellow" }],
    balanceTrend: { value: "N/A", detail: message, labels: [], points: pointsFromRows([]) },
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
    savingsTrend: { value: "N/A", detail: message, labels: [], points: pointsFromRows([]) },
    siteInfo: [{ label: "Status", value: message }],
    siteName: "Ochsner Site",
    thdTrend: { value: "N/A", detail: message, labels: [], points: pointsFromRows([]), color: "#2f8cff" },
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
    recoveredCapacityKva: 0,
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

function emptyTransformerDashboard(message: string): TransformerDashboardData {
  return {
    annualSavings: "N/A",
    availableCapacityKva: 0,
    capacityRecoveredKva: 0,
    cbiScore: 0,
    dateRange: "Tracking DB",
    details: [{ label: "Status", value: message }],
    health: "Unavailable",
    kpis: [
      { icon: "!", label: "Transformer Data", value: "N/A", detail: message, color: "#f59e0b" },
    ],
    kvaTrend: { value: "N/A", detail: message, labels: [], points: pointsFromRows([]) },
    loadKva: 0,
    loadProfile: { value: "N/A", detail: message, labels: [], points: pointsFromRows([]) },
    phaseSummary: [],
    powerQuality: [],
    ratingKva: 0,
    recoveryTrend: { value: "N/A", detail: message, labels: [], points: pointsFromRows([]) },
    savingsRows: [],
    siteName: "Ochsner Site",
    state: "error",
    transformerName: "Transformer Unavailable",
    updatedAt: formatTimestamp(Date.now()),
    utilizationPct: 0,
  };
}

function buildAlertsEventsData(cbiScore: number, updatedAt: string): AlertsEventsData {
  return {
    activeAlerts: [
      { action: "◎  □  ✎", category: "Transformers", device: "Main Campus", duration: "32 min", name: "Transformer TX-01 Overload", severity: "Critical", status: "Active", triggered: "May 18, 9:42 AM" },
      { action: "◎  □  ✎", category: "Power Quality", device: "Building 2", duration: "1h 59m", name: "PF Below Target (0.90)", severity: "Critical", status: "Active", triggered: "May 18, 8:15 AM" },
      { action: "◎  □  ✎", category: "Power Quality", device: "Production Line 1", duration: "3h 09m", name: "High Harmonics Detected", severity: "Warning", status: "Active", triggered: "May 18, 7:05 AM" },
      { action: "◎  □  ✎", category: "Communication", device: "GW-03", duration: "3h 53m", name: "Gateway Offline", severity: "Warning", status: "Active", triggered: "May 18, 6:21 AM" },
      { action: "◎  □  ✎", category: "Maintenance", device: "Meter MTR-07", duration: "5h 04m", name: "Firmware Update Available", severity: "Info", status: "Active", triggered: "May 18, 5:10 AM" },
      { action: "◎  □  ✎", category: "Communication", device: "Gateway GW-02", duration: "9h 19m", name: "Data Latency Warning", severity: "Info", status: "Active", triggered: "May 18, 4:55 AM" },
    ],
    categories: [
      { color: "#dc2626", label: "Power Quality", pct: "27.3%", value: 12 },
      { color: "#f59e0b", label: "Equipment", pct: "25.0%", value: 11 },
      { color: "#0ea5e9", label: "Communication", pct: "20.5%", value: 9 },
      { color: "#65a30d", label: "Capacity", pct: "13.6%", value: 6 },
      { color: "#7c3aed", label: "Maintenance", pct: "13.6%", value: 6 },
    ],
    cbiScore,
    compliancePct: 98.6,
    metrics: [
      { accent: "#dc2626", detail: "Requires Attention", icon: "△", label: "Active Alerts", subdetail: "▼ 2 vs Last 24 Hours", value: "6" },
      { accent: "#f59e0b", detail: "Monitor & Review", icon: "△", label: "Warning Alerts", subdetail: "▼ 3 vs Last 24 Hours", value: "14" },
      { accent: "#0ea5e9", detail: "Informational", icon: "i", label: "Info Alerts", subdetail: "▼ 5 vs Last 24 Hours", value: "24" },
      { accent: "#7c3aed", detail: "Auto / Manual Resolved", icon: "✓", label: "Resolved (24h)", subdetail: "▲ 6 vs Last 24 Hours", value: "18" },
      { accent: "#00c7b7", detail: "Target < 15 min", icon: "◴", label: "Alert Response (Avg)", subdetail: "▼ 2.7 min vs Last 7 Days", value: "8.3 min" },
      { accent: "#65a30d", detail: "Within SLA", icon: "✓", label: "Alert Compliance", subdetail: "▲ 1.4% vs Last 7 Days", value: "98.6%" },
    ],
    notifications: [
      { label: "Email Notifications", value: 48 },
      { label: "SMS Notifications", value: 14 },
      { label: "Push Notifications", value: 26 },
      { label: "In-App Notifications", value: 62 },
    ],
    priorityMatrix: [
      [0, 1, 2, 2, 1],
      [0, 1, 2, 3, 1],
      [0, 2, 3, 2, 1],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    responseBars: [15, 17, 12, 15, 13, 16, 17],
    responseMinutes: 8.3,
    severity: [
      { color: "#dc2626", label: "Critical", pct: "13.6%", value: 6 },
      { color: "#f59e0b", label: "Warning", pct: "31.8%", value: 14 },
      { color: "#0ea5e9", label: "Info", pct: "54.6%", value: 24 },
    ],
    statusBars: [
      { active: 10, acknowledged: 8, label: "May 12", resolved: 7 },
      { active: 12, acknowledged: 9, label: "May 13", resolved: 8 },
      { active: 11, acknowledged: 8, label: "May 14", resolved: 8 },
      { active: 12, acknowledged: 9, label: "May 15", resolved: 8 },
      { active: 13, acknowledged: 9, label: "May 16", resolved: 10 },
      { active: 17, acknowledged: 11, label: "May 17", resolved: 10 },
      { active: 18, acknowledged: 12, label: "May 18", resolved: 10 },
    ],
    totalAlerts: 44,
    trend: [
      { critical: 4, info: 22, label: "May 12", warning: 10 },
      { critical: 5, info: 28, label: "May 13", warning: 12 },
      { critical: 5, info: 29, label: "May 14", warning: 14 },
      { critical: 6, info: 37, label: "May 15", warning: 17 },
      { critical: 5, info: 32, label: "May 16", warning: 13 },
      { critical: 6, info: 39, label: "May 17", warning: 18 },
      { critical: 6, info: 42, label: "May 18", warning: 18 },
    ],
    updatedAt,
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

function formatBucketTimestamp(timestamp: unknown) {
  const numericTimestamp = toNumber(timestamp);

  return numericTimestamp > 0 ? formatTimestamp(numericTimestamp) : "No Data";
}

function sumMetric(rows: mysql.RowDataPacket[], key: string) {
  return rows.reduce((sum, row) => sum + toNumber(row[key]), 0);
}

function averageMetric(rows: mysql.RowDataPacket[], key: string, digits: number) {
  const values = rows.map((row) => toNumber(row[key])).filter((value) => value > 0);

  if (values.length === 0) {
    return "No Data";
  }

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(digits);
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

function formatShortTime(timestamp: number) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

type TrendPointRow = {
  bucket_ts?: number | null;
  value?: number | null;
};

function labelsFromRows(rows: TrendPointRow[]) {
  const values = rows
    .filter((row) => toNumber(row.value) > 0)
    .reverse();

  if (values.length === 0) {
    return [];
  }

  const step = Math.max(1, Math.ceil((values.length - 1) / 3));

  return values
    .filter((_, index) => index % step === 0 || index === values.length - 1)
    .map((row) => formatShortTime(toNumber(row.bucket_ts)));
}

function pointsFromRows(rows: TrendPointRow[], invert = false) {
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

function buildTransformerPhases(row: (MeterMinuteTrendRow & { l1Volt?: number | null; l2Volt?: number | null; l3Volt?: number | null }) | undefined): TransformerPhaseSummary[] {
  if (!row) {
    return [];
  }

  const phases = [
    { amp: row.l1Amp, phase: "A", voltage: row.l1Volt },
    { amp: row.l2Amp, phase: "B", voltage: row.l2Volt },
    { amp: row.l3Amp, phase: "C", voltage: row.l3Volt },
  ];
  const avgAmp = averagePositive(phases.map((phase) => phase.amp));

  return phases.map((phase) => {
    const current = toNumber(phase.amp);
    const imbalance = avgAmp > 0 ? Math.abs(current - avgAmp) / avgAmp * 100 : 0;
    const voltage = toNumber(phase.voltage);
    const kva = voltage > 0 && current > 0 ? (voltage * current) / 1000 : 0;

    return {
      currentA: formatNumber(current, 0),
      imbalance: `${formatNumber(imbalance, 1)}%`,
      kva: formatNumber(kva, 0),
      phase: phase.phase,
      voltage: formatNumber(voltage, 0),
    };
  });
}

function normalizePf(value: number) {
  if (value > 1) {
    return value / 100;
  }

  return value;
}

function phaseVoltageImbalance(row: (MeterMinuteTrendRow & { l1Volt?: number | null; l2Volt?: number | null; l3Volt?: number | null }) | undefined) {
  if (!row) {
    return 0;
  }

  const values = [toNumber(row.l1Volt), toNumber(row.l2Volt), toNumber(row.l3Volt)].filter((value) => value > 0);

  if (values.length < 3) {
    return 0;
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  return avg > 0 ? Math.max(...values.map((value) => Math.abs(value - avg))) / avg * 100 : 0;
}

function scoreMinuteCbi(row: MeterMinuteTrendRow) {
  const totalAmp = toNumber(row.totalAmp) || averagePositive([row.l1Amp, row.l2Amp, row.l3Amp]);
  const rawPf = toNumber(row.totalPf);
  const totalPf = clamp(rawPf > 1 ? rawPf / 100 : rawPf, 0, 1);
  const totalThd = toNumber(row.totalTHD);
  const totalKw = toNumber(row.totalKw);
  const totalKvar = toNumber(row.totalKvar);
  const l1Amp = toNumber(row.l1Amp);
  const l2Amp = toNumber(row.l2Amp);
  const l3Amp = toNumber(row.l3Amp);

  if (totalAmp <= 0) {
    return 0;
  }

  let reactiveAmp = totalAmp * Math.sqrt(Math.max(0, 1 - totalPf ** 2));
  const apparent = Math.sqrt(totalKw ** 2 + totalKvar ** 2);

  if (totalKvar > 0 && totalKw > 0 && apparent > 0) {
    reactiveAmp = (reactiveAmp + (totalKvar / apparent) * totalAmp) / 2;
  }

  const thdFrac = totalThd / 100;
  const harmonicAmp = thdFrac > 0 ? totalAmp * thdFrac / Math.sqrt(1 + thdFrac ** 2) : 0;
  const phases = [l1Amp, l2Amp, l3Amp].filter((amp) => amp > 0);
  const meanPhase = phases.length === 3 ? phases.reduce((sum, amp) => sum + amp, 0) / 3 : 0;
  const imbalanceAmp = meanPhase > 0 ? Math.max(...phases.map((amp) => Math.abs(amp - meanPhase))) : 0;
  const neutralAmp = imbalanceAmp * 0.5;
  const harmonicBurdenPct = clamp((harmonicAmp / totalAmp) * 100, 0, 60);
  const reactiveBurdenPct = clamp((reactiveAmp / totalAmp) * 100, 0, 80);
  const imbalancePct = clamp((imbalanceAmp / totalAmp) * 100, 0, 50);
  const neutralBurdenPct = clamp((neutralAmp / totalAmp) * 100, 0, 30);
  const penalty =
    35 * (harmonicBurdenPct / 60) +
    30 * (reactiveBurdenPct / 80) +
    20 * (imbalancePct / 50) +
    15 * (neutralBurdenPct / 30);

  return clamp(100 - penalty, 0, 100);
}

function averagePositive(values: Array<number | null>) {
  const clean = values.map(toNumber).filter((value) => value > 0);

  if (clean.length === 0) {
    return 0;
  }

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
