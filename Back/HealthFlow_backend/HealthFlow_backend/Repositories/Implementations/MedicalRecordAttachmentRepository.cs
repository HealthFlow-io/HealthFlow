using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class MedicalRecordAttachmentRepository : Repository<MedicalRecordAttachment>, IMedicalRecordAttachmentRepository
{
    public MedicalRecordAttachmentRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<MedicalRecordAttachment>> GetByMedicalRecordAsync(Guid medicalRecordId)
    {
        return await _dbSet
            .Include(a => a.FileUpload)
            .Where(a => a.MedicalRecordId == medicalRecordId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<MedicalRecordAttachment?> GetWithFileAsync(Guid id)
    {
        return await _dbSet
            .Include(a => a.FileUpload)
            .FirstOrDefaultAsync(a => a.Id == id);
    }
}
