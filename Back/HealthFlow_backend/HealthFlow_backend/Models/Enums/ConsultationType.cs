using System.Text.Json.Serialization;

namespace HealthFlow_backend.Models.Enums;

public enum ConsultationType
{
    [JsonPropertyName("online")]
    Online,
    
    [JsonPropertyName("physical")]
    Physical,
    
    [JsonPropertyName("home-visit")]
    HomeVisit
}
