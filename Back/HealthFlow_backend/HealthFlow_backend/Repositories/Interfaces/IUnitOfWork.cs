namespace HealthFlow_backend.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IDoctorRepository Doctors { get; }
    ISpecializationRepository Specializations { get; }
    IAppointmentRepository Appointments { get; }
    IClinicRepository Clinics { get; }
    IMedicalRecordRepository MedicalRecords { get; }
    ISecretaryRepository Secretaries { get; }
    INotificationRepository Notifications { get; }
    IFileRepository Files { get; }
    Task<int> SaveChangesAsync();
}
