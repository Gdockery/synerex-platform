using Microsoft.Extensions.DependencyInjection;

namespace ECBS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        return services;
    }
}
