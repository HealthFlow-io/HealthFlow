using HealthFlow_backend.DTOs.Clinics;
using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IClinicRepository : IRepository<Clinic>
{
    Task<Clinic?> GetWithDetailsAsync(Guid id);
    Task<(IEnumerable<Clinic> Clinics, int TotalCount)> SearchAsync(ClinicSearchParams searchParams);
    Task<(IEnumerable<Clinic> Clinics, int TotalCount)> GetNearbyAsync(NearbySearchParams searchParams);
}
