namespace ECBS.Application.ClientManagement;

public sealed record CreateClientCommand(
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? ClientName,
    string? ClientType,
    string? ContactEmail,
    string? ContactMobile,
    string? ContactName,
    string? ContactPhone,
    string? ContactTitle,
    string? ContractNumber,
    string? Country,
    string? Industry,
    string? LegalName,
    string? Notes,
    string? PostalCode,
    string? State,
    string? Status,
    string? TaxId,
    string? Website);

public sealed record SaveProjectDraftCommand(
    string? Description,
    string? FacilityName,
    string? Location,
    string? ProjectManager,
    string? ProjectName,
    string? ProjectType,
    string? RequiredDocumentStatus,
    string? StartDate,
    string? Status,
    string? TargetCompletionDate);

public sealed record CreateReportRequestCommand(
    bool IncludeDetailedCalculations,
    bool IncludeEquipmentRecommendations,
    IReadOnlyList<string>? RequestedReportTypes);

public sealed record ClientManagementCommandResult(Guid Id, string Message, string State);
