using System.Globalization;
using ECBS.Application.ScreenData;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace ECBS.Infrastructure.ScreenData;

public sealed class TrackingAnalysisDataService(
    IConfiguration configuration,
    ILogger<TrackingAnalysisDataService> logger)
    : IAnalysisDataService
{
    public async Task<CurrentAnalysisData> GetOchsnerCurrentAnalysisAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var context = await ReadSiteContextAsync(connection, cancellationToken);
            var telemetry = await ReadLatestCurrentBalanceAsync(connection, cancellationToken);
            if (telemetry is null)
            {
                return EmptyCurrentAnalysis("No current balance metrics were found in tracking for Ochsner project 13.", context.SiteName);
            }

            var totalAmp = telemetry.AvgAmp ?? SumKnown(telemetry.ProductiveAmp, telemetry.ReactiveAmp, telemetry.HarmonicAmp, telemetry.ImbalanceAmp);
            var kpis = new List<AnalysisKpi>
            {
                new("Latest current balance rollup", "A", "Total Current", "green", FormatNullable(totalAmp, "A")),
                new(ComponentDetail(telemetry.ProductiveAmp, totalAmp), "P", "Productive Current (kW)", "green", FormatNullable(telemetry.ProductiveAmp, "A")),
                new(ComponentDetail(telemetry.ReactiveAmp, totalAmp), "R", "Reactive Current (kVAR)", "yellow", FormatNullable(telemetry.ReactiveAmp, "A")),
                new(ComponentDetail(telemetry.HarmonicAmp, totalAmp), "H", "Harmonic Current (THD)", "yellow", FormatNullable(telemetry.HarmonicAmp, "A")),
                new(ComponentDetail(telemetry.ImbalanceAmp, totalAmp), "I", "Imbalance Current", "yellow", FormatNullable(telemetry.ImbalanceAmp, "A")),
                new(ComponentDetail(telemetry.NeutralAmp, totalAmp), "N", "Neutral Current", "blue", FormatNullable(telemetry.NeutralAmp, "A")),
            };

            var assetRows = new List<AnalysisTableRow>
            {
                new([
                    context.SiteName,
                    FormatNullable(totalAmp, ""),
                    FormatNullable(telemetry.ProductiveAmp, ""),
                    FormatNullable(telemetry.ReactiveAmp, ""),
                    FormatNullable(telemetry.HarmonicAmp, ""),
                    FormatNullable(telemetry.ImbalanceAmp, ""),
                    FormatNullable(telemetry.NeutralAmp, ""),
                    FormatNullable(telemetry.CbiScore, ""),
                    telemetry.CbiScore.HasValue ? CbiStatus(telemetry.CbiScore.Value) : "No Data",
                ]),
            };

            return new CurrentAnalysisData(
                Kpis: kpis,
                AssetRows: assetRows,
                Insights:
                [
                    "No Data: approved narrative insight source is not defined for Current Analysis.",
                    "No Data: per-asset current and CBI breakdown is not defined for this screen payload.",
                ],
                Message: "",
                SiteName: context.SiteName,
                State: "data",
                UpdatedAt: telemetry.BucketTs.HasValue ? FormatTimestamp(telemetry.BucketTs.Value) : "No Data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Current Analysis data from tracking.");
            return EmptyCurrentAnalysis("Tracking DB data is unavailable for Current Analysis.");
        }
    }

    public async Task<LiveDataScreenData> GetOchsnerLiveDataAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var context = await ReadSiteContextAsync(connection, cancellationToken);
            var telemetry = await ReadLatestCurrentBalanceAsync(connection, cancellationToken);
            var meter = await ReadLatestMeterAsync(connection, cancellationToken);
            if (telemetry is null && meter is null)
            {
                return EmptyLiveData("No live telemetry rollups were found in tracking for Ochsner project 13.", context);
            }

            var kw = telemetry?.AvgKw ?? meter?.TotalKw;
            var kva = telemetry?.AvgKva ?? meter?.TotalKva;
            var pf = telemetry?.AvgPf ?? meter?.TotalPf;
            var thd = telemetry?.AvgThd ?? meter?.TotalThd;
            var load = telemetry?.CapacityUtilizationPct;
            var updatedAt = telemetry?.BucketTs ?? meter?.LastCommunicatedAt;

            var phaseRows = new List<AnalysisTableRow>
            {
                BuildPhaseRow("L1", telemetry?.L1Amp ?? meter?.L1Amp, meter?.L1Kw, meter?.L1Kva, meter?.L1Pf, thd),
                BuildPhaseRow("L2", telemetry?.L2Amp ?? meter?.L2Amp, meter?.L2Kw, meter?.L2Kva, meter?.L2Pf, thd),
                BuildPhaseRow("L3", telemetry?.L3Amp ?? meter?.L3Amp, meter?.L3Kw, meter?.L3Kva, meter?.L3Pf, thd),
                new(["Total", "No Data", FormatNullable(meter?.TotalAmp ?? telemetry?.AvgAmp, ""), FormatNullable(kw, ""), FormatNullable(kva, ""), FormatNullable(pf, ""), FormatNullable(thd, "%")]),
                new(["Average", "No Data", FormatNullable(AverageKnown(telemetry?.L1Amp ?? meter?.L1Amp, telemetry?.L2Amp ?? meter?.L2Amp, telemetry?.L3Amp ?? meter?.L3Amp), ""), FormatNullable(kw, ""), FormatNullable(kva, ""), FormatNullable(pf, ""), FormatNullable(thd, "%")]),
            };

            return new LiveDataScreenData(
                Kpis:
                [
                    new(updatedAt.HasValue ? $"Updated {FormatTimestamp(updatedAt.Value)}" : "No Data", "S", "System Status", updatedAt.HasValue ? "green" : "yellow", updatedAt.HasValue ? "Online" : "No Data"),
                    new("Latest telemetry rollup", "kW", "Total kW", "blue", FormatNullable(kw, "kW")),
                    new("Latest telemetry rollup", "kVA", "Total kVA", "cyan", FormatNullable(kva, "kVA")),
                    new("Latest telemetry rollup", "PF", "Power Factor", "yellow", FormatNullable(pf, "")),
                    new("Latest telemetry rollup", "THD", "THD (V)", "yellow", FormatNullable(thd, "%")),
                    new("No approved frequency source", "Hz", "Frequency", "blue", "No Data"),
                    new("Of connected capacity", "L", "System Load", "green", FormatNullable(load, "%")),
                ],
                PhaseRows: phaseRows,
                DeviceRows: await ReadDeviceRowsAsync(connection, cancellationToken),
                AlarmRows:
                [
                    new(["No Data", "No approved live alarm event source is defined for this screen payload."]),
                ],
                SystemRows:
                [
                    new("Utility Voltage", "No Data"),
                    new("Main Transformer", "No Data"),
                    new("Panel Loads", "No Data"),
                ],
                ClientName: context.ClientName,
                Message: "",
                ProjectName: context.ProjectName,
                SiteName: context.SiteName,
                State: "data",
                UpdatedAt: updatedAt.HasValue ? FormatTimestamp(updatedAt.Value) : "No Data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Live Data from tracking.");
            return EmptyLiveData("Tracking DB data is unavailable for Live Data.", new("No Data", "No Data", "No Data"));
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

    private static async Task<AnalysisSiteContext> ReadSiteContextAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT
              COALESCE(c.name, c.legalName, 'No Data') AS client_name,
              COALESCE(p.name, 'No Data') AS project_name,
              COALESCE(s.name, p.name, 'No Data') AS site_name
            FROM project p
            LEFT JOIN client c ON c.id = p.client
            LEFT JOIN site s ON s.project_id = p.id AND COALESCE(s.is_deleted, 0) = 0
            WHERE p.id = 13
            ORDER BY s.id
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new AnalysisSiteContext("No Data", "No Data", "No Data");
        }

        return new AnalysisSiteContext(
            ReadString(reader, "client_name") ?? "No Data",
            ReadString(reader, "project_name") ?? "No Data",
            ReadString(reader, "site_name") ?? "No Data");
    }

    private static async Task<CurrentBalanceRow?> ReadLatestCurrentBalanceAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT bucket_ts, avg_amp, avg_pf, avg_thd, avg_kw, avg_kva,
                   avg_l1_amp, avg_l2_amp, avg_l3_amp,
                   productive_amp, reactive_amp, harmonic_amp, imbalance_amp, neutral_amp,
                   cbi_score, capacity_utilization_pct
            FROM current_balance_metrics
            WHERE project_id = 13
            ORDER BY bucket_ts DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new CurrentBalanceRow(
            AvgAmp: ReadNullableDouble(reader, "avg_amp"),
            AvgKva: ReadNullableDouble(reader, "avg_kva"),
            AvgKw: ReadNullableDouble(reader, "avg_kw"),
            AvgPf: ReadNullableDouble(reader, "avg_pf"),
            AvgThd: ReadNullableDouble(reader, "avg_thd"),
            BucketTs: ReadUnixMilliseconds(reader, "bucket_ts"),
            CapacityUtilizationPct: ReadNullableDouble(reader, "capacity_utilization_pct"),
            CbiScore: ReadNullableDouble(reader, "cbi_score"),
            HarmonicAmp: ReadNullableDouble(reader, "harmonic_amp"),
            ImbalanceAmp: ReadNullableDouble(reader, "imbalance_amp"),
            L1Amp: ReadNullableDouble(reader, "avg_l1_amp"),
            L2Amp: ReadNullableDouble(reader, "avg_l2_amp"),
            L3Amp: ReadNullableDouble(reader, "avg_l3_amp"),
            NeutralAmp: ReadNullableDouble(reader, "neutral_amp"),
            ProductiveAmp: ReadNullableDouble(reader, "productive_amp"),
            ReactiveAmp: ReadNullableDouble(reader, "reactive_amp"));
    }

    private static async Task<MeterRow?> ReadLatestMeterAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT lastCommunicatedAt, lastL1Amp, lastL1Kw, lastL1Kva, lastL1Pf,
                   lastL2Amp, lastL2Kw, lastL2Kva, lastL2Pf,
                   lastL3Amp, lastL3Kw, lastL3Kva, lastL3Pf,
                   lastTotalAmp, lastTotalKw, lastTotalKva, lastTotalPf, lastTotalTHD
            FROM meter
            WHERE project = 13 AND COALESCE(isDeleted, 0) = 0
            ORDER BY COALESCE(isMain, 0) DESC, COALESCE(lastCommunicatedAt, 0) DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new MeterRow(
            L1Amp: ReadNullableDouble(reader, "lastL1Amp"),
            L1Kva: ReadNullableDouble(reader, "lastL1Kva"),
            L1Kw: ReadNullableDouble(reader, "lastL1Kw"),
            L1Pf: ReadNullableDouble(reader, "lastL1Pf"),
            L2Amp: ReadNullableDouble(reader, "lastL2Amp"),
            L2Kva: ReadNullableDouble(reader, "lastL2Kva"),
            L2Kw: ReadNullableDouble(reader, "lastL2Kw"),
            L2Pf: ReadNullableDouble(reader, "lastL2Pf"),
            L3Amp: ReadNullableDouble(reader, "lastL3Amp"),
            L3Kva: ReadNullableDouble(reader, "lastL3Kva"),
            L3Kw: ReadNullableDouble(reader, "lastL3Kw"),
            L3Pf: ReadNullableDouble(reader, "lastL3Pf"),
            LastCommunicatedAt: ReadUnixMilliseconds(reader, "lastCommunicatedAt"),
            TotalAmp: ReadNullableDouble(reader, "lastTotalAmp"),
            TotalKva: ReadNullableDouble(reader, "lastTotalKva"),
            TotalKw: ReadNullableDouble(reader, "lastTotalKw"),
            TotalPf: ReadNullableDouble(reader, "lastTotalPf"),
            TotalThd: ReadNullableDouble(reader, "lastTotalTHD"));
    }

    private static async Task<IReadOnlyList<AnalysisTableRow>> ReadDeviceRowsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COALESCE(name, deviceId, meterSerialNumber, 'No Data') AS name,
                   deviceId,
                   lastCommunicatedAt,
                   isReporting
            FROM meter
            WHERE project = 13 AND COALESCE(isDeleted, 0) = 0
            ORDER BY COALESCE(isMain, 0) DESC, name
            LIMIT 6
            """;

        var rows = new List<AnalysisTableRow>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var lastCommunicatedAt = ReadUnixMilliseconds(reader, "lastCommunicatedAt");
            rows.Add(new AnalysisTableRow([
                ReadString(reader, "name") ?? "No Data",
                "Power Meter",
                "No Data",
                ReadBool(reader, "isReporting") ? "Online" : "No Data",
                lastCommunicatedAt.HasValue ? FormatTime(lastCommunicatedAt.Value) : "No Data",
                "No Data",
            ]));
        }

        return rows.Count > 0
            ? rows
            : [new AnalysisTableRow(["No Data", "No Data", "No Data", "No Data", "No Data", "No Data"])];
    }

    private static AnalysisTableRow BuildPhaseRow(string phase, double? current, double? kw, double? kva, double? pf, double? thd)
    {
        return new AnalysisTableRow([phase, "No Data", FormatNullable(current, ""), FormatNullable(kw, ""), FormatNullable(kva, ""), FormatNullable(pf, ""), FormatNullable(thd, "%")]);
    }

    private static CurrentAnalysisData EmptyCurrentAnalysis(string message, string siteName = "No Data")
    {
        return new CurrentAnalysisData(
            Kpis:
            [
                new("No Data", "A", "Total Current", "green", "No Data"),
                new("No Data", "P", "Productive Current (kW)", "green", "No Data"),
                new("No Data", "R", "Reactive Current (kVAR)", "yellow", "No Data"),
                new("No Data", "H", "Harmonic Current (THD)", "yellow", "No Data"),
                new("No Data", "I", "Imbalance Current", "yellow", "No Data"),
                new("No Data", "N", "Neutral Current", "blue", "No Data"),
            ],
            AssetRows: [new AnalysisTableRow(["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data"])],
            Insights: [message],
            Message: message,
            SiteName: siteName,
            State: "no-data",
            UpdatedAt: "No Data");
    }

    private static LiveDataScreenData EmptyLiveData(string message, AnalysisSiteContext context)
    {
        return new LiveDataScreenData(
            Kpis:
            [
                new("No Data", "S", "System Status", "green", "No Data"),
                new("No Data", "kW", "Total kW", "blue", "No Data"),
                new("No Data", "kVA", "Total kVA", "cyan", "No Data"),
                new("No Data", "PF", "Power Factor", "yellow", "No Data"),
                new("No Data", "THD", "THD (V)", "yellow", "No Data"),
                new("No Data", "Hz", "Frequency", "blue", "No Data"),
                new("No Data", "L", "System Load", "green", "No Data"),
            ],
            PhaseRows: [new AnalysisTableRow(["No Data", "No Data", "No Data", "No Data", "No Data", "No Data", "No Data"])],
            DeviceRows: [new AnalysisTableRow(["No Data", "No Data", "No Data", "No Data", "No Data", "No Data"])],
            AlarmRows: [new AnalysisTableRow(["No Data", message])],
            SystemRows: [new AnalysisSummaryRow("Source", "No Data")],
            ClientName: context.ClientName,
            Message: message,
            ProjectName: context.ProjectName,
            SiteName: context.SiteName,
            State: "no-data",
            UpdatedAt: "No Data");
    }

    private static string ComponentDetail(double? value, double? total)
    {
        if (!value.HasValue || !total.HasValue || Math.Abs(total.Value) < 0.0001)
        {
            return "No Data";
        }

        return $"{value.Value / total.Value * 100:0.#}% of total";
    }

    private static string CbiStatus(double score)
    {
        return score >= 90 ? "Healthy" : score >= 80 ? "Good" : score >= 70 ? "Fair" : "Review";
    }

    private static double? SumKnown(params double?[] values)
    {
        var known = values.Where(value => value.HasValue).Select(value => value!.Value).ToList();
        return known.Count > 0 ? known.Sum() : null;
    }

    private static double? AverageKnown(params double?[] values)
    {
        var known = values.Where(value => value.HasValue).Select(value => value!.Value).ToList();
        return known.Count > 0 ? known.Average() : null;
    }

    private static string FormatNullable(double? value, string unit)
    {
        if (!value.HasValue)
        {
            return "No Data";
        }

        var text = value.Value.ToString("#,0.##", CultureInfo.GetCultureInfo("en-US"));
        return string.IsNullOrWhiteSpace(unit) ? text : $"{text} {unit}";
    }

    private static string FormatTimestamp(DateTimeOffset timestamp)
    {
        var chicagoTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(timestamp, "America/Chicago");
        return chicagoTime.ToString("MMM d, yyyy, h:mm tt", CultureInfo.GetCultureInfo("en-US"));
    }

    private static string FormatTime(DateTimeOffset timestamp)
    {
        var chicagoTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(timestamp, "America/Chicago");
        return chicagoTime.ToString("h:mm:ss tt", CultureInfo.GetCultureInfo("en-US"));
    }

    private static string? ReadString(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static bool ReadBool(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return !reader.IsDBNull(ordinal) && Convert.ToInt32(reader.GetValue(ordinal), CultureInfo.InvariantCulture) == 1;
    }

    private static double? ReadNullableDouble(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : Convert.ToDouble(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
    }

    private static DateTimeOffset? ReadUnixMilliseconds(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal)
            ? null
            : DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(reader.GetValue(ordinal), CultureInfo.InvariantCulture));
    }

    private sealed record AnalysisSiteContext(string ClientName, string ProjectName, string SiteName);

    private sealed record CurrentBalanceRow(
        double? AvgAmp,
        double? AvgKva,
        double? AvgKw,
        double? AvgPf,
        double? AvgThd,
        DateTimeOffset? BucketTs,
        double? CapacityUtilizationPct,
        double? CbiScore,
        double? HarmonicAmp,
        double? ImbalanceAmp,
        double? L1Amp,
        double? L2Amp,
        double? L3Amp,
        double? NeutralAmp,
        double? ProductiveAmp,
        double? ReactiveAmp);

    private sealed record MeterRow(
        double? L1Amp,
        double? L1Kva,
        double? L1Kw,
        double? L1Pf,
        double? L2Amp,
        double? L2Kva,
        double? L2Kw,
        double? L2Pf,
        double? L3Amp,
        double? L3Kva,
        double? L3Kw,
        double? L3Pf,
        DateTimeOffset? LastCommunicatedAt,
        double? TotalAmp,
        double? TotalKva,
        double? TotalKw,
        double? TotalPf,
        double? TotalThd);
}

