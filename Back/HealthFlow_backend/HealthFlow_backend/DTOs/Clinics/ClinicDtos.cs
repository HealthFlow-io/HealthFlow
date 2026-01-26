namespace HealthFlow_backend.DTOs.Clinics;

public record ClinicDto(
    Guid Id,
    string Name,
    string Address,
    GeoLocationDto? GeoLocation,
    List<WorkingHoursDto> WorkingHours,
    ContactInfoDto? ContactInfo
);

public record ClinicCreateDto(
    string Name,
    string Address,
    GeoLocationDto? GeoLocation,
    List<WorkingHoursDto>? WorkingHours,
    ContactInfoDto? ContactInfo
);

public record ClinicUpdateDto(
    string? Name,
    string? Address,
    GeoLocationDto? GeoLocation,
    List<WorkingHoursDto>? WorkingHours,
    ContactInfoDto? ContactInfo
);

public record ClinicSearchParams(
    string? Name,
    string? Address,
    int Page = 1,
    int PageSize = 10
);

public record NearbySearchParams(
    double Latitude,
    double Longitude,
    double RadiusKm = 10,
    int Page = 1,
    int PageSize = 10
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
