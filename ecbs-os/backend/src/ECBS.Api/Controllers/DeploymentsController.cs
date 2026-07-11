using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/deployments")]
public sealed class DeploymentsController(IDeploymentCompletionDataService deploymentCompletionDataService) : ControllerBase
{
    [HttpGet("{deploymentId}/completion")]
    public async Task<ActionResult<DeploymentCompletionData>> GetCompletion(string deploymentId, CancellationToken cancellationToken)
    {
        var data = await deploymentCompletionDataService.GetDeploymentCompletionAsync(deploymentId, cancellationToken);

        return Ok(data);
    }
}

