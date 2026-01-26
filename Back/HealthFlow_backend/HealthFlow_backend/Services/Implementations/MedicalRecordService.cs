using HealthFlow_backend.DTOs.MedicalRecords;
using HealthFlow_backend.Models.Entities;
using HealthFlow_backend.Repositories.Interfaces;
using HealthFlow_backend.Services.Interfaces;

namespace HealthFlow_backend.Services.Implementations;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly IUnitOfWork _unitOfWork;

    public MedicalRecordService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MedicalRecordDto?> GetByIdAsync(Guid id)
    {
        var record = await _unitOfWork.MedicalRecords.GetWithDetailsAsync(id);
        return record != null ? MapToDto(record) : null;
    }

    public async Task<IEnumerable<MedicalRecordDto>> GetByPatientAsync(Guid patientId)
    {
        var records = await _unitOfWork.MedicalRecords.GetByPatientAsync(patientId);
        return records.Select(MapToDto);
    }

    public async Task<IEnumerable<MedicalRecordDto>> GetByDoctorAsync(Guid doctorId)
    {
        var records = await _unitOfWork.MedicalRecords.GetByDoctorAsync(doctorId);
        return records.Select(MapToDto);
    }

    public async Task<MedicalRecordDto> CreateAsync(Guid doctorId, MedicalRecordCreateDto dto)
    {
        // Get doctor by user ID
        var doctor = await _unitOfWork.Doctors.GetByUserIdAsync(doctorId);
        if (doctor == null)
            throw new InvalidOperationException("Doctor profile not found");

        var record = new MedicalRecord
        {
            Id = Guid.NewGuid(),
            PatientId = dto.PatientId,
            DoctorId = doctor.Id,
            Notes = dto.Notes,
            PrescriptionUrl = dto.PrescriptionUrl,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.MedicalRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        return (await GetByIdAsync(record.Id))!;
    }

    public async Task<MedicalRecordDto?> UpdateAsync(Guid id, MedicalRecordUpdateDto dto)
    {
        var record = await _unitOfWork.MedicalRecords.GetByIdAsync(id);
        if (record == null) return null;

        if (dto.Notes != null) record.Notes = dto.Notes;
        if (dto.PrescriptionUrl != null) record.PrescriptionUrl = dto.PrescriptionUrl;
        record.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.MedicalRecords.Update(record);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var record = await _unitOfWork.MedicalRecords.GetByIdAsync(id);
        if (record == null) return false;

        _unitOfWork.MedicalRecords.Remove(record);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static MedicalRecordDto MapToDto(MedicalRecord record)
    {
        return new MedicalRecordDto(
            record.Id,
            record.PatientId,
            record.Patient != null ? new PatientDto(
                record.Patient.Id,
                record.Patient.FirstName,
                record.Patient.LastName,
                record.Patient.Email
            ) : null,
            record.DoctorId,
            record.Doctor != null ? new DoctorDto(
                record.Doctor.Id,
                record.Doctor.FullName,
                record.Doctor.Specialization?.Name ?? ""
            ) : null,
            record.Notes,
            record.PrescriptionUrl,
            record.CreatedAt,
            record.UpdatedAt
        );
    }
}
