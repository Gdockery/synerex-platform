import "server-only";

import type { AlarmDetailData } from "@/lib/alarmDetailData";
import type { SetNotificationsData } from "@/lib/setNotificationsData";
import type { AlertsEventsData } from "@/lib/trackingDashboardData";

const apiBaseUrl = process.env.ECBS_API_BASE_URL ?? "http://localhost:5090";

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
