using ECBS.Domain.Common;

namespace ECBS.Domain.Projects;

public sealed class Project : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ClientId { get; set; }

    public required string Name { get; set; }

    public string? SiteCode { get; set; }

    public string? AddressLine1 { get; set; }

    public string? AddressLine2 { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? PostalCode { get; set; }
}
