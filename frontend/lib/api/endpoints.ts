/**
 * API Endpoints Configuration
 * Contains all REST API and WebSocket endpoints used in the application
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5155/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5155/hubs';

// ============================================
// REST API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    ME: `${API_BASE_URL}/auth/me`,
  },

  // Users
  USERS: {
    BASE: `${API_BASE_URL}/users`,
    BY_ID: (id: string) => `${API_BASE_URL}/users/${id}`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`,
  },

  // Doctors
  DOCTORS: {
    BASE: `${API_BASE_URL}/doctors`,
    BY_ID: (id: string) => `${API_BASE_URL}/doctors/${id}`,
    ME: `${API_BASE_URL}/doctors/me`,
    SEARCH: `${API_BASE_URL}/doctors/search`,
    BY_SPECIALIZATION: (specializationId: string) => `${API_BASE_URL}/doctors/specialization/${specializationId}`,
    BY_CLINIC: (clinicId: string) => `${API_BASE_URL}/doctors/clinic/${clinicId}`,
    AVAILABILITY: (doctorId: string) => `${API_BASE_URL}/doctors/${doctorId}/availability`,
    UPDATE_AVAILABILITY: (doctorId: string) => `${API_BASE_URL}/doctors/${doctorId}/availability`,
    SCHEDULE: (doctorId: string) => `${API_BASE_URL}/doctors/${doctorId}/schedule`,
    RATINGS: (doctorId: string) => `${API_BASE_URL}/doctors/${doctorId}/ratings`,
  },

  // Specializations
  SPECIALIZATIONS: {
    BASE: `${API_BASE_URL}/specializations`,
    BY_ID: (id: string) => `${API_BASE_URL}/specializations/${id}`,
    BY_CATEGORY: (category: string) => `${API_BASE_URL}/specializations/category/${category}`,
  },

  // Appointments
  APPOINTMENTS: {
    BASE: `${API_BASE_URL}/appointments`,
    BY_ID: (id: string) => `${API_BASE_URL}/appointments/${id}`,
    BY_PATIENT: (patientId: string) => `${API_BASE_URL}/appointments/patient/${patientId}`,
    BY_DOCTOR: (doctorId: string) => `${API_BASE_URL}/appointments/doctor/${doctorId}`,
    BY_CLINIC: (clinicId: string) => `${API_BASE_URL}/appointments/clinic/${clinicId}`,
    APPROVE: (id: string) => `${API_BASE_URL}/appointments/${id}/approve`,
    DECLINE: (id: string) => `${API_BASE_URL}/appointments/${id}/decline`,
    CANCEL: (id: string) => `${API_BASE_URL}/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `${API_BASE_URL}/appointments/${id}/reschedule`,
    COMPLETE: (id: string) => `${API_BASE_URL}/appointments/${id}/complete`,
    AVAILABLE_SLOTS: (doctorId: string) => `${API_BASE_URL}/appointments/doctor/${doctorId}/available-slots`,
  },

  // Clinics
  CLINICS: {
    BASE: `${API_BASE_URL}/clinics`,
    BY_ID: (id: string) => `${API_BASE_URL}/clinics/${id}`,
    SEARCH: `${API_BASE_URL}/clinics/search`,
    NEARBY: `${API_BASE_URL}/clinics/nearby`,
  },

  // Medical Records
  MEDICAL_RECORDS: {
    BASE: `${API_BASE_URL}/medical-records`,
    BY_ID: (id: string) => `${API_BASE_URL}/medical-records/${id}`,
    BY_PATIENT: (patientId: string) => `${API_BASE_URL}/medical-records/patient/${patientId}`,
    BY_DOCTOR: (doctorId: string) => `${API_BASE_URL}/medical-records/doctor/${doctorId}`,
  },

  // Secretary
  SECRETARY: {
    BASE: `${API_BASE_URL}/secretaries`,
    BY_ID: (id: string) => `${API_BASE_URL}/secretaries/${id}`,
    ME: `${API_BASE_URL}/secretaries/me`,
    MY_PATIENTS: `${API_BASE_URL}/secretaries/me/patients`,
    ASSIGNED_DOCTORS: (secretaryId: string) => `${API_BASE_URL}/secretaries/${secretaryId}/doctors`,
  },

  // Admin
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    DOCTORS: `${API_BASE_URL}/admin/doctors`,
    CLINICS: `${API_BASE_URL}/admin/clinics`,
    STATISTICS: `${API_BASE_URL}/admin/statistics`,
    SETTINGS: `${API_BASE_URL}/admin/settings`,
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/notifications`,
    BY_ID: (id: string) => `${API_BASE_URL}/notifications/${id}`,
    MARK_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/read-all`,
    UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
  },

  // File Upload
  FILES: {
    UPLOAD: `${API_BASE_URL}/files/upload`,
    DOWNLOAD: (fileId: string) => `${API_BASE_URL}/files/${fileId}`,
    DELETE: (fileId: string) => `${API_BASE_URL}/files/${fileId}`,
  },
} as const;

// ============================================
// WEBSOCKET/SIGNALR HUBS
// ============================================

export const WS_HUBS = {
  // Notifications Hub - Real-time notifications
  NOTIFICATIONS: `${WS_BASE_URL}/notifications`,

  // Appointments Hub - Real-time appointment updates
  APPOINTMENTS: `${WS_BASE_URL}/appointments`,

  // Chat Hub - In-app messaging (planned)
  CHAT: `${WS_BASE_URL}/chat`,
} as const;

// ============================================
// SIGNALR EVENT NAMES
// ============================================

export const SIGNALR_EVENTS = {
  // Notification Events
  NOTIFICATIONS: {
    RECEIVE: 'ReceiveNotification',
    MARK_READ: 'NotificationRead',
    NEW_APPOINTMENT: 'NewAppointmentNotification',
  },

  // Appointment Events
  APPOINTMENTS: {
    STATUS_CHANGED: 'AppointmentStatusChanged',
    NEW_REQUEST: 'NewAppointmentRequest',
    REMINDER: 'AppointmentReminder',
    CANCELLED: 'AppointmentCancelled',
  },

  // Chat Events (Planned)
  CHAT: {
    RECEIVE_MESSAGE: 'ReceiveMessage',
    USER_TYPING: 'UserTyping',
    MESSAGE_READ: 'MessageRead',
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return baseUrl;
  
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Get the API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Get the WebSocket base URL
 */
export function getWsBaseUrl(): string {
  return WS_BASE_URL;
}

export default API_ENDPOINTS;
