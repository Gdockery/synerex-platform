using ECBS.Domain.Common;

namespace ECBS.Domain.Documents;

public sealed class DocumentMetadata : BaseEntity
{
    public Guid TenantId { get; set; }

    public Guid? ClientId { get; set; }

    public Guid? ProjectId { get; set; }

    public Guid? ProjectWorkflowDraftId { get; set; }

    public required string DocumentType { get; set; }

    public string? FileName { get; set; }

    public string? StorageUri { get; set; }

    public string? Status { get; set; }

    public string? UploadedBy { get; set; }
}
