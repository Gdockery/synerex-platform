using ECBS.Application.ClientManagement;
using ECBS.Application.ScreenData;
using Microsoft.AspNetCore.Mvc;

namespace ECBS.Api.Controllers;

[ApiController]
[Route("api/v1/client-management")]
public sealed class ClientManagementController(
    IClientManagementCommandService clientManagementCommandService,
    IClientManagementDataService clientManagementDataService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ClientManagementData>> Get(CancellationToken cancellationToken)
    {
        var data = await clientManagementDataService.GetClientManagementAsync(cancellationToken);

        return Ok(data);
    }

    [HttpPost("clients")]
    public async Task<ActionResult<ClientManagementCommandResult>> CreateClient(
        CreateClientCommand command,
        CancellationToken cancellationToken)
    {
        var result = await clientManagementCommandService.CreateClientAsync(command, cancellationToken);

        return Ok(result);
    }

    [HttpPost("projects/drafts")]
    public async Task<ActionResult<ClientManagementCommandResult>> SaveProjectDraft(
        SaveProjectDraftCommand command,
        CancellationToken cancellationToken)
    {
        var result = await clientManagementCommandService.SaveProjectDraftAsync(command, cancellationToken);

        return Ok(result);
    }

    [HttpPost("report-requests")]
    public async Task<ActionResult<ClientManagementCommandResult>> CreateReportRequest(
        CreateReportRequestCommand command,
        CancellationToken cancellationToken)
    {
        var result = await clientManagementCommandService.CreateReportRequestAsync(command, cancellationToken);

        return Ok(result);
    }
}
