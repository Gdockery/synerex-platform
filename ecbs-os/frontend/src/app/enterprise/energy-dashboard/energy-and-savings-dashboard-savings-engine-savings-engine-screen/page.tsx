import { EnergySavingsEngineValueDriversDetailScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardSavingsEngineValueDriversDetailPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsEngineValueDriversDetailScreen data={data} />;
}
