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
  state: "data",
  updatedAt: "May 18, 2025 10:15 AM",
  dateRange: "May 12 - May 18, 2025",
  kpis: [
    { label: "Annual Savings", value: "$1.84M", detail: "+12.6% vs Last Month", tone: "green" },
    { label: "Capacity Recovered", value: "4,850 kVA", detail: "+380 kVA vs Last Month", tone: "blue" },
    { label: "Avg Power Factor", value: "98.1%", detail: "+13.2% vs Baseline", tone: "cyan" },
    { label: "THD Reduction", value: "3.2%", detail: "72% vs Baseline", tone: "green" },
    { label: "Sites Requiring Attention", value: "2", detail: "View Alarms", tone: "yellow" },
    { label: "CO2 Reduction", value: "8,400", detail: "Tons / Year", tone: "blue" },
  ],
  summary: [
    "Network performance is excellent.",
    "Annual savings up 12.6%",
    "Capacity recovered up 380 kVA",
    "Power factor improved to 98.1%",
    "THD reduced to 3.2%",
    "2 sites require attention",
  ],
  sites: [
    { site: "Flex Tijuana", annualSavings: "$234,500", powerFactor: "98.7%", thd: "2.9%", location: "Tijuana, MX", status: "Healthy", lat: 32.5149, lng: -117.0382 },
    { site: "Flex Juarez North", annualSavings: "$208,300", powerFactor: "98.2%", thd: "3.1%", location: "Juarez, MX", status: "Healthy", lat: 31.6904, lng: -106.4245 },
    { site: "Flex Juarez South", annualSavings: "$187,600", powerFactor: "97.8%", thd: "3.6%", location: "Juarez, MX", status: "Healthy", lat: 31.6204, lng: -106.4145 },
    { site: "Flex Guadalajara", annualSavings: "$166,200", powerFactor: "97.9%", thd: "3.3%", location: "Guadalajara, MX", status: "Healthy", lat: 20.6597, lng: -103.3496 },
    { site: "Flex Hermosillo", annualSavings: "$149,700", powerFactor: "97.5%", thd: "3.8%", location: "Hermosillo, MX", status: "Warning", lat: 29.0729, lng: -110.9559 },
  ],
  networkHealth: {
    metrics: [
      { label: "Current Balance Index", value: "95" },
      { label: "Harmonic Health", value: "96", tone: "cyan" },
      { label: "Asset Health", value: "98" },
    ],
    overall: "97%",
  },
  transformerCapacity: {
    available: "3,400 kVA (25%)",
    loaded: "1,750 kVA (75%)",
    recovered: "4,850 kVA",
    total: "15,600 kVA",
    utilization: "75%",
  },
  hiddenCapacity: {
    equivalents: ["97 New 50 HP Motors", "18 CNC Machines", "125 Server Cabinets", "Deferred Upgrade $2.1M"],
    value: "4,850 kVA",
  },
  networkLosses: {
    after: "18.7 kW",
    afterWidth: "58%",
    before: "31.2 kW",
    beforeWidth: "86%",
    reduction: "40%",
  },
  deviceHealth: {
    value: "98%",
    items: [
      { color: "#05ff5e", label: "Healthy", value: "94 (98%)" },
      { color: "#ffc400", label: "Warning", value: "3 (3%)" },
      { color: "#ff3131", label: "Offline", value: "1 (1%)" },
    ],
  },
};
