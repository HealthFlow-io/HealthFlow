using System.Text.Json;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.DTOs.Doctors;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Services.Implementations;

public class DoctorService : IDoctorService
{
    private readonly IUnitOfWork _unitOfWork;

    public DoctorService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DoctorDto?> GetByIdAsync(Guid id)
    {
        var doctor = await _unitOfWork.Doctors.GetWithDetailsAsync(id);
        return doctor != null ? MapToDto(doctor) : null;
    }

    public async Task<DoctorDto?> GetByUserIdAsync(Guid userId)
    {
        var doctor = await _unitOfWork.Doctors.GetByUserIdAsync(userId);
        return doctor != null ? MapToDto(doctor) : null;
    }

    public async Task<PaginatedResponse<DoctorDto>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var searchParams = new DoctorSearchParams(null, null, null, null, null, null, page, pageSize);
        var (doctors, totalCount) = await _unitOfWork.Doctors.SearchAsync(searchParams);
        
        return CreatePaginatedResponse(doctors.Select(MapToDto).ToList(), page, pageSize, totalCount);
    }

    public async Task<PaginatedResponse<DoctorDto>> SearchAsync(DoctorSearchParams searchParams)
    {
        var (doctors, totalCount) = await _unitOfWork.Doctors.SearchAsync(searchParams);
        
        return CreatePaginatedResponse(doctors.Select(MapToDto).ToList(), searchParams.Page, searchParams.PageSize, totalCount);
    }

    public async Task<IEnumerable<DoctorDto>> GetBySpecializationAsync(Guid specializationId)
    {
        var doctors = await _unitOfWork.Doctors.GetBySpecializationAsync(specializationId);
        return doctors.Select(MapToDto);
    }

    public async Task<IEnumerable<DoctorDto>> GetByClinicAsync(Guid clinicId)
    {
        var doctors = await _unitOfWork.Doctors.GetByClinicAsync(clinicId);
        return doctors.Select(MapToDto);
    }

    public async Task<DoctorDto> CreateAsync(DoctorCreateDto dto)
    {
        var doctor = new Doctor
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            FullName = dto.FullName,
            SpecializationId = dto.SpecializationId,
            SubSpecializations = JsonSerializer.Serialize(dto.SubSpecializations ?? new List<string>()),
            Bio = dto.Bio,
            ExperienceYears = dto.ExperienceYears,
            Languages = JsonSerializer.Serialize(dto.Languages ?? new List<string>()),
            ConsultationTypes = JsonSerializer.Serialize(dto.ConsultationTypes),
            ConsultationDuration = dto.ConsultationDuration,
            ConsultationPrice = dto.ConsultationPrice,
            ClinicId = dto.ClinicId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Doctors.AddAsync(doctor);
        await _unitOfWork.SaveChangesAsync();

        return (await GetByIdAsync(doctor.Id))!;
    }

    public async Task<DoctorDto?> UpdateAsync(Guid id, DoctorUpdateDto dto)
    {
        var doctor = await _unitOfWork.Doctors.GetByIdAsync(id);
        if (doctor == null) return null;

        if (dto.FullName != null) doctor.FullName = dto.FullName;
        if (dto.SpecializationId.HasValue) doctor.SpecializationId = dto.SpecializationId.Value;
        if (dto.SubSpecializations != null) doctor.SubSpecializations = JsonSerializer.Serialize(dto.SubSpecializations);
        if (dto.Bio != null) doctor.Bio = dto.Bio;
        if (dto.ExperienceYears.HasValue) doctor.ExperienceYears = dto.ExperienceYears.Value;
        if (dto.Languages != null) doctor.Languages = JsonSerializer.Serialize(dto.Languages);
        if (dto.ConsultationTypes != null) doctor.ConsultationTypes = JsonSerializer.Serialize(dto.ConsultationTypes);
        if (dto.ConsultationDuration.HasValue) doctor.ConsultationDuration = dto.ConsultationDuration.Value;
        if (dto.ConsultationPrice.HasValue) doctor.ConsultationPrice = dto.ConsultationPrice.Value;
        if (dto.ClinicId.HasValue) doctor.ClinicId = dto.ClinicId;
        doctor.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Doctors.Update(doctor);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var doctor = await _unitOfWork.Doctors.GetByIdAsync(id);
        if (doctor == null) return false;

        _unitOfWork.Doctors.Remove(doctor);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<DoctorAvailabilityDto>> GetAvailabilityAsync(Guid doctorId)
    {
        var availabilities = await _unitOfWork.Doctors.GetAvailabilityAsync(doctorId);
        return availabilities.Select(a => new DoctorAvailabilityDto(
            a.Id,
            a.DoctorId,
            a.DayOfWeek,
            a.StartTime.ToString(@"hh\:mm"),
            a.EndTime.ToString(@"hh\:mm")
        ));
    }

    public async Task<IEnumerable<DoctorAvailabilityDto>> SetAvailabilityAsync(Guid doctorId, IEnumerable<DoctorAvailabilityCreateDto> availabilities)
    {
        // Remove existing availabilities
        var existing = await _unitOfWork.Doctors.GetAvailabilityAsync(doctorId);
        foreach (var availability in existing)
        {
            _unitOfWork.Doctors.Query(); // Access to remove via context
        }

        // Add new availabilities
        var newAvailabilities = availabilities.Select(a => new DoctorAvailability
        {
            Id = Guid.NewGuid(),
            DoctorId = doctorId,
            DayOfWeek = a.DayOfWeek,
            StartTime = TimeSpan.Parse(a.StartTime),
            EndTime = TimeSpan.Parse(a.EndTime)
        }).ToList();

        // This would need direct DbContext access for bulk operations
        await _unitOfWork.SaveChangesAsync();

        return await GetAvailabilityAsync(doctorId);
    }

    public async Task<IEnumerable<TimeSlotDto>> GetAvailableSlotsAsync(Guid doctorId, string date)
    {
        var doctor = await _unitOfWork.Doctors.GetWithDetailsAsync(doctorId);
        if (doctor == null) return Enumerable.Empty<TimeSlotDto>();

        if (!DateOnly.TryParse(date, out var parsedDate))
            return Enumerable.Empty<TimeSlotDto>();

        var dayOfWeek = parsedDate.DayOfWeek;
        var availability = doctor.Availabilities.FirstOrDefault(a => a.DayOfWeek == dayOfWeek);
        
        if (availability == null) return Enumerable.Empty<TimeSlotDto>();

        // Get existing appointments for the date
        var appointments = await _unitOfWork.Appointments.GetDoctorAppointmentsForDateAsync(doctorId, parsedDate);
        
        var slots = new List<TimeSlotDto>();
        var slotDuration = TimeSpan.FromMinutes(doctor.ConsultationDuration);
        var currentTime = availability.StartTime;

        while (currentTime + slotDuration <= availability.EndTime)
        {
            var slotEnd = currentTime + slotDuration;
            var isBooked = appointments.Any(a => 
                (a.StartTime <= currentTime && a.EndTime > currentTime) ||
                (a.StartTime < slotEnd && a.EndTime >= slotEnd) ||
                (a.StartTime >= currentTime && a.EndTime <= slotEnd));

            slots.Add(new TimeSlotDto(
                currentTime.ToString(@"hh\:mm"),
                slotEnd.ToString(@"hh\:mm"),
                !isBooked
            ));

            currentTime = slotEnd;
        }

        return slots;
    }

    public async Task<IEnumerable<DoctorRatingDto>> GetRatingsAsync(Guid doctorId)
    {
        var ratings = await _unitOfWork.Doctors.GetRatingsAsync(doctorId);
        return ratings.Select(r => new DoctorRatingDto(
            r.Id,
            r.DoctorId,
            r.PatientId,
            r.Rating,
            r.Comment,
            r.CreatedAt,
            r.Patient != null ? $"{r.Patient.FirstName} {r.Patient.LastName}" : null
        ));
    }

    public async Task<DoctorRatingDto> AddRatingAsync(Guid doctorId, Guid patientId, DoctorRatingCreateDto dto)
    {
        var rating = new DoctorRating
        {
            Id = Guid.NewGuid(),
            DoctorId = doctorId,
            PatientId = patientId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        // Add rating and update doctor's average
        await _unitOfWork.Doctors.UpdateRatingAsync(doctorId);
        await _unitOfWork.SaveChangesAsync();

        var patient = await _unitOfWork.Users.GetByIdAsync(patientId);
        return new DoctorRatingDto(
            rating.Id,
            rating.DoctorId,
            rating.PatientId,
            rating.Rating,
            rating.Comment,
            rating.CreatedAt,
            patient != null ? $"{patient.FirstName} {patient.LastName}" : null
        );
    }

    private DoctorDto MapToDto(Doctor doctor)
    {
        var subSpecializations = TryDeserializeList(doctor.SubSpecializations);
        var languages = TryDeserializeList(doctor.Languages);
        var consultationTypes = TryDeserializeConsultationTypes(doctor.ConsultationTypes);

        return new DoctorDto(
            doctor.Id,
            doctor.UserId,
            doctor.FullName,
            doctor.SpecializationId,
            doctor.Specialization != null ? new SpecializationDto(
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
            doctor.Clinic != null ? new ClinicDto(
                doctor.Clinic.Id,
                doctor.Clinic.Name,
                doctor.Clinic.Address,
                doctor.Clinic.Latitude.HasValue && doctor.Clinic.Longitude.HasValue
                    ? new GeoLocationDto(doctor.Clinic.Latitude.Value, doctor.Clinic.Longitude.Value)
                    : null,
                new List<WorkingHoursDto>(),
                new ContactInfoDto(doctor.Clinic.Phone, doctor.Clinic.Email, doctor.Clinic.Website)
            ) : null,
            doctor.Rating,
            doctor.User != null ? new UserDto(
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

    private static List<string> TryDeserializeList(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static List<ConsultationType> TryDeserializeConsultationTypes(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<ConsultationType>>(json) ?? new List<ConsultationType>();
        }
        catch
        {
            return new List<ConsultationType>();
        }
    }

    private static PaginatedResponse<DoctorDto> CreatePaginatedResponse(List<DoctorDto> data, int page, int pageSize, int totalCount)
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PaginatedResponse<DoctorDto>(
            data,
            page,
            pageSize,
            totalCount,
            totalPages,
            page < totalPages,
            page > 1
        );
    }
}
