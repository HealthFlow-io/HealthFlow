using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Specializations;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpecializationsController : ControllerBase
{
    private readonly ISpecializationService _specializationService;

    public SpecializationsController(ISpecializationService specializationService)
    {
        _specializationService = specializationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SpecializationDto>>> GetAll()
    {
        var specializations = await _specializationService.GetAllAsync();
        return Ok(specializations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SpecializationDto>> GetById(Guid id)
    {
        var specialization = await _specializationService.GetByIdAsync(id);
        if (specialization == null) return NotFound();
        return Ok(specialization);
    }

    [HttpGet("category/{category}")]
    public async Task<ActionResult<IEnumerable<SpecializationDto>>> GetByCategory(string category)
    {
        var specializations = await _specializationService.GetByCategoryAsync(category);
        return Ok(specializations);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SpecializationDto>> Create([FromBody] SpecializationCreateDto dto)
    {
        var specialization = await _specializationService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = specialization.Id }, specialization);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SpecializationDto>> Update(Guid id, [FromBody] SpecializationUpdateDto dto)
    {
        var specialization = await _specializationService.UpdateAsync(id, dto);
        if (specialization == null) return NotFound();
        return Ok(specialization);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _specializationService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
