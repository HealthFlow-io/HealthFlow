namespace HealthFlow_backend.Models.Entities;

public class MedicalRecord
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? AppointmentId { get; set; }  // Link to the appointment
    
    // Diagnosis & Treatment
    public string? Diagnosis { get; set; }
    public string? Symptoms { get; set; }
    public string? Treatment { get; set; }
    public string? Prescription { get; set; }
    public string Notes { get; set; } = string.Empty;
    
    // Vital Signs (optional)
    public decimal? BloodPressureSystolic { get; set; }
    public decimal? BloodPressureDiastolic { get; set; }
    public decimal? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    
    // Follow-up
    public DateTime? FollowUpDate { get; set; }
    public string? FollowUpNotes { get; set; }
    
    public string? PrescriptionUrl { get; set; }  // Legacy - keeping for backwards compatibility
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Appointment? Appointment { get; set; }
    public ICollection<MedicalRecordAttachment> Attachments { get; set; } = new List<MedicalRecordAttachment>();
}

public class MedicalRecordAttachment
{
    public Guid Id { get; set; }
    public Guid MedicalRecordId { get; set; }
    public Guid FileUploadId { get; set; }
    public string? Description { get; set; }
    public string AttachmentType { get; set; } = "Other"; // Scan, LabResult, Prescription, Xray, Other
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public MedicalRecord MedicalRecord { get; set; } = null!;
    public FileUpload FileUpload { get; set; } = null!;
}
