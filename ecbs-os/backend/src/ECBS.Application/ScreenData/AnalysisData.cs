namespace ECBS.Application.ScreenData;

public sealed record CurrentAnalysisData(
    IReadOnlyList<AnalysisKpi> Kpis,
    IReadOnlyList<AnalysisTableRow> AssetRows,
    IReadOnlyList<string> Insights,
    string Message,
    string SiteName,
    string State,
    string UpdatedAt);

public sealed record LiveDataScreenData(
    IReadOnlyList<AnalysisKpi> Kpis,
    IReadOnlyList<AnalysisTableRow> PhaseRows,
    IReadOnlyList<AnalysisTableRow> DeviceRows,
    IReadOnlyList<AnalysisTableRow> AlarmRows,
    IReadOnlyList<AnalysisSummaryRow> SystemRows,
    string ClientName,
    string Message,
    string ProjectName,
    string SiteName,
    string State,
    string UpdatedAt);

public sealed record AnalysisKpi(string Detail, string Icon, string Label, string Tone, string Value);

public sealed record AnalysisTableRow(IReadOnlyList<string> Cells);

public sealed record AnalysisSummaryRow(string Label, string Value);

