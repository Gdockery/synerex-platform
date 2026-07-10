namespace ECBS.Application.ClientManagement;

public interface IClientManagementCommandService
{
    Task<ClientManagementCommandResult> CreateClientAsync(CreateClientCommand command, CancellationToken cancellationToken = default);

    Task<ClientManagementCommandResult> SaveProjectDraftAsync(SaveProjectDraftCommand command, CancellationToken cancellationToken = default);

    Task<ClientManagementCommandResult> CreateReportRequestAsync(CreateReportRequestCommand command, CancellationToken cancellationToken = default);
}
