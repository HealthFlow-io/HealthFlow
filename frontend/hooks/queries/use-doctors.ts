'use client';

/**
 * React Query hooks for Doctors
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services';
import { Doctor, DoctorSearchParams, DoctorUpdateDto, DoctorAvailabilityCreateDto } from '@/types';

// Query Keys
export const doctorKeys = {
  all: ['doctors'] as const,
  lists: () => [...doctorKeys.all, 'list'] as const,
  list: (params: DoctorSearchParams) => [...doctorKeys.lists(), params] as const,
  details: () => [...doctorKeys.all, 'detail'] as const,
  detail: (id: string) => [...doctorKeys.details(), id] as const,
  availability: (id: string) => [...doctorKeys.detail(id), 'availability'] as const,
  schedule: (id: string, date?: string) => [...doctorKeys.detail(id), 'schedule', date] as const,
};

/**
 * Hook to fetch all doctors with optional filters
 */
export function useDoctors(params?: DoctorSearchParams) {
  return useQuery({
    queryKey: doctorKeys.list(params || {}),
    queryFn: () => doctorService.getAll(params),
  });
}

/**
 * Hook to search doctors
 */
export function useSearchDoctors(params: DoctorSearchParams) {
  return useQuery({
    queryKey: ['doctors', 'search', params],
    queryFn: () => doctorService.search(params),
    enabled: Object.keys(params).length > 0,
  });
}

/**
 * Hook to fetch a single doctor by ID
 */
export function useDoctor(id: string) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => doctorService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch doctor availability
 */
export function useDoctorAvailability(doctorId: string) {
  return useQuery({
    queryKey: doctorKeys.availability(doctorId),
    queryFn: () => doctorService.getAvailability(doctorId),
    enabled: !!doctorId,
  });
}

/**
 * Hook to fetch doctor schedule for a specific date
 */
export function useDoctorSchedule(doctorId: string, date?: string) {
  return useQuery({
    queryKey: doctorKeys.schedule(doctorId, date),
    queryFn: () => doctorService.getSchedule(doctorId, date),
    enabled: !!doctorId,
  });
}

/**
 * Hook to update doctor profile
 */
export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoctorUpdateDto }) =>
      doctorService.update(id, data),
    onSuccess: (updatedDoctor) => {
      // Update the doctor in the cache
      queryClient.setQueryData(doctorKeys.detail(updatedDoctor.id), updatedDoctor);
      // Invalidate the doctors list
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
    },
  });
}

/**
 * Hook to update doctor availability
 */
export function useUpdateDoctorAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      doctorId,
      availability,
    }: {
      doctorId: string;
      availability: DoctorAvailabilityCreateDto[];
    }) => doctorService.updateAvailability(doctorId, availability),
    onSuccess: (_, variables) => {
      // Invalidate availability cache
      queryClient.invalidateQueries({
        queryKey: doctorKeys.availability(variables.doctorId),
      });
    },
  });
}
