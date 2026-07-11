namespace ECBS.Application.ScreenData;

public sealed record DigitalTwinData(
    int ActiveMeters,
    IReadOnlyList<DigitalTwinAsset> Assets,
    double CbiScore,
    double CurrentLoadKva,
    string DateRange,
    double HeadroomKva,
    string ProjectName,
    double RecoveredCapacityKva,
    IReadOnlyList<DigitalTwinRelationship> Relationships,
    string SiteName,
    string State,
    string Status,
    double TransformerKva,
    int TwinId,
    string TwinLabel,
    string TwinNotes,
    string UpdatedAt,
    int Version);

public sealed record DigitalTwinAsset(
    double AmpRating,
    string AssetUid,
    string BusId,
    string DrawingRef,
    int Id,
    double KvaRating,
    int? MeterId,
    string Name,
    string Notes,
    string Status,
    string Type,
    double VoltagePrimary,
    double VoltageSecondary);

public sealed record DigitalTwinRelationship(int ChildId, int Id, int ParentId, string Type);
