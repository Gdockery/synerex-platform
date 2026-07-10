using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/client-management")]
public sealed class ClientManagementController(IClientManagementDataService clientManagementDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ClientManagementData>> Get(CancellationToken cancellationToken)
    {
        var data = await clientManagementDataService.GetClientManagementAsync(cancellationToken);

        return Ok(data);
    }
}
