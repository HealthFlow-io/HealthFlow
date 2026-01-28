/**
 * Medical Records Service
 * Handles all medical record related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { MedicalRecord, MedicalRecordCreateDto, MedicalRecordUpdateDto, MedicalRecordAttachment, AddAttachmentDto } from '@/types';

export const medicalRecordService = {
  /**
   * Get a medical record by ID
   */
  async getById(id: string): Promise<MedicalRecord> {
    return apiClient.get<MedicalRecord>(API_ENDPOINTS.MEDICAL_RECORDS.BY_ID(id));
  },

  /**
   * Get all medical records for a patient
   */
  async getByPatient(patientId: string): Promise<MedicalRecord[]> {
    return apiClient.get<MedicalRecord[]>(API_ENDPOINTS.MEDICAL_RECORDS.BY_PATIENT(patientId));
  },

  /**
   * Get all medical records created by a doctor
   */
  async getByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    return apiClient.get<MedicalRecord[]>(API_ENDPOINTS.MEDICAL_RECORDS.BY_DOCTOR(doctorId));
  },

  /**
   * Create a new medical record
   */
  async create(data: MedicalRecordCreateDto): Promise<MedicalRecord> {
    return apiClient.post<MedicalRecord>(API_ENDPOINTS.MEDICAL_RECORDS.BASE, data);
  },

  /**
   * Update a medical record
   */
  async update(id: string, data: MedicalRecordUpdateDto): Promise<MedicalRecord> {
    return apiClient.put<MedicalRecord>(API_ENDPOINTS.MEDICAL_RECORDS.BY_ID(id), data);
  },

  /**
   * Delete a medical record
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.MEDICAL_RECORDS.BY_ID(id));
  },

  /**
   * Add an attachment to a medical record
   */
  async addAttachment(recordId: string, data: AddAttachmentDto): Promise<MedicalRecordAttachment> {
    return apiClient.post<MedicalRecordAttachment>(
      `${API_ENDPOINTS.MEDICAL_RECORDS.BY_ID(recordId)}/attachments`,
      data
    );
  },

  /**
   * Remove an attachment from a medical record
   */
  async removeAttachment(attachmentId: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.MEDICAL_RECORDS.BASE}/attachments/${attachmentId}`);
  },
};

export default medicalRecordService;
