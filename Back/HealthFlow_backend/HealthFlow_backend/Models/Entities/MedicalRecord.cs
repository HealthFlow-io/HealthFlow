namespace HealthFlow_backend.Models.Entities;

public class MedicalRecord
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string? PrescriptionUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
}
