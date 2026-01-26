namespace HealthFlow_backend.DTOs.MedicalRecords;

public record MedicalRecordDto(
    Guid Id,
    Guid PatientId,
    PatientDto? Patient,
    Guid DoctorId,
    DoctorDto? Doctor,
    string Notes,
    string? PrescriptionUrl,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record MedicalRecordCreateDto(
    Guid PatientId,
    string Notes,
    string? PrescriptionUrl
);

public record MedicalRecordUpdateDto(
    string? Notes,
    string? PrescriptionUrl
);

// Nested DTOs
public record PatientDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email
);

public record DoctorDto(
    Guid Id,
    string FullName,
    string SpecializationName
);
