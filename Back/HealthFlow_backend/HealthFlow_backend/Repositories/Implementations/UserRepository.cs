using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && 
                                     u.RefreshTokenExpiryTime > DateTime.UtcNow);
    }

    public async Task<User?> GetWithProfileAsync(Guid id)
    {
        return await _dbSet
            .Include(u => u.DoctorProfile)
                .ThenInclude(d => d!.Specialization)
            .Include(u => u.DoctorProfile)
                .ThenInclude(d => d!.Clinic)
            .Include(u => u.SecretaryProfile)
            .FirstOrDefaultAsync(u => u.Id == id);
    }
}
