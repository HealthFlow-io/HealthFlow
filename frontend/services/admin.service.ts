/**
 * Admin Service
 * Handles all admin-related API calls
 * DTOs aligned with backend HealthFlow_backend
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { User, Doctor, Clinic, Specialization, ConsultationType, DayOfWeek, PaginatedResponse } from '@/types';

// ==================== User DTOs ====================
// Matches backend AuthDTOs: UserCreateDto
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'Patient' | 'Doctor' | 'Secretary' | 'Admin' | 'ClinicManager';
}

// Matches backend AdminDTOs: AdminUserUpdateDto
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'Patient' | 'Doctor' | 'Secretary' | 'Admin' | 'ClinicManager';
  emailVerified?: boolean;
}

// ==================== Doctor DTOs ====================
// Matches backend DoctorDTOs: DoctorCreateDto
export interface CreateDoctorRequest {
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

// Matches backend DoctorDTOs: DoctorUpdateDto
export interface UpdateDoctorRequest {
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

// ==================== Clinic DTOs ====================
// Matches backend ClinicDTOs: GeoLocationDto
export interface GeoLocationDto {
  latitude: number;
  longitude: number;
}

// Matches backend ClinicDTOs: WorkingHoursDto
export interface WorkingHoursDto {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// Matches backend ClinicDTOs: ContactInfoDto
export interface ContactInfoDto {
  phone?: string;
  email?: string;
  website?: string;
}

// Matches backend ClinicDTOs: ClinicCreateDto
export interface CreateClinicRequest {
  name: string;
  address: string;
  geoLocation?: GeoLocationDto;
  workingHours?: WorkingHoursDto[];
  contactInfo?: ContactInfoDto;
}

// Matches backend ClinicDTOs: ClinicUpdateDto
export interface UpdateClinicRequest {
  name?: string;
  address?: string;
  geoLocation?: GeoLocationDto;
  workingHours?: WorkingHoursDto[];
  contactInfo?: ContactInfoDto;
}

// ==================== Specialization DTOs ====================
// Matches backend SpecializationDTOs: SpecializationCreateDto
export interface CreateSpecializationRequest {
  name: string;
  category: string;
  description?: string;
}

// ==================== Secretary DTOs ====================
// Matches backend SecretaryDTOs: SecretaryCreateDto
export interface CreateSecretaryRequest {
  userId: string;
}

// Matches backend SecretaryDTOs: AssignDoctorDto
export interface AssignDoctorRequest {
  doctorId: string;
}

export interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalClinics: number;
  appointmentsToday: number;
  pendingAppointments: number;
}

export const adminService = {
  // ==================== Users ====================
  async getAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>(API_ENDPOINTS.ADMIN.USERS);
  },

  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    return apiClient.post<User>(API_ENDPOINTS.ADMIN.USERS, data);
  },

  async updateUser(id: string, data: Partial<CreateUserRequest>): Promise<User> {
    return apiClient.put<User>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, data);
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
  },

  // ==================== Doctors ====================
  async getAllDoctors(): Promise<Doctor[]> {
    const response = await apiClient.get<PaginatedResponse<Doctor>>(API_ENDPOINTS.DOCTORS.BASE + '?pageSize=1000');
    return response.data;
  },

  // Doctors are created via /api/doctors endpoint (not admin)
  async createDoctor(data: CreateDoctorRequest): Promise<Doctor> {
    return apiClient.post<Doctor>(API_ENDPOINTS.DOCTORS.BASE, data);
  },

  async updateDoctor(id: string, data: Partial<CreateDoctorRequest>): Promise<Doctor> {
    return apiClient.put<Doctor>(`${API_ENDPOINTS.DOCTORS.BASE}/${id}`, data);
  },

  async deleteDoctor(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.DOCTORS.BASE}/${id}`);
  },

  // ==================== Clinics ====================
  async getAllClinics(): Promise<Clinic[]> {
    const response = await apiClient.get<PaginatedResponse<Clinic>>(API_ENDPOINTS.CLINICS.BASE + '?pageSize=1000');
    return response.data;
  },

  // Clinics are created via /api/clinics endpoint (not admin)
  async createClinic(data: CreateClinicRequest): Promise<Clinic> {
    return apiClient.post<Clinic>(API_ENDPOINTS.CLINICS.BASE, data);
  },

  async updateClinic(id: string, data: Partial<CreateClinicRequest>): Promise<Clinic> {
    return apiClient.put<Clinic>(`${API_ENDPOINTS.CLINICS.BASE}/${id}`, data);
  },

  async deleteClinic(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.CLINICS.BASE}/${id}`);
  },

  // ==================== Specializations ====================
  async getAllSpecializations(): Promise<Specialization[]> {
    return apiClient.get<Specialization[]>(API_ENDPOINTS.SPECIALIZATIONS.BASE);
  },

  async createSpecialization(data: CreateSpecializationRequest): Promise<Specialization> {
    return apiClient.post<Specialization>(API_ENDPOINTS.SPECIALIZATIONS.BASE, data);
  },

  async updateSpecialization(id: string, data: Partial<CreateSpecializationRequest>): Promise<Specialization> {
    return apiClient.put<Specialization>(`${API_ENDPOINTS.SPECIALIZATIONS.BASE}/${id}`, data);
  },

  async deleteSpecialization(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.SPECIALIZATIONS.BASE}/${id}`);
  },

  // ==================== Secretaries ====================
  async getSecretaries(): Promise<User[]> {
    return apiClient.get<User[]>(API_ENDPOINTS.SECRETARY.BASE);
  },

  // Create secretary requires existing user - pass userId
  async createSecretary(data: CreateSecretaryRequest): Promise<User> {
    return apiClient.post<User>(API_ENDPOINTS.SECRETARY.BASE, data);
  },

  // Assign a single doctor to secretary - matches backend AssignDoctorDto
  async assignDoctorToSecretary(secretaryId: string, doctorId: string): Promise<void> {
    return apiClient.post(`${API_ENDPOINTS.SECRETARY.BASE}/${secretaryId}/doctors`, { doctorId });
  },

  // Unassign a doctor from secretary
  async unassignDoctorFromSecretary(secretaryId: string, doctorId: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.SECRETARY.BASE}/${secretaryId}/doctors/${doctorId}`);
  },

  // Assign multiple doctors by calling the assign endpoint multiple times
  async assignDoctorsToSecretary(secretaryId: string, doctorIds: string[]): Promise<void> {
    for (const doctorId of doctorIds) {
      await apiClient.post(`${API_ENDPOINTS.SECRETARY.BASE}/${secretaryId}/doctors`, { doctorId });
    }
  },

  async getSecretaryDoctors(secretaryId: string): Promise<Doctor[]> {
    return apiClient.get<Doctor[]>(API_ENDPOINTS.SECRETARY.ASSIGNED_DOCTORS(secretaryId));
  },

  // ==================== Statistics ====================
  async getStatistics(): Promise<AdminStats> {
    return apiClient.get<AdminStats>(API_ENDPOINTS.ADMIN.STATISTICS);
  },
};

export default adminService;
