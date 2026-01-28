namespace HealthFlow_backend.DTOs.MedicalRecords;

public record MedicalRecordDto(
    Guid Id,
    Guid PatientId,
    PatientDto? Patient,
    Guid DoctorId,
    DoctorDto? Doctor,
    Guid? AppointmentId,
    string? Diagnosis,
    string? Symptoms,
    string? Treatment,
    string? Prescription,
    string Notes,
    VitalSignsDto? VitalSigns,
    DateTime? FollowUpDate,
    string? FollowUpNotes,
    List<AttachmentDto> Attachments,
    string? PrescriptionUrl,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record MedicalRecordCreateDto(
    Guid PatientId,
    Guid? AppointmentId,
    string? Diagnosis,
    string? Symptoms,
    string? Treatment,
    string? Prescription,
    string Notes,
    VitalSignsDto? VitalSigns,
    DateTime? FollowUpDate,
    string? FollowUpNotes,
    string? PrescriptionUrl
);

public record MedicalRecordUpdateDto(
    string? Diagnosis,
    string? Symptoms,
    string? Treatment,
    string? Prescription,
    string? Notes,
    VitalSignsDto? VitalSigns,
    DateTime? FollowUpDate,
    string? FollowUpNotes,
    string? PrescriptionUrl
);

public record VitalSignsDto(
    decimal? BloodPressureSystolic,
    decimal? BloodPressureDiastolic,
    decimal? HeartRate,
    decimal? Temperature,
    decimal? Weight,
    decimal? Height
);

public record AttachmentDto(
    Guid Id,
    Guid FileUploadId,
    string FileName,
    string FileUrl,
    string? Description,
    string AttachmentType,
    DateTime CreatedAt
);

public record AddAttachmentDto(
    Guid FileUploadId,
    string? Description,
    string AttachmentType
);

// Nested DTOs
public record PatientDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone
);

public record DoctorDto(
    Guid Id,
    string FirstName,
    string LastName,
    string SpecializationName
);
