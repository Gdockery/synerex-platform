using ECBS.Application.Common.Interfaces;
using ECBS.Application.ScreenData;
using ECBS.Infrastructure.Persistence;
using ECBS.Infrastructure.ScreenData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ECBS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("EcbsMySql")
            ?? throw new InvalidOperationException("Connection string 'EcbsMySql' is not configured.");
        var serverVersionText = configuration["MySql:ServerVersion"] ?? "8.0.0";
        var serverVersion = new MySqlServerVersion(Version.Parse(serverVersionText));

        services.AddDbContext<EcbsDbContext>(options =>
            options.UseMySql(connectionString, serverVersion));

        services.AddScoped<IEcbsDbContext>(provider =>
            provider.GetRequiredService<EcbsDbContext>());

        services.AddScoped<IAlarmEventsDataService, TrackingAlarmEventsDataService>();

        return services;
    }
}
