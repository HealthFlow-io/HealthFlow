'use client';

/**
 * Auth Provider
 * Handles authentication state initialization and protection
 */

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Fetch current user on mount
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // You can add a loading spinner here while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;
