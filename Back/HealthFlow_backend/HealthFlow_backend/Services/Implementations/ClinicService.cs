using HealthFlow_backend.DTOs.Clinics;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Services.Implementations;

public class ClinicService : IClinicService
{
    private readonly IUnitOfWork _unitOfWork;

    public ClinicService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ClinicDto?> GetByIdAsync(Guid id)
    {
        var clinic = await _unitOfWork.Clinics.GetWithDetailsAsync(id);
        return clinic != null ? MapToDto(clinic) : null;
    }

    public async Task<PaginatedResponse<ClinicDto>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var searchParams = new ClinicSearchParams(null, null, page, pageSize);
        var (clinics, totalCount) = await _unitOfWork.Clinics.SearchAsync(searchParams);
        return CreatePaginatedResponse(clinics.Select(MapToDto).ToList(), page, pageSize, totalCount);
    }

    public async Task<PaginatedResponse<ClinicDto>> SearchAsync(ClinicSearchParams searchParams)
    {
        var (clinics, totalCount) = await _unitOfWork.Clinics.SearchAsync(searchParams);
        return CreatePaginatedResponse(clinics.Select(MapToDto).ToList(), searchParams.Page, searchParams.PageSize, totalCount);
    }

    public async Task<PaginatedResponse<ClinicDto>> GetNearbyAsync(NearbySearchParams searchParams)
    {
        var (clinics, totalCount) = await _unitOfWork.Clinics.GetNearbyAsync(searchParams);
        return CreatePaginatedResponse(clinics.Select(MapToDto).ToList(), searchParams.Page, searchParams.PageSize, totalCount);
    }

    public async Task<ClinicDto> CreateAsync(ClinicCreateDto dto)
    {
        var clinic = new Clinic
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Address = dto.Address,
            Latitude = dto.GeoLocation?.Latitude,
            Longitude = dto.GeoLocation?.Longitude,
            Phone = dto.ContactInfo?.Phone,
            Email = dto.ContactInfo?.Email,
            Website = dto.ContactInfo?.Website,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Clinics.AddAsync(clinic);

        // Add working hours if provided
        if (dto.WorkingHours != null)
        {
            foreach (var wh in dto.WorkingHours)
            {
                clinic.WorkingHours.Add(new ClinicWorkingHours
                {
                    Id = Guid.NewGuid(),
                    ClinicId = clinic.Id,
                    DayOfWeek = wh.DayOfWeek,
                    OpenTime = TimeSpan.Parse(wh.OpenTime),
                    CloseTime = TimeSpan.Parse(wh.CloseTime),
                    IsClosed = wh.IsClosed
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return (await GetByIdAsync(clinic.Id))!;
    }

    public async Task<ClinicDto?> UpdateAsync(Guid id, ClinicUpdateDto dto)
    {
        var clinic = await _unitOfWork.Clinics.GetWithDetailsAsync(id);
        if (clinic == null) return null;

        if (dto.Name != null) clinic.Name = dto.Name;
        if (dto.Address != null) clinic.Address = dto.Address;
        if (dto.GeoLocation != null)
        {
            clinic.Latitude = dto.GeoLocation.Latitude;
            clinic.Longitude = dto.GeoLocation.Longitude;
        }
        if (dto.ContactInfo != null)
        {
            clinic.Phone = dto.ContactInfo.Phone;
            clinic.Email = dto.ContactInfo.Email;
            clinic.Website = dto.ContactInfo.Website;
        }
        clinic.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Clinics.Update(clinic);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var clinic = await _unitOfWork.Clinics.GetByIdAsync(id);
        if (clinic == null) return false;

        _unitOfWork.Clinics.Remove(clinic);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static ClinicDto MapToDto(Clinic clinic)
    {
        return new ClinicDto(
            clinic.Id,
            clinic.Name,
            clinic.Address,
            clinic.Latitude.HasValue && clinic.Longitude.HasValue
                ? new GeoLocationDto(clinic.Latitude.Value, clinic.Longitude.Value)
                : null,
            clinic.WorkingHours.Select(wh => new WorkingHoursDto(
                wh.DayOfWeek,
                wh.OpenTime.ToString(@"hh\:mm"),
                wh.CloseTime.ToString(@"hh\:mm"),
                wh.IsClosed
            )).ToList(),
            new ContactInfoDto(clinic.Phone, clinic.Email, clinic.Website)
        );
    }

    private static PaginatedResponse<ClinicDto> CreatePaginatedResponse(List<ClinicDto> data, int page, int pageSize, int totalCount)
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PaginatedResponse<ClinicDto>(
            data,
            page,
            pageSize,
            totalCount,
            totalPages,
            page < totalPages,
            page > 1
        );
    }
}
