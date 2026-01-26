using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface ISecretaryRepository : IRepository<SecretaryProfile>
{
    Task<SecretaryProfile?> GetByUserIdAsync(Guid userId);
    Task<SecretaryProfile?> GetWithDoctorsAsync(Guid id);
    Task<IEnumerable<Doctor>> GetAssignedDoctorsAsync(Guid secretaryId);
}
