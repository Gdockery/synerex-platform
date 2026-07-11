import { EnergySavingsAlertsScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardAlertsScreenPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsAlertsScreen data={data} />;
}
