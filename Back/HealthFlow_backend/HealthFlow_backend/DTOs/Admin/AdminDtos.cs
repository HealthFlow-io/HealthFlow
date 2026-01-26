using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.DTOs.Admin;

public record AdminStatisticsDto(
    int TotalUsers,
    int TotalDoctors,
    int TotalPatients,
    int TotalAppointments,
    int TotalClinics,
    int PendingAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    List<AppointmentsByStatusDto> AppointmentsByStatus,
    List<AppointmentsByMonthDto> AppointmentsByMonth
);

public record AppointmentsByStatusDto(
    AppointmentStatus Status,
    int Count
);

public record AppointmentsByMonthDto(
    string Month,
    int Count
);

public record AdminUserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    UserRole Role,
    string? Phone,
    bool EmailVerified,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record AdminUserUpdateDto(
    string? FirstName,
    string? LastName,
    string? Email,
    UserRole? Role,
    string? Phone,
    bool? EmailVerified
);

public record AdminSettingsDto(
    string SiteName,
    string SiteEmail,
    bool RegistrationEnabled,
    bool EmailVerificationRequired,
    int AppointmentReminderHours,
    int MaxAppointmentsPerDay
);

public record AdminSettingsUpdateDto(
    string? SiteName,
    string? SiteEmail,
    bool? RegistrationEnabled,
    bool? EmailVerificationRequired,
    int? AppointmentReminderHours,
    int? MaxAppointmentsPerDay
);
