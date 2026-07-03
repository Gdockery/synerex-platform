using ECBS.Domain.Clients;
using ECBS.Domain.Data;
using ECBS.Domain.Deployments;
using ECBS.Domain.Devices;
using ECBS.Domain.Projects;
using ECBS.Domain.Reports;
using ECBS.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace ECBS.Application.Common.Interfaces;

public interface IEcbsDbContext
{
    DbSet<Tenant> Tenants { get; }

    DbSet<Client> Clients { get; }

    DbSet<Project> Projects { get; }

    DbSet<Deployment> Deployments { get; }

    DbSet<Device> Devices { get; }

    DbSet<TelemetryInterval> TelemetryIntervals { get; }

    DbSet<ReportRun> ReportRuns { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
