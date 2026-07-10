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

public sealed record AlarmDetailData(
    string AlarmId,
    IReadOnlyList<AlarmDetailKeyValue> DemandStats,
    IReadOnlyList<AlarmDetailKeyValue> ImpactRows,
    string Message,
    string PriorityLabel,
    IReadOnlyList<AlarmDetailRecommendation> RecommendedActions,
    IReadOnlyList<AlarmDetailRelatedAlarm> RelatedAlarms,
    string State,
    string Status,
    IReadOnlyList<AlarmDetailTile> SummaryTiles,
    IReadOnlyList<AlarmDetailTimelineItem> Timeline,
    string Title,
    IReadOnlyList<AlarmDetailTriggerCondition> TriggerConditions,
    string TriggeredAt,
    string UpdatedAt);

public sealed record AlarmDetailKeyValue(string Label, string Value);

public sealed record AlarmDetailRecommendation(string Text);

public sealed record AlarmDetailRelatedAlarm(string Date, string Duration, string Icon, string Label);

public sealed record AlarmDetailTile(string Color, string Detail, string Icon, string Title, string Value);

public sealed record AlarmDetailTimelineItem(string Color, string Detail, string Time, string Title);

public sealed record AlarmDetailTriggerCondition(
    string ActualValue,
    string Condition,
    string Duration,
    string Parameter,
    string Status,
    string Threshold);
