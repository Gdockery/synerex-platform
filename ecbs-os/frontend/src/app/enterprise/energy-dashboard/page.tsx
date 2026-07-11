import { EnergySavingsDashboardScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyDashboardPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsDashboardScreen data={data} />;
}
