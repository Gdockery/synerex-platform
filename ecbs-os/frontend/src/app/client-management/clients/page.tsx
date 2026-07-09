import { ClientManagementScreen } from "@/components/ecbs/ClientManagementScreens";

export const dynamic = "force-dynamic";

export default async function ClientListPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  if (params.workflow === "new-project-scanning") {
    return <ClientManagementScreen variant="newProjectScanning" />;
  }
  if (params.workflow === "new-project-generate-reports") {
    return <ClientManagementScreen variant="newProjectReports" />;
  }

  return <ClientManagementScreen variant="list" />;
}
