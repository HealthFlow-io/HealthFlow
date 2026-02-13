/**
 * Application Constants
 */

// Appointment Status Colors
export const APPOINTMENT_STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  Done: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
} as const;

// Consultation Types
export const CONSULTATION_TYPES = [
  { value: 'online', label: 'Online Consultation' },
  { value: 'physical', label: 'Physical Consultation' },
  { value: 'home-visit', label: 'Home Visit' },
] as const;

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

// User Roles
export const USER_ROLES = [
  { value: 'Patient', label: 'Patient' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Secretary', label: 'Secretary' },
  { value: 'Admin', label: 'Administrator' },
  { value: 'ClinicManager', label: 'Clinic Manager' },
] as const;

// Specialization Categories
export const SPECIALIZATION_CATEGORIES = [
  'Medical',
  'Surgical',
  'Mental Health',
  'Pediatric',
  'Dental',
  'Other',
] as const;

// Common Languages
export const COMMON_LANGUAGES = [
  'English',
  'French',
  'Arabic',
  'Spanish',
  'German',
  'Chinese',
] as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Time Slots (for appointment booking)
export const TIME_SLOTS = {
  START_HOUR: 8,
  END_HOUR: 18,
  SLOT_DURATION: 30, // minutes
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Patient Routes
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    APPOINTMENTS: '/patient/appointments',
    DOCTORS: '/patient/doctors',
    MEDICAL_RECORDS: '/patient/medical-records',
    PROFILE: '/patient/profile',
  },
  
  // Doctor Routes
  DOCTOR: {
    DASHBOARD: '/doctor/dashboard',
    APPOINTMENTS: '/doctor/appointments',
    SCHEDULE: '/doctor/schedule',
    PATIENTS: '/doctor/patients',
    MESSAGES: '/doctor/messages',
    PROFILE: '/doctor/profile',
  },
  
  // Secretary Routes
  SECRETARY: {
    DASHBOARD: '/secretary/dashboard',
    APPOINTMENTS: '/secretary/appointments',
    DOCTORS: '/secretary/doctors',
    PATIENTS: '/secretary/patients',
    MESSAGES: '/secretary/messages',
  },
  
  // Admin Routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    DOCTORS: '/admin/doctors',
    SECRETARIES: '/admin/secretaries',
    CLINICS: '/admin/clinics',
    SPECIALIZATIONS: '/admin/specializations',
    KNOWLEDGE_BASE: '/admin/knowledge-base',
    SETTINGS: '/admin/settings',
  },
} as const;
