import { EnterpriseDashboardScreen } from "@/components/ecbs/EnterpriseDashboardScreen";
import { getSelectedClientId } from "@/lib/selectedClient";
import { getEnterpriseDashboardData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function EnterpriseDashboardPage() {
  const data = await getEnterpriseDashboardData(await getSelectedClientId());

  return <EnterpriseDashboardScreen data={data} />;
}
