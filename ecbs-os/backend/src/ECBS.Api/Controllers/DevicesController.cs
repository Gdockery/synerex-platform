using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/devices")]
public sealed class DevicesController(IDevicesDataService devicesDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DevicesData>> GetDevices(CancellationToken cancellationToken)
    {
        var data = await devicesDataService.GetDevicesAsync(cancellationToken);

        return Ok(data);
    }
}

