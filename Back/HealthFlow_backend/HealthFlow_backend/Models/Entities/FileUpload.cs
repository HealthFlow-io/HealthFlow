namespace HealthFlow_backend.Models.Entities;

public class FileUpload
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Path { get; set; } = string.Empty;
    public Guid UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Uploader { get; set; } = null!;
}
