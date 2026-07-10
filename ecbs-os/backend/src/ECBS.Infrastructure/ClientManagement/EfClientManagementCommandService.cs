using System.Text.Json;
using ECBS.Application.ClientManagement;
using ECBS.Application.Common.Interfaces;
using ECBS.Domain.ClientManagement;
using ECBS.Domain.Clients;
using ECBS.Domain.Projects;
using ECBS.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace ECBS.Infrastructure.ClientManagement;

public sealed class EfClientManagementCommandService(IEcbsDbContext dbContext) : IClientManagementCommandService
{
    public async Task<ClientManagementCommandResult> CreateClientAsync(CreateClientCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = await GetOrCreateDefaultTenantIdAsync(cancellationToken);
        var clientName = Clean(command.ClientName) ?? "New Client";
        var client = new Client
        {
            TenantId = tenantId,
            Name = clientName,
            AddressLine1 = Clean(command.AddressLine1),
            AddressLine2 = Clean(command.AddressLine2),
            City = Clean(command.City),
            ClientType = Clean(command.ClientType),
            ContractNumber = Clean(command.ContractNumber),
            Country = Clean(command.Country),
            Email = Clean(command.ContactEmail),
            Industry = Clean(command.Industry),
            LegalName = Clean(command.LegalName),
            Mobile = Clean(command.ContactMobile),
            Notes = Clean(command.Notes),
            Phone = Clean(command.ContactPhone),
            PostalCode = Clean(command.PostalCode),
            PrimaryContactName = Clean(command.ContactName),
            PrimaryContactTitle = Clean(command.ContactTitle),
            State = Clean(command.State),
            Status = Clean(command.Status) ?? "Active",
            TaxId = Clean(command.TaxId),
            Website = Clean(command.Website),
        };

        dbContext.Clients.Add(client);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ClientManagementCommandResult(client.Id, "Client saved to ecbs_os.", "saved");
    }

    public async Task<ClientManagementCommandResult> SaveProjectDraftAsync(SaveProjectDraftCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = await GetOrCreateDefaultTenantIdAsync(cancellationToken);
        var client = await GetOrCreateDefaultClientAsync(tenantId, cancellationToken);
        var draftName = Clean(command.ProjectName) ?? "New Project Draft";
        var draft = new ProjectWorkflowDraft
        {
            TenantId = tenantId,
            ClientId = client.Id,
            DraftName = draftName,
            FacilityName = Clean(command.FacilityName),
            Location = Clean(command.Location),
            PayloadJson = JsonSerializer.Serialize(command),
            ProjectManager = Clean(command.ProjectManager),
            ProjectName = Clean(command.ProjectName),
            ProjectType = Clean(command.ProjectType),
            RequiredDocumentStatus = Clean(command.RequiredDocumentStatus) ?? "No uploaded document metadata yet",
            StartDate = ParseDate(command.StartDate),
            Status = Clean(command.Status) ?? "Draft",
            TargetCompletionDate = ParseDate(command.TargetCompletionDate),
        };

        dbContext.ProjectWorkflowDrafts.Add(draft);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ClientManagementCommandResult(draft.Id, "Project draft saved to ecbs_os.", "saved");
    }

    public async Task<ClientManagementCommandResult> CreateReportRequestAsync(CreateReportRequestCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = await GetOrCreateDefaultTenantIdAsync(cancellationToken);
        var client = await GetOrCreateDefaultClientAsync(tenantId, cancellationToken);
        var requestedReportTypes = command.RequestedReportTypes is { Count: > 0 }
            ? string.Join(", ", command.RequestedReportTypes.Select(type => Clean(type)).Where(type => !string.IsNullOrWhiteSpace(type)))
            : "Proposal Report, Site Assessment Report";
        var request = new ReportRequest
        {
            TenantId = tenantId,
            ClientId = client.Id,
            OptionsJson = JsonSerializer.Serialize(new
            {
                command.IncludeDetailedCalculations,
                command.IncludeEquipmentRecommendations,
            }),
            RequestedBy = "ECBS UI",
            RequestedReportTypes = requestedReportTypes,
            Status = "Requested",
        };

        dbContext.ReportRequests.Add(request);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ClientManagementCommandResult(request.Id, "Report request saved to ecbs_os.", "saved");
    }

    private async Task<Guid> GetOrCreateDefaultTenantIdAsync(CancellationToken cancellationToken)
    {
        const string tenantCode = "ecbs";
        var tenant = await dbContext.Tenants.FirstOrDefaultAsync(item => item.Code == tenantCode, cancellationToken);
        if (tenant is not null)
        {
            return tenant.Id;
        }

        tenant = new Tenant
        {
            Code = tenantCode,
            Name = "ECBS",
        };
        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);

        return tenant.Id;
    }

    private async Task<Client> GetOrCreateDefaultClientAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var client = await dbContext.Clients.FirstOrDefaultAsync(item => item.TenantId == tenantId, cancellationToken);
        if (client is not null)
        {
            return client;
        }

        client = new Client
        {
            TenantId = tenantId,
            Name = "ECBS Draft Client",
            Status = "Draft",
        };
        dbContext.Clients.Add(client);
        await dbContext.SaveChangesAsync(cancellationToken);

        return client;
    }

    private static string? Clean(string? value)
    {
        return string.IsNullOrWhiteSpace(value) || value.StartsWith("Enter ", StringComparison.OrdinalIgnoreCase) || value.StartsWith("Select ", StringComparison.OrdinalIgnoreCase)
            ? null
            : value.Trim();
    }

    private static DateOnly? ParseDate(string? value)
    {
        return DateOnly.TryParse(Clean(value), out var date) ? date : null;
    }
}
