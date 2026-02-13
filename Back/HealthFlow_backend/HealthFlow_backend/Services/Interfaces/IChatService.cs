using HealthFlow_backend.DTOs.Chat;

namespace HealthFlow_backend.Services.Interfaces;

public interface IChatService
{
    Task<ChatMessageDto> SendMessageAsync(Guid senderId, SendMessageDto dto);
    Task<IEnumerable<ChatMessageDto>> GetConversationAsync(Guid userId, Guid otherUserId, int page = 1, int pageSize = 50);
    Task<IEnumerable<ChatConversationDto>> GetConversationsAsync(Guid userId);
    Task<IEnumerable<ChatConversationDto>> GetContactsAsync(Guid userId);
    Task MarkAsReadAsync(Guid receiverId, Guid senderId);
    Task<int> GetUnreadCountAsync(Guid userId);
}
