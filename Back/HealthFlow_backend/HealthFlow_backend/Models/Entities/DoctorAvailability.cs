namespace HealthFlow_backend.Models.Entities;

public class DoctorAvailability
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    // Navigation properties
    public Doctor Doctor { get; set; } = null!;
}
