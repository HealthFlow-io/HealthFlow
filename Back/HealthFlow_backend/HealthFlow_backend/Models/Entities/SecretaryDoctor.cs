namespace HealthFlow_backend.Models.Entities;

public class SecretaryDoctor
{
    public Guid Id { get; set; }
    public Guid SecretaryProfileId { get; set; }
    public Guid DoctorId { get; set; }

    // Navigation properties
    public SecretaryProfile SecretaryProfile { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
}
