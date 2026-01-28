using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.DTOs.Doctors;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorsController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<DoctorDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _doctorService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DoctorDto>> GetById(Guid id)
    {
        var doctor = await _doctorService.GetByIdAsync(id);
        if (doctor == null) return NotFound();
        return Ok(doctor);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<DoctorDto>> GetMyProfile()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var doctor = await _doctorService.GetByUserIdAsync(userId);
        
        if (doctor == null) 
            return NotFound(new { message = "Doctor profile not found" });

        return Ok(doctor);
    }

    [HttpGet("search")]
    public async Task<ActionResult<PaginatedResponse<DoctorDto>>> Search([FromQuery] DoctorSearchParams searchParams)
    {
        var result = await _doctorService.SearchAsync(searchParams);
        return Ok(result);
    }

    [HttpGet("specialization/{specializationId}")]
    public async Task<ActionResult<IEnumerable<DoctorDto>>> GetBySpecialization(Guid specializationId)
    {
        var doctors = await _doctorService.GetBySpecializationAsync(specializationId);
        return Ok(doctors);
    }

    [HttpGet("clinic/{clinicId}")]
    public async Task<ActionResult<IEnumerable<DoctorDto>>> GetByClinic(Guid clinicId)
    {
        var doctors = await _doctorService.GetByClinicAsync(clinicId);
        return Ok(doctors);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DoctorDto>> Create([FromBody] DoctorCreateDto dto)
    {
        var doctor = await _doctorService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = doctor.Id }, doctor);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<ActionResult<DoctorDto>> Update(Guid id, [FromBody] DoctorUpdateDto dto)
    {
        var doctor = await _doctorService.UpdateAsync(id, dto);
        if (doctor == null) return NotFound();
        return Ok(doctor);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _doctorService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    // Availability endpoints
    [HttpGet("{doctorId}/availability")]
    public async Task<ActionResult<IEnumerable<DoctorAvailabilityDto>>> GetAvailability(Guid doctorId)
    {
        var availability = await _doctorService.GetAvailabilityAsync(doctorId);
        return Ok(availability);
    }

    [HttpPut("{doctorId}/availability")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<ActionResult<IEnumerable<DoctorAvailabilityDto>>> SetAvailability(
        Guid doctorId, [FromBody] IEnumerable<DoctorAvailabilityCreateDto> availabilities)
    {
        var result = await _doctorService.SetAvailabilityAsync(doctorId, availabilities);
        return Ok(result);
    }

    [HttpGet("{doctorId}/schedule")]
    public async Task<ActionResult<IEnumerable<TimeSlotDto>>> GetSchedule(Guid doctorId, [FromQuery] string date)
    {
        var slots = await _doctorService.GetAvailableSlotsAsync(doctorId, date);
        return Ok(slots);
    }

    // Ratings endpoints
    [HttpGet("{doctorId}/ratings")]
    public async Task<ActionResult<IEnumerable<DoctorRatingDto>>> GetRatings(Guid doctorId)
    {
        var ratings = await _doctorService.GetRatingsAsync(doctorId);
        return Ok(ratings);
    }

    [HttpPost("{doctorId}/ratings")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult<DoctorRatingDto>> AddRating(Guid doctorId, [FromBody] DoctorRatingCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var rating = await _doctorService.AddRatingAsync(doctorId, userId.Value, dto);
        return Ok(rating);
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
