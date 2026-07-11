import { EnergySavingsUtilityForecastingDetailsScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardUtilityForecastingDetailsPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsUtilityForecastingDetailsScreen data={data} />;
}
