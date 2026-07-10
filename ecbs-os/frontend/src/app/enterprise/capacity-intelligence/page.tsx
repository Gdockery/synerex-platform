import { CapacityIntelligenceScreen } from "@/components/ecbs/CapacityIntelligenceScreen";
import { getCapacityIntelligenceDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function CapacityIntelligencePage() {
  const data = await getCapacityIntelligenceDataFromApi();

  return <CapacityIntelligenceScreen data={data} />;
}
