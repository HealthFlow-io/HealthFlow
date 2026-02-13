using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IChatMessageRepository : IRepository<ChatMessage>
{
    Task<IEnumerable<ChatMessage>> GetConversationAsync(Guid userId1, Guid userId2, int page = 1, int pageSize = 50);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<int> GetUnreadCountFromUserAsync(Guid receiverId, Guid senderId);
    Task MarkAsReadAsync(Guid receiverId, Guid senderId);
    Task<ChatMessage?> GetLastMessageAsync(Guid userId1, Guid userId2);
    Task<IEnumerable<Guid>> GetConversationUserIdsAsync(Guid userId);
}
