using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.Models.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Phone { get; set; }
    public bool EmailVerified { get; set; } = false;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Doctor? DoctorProfile { get; set; }
    public SecretaryProfile? SecretaryProfile { get; set; }
    public ICollection<Appointment> PatientAppointments { get; set; } = new List<Appointment>();
    public ICollection<MedicalRecord> PatientMedicalRecords { get; set; } = new List<MedicalRecord>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
