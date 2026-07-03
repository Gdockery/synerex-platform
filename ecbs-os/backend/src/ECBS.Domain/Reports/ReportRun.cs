using ECBS.Domain.Common;

namespace ECBS.Domain.Reports;

public sealed class ReportRun : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public required string ReportType { get; set; }

    public DateTimeOffset GeneratedAtUtc { get; set; }

    public string? StorageUri { get; set; }
}
