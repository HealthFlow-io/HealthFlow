namespace HealthFlow_backend.DTOs.Chat;

public record ChatMessageDto(
    Guid Id,
    Guid SenderId,
    string SenderName,
    Guid ReceiverId,
    string ReceiverName,
    string Content,
    bool IsRead,
    DateTime CreatedAt
);

public record SendMessageDto(
    Guid ReceiverId,
    string Content
);

public record ChatConversationDto(
    Guid UserId,
    string UserName,
    string UserRole,
    string? LastMessage,
    DateTime? LastMessageAt,
    int UnreadCount
);

public record MarkMessagesReadDto(
    Guid ConversationUserId
);
