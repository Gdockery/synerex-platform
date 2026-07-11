namespace ECBS.Application.ScreenData;

public interface IAnalysisDataService
{
    Task<CurrentAnalysisData> GetOchsnerCurrentAnalysisAsync(CancellationToken cancellationToken = default);

    Task<LiveDataScreenData> GetOchsnerLiveDataAsync(CancellationToken cancellationToken = default);
}

