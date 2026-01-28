using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.DTOs.Auth;

public record LoginRequest(
    string Email,
    string Password
);

public record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? Phone
);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    UserDto User,
    int ExpiresIn
);

public record RefreshTokenRequest(
    string RefreshToken
);

public record ForgotPasswordRequest(
    string Email
);

public record ResetPasswordRequest(
    string Token,
    string NewPassword
);

public record VerifyEmailRequest(
    string Token
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

public record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    UserRole Role,
    string? Phone,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record UserCreateDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role,
    string? Phone
);

public record UserUpdateDto(
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone
);
