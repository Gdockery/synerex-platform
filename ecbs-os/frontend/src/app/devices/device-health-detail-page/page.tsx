import { DeviceHealthDetailScreen } from "@/components/ecbs/DeviceHealthDetailScreen";
import { getDevicesDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function DeviceHealthDetailPage() {
  const data = await getDevicesDataFromApi();

  return <DeviceHealthDetailScreen data={data} />;
}
