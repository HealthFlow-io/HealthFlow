'use client';

/**
 * React Query hooks for Appointments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services';
import { Appointment, AppointmentCreateDto, AppointmentRescheduleDto, AppointmentFilterParams } from '@/types';

// Query Keys
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (params: AppointmentFilterParams) => [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  byPatient: (patientId: string, params?: AppointmentFilterParams) =>
    [...appointmentKeys.all, 'patient', patientId, params] as const,
  byDoctor: (doctorId: string, params?: AppointmentFilterParams) =>
    [...appointmentKeys.all, 'doctor', doctorId, params] as const,
  availableSlots: (doctorId: string, date: string) =>
    [...appointmentKeys.all, 'slots', doctorId, date] as const,
};

/**
 * Hook to fetch all appointments with optional filters
 */
export function useAppointments(params?: AppointmentFilterParams) {
  return useQuery({
    queryKey: appointmentKeys.list(params || {}),
    queryFn: () => appointmentService.getAll(params),
  });
}

/**
 * Hook to fetch a single appointment by ID
 */
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch appointments by patient
 */
export function usePatientAppointments(patientId: string, params?: AppointmentFilterParams) {
  return useQuery({
    queryKey: appointmentKeys.byPatient(patientId, params),
    queryFn: () => appointmentService.getByPatient(patientId, params),
    enabled: !!patientId,
  });
}

/**
 * Hook to fetch appointments by doctor
 */
export function useDoctorAppointments(doctorId: string, params?: AppointmentFilterParams) {
  return useQuery({
    queryKey: appointmentKeys.byDoctor(doctorId, params),
    queryFn: () => appointmentService.getByDoctor(doctorId, params),
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch available time slots for a doctor
 */
export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: appointmentKeys.availableSlots(doctorId, date),
    queryFn: () => appointmentService.getAvailableSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });
}

/**
 * Hook to create a new appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentCreateDto) => appointmentService.create(data),
    onSuccess: () => {
      // Invalidate all appointment lists
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to approve an appointment
 */
export function useApproveAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.approve(id),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        appointmentKeys.detail(updatedAppointment.id),
        updatedAppointment
      );
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to decline an appointment
 */
export function useDeclineAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentService.decline(id, reason),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        appointmentKeys.detail(updatedAppointment.id),
        updatedAppointment
      );
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to cancel an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentService.cancel(id, reason),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        appointmentKeys.detail(updatedAppointment.id),
        updatedAppointment
      );
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to reschedule an appointment
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentRescheduleDto }) =>
      appointmentService.reschedule(id, data),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        appointmentKeys.detail(updatedAppointment.id),
        updatedAppointment
      );
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to mark an appointment as complete
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.complete(id),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        appointmentKeys.detail(updatedAppointment.id),
        updatedAppointment
      );
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}
