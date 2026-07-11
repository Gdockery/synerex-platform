import { EnergySavingsCapacityRecoveredScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardCapacityRecoveredScreenPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsCapacityRecoveredScreen data={data} />;
}
