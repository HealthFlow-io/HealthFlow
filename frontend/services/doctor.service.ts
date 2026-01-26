/**
 * Doctor Service
 * Handles all doctor-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, buildUrl } from '@/lib/api/endpoints';
import {
  Doctor,
  DoctorCreateDto,
  DoctorUpdateDto,
  DoctorSearchParams,
  DoctorAvailability,
  DoctorAvailabilityCreateDto,
  TimeSlot,
  PaginatedResponse,
} from '@/types';

export const doctorService = {
  /**
   * Get all doctors
   */
  async getAll(params?: DoctorSearchParams): Promise<PaginatedResponse<Doctor>> {
    const url = buildUrl(API_ENDPOINTS.DOCTORS.BASE, params as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Doctor>>(url);
  },

  /**
   * Search doctors
   */
  async search(params: DoctorSearchParams): Promise<PaginatedResponse<Doctor>> {
    const url = buildUrl(API_ENDPOINTS.DOCTORS.SEARCH, params as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Doctor>>(url);
  },

  /**
   * Get doctor by ID
   */
  async getById(id: string): Promise<Doctor> {
    return apiClient.get<Doctor>(API_ENDPOINTS.DOCTORS.BY_ID(id));
  },

  /**
   * Get doctors by specialization
   */
  async getBySpecialization(specializationId: string): Promise<Doctor[]> {
    return apiClient.get<Doctor[]>(API_ENDPOINTS.DOCTORS.BY_SPECIALIZATION(specializationId));
  },

  /**
   * Get doctors by clinic
   */
  async getByClinic(clinicId: string): Promise<Doctor[]> {
    return apiClient.get<Doctor[]>(API_ENDPOINTS.DOCTORS.BY_CLINIC(clinicId));
  },

  /**
   * Create doctor profile
   */
  async create(data: DoctorCreateDto): Promise<Doctor> {
    return apiClient.post<Doctor>(API_ENDPOINTS.DOCTORS.BASE, data);
  },

  /**
   * Update doctor profile
   */
  async update(id: string, data: DoctorUpdateDto): Promise<Doctor> {
    return apiClient.put<Doctor>(API_ENDPOINTS.DOCTORS.BY_ID(id), data);
  },

  /**
   * Delete doctor
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DOCTORS.BY_ID(id));
  },

  /**
   * Get doctor availability
   */
  async getAvailability(doctorId: string): Promise<DoctorAvailability[]> {
    return apiClient.get<DoctorAvailability[]>(API_ENDPOINTS.DOCTORS.AVAILABILITY(doctorId));
  },

  /**
   * Update doctor availability
   */
  async updateAvailability(
    doctorId: string,
    availability: DoctorAvailabilityCreateDto[]
  ): Promise<DoctorAvailability[]> {
    return apiClient.put<DoctorAvailability[]>(
      API_ENDPOINTS.DOCTORS.UPDATE_AVAILABILITY(doctorId),
      availability
    );
  },

  /**
   * Get doctor schedule
   */
  async getSchedule(doctorId: string, date?: string): Promise<TimeSlot[]> {
    const url = buildUrl(API_ENDPOINTS.DOCTORS.SCHEDULE(doctorId), { date });
    return apiClient.get<TimeSlot[]>(url);
  },

  /**
   * Get doctor ratings
   */
  async getRatings(doctorId: string): Promise<{ average: number; count: number }> {
    return apiClient.get<{ average: number; count: number }>(
      API_ENDPOINTS.DOCTORS.RATINGS(doctorId)
    );
  },
};

export default doctorService;
