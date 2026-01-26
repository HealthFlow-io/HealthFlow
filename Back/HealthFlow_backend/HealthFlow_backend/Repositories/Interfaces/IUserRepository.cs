using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<User?> GetWithProfileAsync(Guid id);
}
