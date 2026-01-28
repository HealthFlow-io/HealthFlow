namespace HealthFlow_backend.Models.Entities;

public class SecretaryProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<SecretaryDoctor> SecretaryDoctors { get; set; } = new List<SecretaryDoctor>();
}
