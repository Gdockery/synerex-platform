export type AnalysisKpi = {
  detail: string;
  icon: string;
  label: string;
  tone: string;
  value: string;
};

export type AnalysisTableRow = {
  cells: string[];
};

export type AnalysisSummaryRow = {
  label: string;
  value: string;
};

export type CurrentAnalysisData = {
  assetRows: AnalysisTableRow[];
  insights: string[];
  kpis: AnalysisKpi[];
  message: string;
  siteName: string;
  state: string;
  updatedAt: string;
};

export type LiveDataScreenData = {
  alarmRows: AnalysisTableRow[];
  clientName: string;
  deviceRows: AnalysisTableRow[];
  kpis: AnalysisKpi[];
  message: string;
  phaseRows: AnalysisTableRow[];
  projectName: string;
  siteName: string;
  state: string;
  systemRows: AnalysisSummaryRow[];
  updatedAt: string;
};

