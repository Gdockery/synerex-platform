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
