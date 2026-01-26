/**
 * Appointment Service
 * Handles all appointment-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, buildUrl } from '@/lib/api/endpoints';
import {
  Appointment,
  AppointmentCreateDto,
  AppointmentRescheduleDto,
  AppointmentFilterParams,
  TimeSlot,
  PaginatedResponse,
} from '@/types';

export const appointmentService = {
  /**
   * Get all appointments (with filters)
   */
  async getAll(params?: AppointmentFilterParams): Promise<PaginatedResponse<Appointment>> {
    const url = buildUrl(API_ENDPOINTS.APPOINTMENTS.BASE, params as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Appointment>>(url);
  },

  /**
   * Get appointment by ID
   */
  async getById(id: string): Promise<Appointment> {
    return apiClient.get<Appointment>(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  },

  /**
   * Get appointments by patient
   */
  async getByPatient(
    patientId: string,
    params?: AppointmentFilterParams
  ): Promise<PaginatedResponse<Appointment>> {
    const url = buildUrl(
      API_ENDPOINTS.APPOINTMENTS.BY_PATIENT(patientId),
      params as Record<string, string | number>
    );
    return apiClient.get<PaginatedResponse<Appointment>>(url);
  },

  /**
   * Get appointments by doctor
   */
  async getByDoctor(
    doctorId: string,
    params?: AppointmentFilterParams
  ): Promise<PaginatedResponse<Appointment>> {
    const url = buildUrl(
      API_ENDPOINTS.APPOINTMENTS.BY_DOCTOR(doctorId),
      params as Record<string, string | number>
    );
    return apiClient.get<PaginatedResponse<Appointment>>(url);
  },

  /**
   * Get appointments by clinic
   */
  async getByClinic(
    clinicId: string,
    params?: AppointmentFilterParams
  ): Promise<PaginatedResponse<Appointment>> {
    const url = buildUrl(
      API_ENDPOINTS.APPOINTMENTS.BY_CLINIC(clinicId),
      params as Record<string, string | number>
    );
    return apiClient.get<PaginatedResponse<Appointment>>(url);
  },

  /**
   * Create new appointment
   */
  async create(data: AppointmentCreateDto): Promise<Appointment> {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.BASE, data);
  },

  /**
   * Approve appointment
   */
  async approve(id: string): Promise<Appointment> {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.APPROVE(id));
  },

  /**
   * Decline appointment
   */
  async decline(id: string, reason?: string): Promise<Appointment> {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.DECLINE(id), { reason });
  },

  /**
   * Cancel appointment
   */
  async cancel(id: string, reason?: string): Promise<Appointment> {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), { reason });
  },

  /**
   * Reschedule appointment
   */
  async reschedule(id: string, data: AppointmentRescheduleDto): Promise<Appointment> {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), data);
  },

  /**
   * Mark appointment as complete
   */
  async complete(id: string): Promise<Appointment> {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.COMPLETE(id));
  },

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const url = buildUrl(API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS(doctorId), { date });
    return apiClient.get<TimeSlot[]>(url);
  },
};

export default appointmentService;
