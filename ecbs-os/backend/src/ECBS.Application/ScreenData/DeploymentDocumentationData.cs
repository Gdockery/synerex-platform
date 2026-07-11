namespace ECBS.Application.ScreenData;

public sealed record DeploymentDocumentationData(
    IReadOnlyList<DocumentDataRow> DocumentRows,
    IReadOnlyList<AnalysisSummaryRow> SummaryRows,
    IReadOnlyList<AnalysisSummaryRow> MetadataRows,
    IReadOnlyList<AnalysisSummaryRow> FolderRows,
    IReadOnlyList<AnalysisSummaryRow> PermissionRows,
    IReadOnlyList<DocumentDataRow> ReviewRows,
    IReadOnlyList<DocumentDataRow> SearchRows,
    IReadOnlyList<DocumentDataRow> VersionRows,
    string ClientName,
    string DeploymentId,
    string Message,
    string ProjectName,
    string SiteName,
    string State,
    string Status,
    string UpdatedAt);

public sealed record DocumentDataRow(
    string Id,
    string Name,
    string Type,
    string Folder,
    string UploadedBy,
    string UploadedAt,
    string Status,
    string Size,
    string StorageUri);

