namespace ECBS.Application.ScreenData;

public sealed record ClientManagementData(
    IReadOnlyList<ClientManagementClientRow> Clients,
    IReadOnlyList<ClientManagementKpi> ClientKpis,
    string Message,
    IReadOnlyList<ClientManagementProjectRow> Projects,
    IReadOnlyList<ClientManagementKpi> ProjectKpis,
    ClientManagementSelectedClient SelectedClient,
    string State,
    string UpdatedAt);

public sealed record ClientManagementClientRow(
    string ActiveProjects,
    string ContractNumber,
    string Industry,
    string JoinedDate,
    string Name,
    string Sites,
    string Status,
    string TotalCapacity);

public sealed record ClientManagementKpi(string Detail, string Icon, string Label, string Tone, string Value);

public sealed record ClientManagementProjectRow(
    string Capacity,
    string Location,
    string Name,
    string Progress,
    string SiteType,
    string StartDate,
    string Status,
    string TargetCompletion);

public sealed record ClientManagementSelectedClient(
    string AccountManager,
    string ActiveProjects,
    string Address,
    string AnnualSavings,
    string ClientSince,
    string CompletedProjects,
    string ContractNumber,
    string Currency,
    string Email,
    string Industry,
    string LegalName,
    string Mobile,
    string Name,
    string Phone,
    string PrimaryContactName,
    string PrimaryContactTitle,
    string Status,
    string TaxId,
    string TimeZone,
    string TotalCapacity,
    string TotalSites,
    string Website);
