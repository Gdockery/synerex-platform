using ECBS.Domain.Common;

namespace ECBS.Domain.Data;

public sealed class TelemetryInterval : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public Guid DeviceId { get; set; }

    public DateTimeOffset IntervalStartUtc { get; set; }

    public decimal? Kilowatts { get; set; }

    public decimal? KilovoltAmps { get; set; }

    public decimal? KilowattHours { get; set; }

    public decimal? PowerFactor { get; set; }
}
