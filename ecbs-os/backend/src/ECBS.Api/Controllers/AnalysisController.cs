using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
public sealed class AnalysisController(IAnalysisDataService analysisDataService) : ControllerBase
{
    [HttpGet("api/v1/engineering/current-analysis")]
    public async Task<ActionResult<CurrentAnalysisData>> GetCurrentAnalysis(CancellationToken cancellationToken)
    {
        var data = await analysisDataService.GetOchsnerCurrentAnalysisAsync(cancellationToken);

        return Ok(data);
    }

    [HttpGet("api/v1/telemetry")]
    public async Task<ActionResult<LiveDataScreenData>> GetLiveData(CancellationToken cancellationToken)
    {
        var data = await analysisDataService.GetOchsnerLiveDataAsync(cancellationToken);

        return Ok(data);
    }
}

