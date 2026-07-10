using ECBS.Application.ScreenData;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace ECBS.Infrastructure.ScreenData;

public sealed class TrackingClientManagementDataService(
    IConfiguration configuration,
    ILogger<TrackingClientManagementDataService> logger)
    : IClientManagementDataService
{
    public async Task<ClientManagementData> GetClientManagementAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new MySqlConnection(GetTrackingConnectionString());
            await connection.OpenAsync(cancellationToken);

            var clients = await ReadClientsAsync(connection, cancellationToken);
            if (clients.Count == 0)
            {
                return EmptyClientManagement("No client records were found in tracking.");
            }

            var clientIds = clients.Select(client => client.Id).ToList();
            var projectSummaries = await ReadProjectSummariesAsync(connection, clientIds, cancellationToken);
            var siteCounts = await ReadSiteCountsAsync(connection, clientIds, cancellationToken);
            var selectedClient = clients.FirstOrDefault(client => IsOchsner(client)) ?? clients[0];
            var selectedProjects = await ReadProjectsAsync(connection, selectedClient.Id, cancellationToken);
            projectSummaries.TryGetValue(selectedClient.Id, out var selectedSummary);
            siteCounts.TryGetValue(selectedClient.Id, out var selectedSiteCount);

            return new ClientManagementData(
                Clients: clients.Select(client =>
                {
                    projectSummaries.TryGetValue(client.Id, out var summary);
                    var hasSiteCount = siteCounts.TryGetValue(client.Id, out var siteCount);

                    return new ClientManagementClientRow(
                        ActiveProjects: summary?.ProjectCount.ToString() ?? "0",
                        ContractNumber: "No Data",
                        Industry: client.MarketSegment ?? "No Data",
                        JoinedDate: FormatTimestamp(client.CreatedAt),
                        Name: client.Name ?? "No Data",
                        Sites: hasSiteCount ? siteCount.ToString() : "No Data",
                        Status: "Active",
                        TotalCapacity: summary is not null && summary.HasCapacity ? FormatMw(summary.TotalCapacityKva) : "No Data");
                }).ToList(),
                ClientKpis: BuildClientKpis(clients, projectSummaries, siteCounts),
                Message: "",
                Projects: selectedProjects,
                ProjectKpis: BuildProjectKpis(selectedProjects),
                SelectedClient: BuildSelectedClient(selectedClient, selectedSummary, selectedSiteCount),
                State: "data",
                UpdatedAt: FormatTimestamp(DateTimeOffset.UtcNow));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to load Client Management data from tracking.");
            return EmptyClientManagement("Tracking DB data is unavailable for Client Management.");
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

    private static async Task<IReadOnlyList<ClientSource>> ReadClientsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, name, legalName, address, city, state, zip, country,
                   contactName, contactTitle, contactPhone, marketSegment, taxId,
                   managerName, managerPhone, managerEmail, createdAt
            FROM client
            WHERE COALESCE(isDeleted, 0) = 0
            ORDER BY CASE WHEN LOWER(CONCAT_WS(' ', name, legalName, address, city, state)) LIKE '%ochsner%' THEN 0 ELSE 1 END,
                     name,
                     id
            LIMIT 50
            """;

        var rows = new List<ClientSource>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new ClientSource(
                Address: ReadString(reader, "address"),
                City: ReadString(reader, "city"),
                ContactName: ReadString(reader, "contactName"),
                ContactPhone: ReadString(reader, "contactPhone"),
                ContactTitle: ReadString(reader, "contactTitle"),
                Country: ReadString(reader, "country"),
                CreatedAt: ReadUnixMilliseconds(reader, "createdAt"),
                Id: ReadInt(reader, "id"),
                LegalName: ReadString(reader, "legalName"),
                ManagerEmail: ReadString(reader, "managerEmail"),
                ManagerName: ReadString(reader, "managerName"),
                ManagerPhone: ReadString(reader, "managerPhone"),
                MarketSegment: ReadString(reader, "marketSegment"),
                Name: ReadString(reader, "name"),
                State: ReadString(reader, "state"),
                TaxId: ReadString(reader, "taxId"),
                Zip: ReadString(reader, "zip")));
        }

        return rows;
    }

    private static async Task<IReadOnlyDictionary<int, ClientProjectSummary>> ReadProjectSummariesAsync(
        MySqlConnection connection,
        IReadOnlyList<int> clientIds,
        CancellationToken cancellationToken)
    {
        if (clientIds.Count == 0)
        {
            return new Dictionary<int, ClientProjectSummary>();
        }

        await using var command = connection.CreateCommand();
        var placeholders = AddClientIdParameters(command, clientIds);
        command.CommandText = $"""
            WITH latest_capacity AS (
                SELECT project_id, installed_capacity,
                       ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY bucket_ts DESC) AS rn
                FROM capacity_intelligence
            ),
            latest_savings AS (
                SELECT project_id, annual_savings,
                       ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY bucket_ts DESC) AS rn
                FROM savings_intelligence
            )
            SELECT p.client AS client_id,
                   COUNT(*) AS project_count,
                   SUM(COALESCE(lc.installed_capacity, NULLIF(p.peakKva, 0), NULLIF(p.avg15MinuteKva, 0), 0)) AS total_capacity_kva,
                   SUM(CASE WHEN lc.installed_capacity IS NOT NULL OR NULLIF(p.peakKva, 0) IS NOT NULL OR NULLIF(p.avg15MinuteKva, 0) IS NOT NULL THEN 1 ELSE 0 END) AS capacity_source_count,
                   SUM(COALESCE(ls.annual_savings, 0)) AS annual_savings,
                   SUM(CASE WHEN ls.annual_savings IS NOT NULL THEN 1 ELSE 0 END) AS savings_source_count
            FROM project p
            LEFT JOIN latest_capacity lc ON lc.project_id = p.id AND lc.rn = 1
            LEFT JOIN latest_savings ls ON ls.project_id = p.id AND ls.rn = 1
            WHERE COALESCE(p.isDeleted, 0) = 0
              AND p.client IN ({placeholders})
            GROUP BY p.client
            """;

        var rows = new Dictionary<int, ClientProjectSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var clientId = ReadInt(reader, "client_id");
            rows[clientId] = new ClientProjectSummary(
                AnnualSavings: ReadDouble(reader, "annual_savings"),
                HasCapacity: ReadInt(reader, "capacity_source_count") > 0,
                HasSavings: ReadInt(reader, "savings_source_count") > 0,
                ProjectCount: ReadInt(reader, "project_count"),
                TotalCapacityKva: ReadDouble(reader, "total_capacity_kva"));
        }

        return rows;
    }

    private static async Task<IReadOnlyDictionary<int, int>> ReadSiteCountsAsync(
        MySqlConnection connection,
        IReadOnlyList<int> clientIds,
        CancellationToken cancellationToken)
    {
        if (clientIds.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        try
        {
            await using var command = connection.CreateCommand();
            var placeholders = AddClientIdParameters(command, clientIds);
            command.CommandText = $"""
                SELECT p.client AS client_id, COUNT(s.id) AS site_count
                FROM project p
                JOIN site s ON s.project_id = p.id
                WHERE COALESCE(p.isDeleted, 0) = 0
                  AND COALESCE(s.is_deleted, 0) = 0
                  AND p.client IN ({placeholders})
                GROUP BY p.client
                """;

            var rows = new Dictionary<int, int>();
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                rows[ReadInt(reader, "client_id")] = ReadInt(reader, "site_count");
            }

            return rows;
        }
        catch
        {
            return new Dictionary<int, int>();
        }
    }

    private static async Task<IReadOnlyList<ClientManagementProjectRow>> ReadProjectsAsync(
        MySqlConnection connection,
        int clientId,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Parameters.AddWithValue("@clientId", clientId);
        command.CommandText = """
            WITH latest_capacity AS (
                SELECT project_id, installed_capacity,
                       ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY bucket_ts DESC) AS rn
                FROM capacity_intelligence
            )
            SELECT p.id, p.name, p.location, p.startDate,
                   COALESCE(lc.installed_capacity, NULLIF(p.peakKva, 0), NULLIF(p.avg15MinuteKva, 0)) AS capacity_kva
            FROM project p
            LEFT JOIN latest_capacity lc ON lc.project_id = p.id AND lc.rn = 1
            WHERE COALESCE(p.isDeleted, 0) = 0
              AND p.client = @clientId
            ORDER BY p.id
            LIMIT 50
            """;

        var rows = new List<ClientManagementProjectRow>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new ClientManagementProjectRow(
                Capacity: ReadNullableDouble(reader, "capacity_kva") is { } capacity ? FormatMw(capacity) : "No Data",
                Location: ReadString(reader, "location") ?? "No Data",
                Name: ReadString(reader, "name") ?? "No Data",
                Progress: "No Data",
                SiteType: "No Data",
                StartDate: FormatDateString(ReadString(reader, "startDate")),
                Status: "Active",
                TargetCompletion: "No Data"));
        }

        return rows;
    }

    private static IReadOnlyList<ClientManagementKpi> BuildClientKpis(
        IReadOnlyList<ClientSource> clients,
        IReadOnlyDictionary<int, ClientProjectSummary> projectSummaries,
        IReadOnlyDictionary<int, int> siteCounts)
    {
        var totalProjects = projectSummaries.Values.Sum(summary => summary.ProjectCount);
        var capacitySummaries = projectSummaries.Values.Where(summary => summary.HasCapacity).ToList();
        var savingsSummaries = projectSummaries.Values.Where(summary => summary.HasSavings).ToList();
        var totalCapacity = capacitySummaries.Sum(summary => summary.TotalCapacityKva);
        var annualSavings = savingsSummaries.Sum(summary => summary.AnnualSavings);

        return
        [
            new("Active clients", "C", "Total Clients", "blue", clients.Count.ToString()),
            new(siteCounts.Count > 0 ? "Across tracked sites" : "No Data", "S", "Total Sites", "green", siteCounts.Count > 0 ? siteCounts.Values.Sum().ToString() : "No Data"),
            new("Tracking projects", "P", "Active Projects", "cyan", totalProjects.ToString()),
            new(capacitySummaries.Count > 0 ? "Tracked capacity" : "No Data", "M", "Total Capacity", "blue", capacitySummaries.Count > 0 ? FormatMw(totalCapacity) : "No Data"),
            new(savingsSummaries.Count > 0 ? "Latest savings rollups" : "No Data", "$", "Annual Savings", "yellow", savingsSummaries.Count > 0 ? FormatCurrency(annualSavings) : "No Data"),
        ];
    }

    private static IReadOnlyList<ClientManagementKpi> BuildProjectKpis(IReadOnlyList<ClientManagementProjectRow> projects)
    {
        var capacityValues = projects
            .Select(project => ParseMw(project.Capacity))
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .ToList();

        return
        [
            new("For selected client", "P", "Total Projects", "blue", projects.Count.ToString()),
            new(capacityValues.Count > 0 ? "Installed capacity" : "No Data", "C", "Total Capacity", "green", capacityValues.Count > 0 ? $"{capacityValues.Sum():0.#} MW" : "No Data"),
            new("Tracking projects", "A", "Active Projects", "cyan", projects.Count.ToString()),
            new("No completed-project source", "D", "Completed Projects", "yellow", "No Data"),
            new("No approved projection source", "$", "Projected Savings (Annual)", "blue", "No Data"),
        ];
    }

    private static ClientManagementSelectedClient BuildSelectedClient(ClientSource client, ClientProjectSummary? summary, int siteCount)
    {
        return new ClientManagementSelectedClient(
            AccountManager: client.ManagerName ?? "No Data",
            ActiveProjects: summary?.ProjectCount.ToString() ?? "0",
            Address: FormatAddress(client),
            AnnualSavings: summary is not null && summary.HasSavings ? FormatCurrency(summary.AnnualSavings) : "No Data",
            ClientSince: FormatTimestamp(client.CreatedAt),
            CompletedProjects: "No Data",
            ContractNumber: "No Data",
            Currency: "No Data",
            Email: client.ManagerEmail ?? "No Data",
            Industry: client.MarketSegment ?? "No Data",
            LegalName: client.LegalName ?? "No Data",
            Mobile: "No Data",
            Name: client.Name ?? "No Data",
            Phone: client.ContactPhone ?? client.ManagerPhone ?? "No Data",
            PrimaryContactName: client.ContactName ?? client.ManagerName ?? "No Data",
            PrimaryContactTitle: client.ContactTitle ?? "No Data",
            Status: "Active",
            TaxId: client.TaxId ?? "No Data",
            TimeZone: "No Data",
            TotalCapacity: summary is not null && summary.HasCapacity ? FormatMw(summary.TotalCapacityKva) : "No Data",
            TotalSites: siteCount > 0 ? siteCount.ToString() : "No Data",
            Website: "No Data");
    }

    private static ClientManagementData EmptyClientManagement(string message)
    {
        var selectedClient = new ClientManagementSelectedClient(
            AccountManager: "No Data",
            ActiveProjects: "No Data",
            Address: "No Data",
            AnnualSavings: "No Data",
            ClientSince: "No Data",
            CompletedProjects: "No Data",
            ContractNumber: "No Data",
            Currency: "No Data",
            Email: "No Data",
            Industry: "No Data",
            LegalName: "No Data",
            Mobile: "No Data",
            Name: "No Data",
            Phone: "No Data",
            PrimaryContactName: "No Data",
            PrimaryContactTitle: "No Data",
            Status: "No Data",
            TaxId: "No Data",
            TimeZone: "No Data",
            TotalCapacity: "No Data",
            TotalSites: "No Data",
            Website: "No Data");

        return new ClientManagementData(
            Clients: [],
            ClientKpis:
            [
                new("No Data", "C", "Total Clients", "blue", "No Data"),
                new("No Data", "S", "Total Sites", "green", "No Data"),
                new("No Data", "P", "Active Projects", "cyan", "No Data"),
                new("No Data", "M", "Total Capacity", "blue", "No Data"),
                new("No Data", "$", "Annual Savings", "yellow", "No Data"),
            ],
            Message: message,
            Projects: [],
            ProjectKpis:
            [
                new("No Data", "P", "Total Projects", "blue", "No Data"),
                new("No Data", "C", "Total Capacity", "green", "No Data"),
                new("No Data", "A", "Active Projects", "cyan", "No Data"),
                new("No Data", "D", "Completed Projects", "yellow", "No Data"),
                new("No Data", "$", "Projected Savings (Annual)", "blue", "No Data"),
            ],
            SelectedClient: selectedClient,
            State: "no-data",
            UpdatedAt: "No Data");
    }

    private static string AddClientIdParameters(MySqlCommand command, IReadOnlyList<int> clientIds)
    {
        var names = new List<string>();
        for (var index = 0; index < clientIds.Count; index++)
        {
            var name = $"@client{index}";
            command.Parameters.AddWithValue(name, clientIds[index]);
            names.Add(name);
        }

        return string.Join(", ", names);
    }

    private static bool IsOchsner(ClientSource client)
    {
        var text = string.Join(" ", client.Name, client.LegalName, client.Address, client.City, client.State);
        return text.Contains("ochsner", StringComparison.OrdinalIgnoreCase);
    }

    private static string FormatAddress(ClientSource client)
    {
        var parts = new[] { client.Address, client.City, client.State, client.Zip, client.Country }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToList();

        return parts.Count > 0 ? string.Join(", ", parts) : "No Data";
    }

    private static string FormatCurrency(double value)
    {
        if (value >= 1_000_000)
        {
            return $"${value / 1_000_000:0.##}M";
        }

        if (value >= 1_000)
        {
            return $"${value / 1_000:0.#}K";
        }

        return $"${value:0}";
    }

    private static string FormatMw(double kva)
    {
        return $"{kva / 1000:0.#} MW";
    }

    private static string FormatTimestamp(DateTimeOffset? timestamp)
    {
        return timestamp.HasValue ? timestamp.Value.ToLocalTime().ToString("MMM d, yyyy") : "No Data";
    }

    private static string FormatDateString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "No Data";
        }

        return DateTimeOffset.TryParse(value, out var timestamp)
            ? timestamp.ToLocalTime().ToString("MMM d, yyyy")
            : value;
    }

    private static double? ParseMw(string value)
    {
        return value.EndsWith(" MW", StringComparison.Ordinal)
            && double.TryParse(value[..^3], out var result)
                ? result
                : null;
    }

    private static string? ReadString(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static int ReadInt(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal))
        {
            return 0;
        }

        var value = reader.GetValue(ordinal);
        return Convert.ToInt32(value);
    }

    private static double ReadDouble(MySqlDataReader reader, string name)
    {
        return ReadNullableDouble(reader, name) ?? 0;
    }

    private static double? ReadNullableDouble(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        var value = reader.GetValue(ordinal);
        return Convert.ToDouble(value);
    }

    private static DateTimeOffset? ReadUnixMilliseconds(MySqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        var milliseconds = Convert.ToInt64(reader.GetValue(ordinal));
        return milliseconds > 0 ? DateTimeOffset.FromUnixTimeMilliseconds(milliseconds) : null;
    }

    private sealed record ClientSource(
        string? Address,
        string? City,
        string? ContactName,
        string? ContactPhone,
        string? ContactTitle,
        string? Country,
        DateTimeOffset? CreatedAt,
        int Id,
        string? LegalName,
        string? ManagerEmail,
        string? ManagerName,
        string? ManagerPhone,
        string? MarketSegment,
        string? Name,
        string? State,
        string? TaxId,
        string? Zip);

    private sealed record ClientProjectSummary(
        double AnnualSavings,
        bool HasCapacity,
        bool HasSavings,
        int ProjectCount,
        double TotalCapacityKva);
}
