import { ClientManagementScreen } from "@/components/ecbs/ClientManagementScreens";
import { getClientManagementDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function ClientListPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const data = await getClientManagementDataFromApi();

  if (params.workflow === "new-project-scanning") {
    return <ClientManagementScreen data={data} variant="newProjectScanning" />;
  }
  if (params.workflow === "new-project-generate-reports") {
    return <ClientManagementScreen data={data} variant="newProjectReports" />;
  }

  return <ClientManagementScreen data={data} variant="list" />;
}
