/**
 * TypeScript Types and Interfaces
 * Based on the entities defined in entities.md
 */

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  Admin = 'admin',
  Doctor = 'doctor',
  Secretary = 'secretary',
  Patient = 'patient',
  ClinicManager = 'clinicManager',
}

export enum ConsultationType {
  Online = 'online',
  Physical = 'physical',
  HomeVisit = 'home-visit',
}

export enum AppointmentType {
  Online = 'ONLINE',
  Physical = 'PHYSICAL',
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Declined = 'Declined',
  Cancelled = 'Cancelled',
  Done = 'Done',
}

export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface UserUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// DOCTOR TYPES
// ============================================

export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  fullName?: string;
  specializationId: string;
  specialization?: Specialization;
  subSpecializations?: string[];
  bio?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  experienceYears?: number;
  education?: string;
  languages?: string[];
  consultationTypes?: ConsultationType[];
  consultationDuration?: number; // in minutes
  consultationPrice?: number;
  consultationFee?: number;
  clinicId?: string;
  clinic?: Clinic;
  rating?: number;
  reviewCount?: number;
  user?: User;
}

export interface DoctorCreateDto {
  userId: string;
  fullName: string;
  specializationId: string;
  subSpecializations?: string[];
  bio?: string;
  experienceYears: number;
  languages?: string[];
  consultationTypes: ConsultationType[];
  consultationDuration: number;
  consultationPrice: number;
  clinicId?: string;
}

export interface DoctorUpdateDto {
  fullName?: string;
  specializationId?: string;
  subSpecializations?: string[];
  bio?: string;
  experienceYears?: number;
  languages?: string[];
  consultationTypes?: ConsultationType[];
  consultationDuration?: number;
  consultationPrice?: number;
  clinicId?: string;
}

export interface DoctorSearchParams {
  specialization?: string;
  location?: string;
  consultationType?: ConsultationType;
  language?: string;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

// ============================================
// SPECIALIZATION TYPES
// ============================================

export interface Specialization {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface SpecializationCreateDto {
  name: string;
  category: string;
  description?: string;
}

export interface SpecializationUpdateDto {
  name?: string;
  category?: string;
  description?: string;
}

// ============================================
// DOCTOR AVAILABILITY TYPES
// ============================================

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface DoctorAvailabilityCreateDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export interface Appointment {
  id: string;
  patientId: string;
  patient?: User;
  doctorId: string;
  doctor?: Doctor;
  clinicId?: string;
  clinic?: Clinic;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  meetingLink?: string;
  reason?: string;
  createdAt: string;
  approvedBy?: string;
}

// Matches backend AppointmentDTOs: AppointmentCreateDto
// Note: patientId is NOT in the DTO - it's obtained from auth context
export interface AppointmentCreateDto {
  doctorId: string;
  clinicId?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;  // Must use AppointmentType enum, not string
  reason?: string;
}

export interface AppointmentUpdateDto {
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: AppointmentType;
  reason?: string;
}

export interface AppointmentRescheduleDto {
  date: string;
  startTime: string;
  endTime: string;
}

export interface AppointmentFilterParams {
  status?: AppointmentStatus;
  type?: AppointmentType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// CLINIC TYPES
// ============================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface WorkingHours {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
  openingTime?: string;
  closingTime?: string;
  geoLocation?: GeoLocation;
  workingHours?: WorkingHours[];
  contactInfo?: ContactInfo;
}

export interface ClinicCreateDto {
  name: string;
  address: string;
  geoLocation?: GeoLocation;
  workingHours?: WorkingHours[];
  contactInfo?: ContactInfo;
}

// ============================================
// MEDICAL RECORD TYPES
// ============================================

export interface MedicalRecord {
  id: string;
  patientId: string;
  patient?: User;
  doctorId: string;
  doctor?: Doctor;
  notes: string;
  prescriptionUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MedicalRecordCreateDto {
  patientId: string;
  notes: string;
  prescriptionUrl?: string;
}

// ============================================
// SECRETARY TYPES
// ============================================

export interface SecretaryProfile {
  id: string;
  userId: string;
  user?: User;
  doctors: Doctor[];
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
