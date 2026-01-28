using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IMedicalRecordAttachmentRepository : IRepository<MedicalRecordAttachment>
{
    Task<IEnumerable<MedicalRecordAttachment>> GetByMedicalRecordAsync(Guid medicalRecordId);
    Task<MedicalRecordAttachment?> GetWithFileAsync(Guid id);
}
