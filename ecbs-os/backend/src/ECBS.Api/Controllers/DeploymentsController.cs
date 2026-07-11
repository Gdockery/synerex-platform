using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/deployments")]
public sealed class DeploymentsController(
    IDeploymentCompletionDataService deploymentCompletionDataService,
    IDeploymentDocumentationDataService deploymentDocumentationDataService,
    IDeploymentFieldWorkflowDataService deploymentFieldWorkflowDataService) : ControllerBase
{
    [HttpGet("{deploymentId}/completion")]
    public async Task<ActionResult<DeploymentCompletionData>> GetCompletion(string deploymentId, CancellationToken cancellationToken)
    {
        var data = await deploymentCompletionDataService.GetDeploymentCompletionAsync(deploymentId, cancellationToken);

        return Ok(data);
    }

    [HttpGet("{deploymentId}/documentation")]
    public async Task<ActionResult<DeploymentDocumentationData>> GetDocumentation(string deploymentId, CancellationToken cancellationToken)
    {
        var data = await deploymentDocumentationDataService.GetDeploymentDocumentationAsync(deploymentId, cancellationToken);

        return Ok(data);
    }

    [HttpGet("{deploymentId}/field-workflow")]
    public async Task<ActionResult<DeploymentFieldWorkflowData>> GetFieldWorkflow(string deploymentId, CancellationToken cancellationToken)
    {
        var data = await deploymentFieldWorkflowDataService.GetDeploymentFieldWorkflowAsync(deploymentId, cancellationToken);

        return Ok(data);
    }
}

