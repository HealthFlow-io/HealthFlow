using HealthFlow_backend.DTOs.Notifications;

namespace HealthFlow_backend.Services.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetByUserAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<NotificationDto?> GetByIdAsync(Guid id);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<NotificationDto> CreateAsync(NotificationCreateDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task SendAppointmentNotificationAsync(Guid userId, string title, string message, string type, object? data = null);
}
