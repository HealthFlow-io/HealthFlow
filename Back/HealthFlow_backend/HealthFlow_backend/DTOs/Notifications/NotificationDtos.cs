namespace HealthFlow_backend.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    DateTime CreatedAt,
    Dictionary<string, object>? Data
);

public record NotificationCreateDto(
    Guid UserId,
    string Title,
    string Message,
    string Type,
    Dictionary<string, object>? Data
);

public record UnreadCountDto(
    int Count
);
