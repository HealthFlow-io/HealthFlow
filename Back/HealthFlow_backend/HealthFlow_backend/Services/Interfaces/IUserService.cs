using HealthFlow_backend.DTOs.Auth;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.Services.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<PaginatedResponse<UserDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<UserDto?> UpdateAsync(Guid id, UserUpdateDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<IEnumerable<UserDto>> GetByRoleAsync(UserRole role);
}
