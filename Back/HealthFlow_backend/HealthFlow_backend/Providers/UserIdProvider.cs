using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace HealthFlow_backend.Providers;

public class UserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? connection.User?.FindFirst("sub")?.Value;
    }
}
