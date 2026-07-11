import { EnergySavingsRealTimeValueDetailScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardRealTimeValueEngineDetailPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsRealTimeValueDetailScreen data={data} />;
}
