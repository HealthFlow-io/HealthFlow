'use client';

/**
 * React Query hooks for Specializations
 */

import { useQuery } from '@tanstack/react-query';
import { specializationService } from '@/services';

// Query Keys
export const specializationKeys = {
  all: ['specializations'] as const,
  lists: () => [...specializationKeys.all, 'list'] as const,
  byCategory: (category: string) => [...specializationKeys.all, 'category', category] as const,
  detail: (id: string) => [...specializationKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch all specializations
 */
export function useSpecializations() {
  return useQuery({
    queryKey: specializationKeys.lists(),
    queryFn: () => specializationService.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes - specializations don't change often
  });
}

/**
 * Hook to fetch specializations by category
 */
export function useSpecializationsByCategory(category: string) {
  return useQuery({
    queryKey: specializationKeys.byCategory(category),
    queryFn: () => specializationService.getByCategory(category),
    enabled: !!category,
  });
}

/**
 * Hook to fetch a single specialization by ID
 */
export function useSpecialization(id: string) {
  return useQuery({
    queryKey: specializationKeys.detail(id),
    queryFn: () => specializationService.getById(id),
    enabled: !!id,
  });
}
