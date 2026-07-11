import { DeploymentWorkflowScreen } from "@/components/ecbs/DeploymentWorkflowScreens";
import { getDeploymentDocumentationDataFromApi } from "@/lib/ecbsApi";

type PageProps = {
  params: Promise<{ deploymentId: string }>;
};

export const dynamic = "force-dynamic";

export default async function DocumentationDocumentViewerPage({ params }: PageProps) {
  const { deploymentId } = await params;
  const documentationData = await getDeploymentDocumentationDataFromApi(deploymentId);

  return <DeploymentWorkflowScreen deploymentId={deploymentId} documentationData={documentationData} variant="documentViewer" />;
}
