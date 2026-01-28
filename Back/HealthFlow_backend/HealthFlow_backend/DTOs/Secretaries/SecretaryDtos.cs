namespace HealthFlow_backend.DTOs.Secretaries;

public record SecretaryProfileDto(
    Guid Id,
    Guid UserId,
    UserDto? User,
    List<DoctorDto> Doctors
);

public record SecretaryCreateDto(
    Guid UserId
);

public record AssignDoctorDto(
    Guid DoctorId
);

// Nested DTOs
public record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone
);

public record DoctorDto(
    Guid Id,
    string FullName,
    string SpecializationName
);
