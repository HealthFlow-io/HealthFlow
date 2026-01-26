using HealthFlow_backend.DTOs.Clinics;
using HealthFlow_backend.DTOs.Common;

namespace HealthFlow_backend.Services.Interfaces;

public interface IClinicService
{
    Task<ClinicDto?> GetByIdAsync(Guid id);
    Task<PaginatedResponse<ClinicDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<PaginatedResponse<ClinicDto>> SearchAsync(ClinicSearchParams searchParams);
    Task<PaginatedResponse<ClinicDto>> GetNearbyAsync(NearbySearchParams searchParams);
    Task<ClinicDto> CreateAsync(ClinicCreateDto dto);
    Task<ClinicDto?> UpdateAsync(Guid id, ClinicUpdateDto dto);
    Task<bool> DeleteAsync(Guid id);
}
