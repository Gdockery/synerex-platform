import { ClientManagementScreen } from "@/components/ecbs/ClientManagementScreens";
import { getClientManagementDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function ClientProjectsPage() {
  const data = await getClientManagementDataFromApi();

  return <ClientManagementScreen data={data} variant="projects" />;
}
