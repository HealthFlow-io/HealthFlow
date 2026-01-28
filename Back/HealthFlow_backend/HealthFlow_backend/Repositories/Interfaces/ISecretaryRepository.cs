using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface ISecretaryRepository : IRepository<SecretaryProfile>
{
    Task<SecretaryProfile?> GetByUserIdAsync(Guid userId);
    Task<SecretaryProfile?> GetWithDoctorsAsync(Guid id);
    Task<IEnumerable<Doctor>> GetAssignedDoctorsAsync(Guid secretaryId);
    Task<IEnumerable<SecretaryProfile>> GetAllWithUserAsync();
    Task<SecretaryProfile?> GetByIdWithUserAsync(Guid id);
    Task<bool> IsDoctorAssignedAsync(Guid secretaryId, Guid doctorId);
    Task AssignDoctorAsync(Guid secretaryId, Guid doctorId);
    Task UnassignDoctorAsync(Guid secretaryId, Guid doctorId);
}
