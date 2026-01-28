using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.DTOs.Doctors;

public record DoctorDto(
    Guid Id,
    Guid UserId,
    string FullName,
    Guid SpecializationId,
    SpecializationDto? Specialization,
    List<string> SubSpecializations,
    string? Bio,
    int ExperienceYears,
    List<string> Languages,
    List<ConsultationType> ConsultationTypes,
    int ConsultationDuration,
    decimal ConsultationPrice,
    Guid? ClinicId,
    ClinicDto? Clinic,
    double Rating,
    UserDto? User
);

public record DoctorCreateDto(
    Guid UserId,
    string FullName,
    Guid SpecializationId,
    List<string>? SubSpecializations,
    string? Bio,
    int ExperienceYears,
    List<string>? Languages,
    List<ConsultationType> ConsultationTypes,
    int ConsultationDuration,
    decimal ConsultationPrice,
    Guid? ClinicId
);

public record DoctorUpdateDto(
    string? FullName,
    Guid? SpecializationId,
    List<string>? SubSpecializations,
    string? Bio,
    int? ExperienceYears,
    List<string>? Languages,
    List<ConsultationType>? ConsultationTypes,
    int? ConsultationDuration,
    decimal? ConsultationPrice,
    Guid? ClinicId
);

public record DoctorSearchParams(
    string? Specialization,
    string? Location,
    ConsultationType? ConsultationType,
    string? Language,
    double? MinRating,
    decimal? MaxPrice,
    int Page = 1,
    int PageSize = 10
);

public record DoctorAvailabilityDto(
    Guid Id,
    Guid DoctorId,
    DayOfWeek DayOfWeek,
    string StartTime,
    string EndTime
);

public record DoctorAvailabilityCreateDto(
    DayOfWeek DayOfWeek,
    string StartTime,
    string EndTime
);

public record DoctorRatingDto(
    Guid Id,
    Guid DoctorId,
    Guid PatientId,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    string? PatientName
);

public record DoctorRatingCreateDto(
    int Rating,
    string? Comment
);

public record TimeSlotDto(
    string StartTime,
    string EndTime,
    bool IsAvailable
);

// Forward declaration for referenced DTOs
public record SpecializationDto(
    Guid Id,
    string Name,
    string Category,
    string? Description
);

public record ClinicDto(
    Guid Id,
    string Name,
    string Address,
    GeoLocationDto? GeoLocation,
    List<WorkingHoursDto> WorkingHours,
    ContactInfoDto? ContactInfo
);

public record GeoLocationDto(
    double Latitude,
    double Longitude
);

public record WorkingHoursDto(
    DayOfWeek DayOfWeek,
    string OpenTime,
    string CloseTime,
    bool IsClosed
);

public record ContactInfoDto(
    string? Phone,
    string? Email,
    string? Website
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
