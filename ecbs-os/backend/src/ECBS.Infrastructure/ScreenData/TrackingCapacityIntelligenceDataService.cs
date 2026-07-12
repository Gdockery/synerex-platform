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
    private const double ManualProjectCost = 98_000;

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
            var activationDate = savings?.ActivationDate;
            var cumulativeSavings = CalculateCumulativeSavings(annualBenefit, activationDate, DateTimeOffset.UtcNow);
            var savingsPerMinute = annualBenefit > 0 ? annualBenefit / 365.25 / 24 / 60 : 0;
            var savingsPerHour = savingsPerMinute * 60;
            var savingsPerDay = annualBenefit > 0 ? annualBenefit / 365.25 : 0;
            var savingsPerMonth = annualBenefit > 0 ? annualBenefit / 12 : 0;
            var roiPct = annualBenefit > 0 ? annualBenefit / ManualProjectCost * 100 : 0;
            var paybackYears = annualBenefit > 0 ? ManualProjectCost / annualBenefit : 0;
            var centralNow = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, CentralTimeZone());
            var yearStart = new DateTimeOffset(centralNow.Year, 1, 1, 0, 0, 0, centralNow.Offset);
            var monthStart = new DateTimeOffset(centralNow.Year, centralNow.Month, 1, 0, 0, 0, centralNow.Offset);
            var dayStart = new DateTimeOffset(centralNow.Year, centralNow.Month, centralNow.Day, 0, 0, 0, centralNow.Offset);
            var nowAvailable = available + recovered;
            var nextUpgradeKva = Math.Ceiling(Math.Max(installed, 1) / 500) * 500;
            var trend = BuildTrend(Array.Empty<CapacityMinuteTrendRow>(), trendRows, installed, recovered);

            return new CapacityIntelligenceData(
                AnnualBenefit: FormatCurrency(annualBenefit),
                AnnualSavingsValue: annualBenefit,
                ActivationDate: activationDate.HasValue ? FormatShortDate(activationDate.Value) : "No Data",
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
                CumulativeSavingsModel: cumulativeSavings.HasValue
                    ? "M-016: annual_savings / 365.25 * active days"
                    : "No Data - M-016 requires annual_savings and activation date.",
                CumulativeSavingsSinceActivation: cumulativeSavings.HasValue ? FormatCurrency(cumulativeSavings.Value) : "No Data",
                DateRange: "1-minute main-meter telemetry",
                DeferredCapitalValue: deferred,
                DemandSavingsValue: savings?.DemandSavings ?? 0,
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
                PaybackYears: paybackYears,
                ProjectCost: ManualProjectCost,
                RoiPct: roiPct,
                SavingsWaterfallRows: BuildSavingsWaterfallRows(annualBenefit, savings?.DemandSavings ?? 0, savings?.CapacityValue ?? 0),
                SavingsPerDay: savingsPerDay,
                SavingsPerHour: savingsPerHour,
                SavingsPerMinute: savingsPerMinute,
                SavingsPerMonth: savingsPerMonth,
                SavingsThisMonth: FormatPeriodSavings(annualBenefit, monthStart, centralNow),
                SavingsThisYear: FormatPeriodSavings(annualBenefit, yearStart, centralNow),
                SavingsToday: FormatPeriodSavings(annualBenefit, dayStart, centralNow),
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

    public async Task<CapacityRecoveryBreakdownData> GetOchsnerRecoveryBreakdownAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var capacity = await ReadLatestCapacityAsync(connection, cancellationToken);
            if (capacity is null)
            {
                return EmptyRecoveryBreakdown("No Capacity Intelligence rollup was found for Ochsner project 13.");
            }

            var trendRows = await ReadCapacityTrendAsync(connection, cancellationToken);
            var assets = await ReadAssetsAsync(connection, cancellationToken);
            var used = capacity.UsedCapacity;
            var hidden = capacity.HiddenCapacity;
            var installed = capacity.InstalledCapacity;
            var recovered = capacity.RecoverableCapacity;
            var beforePeak = used + hidden;
            var afterPeak = used;
            var recoveryPct = installed > 0 ? recovered / installed * 100 : capacity.RecoverablePct;
            var beforeOver = Math.Max(0, beforePeak - installed);
            var afterOver = Math.Max(0, afterPeak - installed);
            var overEliminated = Math.Max(0, beforeOver - afterOver);
            var eliminatedPct = beforeOver > 0 ? overEliminated / beforeOver * 100 : recovered > 0 ? 100 : 0;
            var consistency = RecoveryConsistency(trendRows);
            var maxRecovered = trendRows.Count > 0 ? trendRows.Max(row => row.RecoverableCapacity) : recovered;
            var avgRecovered = trendRows.Count > 0 ? trendRows.Average(row => row.RecoverableCapacity) : recovered;
            var efficiency = beforePeak > 0 ? recovered / beforePeak * 100 : 0;
            var contributionRows = BuildRecoveryContributionRows(assets, installed, recovered);
            var trend = BuildRecoveryTrend(trendRows);

            return new CapacityRecoveryBreakdownData(
                AfterOverCapacity: $"{FormatNumber(afterOver, 0)} kVA",
                AfterPeak: $"{FormatNumber(afterPeak, 0)} kVA",
                BeforeOverCapacity: $"{FormatNumber(beforeOver, 0)} kVA",
                BeforePeak: $"{FormatNumber(beforePeak, 0)} kVA",
                ContributionRows: contributionRows,
                EventRows: Array.Empty<CapacityRecoveryEventRow>(),
                Kpis:
                [
                    new("#05ff5e", $"{FormatNumber(recoveryPct, 0)}% of connected capacity", "R", "Total Capacity Recovered", $"{FormatNumber(recovered, 0)} kVA"),
                    new("#ef4444", $"{FormatNumber(installed > 0 ? beforePeak / installed * 100 : 0, 0)}% utilized", "!", "Before ECBS (Peak)", $"{FormatNumber(beforePeak, 0)} kVA"),
                    new("#84cc16", $"{FormatNumber(installed > 0 ? afterPeak / installed * 100 : 0, 0)}% utilized", "✓", "After ECBS (Peak)", $"{FormatNumber(afterPeak, 0)} kVA"),
                    new("#147dff", "Capacity recovered", "%", "Recovery Percentage", $"{FormatNumber(recoveryPct, 1)}%"),
                    new("#06b6d4", "Overload removed", "O", "Over-Capacity Eliminated", $"{FormatNumber(overEliminated, 0)} kVA"),
                    new("#05ff5e", "Consistency from recent rollups", "S", "Sustained Recovery", $"{FormatNumber(consistency, 1)}%"),
                ],
                Message: "",
                RecoveryByAssetType: contributionRows
                    .Select(row => new CapacityRecoveryDonutRow(row.Color, row.Label, $"{row.Value} kVA ({row.Percent})"))
                    .ToList(),
                RecoveryPercent: $"{FormatNumber(eliminatedPct, 0)}%",
                SummaryRows:
                [
                    new("Maximum Capacity Recovered", $"{FormatNumber(maxRecovered, 0)} kVA"),
                    new("Average Daily Recovery", $"{FormatNumber(avgRecovered, 0)} kVA"),
                    new("Recovery Consistency", $"{FormatNumber(consistency, 1)}%"),
                    new("Peak Demand Reduction", $"{FormatNumber(recovered, 0)} kVA"),
                    new("Overload Conditions Removed", $"{FormatNumber(eliminatedPct, 0)}%"),
                    new("System Efficiency Improvement", $"{FormatNumber(efficiency, 1)}%"),
                ],
                State: "data",
                TimePeriodRows: BuildRecoveryTimeRows(trendRows),
                Trend: trend,
                UpdatedAt: FormatTimestamp(capacity.BucketTs ?? DateTimeOffset.UtcNow));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Capacity Recovery Breakdown data from tracking.");
            return EmptyRecoveryBreakdown("Tracking DB data is unavailable for Capacity Recovery Breakdown.");
        }
    }

    public async Task<CapacityHealthDiagnosticsData> GetOchsnerHealthDiagnosticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var capacity = await ReadLatestCapacityAsync(connection, cancellationToken);
            if (capacity is null)
            {
                return EmptyHealthDiagnostics("No Capacity Intelligence rollup was found for Ochsner project 13.");
            }

            var trendRows = await ReadCapacityTrendAsync(connection, cancellationToken);
            var assets = await ReadAssetsAsync(connection, cancellationToken);
            var meters = await ReadMetersAsync(connection, cancellationToken);
            var utilization = ClampScore(capacity.UtilizationPct);
            var health = (int)Math.Round(ClampScore(capacity.CapacityHealthScore));
            var diagnostics = BuildHealthDiagnostics(utilization, meters);
            var assetHealthRows = BuildAssetHealthRows(assets, meters, capacity.InstalledCapacity, capacity.UsedCapacity, capacity.RecoverableCapacity);
            var issues = BuildHealthIssues(assetHealthRows, meters);

            return new CapacityHealthDiagnosticsData(
                AssetBars: BuildHealthAssetBars(assetHealthRows),
                Diagnostics: diagnostics,
                Distribution: BuildHealthDistribution(assetHealthRows),
                Kpis: BuildHealthKpis(health, diagnostics, trendRows),
                Message: "",
                Issues: issues,
                Recommendations: BuildHealthRecommendations(issues),
                State: "data",
                SummaryRows:
                [
                    new("Overall Health Score", $"{health}/100"),
                    new("Assets Evaluated", assetHealthRows.Count.ToString()),
                    new("Average Utilization", $"{FormatNumber(utilization, 0)}%"),
                    new("Power Factor Score", $"{ScoreVoltage(meters)}/100"),
                    new("Harmonic Score", $"{ScoreHarmonics(meters)}/100"),
                    new("Updated", FormatTimestamp(capacity.BucketTs ?? DateTimeOffset.UtcNow)),
                ],
                Trend: trendRows.Reverse().Select(row => new CapacityHealthTrendPoint(
                    row.BucketTs.HasValue ? FormatShortDate(row.BucketTs.Value) : "",
                    (int)Math.Round(ClampScore(row.CapacityHealthScore)))).ToList(),
                UpdatedAt: FormatTimestamp(capacity.BucketTs ?? DateTimeOffset.UtcNow));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Capacity Health Diagnostics data from tracking.");
            return EmptyHealthDiagnostics("Tracking DB data is unavailable for Capacity Health Diagnostics.");
        }
    }

    public async Task<CapacityUtilizationTrendData> GetOchsnerUtilizationTrendAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var capacity = await ReadLatestCapacityAsync(connection, cancellationToken);
            if (capacity is null)
            {
                return EmptyUtilizationTrend("No Capacity Intelligence rollup was found for Ochsner project 13.");
            }

            var trendRows = await ReadCapacityTrendAsync(connection, cancellationToken);
            var samples = BuildUtilizationSamples(trendRows, capacity);
            if (samples.Count == 0)
            {
                return EmptyUtilizationTrend("No recent Capacity Intelligence rollups were found for Capacity Utilization Trend.");
            }

            var avgUtilization = samples.Average(row => row.UtilizationPct);
            var maxSample = samples.OrderByDescending(row => row.UtilizationPct).First();
            var minSample = samples.OrderBy(row => row.UtilizationPct).First();
            var over80 = samples.Count(row => row.UtilizationPct > 80);
            var over90 = samples.Count(row => row.UtilizationPct > 90);
            var under60 = samples.Count(row => row.UtilizationPct < 60);
            var intervalHours = EstimateIntervalHours(samples);
            var latest = samples.OrderBy(row => row.Timestamp).Last();

            return new CapacityUtilizationTrendData(
                Benchmarks:
                [
                    new("#65a30d", "Your Site", $"{FormatNumber(avgUtilization, 0)}%"),
                    new("#64748b", "Similar Sites Average", "No Data"),
                    new("#64748b", "Industry Average", "No Data"),
                    new("#64748b", "Best in Class", "No Data"),
                ],
                DailyRows: BuildTrendDailyRows(samples),
                Distribution: BuildTrendDistribution(samples),
                Forecast: BuildTrendForecast(samples),
                Heatmap: BuildTrendHeatmap(samples),
                HeatmapDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                HeatmapHours: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"],
                Kpis:
                [
                    new("#147dff", "Nameplate capacity", "C", "Total Connected Capacity", $"{FormatNumber(capacity.InstalledCapacity, 0)} kVA"),
                    new("#05ff5e", $"{FormatNumber(latest.UtilizationPct, 0)}% of connected", "U", "Total Utilized Capacity", $"{FormatNumber(latest.UsedKva, 0)} kVA"),
                    new("#147dff", "Available after ECBS recovery", "A", "Total Available Capacity", $"{FormatNumber(latest.AvailableKva, 0)} kVA"),
                    new("#05ff5e", maxSample.Timestamp.HasValue ? FormatTimestamp(maxSample.Timestamp.Value) : "No Data", "P", "Peak Utilization", $"{FormatNumber(maxSample.UtilizationPct, 0)}%"),
                    new("#05ff5e", "Recent main-meter telemetry", "G", "Average Utilization", $"{FormatNumber(avgUtilization, 0)}%"),
                    new("#f59e0b", $"{FormatNumber(over80 * intervalHours, 1)} hrs", "T", "Time Over 80%", $"{FormatNumber(samples.Count > 0 ? over80 / (double)samples.Count * 100 : 0, 1)}%"),
                ],
                Message: "",
                PeakEvents: BuildTrendPeakEvents(samples),
                Recommendations: BuildTrendRecommendations(avgUtilization, maxSample.UtilizationPct, over80, samples.Count),
                State: "data",
                SummaryRows:
                [
                    new("Average Utilization", $"{FormatNumber(avgUtilization, 0)}%"),
                    new("Maximum Utilization", $"{FormatNumber(maxSample.UtilizationPct, 0)}%  {(maxSample.Timestamp.HasValue ? FormatTimestamp(maxSample.Timestamp.Value) : "No Data")}"),
                    new("Minimum Utilization", $"{FormatNumber(minSample.UtilizationPct, 0)}%  {(minSample.Timestamp.HasValue ? FormatTimestamp(minSample.Timestamp.Value) : "No Data")}"),
                    new("Time Over 80%", $"{FormatNumber(samples.Count > 0 ? over80 / (double)samples.Count * 100 : 0, 1)}%  {FormatNumber(over80 * intervalHours, 1)} hrs"),
                    new("Time Over 90%", $"{FormatNumber(samples.Count > 0 ? over90 / (double)samples.Count * 100 : 0, 1)}%  {FormatNumber(over90 * intervalHours, 1)} hrs"),
                    new("Time Under 60%", $"{FormatNumber(samples.Count > 0 ? under60 / (double)samples.Count * 100 : 0, 1)}%  {FormatNumber(under60 * intervalHours, 1)} hrs"),
                    new("Data Points", FormatNumber(samples.Count, 0)),
                    new("Granularity", $"{FormatNumber(intervalHours * 60, 0)} Minutes"),
                ],
                Trend: BuildUtilizationTrendPoints(samples, capacity.InstalledCapacity),
                UpdatedAt: latest.Timestamp.HasValue ? FormatTimestamp(latest.Timestamp.Value) : FormatTimestamp(capacity.BucketTs ?? DateTimeOffset.UtcNow));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Ochsner Capacity Utilization Trend data from tracking.");
            return EmptyUtilizationTrend("Tracking DB data is unavailable for Capacity Utilization Trend.");
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

    private static async Task<IReadOnlyList<CapacityMinuteTrendRow>> ReadUtilizationTelemetryAsync(
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
              AND totalKva IS NOT NULL
            ORDER BY recordedAt DESC
            LIMIT 1008
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
            SELECT
                annual_savings,
                demand_savings,
                capacity_value,
                co2_reduction_tons,
                (
                    SELECT MIN(bucket_ts)
                    FROM savings_intelligence
                    WHERE project_id = 13 AND annual_savings IS NOT NULL
                ) AS activation_bucket_ts
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
            ActivationDate: ReadUnixMilliseconds(reader, "activation_bucket_ts"),
            AnnualSavings: ReadDouble(reader, "annual_savings"),
            CapacityValue: ReadDouble(reader, "capacity_value"),
            Co2ReductionTons: ReadDouble(reader, "co2_reduction_tons"),
            DemandSavings: ReadDouble(reader, "demand_savings"));
    }

    private static IReadOnlyList<EnergySavingsBreakdownRow> BuildSavingsWaterfallRows(double annualSavings, double demandSavings, double capacityValue)
    {
        var rows = new List<EnergySavingsBreakdownRow>();
        var annualRemainder = Math.Max(0, annualSavings - demandSavings);

        rows.Add(new EnergySavingsBreakdownRow(
            annualSavings > 0 ? "Latest savings_intelligence.annual_savings" : "No Data",
            "Total Annual Savings",
            annualSavings > 0 ? FormatCurrency(annualSavings) : "No Data"));

        rows.Add(new EnergySavingsBreakdownRow(
            demandSavings > 0 ? "tracking.savings_intelligence.demand_savings" : "No Data - demand_savings is not populated.",
            "Demand Savings",
            demandSavings > 0 ? FormatCurrency(demandSavings) : "No Data"));

        rows.Add(new EnergySavingsBreakdownRow(
            annualRemainder > 0 ? "Calculated: annual_savings - demand_savings" : "No Data - no remaining annual savings split.",
            "Other / Energy Savings",
            annualRemainder > 0 ? FormatCurrency(annualRemainder) : "No Data"));

        rows.Add(new EnergySavingsBreakdownRow(
            capacityValue > 0 ? "tracking.savings_intelligence.capacity_value; shown separately from annual savings total." : "No Data - capacity_value is not populated.",
            "Capacity Value (Separate)",
            capacityValue > 0 ? FormatCurrency(capacityValue) : "No Data"));

        return rows;
    }

    private static double? CalculateCumulativeSavings(double annualSavings, DateTimeOffset? activationDate, DateTimeOffset now)
    {
        if (annualSavings <= 0 || !activationDate.HasValue || activationDate.Value > now)
        {
            return null;
        }

        var activeDays = Math.Max(0, (now - activationDate.Value).TotalDays);
        return annualSavings / 365.25 * activeDays;
    }

    private static string FormatPeriodSavings(double annualSavings, DateTimeOffset periodStart, DateTimeOffset now)
    {
        if (annualSavings <= 0 || periodStart > now)
        {
            return "No Data";
        }

        var activeDays = Math.Max(0, (now - periodStart).TotalDays);
        return FormatCurrency(annualSavings / 365.25 * activeDays);
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

    private static IReadOnlyList<CapacityKpi> BuildHealthKpis(
        int health,
        IReadOnlyList<CapacityHealthDiagnosticCard> diagnostics,
        IReadOnlyList<CapacitySummary> trendRows)
    {
        var rows = new List<CapacityKpi>
        {
            new("#65a30d", HealthRating(health), "H", "Overall Health Score", $"{health}"),
        };

        rows.AddRange(diagnostics.Select(card => new CapacityKpi(
            card.Tone,
            $"{DeltaVsAverage(card.Score, trendRows)} vs recent average",
            card.Title[..1],
            card.Title,
            $"{card.Score}/100")));

        return rows;
    }

    private static IReadOnlyList<CapacityHealthDiagnosticCard> BuildHealthDiagnostics(
        double utilization,
        IReadOnlyList<CapacityMeter> meters)
    {
        var loadBalance = ScoreLoadBalance(utilization);
        var utilizationScore = ScoreUtilization(utilization);
        var voltage = ScoreVoltage(meters);
        var harmonics = ScoreHarmonics(meters);
        var thermal = ScoreThermalHeadroom(utilization);

        return
        [
            new(
                Factors:
                [
                    new("Utilization Balance", $"{loadBalance}/100"),
                    new("Peak Load Spread", $"{ScoreUtilization(utilization)}/100"),
                    new("Load Symmetry", $"{Math.Max(0, loadBalance - 2)}/100"),
                ],
                Score: loadBalance,
                Status: HealthRating(loadBalance),
                Title: "Load Balance",
                Tone: HealthColor(loadBalance)),
            new(
                Factors:
                [
                    new("Utilization Level", $"{utilizationScore}/100"),
                    new("Peak Management", $"{Math.Max(0, utilizationScore - 2)}/100"),
                    new("Headroom Availability", $"{thermal}/100"),
                ],
                Score: utilizationScore,
                Status: HealthRating(utilizationScore),
                Title: "Utilization Efficiency",
                Tone: HealthColor(utilizationScore)),
            new(
                Factors:
                [
                    new("Power Factor", $"{voltage}/100"),
                    new("Voltage Proxy", $"{voltage}/100"),
                    new("Stability", $"{Math.Max(0, voltage - 1)}/100"),
                ],
                Score: voltage,
                Status: HealthRating(voltage),
                Title: "Voltage Stability",
                Tone: HealthColor(voltage)),
            new(
                Factors:
                [
                    new("THD Level", $"{harmonics}/100"),
                    new("Power Quality", $"{Math.Max(0, harmonics - 1)}/100"),
                    new("Harmonic Headroom", $"{Math.Max(0, harmonics - 3)}/100"),
                ],
                Score: harmonics,
                Status: HealthRating(harmonics),
                Title: "Harmonic Impact",
                Tone: HealthColor(harmonics)),
            new(
                Factors:
                [
                    new("Asset Loading", $"{thermal}/100"),
                    new("Thermal Headroom", $"{thermal}/100"),
                    new("Capacity Margin", $"{Math.Max(0, thermal - 2)}/100"),
                ],
                Score: thermal,
                Status: HealthRating(thermal),
                Title: "Thermal Headroom",
                Tone: HealthColor(thermal)),
        ];
    }

    private static IReadOnlyList<CapacityAssetHealth> BuildAssetHealthRows(
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

        return ratedAssets.Select(entry =>
        {
            var meter = meters.FirstOrDefault(row => row.Id == entry.Asset.MeterId);
            var share = entry.Connected / totalConnected;
            var utilized = meter is not null && meter.LastTotalKva > 0 ? meter.LastTotalKva : used * share;
            var utilization = entry.Connected > 0 ? ClampScore(utilized / entry.Connected * 100) : 0;
            var recoveredShare = recovered * share;
            var score = (int)Math.Round(ClampScore(100 - Math.Max(0, utilization - 70)));
            return new CapacityAssetHealth(
                AssetType: TitleCase(entry.Asset.AssetType),
                Name: entry.Asset.Name,
                RecoveredKva: recoveredShare,
                Score: score,
                UtilizationPct: utilization);
        }).ToList();
    }

    private static IReadOnlyList<CapacityRecoveryDonutRow> BuildHealthDistribution(IReadOnlyList<CapacityAssetHealth> rows)
    {
        if (rows.Count == 0)
        {
            return Array.Empty<CapacityRecoveryDonutRow>();
        }

        var buckets = new[]
        {
            new { Label = "Excellent (90-100)", Color = "#65a30d", Count = rows.Count(row => row.Score >= 90) },
            new { Label = "Good (70-89)", Color = "#147dff", Count = rows.Count(row => row.Score >= 70 && row.Score < 90) },
            new { Label = "Fair (50-69)", Color = "#f59e0b", Count = rows.Count(row => row.Score >= 50 && row.Score < 70) },
            new { Label = "Poor (<50)", Color = "#ef4444", Count = rows.Count(row => row.Score < 50) },
        };

        return buckets.Select(bucket => new CapacityRecoveryDonutRow(
            bucket.Color,
            bucket.Label,
            $"{bucket.Count} ({FormatNumber(bucket.Count / (double)rows.Count * 100, 1)}%)")).ToList();
    }

    private static IReadOnlyList<CapacityHealthAssetBar> BuildHealthAssetBars(IReadOnlyList<CapacityAssetHealth> rows)
    {
        if (rows.Count == 0)
        {
            return Array.Empty<CapacityHealthAssetBar>();
        }

        return rows
            .GroupBy(row => row.AssetType)
            .Select(group =>
            {
                var score = (int)Math.Round(group.Average(row => row.Score));
                return new CapacityHealthAssetBar(HealthColor(score), group.Key, score);
            })
            .OrderByDescending(row => row.Value)
            .Take(6)
            .ToList();
    }

    private static IReadOnlyList<CapacityHealthIssueRow> BuildHealthIssues(
        IReadOnlyList<CapacityAssetHealth> assetRows,
        IReadOnlyList<CapacityMeter> meters)
    {
        var issues = new List<CapacityHealthIssueRow>();
        issues.AddRange(assetRows
            .Where(row => row.UtilizationPct >= 85)
            .OrderByDescending(row => row.UtilizationPct)
            .Take(4)
            .Select(row => new CapacityHealthIssueRow(
                row.Name,
                row.UtilizationPct >= 95 ? "High" : "Medium",
                "Asset utilization is elevated",
                "Review load schedule and capacity headroom",
                row.UtilizationPct >= 95 ? "High" : "Medium")));

        var main = meters.FirstOrDefault(meter => meter.IsMain) ?? meters.FirstOrDefault();
        if (main is not null && main.LastTotalThd > 5)
        {
            issues.Add(new CapacityHealthIssueRow(
                main.Name,
                "Medium",
                "THD is above preferred operating threshold",
                "Review harmonic mitigation options",
                "Medium"));
        }

        if (main is not null)
        {
            var pf = main.LastTotalPf > 1 ? main.LastTotalPf / 100 : main.LastTotalPf;
            if (pf > 0 && pf < 0.9)
            {
                issues.Add(new CapacityHealthIssueRow(
                    main.Name,
                    "Medium",
                    "Power factor is below preferred operating threshold",
                    "Review power factor correction settings",
                    "Medium"));
            }
        }

        return issues.Take(4).ToList();
    }

    private static IReadOnlyList<string> BuildHealthRecommendations(IReadOnlyList<CapacityHealthIssueRow> issues)
    {
        if (issues.Count == 0)
        {
            return
            [
                "No calculated capacity health issues were found in tracking.",
            ];
        }

        return issues.Select(issue => issue.Recommendation).Distinct().Take(4).ToList();
    }

    private static string DeltaVsAverage(int score, IReadOnlyList<CapacitySummary> trendRows)
    {
        var values = trendRows.Select(row => row.CapacityHealthScore).Where(value => value > 0).ToList();
        if (values.Count == 0)
        {
            return "No Data";
        }

        var delta = score - values.Average();
        return delta >= 0 ? $"+{FormatNumber(delta, 0)}" : FormatNumber(delta, 0);
    }

    private static string HealthRating(int score)
    {
        if (score >= 90)
        {
            return "Excellent";
        }

        if (score >= 70)
        {
            return "Good";
        }

        if (score >= 50)
        {
            return "Fair";
        }

        return score > 0 ? "Poor" : "No Data";
    }

    private static string HealthColor(int score)
    {
        if (score >= 90)
        {
            return "#65a30d";
        }

        if (score >= 70)
        {
            return "#147dff";
        }

        if (score >= 50)
        {
            return "#f59e0b";
        }

        return score > 0 ? "#ef4444" : "#64748b";
    }

    private static IReadOnlyList<CapacityUtilizationSample> BuildUtilizationSamples(
        IReadOnlyList<CapacitySummary> trendRows,
        CapacitySummary capacity)
    {
        var rows = trendRows.Count > 0 ? trendRows : new[] { capacity };
        if (rows.Count == 0)
        {
            return Array.Empty<CapacityUtilizationSample>();
        }

        return rows
            .Where(row => row.InstalledCapacity > 0 && row.BucketTs is not null)
            .OrderBy(row => row.BucketTs)
            .Select(row =>
            {
                var used = row.UsedCapacity;
                return new CapacityUtilizationSample(
                    AvailableKva: Math.Max(0, row.AvailableCapacity + row.RecoverableCapacity),
                    ConnectedKva: row.InstalledCapacity,
                    Timestamp: row.BucketTs,
                    UsedKva: used,
                    UtilizationPct: ClampScore(row.UtilizationPct > 0 ? row.UtilizationPct : used / row.InstalledCapacity * 100));
            })
            .ToList();
    }

    private static IReadOnlyList<CapacityUtilizationTrendPoint> BuildUtilizationTrendPoints(
        IReadOnlyList<CapacityUtilizationSample> samples,
        double connected)
    {
        return ThinSamples(samples, 28).Select(row => new CapacityUtilizationTrendPoint(
            Available: row.AvailableKva,
            Connected: connected,
            Label: row.Timestamp.HasValue ? FormatShortDate(row.Timestamp.Value) : "",
            UtilizationPct: row.UtilizationPct,
            Used: row.UsedKva)).ToList();
    }

    private static IReadOnlyList<CapacityTrendDailyRow> BuildTrendDailyRows(IReadOnlyList<CapacityUtilizationSample> samples)
    {
        return samples
            .Where(row => row.Timestamp is not null)
            .GroupBy(row => LocalDate(row.Timestamp!.Value).Date)
            .OrderByDescending(group => group.Key)
            .Take(7)
            .Select(group =>
            {
                var values = group.ToList();
                var avg = values.Average(row => row.UtilizationPct);
                var peak = values.Max(row => row.UtilizationPct);
                var offPeak = values
                    .Where(row => IsOffPeak(row.Timestamp!.Value))
                    .Select(row => row.UtilizationPct)
                    .DefaultIfEmpty(values.Min(row => row.UtilizationPct))
                    .Average();
                var over80Hours = values.Count(row => row.UtilizationPct > 80) * EstimateIntervalHours(values);
                return new CapacityTrendDailyRow(
                    AverageUtilization: $"{FormatNumber(avg, 0)}%",
                    Color: HealthColor((int)Math.Round(100 - Math.Max(0, peak - 80))),
                    Date: group.Key.ToString("MMM d, yyyy"),
                    MaxKva: FormatNumber(values.Max(row => row.UsedKva), 0),
                    MinKva: FormatNumber(values.Min(row => row.UsedKva), 0),
                    OffPeakUtilization: $"{FormatNumber(offPeak, 0)}%",
                    PeakUtilization: $"{FormatNumber(peak, 0)}%",
                    TimeOver80: $"{FormatNumber(over80Hours, 1)} hrs");
            })
            .ToList();
    }

    private static IReadOnlyList<CapacityRecoveryDonutRow> BuildTrendDistribution(IReadOnlyList<CapacityUtilizationSample> samples)
    {
        if (samples.Count == 0)
        {
            return Array.Empty<CapacityRecoveryDonutRow>();
        }

        var buckets = new[]
        {
            new { Label = "0% - 60%", Color = "#65a30d", Count = samples.Count(row => row.UtilizationPct < 60) },
            new { Label = "60% - 80%", Color = "#147dff", Count = samples.Count(row => row.UtilizationPct >= 60 && row.UtilizationPct < 80) },
            new { Label = "80% - 90%", Color = "#f59e0b", Count = samples.Count(row => row.UtilizationPct >= 80 && row.UtilizationPct < 90) },
            new { Label = "90% - 100%", Color = "#ef4444", Count = samples.Count(row => row.UtilizationPct >= 90) },
        };

        return buckets.Select(bucket => new CapacityRecoveryDonutRow(
            bucket.Color,
            bucket.Label,
            $"{FormatNumber(bucket.Count / (double)samples.Count * 100, 1)}% ({bucket.Count})")).ToList();
    }

    private static IReadOnlyList<CapacityTrendHeatmapCell> BuildTrendHeatmap(IReadOnlyList<CapacityUtilizationSample> samples)
    {
        return samples
            .Where(row => row.Timestamp is not null)
            .GroupBy(row =>
            {
                var local = LocalDate(row.Timestamp!.Value);
                return new { Row = DayRow(local.DayOfWeek), Column = Math.Min(5, local.Hour / 4) };
            })
            .Select(group => new CapacityTrendHeatmapCell(group.Key.Column, group.Key.Row, group.Average(row => row.UtilizationPct)))
            .Where(cell => cell.Row >= 0)
            .ToList();
    }

    private static IReadOnlyList<CapacityTrendPeakEvent> BuildTrendPeakEvents(IReadOnlyList<CapacityUtilizationSample> samples)
    {
        return samples
            .Where(row => row.Timestamp is not null)
            .OrderByDescending(row => row.UtilizationPct)
            .Take(5)
            .Select((row, index) => new CapacityTrendPeakEvent(
                Duration: "No Data",
                Kva: FormatNumber(row.UsedKva, 0),
                Rank: (index + 1).ToString(),
                Timestamp: FormatTimestamp(row.Timestamp!.Value),
                Utilization: $"{FormatNumber(row.UtilizationPct, 0)}%"))
            .ToList();
    }

    private static CapacityTrendForecast BuildTrendForecast(IReadOnlyList<CapacityUtilizationSample> samples)
    {
        var ordered = samples.OrderBy(row => row.Timestamp).ToList();
        var latestAverage = ordered.TakeLast(Math.Min(96, ordered.Count)).Select(row => row.UtilizationPct).DefaultIfEmpty(0).Average();
        var priorAverage = ordered.Take(Math.Max(0, ordered.Count - Math.Min(96, ordered.Count))).Select(row => row.UtilizationPct).DefaultIfEmpty(latestAverage).Average();
        var delta = latestAverage - priorAverage;
        var projected = ClampScore(latestAverage + delta);
        var points =
            Enumerable.Range(0, 7)
                .Select(index => new CapacityHealthTrendPoint($"P{index + 1}", (int)Math.Round(ClampScore(projected + (index - 3) * 0.4))))
                .ToList();

        return new CapacityTrendForecast(
            DeltaLabel: delta >= 0 ? $"+{FormatNumber(delta, 1)}% vs recent baseline" : $"{FormatNumber(delta, 1)}% vs recent baseline",
            ProjectedUtilization: $"{FormatNumber(projected, 0)}%",
            Points: points);
    }

    private static IReadOnlyList<string> BuildTrendRecommendations(double averageUtilization, double peakUtilization, int over80Count, int totalCount)
    {
        var recommendations = new List<string>();
        if (peakUtilization > 90)
        {
            recommendations.Add("Peak utilization exceeded 90%; review peak-period load scheduling.");
        }
        else if (peakUtilization > 80)
        {
            recommendations.Add("Peak utilization exceeded 80%; monitor afternoon demand windows.");
        }
        else
        {
            recommendations.Add("Utilization is within the calculated operating range from tracking.");
        }

        if (totalCount > 0 && over80Count / (double)totalCount > 0.2)
        {
            recommendations.Add("Time over 80% is elevated; evaluate load shifting opportunities.");
        }

        if (averageUtilization < 60)
        {
            recommendations.Add("Average utilization is below 60%; review unused capacity assumptions.");
        }

        recommendations.Add("Benchmark comparisons are No Data because tracking does not provide peer benchmark sources.");
        return recommendations.Take(4).ToList();
    }

    private static double EstimateIntervalHours(IReadOnlyList<CapacityUtilizationSample> samples)
    {
        var timestamps = samples
            .Select(row => row.Timestamp)
            .Where(timestamp => timestamp is not null)
            .Select(timestamp => timestamp!.Value)
            .OrderBy(timestamp => timestamp)
            .ToList();
        if (timestamps.Count < 2)
        {
            return 0.25;
        }

        var gaps = timestamps.Zip(timestamps.Skip(1), (left, right) => Math.Abs((right - left).TotalHours))
            .Where(hours => hours > 0)
            .OrderBy(hours => hours)
            .ToList();
        return gaps.Count == 0 ? 0.25 : Math.Min(1, Math.Max(1.0 / 60, gaps[gaps.Count / 2]));
    }

    private static IReadOnlyList<CapacityUtilizationSample> ThinSamples(IReadOnlyList<CapacityUtilizationSample> samples, int maxCount)
    {
        if (samples.Count <= maxCount)
        {
            return samples;
        }

        var step = (double)(samples.Count - 1) / (maxCount - 1);
        return Enumerable.Range(0, maxCount)
            .Select(index => samples[(int)Math.Round(index * step)])
            .ToList();
    }

    private static DateTime LocalDate(DateTimeOffset timestamp)
    {
        return TimeZoneInfo.ConvertTime(timestamp, CentralTimeZone()).DateTime;
    }

    private static bool IsOffPeak(DateTimeOffset timestamp)
    {
        var hour = LocalDate(timestamp).Hour;
        return hour < 7 || hour >= 20;
    }

    private static int DayRow(DayOfWeek day)
    {
        return day switch
        {
            DayOfWeek.Monday => 0,
            DayOfWeek.Tuesday => 1,
            DayOfWeek.Wednesday => 2,
            DayOfWeek.Thursday => 3,
            DayOfWeek.Friday => 4,
            DayOfWeek.Saturday => 5,
            DayOfWeek.Sunday => 6,
            _ => -1,
        };
    }

    private static IReadOnlyList<CapacityRecoveryTrendPoint> BuildRecoveryTrend(IReadOnlyList<CapacitySummary> trendRows)
    {
        return trendRows.Reverse().Select(row => new CapacityRecoveryTrendPoint(
            BaselineUsed: row.UsedCapacity + row.HiddenCapacity,
            Label: row.BucketTs.HasValue ? FormatShortTime(row.BucketTs.Value) : "",
            Recovered: row.RecoverableCapacity,
            Used: row.UsedCapacity)).ToList();
    }

    private static IReadOnlyList<CapacityRecoveryBarRow> BuildRecoveryContributionRows(
        IReadOnlyList<CapacityAssetSource> assets,
        double installed,
        double recovered)
    {
        var colors = new[] { "#65a30d", "#84cc16", "#147dff", "#a855f7", "#22c55e", "#22d3ee" };
        var grouped = assets
            .Select(asset => new { Type = TitleCase(asset.AssetType), Connected = AssetConnectedKva(asset) })
            .Where(entry => entry.Connected > 0)
            .GroupBy(entry => entry.Type)
            .Select(group => new { Label = group.Key, Connected = group.Sum(entry => entry.Connected) })
            .OrderByDescending(entry => entry.Connected)
            .ToList();
        var totalConnected = grouped.Sum(entry => entry.Connected);
        if (totalConnected <= 0)
        {
            totalConnected = installed > 0 ? installed : 1;
        }

        return grouped.Select((entry, index) =>
        {
            var value = recovered * entry.Connected / totalConnected;
            var percent = recovered > 0 ? value / recovered * 100 : 0;
            return new CapacityRecoveryBarRow(
                Color: colors[Math.Min(index, colors.Length - 1)],
                Label: entry.Label,
                Percent: $"{FormatNumber(percent, 1)}%",
                Value: FormatNumber(value, 0));
        }).ToList();
    }

    private static IReadOnlyList<CapacityRecoveryTableRow> BuildRecoveryTimeRows(IReadOnlyList<CapacitySummary> trendRows)
    {
        if (trendRows.Count == 0)
        {
            return
            [
                new("No Data", "No Data", "No Data", "No Data"),
            ];
        }

        return trendRows
            .OrderBy(row => row.BucketTs)
            .TakeLast(6)
            .Select(row => new CapacityRecoveryTableRow(
                AvgKva: FormatNumber(row.RecoverableCapacity, 0),
                Consistency: $"{FormatNumber(RecoveryConsistency(new[] { row }), 1)}%",
                MaxKva: FormatNumber(row.RecoverableCapacity, 0),
                TimePeriod: row.BucketTs.HasValue ? FormatShortTime(row.BucketTs.Value) : "No Data"))
            .ToList();
    }

    private static double RecoveryConsistency(IReadOnlyList<CapacitySummary> trendRows)
    {
        var values = trendRows.Select(row => row.RecoverableCapacity).Where(value => value > 0).ToList();
        if (values.Count == 0)
        {
            return 0;
        }

        var average = values.Average();
        if (average <= 0)
        {
            return 0;
        }

        var averageDeviation = values.Average(value => Math.Abs(value - average));
        return ClampScore(100 - averageDeviation / average * 100);
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
            AnnualSavingsValue: 0,
            ActivationDate: "No Data",
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
            CumulativeSavingsModel: "No Data - M-016 requires annual_savings and activation date.",
            CumulativeSavingsSinceActivation: "No Data",
            DateRange: "Tracking DB",
            DeferredCapitalValue: 0,
            DemandSavingsValue: 0,
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
            PaybackYears: 0,
            ProjectCost: ManualProjectCost,
            RoiPct: 0,
            SavingsWaterfallRows: BuildSavingsWaterfallRows(0, 0, 0),
            SavingsPerDay: 0,
            SavingsPerHour: 0,
            SavingsPerMinute: 0,
            SavingsPerMonth: 0,
            SavingsThisMonth: "No Data",
            SavingsThisYear: "No Data",
            SavingsToday: "No Data",
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

    private static CapacityRecoveryBreakdownData EmptyRecoveryBreakdown(string message)
    {
        return new CapacityRecoveryBreakdownData(
            AfterOverCapacity: "No Data",
            AfterPeak: "No Data",
            BeforeOverCapacity: "No Data",
            BeforePeak: "No Data",
            ContributionRows: Array.Empty<CapacityRecoveryBarRow>(),
            EventRows: Array.Empty<CapacityRecoveryEventRow>(),
            Kpis:
            [
                new("#64748b", "No Data", "R", "Total Capacity Recovered", "No Data"),
                new("#64748b", "No Data", "!", "Before ECBS (Peak)", "No Data"),
                new("#64748b", "No Data", "✓", "After ECBS (Peak)", "No Data"),
                new("#64748b", "No Data", "%", "Recovery Percentage", "No Data"),
                new("#64748b", "No Data", "O", "Over-Capacity Eliminated", "No Data"),
                new("#64748b", "No Data", "S", "Sustained Recovery", "No Data"),
            ],
            Message: message,
            RecoveryByAssetType: Array.Empty<CapacityRecoveryDonutRow>(),
            RecoveryPercent: "No Data",
            SummaryRows:
            [
                new("Maximum Capacity Recovered", "No Data"),
                new("Average Daily Recovery", "No Data"),
                new("Recovery Consistency", "No Data"),
                new("Peak Demand Reduction", "No Data"),
                new("Overload Conditions Removed", "No Data"),
                new("System Efficiency Improvement", "No Data"),
            ],
            State: "empty",
            TimePeriodRows:
            [
                new("No Data", "No Data", "No Data", "No Data"),
            ],
            Trend: Array.Empty<CapacityRecoveryTrendPoint>(),
            UpdatedAt: "No Data");
    }

    private static CapacityHealthDiagnosticsData EmptyHealthDiagnostics(string message)
    {
        return new CapacityHealthDiagnosticsData(
            AssetBars: Array.Empty<CapacityHealthAssetBar>(),
            Diagnostics:
            [
                new([new("Source", "No Data")], 0, "No Data", "Load Balance", "#64748b"),
                new([new("Source", "No Data")], 0, "No Data", "Utilization Efficiency", "#64748b"),
                new([new("Source", "No Data")], 0, "No Data", "Voltage Stability", "#64748b"),
                new([new("Source", "No Data")], 0, "No Data", "Harmonic Impact", "#64748b"),
                new([new("Source", "No Data")], 0, "No Data", "Thermal Headroom", "#64748b"),
            ],
            Distribution: Array.Empty<CapacityRecoveryDonutRow>(),
            Kpis:
            [
                new("#64748b", "No Data", "H", "Overall Health Score", "No Data"),
                new("#64748b", "No Data", "B", "Load Balance", "No Data"),
                new("#64748b", "No Data", "U", "Utilization Efficiency", "No Data"),
                new("#64748b", "No Data", "V", "Voltage Stability", "No Data"),
                new("#64748b", "No Data", "W", "Harmonic Impact", "No Data"),
                new("#64748b", "No Data", "T", "Thermal Headroom", "No Data"),
            ],
            Message: message,
            Issues: Array.Empty<CapacityHealthIssueRow>(),
            Recommendations:
            [
                message,
            ],
            State: "empty",
            SummaryRows:
            [
                new("Overall Health Score", "No Data"),
                new("Assets Evaluated", "No Data"),
                new("Average Utilization", "No Data"),
                new("Power Factor Score", "No Data"),
                new("Harmonic Score", "No Data"),
                new("Updated", "No Data"),
            ],
            Trend: Array.Empty<CapacityHealthTrendPoint>(),
            UpdatedAt: "No Data");
    }

    private static CapacityUtilizationTrendData EmptyUtilizationTrend(string message)
    {
        return new CapacityUtilizationTrendData(
            Benchmarks:
            [
                new("#64748b", "Your Site", "No Data"),
                new("#64748b", "Similar Sites Average", "No Data"),
                new("#64748b", "Industry Average", "No Data"),
                new("#64748b", "Best in Class", "No Data"),
            ],
            DailyRows: Array.Empty<CapacityTrendDailyRow>(),
            Distribution: Array.Empty<CapacityRecoveryDonutRow>(),
            Forecast: new("No Data", "No Data", Array.Empty<CapacityHealthTrendPoint>()),
            Heatmap: Array.Empty<CapacityTrendHeatmapCell>(),
            HeatmapDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            HeatmapHours: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"],
            Kpis:
            [
                new("#64748b", "No Data", "C", "Total Connected Capacity", "No Data"),
                new("#64748b", "No Data", "U", "Total Utilized Capacity", "No Data"),
                new("#64748b", "No Data", "A", "Total Available Capacity", "No Data"),
                new("#64748b", "No Data", "P", "Peak Utilization", "No Data"),
                new("#64748b", "No Data", "G", "Average Utilization", "No Data"),
                new("#64748b", "No Data", "T", "Time Over 80%", "No Data"),
            ],
            Message: message,
            PeakEvents: Array.Empty<CapacityTrendPeakEvent>(),
            Recommendations:
            [
                message,
            ],
            State: "empty",
            SummaryRows:
            [
                new("Average Utilization", "No Data"),
                new("Maximum Utilization", "No Data"),
                new("Minimum Utilization", "No Data"),
                new("Time Over 80%", "No Data"),
                new("Time Over 90%", "No Data"),
                new("Time Under 60%", "No Data"),
                new("Data Points", "No Data"),
                new("Granularity", "No Data"),
            ],
            Trend: Array.Empty<CapacityUtilizationTrendPoint>(),
            UpdatedAt: "No Data");
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

    private static string FormatShortDate(DateTimeOffset timestamp)
    {
        var central = TimeZoneInfo.ConvertTime(timestamp, CentralTimeZone());
        return central.ToString("MMM d");
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

    private sealed record CapacitySavings(DateTimeOffset? ActivationDate, double AnnualSavings, double CapacityValue, double Co2ReductionTons, double DemandSavings);

    private sealed record CapacityAssetHealth(string AssetType, string Name, double RecoveredKva, int Score, double UtilizationPct);

    private sealed record CapacityUtilizationSample(
        double AvailableKva,
        double ConnectedKva,
        DateTimeOffset? Timestamp,
        double UsedKva,
        double UtilizationPct);
}
