import { AnalysisDataScreen } from "@/components/ecbs/AnalysisDataScreens";
import { getLiveDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function LiveDataPage() {
  const data = await getLiveDataFromApi();

  return <AnalysisDataScreen liveData={data} variant="live" />;
}
