import { EnergySavingsBaselineComparisonScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardBaselineComparisonScreenPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsBaselineComparisonScreen data={data} />;
}
