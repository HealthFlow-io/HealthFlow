namespace HealthFlow_backend.Models.Entities;

public class ClinicWorkingHours
{
    public Guid Id { get; set; }
    public Guid ClinicId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan OpenTime { get; set; }
    public TimeSpan CloseTime { get; set; }
    public bool IsClosed { get; set; } = false;

    // Navigation properties
    public Clinic Clinic { get; set; } = null!;
}
