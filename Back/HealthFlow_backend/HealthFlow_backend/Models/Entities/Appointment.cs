using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.Models.Entities;

public class Appointment
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? ClinicId { get; set; }
    public DateOnly Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public AppointmentType Type { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string? MeetingLink { get; set; }
    public string? Reason { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Clinic? Clinic { get; set; }
}
