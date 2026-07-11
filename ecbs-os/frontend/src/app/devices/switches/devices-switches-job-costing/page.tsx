import { DeviceScreen } from "@/components/ecbs/DeviceHealthDetailScreen";
import { getDevicesDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function DevicesSwitchesJobCostingPage() {
  const data = await getDevicesDataFromApi();

  return <DeviceScreen data={data} variant="jobCosting" />;
}
