import { AlarmDetailScreen } from "@/components/ecbs/NextFiveScreens";
import { getAlarmDetailDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function AlarmDetailPage() {
  const data = await getAlarmDetailDataFromApi();

  return <AlarmDetailScreen data={data} />;
}
