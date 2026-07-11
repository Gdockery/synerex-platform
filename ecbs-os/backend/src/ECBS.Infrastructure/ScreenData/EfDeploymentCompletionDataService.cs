using ECBS.Application.ScreenData;
using ECBS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECBS.Infrastructure.ScreenData;

public sealed class EfDeploymentCompletionDataService(
    EcbsDbContext dbContext,
    ILogger<EfDeploymentCompletionDataService> logger)
    : IDeploymentCompletionDataService
{
    public async Task<DeploymentCompletionData> GetDeploymentCompletionAsync(string deploymentId, CancellationToken cancellationToken = default)
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

            var deviceCount = await dbContext.Devices
                .AsNoTracking()
                .CountAsync(row => row.DeploymentId == deployment.Id || row.ProjectId == deployment.ProjectId, cancellationToken);

            var documentCount = await dbContext.Documents
                .AsNoTracking()
                .CountAsync(row => row.ProjectId == deployment.ProjectId, cancellationToken);

            var equipmentRows = await dbContext.Devices
                .AsNoTracking()
                .Where(row => row.DeploymentId == deployment.Id || row.ProjectId == deployment.ProjectId)
                .GroupBy(row => row.Kind)
                .Select(group => new AnalysisSummaryRow(group.Key.ToString(), group.Count().ToString()))
                .ToListAsync(cancellationToken);

            return new DeploymentCompletionData(
                ClosureCards:
                [
                    new("Workflow Progress", "No Data"),
                    new("Tests Passed", "No Data"),
                    new("Documentation", documentCount > 0 ? documentCount.ToString() : "No Data"),
                    new("Readiness", "No Data"),
                ],
                DocumentRows:
                [
                    new("Documents", documentCount > 0 ? documentCount.ToString() : "No Data"),
                    new("Generated Reports", "No Data"),
                    new("Certificates", "No Data"),
                ],
                EquipmentRows: equipmentRows.Count > 0 ? equipmentRows : [new AnalysisSummaryRow("Equipment", deviceCount > 0 ? deviceCount.ToString() : "No Data")],
                IdentityRows:
                [
                    new("Technician", "No Data"),
                    new("Customer Signer", "No Data"),
                    new("Identity Verification", "No Data"),
                    new("Handover Contact", "No Data"),
                ],
                ClientName: client?.Name ?? "No Data",
                DeploymentId: deployment.Name,
                Message: "",
                ProjectName: project?.Name ?? "No Data",
                SiteName: site?.Name ?? project?.FacilityName ?? project?.Location ?? "No Data",
                State: "data",
                Status: deployment.Status ?? "No Data",
                UpdatedAt: deployment.CommissionedOn?.ToString("MMM d, yyyy", System.Globalization.CultureInfo.GetCultureInfo("en-US")) ?? "No Data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Deployment Completion data from ecbs_os.");
            return Empty("ECBS deployment completion data is unavailable.");
        }
    }

    private static DeploymentCompletionData Empty(string message)
    {
        return new DeploymentCompletionData(
            ClosureCards:
            [
                new("Workflow Progress", "No Data"),
                new("Tests Passed", "No Data"),
                new("Documentation", "No Data"),
                new("Readiness", "No Data"),
            ],
            DocumentRows:
            [
                new("Documents", "No Data"),
                new("Generated Reports", "No Data"),
                new("Certificates", "No Data"),
            ],
            EquipmentRows:
            [
                new("Equipment", "No Data"),
            ],
            IdentityRows:
            [
                new("Technician", "No Data"),
                new("Customer Signer", "No Data"),
                new("Identity Verification", "No Data"),
                new("Handover Contact", "No Data"),
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
}

