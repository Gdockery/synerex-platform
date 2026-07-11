namespace ECBS.Application.ScreenData;

public interface IDigitalTwinDataService
{
    Task<DigitalTwinData> GetOchsnerDigitalTwinAsync(CancellationToken cancellationToken = default);
}
