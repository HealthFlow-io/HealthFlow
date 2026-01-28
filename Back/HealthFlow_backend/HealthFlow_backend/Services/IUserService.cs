using HealthFlow_backend.Models;

namespace HealthFlow_backend.Services;

public interface IUserService
{
    IEnumerable<ApplicationUser> GetAll();
}