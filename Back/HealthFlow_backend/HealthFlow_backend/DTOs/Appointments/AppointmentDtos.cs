using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.DTOs.Appointments;

public record AppointmentDto(
    Guid Id,
    Guid PatientId,
    PatientDto? Patient,
    Guid DoctorId,
    DoctorDto? Doctor,
    Guid? ClinicId,
    ClinicDto? Clinic,
    string Date,
    string StartTime,
    string EndTime,
    AppointmentType Type,
    AppointmentStatus Status,
    string? MeetingLink,
    string? Reason,
    DateTime CreatedAt,
    Guid? ApprovedBy
);

public record AppointmentCreateDto(
    Guid DoctorId,
    Guid? ClinicId,
    string Date,
    string StartTime,
    string EndTime,
    AppointmentType Type,
    string? Reason
);

public record AppointmentUpdateDto(
    string? Date,
    string? StartTime,
    string? EndTime,
    AppointmentType? Type,
    string? Reason
);

public record AppointmentRescheduleDto(
    string Date,
    string StartTime,
    string EndTime
);

public record AppointmentFilterParams(
    AppointmentStatus? Status,
    AppointmentType? Type,
    string? StartDate,
    string? EndDate,
    int Page = 1,
    int PageSize = 10
);

public record AvailableSlotsRequest(
    string Date
);

// Nested DTOs for appointment response
public record PatientDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone
);

public record DoctorDto(
    Guid Id,
    string FullName,
    string SpecializationName,
    int ConsultationDuration,
    decimal ConsultationPrice
);

public record ClinicDto(
    Guid Id,
    string Name,
    string Address
);
