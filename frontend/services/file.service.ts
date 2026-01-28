/**
 * File Service
 * Handles all file upload related API calls
 */

import { apiClient, getAccessToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { FileUploadResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5155/api';

export const fileService = {
  /**
   * Upload a file
   */
  async upload(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  },

  /**
   * Get file download URL
   */
  getFileUrl(fileId: string): string {
    return `${API_BASE_URL}/files/${fileId}`;
  },

  /**
   * Delete a file
   */
  async delete(fileId: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.FILES.DELETE(fileId));
  },
};

export default fileService;
