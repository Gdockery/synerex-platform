import { EnergySavingsRoiPaybackScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyAndSavingsDashboardRoiPaybackPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <EnergySavingsRoiPaybackScreen data={data} />;
}
