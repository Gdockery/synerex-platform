import type { AnalysisSummaryRow } from "@/lib/analysisData";

export type DeploymentCompletionData = {
  clientName: string;
  closureCards: AnalysisSummaryRow[];
  deploymentId: string;
  documentRows: AnalysisSummaryRow[];
  equipmentRows: AnalysisSummaryRow[];
  identityRows: AnalysisSummaryRow[];
  message: string;
  projectName: string;
  siteName: string;
  state: string;
  status: string;
  updatedAt: string;
};

