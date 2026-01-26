/**
 * SignalR Connection Manager
 * Handles real-time WebSocket connections using SignalR
 */

import { WS_HUBS, SIGNALR_EVENTS } from '@/lib/api/endpoints';
import { getAccessToken } from '@/lib/api/client';
import { Notification, Appointment } from '@/types';

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

// This will be the actual SignalR import when you install the package
import * as signalR from '@microsoft/signalr';

// Connection instances
let notificationsConnection: HubConnection | null = null;
let appointmentsConnection: HubConnection | null = null;

/**
 * Event handlers type definitions
 */
export interface NotificationEventHandlers {
  onReceiveNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onNewAppointment?: (appointment: Appointment) => void;
}

export interface AppointmentEventHandlers {
  onStatusChanged?: (appointmentId: string, status: string) => void;
  onNewRequest?: (appointment: Appointment) => void;
  onReminder?: (appointment: Appointment) => void;
  onCancelled?: (appointmentId: string) => void;
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
    
    console.log(`SignalR connection would be created for: ${hubUrl}`);
    console.log('Install @microsoft/signalr package to enable real-time features');
    return null;
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
  handlers: AppointmentEventHandlers
): Promise<void> {
  try {
    appointmentsConnection = await createConnection(WS_HUBS.APPOINTMENTS);
    
    if (!appointmentsConnection) return;

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
    console.log('Connected to Appointments Hub');
  } catch (error) {
    console.error('Failed to connect to Appointments Hub:', error);
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

export default {
  connectToNotifications,
  connectToAppointments,
  disconnectFromNotifications,
  disconnectFromAppointments,
  disconnectAll,
  isNotificationsConnected,
  isAppointmentsConnected,
};
