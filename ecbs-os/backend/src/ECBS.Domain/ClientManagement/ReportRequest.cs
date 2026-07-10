using ECBS.Domain.Common;

namespace ECBS.Domain.ClientManagement;

public sealed class ReportRequest : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid? ClientId { get; set; }

    public Guid? ProjectId { get; set; }

    public Guid? ProjectWorkflowDraftId { get; set; }

    public required string RequestedReportTypes { get; set; }

    public string? OptionsJson { get; set; }

    public string? Status { get; set; }

    public string? RequestedBy { get; set; }
}
