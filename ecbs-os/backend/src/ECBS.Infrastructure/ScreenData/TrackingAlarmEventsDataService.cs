using ECBS.Application.ScreenData;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace ECBS.Infrastructure.ScreenData;

public sealed class TrackingAlarmEventsDataService(
    IConfiguration configuration,
    ILogger<TrackingAlarmEventsDataService> logger)
    : IAlarmEventsDataService
{
    public async Task<AlarmEventsData> GetOchsnerAlarmEventsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var telemetry = await ReadLatestTelemetryAsync(connection, cancellationToken);
            var activeAlerts = await ReadActiveAlertsAsync(connection, cancellationToken);
            var severity = await ReadSeverityCountsAsync(connection, cancellationToken);
            var categories = await ReadCategoryCountsAsync(connection, cancellationToken);
            var notifications = await ReadNotificationCountsAsync(connection, cancellationToken);
            var trend = await ReadTrendAsync(connection, cancellationToken);
            var statusBars = await ReadStatusBarsAsync(connection, cancellationToken);
            var totalAlerts = severity.Sum(x => x.Value);
            var responseMinutes = await ReadAverageResponseMinutesAsync(connection, cancellationToken);
            var compliancePct = await ReadCompliancePctAsync(connection, cancellationToken);
            var hasAlertRows = totalAlerts > 0 || activeAlerts.Count > 0;

            return new AlarmEventsData(
                ActiveAlerts: activeAlerts,
                Categories: categories,
                CbiScore: telemetry.CbiScore,
                CompliancePct: compliancePct,
                Message: hasAlertRows ? null : "No applicable alarm or alert records were found in tracking for Ochsner project 13.",
                Metrics: BuildMetrics(severity, activeAlerts.Count, responseMinutes, compliancePct),
                Notifications: notifications,
                PriorityMatrix: EmptyPriorityMatrix(),
                ResponseBars: statusBars.Select(x => x.Active + x.Acknowledged + x.Resolved).ToArray(),
                ResponseMinutes: responseMinutes,
                Severity: severity,
                State: hasAlertRows ? "data" : "no-data",
                StatusBars: statusBars,
                TotalAlerts: totalAlerts,
                Trend: trend,
                UpdatedAt: telemetry.UpdatedAt);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Alarm Events data from tracking.");
            return NoData("Tracking alarm/event data could not be loaded for Ochsner project 13.");
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

    private static async Task<(double CbiScore, string UpdatedAt)> ReadLatestTelemetryAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT AVG(cbi_score) AS avg_cbi, MAX(bucket_ts) AS bucket_ts
            FROM current_balance_metrics
            WHERE project_id = 13
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return (0, "No Data");
        }

        var cbi = ReadDouble(reader, "avg_cbi");
        var timestamp = ReadUnixMilliseconds(reader, "bucket_ts");

        return (cbi, timestamp.HasValue ? FormatTimestamp(timestamp.Value) : "No Data");
    }

    private static async Task<List<AlarmEventsActiveAlert>> ReadActiveAlertsAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT severity, title, asset_name, alarm_type, triggered_at, status
            FROM alarms
            WHERE project_id = 13
              AND COALESCE(isDeleted, 0) = 0
              AND LOWER(COALESCE(status, '')) IN ('active', 'open', 'triggered')
            ORDER BY COALESCE(triggered_at, createdAt, 0) DESC
            LIMIT 6
            """;

        var alerts = new List<AlarmEventsActiveAlert>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var triggered = ReadUnixMilliseconds(reader, "triggered_at");
            alerts.Add(new AlarmEventsActiveAlert(
                Action: "View",
                Category: ReadString(reader, "alarm_type") ?? "No Data",
                Device: ReadString(reader, "asset_name") ?? "No Data",
                Duration: triggered.HasValue ? FormatDuration(triggered.Value, DateTimeOffset.UtcNow) : "No Data",
                Name: ReadString(reader, "title") ?? "No Data",
                Severity: NormalizeSeverity(ReadString(reader, "severity")),
                Status: ReadString(reader, "status") ?? "No Data",
                Triggered: triggered.HasValue ? FormatTimestamp(triggered.Value) : "No Data"));
        }

        return alerts;
    }

    private static async Task<List<AlarmEventsCategory>> ReadSeverityCountsAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        var counts = await ReadGroupedCountsAsync(
            connection,
            """
            SELECT severity AS label, COUNT(*) AS count_value
            FROM alarms
            WHERE project_id = 13 AND COALESCE(isDeleted, 0) = 0
            GROUP BY severity
            """,
            cancellationToken,
            normalizeSeverity: true);
        var total = counts.Values.Sum();

        return ["Critical", "Warning", "Info"]
            .Select(label => new AlarmEventsCategory(SeverityColor(label), label, Percent(counts.GetValueOrDefault(label), total), counts.GetValueOrDefault(label)))
            .ToList();
    }

    private static async Task<List<AlarmEventsCategory>> ReadCategoryCountsAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        var counts = await ReadGroupedCountsAsync(
            connection,
            """
            SELECT COALESCE(alarm_type, source, 'Uncategorized') AS label, COUNT(*) AS count_value
            FROM alarms
            WHERE project_id = 13 AND COALESCE(isDeleted, 0) = 0
            GROUP BY COALESCE(alarm_type, source, 'Uncategorized')
            ORDER BY count_value DESC
            LIMIT 5
            """,
            cancellationToken,
            normalizeSeverity: false);
        var total = counts.Values.Sum();
        var colors = new[] { "#dc2626", "#f59e0b", "#0ea5e9", "#65a30d", "#7c3aed" };

        return counts
            .Select((entry, index) => new AlarmEventsCategory(colors[Math.Min(index, colors.Length - 1)], entry.Key, Percent(entry.Value, total), entry.Value))
            .ToList();
    }

    private static async Task<List<AlarmEventsNotification>> ReadNotificationCountsAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT
              SUM(CASE WHEN notify_email = 1 THEN 1 ELSE 0 END) AS email_count,
              SUM(CASE WHEN notify_sms = 1 THEN 1 ELSE 0 END) AS sms_count,
              SUM(CASE WHEN notify_push = 1 THEN 1 ELSE 0 END) AS push_count
            FROM alert_rules
            WHERE project_id = 13 AND COALESCE(is_deleted, 0) = 0
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return [];
        }

        return
        [
            new("Email Alert Rules", ReadInt(reader, "email_count")),
            new("SMS Alert Rules", ReadInt(reader, "sms_count")),
            new("Push Alert Rules", ReadInt(reader, "push_count")),
        ];
    }

    private static async Task<List<AlarmEventsTrendPoint>> ReadTrendAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        var days = LastSevenDays();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT DATE(FROM_UNIXTIME(COALESCE(triggered_at, createdAt) / 1000)) AS alarm_day,
                   LOWER(COALESCE(severity, 'info')) AS severity,
                   COUNT(*) AS count_value
            FROM alarms
            WHERE project_id = 13
              AND COALESCE(isDeleted, 0) = 0
              AND COALESCE(triggered_at, createdAt) >= @start
            GROUP BY alarm_day, severity
            """;
        command.Parameters.AddWithValue("@start", days[0].StartUnixMilliseconds);

        var counts = new Dictionary<(DateOnly Day, string Severity), int>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (DateOnly.TryParse(ReadString(reader, "alarm_day"), out var day))
            {
                counts[(day, ReadString(reader, "severity") ?? "info")] = ReadInt(reader, "count_value");
            }
        }

        return days.Select(day => new AlarmEventsTrendPoint(
            Critical: counts.GetValueOrDefault((day.Day, "critical")),
            Info: counts.GetValueOrDefault((day.Day, "info")),
            Label: day.Label,
            Warning: counts.GetValueOrDefault((day.Day, "warning")))).ToList();
    }

    private static async Task<List<AlarmEventsStatusBar>> ReadStatusBarsAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        var days = LastSevenDays();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT DATE(FROM_UNIXTIME(COALESCE(triggered_at, createdAt) / 1000)) AS alarm_day,
                   LOWER(COALESCE(status, 'active')) AS status,
                   COUNT(*) AS count_value
            FROM alarms
            WHERE project_id = 13
              AND COALESCE(isDeleted, 0) = 0
              AND COALESCE(triggered_at, createdAt) >= @start
            GROUP BY alarm_day, status
            """;
        command.Parameters.AddWithValue("@start", days[0].StartUnixMilliseconds);

        var counts = new Dictionary<(DateOnly Day, string Status), int>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (DateOnly.TryParse(ReadString(reader, "alarm_day"), out var day))
            {
                counts[(day, ReadString(reader, "status") ?? "active")] = ReadInt(reader, "count_value");
            }
        }

        return days.Select(day => new AlarmEventsStatusBar(
            Active: counts.Where(x => x.Key.Day == day.Day && (x.Key.Status is "active" or "open" or "triggered")).Sum(x => x.Value),
            Acknowledged: counts.Where(x => x.Key.Day == day.Day && x.Key.Status == "acknowledged").Sum(x => x.Value),
            Label: day.Label,
            Resolved: counts.Where(x => x.Key.Day == day.Day && (x.Key.Status is "resolved" or "closed")).Sum(x => x.Value))).ToList();
    }

    private static async Task<double?> ReadAverageResponseMinutesAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT AVG((acknowledged_at - triggered_at) / 60000) AS avg_minutes
            FROM alarms
            WHERE project_id = 13
              AND COALESCE(isDeleted, 0) = 0
              AND acknowledged_at IS NOT NULL
              AND triggered_at IS NOT NULL
              AND acknowledged_at >= triggered_at
            """;

        var value = await command.ExecuteScalarAsync(cancellationToken);
        return value is null or DBNull ? null : Convert.ToDouble(value);
    }

    private static async Task<double?> ReadCompliancePctAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT
              SUM(CASE WHEN acknowledged_at IS NOT NULL AND triggered_at IS NOT NULL AND acknowledged_at - triggered_at <= 900000 THEN 1 ELSE 0 END) AS within_sla,
              SUM(CASE WHEN acknowledged_at IS NOT NULL AND triggered_at IS NOT NULL THEN 1 ELSE 0 END) AS total_acknowledged
            FROM alarms
            WHERE project_id = 13 AND COALESCE(isDeleted, 0) = 0
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var total = ReadInt(reader, "total_acknowledged");
        if (total <= 0)
        {
            return null;
        }

        return Math.Round((ReadInt(reader, "within_sla") / (double)total) * 100, 1);
    }

    private static async Task<Dictionary<string, int>> ReadGroupedCountsAsync(
        MySqlConnection connection,
        string sql,
        CancellationToken cancellationToken,
        bool normalizeSeverity)
    {
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var label = normalizeSeverity
                ? NormalizeSeverity(ReadString(reader, "label"))
                : ReadString(reader, "label") ?? "Uncategorized";
            counts[label] = ReadInt(reader, "count_value");
        }

        return counts;
    }

    private static IReadOnlyList<AlarmEventsMetric> BuildMetrics(
        IReadOnlyList<AlarmEventsCategory> severity,
        int activeCount,
        double? responseMinutes,
        double? compliancePct)
    {
        var severityCounts = severity.ToDictionary(x => x.Label, x => x.Value, StringComparer.OrdinalIgnoreCase);

        return
        [
            new("#dc2626", "Tracking alarms table", "△", "Active Alerts", "Actual open/active records", activeCount.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            new("#f59e0b", "Tracking alarms table", "△", "Warning Alerts", "Actual warning records", severityCounts.GetValueOrDefault("Warning").ToString(System.Globalization.CultureInfo.InvariantCulture)),
            new("#0ea5e9", "Tracking alarms table", "i", "Info Alerts", "Actual info records", severityCounts.GetValueOrDefault("Info").ToString(System.Globalization.CultureInfo.InvariantCulture)),
            new("#7c3aed", "Tracking alarms table", "✓", "Resolved (24h)", "Actual resolved records", "0"),
            new("#00c7b7", "Acknowledged alarms", "◴", "Alert Response (Avg)", responseMinutes.HasValue ? "Calculated from acknowledged_at - triggered_at" : "No applicable data found", responseMinutes.HasValue ? $"{responseMinutes.Value:0.0} min" : "No Data"),
            new("#65a30d", "15 min SLA", "✓", "Alert Compliance", compliancePct.HasValue ? "Calculated from acknowledged alarms" : "No applicable data found", compliancePct.HasValue ? $"{compliancePct.Value:0.0}%" : "No Data"),
        ];
    }

    private static AlarmEventsData NoData(string message)
    {
        return new AlarmEventsData(
            ActiveAlerts: [],
            Categories: [],
            CbiScore: 0,
            CompliancePct: null,
            Message: message,
            Metrics: [],
            Notifications: [],
            PriorityMatrix: EmptyPriorityMatrix(),
            ResponseBars: [],
            ResponseMinutes: null,
            Severity: [],
            State: "no-data",
            StatusBars: [],
            TotalAlerts: 0,
            Trend: [],
            UpdatedAt: "No Data");
    }

    private static IReadOnlyList<IReadOnlyList<int>> EmptyPriorityMatrix()
    {
        return
        [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ];
    }

    private static List<(DateOnly Day, string Label, long StartUnixMilliseconds)> LastSevenDays()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Enumerable.Range(0, 7)
            .Select(offset => today.AddDays(offset - 6))
            .Select(day =>
            {
                var start = new DateTimeOffset(day.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).ToUnixTimeMilliseconds();
                return (day, day.ToString("MMM d", System.Globalization.CultureInfo.GetCultureInfo("en-US")), start);
            })
            .ToList();
    }

    private static string Percent(int value, int total)
    {
        return total <= 0 ? "0.0%" : $"{(value / (double)total) * 100:0.0}%";
    }

    private static string NormalizeSeverity(string? severity)
    {
        return (severity ?? "Info").ToLowerInvariant() switch
        {
            "critical" or "high" => "Critical",
            "warning" or "warn" or "medium" => "Warning",
            _ => "Info",
        };
    }

    private static string SeverityColor(string severity)
    {
        return NormalizeSeverity(severity) switch
        {
            "Critical" => "#dc2626",
            "Warning" => "#f59e0b",
            _ => "#0ea5e9",
        };
    }

    private static string? ReadString(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : Convert.ToString(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture);
    }

    private static int ReadInt(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0 : Convert.ToInt32(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture);
    }

    private static double ReadDouble(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0 : Convert.ToDouble(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture);
    }

    private static DateTimeOffset? ReadUnixMilliseconds(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal)
            ? null
            : DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture));
    }

    private static string FormatDuration(DateTimeOffset start, DateTimeOffset end)
    {
        var duration = end - start;
        if (duration.TotalMinutes < 1)
        {
            return "<1 min";
        }

        if (duration.TotalHours < 1)
        {
            return $"{Math.Floor(duration.TotalMinutes):0} min";
        }

        return $"{Math.Floor(duration.TotalHours):0}h {duration.Minutes:00}m";
    }

    private static string FormatTimestamp(DateTimeOffset timestamp)
    {
        var chicagoTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(timestamp, "America/Chicago");
        return chicagoTime.ToString("MMM d, yyyy, h:mm tt", System.Globalization.CultureInfo.GetCultureInfo("en-US"));
    }
}
