using HealthFlow_backend.Models.Enums;

namespace HealthFlow_backend.Models.Entities;

public class Doctor
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public Guid SpecializationId { get; set; }
    public string SubSpecializations { get; set; } = "[]"; // JSON array
    public string? Bio { get; set; }
    public int ExperienceYears { get; set; }
    public string Languages { get; set; } = "[]"; // JSON array
    public string ConsultationTypes { get; set; } = "[]"; // JSON array of ConsultationType
    public int ConsultationDuration { get; set; } = 30; // in minutes
    public decimal ConsultationPrice { get; set; }
    public Guid? ClinicId { get; set; }
    public double Rating { get; set; } = 0;
    public int RatingCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Specialization Specialization { get; set; } = null!;
    public Clinic? Clinic { get; set; }
    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
    public ICollection<SecretaryDoctor> SecretaryDoctors { get; set; } = new List<SecretaryDoctor>();
    public ICollection<DoctorRating> Ratings { get; set; } = new List<DoctorRating>();
}
