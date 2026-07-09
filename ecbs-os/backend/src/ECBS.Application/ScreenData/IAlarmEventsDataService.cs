namespace ECBS.Application.ScreenData;

public interface IAlarmEventsDataService
{
    Task<AlarmEventsData> GetOchsnerAlarmEventsAsync(CancellationToken cancellationToken = default);
}
