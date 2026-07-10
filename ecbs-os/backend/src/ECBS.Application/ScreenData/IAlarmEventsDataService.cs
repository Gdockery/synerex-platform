namespace ECBS.Application.ScreenData;

public interface IAlarmEventsDataService
{
    Task<ConfigureAlertRuleData> GetOchsnerConfigureAlertRuleAsync(CancellationToken cancellationToken = default);

    Task<AlarmDetailData> GetOchsnerAlarmDetailAsync(CancellationToken cancellationToken = default);

    Task<AlarmEventsData> GetOchsnerAlarmEventsAsync(CancellationToken cancellationToken = default);

    Task<SetNotificationsData> GetOchsnerSetNotificationsAsync(CancellationToken cancellationToken = default);
}
