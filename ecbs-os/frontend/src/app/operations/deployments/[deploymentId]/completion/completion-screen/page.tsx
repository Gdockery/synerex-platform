import { DeploymentWorkflowScreen } from "@/components/ecbs/DeploymentWorkflowScreens";
import { getDeploymentCompletionDataFromApi } from "@/lib/ecbsApi";

type PageProps = {
  params: Promise<{ deploymentId: string }>;
};

export const dynamic = "force-dynamic";

export default async function CompletionPage({ params }: PageProps) {
  const { deploymentId } = await params;
  const data = await getDeploymentCompletionDataFromApi(deploymentId);

  return <DeploymentWorkflowScreen data={data} deploymentId={deploymentId} variant="completion" />;
}
