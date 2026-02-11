'use client';

/**
 * React Query hooks for Chat/Messaging
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services';
import { ChatMessage, ChatConversation } from '@/types';

// Query Keys
export const chatKeys = {
  all: ['chat'] as const,
  contacts: () => [...chatKeys.all, 'contacts'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (userId: string) => [...chatKeys.all, 'conversation', userId] as const,
  unreadCount: () => [...chatKeys.all, 'unread-count'] as const,
};

/**
 * Hook to fetch contacts (fast — just user list with unread counts)
 */
export function useChatContacts() {
  return useQuery({
    queryKey: chatKeys.contacts(),
    queryFn: () => chatService.getContacts(),
    refetchInterval: 30000,
  });
}

/**
 * Hook to fetch all conversations (legacy, same as contacts now)
 */
export function useChatConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatService.getConversations(),
    refetchInterval: 30000,
  });
}

/**
 * Hook to fetch messages in a conversation
 */
export function useChatMessages(otherUserId: string, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: chatKeys.conversation(otherUserId),
    queryFn: () => chatService.getConversation(otherUserId, { page, pageSize }),
    enabled: !!otherUserId,
  });
}

/**
 * Hook to send a message.
 * Only updates the cache optimistically — does NOT invalidate queries.
 * SignalR ReceiveMessage handles the receiver side.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      chatService.sendMessage(receiverId, content),
    onSuccess: (newMessage: ChatMessage) => {
      // Add the sent message to the conversation cache (single source of truth)
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.conversation(newMessage.receiverId),
        (old) => {
          if (!old) return [newMessage];
          // Avoid duplicates by checking message ID
          if (old.some((m) => m.id === newMessage.id)) return old;
          return [newMessage, ...old];
        }
      );
      // Update contacts list — just update last message preview, no refetch
      queryClient.setQueryData<ChatConversation[]>(
        chatKeys.contacts(),
        (old) => {
          if (!old) return old;
          return old.map((c) =>
            c.userId === newMessage.receiverId
              ? { ...c, lastMessage: newMessage.content, lastMessageAt: newMessage.createdAt }
              : c
          );
        }
      );
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (senderId: string) => chatService.markAsRead(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    },
  });
}

/**
 * Hook to get unread message count
 */
export function useChatUnreadCount() {
  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: () => chatService.getUnreadCount(),
    refetchInterval: 30000,
  });
}
