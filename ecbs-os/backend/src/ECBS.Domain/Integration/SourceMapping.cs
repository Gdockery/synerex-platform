using ECBS.Domain.Common;

namespace ECBS.Domain.Integration;

public sealed class SourceMapping : BaseEntity
{
    public required string EcbsEntityType { get; set; }

    public Guid EcbsEntityId { get; set; }

    public required string SourceSystem { get; set; }

    public string? SourceDatabase { get; set; }

    public string? SourceTable { get; set; }

    public string? SourceId { get; set; }

    public string? SyncStatus { get; set; }

    public DateTimeOffset? SyncedAtUtc { get; set; }
}
