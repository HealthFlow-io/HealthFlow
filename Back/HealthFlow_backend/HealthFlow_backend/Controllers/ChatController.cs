using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Chat;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Get contacts list (fast — just users with unread counts, no message history)
    /// </summary>
    [HttpGet("contacts")]
    public async Task<ActionResult<IEnumerable<ChatConversationDto>>> GetContacts()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var contacts = await _chatService.GetContactsAsync(userId.Value);
        return Ok(contacts);
    }

    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<IEnumerable<ChatConversationDto>>> GetConversations()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var conversations = await _chatService.GetConversationsAsync(userId.Value);
        return Ok(conversations);
    }

    /// <summary>
    /// Get messages in a conversation with another user
    /// </summary>
    [HttpGet("conversations/{otherUserId}")]
    public async Task<ActionResult<IEnumerable<ChatMessageDto>>> GetConversation(
        Guid otherUserId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var messages = await _chatService.GetConversationAsync(userId.Value, otherUserId, page, pageSize);
        return Ok(messages);
    }

    /// <summary>
    /// Send a message to another user
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var message = await _chatService.SendMessageAsync(userId.Value, dto);
            return Ok(message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Mark messages from a specific user as read
    /// </summary>
    [HttpPost("conversations/{senderId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid senderId)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        await _chatService.MarkAsReadAsync(userId.Value, senderId);
        return Ok(new { message = "Messages marked as read" });
    }

    /// <summary>
    /// Get total unread message count
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var count = await _chatService.GetUnreadCountAsync(userId.Value);
        return Ok(new { count });
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
