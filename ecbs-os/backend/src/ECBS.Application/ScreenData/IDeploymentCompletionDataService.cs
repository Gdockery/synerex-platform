namespace ECBS.Application.ScreenData;

public interface IDeploymentCompletionDataService
{
    Task<DeploymentCompletionData> GetDeploymentCompletionAsync(string deploymentId, CancellationToken cancellationToken = default);
}

