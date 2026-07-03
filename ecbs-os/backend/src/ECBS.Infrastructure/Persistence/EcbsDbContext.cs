using ECBS.Application.Common.Interfaces;
using ECBS.Domain.Clients;
using ECBS.Domain.Data;
using ECBS.Domain.Deployments;
using ECBS.Domain.Devices;
using ECBS.Domain.Projects;
using ECBS.Domain.Reports;
using ECBS.Domain.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace ECBS.Infrastructure.Persistence;

public sealed class EcbsDbContext(DbContextOptions<EcbsDbContext> options)
    : DbContext(options), IEcbsDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<Client> Clients => Set<Client>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<Deployment> Deployments => Set<Deployment>();

    public DbSet<Device> Devices => Set<Device>();

    public DbSet<TelemetryInterval> TelemetryIntervals => Set<TelemetryInterval>();

    public DbSet<ReportRun> ReportRuns => Set<ReportRun>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Code).HasMaxLength(80).IsRequired();
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.ToTable("clients");
            entity.HasIndex(x => new { x.TenantId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.ExternalReference).HasMaxLength(120);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("projects");
            entity.HasIndex(x => new { x.TenantId, x.ClientId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.SiteCode).HasMaxLength(80);
            entity.Property(x => x.AddressLine1).HasMaxLength(240);
            entity.Property(x => x.AddressLine2).HasMaxLength(240);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.State).HasMaxLength(80);
            entity.Property(x => x.PostalCode).HasMaxLength(24);
        });

        modelBuilder.Entity<Deployment>(entity =>
        {
            entity.ToTable("deployments");
            entity.HasIndex(x => new { x.TenantId, x.ProjectId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(80);
        });

        modelBuilder.Entity<Device>(entity =>
        {
            entity.ToTable("devices");
            entity.HasIndex(x => new { x.TenantId, x.ProjectId, x.SerialNumber }).IsUnique();
            entity.HasIndex(x => new { x.TenantId, x.ProjectId, x.IsMain });
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.SerialNumber).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Kind).HasConversion<string>().HasMaxLength(40).IsRequired();
        });

        modelBuilder.Entity<TelemetryInterval>(entity =>
        {
            entity.ToTable("telemetry_intervals");
            entity.HasIndex(x => new { x.TenantId, x.ProjectId, x.DeviceId, x.IntervalStartUtc }).IsUnique();
            entity.Property(x => x.Kilowatts).HasPrecision(18, 6);
            entity.Property(x => x.KilovoltAmps).HasPrecision(18, 6);
            entity.Property(x => x.KilowattHours).HasPrecision(18, 6);
            entity.Property(x => x.PowerFactor).HasPrecision(18, 6);
        });

        modelBuilder.Entity<ReportRun>(entity =>
        {
            entity.ToTable("report_runs");
            entity.HasIndex(x => new { x.TenantId, x.ProjectId, x.ReportType, x.GeneratedAtUtc });
            entity.Property(x => x.ReportType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.StorageUri).HasMaxLength(1024);
        });
    }
}
