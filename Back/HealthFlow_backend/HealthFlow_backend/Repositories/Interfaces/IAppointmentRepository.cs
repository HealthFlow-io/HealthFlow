using HealthFlow_backend.DTOs.Appointments;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<Appointment?> GetWithDetailsAsync(Guid id);
    Task<(IEnumerable<Appointment> Appointments, int TotalCount)> GetByPatientAsync(Guid patientId, AppointmentFilterParams filterParams);
    Task<(IEnumerable<Appointment> Appointments, int TotalCount)> GetByDoctorAsync(Guid doctorId, AppointmentFilterParams filterParams);
    Task<(IEnumerable<Appointment> Appointments, int TotalCount)> GetByClinicAsync(Guid clinicId, AppointmentFilterParams filterParams);
    Task<IEnumerable<Appointment>> GetDoctorAppointmentsForDateAsync(Guid doctorId, DateOnly date);
    Task<bool> HasConflictAsync(Guid doctorId, DateOnly date, TimeSpan startTime, TimeSpan endTime, Guid? excludeAppointmentId = null);
}
