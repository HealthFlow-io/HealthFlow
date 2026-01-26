using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HealthFlow_backend.Hubs;

[Authorize]
public class AppointmentHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
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

    public async Task JoinDoctorRoom(string doctorId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"doctor_{doctorId}");
    }

    public async Task LeaveDoctorRoom(string doctorId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"doctor_{doctorId}");
    }

    public async Task NotifyAppointmentStatusChanged(string doctorId, object appointmentData)
    {
        await Clients.Group($"doctor_{doctorId}").SendAsync("AppointmentStatusChanged", appointmentData);
    }
}
