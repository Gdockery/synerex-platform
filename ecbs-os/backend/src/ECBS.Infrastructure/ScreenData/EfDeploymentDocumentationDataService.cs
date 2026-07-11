using System.Globalization;
using ECBS.Application.ScreenData;
using ECBS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECBS.Infrastructure.ScreenData;

public sealed class EfDeploymentDocumentationDataService(
    EcbsDbContext dbContext,
    ILogger<EfDeploymentDocumentationDataService> logger)
    : IDeploymentDocumentationDataService
{
    public async Task<DeploymentDocumentationData> GetDeploymentDocumentationAsync(string deploymentId, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(deploymentId, out var deploymentGuid))
        {
            return Empty($"No ECBS deployment record was found for route deploymentId '{deploymentId}'.");
        }

        try
        {
            var deployment = await dbContext.Deployments
                .AsNoTracking()
                .FirstOrDefaultAsync(row => row.Id == deploymentGuid, cancellationToken);

            if (deployment is null)
            {
                return Empty($"No ECBS deployment record was found for route deploymentId '{deploymentId}'.");
            }

            var project = await dbContext.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(row => row.Id == deployment.ProjectId, cancellationToken);

            var client = project is null
                ? null
                : await dbContext.Clients
                    .AsNoTracking()
                    .FirstOrDefaultAsync(row => row.Id == project.ClientId, cancellationToken);

            var site = project?.SiteId is null
                ? null
                : await dbContext.Sites
                    .AsNoTracking()
                    .FirstOrDefaultAsync(row => row.Id == project.SiteId, cancellationToken);

            var documents = await dbContext.Documents
                .AsNoTracking()
                .Where(row => row.ProjectId == deployment.ProjectId)
                .OrderByDescending(row => row.CreatedAtUtc)
                .Take(50)
                .Select(row => new DocumentDataRow(
                    row.Id.ToString(),
                    row.FileName ?? "No Data",
                    row.DocumentType,
                    "No Data",
                    row.UploadedBy ?? "No Data",
                    FormatDate(row.CreatedAtUtc),
                    row.Status ?? "No Data",
                    "No Data",
                    row.StorageUri ?? "No Data"))
                .ToListAsync(cancellationToken);

            var documentRows = documents.Count > 0 ? documents : [NoDataDocument("No scoped ECBS document metadata was found.")];
            var searchRows = documents
                .Where(row => row.Name.Contains("permit", StringComparison.OrdinalIgnoreCase) || row.Type.Contains("permit", StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (searchRows.Count == 0)
            {
                searchRows = [NoDataDocument("No scoped ECBS document metadata matched the approved search term.")];
            }

            return new DeploymentDocumentationData(
                DocumentRows: documentRows,
                SummaryRows:
                [
                    new("Documents", documents.Count > 0 ? documents.Count.ToString() : "No Data"),
                    new("Folders", "No Data"),
                    new("Pending Reviews", "No Data"),
                    new("Storage Used", "No Data"),
                ],
                MetadataRows: BuildMetadataRows(documents.FirstOrDefault()),
                FolderRows:
                [
                    new("Folders", "No Data"),
                    new("Folder Model", "No Data"),
                    new("Folder Permissions", "No Data"),
                    new("Folder Size", "No Data"),
                ],
                PermissionRows:
                [
                    new("Users", "No Data"),
                    new("Roles", "No Data"),
                    new("Access Levels", "No Data"),
                    new("Audit Trail", "No Data"),
                ],
                ReviewRows:
                [
                    NoDataDocument("No approved document review workflow model exists."),
                ],
                SearchRows: searchRows,
                VersionRows:
                [
                    NoDataDocument("No approved document version history model exists."),
                ],
                ClientName: client?.Name ?? "No Data",
                DeploymentId: deployment.Name,
                Message: documents.Count > 0 ? "" : "No scoped ECBS document metadata was found for this deployment project.",
                ProjectName: project?.Name ?? "No Data",
                SiteName: site?.Name ?? project?.FacilityName ?? project?.Location ?? "No Data",
                State: documents.Count > 0 ? "data" : "no-data",
                Status: deployment.Status ?? "No Data",
                UpdatedAt: deployment.CommissionedOn?.ToString("MMM d, yyyy", CultureInfo.GetCultureInfo("en-US")) ?? "No Data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Deployment Documentation data from ecbs_os.");
            return Empty("ECBS deployment documentation data is unavailable.");
        }
    }

    private static IReadOnlyList<AnalysisSummaryRow> BuildMetadataRows(DocumentDataRow? document)
    {
        if (document is null || document.Name == "No Data")
        {
            return
            [
                new("Type", "No Data"),
                new("Status", "No Data"),
                new("Folder", "No Data"),
                new("Uploaded By", "No Data"),
                new("Date Uploaded", "No Data"),
                new("Last Modified", "No Data"),
                new("Size", "No Data"),
                new("Storage URI", "No Data"),
            ];
        }

        return
        [
            new("Type", document.Type),
            new("Status", document.Status),
            new("Folder", document.Folder),
            new("Uploaded By", document.UploadedBy),
            new("Date Uploaded", document.UploadedAt),
            new("Last Modified", "No Data"),
            new("Size", document.Size),
            new("Storage URI", document.StorageUri),
        ];
    }

    private static DeploymentDocumentationData Empty(string message)
    {
        return new DeploymentDocumentationData(
            DocumentRows:
            [
                NoDataDocument(message),
            ],
            SummaryRows:
            [
                new("Documents", "No Data"),
                new("Folders", "No Data"),
                new("Pending Reviews", "No Data"),
                new("Storage Used", "No Data"),
            ],
            MetadataRows: BuildMetadataRows(null),
            FolderRows:
            [
                new("Folders", "No Data"),
                new("Folder Model", "No Data"),
                new("Folder Permissions", "No Data"),
                new("Folder Size", "No Data"),
            ],
            PermissionRows:
            [
                new("Users", "No Data"),
                new("Roles", "No Data"),
                new("Access Levels", "No Data"),
                new("Audit Trail", "No Data"),
            ],
            ReviewRows:
            [
                NoDataDocument("No approved document review workflow model exists."),
            ],
            SearchRows:
            [
                NoDataDocument("No scoped ECBS document metadata matched the approved search term."),
            ],
            VersionRows:
            [
                NoDataDocument("No approved document version history model exists."),
            ],
            ClientName: "No Data",
            DeploymentId: "No Data",
            Message: message,
            ProjectName: "No Data",
            SiteName: "No Data",
            State: "no-data",
            Status: "No Data",
            UpdatedAt: "No Data");
    }

    private static string FormatDate(DateTimeOffset value)
    {
        return value.ToString("MMM d, yyyy h:mm tt", CultureInfo.GetCultureInfo("en-US"));
    }

    private static DocumentDataRow NoDataDocument(string message)
    {
        return new DocumentDataRow(
            "No Data",
            "No Data",
            "No Data",
            "No Data",
            "No Data",
            "No Data",
            message,
            "No Data",
            "No Data");
    }
}

