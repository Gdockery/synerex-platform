namespace ECBS.Application.ScreenData;

public sealed record CapacityIntelligenceData(
    string AnnualBenefit,
    IReadOnlyList<CapacityIntelligenceAsset> Assets,
    double AvailableKva,
    string AvoidedUpgrade,
    IReadOnlyList<CapacityCallout> Callouts,
    double CapacityHealthScore,
    string Co2Tons,
    string DateRange,
    double DeferredCapitalValue,
    double HiddenKva,
    double InstalledKva,
    string KeyInsight,
    IReadOnlyList<CapacityKpi> Kpis,
    double LoadKva,
    double RecoveredKva,
    double RecoveredPct,
    string SiteName,
    string State,
    IReadOnlyList<CapacitySubScore> SubScores,
    IReadOnlyList<CapacityTrendPoint> Trend,
    string UpdatedAt,
    double UtilizationPct);

public sealed record CapacityIntelligenceAsset(
    string AvailableKva,
    string ConnectedKva,
    string Health,
    string Name,
    string RecoveredKva,
    string Sparkline,
    string Type,
    string UtilizedKva,
    string UtilizationPct,
    double UtilizationValue);

public sealed record CapacityCallout(string Icon, string Label, string Value);

public sealed record CapacityKpi(string Color, string Detail, string Icon, string Label, string Value);

public sealed record CapacitySubScore(string Label, int Value);

public sealed record CapacityTrendPoint(double Available, double Installed, string Label, double Used);

public sealed record CapacityRecoveryBreakdownData(
    string AfterOverCapacity,
    string AfterPeak,
    string BeforeOverCapacity,
    string BeforePeak,
    IReadOnlyList<CapacityRecoveryBarRow> ContributionRows,
    IReadOnlyList<CapacityRecoveryEventRow> EventRows,
    IReadOnlyList<CapacityKpi> Kpis,
    string Message,
    IReadOnlyList<CapacityRecoveryDonutRow> RecoveryByAssetType,
    string RecoveryPercent,
    IReadOnlyList<CapacityRecoverySummaryRow> SummaryRows,
    string State,
    IReadOnlyList<CapacityRecoveryTableRow> TimePeriodRows,
    IReadOnlyList<CapacityRecoveryTrendPoint> Trend,
    string UpdatedAt);

public sealed record CapacityRecoveryBarRow(string Color, string Label, string Percent, string Value);

public sealed record CapacityRecoveryDonutRow(string Color, string Label, string Value);

public sealed record CapacityRecoveryEventRow(string Color, string Date, string Event, string Icon, string Impact, string Recovered, string System);

public sealed record CapacityRecoverySummaryRow(string Label, string Value);

public sealed record CapacityRecoveryTableRow(string AvgKva, string Consistency, string MaxKva, string TimePeriod);

public sealed record CapacityRecoveryTrendPoint(double BaselineUsed, string Label, double Recovered, double Used);

public sealed record CapacityHealthDiagnosticsData(
    IReadOnlyList<CapacityHealthAssetBar> AssetBars,
    IReadOnlyList<CapacityHealthDiagnosticCard> Diagnostics,
    IReadOnlyList<CapacityRecoveryDonutRow> Distribution,
    IReadOnlyList<CapacityKpi> Kpis,
    string Message,
    IReadOnlyList<CapacityHealthIssueRow> Issues,
    IReadOnlyList<string> Recommendations,
    string State,
    IReadOnlyList<CapacityRecoverySummaryRow> SummaryRows,
    IReadOnlyList<CapacityHealthTrendPoint> Trend,
    string UpdatedAt);

public sealed record CapacityHealthAssetBar(string Color, string Label, int Value);

public sealed record CapacityHealthDiagnosticCard(
    IReadOnlyList<CapacityRecoverySummaryRow> Factors,
    int Score,
    string Status,
    string Title,
    string Tone);

public sealed record CapacityHealthIssueRow(string Asset, string Impact, string Issue, string Recommendation, string Severity);

public sealed record CapacityHealthTrendPoint(string Label, int Score);
