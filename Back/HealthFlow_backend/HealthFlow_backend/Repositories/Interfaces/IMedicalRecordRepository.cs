using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IMedicalRecordRepository : IRepository<MedicalRecord>
{
    Task<MedicalRecord?> GetWithDetailsAsync(Guid id);
    Task<IEnumerable<MedicalRecord>> GetByPatientAsync(Guid patientId);
    Task<IEnumerable<MedicalRecord>> GetByDoctorAsync(Guid doctorId);
}
