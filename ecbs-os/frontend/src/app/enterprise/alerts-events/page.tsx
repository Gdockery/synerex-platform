import { AlertsEventsScreen } from "@/components/ecbs/AlertsEventsScreen";
import { getOchsnerAlertsEventsData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function AlertsEventsPage() {
  const data = await getOchsnerAlertsEventsData();

  return <AlertsEventsScreen data={data} />;
}
