namespace HealthFlow_backend.Models;

public class SecretaryProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; }
    public ICollection<DoctorProfile> ManagedDoctors { get; set; }
}