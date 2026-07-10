import "server-only";

import type { AlarmDetailData } from "@/lib/alarmDetailData";
import type { CapacityHealthDiagnosticsData } from "@/lib/capacityHealthDiagnosticsData";
import type { CapacityRecoveryBreakdownData } from "@/lib/capacityRecoveryBreakdownData";
import type { ConfigureAlertRuleData } from "@/lib/configureAlertRuleData";
import type { SetNotificationsData } from "@/lib/setNotificationsData";
import type { AlertsEventsData, CapacityIntelligenceData } from "@/lib/trackingDashboardData";

const apiBaseUrl = process.env.ECBS_API_BASE_URL ?? "http://localhost:5090";

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
