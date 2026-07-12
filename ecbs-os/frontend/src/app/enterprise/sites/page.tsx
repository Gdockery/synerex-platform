import { ClientSitesOverviewScreen } from "@/components/ecbs/ClientSitesOverviewScreen";
import { getSelectedClientId } from "@/lib/selectedClient";
import { getClientSitesOverviewData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const data = await getClientSitesOverviewData(await getSelectedClientId());

  return <ClientSitesOverviewScreen data={data} />;
}
