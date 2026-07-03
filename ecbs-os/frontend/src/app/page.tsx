import { EnterpriseDashboardScreen } from "@/components/ecbs/EnterpriseDashboardScreen";
import { getEnterpriseDashboardData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getEnterpriseDashboardData();

  return <EnterpriseDashboardScreen data={data} />;
}
