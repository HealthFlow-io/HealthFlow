using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.DTOs.Chat;
using HealthFlow_backend.Hubs;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace HealthFlow_backend.Services.Implementations;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<ChatHub>? _hubContext;
    private readonly INotificationService _notificationService;

    public ChatService(IUnitOfWork unitOfWork, IHubContext<ChatHub>? hubContext = null, INotificationService? notificationService = null)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _notificationService = notificationService!;
    }

    public async Task<ChatMessageDto> SendMessageAsync(Guid senderId, SendMessageDto dto)
    {
        var sender = await _unitOfWork.Users.GetByIdAsync(senderId);
        var receiver = await _unitOfWork.Users.GetByIdAsync(dto.ReceiverId);

        if (sender == null) throw new ArgumentException("Sender not found");
        if (receiver == null) throw new ArgumentException("Receiver not found");

        await ValidateDoctorSecretaryRelationship(senderId, dto.ReceiverId);

        var message = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ReceiverId = dto.ReceiverId,
            Content = dto.Content,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ChatMessages.AddAsync(message);
        await _unitOfWork.SaveChangesAsync();

        var messageDto = new ChatMessageDto(
            message.Id,
            message.SenderId,
            $"{sender.FirstName} {sender.LastName}",
            message.ReceiverId,
            $"{receiver.FirstName} {receiver.LastName}",
            message.Content,
            message.IsRead,
            message.CreatedAt
        );

        // Push real-time message ONLY to the receiver via SignalR
        // The sender gets the message back from the REST response — no double push.
        if (_hubContext != null)
        {
            await _hubContext.Clients.User(dto.ReceiverId.ToString())
                .SendAsync("ReceiveMessage", messageDto);
        }

        // Send a push notification to the receiver
        if (_notificationService != null)
        {
            try
            {
                await _notificationService.SendAppointmentNotificationAsync(
                    dto.ReceiverId,
                    $"New message from {sender.FirstName} {sender.LastName}",
                    message.Content.Length > 100 ? message.Content[..100] + "..." : message.Content,
                    "chat_message",
                    new { senderId = senderId, senderName = $"{sender.FirstName} {sender.LastName}" }
                );
            }
            catch { /* Don't fail message send if notification fails */ }
        }

        return messageDto;
    }

    public async Task<IEnumerable<ChatMessageDto>> GetConversationAsync(Guid userId, Guid otherUserId, int page = 1, int pageSize = 50)
    {
        var messages = await _unitOfWork.ChatMessages.GetConversationAsync(userId, otherUserId, page, pageSize);

        return messages.Select(m => new ChatMessageDto(
            m.Id,
            m.SenderId,
            $"{m.Sender.FirstName} {m.Sender.LastName}",
            m.ReceiverId,
            $"{m.Receiver.FirstName} {m.Receiver.LastName}",
            m.Content,
            m.IsRead,
            m.CreatedAt
        ));
    }

    /// <summary>
    /// Fast endpoint: returns only the list of related contacts (doctors/secretaries)
    /// with unread counts, without loading message history. Used for the sidebar.
    /// </summary>
    public async Task<IEnumerable<ChatConversationDto>> GetContactsAsync(Guid userId)
    {
        var currentUser = await _unitOfWork.Users.GetByIdAsync(userId);
        if (currentUser == null) throw new ArgumentException("User not found");

        var relatedUserIds = await GetRelatedUserIds(userId, currentUser.Role.ToString());

        // Batch load all related users in one query
        var relatedUsers = await _unitOfWork.Users.Query()
            .Where(u => relatedUserIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FirstName, u.LastName, Role = u.Role.ToString() })
            .ToListAsync();

        // Batch load unread counts per sender in one query
        var unreadCounts = await _unitOfWork.ChatMessages.Query()
            .Where(m => m.ReceiverId == userId && !m.IsRead && relatedUserIds.Contains(m.SenderId))
            .GroupBy(m => m.SenderId)
            .Select(g => new { SenderId = g.Key, Count = g.Count() })
            .ToListAsync();

        // Batch load last messages in one query
        var lastMessages = await _unitOfWork.ChatMessages.Query()
            .Where(m =>
                (m.SenderId == userId && relatedUserIds.Contains(m.ReceiverId)) ||
                (m.ReceiverId == userId && relatedUserIds.Contains(m.SenderId)))
            .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Select(g => new
            {
                OtherUserId = g.Key,
                LastMessage = g.OrderByDescending(m => m.CreatedAt).Select(m => m.Content).FirstOrDefault(),
                LastMessageAt = g.Max(m => m.CreatedAt)
            })
            .ToListAsync();

        var unreadDict = unreadCounts.ToDictionary(x => x.SenderId, x => x.Count);
        var lastMsgDict = lastMessages.ToDictionary(x => x.OtherUserId);

        var conversations = relatedUsers.Select(u =>
        {
            lastMsgDict.TryGetValue(u.Id, out var lastMsg);
            unreadDict.TryGetValue(u.Id, out var unread);

            return new ChatConversationDto(
                u.Id,
                $"{u.FirstName} {u.LastName}",
                u.Role,
                lastMsg?.LastMessage,
                lastMsg?.LastMessageAt,
                unread
            );
        });

        return conversations.OrderByDescending(c => c.LastMessageAt ?? DateTime.MinValue);
    }

    /// <summary>
    /// Legacy: full conversations with per-user queries (kept for backward compat).
    /// Use GetContactsAsync instead for the sidebar.
    /// </summary>
    public async Task<IEnumerable<ChatConversationDto>> GetConversationsAsync(Guid userId)
    {
        return await GetContactsAsync(userId);
    }

    public async Task MarkAsReadAsync(Guid receiverId, Guid senderId)
    {
        await _unitOfWork.ChatMessages.MarkAsReadAsync(receiverId, senderId);
        await _unitOfWork.SaveChangesAsync();

        if (_hubContext != null)
        {
            await _hubContext.Clients.User(senderId.ToString())
                .SendAsync("MessagesRead", new { readBy = receiverId });
        }
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _unitOfWork.ChatMessages.GetUnreadCountAsync(userId);
    }

    private async Task ValidateDoctorSecretaryRelationship(Guid userId1, Guid userId2)
    {
        var user1 = await _unitOfWork.Users.GetByIdAsync(userId1);
        var user2 = await _unitOfWork.Users.GetByIdAsync(userId2);

        if (user1 == null || user2 == null)
            throw new ArgumentException("One or both users not found");

        Guid doctorUserId, secretaryUserId;

        if (user1.Role.ToString() == "Doctor" && user2.Role.ToString() == "Secretary")
        {
            doctorUserId = userId1;
            secretaryUserId = userId2;
        }
        else if (user1.Role.ToString() == "Secretary" && user2.Role.ToString() == "Doctor")
        {
            doctorUserId = userId2;
            secretaryUserId = userId1;
        }
        else
        {
            throw new UnauthorizedAccessException("Chat is only allowed between doctors and their secretaries");
        }

        var doctor = await _unitOfWork.Doctors.FirstOrDefaultAsync(d => d.UserId == doctorUserId);
        var secretary = await _unitOfWork.Secretaries.FirstOrDefaultAsync(s => s.UserId == secretaryUserId);

        if (doctor == null || secretary == null)
            throw new ArgumentException("Doctor or secretary profile not found");

        var relationship = await _unitOfWork.Context.SecretaryDoctors
            .AnyAsync(sd => sd.DoctorId == doctor.Id && sd.SecretaryProfileId == secretary.Id);

        if (!relationship)
            throw new UnauthorizedAccessException("You can only message secretaries/doctors assigned to you");
    }

    private async Task<List<Guid>> GetRelatedUserIds(Guid userId, string role)
    {
        if (role == "Doctor")
        {
            var doctor = await _unitOfWork.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (doctor == null) return new List<Guid>();

            return await _unitOfWork.Context.SecretaryDoctors
                .Where(sd => sd.DoctorId == doctor.Id)
                .Include(sd => sd.SecretaryProfile)
                .Select(sd => sd.SecretaryProfile.UserId)
                .ToListAsync();
        }
        else if (role == "Secretary")
        {
            var secretary = await _unitOfWork.Secretaries.FirstOrDefaultAsync(s => s.UserId == userId);
            if (secretary == null) return new List<Guid>();

            return await _unitOfWork.Context.SecretaryDoctors
                .Where(sd => sd.SecretaryProfileId == secretary.Id)
                .Include(sd => sd.Doctor)
                .Select(sd => sd.Doctor.UserId)
                .ToListAsync();
        }

        return new List<Guid>();
    }
}
