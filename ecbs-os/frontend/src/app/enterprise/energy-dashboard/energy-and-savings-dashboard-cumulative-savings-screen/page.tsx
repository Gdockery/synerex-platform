import { EnergySavingsCumulativeSavingsScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardCumulativeSavingsScreenPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsCumulativeSavingsScreen data={data} />;
}
