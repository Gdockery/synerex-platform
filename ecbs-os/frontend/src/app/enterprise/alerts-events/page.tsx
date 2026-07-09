import { AlertsEventsScreen } from "@/components/ecbs/AlertsEventsScreen";
import { getAlarmEventsDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function AlertsEventsPage() {
  const data = await getAlarmEventsDataFromApi();

  return <AlertsEventsScreen data={data} />;
}
