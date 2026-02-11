using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using HealthFlow_backend.DTOs.Chat;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            // Personal group for receiving push notifications
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a conversation room for real-time messaging.
    /// Called when the user opens a chat with another user.
    /// The room name is deterministic: chat_{min}_{max} so both sides join the same room.
    /// </summary>
    public async Task JoinConversation(Guid otherUserId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var roomName = GetRoomName(userId.Value, otherUserId);
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
    }

    /// <summary>
    /// Leave a conversation room.
    /// Called when the user navigates away from a specific chat.
    /// </summary>
    public async Task LeaveConversation(Guid otherUserId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var roomName = GetRoomName(userId.Value, otherUserId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
    }

    /// <summary>
    /// Mark all messages from a user as read
    /// </summary>
    public async Task MarkAsRead(Guid senderId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        await _chatService.MarkAsReadAsync(userId.Value, senderId);

        // Notify the room that messages were read
        var roomName = GetRoomName(userId.Value, senderId);
        await Clients.Group(roomName)
            .SendAsync("MessagesRead", new { readBy = userId.Value });
    }

    /// <summary>
    /// Notify the other user that this user is typing (send to the room)
    /// </summary>
    public async Task SendTyping(Guid receiverId)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var roomName = GetRoomName(userId.Value, receiverId);
        await Clients.OthersInGroup(roomName)
            .SendAsync("UserTyping", new { userId = userId.Value });
    }

    /// <summary>
    /// Deterministic room name: chat_{smallerGuid}_{largerGuid}
    /// </summary>
    private static string GetRoomName(Guid userId1, Guid userId2)
    {
        var ids = new[] { userId1.ToString(), userId2.ToString() };
        Array.Sort(ids, StringComparer.Ordinal);
        return $"chat_{ids[0]}_{ids[1]}";
    }

    private Guid? GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)
                    ?? Context.User?.FindFirst("sub");
        if (claim != null && Guid.TryParse(claim.Value, out var userId))
            return userId;
        return null;
    }
}
