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
    public async Task<AlarmDetailData> GetOchsnerAlarmDetailAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var site = await ReadSiteContextAsync(connection, cancellationToken);
            var telemetry = await ReadLatestAlarmTelemetryAsync(connection, cancellationToken);
            var alarm = await ReadLatestAlarmDetailAsync(connection, cancellationToken);

            if (alarm is null)
            {
                return NoAlarmDetailData(
                    "No applicable alarm detail record was found in tracking for Ochsner project 13.",
                    site,
                    telemetry);
            }

            var triggered = alarm.TriggeredAt ?? alarm.CreatedAt;
            var threshold = alarm.RuleThreshold ?? alarm.ThresholdValue;
            var metricValue = alarm.MetricValue;
            var unit = alarm.Unit ?? alarm.RuleUnit ?? "";
            var duration = triggered.HasValue ? FormatDuration(triggered.Value, DateTimeOffset.UtcNow) : "No Data";
            var thresholdText = threshold.HasValue ? $"{threshold.Value:0.##} {unit}".Trim() : "No Data";
            var metricText = metricValue.HasValue ? $"{metricValue.Value:0.##} {unit}".Trim() : FormatNullable(telemetry.AvgKw, "kW");
            var exceededBy = threshold.HasValue && metricValue.HasValue
                ? $"{metricValue.Value - threshold.Value:0.##} {unit}".Trim()
                : "No Data";
            var severity = NormalizeSeverity(alarm.Severity);
            var status = alarm.Status ?? "No Data";

            return new AlarmDetailData(
                AlarmId: $"ALM-{alarm.Id:000000}",
                DemandStats:
                [
                    new("Current Demand", metricText),
                    new("Threshold", thresholdText),
                    new("Exceeded By", exceededBy),
                    new("Duration", duration),
                ],
                ImpactRows:
                [
                    new("Estimated Extra Cost (Today)", "No Data"),
                    new("Potential Monthly Impact", "No Data"),
                    new("Power Factor (Avg)", FormatNullable(telemetry.AvgPf, "")),
                    new("Capacity Utilization", FormatNullable(telemetry.CapacityUtilizationPct, "%")),
                    new("Demand Charge Exposure", "No Data"),
                ],
                Message: "",
                PriorityLabel: $"{severity} Priority",
                RecommendedActions:
                [
                    new("No applicable recommendation source was found in tracking for this alarm."),
                ],
                RelatedAlarms: await ReadRelatedAlarmsAsync(connection, alarm, cancellationToken),
                State: "data",
                Status: status,
                SummaryTiles:
                [
                    new(SeverityColor(severity), alarm.Description ?? "No alarm description was found in tracking.", "⚠", "Alarm Summary", alarm.Title ?? alarm.AlarmType ?? "No Data"),
                    new("#05ff5e", alarm.AssetId.HasValue ? $"Asset ID: {alarm.AssetId.Value}" : "No additional affected asset was found.", "▣", "Affected Assets (1)", alarm.AssetName ?? "No Data"),
                    new("#cbd5e1", site.Detail, "", "Location", site.Name),
                    new("#05ff5e", $"Duration: {duration}|Since: {(triggered.HasValue ? FormatTime(triggered.Value) : "No Data")}", "", "Alarm Status", status),
                    new("#f97316", "Escalation countdown is not represented in tracking.", "↑", "Priority", severity),
                    new(alarm.AcknowledgedAt.HasValue ? "#05ff5e" : "#ef4444", "Acknowledged by: No Data", "", "Ack Status", alarm.AcknowledgedAt.HasValue ? "Acknowledged" : "Not Acknowledged"),
                ],
                Timeline: BuildTimeline(alarm),
                Title: alarm.Title ?? alarm.AlarmType ?? "No Data",
                TriggerConditions:
                [
                    new(metricText, alarm.RuleCondition ?? "No Data", thresholdText, alarm.RuleMetricKey ?? alarm.AlarmType ?? "No Data", threshold.HasValue && metricValue.HasValue && metricValue.Value > threshold.Value ? "Triggered" : "No Data", threshold.HasValue ? duration : "No Data"),
                    new(FormatNullable(telemetry.AvgPf, ""), "Telemetry Context", "No Data", "Power Factor (PF)", "No Data", "No Data"),
                    new(FormatNullable(telemetry.AvgCurrent, "A"), "Telemetry Context", "No Data", "Current (Avg)", "No Data", "No Data"),
                    new(FormatNullable(telemetry.AvgThd, "%"), "Telemetry Context", "No Data", "THD", "No Data", "No Data"),
                ],
                TriggeredAt: triggered.HasValue ? FormatTimestamp(triggered.Value) : "No Data",
                UpdatedAt: alarm.UpdatedAt.HasValue ? FormatTimestamp(alarm.UpdatedAt.Value) : "No Data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Alarm Detail data from tracking.");
            return NoAlarmDetailData(
                "Tracking alarm detail data could not be loaded for Ochsner project 13.",
                new AlarmDetailSiteContext("No Data", "No Data"),
                new AlarmDetailTelemetry(null, null, null, null, null));
        }
    }

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

    public async Task<SetNotificationsData> GetOchsnerSetNotificationsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var rule = await ReadLatestNotificationRuleAsync(connection, cancellationToken);
            if (rule is null)
            {
                return NoSetNotificationsData("No applicable alert rule notification settings were found in tracking for Ochsner project 13.");
            }

            var recipients = await ReadNotificationRecipientsAsync(connection, ParseUserIds(rule.NotifyUserIds), rule, cancellationToken);
            var channels = BuildNotificationChannels(rule);

            return new SetNotificationsData(
                Channels: channels,
                EscalationRows:
                [
                    new("Escalation Delay", "No Data"),
                    new("Escalate To", "No Data"),
                    new("Repeat Every", "No Data"),
                    new("Max Escalations", "No Data"),
                    new("Auto Resolve When Condition Clears", "No Data"),
                ],
                Message: "",
                PreviewItems: BuildNotificationPreview(channels),
                Recipients: recipients,
                RuleName: rule.Name ?? "No Data",
                RuleSummary:
                [
                    new("Category", rule.Category ?? "No Data"),
                    new("Parameter", rule.MetricKey ?? "No Data"),
                    new("Condition", rule.Condition ?? "No Data"),
                    new("Threshold", rule.Threshold.HasValue ? $"{rule.Threshold.Value:0.##} {rule.Unit}".Trim() : "No Data"),
                    new("For How Long", "No Data"),
                    new("Severity", $"● {NormalizeSeverity(rule.Severity)}"),
                ],
                State: "data");
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Set Notifications data from tracking.");
            return NoSetNotificationsData("Tracking notification settings could not be loaded for Ochsner project 13.");
        }
    }

    private static async Task<AlarmDetailSource?> ReadLatestAlarmDetailAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT
              a.id,
              a.alarm_type,
              a.severity,
              a.status,
              a.title,
              a.description,
              a.asset_id,
              a.asset_name,
              a.metric_value,
              a.threshold_value,
              a.unit,
              a.triggered_at,
              a.acknowledged_at,
              a.resolved_at,
              a.closed_at,
              a.createdAt,
              a.updatedAt,
              r.name AS rule_name,
              r.metric_key AS rule_metric_key,
              r.condition AS rule_condition,
              r.threshold AS rule_threshold,
              r.unit AS rule_unit
            FROM alarms a
            LEFT JOIN alert_rules r ON r.id = a.alert_rule_id AND COALESCE(r.is_deleted, 0) = 0
            WHERE a.project_id = 13
              AND COALESCE(a.isDeleted, 0) = 0
            ORDER BY COALESCE(a.triggered_at, a.createdAt, 0) DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new AlarmDetailSource(
            AcknowledgedAt: ReadUnixMilliseconds(reader, "acknowledged_at"),
            AlarmType: ReadString(reader, "alarm_type"),
            AssetId: ReadNullableInt(reader, "asset_id"),
            AssetName: ReadString(reader, "asset_name"),
            ClosedAt: ReadUnixMilliseconds(reader, "closed_at"),
            CreatedAt: ReadUnixMilliseconds(reader, "createdAt"),
            Description: ReadString(reader, "description"),
            Id: ReadInt(reader, "id"),
            MetricValue: ReadNullableDouble(reader, "metric_value"),
            ResolvedAt: ReadUnixMilliseconds(reader, "resolved_at"),
            RuleCondition: ReadString(reader, "rule_condition"),
            RuleMetricKey: ReadString(reader, "rule_metric_key"),
            RuleName: ReadString(reader, "rule_name"),
            RuleThreshold: ReadNullableDouble(reader, "rule_threshold"),
            RuleUnit: ReadString(reader, "rule_unit"),
            Severity: ReadString(reader, "severity"),
            Status: ReadString(reader, "status"),
            ThresholdValue: ReadNullableDouble(reader, "threshold_value"),
            Title: ReadString(reader, "title"),
            TriggeredAt: ReadUnixMilliseconds(reader, "triggered_at"),
            Unit: ReadString(reader, "unit"),
            UpdatedAt: ReadUnixMilliseconds(reader, "updatedAt"));
    }

    private static async Task<SetNotificationsRule?> ReadLatestNotificationRuleAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, name, category, metric_key, `condition`, threshold, unit, severity, notify_email, notify_sms, notify_push, notify_user_ids, is_active
            FROM alert_rules
            WHERE project_id = 13
              AND COALESCE(is_deleted, 0) = 0
            ORDER BY COALESCE(updatedAt, createdAt, 0) DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new SetNotificationsRule(
            Category: ReadString(reader, "category"),
            Condition: ReadString(reader, "condition"),
            Id: ReadInt(reader, "id"),
            IsActive: ReadBool(reader, "is_active"),
            MetricKey: ReadString(reader, "metric_key"),
            Name: ReadString(reader, "name"),
            NotifyEmail: ReadBool(reader, "notify_email"),
            NotifyPush: ReadBool(reader, "notify_push"),
            NotifySms: ReadBool(reader, "notify_sms"),
            NotifyUserIds: ReadString(reader, "notify_user_ids"),
            Severity: ReadString(reader, "severity"),
            Threshold: ReadNullableDouble(reader, "threshold"),
            Unit: ReadString(reader, "unit"));
    }

    private static async Task<IReadOnlyList<SetNotificationsRecipient>> ReadNotificationRecipientsAsync(
        MySqlConnection connection,
        IReadOnlyList<int> userIds,
        SetNotificationsRule rule,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return Array.Empty<SetNotificationsRecipient>();
        }

        await using var command = connection.CreateCommand();
        var parameterNames = userIds.Select((_, index) => $"@id{index}").ToList();
        command.CommandText = $"""
            SELECT id, firstName, lastName, email, phone
            FROM user
            WHERE COALESCE(isDeleted, 0) = 0
              AND id IN ({string.Join(", ", parameterNames)})
            ORDER BY firstName, lastName, email
            """;

        for (var index = 0; index < userIds.Count; index += 1)
        {
            command.Parameters.AddWithValue(parameterNames[index], userIds[index]);
        }

        var recipients = new List<SetNotificationsRecipient>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var firstName = ReadString(reader, "firstName") ?? "";
            var lastName = ReadString(reader, "lastName") ?? "";
            var email = ReadString(reader, "email") ?? "No Data";
            var name = string.Join(" ", new[] { firstName, lastName }.Where(part => !string.IsNullOrWhiteSpace(part)));
            if (string.IsNullOrWhiteSpace(name))
            {
                name = email;
            }

            recipients.Add(new SetNotificationsRecipient(
                ChannelIcons: ChannelIcons(rule),
                Email: email,
                Escalation: "No Data",
                Initials: Initials(name),
                Name: name,
                Schedule: "No Data",
                SeverityColors: [SeverityColor(rule.Severity ?? "")],
                Status: rule.IsActive ? "Enabled" : "Disabled",
                Type: "User"));
        }

        return recipients;
    }

    private static SetNotificationsData NoSetNotificationsData(string message)
    {
        return new SetNotificationsData(
            Channels: BuildNotificationChannels(null),
            EscalationRows:
            [
                new("Escalation Delay", "No Data"),
                new("Escalate To", "No Data"),
                new("Repeat Every", "No Data"),
                new("Max Escalations", "No Data"),
                new("Auto Resolve When Condition Clears", "No Data"),
            ],
            Message: message,
            PreviewItems:
            [
                new("#f59e0b", "ⓘ", message),
            ],
            Recipients: Array.Empty<SetNotificationsRecipient>(),
            RuleName: "No Data",
            RuleSummary:
            [
                new("Category", "No Data"),
                new("Parameter", "No Data"),
                new("Condition", "No Data"),
                new("Threshold", "No Data"),
                new("For How Long", "No Data"),
                new("Severity", "● No Data"),
            ],
            State: "no-data");
    }

    private static IReadOnlyList<SetNotificationsChannel> BuildNotificationChannels(SetNotificationsRule? rule)
    {
        return
        [
            new("#147dff", rule?.NotifyEmail == true, "✉", "Send email notifications", "Email"),
            new("#05ff5e", rule?.NotifySms == true, "💬", "Send text messages", "SMS Text"),
            new("#a855f7", rule?.NotifyPush == true, "🔔", "In-app and mobile push alerts", "Push Notification"),
            new("#f97316", false, "☎", "Automated voice call", "Voice Call"),
            new("#06b6d4", false, "🔗", "Send to external endpoint", "Webhook"),
        ];
    }

    private static IReadOnlyList<SetNotificationsPreviewItem> BuildNotificationPreview(IReadOnlyList<SetNotificationsChannel> channels)
    {
        var enabled = channels.Where(channel => channel.Enabled).ToList();
        if (enabled.Count == 0)
        {
            return
            [
                new("#f59e0b", "ⓘ", "No enabled notification channels were found for this alert rule."),
            ];
        }

        return enabled
            .Select(channel => new SetNotificationsPreviewItem(channel.Color, channel.Icon, $"{channel.Title} notification sent when the alert is triggered"))
            .ToList();
    }

    private static IReadOnlyList<int> ParseUserIds(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return Array.Empty<int>();
        }

        return System.Text.RegularExpressions.Regex.Matches(raw, @"\d+")
            .Select(match => int.TryParse(match.Value, out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .ToList();
    }

    private static IReadOnlyList<string> ChannelIcons(SetNotificationsRule rule)
    {
        var icons = new List<string>();
        if (rule.NotifyEmail)
        {
            icons.Add("✉");
        }

        if (rule.NotifySms)
        {
            icons.Add("💬");
        }

        if (rule.NotifyPush)
        {
            icons.Add("🔔");
        }

        return icons;
    }

    private static async Task<AlarmDetailSiteContext> ReadSiteContextAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT
              COALESCE(s.name, p.name, 'No Data') AS site_name,
              COALESCE(CONCAT_WS(', ', NULLIF(s.address, ''), NULLIF(s.city, ''), NULLIF(s.state, '')), p.location, 'No Data') AS site_detail
            FROM project p
            LEFT JOIN site s ON s.project_id = p.id AND COALESCE(s.is_deleted, 0) = 0
            WHERE p.id = 13
            ORDER BY s.id
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new AlarmDetailSiteContext("No Data", "No Data");
        }

        return new AlarmDetailSiteContext(
            ReadString(reader, "site_name") ?? "No Data",
            ReadString(reader, "site_detail") ?? "No Data");
    }

    private static async Task<AlarmDetailTelemetry> ReadLatestAlarmTelemetryAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT avg_kw, avg_pf, avg_thd, avg_l1_amp, avg_l2_amp, avg_l3_amp, capacity_utilization_pct
            FROM current_balance_metrics
            WHERE project_id = 13
            ORDER BY bucket_ts DESC
            LIMIT 1
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new AlarmDetailTelemetry(null, null, null, null, null);
        }

        var currents = new[]
        {
            ReadNullableDouble(reader, "avg_l1_amp"),
            ReadNullableDouble(reader, "avg_l2_amp"),
            ReadNullableDouble(reader, "avg_l3_amp"),
        }.Where(value => value.HasValue).Select(value => value!.Value).ToList();

        return new AlarmDetailTelemetry(
            AvgCurrent: currents.Count > 0 ? currents.Average() : null,
            AvgKw: ReadNullableDouble(reader, "avg_kw"),
            AvgPf: ReadNullableDouble(reader, "avg_pf"),
            AvgThd: ReadNullableDouble(reader, "avg_thd"),
            CapacityUtilizationPct: ReadNullableDouble(reader, "capacity_utilization_pct"));
    }

    private static async Task<IReadOnlyList<AlarmDetailRelatedAlarm>> ReadRelatedAlarmsAsync(
        MySqlConnection connection,
        AlarmDetailSource alarm,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT title, severity, triggered_at, createdAt, resolved_at, closed_at
            FROM alarms
            WHERE project_id = 13
              AND COALESCE(isDeleted, 0) = 0
              AND id <> @id
              AND (asset_id = @asset_id OR alarm_type = @alarm_type)
            ORDER BY COALESCE(triggered_at, createdAt, 0) DESC
            LIMIT 3
            """;
        command.Parameters.AddWithValue("@id", alarm.Id);
        command.Parameters.AddWithValue("@asset_id", alarm.AssetId.HasValue ? alarm.AssetId.Value : DBNull.Value);
        command.Parameters.AddWithValue("@alarm_type", alarm.AlarmType ?? "");

        var rows = new List<AlarmDetailRelatedAlarm>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var triggered = ReadUnixMilliseconds(reader, "triggered_at") ?? ReadUnixMilliseconds(reader, "createdAt");
            var ended = ReadUnixMilliseconds(reader, "resolved_at") ?? ReadUnixMilliseconds(reader, "closed_at") ?? DateTimeOffset.UtcNow;
            rows.Add(new AlarmDetailRelatedAlarm(
                Date: triggered.HasValue ? FormatTimestamp(triggered.Value) : "No Data",
                Duration: triggered.HasValue ? FormatDuration(triggered.Value, ended) : "No Data",
                Icon: SeverityIcon(ReadString(reader, "severity")),
                Label: ReadString(reader, "title") ?? "No Data"));
        }

        return rows;
    }

    private static AlarmDetailData NoAlarmDetailData(
        string message,
        AlarmDetailSiteContext site,
        AlarmDetailTelemetry telemetry)
    {
        return new AlarmDetailData(
            AlarmId: "No Data",
            DemandStats:
            [
                new("Current Demand", FormatNullable(telemetry.AvgKw, "kW")),
                new("Threshold", "No Data"),
                new("Exceeded By", "No Data"),
                new("Duration", "No Data"),
            ],
            ImpactRows:
            [
                new("Estimated Extra Cost (Today)", "No Data"),
                new("Potential Monthly Impact", "No Data"),
                new("Power Factor (Avg)", FormatNullable(telemetry.AvgPf, "")),
                new("Capacity Utilization", FormatNullable(telemetry.CapacityUtilizationPct, "%")),
                new("Demand Charge Exposure", "No Data"),
            ],
            Message: message,
            PriorityLabel: "No Data",
            RecommendedActions:
            [
                new("No applicable recommendation source was found in tracking for this alarm detail."),
            ],
            RelatedAlarms: Array.Empty<AlarmDetailRelatedAlarm>(),
            State: "no-data",
            Status: "No Data",
            SummaryTiles:
            [
                new("#ef4444", message, "⚠", "Alarm Summary", "No Data"),
                new("#05ff5e", "No affected asset record was found.", "▣", "Affected Assets (0)", "No Data"),
                new("#cbd5e1", site.Detail, "", "Location", site.Name),
                new("#cbd5e1", "Duration: No Data|Since: No Data", "", "Alarm Status", "No Data"),
                new("#cbd5e1", "Escalation countdown is not represented in tracking.", "↑", "Priority", "No Data"),
                new("#cbd5e1", "Acknowledged by: No Data", "", "Ack Status", "No Data"),
            ],
            Timeline: Array.Empty<AlarmDetailTimelineItem>(),
            Title: "No Data",
            TriggerConditions:
            [
                new("No Data", "No Data", "No Data", "Alarm Rule", "No Data", "No Data"),
                new(FormatNullable(telemetry.AvgPf, ""), "Telemetry Context", "No Data", "Power Factor (PF)", "No Data", "No Data"),
                new(FormatNullable(telemetry.AvgCurrent, "A"), "Telemetry Context", "No Data", "Current (Avg)", "No Data", "No Data"),
                new(FormatNullable(telemetry.AvgThd, "%"), "Telemetry Context", "No Data", "THD", "No Data", "No Data"),
            ],
            TriggeredAt: "No Data",
            UpdatedAt: "No Data");
    }

    private static IReadOnlyList<AlarmDetailTimelineItem> BuildTimeline(AlarmDetailSource alarm)
    {
        var events = new List<AlarmDetailTimelineItem>();
        var triggered = alarm.TriggeredAt ?? alarm.CreatedAt;
        if (triggered.HasValue)
        {
            events.Add(new AlarmDetailTimelineItem(SeverityColor(alarm.Severity ?? ""), alarm.Description ?? "Alarm record found in tracking.", FormatTime(triggered.Value), "Alarm Triggered"));
        }

        if (alarm.AcknowledgedAt.HasValue)
        {
            events.Add(new AlarmDetailTimelineItem("#147dff", "Acknowledgement timestamp found in tracking. Acknowledging user is not represented.", FormatTime(alarm.AcknowledgedAt.Value), "Alarm Acknowledged"));
        }

        if (alarm.ResolvedAt.HasValue)
        {
            events.Add(new AlarmDetailTimelineItem("#05ff5e", "Resolved timestamp found in tracking.", FormatTime(alarm.ResolvedAt.Value), "Alarm Resolved"));
        }

        if (alarm.ClosedAt.HasValue)
        {
            events.Add(new AlarmDetailTimelineItem("#64748b", "Closed timestamp found in tracking.", FormatTime(alarm.ClosedAt.Value), "Alarm Closed"));
        }

        return events;
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

        return new[] { "Critical", "Warning", "Info" }
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

    private static int? ReadNullableInt(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : Convert.ToInt32(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture);
    }

    private static bool ReadBool(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return !reader.IsDBNull(ordinal) && Convert.ToInt32(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture) == 1;
    }

    private static double ReadDouble(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0 : Convert.ToDouble(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture);
    }

    private static double? ReadNullableDouble(MySqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : Convert.ToDouble(reader.GetValue(ordinal), System.Globalization.CultureInfo.InvariantCulture);
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

    private static string FormatTime(DateTimeOffset timestamp)
    {
        var chicagoTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(timestamp, "America/Chicago");
        return chicagoTime.ToString("h:mm tt", System.Globalization.CultureInfo.GetCultureInfo("en-US"));
    }

    private static string FormatNullable(double? value, string unit)
    {
        if (!value.HasValue)
        {
            return "No Data";
        }

        return string.IsNullOrWhiteSpace(unit)
            ? $"{value.Value:0.##}"
            : $"{value.Value:0.##} {unit}";
    }

    private static string SeverityIcon(string? severity)
    {
        return NormalizeSeverity(severity) switch
        {
            "Critical" => "↑",
            "Warning" => "⚠",
            _ => "ⓘ",
        };
    }

    private static string Initials(string value)
    {
        var parts = value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return string.Concat(parts.Take(2).Select(part => char.ToUpperInvariant(part[0])));
    }

    private sealed record AlarmDetailSiteContext(string Name, string Detail);

    private sealed record AlarmDetailTelemetry(
        double? AvgCurrent,
        double? AvgKw,
        double? AvgPf,
        double? AvgThd,
        double? CapacityUtilizationPct);

    private sealed record AlarmDetailSource(
        DateTimeOffset? AcknowledgedAt,
        string? AlarmType,
        int? AssetId,
        string? AssetName,
        DateTimeOffset? ClosedAt,
        DateTimeOffset? CreatedAt,
        string? Description,
        int Id,
        double? MetricValue,
        DateTimeOffset? ResolvedAt,
        string? RuleCondition,
        string? RuleMetricKey,
        string? RuleName,
        double? RuleThreshold,
        string? RuleUnit,
        string? Severity,
        string? Status,
        double? ThresholdValue,
        string? Title,
        DateTimeOffset? TriggeredAt,
        string? Unit,
        DateTimeOffset? UpdatedAt);

    private sealed record SetNotificationsRule(
        string? Category,
        string? Condition,
        int Id,
        bool IsActive,
        string? MetricKey,
        string? Name,
        bool NotifyEmail,
        bool NotifyPush,
        bool NotifySms,
        string? NotifyUserIds,
        string? Severity,
        double? Threshold,
        string? Unit);
}
