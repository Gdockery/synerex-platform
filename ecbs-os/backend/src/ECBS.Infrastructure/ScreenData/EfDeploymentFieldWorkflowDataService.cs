using System.Globalization;
using ECBS.Application.ScreenData;
using ECBS.Domain.Projects;
using ECBS.Domain.Sites;
using ECBS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECBS.Infrastructure.ScreenData;

public sealed class EfDeploymentFieldWorkflowDataService(
    EcbsDbContext dbContext,
    ILogger<EfDeploymentFieldWorkflowDataService> logger)
    : IDeploymentFieldWorkflowDataService
{
    public async Task<DeploymentFieldWorkflowData> GetDeploymentFieldWorkflowAsync(string deploymentId, CancellationToken cancellationToken = default)
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

            var equipmentRows = await dbContext.Devices
                .AsNoTracking()
                .Where(row => row.DeploymentId == deployment.Id || row.ProjectId == deployment.ProjectId)
                .OrderBy(row => row.Kind)
                .ThenBy(row => row.Name)
                .Take(50)
                .Select(row => new FieldEquipmentRow(
                    row.Id.ToString(),
                    row.Name,
                    row.Kind.ToString(),
                    row.SerialNumber,
                    "No Data",
                    "No Data",
                    row.IsMain ? "Main" : "No Data",
                    row.LastCommunicatedAtUtc.HasValue ? FormatDateTime(row.LastCommunicatedAtUtc.Value) : "No Data"))
                .ToListAsync(cancellationToken);

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
                    FormatDateTime(row.CreatedAtUtc),
                    row.Status ?? "No Data",
                    "No Data",
                    row.StorageUri ?? "No Data"))
                .ToListAsync(cancellationToken);

            var readings = await dbContext.TelemetryIntervals
                .AsNoTracking()
                .Where(row => row.ProjectId == deployment.ProjectId)
                .OrderBy(row => row.IntervalStartUtc)
                .Select(row => new TelemetrySnapshot(
                    row.IntervalStartUtc,
                    row.Kilowatts,
                    row.KilovoltAmps,
                    row.KilowattHours,
                    row.PowerFactor))
                .ToListAsync(cancellationToken);

            var firstReading = readings.FirstOrDefault();
            var lastReading = readings.LastOrDefault();

            return new DeploymentFieldWorkflowData(
                SummaryRows:
                [
                    new("Equipment", equipmentRows.Count > 0 ? equipmentRows.Count.ToString() : "No Data"),
                    new("Documents", documents.Count > 0 ? documents.Count.ToString() : "No Data"),
                    new("Readings", readings.Count > 0 ? readings.Count.ToString() : "No Data"),
                    new("Checklist", "No Data"),
                ],
                SiteRows: BuildSiteRows(site, project),
                EquipmentRows: equipmentRows.Count > 0 ? equipmentRows : [NoDataEquipment("No scoped ECBS device rows were found.")],
                PreReadingRows: BuildReadingRows(firstReading, lastReading, "pre"),
                PostReadingRows: BuildReadingRows(firstReading, lastReading, "post"),
                DocumentRows: documents.Count > 0 ? documents : [NoDataDocument("No scoped ECBS document metadata was found.")],
                ClientName: client?.Name ?? "No Data",
                DeploymentId: deployment.Name,
                Message: equipmentRows.Count > 0 || documents.Count > 0 || readings.Count > 0 ? "" : "No scoped ECBS field workflow data was found for this deployment project.",
                ProjectName: project?.Name ?? "No Data",
                SiteName: site?.Name ?? project?.FacilityName ?? project?.Location ?? "No Data",
                State: equipmentRows.Count > 0 || documents.Count > 0 || readings.Count > 0 ? "data" : "no-data",
                Status: deployment.Status ?? "No Data",
                UpdatedAt: deployment.CommissionedOn?.ToString("MMM d, yyyy", CultureInfo.GetCultureInfo("en-US")) ?? "No Data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Deployment Field Workflow data from ecbs_os.");
            return Empty("ECBS deployment field workflow data is unavailable.");
        }
    }

    private static IReadOnlyList<AnalysisSummaryRow> BuildSiteRows(Site? site, Project? project)
    {
        return
        [
            new("Site Name", site?.Name ?? project?.FacilityName ?? "No Data"),
            new("Site Number", site?.SiteNumber ?? project?.SiteCode ?? "No Data"),
            new("Address", FormatAddress(site?.AddressLine1, site?.AddressLine2, site?.City, site?.State, site?.PostalCode, site?.Country) ?? FormatAddress(project?.AddressLine1, project?.AddressLine2, project?.City, project?.State, project?.PostalCode, null) ?? project?.Location ?? "No Data"),
            new("Utility", site?.Utility ?? "No Data"),
            new("Time Zone", site?.TimeZone ?? "No Data"),
            new("Status", site?.Status ?? project?.Status ?? "No Data"),
        ];
    }

    private static IReadOnlyList<FieldReadingRow> BuildReadingRows(TelemetrySnapshot? firstReading, TelemetrySnapshot? lastReading, string mode)
    {
        var current = mode == "pre" ? firstReading : lastReading;
        if (current is null)
        {
            return
            [
                new("kW", "No Data", "No Data", "No Data", "kW", "No scoped telemetry rows were found."),
                new("kVA", "No Data", "No Data", "No Data", "kVA", "No scoped telemetry rows were found."),
                new("kWh", "No Data", "No Data", "No Data", "kWh", "No scoped telemetry rows were found."),
                new("Power Factor", "No Data", "No Data", "No Data", "PF", "No scoped telemetry rows were found."),
                new("Voltage", "No Data", "No Data", "No Data", "V", "No approved voltage source exists."),
                new("Frequency", "No Data", "No Data", "No Data", "Hz", "No approved frequency source exists."),
                new("THD", "No Data", "No Data", "No Data", "%", "No approved THD source exists."),
            ];
        }

        return
        [
            BuildReading("kW", firstReading?.Kilowatts, lastReading?.Kilowatts, current.Kilowatts, "kW"),
            BuildReading("kVA", firstReading?.KilovoltAmps, lastReading?.KilovoltAmps, current.KilovoltAmps, "kVA"),
            BuildReading("kWh", firstReading?.KilowattHours, lastReading?.KilowattHours, current.KilowattHours, "kWh"),
            BuildReading("Power Factor", firstReading?.PowerFactor, lastReading?.PowerFactor, current.PowerFactor, "PF"),
            new("Voltage", "No Data", "No Data", "No Data", "V", "No approved voltage source exists."),
            new("Frequency", "No Data", "No Data", "No Data", "Hz", "No approved frequency source exists."),
            new("THD", "No Data", "No Data", "No Data", "%", "No approved THD source exists."),
        ];
    }

    private static FieldReadingRow BuildReading(string label, decimal? first, decimal? last, decimal? current, string unit)
    {
        return new FieldReadingRow(
            label,
            FormatDecimal(first),
            FormatDecimal(last),
            first.HasValue && last.HasValue ? FormatDecimal(last.Value - first.Value) : "No Data",
            unit,
            current.HasValue ? "ecbs_os.telemetry_intervals" : "No Data");
    }

    private static DeploymentFieldWorkflowData Empty(string message)
    {
        return new DeploymentFieldWorkflowData(
            SummaryRows:
            [
                new("Equipment", "No Data"),
                new("Documents", "No Data"),
                new("Readings", "No Data"),
                new("Checklist", "No Data"),
            ],
            SiteRows:
            [
                new("Site Name", "No Data"),
                new("Site Number", "No Data"),
                new("Address", "No Data"),
                new("Utility", "No Data"),
                new("Time Zone", "No Data"),
                new("Status", "No Data"),
            ],
            EquipmentRows:
            [
                NoDataEquipment(message),
            ],
            PreReadingRows: BuildReadingRows(null, null, "pre"),
            PostReadingRows: BuildReadingRows(null, null, "post"),
            DocumentRows:
            [
                NoDataDocument(message),
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

    private static string FormatDateTime(DateTimeOffset value)
    {
        return value.ToString("MMM d, yyyy h:mm tt", CultureInfo.GetCultureInfo("en-US"));
    }

    private static string FormatDecimal(decimal? value)
    {
        return value.HasValue ? value.Value.ToString("0.##", CultureInfo.InvariantCulture) : "No Data";
    }

    private static string? FormatAddress(params string?[] parts)
    {
        var populated = parts.Where(part => !string.IsNullOrWhiteSpace(part)).ToArray();
        return populated.Length == 0 ? null : string.Join(", ", populated);
    }

    private static FieldEquipmentRow NoDataEquipment(string message)
    {
        return new FieldEquipmentRow("No Data", "No Data", "No Data", "No Data", "No Data", "No Data", message, "No Data");
    }

    private static DocumentDataRow NoDataDocument(string message)
    {
        return new DocumentDataRow("No Data", "No Data", "No Data", "No Data", "No Data", "No Data", message, "No Data", "No Data");
    }

    private sealed record TelemetrySnapshot(
        DateTimeOffset IntervalStartUtc,
        decimal? Kilowatts,
        decimal? KilovoltAmps,
        decimal? KilowattHours,
        decimal? PowerFactor);
}

