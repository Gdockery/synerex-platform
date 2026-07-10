using ECBS.Application.ScreenData;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace ECBS.Infrastructure.ScreenData;

public sealed class TrackingCapacityIntelligenceDataService(
    IConfiguration configuration,
    ILogger<TrackingCapacityIntelligenceDataService> logger)
    : ICapacityIntelligenceDataService
{
    public async Task<CapacityIntelligenceData> GetOchsnerCapacityIntelligenceAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var site = await ReadSiteAsync(connection, cancellationToken);
            if (site is null)
            {
                return EmptyCapacityIntelligence("Ochsner site record was not found in tracking DB.");
            }

            var capacity = await ReadLatestCapacityAsync(connection, cancellationToken);
            if (capacity is null)
            {
                return EmptyCapacityIntelligence("No Capacity Intelligence rollup was found for Ochsner project 13.", site.Name);
            }

            var trendRows = await ReadCapacityTrendAsync(connection, cancellationToken);
            var assets = await ReadAssetsAsync(connection, cancellationToken);
            var meters = await ReadMetersAsync(connection, cancellationToken);
            var mainMeter = meters.FirstOrDefault(meter => meter.IsMain) ?? meters.FirstOrDefault();
            var minuteRows = mainMeter is null
                ? Array.Empty<CapacityMinuteTrendRow>()
                : await ReadMinuteTrendAsync(connection, mainMeter.Id, cancellationToken);
            var savings = await ReadSavingsAsync(connection, cancellationToken);

            var installed = capacity.InstalledCapacity;
            var used = capacity.UsedCapacity;
            var available = capacity.AvailableCapacity;
            var hidden = capacity.HiddenCapacity;
            var recovered = capacity.RecoverableCapacity;
            var deferred = capacity.DeferredCapitalValue;
            var health = ClampScore(capacity.CapacityHealthScore);
            var utilization = ClampScore(capacity.UtilizationPct);
            var recoveredPct = installed > 0 ? recovered / installed * 100 : capacity.RecoverablePct;
            var annualBenefit = savings?.AnnualSavings ?? 0;
            var co2 = savings?.Co2ReductionTons ?? 0;
            var nowAvailable = available + recovered;
            var nextUpgradeKva = Math.Ceiling(Math.Max(installed, 1) / 500) * 500;
            var trend = BuildTrend(minuteRows, trendRows, installed, recovered);

            return new CapacityIntelligenceData(
                AnnualBenefit: FormatCurrency(annualBenefit),
                Assets: BuildAssets(assets, meters, installed, used, recovered),
                AvailableKva: available,
                AvoidedUpgrade: $"{FormatNumber(nextUpgradeKva, 0)} kVA transformer and switchgear upgrade",
                Callouts:
                [
                    new("i", "Key Insight", $"{FormatNumber(nowAvailable, 0)} kVA is available after ECBS recovery."),
                    new("u", "Avoided Upgrade", $"{FormatNumber(nextUpgradeKva, 0)} kVA transformer upgrade deferred."),
                    new("$", "Annual Benefit", $"{FormatCurrency(annualBenefit)} annual savings from capacity recovery."),
                    new("c", "Carbon Impact", $"{FormatNumber(co2, 0)} tons CO2e avoided annually."),
                ],
                CapacityHealthScore: health,
                Co2Tons: $"{FormatNumber(co2, 0)} tons",
                DateRange: "1-minute main-meter telemetry",
                DeferredCapitalValue: deferred,
                HiddenKva: hidden,
                InstalledKva: installed,
                KeyInsight: $"Ochsner has {FormatNumber(nowAvailable, 0)} kVA of available capacity, including {FormatNumber(recovered, 0)} kVA recovered by ECBS.",
                Kpis:
                [
                    new("#29b6f6", "Nameplate capacity", "P", "Total Connected Capacity", $"{FormatNumber(installed, 0)} kVA"),
                    new(utilization > 85 ? "#ef4444" : "#f59e0b", $"{FormatNumber(utilization, 0)}% of connected capacity", "G", "Current Utilized Capacity", $"{FormatNumber(used, 0)} kVA"),
                    new("#05ff5e", $"{FormatNumber(Math.Max(0, 100 - utilization), 0)}% remaining before recovery", "B", "Available Capacity", $"{FormatNumber(nowAvailable, 0)} kVA"),
                    new("#05ff5e", $"{FormatNumber(recoveredPct, 0)}% recovered by ECBS", "R", "Recovered Capacity", $"{FormatNumber(recovered, 0)} kVA"),
                    new("#ab47bc", "Estimated CapEx deferred", "$", "Upgrade Deferral Value", FormatCurrency(deferred)),
                ],
                LoadKva: used,
                RecoveredKva: recovered,
                RecoveredPct: recoveredPct,
                SiteName: site.Name,
                State: "data",
                SubScores:
                [
                    new("Load Balance", ScoreLoadBalance(utilization)),
                    new("Utilization Efficiency", ScoreUtilization(utilization)),
                    new("Voltage Stability", ScoreVoltage(meters)),
                    new("Harmonic Impact", ScoreHarmonics(meters)),
                    new("Thermal Headroom", ScoreThermalHeadroom(utilization)),
                ],
                Trend: trend,
            UpdatedAt: FormatTimestamp(capacity.BucketTs ?? DateTimeOffset.UtcNow),
                UtilizationPct: utilization);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Capacity Intelligence data from tracking.");
            return EmptyCapacityIntelligence("Tracking DB data is unavailable for Capacity Intelligence.");
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

    private static async Task<CapacitySite?> ReadSiteAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT s.id, s.name, p.name AS project_name
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

        return new CapacitySite(ReadInt(reader, "id"), ReadString(reader, "name") ?? "Ochsner Site");
    }

    private static async Task<CapacitySummary?> ReadLatestCapacityAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT bucket_ts, installed_capacity, used_capacity, available_capacity, hidden_capacity,
                   recoverable_capacity, deferred_capital_value, capacity_health_score,
                   utilization_pct, hidden_pct, recoverable_pct
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

        return ReadCapacitySummary(reader);
    }

    private static async Task<IReadOnlyList<CapacitySummary>> ReadCapacityTrendAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT bucket_ts, installed_capacity, used_capacity, available_capacity, hidden_capacity,
                   recoverable_capacity, deferred_capital_value, capacity_health_score,
                   utilization_pct, hidden_pct, recoverable_pct
            FROM capacity_intelligence
            WHERE project_id = 13
            ORDER BY bucket_ts DESC
            LIMIT 16
            """;

        var rows = new List<CapacitySummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(ReadCapacitySummary(reader));
        }

        return rows;
    }

    private static CapacitySummary ReadCapacitySummary(MySqlDataReader reader)
    {
        return new CapacitySummary(
            AvailableCapacity: ReadDouble(reader, "available_capacity"),
            BucketTs: ReadUnixMilliseconds(reader, "bucket_ts"),
            CapacityHealthScore: ReadDouble(reader, "capacity_health_score"),
            DeferredCapitalValue: ReadDouble(reader, "deferred_capital_value"),
            HiddenCapacity: ReadDouble(reader, "hidden_capacity"),
            InstalledCapacity: ReadDouble(reader, "installed_capacity"),
            RecoverableCapacity: ReadDouble(reader, "recoverable_capacity"),
            RecoverablePct: ReadDouble(reader, "recoverable_pct"),
            UsedCapacity: ReadDouble(reader, "used_capacity"),
            UtilizationPct: ReadDouble(reader, "utilization_pct"));
    }

    private static async Task<IReadOnlyList<CapacityAssetSource>> ReadAssetsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, name, asset_type, kva_rating, amp_rating, voltage_primary, voltage_secondary, meter_id, status
            FROM asset
            WHERE site_id = 3 AND COALESCE(is_deleted, 0) = 0
            ORDER BY
              CASE asset_type
                WHEN 'transformer' THEN 1
                WHEN 'switchgear' THEN 2
                WHEN 'generator' THEN 3
                WHEN 'ecbs' THEN 4
                ELSE 5
              END,
              id
            """;

        var rows = new List<CapacityAssetSource>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new CapacityAssetSource(
                AmpRating: ReadDouble(reader, "amp_rating"),
                AssetType: ReadString(reader, "asset_type") ?? "asset",
                Id: ReadInt(reader, "id"),
                KvaRating: ReadDouble(reader, "kva_rating"),
                MeterId: ReadNullableInt(reader, "meter_id"),
                Name: ReadString(reader, "name") ?? "No Data",
                VoltagePrimary: ReadDouble(reader, "voltage_primary"),
                VoltageSecondary: ReadDouble(reader, "voltage_secondary")));
        }

        return rows;
    }

    private static async Task<IReadOnlyList<CapacityMeter>> ReadMetersAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, name, isMain, isSub, isFilter, lastTotalKva, avg15MinuteKva, lastTotalPf, lastTotalTHD
            FROM meter
            WHERE project = 13 AND COALESCE(isDeleted, 0) = 0
            ORDER BY isMain DESC, id
            """;

        var rows = new List<CapacityMeter>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new CapacityMeter(
                Avg15MinuteKva: ReadDouble(reader, "avg15MinuteKva"),
                Id: ReadInt(reader, "id"),
                IsMain: ReadBool(reader, "isMain"),
                LastTotalKva: ReadDouble(reader, "lastTotalKva"),
                LastTotalPf: ReadDouble(reader, "lastTotalPf"),
                LastTotalThd: ReadDouble(reader, "lastTotalTHD"),
                Name: ReadString(reader, "name") ?? "No Data"));
        }

        return rows;
    }

    private static async Task<IReadOnlyList<CapacityMinuteTrendRow>> ReadMinuteTrendAsync(
        MySqlConnection connection,
        int meterId,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT recordedAt AS bucket_ts, totalKva
            FROM meterdata
            WHERE meter = @meterId
              AND recordedAt IS NOT NULL
            ORDER BY recordedAt DESC
            LIMIT 180
            """;
        command.Parameters.AddWithValue("@meterId", meterId);

        var rows = new List<CapacityMinuteTrendRow>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new CapacityMinuteTrendRow(
                BucketTs: ReadUnixMilliseconds(reader, "bucket_ts"),
                TotalKva: ReadDouble(reader, "totalKva")));
        }

        return rows;
    }

    private static async Task<CapacitySavings?> ReadSavingsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT annual_savings, co2_reduction_tons
            FROM savings_intelligence
            WHERE project_id = 13
            ORDER BY bucket_ts DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new CapacitySavings(
            AnnualSavings: ReadDouble(reader, "annual_savings"),
            Co2ReductionTons: ReadDouble(reader, "co2_reduction_tons"));
    }

    private static IReadOnlyList<CapacityTrendPoint> BuildTrend(
        IReadOnlyList<CapacityMinuteTrendRow> minuteRows,
        IReadOnlyList<CapacitySummary> trendRows,
        double installed,
        double recovered)
    {
        if (minuteRows.Count > 0)
        {
            return minuteRows.Reverse().Select(row =>
            {
                var usedKva = row.TotalKva;
                return new CapacityTrendPoint(
                    Available: Math.Max(0, installed - usedKva) + recovered,
                    Installed: installed,
                    Label: row.BucketTs.HasValue ? FormatShortTime(row.BucketTs.Value) : "",
                    Used: usedKva);
            }).ToList();
        }

        return trendRows.Reverse().Select(row =>
        {
            var usedKva = row.UsedCapacity;
            return new CapacityTrendPoint(
                Available: Math.Max(0, installed - usedKva) + recovered,
                Installed: installed,
                Label: row.BucketTs.HasValue ? FormatShortTime(row.BucketTs.Value) : "",
                Used: usedKva);
        }).ToList();
    }

    private static IReadOnlyList<CapacityIntelligenceAsset> BuildAssets(
        IReadOnlyList<CapacityAssetSource> assets,
        IReadOnlyList<CapacityMeter> meters,
        double installed,
        double used,
        double recovered)
    {
        var ratedAssets = assets
            .Select(asset => new { Asset = asset, Connected = AssetConnectedKva(asset) })
            .Where(entry => entry.Connected > 0)
            .ToList();
        var totalConnected = ratedAssets.Sum(entry => entry.Connected);
        if (totalConnected <= 0)
        {
            totalConnected = installed > 0 ? installed : 1;
        }

        return ratedAssets.Select((entry, index) =>
        {
            var meter = meters.FirstOrDefault(row => row.Id == entry.Asset.MeterId);
            var share = entry.Connected / totalConnected;
            var utilized = meter is not null && meter.LastTotalKva > 0 ? meter.LastTotalKva : used * share;
            var recoveredShare = recovered * share;
            var available = Math.Max(0, entry.Connected - utilized + recoveredShare);
            var utilization = entry.Connected > 0 ? ClampScore(utilized / entry.Connected * 100) : 0;

            return new CapacityIntelligenceAsset(
                AvailableKva: FormatNumber(available, 0),
                ConnectedKva: FormatNumber(entry.Connected, 0),
                Health: utilization >= 85 ? "Critical" : utilization >= 70 ? "Warning" : "Healthy",
                Name: entry.Asset.Name,
                RecoveredKva: FormatNumber(recoveredShare, 0),
                Sparkline: CapacitySparkline(utilization, index),
                Type: TitleCase(entry.Asset.AssetType),
                UtilizedKva: FormatNumber(utilized, 0),
                UtilizationPct: $"{FormatNumber(utilization, 0)}%",
                UtilizationValue: utilization);
        }).ToList();
    }

    private static double AssetConnectedKva(CapacityAssetSource asset)
    {
        if (asset.KvaRating > 0)
        {
            return asset.KvaRating;
        }

        var volts = asset.VoltageSecondary > 0 ? asset.VoltageSecondary : asset.VoltagePrimary > 0 ? asset.VoltagePrimary : 480;
        return asset.AmpRating <= 0 ? 0 : Math.Sqrt(3) * volts * asset.AmpRating / 1000;
    }

    private static string CapacitySparkline(double utilization, int offset)
    {
        var deltas = new[] { -6, -2, 3, -1, 4, -3, 0 };
        return string.Join(" ", deltas.Select((delta, index) =>
        {
            var value = ClampScore(utilization + delta + offset % 3 * 1.5);
            var x = index * 10;
            var y = 20 - value / 100 * 18;
            return $"{x},{y:0.0}";
        }));
    }

    private static CapacityIntelligenceData EmptyCapacityIntelligence(string message, string siteName = "Ochsner Site")
    {
        return new CapacityIntelligenceData(
            AnnualBenefit: "$0",
            Assets: Array.Empty<CapacityIntelligenceAsset>(),
            AvailableKva: 0,
            AvoidedUpgrade: message,
            Callouts:
            [
                new("!", "Capacity Data Unavailable", message),
                new("!", "Avoided Upgrade", "No Data"),
                new("!", "Annual Benefit", "No Data"),
                new("!", "Carbon Impact", "No Data"),
            ],
            CapacityHealthScore: 0,
            Co2Tons: "No Data",
            DateRange: "Tracking DB",
            DeferredCapitalValue: 0,
            HiddenKva: 0,
            InstalledKva: 0,
            KeyInsight: message,
            Kpis:
            [
                new("#64748b", "No Data", "P", "Total Connected Capacity", "No Data"),
                new("#64748b", "No Data", "G", "Current Utilized Capacity", "No Data"),
                new("#64748b", "No Data", "B", "Available Capacity", "No Data"),
                new("#64748b", "No Data", "R", "Recovered Capacity", "No Data"),
                new("#64748b", "No Data", "$", "Upgrade Deferral Value", "No Data"),
            ],
            LoadKva: 0,
            RecoveredKva: 0,
            RecoveredPct: 0,
            SiteName: siteName,
            State: "empty",
            SubScores:
            [
                new("Load Balance", 0),
                new("Utilization Efficiency", 0),
                new("Voltage Stability", 0),
                new("Harmonic Impact", 0),
                new("Thermal Headroom", 0),
            ],
            Trend: Array.Empty<CapacityTrendPoint>(),
            UpdatedAt: "No Data",
            UtilizationPct: 0);
    }

    private static int ScoreLoadBalance(double utilization)
    {
        return utilization <= 0 ? 0 : (int)Math.Round(ClampScore(100 - Math.Abs(utilization - 70)));
    }

    private static int ScoreUtilization(double utilization)
    {
        if (utilization < 50)
        {
            return 75;
        }

        return utilization > 90 ? 50 : (int)Math.Round(ClampScore(100 - Math.Abs(utilization - 70) * 0.8));
    }

    private static int ScoreVoltage(IReadOnlyList<CapacityMeter> meters)
    {
        var main = meters.FirstOrDefault(meter => meter.IsMain) ?? meters.FirstOrDefault();
        if (main is null)
        {
            return 0;
        }

        var normalizedPf = main.LastTotalPf > 1 ? main.LastTotalPf / 100 : main.LastTotalPf;
        return (int)Math.Round(ClampScore(normalizedPf * 105));
    }

    private static int ScoreHarmonics(IReadOnlyList<CapacityMeter> meters)
    {
        var main = meters.FirstOrDefault(meter => meter.IsMain) ?? meters.FirstOrDefault();
        return main is null ? 0 : (int)Math.Round(ClampScore(100 - main.LastTotalThd * 4));
    }

    private static int ScoreThermalHeadroom(double utilization)
    {
        return (int)Math.Round(ClampScore(100 - utilization + 50));
    }

    private static string FormatCurrency(double value)
    {
        if (Math.Abs(value) >= 1_000_000)
        {
            return $"${value / 1_000_000:0.00}M";
        }

        if (Math.Abs(value) >= 1_000)
        {
            return $"${value / 1_000:0.0}K";
        }

        return $"${value:0}";
    }

    private static string FormatNumber(double value, int digits)
    {
        return value.ToString($"N{digits}");
    }

    private static double ClampScore(double value)
    {
        return Math.Max(0, Math.Min(100, value));
    }

    private static string FormatTimestamp(DateTimeOffset timestamp)
    {
        var central = TimeZoneInfo.ConvertTime(timestamp, CentralTimeZone());
        return central.ToString("MMM d, yyyy, h:mm tt");
    }

    private static string FormatShortTime(DateTimeOffset timestamp)
    {
        var central = TimeZoneInfo.ConvertTime(timestamp, CentralTimeZone());
        return central.ToString("h:mm tt");
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

    private static string TitleCase(string value)
    {
        return string.Join(" ", value.Split(['_', ' ', '-'], StringSplitOptions.RemoveEmptyEntries)
            .Select(part => $"{char.ToUpperInvariant(part[0])}{part[1..]}"));
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

    private static bool ReadBool(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return !reader.IsDBNull(ordinal) && Convert.ToInt32(reader.GetValue(ordinal)) != 0;
    }

    private static DateTimeOffset? ReadUnixMilliseconds(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        var value = Convert.ToInt64(reader.GetValue(ordinal));
        if (value <= 0)
        {
            return null;
        }

        return DateTimeOffset.FromUnixTimeMilliseconds(value);
    }

    private sealed record CapacitySite(int Id, string Name);

    private sealed record CapacitySummary(
        double AvailableCapacity,
        DateTimeOffset? BucketTs,
        double CapacityHealthScore,
        double DeferredCapitalValue,
        double HiddenCapacity,
        double InstalledCapacity,
        double RecoverableCapacity,
        double RecoverablePct,
        double UsedCapacity,
        double UtilizationPct);

    private sealed record CapacityAssetSource(
        double AmpRating,
        string AssetType,
        int Id,
        double KvaRating,
        int? MeterId,
        string Name,
        double VoltagePrimary,
        double VoltageSecondary);

    private sealed record CapacityMeter(
        double Avg15MinuteKva,
        int Id,
        bool IsMain,
        double LastTotalKva,
        double LastTotalPf,
        double LastTotalThd,
        string Name);

    private sealed record CapacityMinuteTrendRow(DateTimeOffset? BucketTs, double TotalKva);

    private sealed record CapacitySavings(double AnnualSavings, double Co2ReductionTons);
}
