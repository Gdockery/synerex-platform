import { SetNotificationsScreen } from "@/components/ecbs/NextFiveScreens";
import { getSetNotificationsDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function SetNotificationsPage() {
  const data = await getSetNotificationsDataFromApi();

  return <SetNotificationsScreen data={data} />;
}
