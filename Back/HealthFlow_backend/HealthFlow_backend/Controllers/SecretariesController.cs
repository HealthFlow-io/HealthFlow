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
[Authorize]  // Base authorization - must be authenticated
public class SecretariesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public SecretariesController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]  // Admin only
    public async Task<ActionResult<IEnumerable<SecretaryProfileDto>>> GetAll()
    {
        var secretaries = await _unitOfWork.Secretaries.GetAllWithUserAsync();
        
        var dtos = new List<SecretaryProfileDto>();
        foreach (var s in secretaries)
        {
            var assignedDoctors = await _unitOfWork.Secretaries.GetAssignedDoctorsAsync(s.Id);
            var doctorDtos = assignedDoctors.Select(d => new DoctorDto(
                d.Id,
                d.FullName,
                d.Specialization?.Name ?? ""
            )).ToList();
            
            dtos.Add(new SecretaryProfileDto(
                s.Id,
                s.UserId,
                new UserDto(
                    s.User.Id,
                    s.User.FirstName,
                    s.User.LastName,
                    s.User.Email,
                    s.User.Phone
                ),
                doctorDtos
            ));
        }
        
        return Ok(dtos);
    }

    // Get current secretary profile (for logged-in secretary)
    [HttpGet("me")]
    [Authorize(Roles = "Secretary")]
    public async Task<ActionResult<SecretaryProfileDto>> GetMyProfile()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        var secretary = await _unitOfWork.Secretaries.GetByUserIdAsync(userId);
        
        if (secretary == null) 
            return NotFound(new { message = "Secretary profile not found" });

        // Get assigned doctors with full details
        var assignedDoctors = await _unitOfWork.Secretaries.GetAssignedDoctorsAsync(secretary.Id);
        var doctorDtos = new List<DoctorDtoFull>();
        
        foreach (var doctor in assignedDoctors)
        {
            // Get full doctor details
            var fullDoctor = await _unitOfWork.Doctors.GetWithDetailsAsync(doctor.Id);
            if (fullDoctor != null)
            {
                doctorDtos.Add(MapToDoctorDto(fullDoctor));
            }
        }

        // Fetch user details
        var user = await _unitOfWork.Users.GetByIdAsync(secretary.UserId);
        
        return Ok(new {
            id = secretary.Id,
            userId = secretary.UserId,
            user = new {
                id = user!.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                phone = user.Phone
            },
            doctors = doctorDtos
        });
    }

    // Get patients for secretary's assigned doctors
    [HttpGet("me/patients")]
    [Authorize(Roles = "Secretary")]
    public async Task<ActionResult> GetMyPatients()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        var secretary = await _unitOfWork.Secretaries.GetByUserIdAsync(userId);
        
        if (secretary == null) 
            return NotFound(new { message = "Secretary profile not found" });

        // Get assigned doctors
        var assignedDoctors = await _unitOfWork.Secretaries.GetAssignedDoctorsAsync(secretary.Id);
        var doctorIds = assignedDoctors.Select(d => d.Id).ToList();

        if (!doctorIds.Any())
            return Ok(new List<object>());

        // Get all appointments for these doctors with Patient included
        var appointments = await _unitOfWork.Context.Appointments
            .Include(a => a.Patient)
            .Where(a => doctorIds.Contains(a.DoctorId))
            .ToListAsync();

        // Extract unique patients
        var patientMap = new Dictionary<Guid, object>();
        foreach (var apt in appointments)
        {
            if (apt.Patient != null && !patientMap.ContainsKey(apt.PatientId))
            {
                var patientAppointments = appointments.Where(a => a.PatientId == apt.PatientId).ToList();
                var lastApt = patientAppointments.OrderByDescending(a => a.Date).FirstOrDefault();
                var lastDoctorName = lastApt != null ? assignedDoctors.FirstOrDefault(d => d.Id == lastApt.DoctorId)?.FullName : null;
                
                patientMap[apt.PatientId] = new
                {
                    id = apt.Patient.Id,
                    firstName = apt.Patient.FirstName,
                    lastName = apt.Patient.LastName,
                    email = apt.Patient.Email,
                    phone = apt.Patient.Phone,
                    appointmentCount = patientAppointments.Count,
                    lastAppointment = lastApt?.Date,
                    lastDoctor = lastDoctorName
                };
            }
        }

        var patients = patientMap.Values.ToList();
        return Ok(patients);
    }

    // Get appointment history for a specific patient (secretary only for assigned doctors' patients)
    [HttpGet("me/patients/{patientId}/appointments")]
    [Authorize(Roles = "Secretary")]
    public async Task<ActionResult> GetPatientAppointmentHistory(Guid patientId)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
            var secretary = await _unitOfWork.Secretaries.GetByUserIdAsync(userId);
            
            if (secretary == null) 
                return NotFound(new { message = "Secretary profile not found" });

            // Get assigned doctors
            var assignedDoctors = await _unitOfWork.Secretaries.GetAssignedDoctorsAsync(secretary.Id);
            var doctorIds = assignedDoctors.Select(d => d.Id).ToList();

            if (!doctorIds.Any())
                return Ok(new List<object>());

            // Get all appointments for this patient with assigned doctors
            var appointments = await _unitOfWork.Context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialization)
                .Include(a => a.Patient)
                .Where(a => a.PatientId == patientId && doctorIds.Contains(a.DoctorId))
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new
            {
                id = a.Id,
                date = a.Date.ToString("yyyy-MM-dd"),
                startTime = a.StartTime.ToString(@"hh\:mm"),
                endTime = a.EndTime.ToString(@"hh\:mm"),
                status = a.Status.ToString(),
                type = a.Type.ToString(),
                reason = a.Reason,
                doctor = new
                {
                    id = a.Doctor?.Id ?? Guid.Empty,
                    fullName = a.Doctor?.FullName ?? "",
                    specialization = a.Doctor?.Specialization?.Name ?? ""
                },
                patient = new
                {
                    id = a.Patient?.Id ?? Guid.Empty,
                    firstName = a.Patient?.FirstName ?? "",
                    lastName = a.Patient?.LastName ?? "",
                    email = a.Patient?.Email ?? "",
                    phone = a.Patient?.Phone ?? ""
                },
                createdAt = a.CreatedAt,
                updatedAt = a.UpdatedAt
            }).ToList();

            return Ok(appointmentDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving appointment history", error = ex.Message });
        }
    }

    // Get appointment history for a specific doctor (secretary only for assigned doctors)
    [HttpGet("me/doctors/{doctorId}/appointments")]
    [Authorize(Roles = "Secretary")]
    public async Task<ActionResult> GetDoctorAppointmentHistory(Guid doctorId)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
            var secretary = await _unitOfWork.Secretaries.GetByUserIdAsync(userId);
            
            if (secretary == null) 
                return NotFound(new { message = "Secretary profile not found" });

            // Check if doctor is assigned to this secretary
            var isAssigned = await _unitOfWork.Secretaries.IsDoctorAssignedAsync(secretary.Id, doctorId);
            if (!isAssigned)
                return Forbid();

            // Get all appointments for this doctor
            var appointments = await _unitOfWork.Context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialization)
                .Include(a => a.Patient)
                .Where(a => a.DoctorId == doctorId)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            var appointmentDtos = appointments.Select(a => new
            {
                id = a.Id,
                date = a.Date.ToString("yyyy-MM-dd"),
                startTime = a.StartTime.ToString(@"hh\:mm"),
                endTime = a.EndTime.ToString(@"hh\:mm"),
                status = a.Status.ToString(),
                type = a.Type.ToString(),
                reason = a.Reason,
                doctor = new
                {
                    id = a.Doctor?.Id ?? Guid.Empty,
                    fullName = a.Doctor?.FullName ?? "",
                    specialization = a.Doctor?.Specialization?.Name ?? ""
                },
                patient = new
                {
                    id = a.Patient?.Id ?? Guid.Empty,
                    firstName = a.Patient?.FirstName ?? "",
                    lastName = a.Patient?.LastName ?? "",
                    email = a.Patient?.Email ?? "",
                    phone = a.Patient?.Phone ?? ""
                },
                createdAt = a.CreatedAt,
                updatedAt = a.UpdatedAt
            }).ToList();

            return Ok(appointmentDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving appointment history", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]  // Admin only
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
    [Authorize(Roles = "Admin")]  // Admin only
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
    [Authorize(Roles = "Admin")]  // Admin only
    public async Task<IActionResult> Delete(Guid id)
    {
        var secretary = await _unitOfWork.Secretaries.GetByIdAsync(id);
        if (secretary == null) return NotFound();

        _unitOfWork.Secretaries.Remove(secretary);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    // Debug endpoint to check SecretaryDoctors table
    [HttpGet("debug/assignments")]
    [Authorize(Roles = "Admin")]  // Admin only
    public async Task<ActionResult> GetAllAssignments()
    {
        var assignments = await _unitOfWork.Context.SecretaryDoctors
            .Include(sd => sd.SecretaryProfile)
                .ThenInclude(s => s.User)
            .Include(sd => sd.Doctor)
            .Select(sd => new
            {
                Id = sd.Id,
                SecretaryId = sd.SecretaryProfileId,
                SecretaryName = $"{sd.SecretaryProfile.User.FirstName} {sd.SecretaryProfile.User.LastName}",
                DoctorId = sd.DoctorId,
                DoctorName = sd.Doctor.FullName
            })
            .ToListAsync();
        
        return Ok(new { 
            totalAssignments = assignments.Count,
            assignments 
        });
    }

    [HttpGet("{secretaryId}/doctors")]
    [Authorize(Roles = "Secretary,Admin")]  // Secretary can view their own, Admin can view all
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
    [Authorize(Roles = "Admin")]  // Admin only
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
    [Authorize(Roles = "Admin")]  // Admin only
    public async Task<IActionResult> UnassignDoctor(Guid secretaryId, Guid doctorId)
    {
        await _unitOfWork.Secretaries.UnassignDoctorAsync(secretaryId, doctorId);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    private DoctorDtoFull MapToDoctorDto(Doctor doctor)
    {
        var subSpecializations = TryDeserializeList(doctor.SubSpecializations);
        var languages = TryDeserializeList(doctor.Languages);
        var consultationTypes = TryDeserializeConsultationTypes(doctor.ConsultationTypes);

        return new DoctorDtoFull(
            doctor.Id,
            doctor.UserId,
            doctor.FullName,
            doctor.SpecializationId,
            doctor.Specialization != null ? new HealthFlow_backend.DTOs.Doctors.SpecializationDto(
                doctor.Specialization.Id,
                doctor.Specialization.Name,
                doctor.Specialization.Category,
                doctor.Specialization.Description
            ) : null,
            subSpecializations,
            doctor.Bio,
            doctor.ExperienceYears,
            languages,
            consultationTypes,
            doctor.ConsultationDuration,
            doctor.ConsultationPrice,
            doctor.ClinicId,
            doctor.Clinic != null ? new HealthFlow_backend.DTOs.Doctors.ClinicDto(
                doctor.Clinic.Id,
                doctor.Clinic.Name,
                doctor.Clinic.Address,
                doctor.Clinic.Latitude.HasValue && doctor.Clinic.Longitude.HasValue
                    ? new HealthFlow_backend.DTOs.Doctors.GeoLocationDto(doctor.Clinic.Latitude.Value, doctor.Clinic.Longitude.Value)
                    : null,
                new List<HealthFlow_backend.DTOs.Doctors.WorkingHoursDto>(),
                new HealthFlow_backend.DTOs.Doctors.ContactInfoDto(doctor.Clinic.Phone, doctor.Clinic.Email, doctor.Clinic.Website)
            ) : null,
            doctor.Rating,
            doctor.User != null ? new HealthFlow_backend.DTOs.Doctors.UserDto(
                doctor.User.Id,
                doctor.User.FirstName,
                doctor.User.LastName,
                doctor.User.Email,
                doctor.User.Role,
                doctor.User.Phone,
                doctor.User.CreatedAt,
                doctor.User.UpdatedAt
            ) : null
        );
    }

    private List<string> TryDeserializeList(string json)
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private List<ConsultationType> TryDeserializeConsultationTypes(string json)
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<ConsultationType>>(json) ?? new List<ConsultationType>();
        }
        catch
        {
            return new List<ConsultationType>();
        }
    }
}
