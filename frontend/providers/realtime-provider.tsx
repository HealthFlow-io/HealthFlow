'use client';

/**
 * Realtime Provider
 * Connects SignalR hubs when the user is authenticated so real-time
 * notifications and chat badge updates work on every page.
 */

import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { connectToNotifications, disconnectFromNotifications } from '@/lib/signalr/connection';
import { notificationKeys } from '@/hooks/queries/use-notifications';
import { chatKeys } from '@/hooks/queries/use-chat';
import { Notification } from '@/types';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    connectToNotifications({
      onReceiveNotification: (notification: Notification) => {
        // Add to the notifications list cache
        queryClient.setQueryData<Notification[]>(
          notificationKeys.list({ page: 1, pageSize: 20 }),
          (old) => {
            if (!old) return [notification];
            // Deduplicate
            if (old.some((n) => n.id === notification.id)) return old;
            return [notification, ...old];
          }
        );
        // Bump unread count
        queryClient.setQueryData<{ count: number }>(
          notificationKeys.unreadCount(),
          (old) => ({ count: (old?.count ?? 0) + 1 })
        );

        // If this is a chat_message notification, also bump chat unread
        if (notification.type === 'chat_message') {
          queryClient.invalidateQueries({ queryKey: chatKeys.contacts() });
          queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
        }
      },
      onNotificationRead: (notificationId: string) => {
        queryClient.setQueryData<Notification[]>(
          notificationKeys.list({ page: 1, pageSize: 20 }),
          (old) => {
            if (!old) return old;
            return old.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            );
          }
        );
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      },
    });

    return () => {
      disconnectFromNotifications();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return <>{children}</>;
}
