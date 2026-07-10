export type CapacityUtilizationTrendData = {
  benchmarks: { color: string; label: string; value: string }[];
  dailyRows: {
    averageUtilization: string;
    color: string;
    date: string;
    maxKva: string;
    minKva: string;
    offPeakUtilization: string;
    peakUtilization: string;
    timeOver80: string;
  }[];
  distribution: { color: string; label: string; value: string }[];
  forecast: { deltaLabel: string; points: { label: string; score: number }[]; projectedUtilization: string };
  heatmap: { column: number; row: number; value: number }[];
  heatmapDays: string[];
  heatmapHours: string[];
  kpis: { color: string; detail: string; icon: string; label: string; value: string }[];
  message: string;
  peakEvents: { duration: string; kva: string; rank: string; timestamp: string; utilization: string }[];
  recommendations: string[];
  state: "data" | "empty";
  summaryRows: { label: string; value: string }[];
  trend: { available: number; connected: number; label: string; utilizationPct: number; used: number }[];
  updatedAt: string;
};
