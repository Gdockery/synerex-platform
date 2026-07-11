import { EnergySavingsEngineEnergySavingsDetailScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardSavingsEngineEnergySavingsDetailPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsEngineEnergySavingsDetailScreen data={data} />;
}
