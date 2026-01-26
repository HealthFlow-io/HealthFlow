using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthFlow_backend.DTOs.MedicalRecords;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _medicalRecordService;

    public MedicalRecordsController(IMedicalRecordService medicalRecordService)
    {
        _medicalRecordService = medicalRecordService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MedicalRecordDto>> GetById(Guid id)
    {
        var record = await _medicalRecordService.GetByIdAsync(id);
        if (record == null) return NotFound();
        return Ok(record);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<IEnumerable<MedicalRecordDto>>> GetByPatient(Guid patientId)
    {
        var records = await _medicalRecordService.GetByPatientAsync(patientId);
        return Ok(records);
    }

    [HttpGet("doctor/{doctorId}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<ActionResult<IEnumerable<MedicalRecordDto>>> GetByDoctor(Guid doctorId)
    {
        var records = await _medicalRecordService.GetByDoctorAsync(doctorId);
        return Ok(records);
    }

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<MedicalRecordDto>> Create([FromBody] MedicalRecordCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var record = await _medicalRecordService.CreateAsync(userId.Value, dto);
            return CreatedAtAction(nameof(GetById), new { id = record.Id }, record);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<MedicalRecordDto>> Update(Guid id, [FromBody] MedicalRecordUpdateDto dto)
    {
        var record = await _medicalRecordService.UpdateAsync(id, dto);
        if (record == null) return NotFound();
        return Ok(record);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _medicalRecordService.DeleteAsync(id);
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
