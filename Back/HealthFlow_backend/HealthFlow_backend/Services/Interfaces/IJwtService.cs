using System.Security.Claims;

namespace HealthFlow_backend.Services.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, string role);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    int GetTokenExpirationMinutes();
}
