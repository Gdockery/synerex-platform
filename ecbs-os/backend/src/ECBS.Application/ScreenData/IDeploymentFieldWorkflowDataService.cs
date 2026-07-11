namespace ECBS.Application.ScreenData;

public interface IDeploymentFieldWorkflowDataService
{
    Task<DeploymentFieldWorkflowData> GetDeploymentFieldWorkflowAsync(string deploymentId, CancellationToken cancellationToken = default);
}

