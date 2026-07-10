namespace ECBS.Application.ScreenData;

public interface IClientManagementDataService
{
    Task<ClientManagementData> GetClientManagementAsync(CancellationToken cancellationToken = default);
}
