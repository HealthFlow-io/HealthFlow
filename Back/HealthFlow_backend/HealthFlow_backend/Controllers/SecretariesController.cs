using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.DTOs.Secretaries;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Repositories.Interfaces;
using DoctorDtoFull = HealthFlow_backend.DTOs.Doctors.DoctorDto;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SecretariesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public SecretariesController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SecretaryProfileDto>>> GetAll()
    {
        var secretaries = await _unitOfWork.Secretaries.GetAllWithUserAsync();
        var dtos = secretaries.Select(s => new SecretaryProfileDto(
            s.Id,
            s.UserId,
            new UserDto(
                s.User.Id,
                s.User.FirstName,
                s.User.LastName,
                s.User.Email,
                s.User.Phone
            ),
            new List<DoctorDto>()
        ));
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SecretaryProfileDto>> GetById(Guid id)
    {
        var secretary = await _unitOfWork.Secretaries.GetByIdWithUserAsync(id);
        if (secretary == null) return NotFound();

        return Ok(new SecretaryProfileDto(
            secretary.Id,
            secretary.UserId,
            new UserDto(
                secretary.User.Id,
                secretary.User.FirstName,
                secretary.User.LastName,
                secretary.User.Email,
                secretary.User.Phone
            ),
            new List<DoctorDto>()
        ));
    }

    [HttpPost]
    public async Task<ActionResult<SecretaryProfileDto>> Create([FromBody] SecretaryCreateDto dto)
    {
        // Check if user exists and has Secretary role
        var user = await _unitOfWork.Users.GetByIdAsync(dto.UserId);
        if (user == null) return BadRequest(new { message = "User not found" });
        if (user.Role != UserRole.Secretary) return BadRequest(new { message = "User must have Secretary role" });

        // Check if secretary profile already exists for this user
        var existing = await _unitOfWork.Secretaries.FindAsync(s => s.UserId == dto.UserId);
        if (existing.Any()) return BadRequest(new { message = "Secretary profile already exists for this user" });

        var secretary = new SecretaryProfile
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Secretaries.AddAsync(secretary);
        await _unitOfWork.SaveChangesAsync();

        // Fetch with user details
        secretary = await _unitOfWork.Secretaries.GetByIdWithUserAsync(secretary.Id);

        return CreatedAtAction(nameof(GetById), new { id = secretary!.Id }, new SecretaryProfileDto(
            secretary.Id,
            secretary.UserId,
            new UserDto(
                secretary.User.Id,
                secretary.User.FirstName,
                secretary.User.LastName,
                secretary.User.Email,
                secretary.User.Phone
            ),
            new List<DoctorDto>()
        ));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var secretary = await _unitOfWork.Secretaries.GetByIdAsync(id);
        if (secretary == null) return NotFound();

        _unitOfWork.Secretaries.Remove(secretary);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{secretaryId}/doctors")]
    public async Task<ActionResult<IEnumerable<DoctorDto>>> GetAssignedDoctors(Guid secretaryId)
    {
        var secretary = await _unitOfWork.Secretaries.GetByIdAsync(secretaryId);
        if (secretary == null) return NotFound();

        var doctors = await _unitOfWork.Secretaries.GetAssignedDoctorsAsync(secretaryId);
        var dtos = doctors.Select(d => new DoctorDto(
            d.Id,
            d.FullName,
            d.Specialization?.Name ?? ""
        ));
        return Ok(dtos);
    }

    [HttpPost("{secretaryId}/doctors")]
    public async Task<IActionResult> AssignDoctor(Guid secretaryId, [FromBody] AssignDoctorDto dto)
    {
        var secretary = await _unitOfWork.Secretaries.GetByIdAsync(secretaryId);
        if (secretary == null) return NotFound(new { message = "Secretary not found" });

        var doctor = await _unitOfWork.Doctors.GetByIdAsync(dto.DoctorId);
        if (doctor == null) return BadRequest(new { message = "Doctor not found" });

        // Check if already assigned
        var isAssigned = await _unitOfWork.Secretaries.IsDoctorAssignedAsync(secretaryId, dto.DoctorId);
        if (isAssigned) return BadRequest(new { message = "Doctor already assigned to this secretary" });

        await _unitOfWork.Secretaries.AssignDoctorAsync(secretaryId, dto.DoctorId);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Doctor assigned successfully" });
    }

    [HttpDelete("{secretaryId}/doctors/{doctorId}")]
    public async Task<IActionResult> UnassignDoctor(Guid secretaryId, Guid doctorId)
    {
        await _unitOfWork.Secretaries.UnassignDoctorAsync(secretaryId, doctorId);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }
}
