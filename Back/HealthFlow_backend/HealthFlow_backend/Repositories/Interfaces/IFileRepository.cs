using HealthFlow_backend.Models.Entities;

namespace HealthFlow_backend.Repositories.Interfaces;

public interface IFileRepository : IRepository<FileUpload>
{
    Task<FileUpload?> GetByFileNameAsync(string fileName);
}
