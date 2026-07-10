import { CapacityDrilldownScreen } from "@/components/ecbs/CapacityDrilldownScreens";
import { getCapacityUtilizationTrendDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function CapacityUtilizationTrendDetailPage() {
  const data = await getCapacityUtilizationTrendDataFromApi();

  return <CapacityDrilldownScreen trendData={data} variant="trend" />;
}
