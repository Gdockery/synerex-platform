using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/digital-twin")]
public sealed class DigitalTwinController(IDigitalTwinDataService digitalTwinDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DigitalTwinData>> Get(CancellationToken cancellationToken)
    {
        var data = await digitalTwinDataService.GetOchsnerDigitalTwinAsync(cancellationToken);

        return Ok(data);
    }
}
