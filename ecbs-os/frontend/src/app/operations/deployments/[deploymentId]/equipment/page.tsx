import { DeploymentWorkflowScreen } from "@/components/ecbs/DeploymentWorkflowScreens";
import { getDeploymentFieldWorkflowDataFromApi } from "@/lib/ecbsApi";

type PageProps = {
  params: Promise<{ deploymentId: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export const dynamic = "force-dynamic";

export default async function EquipmentInventoryPage({ params, searchParams }: PageProps) {
  const { deploymentId } = await params;
  const { mode } = await searchParams;
  const fieldData = await getDeploymentFieldWorkflowDataFromApi(deploymentId);

  return <DeploymentWorkflowScreen deploymentId={deploymentId} fieldData={fieldData} variant={mode === "add" ? "equipmentAdd" : "equipmentInventory"} />;
}
