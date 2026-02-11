/**
 * Chat Service
 * Handles all chat/messaging-related API calls
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, buildUrl } from '@/lib/api/endpoints';
import { ChatMessage, ChatConversation } from '@/types';

export const chatService = {
  /**
   * Get contacts list (fast — just users with unread counts)
   */
  async getContacts(): Promise<ChatConversation[]> {
    return apiClient.get<ChatConversation[]>(API_ENDPOINTS.CHAT.CONTACTS);
  },

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<ChatConversation[]> {
    return apiClient.get<ChatConversation[]>(API_ENDPOINTS.CHAT.CONVERSATIONS);
  },

  /**
   * Get messages in a conversation with another user
   */
  async getConversation(
    otherUserId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<ChatMessage[]> {
    const url = buildUrl(
      API_ENDPOINTS.CHAT.CONVERSATION(otherUserId),
      params as Record<string, string | number | boolean>
    );
    return apiClient.get<ChatMessage[]>(url);
  },

  /**
   * Send a message via REST API
   */
  async sendMessage(receiverId: string, content: string): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>(API_ENDPOINTS.CHAT.SEND, {
      receiverId,
      content,
    });
  },

  /**
   * Mark messages from a specific user as read
   */
  async markAsRead(senderId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CHAT.MARK_READ(senderId));
  },

  /**
   * Get total unread message count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(API_ENDPOINTS.CHAT.UNREAD_COUNT);
  },
};

export default chatService;
