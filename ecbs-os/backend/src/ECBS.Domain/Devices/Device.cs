using ECBS.Domain.Common;

namespace ECBS.Domain.Devices;

public sealed class Device : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid DeploymentId { get; set; }

    public required string Name { get; set; }

    public required string SerialNumber { get; set; }

    public DeviceKind Kind { get; set; }

    public bool IsMain { get; set; }

    public DateTimeOffset? LastCommunicatedAtUtc { get; set; }
}
