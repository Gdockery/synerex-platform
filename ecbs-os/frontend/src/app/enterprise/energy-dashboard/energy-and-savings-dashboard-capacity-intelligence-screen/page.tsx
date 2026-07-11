import { EnergySavingsCapacityIntelligenceScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardCapacityIntelligenceScreenPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsCapacityIntelligenceScreen data={data} />;
}
