import { EnergySavingsEngineOverviewScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardSavingsEnginePage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsEngineOverviewScreen data={data} />;
}
