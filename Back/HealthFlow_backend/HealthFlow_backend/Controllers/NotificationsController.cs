using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Notifications;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var notifications = await _notificationService.GetByUserAsync(userId.Value, page, pageSize);
        return Ok(notifications);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDto>> GetById(Guid id)
    {
        var notification = await _notificationService.GetByIdAsync(id);
        if (notification == null) return NotFound();
        return Ok(notification);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var count = await _notificationService.GetUnreadCountAsync(userId.Value);
        return Ok(new UnreadCountDto(count));
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return Ok(new { message = "Notification marked as read" });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(userId.Value);
        return Ok(new { message = "All notifications marked as read" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _notificationService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }
}
