using System.Globalization;
using ECBS.Application.ScreenData;
using ECBS.Domain.Devices;
using ECBS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECBS.Infrastructure.ScreenData;

public sealed class EfDevicesDataService(
    EcbsDbContext dbContext,
    ILogger<EfDevicesDataService> logger)
    : IDevicesDataService
{
    public async Task<DevicesData> GetDevicesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var now = DateTimeOffset.UtcNow;
            var devices = await dbContext.Devices
                .AsNoTracking()
                .OrderBy(row => row.Kind)
                .ThenBy(row => row.Name)
                .Take(250)
                .Select(row => new DeviceSource(
                    row.Id,
                    row.ProjectId,
                    row.Name,
                    row.SerialNumber,
                    row.Kind,
                    row.IsMain,
                    row.LastCommunicatedAtUtc))
                .ToListAsync(cancellationToken);

            var latestTelemetry = await dbContext.TelemetryIntervals
                .AsNoTracking()
                .OrderByDescending(row => row.IntervalStartUtc)
                .Select(row => new TelemetrySource(
                    row.IntervalStartUtc,
                    row.Kilowatts,
                    row.KilovoltAmps,
                    row.KilowattHours,
                    row.PowerFactor))
                .FirstOrDefaultAsync(cancellationToken);

            if (devices.Count == 0)
            {
                return Empty("No ECBS device rows were found in ecbs_os.devices.");
            }

            var rows = devices
                .Select(device => new DeviceDataRow(
                    device.Id.ToString(),
                    device.Name,
                    device.Kind.ToString(),
                    device.SerialNumber,
                    CalculateStatus(device.LastCommunicatedAtUtc, now),
                    device.LastCommunicatedAtUtc.HasValue ? FormatDateTime(device.LastCommunicatedAtUtc.Value) : "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    device.IsMain))
                .ToList();

            var summaries = Enum.GetValues<DeviceKind>()
                .Select(kind =>
                {
                    var scoped = rows.Where(row => row.Kind == kind.ToString()).ToList();
                    return new DeviceKindSummary(
                        kind.ToString(),
                        scoped.Count,
                        scoped.Count(row => row.Status == "Online"),
                        scoped.Count(row => row.Status == "Offline"),
                        scoped.Count(row => row.Status == "Warning"));
                })
                .ToList();

            return new DevicesData(
                rows,
                summaries,
                BuildTelemetry(latestTelemetry),
                "",
                "data",
                latestTelemetry is null ? rows.First().LastSeen : FormatDateTime(latestTelemetry.IntervalStartUtc));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Devices screen data from ecbs_os.");
            return Empty("ECBS device data is unavailable.");
        }
    }

    private static DevicesData Empty(string message)
    {
        return new DevicesData(
            [
                new(
                    "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    "No Data",
                    false),
            ],
            [
                new("Meter", 0, 0, 0, 0),
                new("Switch", 0, 0, 0, 0),
                new("Gateway", 0, 0, 0, 0),
            ],
            new("No Data", "No Data", "No Data", "No Data", "No Data"),
            message,
            "no-data",
            "No Data");
    }

    private static string CalculateStatus(DateTimeOffset? lastCommunicatedAtUtc, DateTimeOffset now)
    {
        if (!lastCommunicatedAtUtc.HasValue)
        {
            return "No Data";
        }

        var age = now - lastCommunicatedAtUtc.Value;

        if (age <= TimeSpan.FromMinutes(30))
        {
            return "Online";
        }

        if (age <= TimeSpan.FromHours(24))
        {
            return "Warning";
        }

        return "Offline";
    }

    private static DeviceTelemetrySummary BuildTelemetry(TelemetrySource? telemetry)
    {
        if (telemetry is null)
        {
            return new("No Data", "No Data", "No Data", "No Data", "No Data");
        }

        return new DeviceTelemetrySummary(
            FormatDecimal(telemetry.Kilowatts),
            FormatDecimal(telemetry.KilovoltAmps),
            FormatDecimal(telemetry.KilowattHours),
            FormatDecimal(telemetry.PowerFactor),
            FormatDateTime(telemetry.IntervalStartUtc));
    }

    private static string FormatDecimal(decimal? value)
    {
        return value.HasValue
            ? value.Value.ToString("N2", CultureInfo.GetCultureInfo("en-US"))
            : "No Data";
    }

    private static string FormatDateTime(DateTimeOffset value)
    {
        return value.ToLocalTime().ToString("MMM d, yyyy h:mm tt", CultureInfo.GetCultureInfo("en-US"));
    }

    private sealed record DeviceSource(
        Guid Id,
        Guid ProjectId,
        string Name,
        string SerialNumber,
        DeviceKind Kind,
        bool IsMain,
        DateTimeOffset? LastCommunicatedAtUtc);

    private sealed record TelemetrySource(
        DateTimeOffset IntervalStartUtc,
        decimal? Kilowatts,
        decimal? KilovoltAmps,
        decimal? KilowattHours,
        decimal? PowerFactor);
}

