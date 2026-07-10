using ECBS.Domain.Clients;
using ECBS.Domain.ClientManagement;
using ECBS.Domain.Data;
using ECBS.Domain.Deployments;
using ECBS.Domain.Devices;
using ECBS.Domain.Documents;
using ECBS.Domain.Integration;
using ECBS.Domain.Projects;
using ECBS.Domain.Reports;
using ECBS.Domain.Sites;
using ECBS.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace ECBS.Application.Common.Interfaces;

public interface IEcbsDbContext
{
    DbSet<Tenant> Tenants { get; }

    DbSet<Client> Clients { get; }

    DbSet<Site> Sites { get; }

    DbSet<Project> Projects { get; }

    DbSet<ProjectWorkflowDraft> ProjectWorkflowDrafts { get; }

    DbSet<DocumentMetadata> Documents { get; }

    DbSet<ReportRequest> ReportRequests { get; }

    DbSet<SourceMapping> SourceMappings { get; }

    DbSet<Deployment> Deployments { get; }

    DbSet<Device> Devices { get; }

    DbSet<TelemetryInterval> TelemetryIntervals { get; }

    DbSet<ReportRun> ReportRuns { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
