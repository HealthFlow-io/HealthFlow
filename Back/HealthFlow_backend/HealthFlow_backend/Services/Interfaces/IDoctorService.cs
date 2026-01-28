using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.DTOs.Doctors;

namespace HealthFlow_backend.Services.Interfaces;

public interface IDoctorService
{
    Task<DoctorDto?> GetByIdAsync(Guid id);
    Task<DoctorDto?> GetByUserIdAsync(Guid userId);
    Task<PaginatedResponse<DoctorDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<PaginatedResponse<DoctorDto>> SearchAsync(DoctorSearchParams searchParams);
    Task<IEnumerable<DoctorDto>> GetBySpecializationAsync(Guid specializationId);
    Task<IEnumerable<DoctorDto>> GetByClinicAsync(Guid clinicId);
    Task<DoctorDto> CreateAsync(DoctorCreateDto dto);
    Task<DoctorDto?> UpdateAsync(Guid id, DoctorUpdateDto dto);
    Task<bool> DeleteAsync(Guid id);
    
    // Availability
    Task<IEnumerable<DoctorAvailabilityDto>> GetAvailabilityAsync(Guid doctorId);
    Task<IEnumerable<DoctorAvailabilityDto>> SetAvailabilityAsync(Guid doctorId, IEnumerable<DoctorAvailabilityCreateDto> availabilities);
    Task<IEnumerable<TimeSlotDto>> GetAvailableSlotsAsync(Guid doctorId, string date);
    
    // Ratings
    Task<IEnumerable<DoctorRatingDto>> GetRatingsAsync(Guid doctorId);
    Task<DoctorRatingDto> AddRatingAsync(Guid doctorId, Guid patientId, DoctorRatingCreateDto dto);
}
