using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface ISpecializationRepository : IRepository<Specialization>
{
    Task<IEnumerable<Specialization>> GetByCategoryAsync(string category);
}
