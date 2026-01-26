namespace HealthFlow_backend.Models.Entities;

public class Clinic
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
    public ICollection<ClinicWorkingHours> WorkingHours { get; set; } = new List<ClinicWorkingHours>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
