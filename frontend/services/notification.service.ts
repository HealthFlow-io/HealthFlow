/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, buildUrl } from '@/lib/api/endpoints';
import { Notification } from '@/types';

interface NotificationParams {
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export const notificationService = {
  /**
   * Get all notifications (API returns a plain array)
   */
  async getAll(params?: NotificationParams): Promise<Notification[]> {
    const url = buildUrl(API_ENDPOINTS.NOTIFICATIONS.BASE, params as Record<string, string | number | boolean>);
    return apiClient.get<Notification[]>(url);
  },

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<Notification> {
    return apiClient.get<Notification>(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return apiClient.post<Notification>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },

  /**
   * Delete notification
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  },
};

export default notificationService;
