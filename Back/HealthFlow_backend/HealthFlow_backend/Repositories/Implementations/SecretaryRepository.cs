using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class SecretaryRepository : Repository<SecretaryProfile>, ISecretaryRepository
{
    public SecretaryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<SecretaryProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<SecretaryProfile?> GetWithDoctorsAsync(Guid id)
    {
        return await _dbSet
            .Include(s => s.User)
            .Include(s => s.SecretaryDoctors)
                .ThenInclude(sd => sd.Doctor)
                    .ThenInclude(d => d.Specialization)
            .Include(s => s.SecretaryDoctors)
                .ThenInclude(sd => sd.Doctor)
                    .ThenInclude(d => d.User)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<Doctor>> GetAssignedDoctorsAsync(Guid secretaryId)
    {
        return await _context.SecretaryDoctors
            .Where(sd => sd.SecretaryProfileId == secretaryId)
            .Include(sd => sd.Doctor)
                .ThenInclude(d => d.Specialization)
            .Include(sd => sd.Doctor)
                .ThenInclude(d => d.User)
            .Select(sd => sd.Doctor)
            .ToListAsync();
    }

    public async Task<IEnumerable<SecretaryProfile>> GetAllWithUserAsync()
    {
        return await _dbSet
            .Include(s => s.User)
            .ToListAsync();
    }

    public async Task<SecretaryProfile?> GetByIdWithUserAsync(Guid id)
    {
        return await _dbSet
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<bool> IsDoctorAssignedAsync(Guid secretaryId, Guid doctorId)
    {
        return await _context.SecretaryDoctors
            .AnyAsync(sd => sd.SecretaryProfileId == secretaryId && sd.DoctorId == doctorId);
    }

    public async Task AssignDoctorAsync(Guid secretaryId, Guid doctorId)
    {
        var assignment = new SecretaryDoctor
        {
            Id = Guid.NewGuid(),
            SecretaryProfileId = secretaryId,
            DoctorId = doctorId
        };
        await _context.SecretaryDoctors.AddAsync(assignment);
    }

    public async Task UnassignDoctorAsync(Guid secretaryId, Guid doctorId)
    {
        var assignment = await _context.SecretaryDoctors
            .FirstOrDefaultAsync(sd => sd.SecretaryProfileId == secretaryId && sd.DoctorId == doctorId);
        
        if (assignment != null)
        {
            _context.SecretaryDoctors.Remove(assignment);
        }
    }
}
