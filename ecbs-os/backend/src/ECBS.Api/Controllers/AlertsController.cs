using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/alerts")]
public sealed class AlertsController(IAlarmEventsDataService alarmEventsDataService) : ControllerBase
{
    [HttpGet("alarm-events")]
    public async Task<ActionResult<AlarmEventsData>> GetAlarmEvents(CancellationToken cancellationToken)
    {
        var data = await alarmEventsDataService.GetOchsnerAlarmEventsAsync(cancellationToken);

        return Ok(data);
    }
}
