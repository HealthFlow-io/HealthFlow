/**
 * Specialization Service
 * Handles all specialization-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Specialization, SpecializationCreateDto } from '@/types';

export const specializationService = {
  /**
   * Get all specializations
   */
  async getAll(): Promise<Specialization[]> {
    return apiClient.get<Specialization[]>(API_ENDPOINTS.SPECIALIZATIONS.BASE);
  },

  /**
   * Get specialization by ID
   */
  async getById(id: string): Promise<Specialization> {
    return apiClient.get<Specialization>(API_ENDPOINTS.SPECIALIZATIONS.BY_ID(id));
  },

  /**
   * Get specializations by category
   */
  async getByCategory(category: string): Promise<Specialization[]> {
    return apiClient.get<Specialization[]>(API_ENDPOINTS.SPECIALIZATIONS.BY_CATEGORY(category));
  },

  /**
   * Create specialization (admin only)
   */
  async create(data: SpecializationCreateDto): Promise<Specialization> {
    return apiClient.post<Specialization>(API_ENDPOINTS.SPECIALIZATIONS.BASE, data);
  },

  /**
   * Update specialization (admin only)
   */
  async update(id: string, data: Partial<SpecializationCreateDto>): Promise<Specialization> {
    return apiClient.put<Specialization>(API_ENDPOINTS.SPECIALIZATIONS.BY_ID(id), data);
  },

  /**
   * Delete specialization (admin only)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SPECIALIZATIONS.BY_ID(id));
  },
};

export default specializationService;
