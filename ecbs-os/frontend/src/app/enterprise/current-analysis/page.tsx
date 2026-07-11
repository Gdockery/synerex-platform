import { AnalysisDataScreen } from "@/components/ecbs/AnalysisDataScreens";
import { getCurrentAnalysisDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function CurrentAnalysisPage() {
  const data = await getCurrentAnalysisDataFromApi();

  return <AnalysisDataScreen currentData={data} variant="current" />;
}
