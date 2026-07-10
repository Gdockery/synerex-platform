using ECBS.Domain.Common;

namespace ECBS.Domain.Sites;

public sealed class Site : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ClientId { get; set; }

    public required string Name { get; set; }

    public string? SiteNumber { get; set; }

    public string? AddressLine1 { get; set; }

    public string? AddressLine2 { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }

    public string? TimeZone { get; set; }

    public string? Utility { get; set; }

    public string? Status { get; set; }

    public string? Notes { get; set; }
}
