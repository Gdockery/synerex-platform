import { SavingsFinancialsScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function SavingsFinancialsPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <SavingsFinancialsScreen data={data} />;
}
