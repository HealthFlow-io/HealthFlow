using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class SpecializationRepository : Repository<Specialization>, ISpecializationRepository
{
    public SpecializationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Specialization>> GetByCategoryAsync(string category)
    {
        return await _dbSet
            .Where(s => s.Category.ToLower() == category.ToLower())
            .OrderBy(s => s.Name)
            .ToListAsync();
    }
}
