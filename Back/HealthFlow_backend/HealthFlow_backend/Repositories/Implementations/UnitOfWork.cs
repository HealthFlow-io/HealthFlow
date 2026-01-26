using HealthFlow_backend.Data;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IUserRepository? _users;
    private IDoctorRepository? _doctors;
    private ISpecializationRepository? _specializations;
    private IAppointmentRepository? _appointments;
    private IClinicRepository? _clinics;
    private IMedicalRecordRepository? _medicalRecords;
    private ISecretaryRepository? _secretaries;
    private INotificationRepository? _notifications;
    private IFileRepository? _files;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _users ??= new UserRepository(_context);
    public IDoctorRepository Doctors => _doctors ??= new DoctorRepository(_context);
    public ISpecializationRepository Specializations => _specializations ??= new SpecializationRepository(_context);
    public IAppointmentRepository Appointments => _appointments ??= new AppointmentRepository(_context);
    public IClinicRepository Clinics => _clinics ??= new ClinicRepository(_context);
    public IMedicalRecordRepository MedicalRecords => _medicalRecords ??= new MedicalRecordRepository(_context);
    public ISecretaryRepository Secretaries => _secretaries ??= new SecretaryRepository(_context);
    public INotificationRepository Notifications => _notifications ??= new NotificationRepository(_context);
    public IFileRepository Files => _files ??= new FileRepository(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
