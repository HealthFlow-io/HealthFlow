using HealthFlow_backend.DTOs.Appointments;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.DTOs.Doctors;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Models.Enums;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Services.Implementations;

public class AppointmentService : IAppointmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public AppointmentService(IUnitOfWork unitOfWork, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<AppointmentDto?> GetByIdAsync(Guid id)
    {
        var appointment = await _unitOfWork.Appointments.GetWithDetailsAsync(id);
        return appointment != null ? MapToDto(appointment) : null;
    }

    public async Task<PaginatedResponse<AppointmentDto>> GetByPatientAsync(Guid patientId, AppointmentFilterParams filterParams)
    {
        var (appointments, totalCount) = await _unitOfWork.Appointments.GetByPatientAsync(patientId, filterParams);
        return CreatePaginatedResponse(appointments.Select(MapToDto).ToList(), filterParams.Page, filterParams.PageSize, totalCount);
    }

    public async Task<PaginatedResponse<AppointmentDto>> GetByDoctorAsync(Guid doctorId, AppointmentFilterParams filterParams)
    {
        var (appointments, totalCount) = await _unitOfWork.Appointments.GetByDoctorAsync(doctorId, filterParams);
        return CreatePaginatedResponse(appointments.Select(MapToDto).ToList(), filterParams.Page, filterParams.PageSize, totalCount);
    }

    public async Task<PaginatedResponse<AppointmentDto>> GetByClinicAsync(Guid clinicId, AppointmentFilterParams filterParams)
    {
        var (appointments, totalCount) = await _unitOfWork.Appointments.GetByClinicAsync(clinicId, filterParams);
        return CreatePaginatedResponse(appointments.Select(MapToDto).ToList(), filterParams.Page, filterParams.PageSize, totalCount);
    }

    public async Task<AppointmentDto> CreateAsync(Guid patientId, AppointmentCreateDto dto)
    {
        // Parse date and time
        if (!DateOnly.TryParse(dto.Date, out var date))
            throw new ArgumentException("Invalid date format");
        if (!TimeSpan.TryParse(dto.StartTime, out var startTime))
            throw new ArgumentException("Invalid start time format");
        if (!TimeSpan.TryParse(dto.EndTime, out var endTime))
            throw new ArgumentException("Invalid end time format");

        // Check for conflicts
        var hasConflict = await _unitOfWork.Appointments.HasConflictAsync(dto.DoctorId, date, startTime, endTime);
        if (hasConflict)
            throw new InvalidOperationException("The selected time slot is not available");

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            DoctorId = dto.DoctorId,
            ClinicId = dto.ClinicId,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            Type = dto.Type,
            Status = AppointmentStatus.Pending,
            Reason = dto.Reason,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Appointments.AddAsync(appointment);
        await _unitOfWork.SaveChangesAsync();

        // Send notification to doctor
        var doctor = await _unitOfWork.Doctors.GetWithDetailsAsync(dto.DoctorId);
        if (doctor != null)
        {
            await _notificationService.SendAppointmentNotificationAsync(
                doctor.UserId,
                "New Appointment Request",
                $"You have a new appointment request for {date:d} at {startTime:hh\\:mm}",
                "NewAppointmentRequest",
                new { appointmentId = appointment.Id }
            );
        }

        return (await GetByIdAsync(appointment.Id))!;
    }

    public async Task<AppointmentDto?> UpdateAsync(Guid id, AppointmentUpdateDto dto)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(id);
        if (appointment == null) return null;

        if (dto.Date != null && DateOnly.TryParse(dto.Date, out var date)) 
            appointment.Date = date;
        if (dto.StartTime != null && TimeSpan.TryParse(dto.StartTime, out var startTime)) 
            appointment.StartTime = startTime;
        if (dto.EndTime != null && TimeSpan.TryParse(dto.EndTime, out var endTime)) 
            appointment.EndTime = endTime;
        if (dto.Type.HasValue) appointment.Type = dto.Type.Value;
        if (dto.Reason != null) appointment.Reason = dto.Reason;
        appointment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> ApproveAsync(Guid id, Guid approvedBy)
    {
        var appointment = await _unitOfWork.Appointments.GetWithDetailsAsync(id);
        if (appointment == null) return false;

        appointment.Status = AppointmentStatus.Approved;
        appointment.ApprovedBy = approvedBy;
        appointment.UpdatedAt = DateTime.UtcNow;

        // Generate meeting link for online appointments
        if (appointment.Type == AppointmentType.Online)
        {
            appointment.MeetingLink = $"https://meet.healthflow.com/{appointment.Id}";
        }

        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync();

        // Notify patient
        await _notificationService.SendAppointmentNotificationAsync(
            appointment.PatientId,
            "Appointment Approved",
            $"Your appointment on {appointment.Date:d} has been approved",
            "AppointmentApproved",
            new { appointmentId = appointment.Id, meetingLink = appointment.MeetingLink }
        );

        return true;
    }

    public async Task<bool> DeclineAsync(Guid id)
    {
        var appointment = await _unitOfWork.Appointments.GetWithDetailsAsync(id);
        if (appointment == null) return false;

        appointment.Status = AppointmentStatus.Declined;
        appointment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync();

        // Notify patient
        await _notificationService.SendAppointmentNotificationAsync(
            appointment.PatientId,
            "Appointment Declined",
            $"Your appointment on {appointment.Date:d} has been declined",
            "AppointmentDeclined",
            new { appointmentId = appointment.Id }
        );

        return true;
    }

    public async Task<bool> CancelAsync(Guid id)
    {
        var appointment = await _unitOfWork.Appointments.GetWithDetailsAsync(id);
        if (appointment == null) return false;

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync();

        // Notify doctor
        if (appointment.Doctor != null)
        {
            await _notificationService.SendAppointmentNotificationAsync(
                appointment.Doctor.UserId,
                "Appointment Cancelled",
                $"The appointment on {appointment.Date:d} has been cancelled",
                "AppointmentCancelled",
                new { appointmentId = appointment.Id }
            );
        }

        return true;
    }

    public async Task<bool> RescheduleAsync(Guid id, AppointmentRescheduleDto dto)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(id);
        if (appointment == null) return false;

        if (!DateOnly.TryParse(dto.Date, out var date))
            throw new ArgumentException("Invalid date format");
        if (!TimeSpan.TryParse(dto.StartTime, out var startTime))
            throw new ArgumentException("Invalid start time format");
        if (!TimeSpan.TryParse(dto.EndTime, out var endTime))
            throw new ArgumentException("Invalid end time format");

        // Check for conflicts
        var hasConflict = await _unitOfWork.Appointments.HasConflictAsync(
            appointment.DoctorId, date, startTime, endTime, appointment.Id);
        if (hasConflict)
            throw new InvalidOperationException("The selected time slot is not available");

        appointment.Date = date;
        appointment.StartTime = startTime;
        appointment.EndTime = endTime;
        appointment.Status = AppointmentStatus.Pending;
        appointment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> CompleteAsync(Guid id)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(id);
        if (appointment == null) return false;

        appointment.Status = AppointmentStatus.Done;
        appointment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<TimeSlotDto>> GetAvailableSlotsAsync(Guid doctorId, string date)
    {
        var doctor = await _unitOfWork.Doctors.GetWithDetailsAsync(doctorId);
        if (doctor == null) return Enumerable.Empty<TimeSlotDto>();

        if (!DateOnly.TryParse(date, out var parsedDate))
            return Enumerable.Empty<TimeSlotDto>();

        var dayOfWeek = parsedDate.DayOfWeek;
        var availability = doctor.Availabilities.FirstOrDefault(a => a.DayOfWeek == dayOfWeek);
        
        if (availability == null) return Enumerable.Empty<TimeSlotDto>();

        var appointments = await _unitOfWork.Appointments.GetDoctorAppointmentsForDateAsync(doctorId, parsedDate);
        
        var slots = new List<TimeSlotDto>();
        var slotDuration = TimeSpan.FromMinutes(doctor.ConsultationDuration);
        var currentTime = availability.StartTime;

        while (currentTime + slotDuration <= availability.EndTime)
        {
            var slotEnd = currentTime + slotDuration;
            var isBooked = appointments.Any(a => 
                (a.StartTime <= currentTime && a.EndTime > currentTime) ||
                (a.StartTime < slotEnd && a.EndTime >= slotEnd));

            slots.Add(new TimeSlotDto(
                currentTime.ToString(@"hh\:mm"),
                slotEnd.ToString(@"hh\:mm"),
                !isBooked
            ));

            currentTime = slotEnd;
        }

        return slots;
    }

    private AppointmentDto MapToDto(Appointment appointment)
    {
        return new AppointmentDto(
            appointment.Id,
            appointment.PatientId,
            appointment.Patient != null ? new DTOs.Appointments.PatientDto(
                appointment.Patient.Id,
                appointment.Patient.FirstName,
                appointment.Patient.LastName,
                appointment.Patient.Email,
                appointment.Patient.Phone
            ) : null,
            appointment.DoctorId,
            appointment.Doctor != null ? new DTOs.Appointments.DoctorDto(
                appointment.Doctor.Id,
                appointment.Doctor.FullName,
                appointment.Doctor.Specialization?.Name ?? "",
                appointment.Doctor.ConsultationDuration,
                appointment.Doctor.ConsultationPrice
            ) : null,
            appointment.ClinicId,
            appointment.Clinic != null ? new DTOs.Appointments.ClinicDto(
                appointment.Clinic.Id,
                appointment.Clinic.Name,
                appointment.Clinic.Address
            ) : null,
            appointment.Date.ToString("yyyy-MM-dd"),
            appointment.StartTime.ToString(@"hh\:mm"),
            appointment.EndTime.ToString(@"hh\:mm"),
            appointment.Type,
            appointment.Status,
            appointment.MeetingLink,
            appointment.Reason,
            appointment.CreatedAt,
            appointment.ApprovedBy
        );
    }

    private static PaginatedResponse<AppointmentDto> CreatePaginatedResponse(List<AppointmentDto> data, int page, int pageSize, int totalCount)
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PaginatedResponse<AppointmentDto>(
            data,
            page,
            pageSize,
            totalCount,
            totalPages,
            page < totalPages,
            page > 1
        );
    }
}
