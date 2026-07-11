import { EnergySavingsWaterfallAnalysisScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardWaterfallAnalysisPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsWaterfallAnalysisScreen data={data} />;
}
