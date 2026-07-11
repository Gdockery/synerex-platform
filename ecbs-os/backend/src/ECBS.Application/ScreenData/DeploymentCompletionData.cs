namespace ECBS.Application.ScreenData;

public sealed record DeploymentCompletionData(
    IReadOnlyList<AnalysisSummaryRow> ClosureCards,
    IReadOnlyList<AnalysisSummaryRow> DocumentRows,
    IReadOnlyList<AnalysisSummaryRow> EquipmentRows,
    IReadOnlyList<AnalysisSummaryRow> IdentityRows,
    string ClientName,
    string DeploymentId,
    string Message,
    string ProjectName,
    string SiteName,
    string State,
    string Status,
    string UpdatedAt);

