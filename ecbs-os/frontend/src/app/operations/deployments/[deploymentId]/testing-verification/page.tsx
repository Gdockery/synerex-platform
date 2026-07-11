import { DeploymentWorkflowScreen } from "@/components/ecbs/DeploymentWorkflowScreens";
import { getDeploymentFieldWorkflowDataFromApi } from "@/lib/ecbsApi";

type PageProps = {
  params: Promise<{ deploymentId: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export const dynamic = "force-dynamic";

export default async function TestingVerificationPage({ params, searchParams }: PageProps) {
  const { deploymentId } = await params;
  const { mode } = await searchParams;
  const fieldData = await getDeploymentFieldWorkflowDataFromApi(deploymentId);
  const variant = mode === "add-issue"
    ? "testingAddIssue"
    : mode === "details"
      ? "testingViewDetails"
      : mode === "trend"
        ? "testingViewTrend"
        : "testingVerification";

  return <DeploymentWorkflowScreen deploymentId={deploymentId} fieldData={fieldData} variant={variant} />;
}
