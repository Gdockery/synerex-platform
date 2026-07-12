import { TransformerDashboardScreen } from "@/components/ecbs/TransformerDashboardScreen";
import type { TransformerDashboardData } from "@/lib/trackingDashboardData";

const transformerDashboardData: TransformerDashboardData = {
  annualSavings: "No Data",
  availableCapacityKva: 0,
  capacityRecoveredKva: 0,
  cbiScore: 0,
  dateRange: "source_missing",
  details: [
    { label: "Transformer ID", value: "XF-001" },
    { label: "Type", value: "Pad Mounted" },
    { label: "Manufacturer", value: "Schneider Electric" },
    { label: "Model", value: "PM1500" },
    { label: "Rating", value: "No Data" },
    { label: "Primary Voltage", value: "No Data" },
    { label: "Secondary Voltage", value: "No Data" },
    { label: "Impedance", value: "No Data" },
    { label: "Serial Number", value: "SE-556789" },
    { label: "Install Date", value: "Jan 15, 2022" },
    { label: "Warranty Expiration", value: "Jan 15, 2032" },
  ],
  health: "No Data",
  kpis: [],
  kvaTrend: {
    detail: "Last 7 days",
    points: "0,50 18,38 36,46 54,34 72,55 90,44 108,58 126,45 144,52 162,40 180,54 198,46 216,50 234,42 252,54 270,38 288,48 306,36 324,52 342,44 360,48",
    value: "No Data",
  },
  loadKva: 0,
  loadProfile: {
    detail: "Today",
    points: "0,66 28,64 56,62 84,58 112,55 140,47 168,36 196,24 224,18 252,24 280,34 308,46 336,55 360,62",
    value: "No Data",
  },
  phaseSummary: [
    { currentA: "1,350", imbalance: "—", kva: "622", phase: "A", voltage: "480" },
    { currentA: "1,310", imbalance: "1.5%", kva: "602", phase: "B", voltage: "479" },
    { currentA: "1,290", imbalance: "2.6%", kva: "588", phase: "C", voltage: "481" },
    { currentA: "1,317", imbalance: "2.1%", kva: "604", phase: "Average", voltage: "480" },
  ],
  powerQuality: [
    { label: "THD Voltage (Avg)", value: "No Data" },
    { label: "THD Current (Avg)", value: "No Data" },
    { label: "Power Factor (Avg)", value: "No Data" },
    { label: "Frequency (Avg)", value: "No Data" },
    { label: "Voltage Unbalance", value: "No Data" },
  ],
  ratingKva: 0,
  recoveryTrend: {
    detail: "12 months",
    points: "0,70 30,62 60,64 90,60 120,61 150,59 180,57 210,54 240,51 270,48 300,43 330,38 360,32",
    value: "No Data",
  },
  savingsRows: [
    { label: "Energy Cost Savings", value: "No Data" },
    { label: "Demand Cost Savings", value: "No Data" },
    { label: "Total Annual Savings", value: "No Data" },
  ],
  siteName: "No Data",
  state: "empty",
  transformerName: "No Data",
  updatedAt: "source_missing",
  utilizationPct: 0,
};

export default function TransformersPage() {
  return <TransformerDashboardScreen data={transformerDashboardData} />;
}
