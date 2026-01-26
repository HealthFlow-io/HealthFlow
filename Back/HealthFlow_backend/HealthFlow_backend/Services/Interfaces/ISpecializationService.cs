using HealthFlow_backend.DTOs.Specializations;

namespace HealthFlow_backend.Services.Interfaces;

public interface ISpecializationService
{
    Task<SpecializationDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<SpecializationDto>> GetAllAsync();
    Task<IEnumerable<SpecializationDto>> GetByCategoryAsync(string category);
    Task<SpecializationDto> CreateAsync(SpecializationCreateDto dto);
    Task<SpecializationDto?> UpdateAsync(Guid id, SpecializationUpdateDto dto);
    Task<bool> DeleteAsync(Guid id);
}
