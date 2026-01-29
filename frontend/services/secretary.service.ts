/**
 * Secretary Service
 * Handles all secretary-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface SecretaryPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  appointmentCount: number;
  lastAppointment?: string;
  lastDoctor?: string;
}

export interface SecretaryProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  doctors: Array<{
    id: string;
    fullName: string;
    specializationId?: string;
    specialization?: {
      id: string;
      name: string;
    };
  }>;
}

export interface AppointmentHistory {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason?: string;
  doctor: {
    id: string;
    fullName: string;
    specialization?: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const secretaryService = {
  /**
   * Get current secretary profile
   */
  async getMyProfile(): Promise<SecretaryProfile> {
    return apiClient.get<SecretaryProfile>(API_ENDPOINTS.SECRETARY.ME);
  },

  /**
   * Get patients for secretary's assigned doctors
   */
  async getMyPatients(): Promise<SecretaryPatient[]> {
    return apiClient.get<SecretaryPatient[]>(API_ENDPOINTS.SECRETARY.MY_PATIENTS);
  },

  /**
   * Get secretary by ID
   */
  async getById(id: string): Promise<SecretaryProfile> {
    return apiClient.get<SecretaryProfile>(API_ENDPOINTS.SECRETARY.BY_ID(id));
  },

  /**
   * Get assigned doctors for a secretary
   */
  async getAssignedDoctors(secretaryId: string): Promise<SecretaryProfile['doctors']> {
    return apiClient.get(API_ENDPOINTS.SECRETARY.ASSIGNED_DOCTORS(secretaryId));
  },

  /**
   * Get appointment history for a specific patient
   */
  async getPatientAppointments(patientId: string): Promise<AppointmentHistory[]> {
    return apiClient.get<AppointmentHistory[]>(API_ENDPOINTS.SECRETARY.PATIENT_APPOINTMENTS(patientId));
  },

  /**
   * Get appointment history for a specific doctor
   */
  async getDoctorAppointments(doctorId: string): Promise<AppointmentHistory[]> {
    return apiClient.get<AppointmentHistory[]>(API_ENDPOINTS.SECRETARY.DOCTOR_APPOINTMENTS(doctorId));
  },
};

export default secretaryService;
