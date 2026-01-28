using HealthFlow_backend.DTOs.Specializations;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Services.Implementations;

public class SpecializationService : ISpecializationService
{
    private readonly IUnitOfWork _unitOfWork;

    public SpecializationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SpecializationDto?> GetByIdAsync(Guid id)
    {
        var specialization = await _unitOfWork.Specializations.GetByIdAsync(id);
        return specialization != null ? MapToDto(specialization) : null;
    }

    public async Task<IEnumerable<SpecializationDto>> GetAllAsync()
    {
        var specializations = await _unitOfWork.Specializations.GetAllAsync();
        return specializations.Select(MapToDto);
    }

    public async Task<IEnumerable<SpecializationDto>> GetByCategoryAsync(string category)
    {
        var specializations = await _unitOfWork.Specializations.GetByCategoryAsync(category);
        return specializations.Select(MapToDto);
    }

    public async Task<SpecializationDto> CreateAsync(SpecializationCreateDto dto)
    {
        var specialization = new Specialization
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Category = dto.Category,
            Description = dto.Description
        };

        await _unitOfWork.Specializations.AddAsync(specialization);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(specialization);
    }

    public async Task<SpecializationDto?> UpdateAsync(Guid id, SpecializationUpdateDto dto)
    {
        var specialization = await _unitOfWork.Specializations.GetByIdAsync(id);
        if (specialization == null) return null;

        if (dto.Name != null) specialization.Name = dto.Name;
        if (dto.Category != null) specialization.Category = dto.Category;
        if (dto.Description != null) specialization.Description = dto.Description;

        _unitOfWork.Specializations.Update(specialization);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(specialization);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var specialization = await _unitOfWork.Specializations.GetByIdAsync(id);
        if (specialization == null) return false;

        _unitOfWork.Specializations.Remove(specialization);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static SpecializationDto MapToDto(Specialization specialization)
    {
        return new SpecializationDto(
            specialization.Id,
            specialization.Name,
            specialization.Category,
            specialization.Description
        );
    }
}
