using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Services.Implementations;

public class FileService : IFileService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly string _uploadPath;

    public FileService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _uploadPath = configuration["FileStorage:UploadPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        
        // Ensure upload directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<FileUploadResponse> UploadAsync(Stream fileStream, string fileName, string contentType, Guid uploadedBy)
    {
        var fileId = Guid.NewGuid();
        var extension = Path.GetExtension(fileName);
        var savedFileName = $"{fileId}{extension}";
        var filePath = Path.Combine(_uploadPath, savedFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(stream);
        }

        var fileUpload = new FileUpload
        {
            Id = fileId,
            FileName = savedFileName,
            OriginalFileName = fileName,
            ContentType = contentType,
            Size = fileStream.Length,
            Path = filePath,
            UploadedBy = uploadedBy,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Files.AddAsync(fileUpload);
        await _unitOfWork.SaveChangesAsync();

        return new FileUploadResponse(
            fileId,
            fileName,
            $"/api/files/{fileId}"
        );
    }

    public async Task<(Stream FileStream, string ContentType, string FileName)?> DownloadAsync(Guid fileId)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId);
        if (file == null || !File.Exists(file.Path))
        {
            return null;
        }

        var stream = new FileStream(file.Path, FileMode.Open, FileAccess.Read);
        return (stream, file.ContentType, file.OriginalFileName);
    }

    public async Task<bool> DeleteAsync(Guid fileId)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId);
        if (file == null) return false;

        // Delete physical file
        if (File.Exists(file.Path))
        {
            File.Delete(file.Path);
        }

        _unitOfWork.Files.Remove(file);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
}
