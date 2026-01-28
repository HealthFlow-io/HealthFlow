using HealthFlow_backend.DTOs.Appointments;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.DTOs.Doctors;

namespace HealthFlow_backend.Services.Interfaces;

public interface IAppointmentService
{
    Task<AppointmentDto?> GetByIdAsync(Guid id);
    Task<PaginatedResponse<AppointmentDto>> GetByPatientAsync(Guid patientId, AppointmentFilterParams filterParams);
    Task<PaginatedResponse<AppointmentDto>> GetByDoctorAsync(Guid doctorId, AppointmentFilterParams filterParams);
    Task<PaginatedResponse<AppointmentDto>> GetByClinicAsync(Guid clinicId, AppointmentFilterParams filterParams);
    Task<AppointmentDto> CreateAsync(Guid patientId, AppointmentCreateDto dto);
    Task<AppointmentDto?> UpdateAsync(Guid id, AppointmentUpdateDto dto);
    Task<bool> ApproveAsync(Guid id, Guid approvedBy);
    Task<bool> DeclineAsync(Guid id);
    Task<bool> CancelAsync(Guid id);
    Task<bool> RescheduleAsync(Guid id, AppointmentRescheduleDto dto);
    Task<bool> CompleteAsync(Guid id);
    Task<IEnumerable<TimeSlotDto>> GetAvailableSlotsAsync(Guid doctorId, string date);
}
