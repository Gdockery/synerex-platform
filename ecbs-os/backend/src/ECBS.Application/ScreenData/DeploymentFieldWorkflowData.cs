namespace ECBS.Application.ScreenData;

public sealed record DeploymentFieldWorkflowData(
    IReadOnlyList<AnalysisSummaryRow> SummaryRows,
    IReadOnlyList<AnalysisSummaryRow> SiteRows,
    IReadOnlyList<FieldEquipmentRow> EquipmentRows,
    IReadOnlyList<FieldReadingRow> PreReadingRows,
    IReadOnlyList<FieldReadingRow> PostReadingRows,
    IReadOnlyList<DocumentDataRow> DocumentRows,
    string ClientName,
    string DeploymentId,
    string Message,
    string ProjectName,
    string SiteName,
    string State,
    string Status,
    string UpdatedAt);

public sealed record FieldEquipmentRow(
    string Id,
    string Name,
    string Type,
    string SerialNumber,
    string Location,
    string Rating,
    string Status,
    string LastCommunicatedAt);

public sealed record FieldReadingRow(
    string Label,
    string PreValue,
    string PostValue,
    string Delta,
    string Unit,
    string Source);

