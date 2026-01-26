using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Admin;
using HealthFlow_backend.DTOs.Auth;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<AdminStatisticsDto>> GetStatistics()
    {
        var totalUsers = await _unitOfWork.Users.CountAsync();
        var totalDoctors = await _unitOfWork.Doctors.CountAsync();
        var totalPatients = await _unitOfWork.Users.CountAsync(u => u.Role == UserRole.Patient);
        var totalAppointments = await _unitOfWork.Appointments.CountAsync();
        var totalClinics = await _unitOfWork.Clinics.CountAsync();
        var pendingAppointments = await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Pending);
        var completedAppointments = await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Done);
        var cancelledAppointments = await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Cancelled);

        var appointmentsByStatus = new List<AppointmentsByStatusDto>
        {
            new(AppointmentStatus.Pending, pendingAppointments),
            new(AppointmentStatus.Approved, await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Approved)),
            new(AppointmentStatus.Done, completedAppointments),
            new(AppointmentStatus.Cancelled, cancelledAppointments),
            new(AppointmentStatus.Declined, await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Declined))
        };

        return Ok(new AdminStatisticsDto(
            totalUsers,
            totalDoctors,
            totalPatients,
            totalAppointments,
            totalClinics,
            pendingAppointments,
            completedAppointments,
            cancelledAppointments,
            appointmentsByStatus,
            new List<AppointmentsByMonthDto>()
        ));
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var users = await _unitOfWork.Users.GetAllAsync();
        var pagedUsers = users
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.Phone,
                u.EmailVerified,
                u.CreatedAt,
                u.UpdatedAt
            ));

        return Ok(pagedUsers);
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(Guid id, [FromBody] AdminUserUpdateDto dto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null) return NotFound();

        if (dto.FirstName != null) user.FirstName = dto.FirstName;
        if (dto.LastName != null) user.LastName = dto.LastName;
        if (dto.Email != null) user.Email = dto.Email;
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Role.HasValue) user.Role = dto.Role.Value;
        if (dto.EmailVerified.HasValue) user.EmailVerified = dto.EmailVerified.Value;
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new AdminUserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role,
            user.Phone,
            user.EmailVerified,
            user.CreatedAt,
            user.UpdatedAt
        ));
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null) return NotFound();

        _unitOfWork.Users.Remove(user);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }
}
