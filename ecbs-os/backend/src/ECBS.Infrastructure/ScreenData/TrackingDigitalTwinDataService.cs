using ECBS.Application.ScreenData;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace ECBS.Infrastructure.ScreenData;

public sealed class TrackingDigitalTwinDataService(
    IConfiguration configuration,
    ILogger<TrackingDigitalTwinDataService> logger)
    : IDigitalTwinDataService
{
    public async Task<DigitalTwinData> GetOchsnerDigitalTwinAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var site = await ReadSiteAsync(connection, cancellationToken);
            if (site is null)
            {
                return EmptyDigitalTwin("Ochsner site record was not found in tracking DB.");
            }

            var twin = await ReadTwinAsync(connection, cancellationToken);
            if (twin is null)
            {
                return EmptyDigitalTwin("No Digital Twin has been configured for Ochsner project 13.", site.SiteName, site.ProjectName);
            }

            var assets = await ReadAssetsAsync(connection, twin.Id, cancellationToken);
            var relationships = await ReadRelationshipsAsync(connection, twin.Id, cancellationToken);
            var capacity = await ReadCapacityAsync(connection, cancellationToken);
            var metrics = await ReadMetricsAsync(connection, cancellationToken);
            var transformer = assets.FirstOrDefault(asset => asset.Type.Equals("transformer", StringComparison.OrdinalIgnoreCase));
            var transformerKva = capacity?.InstalledCapacity > 0 ? capacity.InstalledCapacity : transformer?.KvaRating ?? 0;
            var currentLoadKva = capacity?.UsedCapacity ?? 0;

            return new DigitalTwinData(
                ActiveMeters: metrics?.MeterCount ?? 0,
                Assets: assets,
                CbiScore: metrics?.AverageCbi ?? 0,
                CurrentLoadKva: currentLoadKva,
                DateRange: "Approved Digital Twin",
                HeadroomKva: Math.Max(0, transformerKva - currentLoadKva),
                ProjectName: site.ProjectName,
                RecoveredCapacityKva: capacity?.RecoverableCapacity ?? 0,
                Relationships: relationships,
                SiteName: site.SiteName,
                State: "data",
                Status: twin.Status,
                TransformerKva: transformerKva,
                TwinId: twin.Id,
                TwinLabel: string.IsNullOrWhiteSpace(twin.Label) ? "Ochsner Digital Twin" : twin.Label,
                TwinNotes: twin.Notes ?? "",
                UpdatedAt: FormatTimestamp(twin.UpdatedAt ?? twin.ApprovedAt ?? DateTimeOffset.UtcNow),
                Version: twin.VersionNumber);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Digital Twin data from tracking.");
            return EmptyDigitalTwin("Tracking DB data is unavailable for Digital Twin.");
        }
    }

    private string GetTrackingConnectionString()
    {
        var configured = configuration.GetConnectionString("TrackingMySql");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        var host = configuration["TRACKING_DB_HOST"] ?? "mysql-tracking";
        var port = configuration["TRACKING_DB_PORT"] ?? "3306";
        var database = configuration["TRACKING_DB_NAME"] ?? "tracking";
        var user = configuration["TRACKING_DB_USER"] ?? "tracking_user";
        var password = configuration["TRACKING_DB_PASSWORD"] ?? "TrackingPass123";

        return $"server={host};port={port};database={database};user={user};password={password}";
    }

    private static async Task<DigitalTwinSite?> ReadSiteAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT s.id, s.name AS site_name, p.id AS project_id, p.name AS project_name
            FROM site s
            JOIN project p ON p.id = s.project_id
            WHERE s.id = 3 AND p.id = 13
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new DigitalTwinSite(
            ReadInt(reader, "id"),
            ReadInt(reader, "project_id"),
            ReadString(reader, "project_name") ?? "Ochsner Project",
            ReadString(reader, "site_name") ?? "Ochsner Site");
    }

    private static async Task<DigitalTwinSource?> ReadTwinAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, site_id, project_id, status, version_number, label, source, notes, approved_at, updatedAt
            FROM digital_twin
            WHERE project_id = 13 AND COALESCE(is_deleted, 0) = 0
            ORDER BY
              CASE status WHEN 'locked' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
              version_number DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new DigitalTwinSource(
            ApprovedAt: ReadUnixMilliseconds(reader, "approved_at"),
            Id: ReadInt(reader, "id"),
            Label: ReadString(reader, "label"),
            Notes: ReadString(reader, "notes"),
            ProjectId: ReadInt(reader, "project_id"),
            SiteId: ReadInt(reader, "site_id"),
            Source: ReadString(reader, "source"),
            Status: ReadString(reader, "status") ?? "No Data",
            UpdatedAt: ReadUnixMilliseconds(reader, "updatedAt"),
            VersionNumber: ReadInt(reader, "version_number"));
    }

    private static async Task<IReadOnlyList<DigitalTwinAsset>> ReadAssetsAsync(
        MySqlConnection connection,
        int twinId,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, name, asset_uid, asset_type, kva_rating, amp_rating, voltage_primary,
                   voltage_secondary, bus_id, drawing_ref, meter_id, status, notes
            FROM asset
            WHERE digital_twin_id = @twinId AND COALESCE(is_deleted, 0) = 0
            ORDER BY id
            """;
        command.Parameters.AddWithValue("@twinId", twinId);

        var rows = new List<DigitalTwinAsset>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var id = ReadInt(reader, "id");
            rows.Add(new DigitalTwinAsset(
                AmpRating: ReadDouble(reader, "amp_rating"),
                AssetUid: ReadString(reader, "asset_uid") ?? $"asset-{id}",
                BusId: ReadString(reader, "bus_id") ?? "",
                DrawingRef: ReadString(reader, "drawing_ref") ?? "",
                Id: id,
                KvaRating: ReadDouble(reader, "kva_rating"),
                MeterId: ReadNullableInt(reader, "meter_id"),
                Name: ReadString(reader, "name") ?? "No Data",
                Notes: ReadString(reader, "notes") ?? "",
                Status: ReadString(reader, "status") ?? "",
                Type: ReadString(reader, "asset_type") ?? "asset",
                VoltagePrimary: ReadDouble(reader, "voltage_primary"),
                VoltageSecondary: ReadDouble(reader, "voltage_secondary")));
        }

        return rows;
    }

    private static async Task<IReadOnlyList<DigitalTwinRelationship>> ReadRelationshipsAsync(
        MySqlConnection connection,
        int twinId,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, parent_asset_id, child_asset_id, relationship_type
            FROM asset_relationship
            WHERE digital_twin_id = @twinId
            ORDER BY id
            """;
        command.Parameters.AddWithValue("@twinId", twinId);

        var rows = new List<DigitalTwinRelationship>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new DigitalTwinRelationship(
                ChildId: ReadInt(reader, "child_asset_id"),
                Id: ReadInt(reader, "id"),
                ParentId: ReadInt(reader, "parent_asset_id"),
                Type: ReadString(reader, "relationship_type") ?? "feeds"));
        }

        return rows;
    }

    private static async Task<DigitalTwinCapacity?> ReadCapacityAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT installed_capacity, used_capacity, available_capacity, recoverable_capacity
            FROM capacity_intelligence
            WHERE project_id = 13
            ORDER BY bucket_ts DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new DigitalTwinCapacity(
            AvailableCapacity: ReadDouble(reader, "available_capacity"),
            InstalledCapacity: ReadDouble(reader, "installed_capacity"),
            RecoverableCapacity: ReadDouble(reader, "recoverable_capacity"),
            UsedCapacity: ReadDouble(reader, "used_capacity"));
    }

    private static async Task<DigitalTwinMetrics?> ReadMetricsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            WITH latest AS (
              SELECT MAX(bucket_ts) AS bucket_ts
              FROM current_balance_metrics
              WHERE project_id = 13
            )
            SELECT COUNT(*) AS meter_count, AVG(cbi_score) AS avg_cbi, SUM(avg_kva) AS sum_kva
            FROM current_balance_metrics c
            JOIN latest l ON l.bucket_ts = c.bucket_ts
            WHERE c.project_id = 13
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new DigitalTwinMetrics(
            AverageCbi: ReadDouble(reader, "avg_cbi"),
            MeterCount: ReadInt(reader, "meter_count"),
            SumKva: ReadDouble(reader, "sum_kva"));
    }

    private static DigitalTwinData EmptyDigitalTwin(
        string message,
        string siteName = "Ochsner Site",
        string projectName = "Ochsner Project")
    {
        return new DigitalTwinData(
            ActiveMeters: 0,
            Assets: Array.Empty<DigitalTwinAsset>(),
            CbiScore: 0,
            CurrentLoadKva: 0,
            DateRange: "Tracking DB",
            HeadroomKva: 0,
            ProjectName: projectName,
            RecoveredCapacityKva: 0,
            Relationships: Array.Empty<DigitalTwinRelationship>(),
            SiteName: siteName,
            State: "empty",
            Status: "No Data",
            TransformerKva: 0,
            TwinId: 0,
            TwinLabel: "No Data",
            TwinNotes: message,
            UpdatedAt: "No Data",
            Version: 0);
    }

    private static string FormatTimestamp(DateTimeOffset timestamp)
    {
        var central = TimeZoneInfo.ConvertTime(timestamp, CentralTimeZone());
        return central.ToString("MMM d, yyyy, h:mm tt");
    }

    private static TimeZoneInfo CentralTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Chicago");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time");
        }
    }

    private static string? ReadString(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static int ReadInt(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? 0 : Convert.ToInt32(reader.GetValue(ordinal));
    }

    private static int? ReadNullableInt(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : Convert.ToInt32(reader.GetValue(ordinal));
    }

    private static double ReadDouble(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? 0 : Convert.ToDouble(reader.GetValue(ordinal));
    }

    private static DateTimeOffset? ReadUnixMilliseconds(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        var value = Convert.ToInt64(reader.GetValue(ordinal));
        return value <= 0 ? null : DateTimeOffset.FromUnixTimeMilliseconds(value);
    }

    private sealed record DigitalTwinSite(int Id, int ProjectId, string ProjectName, string SiteName);

    private sealed record DigitalTwinSource(
        DateTimeOffset? ApprovedAt,
        int Id,
        string? Label,
        string? Notes,
        int ProjectId,
        int SiteId,
        string? Source,
        string Status,
        DateTimeOffset? UpdatedAt,
        int VersionNumber);

    private sealed record DigitalTwinCapacity(
        double AvailableCapacity,
        double InstalledCapacity,
        double RecoverableCapacity,
        double UsedCapacity);

    private sealed record DigitalTwinMetrics(double AverageCbi, int MeterCount, double SumKva);
}
