using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Notification>> GetByUserAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        return await _dbSet
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _dbSet
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _dbSet.FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _dbSet
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }
}
