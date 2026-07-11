using ECBS.Application.Common.Interfaces;
using ECBS.Application.ClientManagement;
using ECBS.Application.ScreenData;
using ECBS.Infrastructure.ClientManagement;
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
        services.AddScoped<IAnalysisDataService, TrackingAnalysisDataService>();
        services.AddScoped<ICapacityIntelligenceDataService, TrackingCapacityIntelligenceDataService>();
        services.AddScoped<IClientManagementCommandService, EfClientManagementCommandService>();
        services.AddScoped<IClientManagementDataService, TrackingClientManagementDataService>();
        services.AddScoped<IDeploymentCompletionDataService, EfDeploymentCompletionDataService>();
        services.AddScoped<IDeploymentDocumentationDataService, EfDeploymentDocumentationDataService>();
        services.AddScoped<IDeploymentFieldWorkflowDataService, EfDeploymentFieldWorkflowDataService>();
        services.AddScoped<IDevicesDataService, EfDevicesDataService>();
        services.AddScoped<IDigitalTwinDataService, TrackingDigitalTwinDataService>();

        return services;
    }
}
