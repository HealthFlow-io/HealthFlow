namespace HealthFlow_backend.Models;

public class DoctorProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; }

    public Specialization Specialization { get; set; }
    public int ExperienceYears { get; set; }
    public decimal ConsultationPrice { get; set; }
    public bool OnlineConsultationEnabled { get; set; }

}