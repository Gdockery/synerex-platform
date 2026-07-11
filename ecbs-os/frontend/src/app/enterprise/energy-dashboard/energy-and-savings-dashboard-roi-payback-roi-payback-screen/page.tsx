import { EnergySavingsRoiPaybackDetailsScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardRoiPaybackDetailsPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsRoiPaybackDetailsScreen data={data} />;
}
