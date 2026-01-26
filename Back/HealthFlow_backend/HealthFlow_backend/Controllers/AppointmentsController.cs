using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Appointments;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.DTOs.Doctors;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDto>> GetById(Guid id)
    {
        var appointment = await _appointmentService.GetByIdAsync(id);
        if (appointment == null) return NotFound();
        return Ok(appointment);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<PaginatedResponse<AppointmentDto>>> GetByPatient(
        Guid patientId, [FromQuery] AppointmentFilterParams filterParams)
    {
        var result = await _appointmentService.GetByPatientAsync(patientId, filterParams);
        return Ok(result);
    }

    [HttpGet("doctor/{doctorId}")]
    public async Task<ActionResult<PaginatedResponse<AppointmentDto>>> GetByDoctor(
        Guid doctorId, [FromQuery] AppointmentFilterParams filterParams)
    {
        var result = await _appointmentService.GetByDoctorAsync(doctorId, filterParams);
        return Ok(result);
    }

    [HttpGet("clinic/{clinicId}")]
    public async Task<ActionResult<PaginatedResponse<AppointmentDto>>> GetByClinic(
        Guid clinicId, [FromQuery] AppointmentFilterParams filterParams)
    {
        var result = await _appointmentService.GetByClinicAsync(clinicId, filterParams);
        return Ok(result);
    }

    [HttpGet("doctor/{doctorId}/available-slots")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<TimeSlotDto>>> GetAvailableSlots(Guid doctorId, [FromQuery] string date)
    {
        var slots = await _appointmentService.GetAvailableSlotsAsync(doctorId, date);
        return Ok(slots);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Create([FromBody] AppointmentCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var appointment = await _appointmentService.CreateAsync(userId.Value, dto);
            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AppointmentDto>> Update(Guid id, [FromBody] AppointmentUpdateDto dto)
    {
        var appointment = await _appointmentService.UpdateAsync(id, dto);
        if (appointment == null) return NotFound();
        return Ok(appointment);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Doctor,Secretary,Admin")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var result = await _appointmentService.ApproveAsync(id, userId.Value);
        if (!result) return NotFound();
        return Ok(new { message = "Appointment approved" });
    }

    [HttpPost("{id}/decline")]
    [Authorize(Roles = "Doctor,Secretary,Admin")]
    public async Task<IActionResult> Decline(Guid id)
    {
        var result = await _appointmentService.DeclineAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Appointment declined" });
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var result = await _appointmentService.CancelAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Appointment cancelled" });
    }

    [HttpPost("{id}/reschedule")]
    public async Task<IActionResult> Reschedule(Guid id, [FromBody] AppointmentRescheduleDto dto)
    {
        try
        {
            var result = await _appointmentService.RescheduleAsync(id, dto);
            if (!result) return NotFound();
            return Ok(new { message = "Appointment rescheduled" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/complete")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> Complete(Guid id)
    {
        var result = await _appointmentService.CompleteAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Appointment completed" });
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
