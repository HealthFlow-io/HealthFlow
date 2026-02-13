using HealthFlow_backend.Data;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    ApplicationDbContext Context { get; }
    IUserRepository Users { get; }
    IDoctorRepository Doctors { get; }
    ISpecializationRepository Specializations { get; }
    IAppointmentRepository Appointments { get; }
    IClinicRepository Clinics { get; }
    IMedicalRecordRepository MedicalRecords { get; }
    IMedicalRecordAttachmentRepository MedicalRecordAttachments { get; }
    ISecretaryRepository Secretaries { get; }
    INotificationRepository Notifications { get; }
    IFileRepository Files { get; }
    IChatMessageRepository ChatMessages { get; }
    Task<int> SaveChangesAsync();
}
