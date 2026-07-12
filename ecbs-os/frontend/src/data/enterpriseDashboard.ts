import type {
  EnterpriseDeviceHealthData,
  HiddenCapacityRecoveredData,
  NetworkHealthData,
  NetworkLossesReductionData,
  TransformerCapacityData,
} from "@/components/ecbs/DashboardCards";

export type ScreenState = "loading" | "empty" | "error" | "data";

export type KpiCard = {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "cyan" | "yellow";
};

export type SiteSaving = {
  site: string;
  annualSavings: string;
  powerFactor: string;
  thd: string;
  lat?: number;
  lng?: number;
  location: string;
  status: "Healthy" | "Warning";
};

export type EnterpriseDashboardData = {
  deviceHealth?: EnterpriseDeviceHealthData;
  hiddenCapacity?: HiddenCapacityRecoveredData;
  state: ScreenState;
  updatedAt: string;
  dateRange: string;
  kpis: KpiCard[];
  networkHealth?: NetworkHealthData;
  networkLosses?: NetworkLossesReductionData;
  summary: string[];
  sites: SiteSaving[];
  transformerCapacity?: TransformerCapacityData;
};

export const enterpriseDashboardData: EnterpriseDashboardData = {
  state: "empty",
  updatedAt: "source_missing",
  dateRange: "Enterprise source missing",
  kpis: [
    { label: "Annual Savings", value: "No Data", detail: "source_missing", tone: "green" },
    { label: "Capacity Recovered", value: "No Data", detail: "source_missing", tone: "blue" },
    { label: "Avg Power Factor", value: "No Data", detail: "source_missing", tone: "cyan" },
    { label: "THD Reduction", value: "No Data", detail: "source_missing", tone: "green" },
    { label: "Sites Requiring Attention", value: "No Data", detail: "source_missing", tone: "yellow" },
    { label: "CO2 Reduction", value: "No Data", detail: "source_missing", tone: "blue" },
  ],
  summary: [
    "source_missing: Enterprise portfolio API is not available in cheap mode.",
    "No Data: enterprise savings rollups require a backend source contract.",
    "No Data: enterprise capacity rollups require a backend source contract.",
    "No Data: enterprise power-quality rollups require a backend source contract.",
  ],
  sites: [],
  networkHealth: {
    metrics: [
      { label: "Current Balance Index", value: "No Data" },
      { label: "Harmonic Health", value: "No Data", tone: "cyan" },
      { label: "Asset Health", value: "No Data" },
    ],
    overall: "No Data",
  },
  transformerCapacity: {
    available: "No Data",
    loaded: "No Data",
    recovered: "No Data",
    total: "No Data",
    utilization: "No Data",
  },
  hiddenCapacity: {
    equivalents: ["source_missing"],
    value: "No Data",
  },
  networkLosses: {
    after: "No Data",
    afterWidth: "0%",
    before: "No Data",
    beforeWidth: "0%",
    reduction: "No Data",
  },
  deviceHealth: {
    value: "No Data",
    items: [
      { color: "#05ff5e", label: "Healthy", value: "No Data" },
      { color: "#ffc400", label: "Warning", value: "No Data" },
      { color: "#ff3131", label: "Offline", value: "No Data" },
    ],
  },
};
