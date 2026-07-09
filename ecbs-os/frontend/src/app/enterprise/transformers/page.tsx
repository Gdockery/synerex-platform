import { TransformerDashboardScreen } from "@/components/ecbs/TransformerDashboardScreen";
import type { TransformerDashboardData } from "@/lib/trackingDashboardData";

const transformerDashboardData: TransformerDashboardData = {
  annualSavings: "$78,600",
  availableCapacityKva: 375,
  capacityRecoveredKva: 225,
  cbiScore: 96,
  dateRange: "May 12 - May 18, 2025",
  details: [
    { label: "Transformer ID", value: "XF-001" },
    { label: "Type", value: "Pad Mounted" },
    { label: "Manufacturer", value: "Schneider Electric" },
    { label: "Model", value: "PM1500" },
    { label: "Rating", value: "1500 kVA" },
    { label: "Primary Voltage", value: "480Y/277 V" },
    { label: "Secondary Voltage", value: "480Y/277 V" },
    { label: "Impedance", value: "5.75%" },
    { label: "Serial Number", value: "SE-556789" },
    { label: "Install Date", value: "Jan 15, 2022" },
    { label: "Warranty Expiration", value: "Jan 15, 2032" },
  ],
  health: "Healthy",
  kpis: [],
  kvaTrend: {
    detail: "Last 7 days",
    points: "0,50 18,38 36,46 54,34 72,55 90,44 108,58 126,45 144,52 162,40 180,54 198,46 216,50 234,42 252,54 270,38 288,48 306,36 324,52 342,44 360,48",
    value: "1,125 kVA",
  },
  loadKva: 1125,
  loadProfile: {
    detail: "Today",
    points: "0,66 28,64 56,62 84,58 112,55 140,47 168,36 196,24 224,18 252,24 280,34 308,46 336,55 360,62",
    value: "1,125 kVA",
  },
  phaseSummary: [
    { currentA: "1,350", imbalance: "—", kva: "622", phase: "A", voltage: "480" },
    { currentA: "1,310", imbalance: "1.5%", kva: "602", phase: "B", voltage: "479" },
    { currentA: "1,290", imbalance: "2.6%", kva: "588", phase: "C", voltage: "481" },
    { currentA: "1,317", imbalance: "2.1%", kva: "604", phase: "Average", voltage: "480" },
  ],
  powerQuality: [
    { label: "THD Voltage (Avg)", value: "2.1%" },
    { label: "THD Current (Avg)", value: "18.7%" },
    { label: "Power Factor (Avg)", value: "0.96" },
    { label: "Frequency (Avg)", value: "60.01 Hz" },
    { label: "Voltage Unbalance", value: "1.2%" },
  ],
  ratingKva: 1500,
  recoveryTrend: {
    detail: "12 months",
    points: "0,70 30,62 60,64 90,60 120,61 150,59 180,57 210,54 240,51 270,48 300,43 330,38 360,32",
    value: "225 kVA",
  },
  savingsRows: [
    { label: "Energy Cost Savings", value: "$45,200" },
    { label: "Demand Cost Savings", value: "$33,400" },
    { label: "Total Annual Savings", value: "$78,600" },
  ],
  siteName: "Flex Tijuana",
  state: "data",
  transformerName: "Main Transformer",
  updatedAt: "May 18, 2025 10:15 AM",
  utilizationPct: 75,
};

export default function TransformersPage() {
  return <TransformerDashboardScreen data={transformerDashboardData} />;
}
