import { EnergyDashboardScreen } from "@/components/ecbs/EnergyDashboardScreen";
import { getOchsnerSiteDashboardData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const data = await getOchsnerSiteDashboardData();

  return <EnergyDashboardScreen activeHref="/enterprise/sites" data={data} />;
}
