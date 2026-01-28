using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileService _fileService;

    public FilesController(IFileService fileService)
    {
        _fileService = fileService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<FileUploadResponse>> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        using var stream = file.OpenReadStream();
        var result = await _fileService.UploadAsync(stream, file.FileName, file.ContentType, userId.Value);
        return Ok(result);
    }

    [HttpGet("{fileId}")]
    [AllowAnonymous]
    public async Task<IActionResult> Download(Guid fileId)
    {
        var result = await _fileService.DownloadAsync(fileId);
        if (result == null) return NotFound();

        var (stream, contentType, fileName) = result.Value;
        return File(stream, contentType, fileName);
    }

    [HttpDelete("{fileId}")]
    public async Task<IActionResult> Delete(Guid fileId)
    {
        var result = await _fileService.DeleteAsync(fileId);
        if (!result) return NotFound();
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }
        return null;
    }
}
