using HealthFlow_backend.DTOs.Common;

namespace HealthFlow_backend.Services.Interfaces;

public interface IFileService
{
    Task<FileUploadResponse> UploadAsync(Stream fileStream, string fileName, string contentType, Guid uploadedBy);
    Task<(Stream FileStream, string ContentType, string FileName)?> DownloadAsync(Guid fileId);
    Task<bool> DeleteAsync(Guid fileId);
}
