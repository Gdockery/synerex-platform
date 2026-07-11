import { DeviceScreen } from "@/components/ecbs/DeviceHealthDetailScreen";
import { getDevicesDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function RepeaterDetailPage() {
  const data = await getDevicesDataFromApi();

  return <DeviceScreen data={data} variant="repeaterDetail" />;
}
