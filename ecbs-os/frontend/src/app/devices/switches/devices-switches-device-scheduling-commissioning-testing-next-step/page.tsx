import { DeviceScreen } from "@/components/ecbs/DeviceHealthDetailScreen";
import { getDevicesDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function DevicesSwitchesCommissioningTestingNextStepPage() {
  const data = await getDevicesDataFromApi();

  return <DeviceScreen data={data} variant="commissioningNext" />;
}
