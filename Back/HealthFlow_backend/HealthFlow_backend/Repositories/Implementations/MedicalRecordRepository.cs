using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class MedicalRecordRepository : Repository<MedicalRecord>, IMedicalRecordRepository
{
    public MedicalRecordRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<MedicalRecord?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(m => m.Patient)
            .Include(m => m.Doctor)
                .ThenInclude(d => d.Specialization)
            .Include(m => m.Doctor)
                .ThenInclude(d => d.User)
            .Include(m => m.Attachments)
                .ThenInclude(a => a.FileUpload)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<IEnumerable<MedicalRecord>> GetByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Include(m => m.Doctor)
                .ThenInclude(d => d.Specialization)
            .Include(m => m.Doctor)
                .ThenInclude(d => d.User)
            .Include(m => m.Attachments)
                .ThenInclude(a => a.FileUpload)
            .Where(m => m.PatientId == patientId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<MedicalRecord>> GetByDoctorAsync(Guid doctorId)
    {
        return await _dbSet
            .Include(m => m.Patient)
            .Where(m => m.DoctorId == doctorId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }
}
