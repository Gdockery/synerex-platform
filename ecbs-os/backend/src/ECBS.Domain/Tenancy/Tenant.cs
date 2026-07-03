using ECBS.Domain.Common;

namespace ECBS.Domain.Tenancy;

public sealed class Tenant : BaseEntity
{
    public required string Name { get; set; }

    public required string Code { get; set; }
}
