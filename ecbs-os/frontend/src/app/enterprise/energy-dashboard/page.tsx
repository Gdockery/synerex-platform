import { EnergyDashboardScreen } from "@/components/ecbs/EnergyDashboardScreen";
import { getOchsnerSiteDashboardData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnergyDashboardPage() {
  const data = await getOchsnerSiteDashboardData();

  return <EnergyDashboardScreen data={data} />;
}
