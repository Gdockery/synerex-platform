namespace ECBS.Application.ScreenData;

public interface ICapacityIntelligenceDataService
{
    Task<CapacityIntelligenceData> GetOchsnerCapacityIntelligenceAsync(CancellationToken cancellationToken = default);

    Task<CapacityHealthDiagnosticsData> GetOchsnerHealthDiagnosticsAsync(CancellationToken cancellationToken = default);

    Task<CapacityRecoveryBreakdownData> GetOchsnerRecoveryBreakdownAsync(CancellationToken cancellationToken = default);

    Task<CapacityUtilizationTrendData> GetOchsnerUtilizationTrendAsync(CancellationToken cancellationToken = default);
}
