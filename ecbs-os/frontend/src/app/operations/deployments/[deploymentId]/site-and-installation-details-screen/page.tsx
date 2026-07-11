import { DeploymentWorkflowScreen } from "@/components/ecbs/DeploymentWorkflowScreens";
import { getDeploymentFieldWorkflowDataFromApi } from "@/lib/ecbsApi";

type PageProps = {
  params: Promise<{ deploymentId: string }>;
};

export const dynamic = "force-dynamic";

export default async function SiteAndInstallationDetailsPage({ params }: PageProps) {
  const { deploymentId } = await params;
  const fieldData = await getDeploymentFieldWorkflowDataFromApi(deploymentId);

  return <DeploymentWorkflowScreen deploymentId={deploymentId} fieldData={fieldData} variant="siteDetails" />;
}
