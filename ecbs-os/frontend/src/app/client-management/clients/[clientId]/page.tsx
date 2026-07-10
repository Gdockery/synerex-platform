import { ClientManagementScreen } from "@/components/ecbs/ClientManagementScreens";
import { getClientManagementDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function ClientDetailsPage() {
  const data = await getClientManagementDataFromApi();

  return <ClientManagementScreen data={data} variant="details" />;
}
