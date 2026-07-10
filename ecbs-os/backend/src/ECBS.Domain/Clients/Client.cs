using ECBS.Domain.Common;

namespace ECBS.Domain.Clients;

public sealed class Client : BaseEntity
{
    public Guid TenantId { get; set; }

    public required string Name { get; set; }

    public string? ExternalReference { get; set; }

    public string? LegalName { get; set; }

    public string? ContractNumber { get; set; }

    public string? Industry { get; set; }

    public string? ClientType { get; set; }

    public string? Status { get; set; }

    public string? Website { get; set; }

    public string? TaxId { get; set; }

    public string? PrimaryContactName { get; set; }

    public string? PrimaryContactTitle { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Mobile { get; set; }

    public string? AddressLine1 { get; set; }

    public string? AddressLine2 { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }

    public string? Notes { get; set; }

    public string? LogoStorageUri { get; set; }
}
