import { CapacityDrilldownScreen } from "@/components/ecbs/CapacityDrilldownScreens";
import { getCapacityRecoveryBreakdownDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function CapacityRecoveryBreakdownPage() {
  const data = await getCapacityRecoveryBreakdownDataFromApi();

  return <CapacityDrilldownScreen recoveryData={data} variant="recovery" />;
}
