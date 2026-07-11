import { EnergySavingsRealTimeValueEngineScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardRealTimeValueEnginePage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsRealTimeValueEngineScreen data={data} />;
}
