namespace ECBS.Application.ScreenData;

public sealed record AlarmEventsData(
    IReadOnlyList<AlarmEventsActiveAlert> ActiveAlerts,
    IReadOnlyList<AlarmEventsCategory> Categories,
    double CbiScore,
    double? CompliancePct,
    string? Message,
    IReadOnlyList<AlarmEventsMetric> Metrics,
    IReadOnlyList<AlarmEventsNotification> Notifications,
    IReadOnlyList<IReadOnlyList<int>> PriorityMatrix,
    IReadOnlyList<int> ResponseBars,
    double? ResponseMinutes,
    IReadOnlyList<AlarmEventsCategory> Severity,
    string State,
    IReadOnlyList<AlarmEventsStatusBar> StatusBars,
    int TotalAlerts,
    IReadOnlyList<AlarmEventsTrendPoint> Trend,
    string UpdatedAt);

public sealed record AlarmEventsActiveAlert(
    string Action,
    string Category,
    string Device,
    string Duration,
    string Name,
    string Severity,
    string Status,
    string Triggered);

public sealed record AlarmEventsCategory(string Color, string Label, string Pct, int Value);

public sealed record AlarmEventsMetric(
    string Accent,
    string Detail,
    string Icon,
    string Label,
    string Subdetail,
    string Value);

public sealed record AlarmEventsNotification(string Label, int Value);

public sealed record AlarmEventsStatusBar(int Active, int Acknowledged, string Label, int Resolved);

public sealed record AlarmEventsTrendPoint(int Critical, int Info, string Label, int Warning);
