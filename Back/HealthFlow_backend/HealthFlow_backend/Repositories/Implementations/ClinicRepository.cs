using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.DTOs.Clinics;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class ClinicRepository : Repository<Clinic>, IClinicRepository
{
    public ClinicRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Clinic?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(c => c.WorkingHours)
            .Include(c => c.Doctors)
                .ThenInclude(d => d.Specialization)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<(IEnumerable<Clinic> Clinics, int TotalCount)> SearchAsync(ClinicSearchParams searchParams)
    {
        var query = _dbSet
            .Include(c => c.WorkingHours)
            .AsQueryable();

        if (!string.IsNullOrEmpty(searchParams.Name))
        {
            query = query.Where(c => c.Name.ToLower().Contains(searchParams.Name.ToLower()));
        }

        if (!string.IsNullOrEmpty(searchParams.Address))
        {
            query = query.Where(c => c.Address.ToLower().Contains(searchParams.Address.ToLower()));
        }

        var totalCount = await query.CountAsync();

        var clinics = await query
            .OrderBy(c => c.Name)
            .Skip((searchParams.Page - 1) * searchParams.PageSize)
            .Take(searchParams.PageSize)
            .ToListAsync();

        return (clinics, totalCount);
    }

    public async Task<(IEnumerable<Clinic> Clinics, int TotalCount)> GetNearbyAsync(NearbySearchParams searchParams)
    {
        // Filter clinics that have geo coordinates
        var query = _dbSet
            .Include(c => c.WorkingHours)
            .Where(c => c.Latitude.HasValue && c.Longitude.HasValue);

        // Get all and calculate distance in memory (for simplicity)
        // In production, use spatial queries with MySQL spatial extensions
        var clinics = await query.ToListAsync();

        var nearbyClinics = clinics
            .Select(c => new
            {
                Clinic = c,
                Distance = CalculateDistance(
                    searchParams.Latitude, searchParams.Longitude,
                    c.Latitude!.Value, c.Longitude!.Value)
            })
            .Where(x => x.Distance <= searchParams.RadiusKm)
            .OrderBy(x => x.Distance)
            .ToList();

        var totalCount = nearbyClinics.Count;

        var pagedClinics = nearbyClinics
            .Skip((searchParams.Page - 1) * searchParams.PageSize)
            .Take(searchParams.PageSize)
            .Select(x => x.Clinic)
            .ToList();

        return (pagedClinics, totalCount);
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadiusKm = 6371;

        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
