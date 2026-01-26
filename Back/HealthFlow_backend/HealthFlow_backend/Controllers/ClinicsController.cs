using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.Clinics;
using HealthFlow_backend.DTOs.Common;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClinicsController : ControllerBase
{
    private readonly IClinicService _clinicService;

    public ClinicsController(IClinicService clinicService)
    {
        _clinicService = clinicService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ClinicDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _clinicService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClinicDto>> GetById(Guid id)
    {
        var clinic = await _clinicService.GetByIdAsync(id);
        if (clinic == null) return NotFound();
        return Ok(clinic);
    }

    [HttpGet("search")]
    public async Task<ActionResult<PaginatedResponse<ClinicDto>>> Search([FromQuery] ClinicSearchParams searchParams)
    {
        var result = await _clinicService.SearchAsync(searchParams);
        return Ok(result);
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<PaginatedResponse<ClinicDto>>> GetNearby([FromQuery] NearbySearchParams searchParams)
    {
        var result = await _clinicService.GetNearbyAsync(searchParams);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ClinicManager")]
    public async Task<ActionResult<ClinicDto>> Create([FromBody] ClinicCreateDto dto)
    {
        var clinic = await _clinicService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = clinic.Id }, clinic);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,ClinicManager")]
    public async Task<ActionResult<ClinicDto>> Update(Guid id, [FromBody] ClinicUpdateDto dto)
    {
        var clinic = await _clinicService.UpdateAsync(id, dto);
        if (clinic == null) return NotFound();
        return Ok(clinic);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _clinicService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
