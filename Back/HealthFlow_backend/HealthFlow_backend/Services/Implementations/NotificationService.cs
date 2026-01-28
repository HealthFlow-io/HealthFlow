using System.Text.Json;
using HealthFlow_backend.DTOs.Notifications;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using HealthFlow_backend.Hubs;

namespace HealthFlow_backend.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<NotificationHub>? _hubContext;

    public NotificationService(IUnitOfWork unitOfWork, IHubContext<NotificationHub>? hubContext = null)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    public async Task<IEnumerable<NotificationDto>> GetByUserAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var notifications = await _unitOfWork.Notifications.GetByUserAsync(userId, page, pageSize);
        return notifications.Select(MapToDto);
    }

    public async Task<NotificationDto?> GetByIdAsync(Guid id)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id);
        return notification != null ? MapToDto(notification) : null;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _unitOfWork.Notifications.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        await _unitOfWork.Notifications.MarkAsReadAsync(notificationId);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _unitOfWork.Notifications.MarkAllAsReadAsync(userId);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<NotificationDto> CreateAsync(NotificationCreateDto dto)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            Data = dto.Data != null ? JsonSerializer.Serialize(dto.Data) : null,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();

        var notificationDto = MapToDto(notification);

        // Send real-time notification via SignalR
        if (_hubContext != null)
        {
            await _hubContext.Clients.User(dto.UserId.ToString())
                .SendAsync("ReceiveNotification", notificationDto);
        }

        return notificationDto;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id);
        if (notification == null) return false;

        _unitOfWork.Notifications.Remove(notification);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task SendAppointmentNotificationAsync(Guid userId, string title, string message, string type, object? data = null)
    {
        var dto = new NotificationCreateDto(
            userId,
            title,
            message,
            type,
            data != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(data)) : null
        );

        await CreateAsync(dto);
    }

    private static NotificationDto MapToDto(Notification notification)
    {
        Dictionary<string, object>? data = null;
        if (!string.IsNullOrEmpty(notification.Data))
        {
            try
            {
                data = JsonSerializer.Deserialize<Dictionary<string, object>>(notification.Data);
            }
            catch { }
        }

        return new NotificationDto(
            notification.Id,
            notification.UserId,
            notification.Title,
            notification.Message,
            notification.Type,
            notification.IsRead,
            notification.CreatedAt,
            data
        );
    }
}
