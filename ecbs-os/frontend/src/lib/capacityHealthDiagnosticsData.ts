export type CapacityHealthDiagnosticsData = {
  assetBars: { color: string; label: string; value: number }[];
  diagnostics: {
    factors: { label: string; value: string }[];
    score: number;
    status: string;
    title: string;
    tone: string;
  }[];
  distribution: { color: string; label: string; value: string }[];
  issues: { asset: string; impact: string; issue: string; recommendation: string; severity: string }[];
  kpis: { color: string; detail: string; icon: string; label: string; value: string }[];
  message: string;
  recommendations: string[];
  state: "data" | "empty";
  summaryRows: { label: string; value: string }[];
  trend: { label: string; score: number }[];
  updatedAt: string;
};
