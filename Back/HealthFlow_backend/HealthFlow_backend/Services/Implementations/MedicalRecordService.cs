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
            AppointmentId = dto.AppointmentId,
            Diagnosis = dto.Diagnosis,
            Symptoms = dto.Symptoms,
            Treatment = dto.Treatment,
            Prescription = dto.Prescription,
            Notes = dto.Notes,
            FollowUpDate = dto.FollowUpDate,
            FollowUpNotes = dto.FollowUpNotes,
            PrescriptionUrl = dto.PrescriptionUrl,
            CreatedAt = DateTime.UtcNow
        };

        // Set vital signs if provided
        if (dto.VitalSigns != null)
        {
            record.BloodPressureSystolic = dto.VitalSigns.BloodPressureSystolic;
            record.BloodPressureDiastolic = dto.VitalSigns.BloodPressureDiastolic;
            record.HeartRate = dto.VitalSigns.HeartRate;
            record.Temperature = dto.VitalSigns.Temperature;
            record.Weight = dto.VitalSigns.Weight;
            record.Height = dto.VitalSigns.Height;
        }

        await _unitOfWork.MedicalRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        return (await GetByIdAsync(record.Id))!;
    }

    public async Task<MedicalRecordDto?> UpdateAsync(Guid id, MedicalRecordUpdateDto dto)
    {
        var record = await _unitOfWork.MedicalRecords.GetByIdAsync(id);
        if (record == null) return null;

        if (dto.Diagnosis != null) record.Diagnosis = dto.Diagnosis;
        if (dto.Symptoms != null) record.Symptoms = dto.Symptoms;
        if (dto.Treatment != null) record.Treatment = dto.Treatment;
        if (dto.Prescription != null) record.Prescription = dto.Prescription;
        if (dto.Notes != null) record.Notes = dto.Notes;
        if (dto.FollowUpDate.HasValue) record.FollowUpDate = dto.FollowUpDate;
        if (dto.FollowUpNotes != null) record.FollowUpNotes = dto.FollowUpNotes;
        if (dto.PrescriptionUrl != null) record.PrescriptionUrl = dto.PrescriptionUrl;
        
        if (dto.VitalSigns != null)
        {
            record.BloodPressureSystolic = dto.VitalSigns.BloodPressureSystolic;
            record.BloodPressureDiastolic = dto.VitalSigns.BloodPressureDiastolic;
            record.HeartRate = dto.VitalSigns.HeartRate;
            record.Temperature = dto.VitalSigns.Temperature;
            record.Weight = dto.VitalSigns.Weight;
            record.Height = dto.VitalSigns.Height;
        }
        
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

    public async Task<AttachmentDto> AddAttachmentAsync(Guid recordId, AddAttachmentDto dto)
    {
        var record = await _unitOfWork.MedicalRecords.GetByIdAsync(recordId);
        if (record == null)
            throw new InvalidOperationException("Medical record not found");

        var file = await _unitOfWork.Files.GetByIdAsync(dto.FileUploadId);
        if (file == null)
            throw new InvalidOperationException("File not found");

        var attachment = new MedicalRecordAttachment
        {
            Id = Guid.NewGuid(),
            MedicalRecordId = recordId,
            FileUploadId = dto.FileUploadId,
            Description = dto.Description,
            AttachmentType = dto.AttachmentType,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.MedicalRecordAttachments.AddAsync(attachment);
        await _unitOfWork.SaveChangesAsync();

        return new AttachmentDto(
            attachment.Id,
            file.Id,
            file.OriginalFileName,
            $"/api/files/{file.Id}",
            attachment.Description,
            attachment.AttachmentType,
            attachment.CreatedAt
        );
    }

    public async Task<bool> RemoveAttachmentAsync(Guid attachmentId)
    {
        var attachment = await _unitOfWork.MedicalRecordAttachments.GetByIdAsync(attachmentId);
        if (attachment == null) return false;

        _unitOfWork.MedicalRecordAttachments.Remove(attachment);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private static MedicalRecordDto MapToDto(MedicalRecord record)
    {
        var vitalSigns = (record.BloodPressureSystolic.HasValue || record.HeartRate.HasValue || 
                         record.Temperature.HasValue || record.Weight.HasValue)
            ? new VitalSignsDto(
                record.BloodPressureSystolic,
                record.BloodPressureDiastolic,
                record.HeartRate,
                record.Temperature,
                record.Weight,
                record.Height
            ) : null;

        var attachments = record.Attachments?.Select(a => new AttachmentDto(
            a.Id,
            a.FileUploadId,
            a.FileUpload?.OriginalFileName ?? "",
            $"/api/files/{a.FileUploadId}",
            a.Description,
            a.AttachmentType,
            a.CreatedAt
        )).ToList() ?? new List<AttachmentDto>();

        return new MedicalRecordDto(
            record.Id,
            record.PatientId,
            record.Patient != null ? new PatientDto(
                record.Patient.Id,
                record.Patient.FirstName,
                record.Patient.LastName,
                record.Patient.Email,
                record.Patient.Phone
            ) : null,
            record.DoctorId,
            record.Doctor != null ? new DoctorDto(
                record.Doctor.Id,
                record.Doctor.FullName,
                record.Doctor.Specialization?.Name ?? ""
            ) : null,
            record.AppointmentId,
            record.Diagnosis,
            record.Symptoms,
            record.Treatment,
            record.Prescription,
            record.Notes,
            vitalSigns,
            record.FollowUpDate,
            record.FollowUpNotes,
            attachments,
            record.PrescriptionUrl,
            record.CreatedAt,
            record.UpdatedAt
        );
    }
}
