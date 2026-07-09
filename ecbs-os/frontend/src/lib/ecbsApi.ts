import "server-only";

import type { AlertsEventsData } from "@/lib/trackingDashboardData";

const apiBaseUrl = process.env.ECBS_API_BASE_URL ?? "http://localhost:5090";

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
