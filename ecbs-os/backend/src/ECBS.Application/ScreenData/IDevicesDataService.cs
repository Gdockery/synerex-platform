namespace ECBS.Application.ScreenData;

public interface IDevicesDataService
{
    Task<DevicesData> GetDevicesAsync(CancellationToken cancellationToken = default);
}

