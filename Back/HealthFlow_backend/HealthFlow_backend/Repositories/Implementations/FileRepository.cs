using Microsoft.EntityFrameworkCore;
using HealthFlow_backend.Data;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;

namespace HealthFlow_backend.Repositories.Implementations;

public class FileRepository : Repository<FileUpload>, IFileRepository
{
    public FileRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<FileUpload?> GetByFileNameAsync(string fileName)
    {
        return await _dbSet.FirstOrDefaultAsync(f => f.FileName == fileName);
    }
}
