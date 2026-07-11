namespace ECBS.Application.ScreenData;

public sealed record DevicesData(
    IReadOnlyList<DeviceDataRow> Devices,
    IReadOnlyList<DeviceKindSummary> Summaries,
    DeviceTelemetrySummary Telemetry,
    string Message,
    string State,
    string UpdatedAt);

public sealed record DeviceDataRow(
    string Id,
    string Name,
    string Kind,
    string SerialNumber,
    string Status,
    string LastSeen,
    string HealthScore,
    string Firmware,
    string Location,
    bool IsMain);

public sealed record DeviceKindSummary(
    string Kind,
    int Total,
    int Online,
    int Offline,
    int Warning);

public sealed record DeviceTelemetrySummary(
    string Kilowatts,
    string KilovoltAmps,
    string KilowattHours,
    string PowerFactor,
    string Timestamp);

