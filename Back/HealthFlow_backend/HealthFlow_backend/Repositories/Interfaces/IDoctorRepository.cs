using HealthFlow_backend.DTOs.Doctors;
using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IDoctorRepository : IRepository<Doctor>
{
    Task<Doctor?> GetByUserIdAsync(Guid userId);
    Task<Doctor?> GetWithDetailsAsync(Guid id);
    Task<IEnumerable<Doctor>> GetBySpecializationAsync(Guid specializationId);
    Task<IEnumerable<Doctor>> GetByClinicAsync(Guid clinicId);
    Task<(IEnumerable<Doctor> Doctors, int TotalCount)> SearchAsync(DoctorSearchParams searchParams);
    Task<IEnumerable<DoctorAvailability>> GetAvailabilityAsync(Guid doctorId);
    Task<IEnumerable<DoctorRating>> GetRatingsAsync(Guid doctorId);
    Task UpdateRatingAsync(Guid doctorId);
}
