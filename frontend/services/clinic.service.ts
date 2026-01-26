/**
 * Clinic Service
 * Handles all clinic-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, buildUrl } from '@/lib/api/endpoints';
import { Clinic, ClinicCreateDto, PaginatedResponse } from '@/types';

interface ClinicSearchParams {
  name?: string;
  address?: string;
  page?: number;
  pageSize?: number;
}

interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export const clinicService = {
  /**
   * Get all clinics
   */
  async getAll(params?: ClinicSearchParams): Promise<PaginatedResponse<Clinic>> {
    const url = buildUrl(API_ENDPOINTS.CLINICS.BASE, params as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Clinic>>(url);
  },

  /**
   * Get clinic by ID
   */
  async getById(id: string): Promise<Clinic> {
    return apiClient.get<Clinic>(API_ENDPOINTS.CLINICS.BY_ID(id));
  },

  /**
   * Search clinics
   */
  async search(params: ClinicSearchParams): Promise<PaginatedResponse<Clinic>> {
    const url = buildUrl(API_ENDPOINTS.CLINICS.SEARCH, params as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Clinic>>(url);
  },

  /**
   * Get nearby clinics
   */
  async getNearby(params: NearbySearchParams): Promise<Clinic[]> {
    const url = buildUrl(API_ENDPOINTS.CLINICS.NEARBY, {
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm,
    });
    return apiClient.get<Clinic[]>(url);
  },

  /**
   * Create clinic (admin only)
   */
  async create(data: ClinicCreateDto): Promise<Clinic> {
    return apiClient.post<Clinic>(API_ENDPOINTS.CLINICS.BASE, data);
  },

  /**
   * Update clinic
   */
  async update(id: string, data: Partial<ClinicCreateDto>): Promise<Clinic> {
    return apiClient.put<Clinic>(API_ENDPOINTS.CLINICS.BY_ID(id), data);
  },

  /**
   * Delete clinic (admin only)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CLINICS.BY_ID(id));
  },
};

export default clinicService;
