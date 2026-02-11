using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class ChatMessageRepository : Repository<ChatMessage>, IChatMessageRepository
{
    public ChatMessageRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ChatMessage>> GetConversationAsync(Guid userId1, Guid userId2, int page = 1, int pageSize = 50)
    {
        return await _dbSet
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                        (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _dbSet
            .CountAsync(m => m.ReceiverId == userId && !m.IsRead);
    }

    public async Task<int> GetUnreadCountFromUserAsync(Guid receiverId, Guid senderId)
    {
        return await _dbSet
            .CountAsync(m => m.ReceiverId == receiverId && m.SenderId == senderId && !m.IsRead);
    }

    public async Task MarkAsReadAsync(Guid receiverId, Guid senderId)
    {
        await _dbSet
            .Where(m => m.ReceiverId == receiverId && m.SenderId == senderId && !m.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true));
    }

    public async Task<ChatMessage?> GetLastMessageAsync(Guid userId1, Guid userId2)
    {
        return await _dbSet
            .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                        (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Guid>> GetConversationUserIdsAsync(Guid userId)
    {
        var senderIds = await _dbSet
            .Where(m => m.ReceiverId == userId)
            .Select(m => m.SenderId)
            .Distinct()
            .ToListAsync();

        var receiverIds = await _dbSet
            .Where(m => m.SenderId == userId)
            .Select(m => m.ReceiverId)
            .Distinct()
            .ToListAsync();

        return senderIds.Union(receiverIds).Distinct();
    }
}
