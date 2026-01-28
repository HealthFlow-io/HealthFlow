using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.DTOs.Doctors;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class DoctorRepository : Repository<Doctor>, IDoctorRepository
{
    public DoctorRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Doctor?> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.Clinic)
            .FirstOrDefaultAsync(d => d.UserId == userId);
    }

    public async Task<Doctor?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.Clinic)
            .Include(d => d.Availabilities)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<IEnumerable<Doctor>> GetBySpecializationAsync(Guid specializationId)
    {
        return await _dbSet
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.Clinic)
            .Where(d => d.SpecializationId == specializationId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Doctor>> GetByClinicAsync(Guid clinicId)
    {
        return await _dbSet
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.Clinic)
            .Where(d => d.ClinicId == clinicId)
            .ToListAsync();
    }

    public async Task<(IEnumerable<Doctor> Doctors, int TotalCount)> SearchAsync(DoctorSearchParams searchParams)
    {
        var query = _dbSet
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.Clinic)
            .AsQueryable();

        // Filter by specialization
        if (!string.IsNullOrEmpty(searchParams.Specialization))
        {
            query = query.Where(d => d.Specialization.Name.ToLower().Contains(searchParams.Specialization.ToLower()));
        }

        // Filter by location (clinic address)
        if (!string.IsNullOrEmpty(searchParams.Location))
        {
            query = query.Where(d => d.Clinic != null && 
                                    d.Clinic.Address.ToLower().Contains(searchParams.Location.ToLower()));
        }

        // Filter by consultation type
        if (searchParams.ConsultationType.HasValue)
        {
            var consultationType = searchParams.ConsultationType.Value.ToString();
            query = query.Where(d => d.ConsultationTypes.Contains(consultationType));
        }

        // Filter by language
        if (!string.IsNullOrEmpty(searchParams.Language))
        {
            query = query.Where(d => d.Languages.ToLower().Contains(searchParams.Language.ToLower()));
        }

        // Filter by minimum rating
        if (searchParams.MinRating.HasValue)
        {
            query = query.Where(d => d.Rating >= searchParams.MinRating.Value);
        }

        // Filter by maximum price
        if (searchParams.MaxPrice.HasValue)
        {
            query = query.Where(d => d.ConsultationPrice <= searchParams.MaxPrice.Value);
        }

        var totalCount = await query.CountAsync();

        var doctors = await query
            .OrderByDescending(d => d.Rating)
            .Skip((searchParams.Page - 1) * searchParams.PageSize)
            .Take(searchParams.PageSize)
            .ToListAsync();

        return (doctors, totalCount);
    }

    public async Task<IEnumerable<DoctorAvailability>> GetAvailabilityAsync(Guid doctorId)
    {
        return await _context.DoctorAvailabilities
            .Where(a => a.DoctorId == doctorId)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<DoctorRating>> GetRatingsAsync(Guid doctorId)
    {
        return await _context.DoctorRatings
            .Include(r => r.Patient)
            .Where(r => r.DoctorId == doctorId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task UpdateRatingAsync(Guid doctorId)
    {
        var ratings = await _context.DoctorRatings
            .Where(r => r.DoctorId == doctorId)
            .ToListAsync();

        var doctor = await _dbSet.FindAsync(doctorId);
        if (doctor != null && ratings.Any())
        {
            doctor.Rating = ratings.Average(r => r.Rating);
            doctor.RatingCount = ratings.Count;
        }
    }
}
