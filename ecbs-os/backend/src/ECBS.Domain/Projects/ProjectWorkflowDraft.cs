using ECBS.Domain.Common;

namespace ECBS.Domain.Projects;

public sealed class ProjectWorkflowDraft : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid ClientId { get; set; }

    public Guid? SiteId { get; set; }

    public required string DraftName { get; set; }

    public string? ProjectName { get; set; }

    public string? ProjectType { get; set; }

    public string? FacilityName { get; set; }

    public string? Location { get; set; }

    public string? ProjectManager { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? TargetCompletionDate { get; set; }

    public string? Status { get; set; }

    public string? RequiredDocumentStatus { get; set; }

    public string? PayloadJson { get; set; }
}
