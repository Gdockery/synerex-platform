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
  updatedAt: "",
  dateRange: "Tracking DB",
  kpis: [],
  summary: ["Enterprise dashboard data must be loaded from the tracking DB."],
  sites: [],
};
