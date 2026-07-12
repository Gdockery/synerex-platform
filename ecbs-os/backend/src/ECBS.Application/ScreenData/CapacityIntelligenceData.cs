namespace ECBS.Application.ScreenData;

public sealed record CapacityIntelligenceData(
    string AnnualBenefit,
    double AnnualSavingsValue,
    string ActivationDate,
    IReadOnlyList<CapacityIntelligenceAsset> Assets,
    double AvailableKva,
    string AvoidedUpgrade,
    IReadOnlyList<CapacityCallout> Callouts,
    double CapacityHealthScore,
    string Co2Tons,
    string CumulativeSavingsModel,
    string CumulativeSavingsSinceActivation,
    string DateRange,
    double DeferredCapitalValue,
    double DemandSavingsValue,
    double HiddenKva,
    double InstalledKva,
    string KeyInsight,
    IReadOnlyList<CapacityKpi> Kpis,
    double LoadKva,
    double RecoveredKva,
    double RecoveredPct,
    double PaybackYears,
    double ProjectCost,
    double RoiPct,
    IReadOnlyList<EnergySavingsBreakdownRow> SavingsWaterfallRows,
    double SavingsPerDay,
    double SavingsPerHour,
    double SavingsPerMinute,
    double SavingsPerMonth,
    string SavingsThisMonth,
    string SavingsThisYear,
    string SavingsToday,
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

public sealed record EnergySavingsBreakdownRow(string Detail, string Label, string Value);

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

public sealed record CapacityUtilizationTrendData(
    IReadOnlyList<CapacityTrendBenchmarkRow> Benchmarks,
    IReadOnlyList<CapacityTrendDailyRow> DailyRows,
    IReadOnlyList<CapacityRecoveryDonutRow> Distribution,
    CapacityTrendForecast Forecast,
    IReadOnlyList<CapacityTrendHeatmapCell> Heatmap,
    IReadOnlyList<string> HeatmapDays,
    IReadOnlyList<string> HeatmapHours,
    IReadOnlyList<CapacityKpi> Kpis,
    string Message,
    IReadOnlyList<CapacityTrendPeakEvent> PeakEvents,
    IReadOnlyList<string> Recommendations,
    string State,
    IReadOnlyList<CapacityRecoverySummaryRow> SummaryRows,
    IReadOnlyList<CapacityUtilizationTrendPoint> Trend,
    string UpdatedAt);

public sealed record CapacityTrendBenchmarkRow(string Color, string Label, string Value);

public sealed record CapacityTrendDailyRow(
    string AverageUtilization,
    string Color,
    string Date,
    string MaxKva,
    string MinKva,
    string OffPeakUtilization,
    string PeakUtilization,
    string TimeOver80);

public sealed record CapacityTrendForecast(string DeltaLabel, string ProjectedUtilization, IReadOnlyList<CapacityHealthTrendPoint> Points);

public sealed record CapacityTrendHeatmapCell(int Column, int Row, double Value);

public sealed record CapacityTrendPeakEvent(string Duration, string Kva, string Rank, string Timestamp, string Utilization);

public sealed record CapacityUtilizationTrendPoint(double Available, double Connected, string Label, double UtilizationPct, double Used);
