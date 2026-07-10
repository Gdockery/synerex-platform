namespace ECBS.Application.ScreenData;

public interface ICapacityIntelligenceDataService
{
    Task<CapacityIntelligenceData> GetOchsnerCapacityIntelligenceAsync(CancellationToken cancellationToken = default);
}
