import { CapacityDrilldownScreen } from "@/components/ecbs/CapacityDrilldownScreens";
import { getCapacityIntelligenceDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function CapacityCapexDeferralPage() {
  const data = await getCapacityIntelligenceDataFromApi();

  return <CapacityDrilldownScreen capacityData={data} variant="capex" />;
}
