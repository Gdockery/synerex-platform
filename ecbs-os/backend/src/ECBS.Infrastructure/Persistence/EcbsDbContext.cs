using ECBS.Application.Common.Interfaces;
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

namespace ECBS.Infrastructure.Persistence;

public sealed class EcbsDbContext(DbContextOptions<EcbsDbContext> options)
    : DbContext(options), IEcbsDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<Client> Clients => Set<Client>();

    public DbSet<Site> Sites => Set<Site>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ProjectWorkflowDraft> ProjectWorkflowDrafts => Set<ProjectWorkflowDraft>();

    public DbSet<DocumentMetadata> Documents => Set<DocumentMetadata>();

    public DbSet<ReportRequest> ReportRequests => Set<ReportRequest>();

    public DbSet<SourceMapping> SourceMappings => Set<SourceMapping>();

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
            entity.Property(x => x.LegalName).HasMaxLength(200);
            entity.Property(x => x.ContractNumber).HasMaxLength(120);
            entity.Property(x => x.Industry).HasMaxLength(120);
            entity.Property(x => x.ClientType).HasMaxLength(120);
            entity.Property(x => x.Status).HasMaxLength(80);
            entity.Property(x => x.Website).HasMaxLength(240);
            entity.Property(x => x.TaxId).HasMaxLength(120);
            entity.Property(x => x.PrimaryContactName).HasMaxLength(160);
            entity.Property(x => x.PrimaryContactTitle).HasMaxLength(160);
            entity.Property(x => x.Email).HasMaxLength(240);
            entity.Property(x => x.Phone).HasMaxLength(80);
            entity.Property(x => x.Mobile).HasMaxLength(80);
            entity.Property(x => x.AddressLine1).HasMaxLength(240);
            entity.Property(x => x.AddressLine2).HasMaxLength(240);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.State).HasMaxLength(80);
            entity.Property(x => x.PostalCode).HasMaxLength(24);
            entity.Property(x => x.Country).HasMaxLength(80);
            entity.Property(x => x.LogoStorageUri).HasMaxLength(1024);
        });

        modelBuilder.Entity<Site>(entity =>
        {
            entity.ToTable("sites");
            entity.HasIndex(x => new { x.TenantId, x.ClientId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.SiteNumber).HasMaxLength(100);
            entity.Property(x => x.AddressLine1).HasMaxLength(240);
            entity.Property(x => x.AddressLine2).HasMaxLength(240);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.State).HasMaxLength(80);
            entity.Property(x => x.PostalCode).HasMaxLength(24);
            entity.Property(x => x.Country).HasMaxLength(80);
            entity.Property(x => x.TimeZone).HasMaxLength(120);
            entity.Property(x => x.Utility).HasMaxLength(200);
            entity.Property(x => x.Status).HasMaxLength(80);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("projects");
            entity.HasIndex(x => new { x.TenantId, x.ClientId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.SiteCode).HasMaxLength(80);
            entity.Property(x => x.ProjectType).HasMaxLength(120);
            entity.Property(x => x.FacilityName).HasMaxLength(200);
            entity.Property(x => x.Location).HasMaxLength(240);
            entity.Property(x => x.ProjectManager).HasMaxLength(160);
            entity.Property(x => x.Status).HasMaxLength(80);
            entity.Property(x => x.AddressLine1).HasMaxLength(240);
            entity.Property(x => x.AddressLine2).HasMaxLength(240);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.State).HasMaxLength(80);
            entity.Property(x => x.PostalCode).HasMaxLength(24);
        });

        modelBuilder.Entity<ProjectWorkflowDraft>(entity =>
        {
            entity.ToTable("project_workflow_drafts");
            entity.HasIndex(x => new { x.TenantId, x.ClientId, x.CreatedAtUtc });
            entity.Property(x => x.DraftName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.ProjectName).HasMaxLength(200);
            entity.Property(x => x.ProjectType).HasMaxLength(120);
            entity.Property(x => x.FacilityName).HasMaxLength(200);
            entity.Property(x => x.Location).HasMaxLength(240);
            entity.Property(x => x.ProjectManager).HasMaxLength(160);
            entity.Property(x => x.Status).HasMaxLength(80);
            entity.Property(x => x.RequiredDocumentStatus).HasMaxLength(120);
            entity.Property(x => x.PayloadJson).HasColumnType("json");
        });

        modelBuilder.Entity<DocumentMetadata>(entity =>
        {
            entity.ToTable("documents");
            entity.HasIndex(x => new { x.TenantId, x.ClientId, x.ProjectId });
            entity.Property(x => x.DocumentType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.FileName).HasMaxLength(240);
            entity.Property(x => x.StorageUri).HasMaxLength(1024);
            entity.Property(x => x.Status).HasMaxLength(80);
            entity.Property(x => x.UploadedBy).HasMaxLength(160);
        });

        modelBuilder.Entity<ReportRequest>(entity =>
        {
            entity.ToTable("report_requests");
            entity.HasIndex(x => new { x.TenantId, x.ClientId, x.CreatedAtUtc });
            entity.Property(x => x.RequestedReportTypes).HasMaxLength(240).IsRequired();
            entity.Property(x => x.OptionsJson).HasColumnType("json");
            entity.Property(x => x.Status).HasMaxLength(80);
            entity.Property(x => x.RequestedBy).HasMaxLength(160);
        });

        modelBuilder.Entity<SourceMapping>(entity =>
        {
            entity.ToTable("source_mappings");
            entity.HasIndex(x => new { x.EcbsEntityType, x.EcbsEntityId, x.SourceSystem });
            entity.Property(x => x.EcbsEntityType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.SourceSystem).HasMaxLength(120).IsRequired();
            entity.Property(x => x.SourceDatabase).HasMaxLength(120);
            entity.Property(x => x.SourceTable).HasMaxLength(120);
            entity.Property(x => x.SourceId).HasMaxLength(120);
            entity.Property(x => x.SyncStatus).HasMaxLength(80);
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
