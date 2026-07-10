import { CapacityDrilldownScreen } from "@/components/ecbs/CapacityDrilldownScreens";
import { getCapacityHealthDiagnosticsDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function CapacityHealthDiagnosticsPage() {
  const data = await getCapacityHealthDiagnosticsDataFromApi();

  return <CapacityDrilldownScreen healthData={data} variant="health" />;
}
