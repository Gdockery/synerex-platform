import { EnergySavingsUtilityForecastingScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardUtilityForecastingPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsUtilityForecastingScreen data={data} />;
}
