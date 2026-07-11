import "server-only";

import type { AlarmDetailData } from "@/lib/alarmDetailData";
import type { CurrentAnalysisData, LiveDataScreenData } from "@/lib/analysisData";
import type { CapacityHealthDiagnosticsData } from "@/lib/capacityHealthDiagnosticsData";
import type { CapacityRecoveryBreakdownData } from "@/lib/capacityRecoveryBreakdownData";
import type { CapacityUtilizationTrendData } from "@/lib/capacityUtilizationTrendData";
import type { ClientManagementData } from "@/lib/clientManagementData";
import type { ConfigureAlertRuleData } from "@/lib/configureAlertRuleData";
import type { DeploymentCompletionData } from "@/lib/deploymentCompletionData";
import type { DeploymentDocumentationData, DocumentDataRow } from "@/lib/deploymentDocumentationData";
import type { DeploymentFieldWorkflowData, FieldEquipmentRow, FieldReadingRow } from "@/lib/deploymentFieldWorkflowData";
import type { DevicesData } from "@/lib/devicesData";
import type { SetNotificationsData } from "@/lib/setNotificationsData";
import type { AlertsEventsData, CapacityIntelligenceData } from "@/lib/trackingDashboardData";

const apiBaseUrl = process.env.ECBS_API_BASE_URL ?? "http://localhost:5090";

export async function getCurrentAnalysisDataFromApi(): Promise<CurrentAnalysisData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/engineering/current-analysis`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noCurrentAnalysisData(`No applicable Current Analysis data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as CurrentAnalysisData;
  } catch {
    return noCurrentAnalysisData("No applicable Current Analysis data was found because ECBS.Api is not reachable.");
  }
}

export async function getLiveDataFromApi(): Promise<LiveDataScreenData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/telemetry`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noLiveData(`No applicable Live Data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as LiveDataScreenData;
  } catch {
    return noLiveData("No applicable Live Data was found because ECBS.Api is not reachable.");
  }
}

export async function getDeploymentCompletionDataFromApi(deploymentId: string): Promise<DeploymentCompletionData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/deployments/${deploymentId}/completion`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noDeploymentCompletionData(`No applicable Deployment Completion data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as DeploymentCompletionData;
  } catch {
    return noDeploymentCompletionData("No applicable Deployment Completion data was found because ECBS.Api is not reachable.");
  }
}

export async function getDeploymentDocumentationDataFromApi(deploymentId: string): Promise<DeploymentDocumentationData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/deployments/${deploymentId}/documentation`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noDeploymentDocumentationData(`No applicable Deployment Documentation data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as DeploymentDocumentationData;
  } catch {
    return noDeploymentDocumentationData("No applicable Deployment Documentation data was found because ECBS.Api is not reachable.");
  }
}

export async function getDeploymentFieldWorkflowDataFromApi(deploymentId: string): Promise<DeploymentFieldWorkflowData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/deployments/${deploymentId}/field-workflow`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noDeploymentFieldWorkflowData(`No applicable Deployment Field Workflow data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as DeploymentFieldWorkflowData;
  } catch {
    return noDeploymentFieldWorkflowData("No applicable Deployment Field Workflow data was found because ECBS.Api is not reachable.");
  }
}

export async function getClientManagementDataFromApi(): Promise<ClientManagementData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/client-management`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noClientManagementData(`No applicable Client Management data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as ClientManagementData;
  } catch {
    return noClientManagementData("No applicable Client Management data was found because ECBS.Api is not reachable.");
  }
}

export async function getDevicesDataFromApi(): Promise<DevicesData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/devices`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noDevicesData(`No applicable Devices data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as DevicesData;
  } catch {
    return noDevicesData("No applicable Devices data was found because ECBS.Api is not reachable.");
  }
}

export async function getCapacityIntelligenceDataFromApi(): Promise<CapacityIntelligenceData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/capacity-intelligence`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noCapacityIntelligenceData(`No applicable Capacity Intelligence data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as CapacityIntelligenceData;
  } catch {
    return noCapacityIntelligenceData("No applicable Capacity Intelligence data was found because ECBS.Api is not reachable.");
  }
}

export async function getCapacityRecoveryBreakdownDataFromApi(): Promise<CapacityRecoveryBreakdownData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/capacity-intelligence/recovery-breakdown`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noCapacityRecoveryBreakdownData(`No applicable Capacity Recovery Breakdown data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as CapacityRecoveryBreakdownData;
  } catch {
    return noCapacityRecoveryBreakdownData("No applicable Capacity Recovery Breakdown data was found because ECBS.Api is not reachable.");
  }
}

export async function getCapacityHealthDiagnosticsDataFromApi(): Promise<CapacityHealthDiagnosticsData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/capacity-intelligence/health-diagnostics`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noCapacityHealthDiagnosticsData(`No applicable Capacity Health Diagnostics data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as CapacityHealthDiagnosticsData;
  } catch {
    return noCapacityHealthDiagnosticsData("No applicable Capacity Health Diagnostics data was found because ECBS.Api is not reachable.");
  }
}

export async function getCapacityUtilizationTrendDataFromApi(): Promise<CapacityUtilizationTrendData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/capacity-intelligence/utilization-trend`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noCapacityUtilizationTrendData(`No applicable Capacity Utilization Trend data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as CapacityUtilizationTrendData;
  } catch {
    return noCapacityUtilizationTrendData("No applicable Capacity Utilization Trend data was found because ECBS.Api is not reachable.");
  }
}

export async function getConfigureAlertRuleDataFromApi(): Promise<ConfigureAlertRuleData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/alerts/configure-alert-rule`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noConfigureAlertRuleData(`No applicable Configure Alert Rules data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as ConfigureAlertRuleData;
  } catch {
    return noConfigureAlertRuleData("No applicable Configure Alert Rules data was found because ECBS.Api is not reachable.");
  }
}

export async function getAlarmDetailDataFromApi(): Promise<AlarmDetailData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/alerts/alarm-detail`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noAlarmDetailData(`No applicable Alarm Detail data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as AlarmDetailData;
  } catch {
    return noAlarmDetailData("No applicable Alarm Detail data was found because ECBS.Api is not reachable.");
  }
}

export async function getAlarmEventsDataFromApi(): Promise<AlertsEventsData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/alerts/alarm-events`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noAlarmEventsData(`No applicable Alarm Events data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as AlertsEventsData;
  } catch {
    return noAlarmEventsData("No applicable Alarm Events data was found because ECBS.Api is not reachable.");
  }
}

export async function getSetNotificationsDataFromApi(): Promise<SetNotificationsData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/alerts/set-notifications`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return noSetNotificationsData(`No applicable Set Notifications data was returned by ECBS.Api (${response.status}).`);
    }

    return (await response.json()) as SetNotificationsData;
  } catch {
    return noSetNotificationsData("No applicable Set Notifications data was found because ECBS.Api is not reachable.");
  }
}

function noAlarmDetailData(message: string): AlarmDetailData {
  return {
    alarmId: "No Data",
    demandStats: [
      { label: "Current Demand", value: "No Data" },
      { label: "Threshold", value: "No Data" },
      { label: "Exceeded By", value: "No Data" },
      { label: "Duration", value: "No Data" },
    ],
    impactRows: [
      { label: "Estimated Extra Cost (Today)", value: "No Data" },
      { label: "Potential Monthly Impact", value: "No Data" },
      { label: "Power Factor (Avg)", value: "No Data" },
      { label: "Capacity Utilization", value: "No Data" },
      { label: "Demand Charge Exposure", value: "No Data" },
    ],
    message,
    priorityLabel: "No Data",
    recommendedActions: [{ text: "No applicable recommendation source was found." }],
    relatedAlarms: [],
    state: "no-data",
    status: "No Data",
    summaryTiles: [
      { color: "#ef4444", detail: message, icon: "⚠", title: "Alarm Summary", value: "No Data" },
      { color: "#05ff5e", detail: "No affected asset record was found.", icon: "▣", title: "Affected Assets (0)", value: "No Data" },
      { color: "#cbd5e1", detail: "No Data", icon: "", title: "Location", value: "No Data" },
      { color: "#cbd5e1", detail: "Duration: No Data|Since: No Data", icon: "", title: "Alarm Status", value: "No Data" },
      { color: "#cbd5e1", detail: "Escalation countdown is not represented in tracking.", icon: "↑", title: "Priority", value: "No Data" },
      { color: "#cbd5e1", detail: "Acknowledged by: No Data", icon: "", title: "Ack Status", value: "No Data" },
    ],
    timeline: [],
    title: "No Data",
    triggerConditions: [
      { actualValue: "No Data", condition: "No Data", duration: "No Data", parameter: "Alarm Rule", status: "No Data", threshold: "No Data" },
    ],
    triggeredAt: "No Data",
    updatedAt: "No Data",
  };
}

function noClientManagementData(message: string): ClientManagementData {
  return {
    clients: [],
    clientKpis: [
      { detail: "No Data", icon: "C", label: "Total Clients", tone: "blue", value: "No Data" },
      { detail: "No Data", icon: "S", label: "Total Sites", tone: "green", value: "No Data" },
      { detail: "No Data", icon: "P", label: "Active Projects", tone: "cyan", value: "No Data" },
      { detail: "No Data", icon: "M", label: "Total Capacity", tone: "blue", value: "No Data" },
      { detail: "No Data", icon: "$", label: "Annual Savings", tone: "yellow", value: "No Data" },
    ],
    message,
    projects: [],
    projectKpis: [
      { detail: "No Data", icon: "P", label: "Total Projects", tone: "blue", value: "No Data" },
      { detail: "No Data", icon: "C", label: "Total Capacity", tone: "green", value: "No Data" },
      { detail: "No Data", icon: "A", label: "Active Projects", tone: "cyan", value: "No Data" },
      { detail: "No Data", icon: "D", label: "Completed Projects", tone: "yellow", value: "No Data" },
      { detail: "No Data", icon: "$", label: "Projected Savings (Annual)", tone: "blue", value: "No Data" },
    ],
    selectedClient: {
      accountManager: "No Data",
      activeProjects: "No Data",
      address: "No Data",
      annualSavings: "No Data",
      clientSince: "No Data",
      completedProjects: "No Data",
      contractNumber: "No Data",
      currency: "No Data",
      email: "No Data",
      industry: "No Data",
      legalName: "No Data",
      mobile: "No Data",
      name: "No Data",
      phone: "No Data",
      primaryContactName: "No Data",
      primaryContactTitle: "No Data",
      status: "No Data",
      taxId: "No Data",
      timeZone: "No Data",
      totalCapacity: "No Data",
      totalSites: "No Data",
      website: "No Data",
    },
    state: "no-data",
    updatedAt: "No Data",
  };
}

function noCurrentAnalysisData(message: string): CurrentAnalysisData {
  return {
    assetRows: [{ cells: ["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data"] }],
    insights: [message],
    kpis: [
      { detail: "No Data", icon: "A", label: "Total Current", tone: "green", value: "No Data" },
      { detail: "No Data", icon: "P", label: "Productive Current (kW)", tone: "green", value: "No Data" },
      { detail: "No Data", icon: "R", label: "Reactive Current (kVAR)", tone: "yellow", value: "No Data" },
      { detail: "No Data", icon: "H", label: "Harmonic Current (THD)", tone: "yellow", value: "No Data" },
      { detail: "No Data", icon: "I", label: "Imbalance Current", tone: "yellow", value: "No Data" },
      { detail: "No Data", icon: "N", label: "Neutral Current", tone: "blue", value: "No Data" },
    ],
    message,
    siteName: "No Data",
    state: "no-data",
    updatedAt: "No Data",
  };
}

function noLiveData(message: string): LiveDataScreenData {
  return {
    alarmRows: [{ cells: ["No Data", message] }],
    clientName: "No Data",
    deviceRows: [{ cells: ["No Data", "No Data", "No Data", "No Data", "No Data", "No Data"] }],
    kpis: [
      { detail: "No Data", icon: "S", label: "System Status", tone: "green", value: "No Data" },
      { detail: "No Data", icon: "kW", label: "Total kW", tone: "blue", value: "No Data" },
      { detail: "No Data", icon: "kVA", label: "Total kVA", tone: "cyan", value: "No Data" },
      { detail: "No Data", icon: "PF", label: "Power Factor", tone: "yellow", value: "No Data" },
      { detail: "No Data", icon: "THD", label: "THD (V)", tone: "yellow", value: "No Data" },
      { detail: "No Data", icon: "Hz", label: "Frequency", tone: "blue", value: "No Data" },
      { detail: "No Data", icon: "L", label: "System Load", tone: "green", value: "No Data" },
    ],
    message,
    phaseRows: [{ cells: ["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data"] }],
    projectName: "No Data",
    siteName: "No Data",
    state: "no-data",
    systemRows: [{ label: "Source", value: "No Data" }],
    updatedAt: "No Data",
  };
}

function noDeploymentCompletionData(message: string): DeploymentCompletionData {
  return {
    clientName: "No Data",
    closureCards: [
      { label: "Workflow Progress", value: "No Data" },
      { label: "Tests Passed", value: "No Data" },
      { label: "Documentation", value: "No Data" },
      { label: "Readiness", value: "No Data" },
    ],
    deploymentId: "No Data",
    documentRows: [
      { label: "Documents", value: "No Data" },
      { label: "Generated Reports", value: "No Data" },
      { label: "Certificates", value: "No Data" },
    ],
    equipmentRows: [{ label: "Equipment", value: "No Data" }],
    identityRows: [
      { label: "Technician", value: "No Data" },
      { label: "Customer Signer", value: "No Data" },
      { label: "Identity Verification", value: "No Data" },
      { label: "Handover Contact", value: "No Data" },
    ],
    message,
    projectName: "No Data",
    siteName: "No Data",
    state: "no-data",
    status: "No Data",
    updatedAt: "No Data",
  };
}

function noDeploymentDocumentationData(message: string): DeploymentDocumentationData {
  const row: DocumentDataRow = {
    folder: "No Data",
    id: "No Data",
    name: "No Data",
    size: "No Data",
    status: message,
    storageUri: "No Data",
    type: "No Data",
    uploadedAt: "No Data",
    uploadedBy: "No Data",
  };

  return {
    clientName: "No Data",
    deploymentId: "No Data",
    documentRows: [row],
    folderRows: [
      { label: "Folders", value: "No Data" },
      { label: "Folder Model", value: "No Data" },
      { label: "Folder Permissions", value: "No Data" },
      { label: "Folder Size", value: "No Data" },
    ],
    message,
    metadataRows: [
      { label: "Type", value: "No Data" },
      { label: "Status", value: "No Data" },
      { label: "Folder", value: "No Data" },
      { label: "Uploaded By", value: "No Data" },
      { label: "Date Uploaded", value: "No Data" },
      { label: "Last Modified", value: "No Data" },
      { label: "Size", value: "No Data" },
      { label: "Storage URI", value: "No Data" },
    ],
    permissionRows: [
      { label: "Users", value: "No Data" },
      { label: "Roles", value: "No Data" },
      { label: "Access Levels", value: "No Data" },
      { label: "Audit Trail", value: "No Data" },
    ],
    projectName: "No Data",
    reviewRows: [row],
    searchRows: [row],
    siteName: "No Data",
    state: "no-data",
    status: "No Data",
    summaryRows: [
      { label: "Documents", value: "No Data" },
      { label: "Folders", value: "No Data" },
      { label: "Pending Reviews", value: "No Data" },
      { label: "Storage Used", value: "No Data" },
    ],
    updatedAt: "No Data",
    versionRows: [row],
  };
}

function noDeploymentFieldWorkflowData(message: string): DeploymentFieldWorkflowData {
  const equipment: FieldEquipmentRow = {
    id: "No Data",
    lastCommunicatedAt: "No Data",
    location: "No Data",
    name: "No Data",
    rating: "No Data",
    serialNumber: "No Data",
    status: message,
    type: "No Data",
  };
  const reading: FieldReadingRow = {
    delta: "No Data",
    label: "No Data",
    postValue: "No Data",
    preValue: "No Data",
    source: message,
    unit: "No Data",
  };
  const document: DocumentDataRow = {
    folder: "No Data",
    id: "No Data",
    name: "No Data",
    size: "No Data",
    status: message,
    storageUri: "No Data",
    type: "No Data",
    uploadedAt: "No Data",
    uploadedBy: "No Data",
  };

  return {
    clientName: "No Data",
    deploymentId: "No Data",
    documentRows: [document],
    equipmentRows: [equipment],
    message,
    postReadingRows: [reading],
    preReadingRows: [reading],
    projectName: "No Data",
    siteName: "No Data",
    siteRows: [
      { label: "Site Name", value: "No Data" },
      { label: "Site Number", value: "No Data" },
      { label: "Address", value: "No Data" },
      { label: "Utility", value: "No Data" },
      { label: "Time Zone", value: "No Data" },
      { label: "Status", value: "No Data" },
    ],
    state: "no-data",
    status: "No Data",
    summaryRows: [
      { label: "Equipment", value: "No Data" },
      { label: "Documents", value: "No Data" },
      { label: "Readings", value: "No Data" },
      { label: "Checklist", value: "No Data" },
    ],
    updatedAt: "No Data",
  };
}

function noConfigureAlertRuleData(message: string): ConfigureAlertRuleData {
  return {
    advancedRows: [
      { label: "Alert Evaluation Frequency", value: "No Data" },
      { label: "Clear Condition", value: "No Data" },
      { label: "Hysteresis", value: "No Data" },
      { label: "Debounce Time", value: "No Data" },
      { label: "Suppress Alerts", value: "No Data" },
    ],
    message,
    notificationRows: [
      { label: "Notification Channels", value: "No Data" },
      { label: "Recipients", value: "No Data" },
      { label: "Enable Escalation", value: "No Data" },
      { label: "Escalate After", value: "No Data" },
      { label: "Escalate To", value: "No Data" },
    ],
    recentActivity: [],
    ruleName: "No Data",
    ruleSummary: [
      { label: "Alert Name", value: "No Data" },
      { label: "Description", value: "No Data" },
      { label: "Priority", value: "No Data" },
      { label: "Status", value: "No Data" },
      { label: "Scope", value: "No Data" },
      { label: "Condition", value: "No Data" },
      { label: "Notifications", value: "No Data" },
      { label: "Escalation", value: "No Data" },
    ],
    scopeRows: [
      { label: "Apply To", value: "No Data" },
      { label: "Location", value: "No Data" },
      { label: "Assets", value: "No Data" },
      { label: "Asset Groups", value: "No Data" },
    ],
    state: "no-data",
    triggerRows: [
      { label: "Parameter", value: "No Data" },
      { label: "Condition", value: "No Data" },
      { label: "Threshold", value: "No Data" },
      { label: "Duration", value: "No Data" },
      { label: "Logical Operator", value: "No Data" },
    ],
  };
}

function noCapacityHealthDiagnosticsData(message: string): CapacityHealthDiagnosticsData {
  return {
    assetBars: [],
    diagnostics: [
      { factors: [{ label: "Source", value: "No Data" }], score: 0, status: "No Data", title: "Load Balance", tone: "#64748b" },
      { factors: [{ label: "Source", value: "No Data" }], score: 0, status: "No Data", title: "Utilization Efficiency", tone: "#64748b" },
      { factors: [{ label: "Source", value: "No Data" }], score: 0, status: "No Data", title: "Voltage Stability", tone: "#64748b" },
      { factors: [{ label: "Source", value: "No Data" }], score: 0, status: "No Data", title: "Harmonic Impact", tone: "#64748b" },
      { factors: [{ label: "Source", value: "No Data" }], score: 0, status: "No Data", title: "Thermal Headroom", tone: "#64748b" },
    ],
    distribution: [],
    issues: [],
    kpis: [
      { color: "#64748b", detail: "No Data", icon: "H", label: "Overall Health Score", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "B", label: "Load Balance", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "U", label: "Utilization Efficiency", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "V", label: "Voltage Stability", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "W", label: "Harmonic Impact", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "T", label: "Thermal Headroom", value: "No Data" },
    ],
    message,
    recommendations: [message],
    state: "empty",
    summaryRows: [
      { label: "Overall Health Score", value: "No Data" },
      { label: "Assets Evaluated", value: "No Data" },
      { label: "Average Utilization", value: "No Data" },
      { label: "Power Factor Score", value: "No Data" },
      { label: "Harmonic Score", value: "No Data" },
      { label: "Updated", value: "No Data" },
    ],
    trend: [],
    updatedAt: "No Data",
  };
}

function noCapacityUtilizationTrendData(message: string): CapacityUtilizationTrendData {
  return {
    benchmarks: [
      { color: "#64748b", label: "Your Site", value: "No Data" },
      { color: "#64748b", label: "Similar Sites Average", value: "No Data" },
      { color: "#64748b", label: "Industry Average", value: "No Data" },
      { color: "#64748b", label: "Best in Class", value: "No Data" },
    ],
    dailyRows: [],
    distribution: [],
    forecast: { deltaLabel: "No Data", points: [], projectedUtilization: "No Data" },
    heatmap: [],
    heatmapDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    heatmapHours: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"],
    kpis: [
      { color: "#64748b", detail: "No Data", icon: "C", label: "Total Connected Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "U", label: "Total Utilized Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "A", label: "Total Available Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "P", label: "Peak Utilization", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "G", label: "Average Utilization", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "T", label: "Time Over 80%", value: "No Data" },
    ],
    message,
    peakEvents: [],
    recommendations: [message],
    state: "empty",
    summaryRows: [
      { label: "Average Utilization", value: "No Data" },
      { label: "Maximum Utilization", value: "No Data" },
      { label: "Minimum Utilization", value: "No Data" },
      { label: "Time Over 80%", value: "No Data" },
      { label: "Time Over 90%", value: "No Data" },
      { label: "Time Under 60%", value: "No Data" },
      { label: "Data Points", value: "No Data" },
      { label: "Granularity", value: "No Data" },
    ],
    trend: [],
    updatedAt: "No Data",
  };
}

function noCapacityRecoveryBreakdownData(message: string): CapacityRecoveryBreakdownData {
  return {
    afterOverCapacity: "No Data",
    afterPeak: "No Data",
    beforeOverCapacity: "No Data",
    beforePeak: "No Data",
    contributionRows: [],
    eventRows: [],
    kpis: [
      { color: "#64748b", detail: "No Data", icon: "R", label: "Total Capacity Recovered", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "!", label: "Before ECBS (Peak)", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "✓", label: "After ECBS (Peak)", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "%", label: "Recovery Percentage", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "O", label: "Over-Capacity Eliminated", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "S", label: "Sustained Recovery", value: "No Data" },
    ],
    message,
    recoveryByAssetType: [],
    recoveryPercent: "No Data",
    state: "empty",
    summaryRows: [
      { label: "Maximum Capacity Recovered", value: "No Data" },
      { label: "Average Daily Recovery", value: "No Data" },
      { label: "Recovery Consistency", value: "No Data" },
      { label: "Peak Demand Reduction", value: "No Data" },
      { label: "Overload Conditions Removed", value: "No Data" },
      { label: "System Efficiency Improvement", value: "No Data" },
    ],
    timePeriodRows: [{ avgKva: "No Data", consistency: "No Data", maxKva: "No Data", timePeriod: "No Data" }],
    trend: [],
    updatedAt: "No Data",
  };
}

function noDevicesData(message: string): DevicesData {
  return {
    devices: [
      {
        firmware: "No Data",
        healthScore: "No Data",
        id: "No Data",
        isMain: false,
        kind: "No Data",
        lastSeen: "No Data",
        location: "No Data",
        name: "No Data",
        serialNumber: "No Data",
        status: "No Data",
      },
    ],
    message,
    state: "no-data",
    summaries: [
      { kind: "Meter", offline: 0, online: 0, total: 0, warning: 0 },
      { kind: "Switch", offline: 0, online: 0, total: 0, warning: 0 },
      { kind: "Gateway", offline: 0, online: 0, total: 0, warning: 0 },
    ],
    telemetry: {
      kilowattHours: "No Data",
      kilovoltAmps: "No Data",
      kilowatts: "No Data",
      powerFactor: "No Data",
      timestamp: "No Data",
    },
    updatedAt: "No Data",
  };
}

function noCapacityIntelligenceData(message: string): CapacityIntelligenceData {
  return {
    annualBenefit: "$0",
    assets: [],
    availableKva: 0,
    avoidedUpgrade: message,
    callouts: [
      { icon: "!", label: "Capacity Data Unavailable", value: message },
      { icon: "!", label: "Avoided Upgrade", value: "No Data" },
      { icon: "!", label: "Annual Benefit", value: "No Data" },
      { icon: "!", label: "Carbon Impact", value: "No Data" },
    ],
    capacityHealthScore: 0,
    co2Tons: "No Data",
    dateRange: "Tracking DB",
    deferredCapitalValue: 0,
    hiddenKva: 0,
    installedKva: 0,
    keyInsight: message,
    kpis: [
      { color: "#64748b", detail: "No Data", icon: "P", label: "Total Connected Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "G", label: "Current Utilized Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "B", label: "Available Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "R", label: "Recovered Capacity", value: "No Data" },
      { color: "#64748b", detail: "No Data", icon: "$", label: "Upgrade Deferral Value", value: "No Data" },
    ],
    loadKva: 0,
    recoveredKva: 0,
    recoveredPct: 0,
    siteName: "Ochsner Site",
    state: "empty",
    subScores: [
      { label: "Load Balance", value: 0 },
      { label: "Utilization Efficiency", value: 0 },
      { label: "Voltage Stability", value: 0 },
      { label: "Harmonic Impact", value: 0 },
      { label: "Thermal Headroom", value: 0 },
    ],
    trend: [],
    updatedAt: "No Data",
    utilizationPct: 0,
  };
}

function noAlarmEventsData(message: string): AlertsEventsData {
  const priorityMatrix = Array.from({ length: 5 }, () => [0, 0, 0, 0, 0]);

  return {
    activeAlerts: [],
    categories: [],
    cbiScore: 0,
    compliancePct: null,
    message,
    metrics: [],
    notifications: [],
    priorityMatrix,
    responseBars: [],
    responseMinutes: null,
    severity: [],
    state: "no-data",
    statusBars: [],
    totalAlerts: 0,
    trend: [],
    updatedAt: "No Data",
  };
}

function noSetNotificationsData(message: string): SetNotificationsData {
  return {
    channels: [
      { color: "#147dff", enabled: false, icon: "✉", text: "Send email notifications", title: "Email" },
      { color: "#05ff5e", enabled: false, icon: "💬", text: "Send text messages", title: "SMS Text" },
      { color: "#a855f7", enabled: false, icon: "🔔", text: "In-app and mobile push alerts", title: "Push Notification" },
      { color: "#f97316", enabled: false, icon: "☎", text: "Automated voice call", title: "Voice Call" },
      { color: "#06b6d4", enabled: false, icon: "🔗", text: "Send to external endpoint", title: "Webhook" },
    ],
    escalationRows: [
      { label: "Escalation Delay", value: "No Data" },
      { label: "Escalate To", value: "No Data" },
      { label: "Repeat Every", value: "No Data" },
      { label: "Max Escalations", value: "No Data" },
      { label: "Auto Resolve When Condition Clears", value: "No Data" },
    ],
    message,
    previewItems: [{ color: "#f59e0b", icon: "ⓘ", text: message }],
    recipients: [],
    ruleName: "No Data",
    ruleSummary: [
      { label: "Category", value: "No Data" },
      { label: "Parameter", value: "No Data" },
      { label: "Condition", value: "No Data" },
      { label: "Threshold", value: "No Data" },
      { label: "For How Long", value: "No Data" },
      { label: "Severity", value: "● No Data" },
    ],
    state: "no-data",
  };
}
