import type { AnalysisSummaryRow } from "@/lib/analysisData";

export type DocumentDataRow = {
  folder: string;
  id: string;
  name: string;
  size: string;
  status: string;
  storageUri: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type DeploymentDocumentationData = {
  clientName: string;
  deploymentId: string;
  documentRows: DocumentDataRow[];
  folderRows: AnalysisSummaryRow[];
  message: string;
  metadataRows: AnalysisSummaryRow[];
  permissionRows: AnalysisSummaryRow[];
  projectName: string;
  reviewRows: DocumentDataRow[];
  searchRows: DocumentDataRow[];
  siteName: string;
  state: string;
  status: string;
  summaryRows: AnalysisSummaryRow[];
  updatedAt: string;
  versionRows: DocumentDataRow[];
};

