using ECBS.Domain.Common;

namespace ECBS.Domain.Deployments;

public sealed class Deployment : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ProjectId { get; set; }

    public required string Name { get; set; }

    public DateOnly? CommissionedOn { get; set; }

    public string? Status { get; set; }
}
