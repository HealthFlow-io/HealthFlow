/**
 * SignalR Connection Manager
 * Handles real-time WebSocket connections using SignalR
 */

import { WS_HUBS, SIGNALR_EVENTS } from '@/lib/api/endpoints';
import { getAccessToken } from '@/lib/api/client';
import { Notification, Appointment, ChatMessage } from '@/types';

// SignalR types (you'll need to install @microsoft/signalr)
// npm install @microsoft/signalr

type HubConnection = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, callback: (...args: any[]) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off: (event: string, callback?: (...args: any[]) => void) => void;
  invoke: (method: string, ...args: unknown[]) => Promise<unknown>;
  state: string;
};

type HubConnectionBuilder = {
  withUrl: (url: string, options?: { accessTokenFactory: () => string | null }) => HubConnectionBuilder;
  withAutomaticReconnect: () => HubConnectionBuilder;
  build: () => HubConnection;
};

// Connection instances
let notificationsConnection: HubConnection | null = null;
let appointmentsConnection: HubConnection | null = null;
let chatConnection: HubConnection | null = null;

/**
 * Event handlers type definitions
 */
export interface NotificationEventHandlers {
  onReceiveNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onNewAppointment?: (appointment: Appointment) => void;
}

export interface AppointmentEventHandlers {
  onStatusChanged?: (appointment: Appointment) => void;
  onNewRequest?: (appointment: Appointment) => void;
  onReminder?: (appointment: Appointment) => void;
  onCancelled?: (appointmentId: string) => void;
}

export interface ChatEventHandlers {
  onReceiveMessage?: (message: ChatMessage) => void;
  onUserTyping?: (data: { userId: string }) => void;
  onMessagesRead?: (data: { readBy: string }) => void;
  onMessageError?: (data: { error: string }) => void;
}

/**
 * Create a SignalR connection
 * Note: Requires @microsoft/signalr package to be installed
 */
async function createConnection(hubUrl: string): Promise<HubConnection | null> {
  try {
    const signalR = await import('@microsoft/signalr');
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();
    
    return connection;
  } catch (error) {
    console.error('Failed to create SignalR connection:', error);
    return null;
  }
}

/**
 * Connect to Notifications Hub
 */
export async function connectToNotifications(
  handlers: NotificationEventHandlers
): Promise<void> {
  try {
    notificationsConnection = await createConnection(WS_HUBS.NOTIFICATIONS);
    
    if (!notificationsConnection) return;

    // Register event handlers
    if (handlers.onReceiveNotification) {
      notificationsConnection.on(
        SIGNALR_EVENTS.NOTIFICATIONS.RECEIVE,
        handlers.onReceiveNotification
      );
    }

    if (handlers.onNotificationRead) {
      notificationsConnection.on(
        SIGNALR_EVENTS.NOTIFICATIONS.MARK_READ,
        handlers.onNotificationRead
      );
    }

    if (handlers.onNewAppointment) {
      notificationsConnection.on(
        SIGNALR_EVENTS.NOTIFICATIONS.NEW_APPOINTMENT,
        handlers.onNewAppointment
      );
    }

    await notificationsConnection.start();
    console.log('Connected to Notifications Hub');
  } catch (error) {
    console.error('Failed to connect to Notifications Hub:', error);
  }
}

/**
 * Connect to Appointments Hub
 */
export async function connectToAppointments(
  handlers: AppointmentEventHandlers,
  options?: { doctorId?: string; secretaryId?: string }
): Promise<void> {
  try {
    // If already connected, disconnect first
    if (appointmentsConnection && appointmentsConnection.state === 'Connected') {
      console.log('Already connected to Appointments Hub, disconnecting first...');
      await disconnectFromAppointments();
    }

    appointmentsConnection = await createConnection(WS_HUBS.APPOINTMENTS);
    
    if (!appointmentsConnection) {
      console.warn('Failed to create appointments connection');
      return;
    }

    // Register event handlers
    if (handlers.onStatusChanged) {
      appointmentsConnection.on(
        SIGNALR_EVENTS.APPOINTMENTS.STATUS_CHANGED,
        handlers.onStatusChanged
      );
    }

    if (handlers.onNewRequest) {
      appointmentsConnection.on(
        SIGNALR_EVENTS.APPOINTMENTS.NEW_REQUEST,
        handlers.onNewRequest
      );
    }

    if (handlers.onReminder) {
      appointmentsConnection.on(
        SIGNALR_EVENTS.APPOINTMENTS.REMINDER,
        handlers.onReminder
      );
    }

    if (handlers.onCancelled) {
      appointmentsConnection.on(
        SIGNALR_EVENTS.APPOINTMENTS.CANCELLED,
        handlers.onCancelled
      );
    }

    await appointmentsConnection.start();
    console.log('✅ Connected to Appointments Hub');

    // Join specific groups if provided - ensure connection is ready
    if (appointmentsConnection.state === 'Connected') {
      if (options?.doctorId) {
        try {
          await appointmentsConnection.invoke('JoinDoctorRoom', options.doctorId);
          console.log(`✅ Joined doctor room: ${options.doctorId}`);
        } catch (error) {
          console.error('❌ Failed to join doctor room:', error);
        }
      }

      if (options?.secretaryId) {
        try {
          await appointmentsConnection.invoke('JoinGroup', `secretary_${options.secretaryId}`);
          console.log(`✅ Joined secretary room: ${options.secretaryId}`);
        } catch (error) {
          console.error('❌ Failed to join secretary room:', error);
        }
      }
    } else {
      console.warn('⚠️ Connection not ready, skipping group join');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Appointments Hub:', error);
  }
}

/**
 * Disconnect from Notifications Hub
 */
export async function disconnectFromNotifications(): Promise<void> {
  if (notificationsConnection) {
    try {
      await notificationsConnection.stop();
      notificationsConnection = null;
      console.log('Disconnected from Notifications Hub');
    } catch (error) {
      console.error('Error disconnecting from Notifications Hub:', error);
    }
  }
}

/**
 * Disconnect from Appointments Hub
 */
export async function disconnectFromAppointments(): Promise<void> {
  if (appointmentsConnection) {
    try {
      await appointmentsConnection.stop();
      appointmentsConnection = null;
      console.log('Disconnected from Appointments Hub');
    } catch (error) {
      console.error('Error disconnecting from Appointments Hub:', error);
    }
  }
}

/**
 * Disconnect all SignalR connections
 */
export async function disconnectAll(): Promise<void> {
  await Promise.all([
    disconnectFromNotifications(),
    disconnectFromAppointments(),
    disconnectFromChat(),
  ]);
}

/**
 * Check if connected to Notifications Hub
 */
export function isNotificationsConnected(): boolean {
  return notificationsConnection?.state === 'Connected';
}

/**
 * Check if connected to Appointments Hub
 */
export function isAppointmentsConnected(): boolean {
  return appointmentsConnection?.state === 'Connected';
}

/**
 * Connect to Chat Hub
 */
export async function connectToChat(
  handlers: ChatEventHandlers
): Promise<void> {
  try {
    // If already connected, disconnect first
    if (chatConnection && chatConnection.state === 'Connected') {
      await disconnectFromChat();
    }

    chatConnection = await createConnection(WS_HUBS.CHAT);

    if (!chatConnection) {
      console.warn('Failed to create chat connection');
      return;
    }

    // Register event handlers
    if (handlers.onReceiveMessage) {
      chatConnection.on(
        SIGNALR_EVENTS.CHAT.RECEIVE_MESSAGE,
        handlers.onReceiveMessage
      );
    }

    if (handlers.onUserTyping) {
      chatConnection.on(
        SIGNALR_EVENTS.CHAT.USER_TYPING,
        handlers.onUserTyping
      );
    }

    if (handlers.onMessagesRead) {
      chatConnection.on(
        SIGNALR_EVENTS.CHAT.MESSAGES_READ,
        handlers.onMessagesRead
      );
    }

    if (handlers.onMessageError) {
      chatConnection.on(
        SIGNALR_EVENTS.CHAT.MESSAGE_ERROR,
        handlers.onMessageError
      );
    }

    await chatConnection.start();
    console.log('Connected to Chat Hub');
  } catch (error) {
    console.error('Failed to connect to Chat Hub:', error);
  }
}

/**
 * Join a conversation room (call when user selects a conversation)
 */
export async function joinChatRoom(otherUserId: string): Promise<void> {
  if (chatConnection && chatConnection.state === 'Connected') {
    try {
      await chatConnection.invoke('JoinConversation', otherUserId);
      console.log(`Joined chat room with ${otherUserId}`);
    } catch (error) {
      console.error('Failed to join chat room:', error);
    }
  }
}

/**
 * Leave a conversation room (call when user leaves a conversation)
 */
export async function leaveChatRoom(otherUserId: string): Promise<void> {
  if (chatConnection && chatConnection.state === 'Connected') {
    try {
      await chatConnection.invoke('LeaveConversation', otherUserId);
      console.log(`Left chat room with ${otherUserId}`);
    } catch (error) {
      console.error('Failed to leave chat room:', error);
    }
  }
}

/**
 * Send a message via SignalR (real-time)
 */
export async function sendChatMessage(
  receiverId: string,
  content: string
): Promise<void> {
  if (chatConnection && chatConnection.state === 'Connected') {
    await chatConnection.invoke('SendMessage', { receiverId, content });
  } else {
    console.warn('Chat connection not available, cannot send message');
  }
}

/**
 * Mark messages as read via SignalR
 */
export async function markChatMessagesRead(
  senderId: string
): Promise<void> {
  if (chatConnection && chatConnection.state === 'Connected') {
    await chatConnection.invoke('MarkAsRead', senderId);
  }
}

/**
 * Send typing indicator via SignalR
 */
export async function sendTypingIndicator(
  receiverId: string
): Promise<void> {
  if (chatConnection && chatConnection.state === 'Connected') {
    await chatConnection.invoke('SendTyping', receiverId);
  }
}

/**
 * Disconnect from Chat Hub
 */
export async function disconnectFromChat(): Promise<void> {
  if (chatConnection) {
    try {
      await chatConnection.stop();
      chatConnection = null;
      console.log('Disconnected from Chat Hub');
    } catch (error) {
      console.error('Error disconnecting from Chat Hub:', error);
    }
  }
}

/**
 * Check if connected to Chat Hub
 */
export function isChatConnected(): boolean {
  return chatConnection?.state === 'Connected';
}

export default {
  connectToNotifications,
  connectToAppointments,
  connectToChat,
  disconnectFromNotifications,
  disconnectFromAppointments,
  disconnectFromChat,
  disconnectAll,
  isNotificationsConnected,
  isAppointmentsConnected,
  isChatConnected,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  markChatMessagesRead,
  sendTypingIndicator,
};
