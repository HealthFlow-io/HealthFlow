namespace HealthFlow_backend.Models;

public class Clinic
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public int WorkingHours { get; set; }
    public string ContactInfo { get; set;  }
}