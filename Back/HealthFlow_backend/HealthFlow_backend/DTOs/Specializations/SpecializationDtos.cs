namespace HealthFlow_backend.DTOs.Specializations;

public record SpecializationDto(
    Guid Id,
    string Name,
    string Category,
    string? Description
);

public record SpecializationCreateDto(
    string Name,
    string Category,
    string? Description
);

public record SpecializationUpdateDto(
    string? Name,
    string? Category,
    string? Description
);
