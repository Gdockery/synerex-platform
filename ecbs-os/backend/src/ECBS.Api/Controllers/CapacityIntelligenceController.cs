using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/capacity-intelligence")]
public sealed class CapacityIntelligenceController(ICapacityIntelligenceDataService capacityIntelligenceDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CapacityIntelligenceData>> Get(CancellationToken cancellationToken)
    {
        var data = await capacityIntelligenceDataService.GetOchsnerCapacityIntelligenceAsync(cancellationToken);

        return Ok(data);
    }
}
