namespace ECBS.Application.ScreenData;

public interface IAlarmEventsDataService
{
    Task<AlarmDetailData> GetOchsnerAlarmDetailAsync(CancellationToken cancellationToken = default);

    Task<AlarmEventsData> GetOchsnerAlarmEventsAsync(CancellationToken cancellationToken = default);
}
