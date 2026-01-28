using HealthFlow_backend.DTOs.Auth;

namespace HealthFlow_backend.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task LogoutAsync(Guid userId);
    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
    Task<UserDto> GetCurrentUserAsync(Guid userId);
    Task<UserDto> UpdateUserAsync(Guid userId, UserUpdateDto dto);
    Task ForgotPasswordAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
    Task VerifyEmailAsync(VerifyEmailRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}
