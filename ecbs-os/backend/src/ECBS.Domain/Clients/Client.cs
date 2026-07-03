using ECBS.Domain.Common;

namespace ECBS.Domain.Clients;

public sealed class Client : BaseEntity
{
    public Guid TenantId { get; set; }

    public required string Name { get; set; }

    public string? ExternalReference { get; set; }
}
