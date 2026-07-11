namespace ECBS.Application.ScreenData;

public interface IDeploymentDocumentationDataService
{
    Task<DeploymentDocumentationData> GetDeploymentDocumentationAsync(string deploymentId, CancellationToken cancellationToken = default);
}

