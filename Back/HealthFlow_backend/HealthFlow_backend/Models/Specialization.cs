namespace HealthFlow_backend.Models;

public class Specialization
{
    public int Id { get; set;  }
    public string Name { get; set;  }
    public Category_Specialization category { get; set;  }
}