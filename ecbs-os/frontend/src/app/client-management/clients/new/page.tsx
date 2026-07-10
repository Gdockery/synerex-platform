import { ClientManagementScreen } from "@/components/ecbs/ClientManagementScreens";
import { getClientManagementDataFromApi } from "@/lib/ecbsApi";

export default async function AddNewClientPage() {
  const data = await getClientManagementDataFromApi();

  return <ClientManagementScreen data={data} variant="new" />;
}
