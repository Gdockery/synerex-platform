import type { AnalysisSummaryRow } from "@/lib/analysisData";
import type { DocumentDataRow } from "@/lib/deploymentDocumentationData";

export type FieldEquipmentRow = {
  id: string;
  lastCommunicatedAt: string;
  location: string;
  name: string;
  rating: string;
  serialNumber: string;
  status: string;
  type: string;
};

export type FieldReadingRow = {
  delta: string;
  label: string;
  postValue: string;
  preValue: string;
  source: string;
  unit: string;
};

export type DeploymentFieldWorkflowData = {
  clientName: string;
  deploymentId: string;
  documentRows: DocumentDataRow[];
  equipmentRows: FieldEquipmentRow[];
  message: string;
  postReadingRows: FieldReadingRow[];
  preReadingRows: FieldReadingRow[];
  projectName: string;
  siteName: string;
  siteRows: AnalysisSummaryRow[];
  state: string;
  status: string;
  summaryRows: AnalysisSummaryRow[];
  updatedAt: string;
};

