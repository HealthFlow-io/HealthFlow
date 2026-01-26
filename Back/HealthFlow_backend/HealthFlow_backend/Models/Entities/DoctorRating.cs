namespace HealthFlow_backend.Models.Entities;

public class DoctorRating
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Doctor Doctor { get; set; } = null!;
    public User Patient { get; set; } = null!;
}
