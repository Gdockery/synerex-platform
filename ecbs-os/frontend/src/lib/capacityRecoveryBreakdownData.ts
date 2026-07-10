export type CapacityRecoveryBreakdownData = {
  afterOverCapacity: string;
  afterPeak: string;
  beforeOverCapacity: string;
  beforePeak: string;
  contributionRows: { color: string; label: string; percent: string; value: string }[];
  eventRows: { color: string; date: string; event: string; icon: string; impact: string; recovered: string; system: string }[];
  kpis: { color: string; detail: string; icon: string; label: string; value: string }[];
  message: string;
  recoveryByAssetType: { color: string; label: string; value: string }[];
  recoveryPercent: string;
  state: "data" | "empty";
  summaryRows: { label: string; value: string }[];
  timePeriodRows: { avgKva: string; consistency: string; maxKva: string; timePeriod: string }[];
  trend: { baselineUsed: number; label: string; recovered: number; used: number }[];
  updatedAt: string;
};
