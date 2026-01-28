using HealthFlow_backend.DTOs.MedicalRecords;

namespace HealthFlow_backend.Services.Interfaces;

public interface IMedicalRecordService
{
    Task<MedicalRecordDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<MedicalRecordDto>> GetByPatientAsync(Guid patientId);
    Task<IEnumerable<MedicalRecordDto>> GetByDoctorAsync(Guid doctorId);
    Task<MedicalRecordDto> CreateAsync(Guid doctorId, MedicalRecordCreateDto dto);
    Task<MedicalRecordDto?> UpdateAsync(Guid id, MedicalRecordUpdateDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<AttachmentDto> AddAttachmentAsync(Guid recordId, AddAttachmentDto dto);
    Task<bool> RemoveAttachmentAsync(Guid attachmentId);
}
