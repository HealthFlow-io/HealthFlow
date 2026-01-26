'use client';

/**
 * Protected Route Component
 * Wraps pages that require authentication and/or specific roles
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { UserRole } from '@/types';
import { ROUTES } from '@/lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackUrl = ROUTES.LOGIN,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated
      if (!isAuthenticated) {
        router.push(fallbackUrl);
        return;
      }

      // Check role if required
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard
        const dashboardUrl = getDashboardForRole(user.role);
        router.push(dashboardUrl);
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router, fallbackUrl]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

function getDashboardForRole(role: UserRole): string {
  switch (role) {
    case UserRole.Doctor:
      return ROUTES.DOCTOR.DASHBOARD;
    case UserRole.Secretary:
      return ROUTES.SECRETARY.DASHBOARD;
    case UserRole.Admin:
      return ROUTES.ADMIN.DASHBOARD;
    case UserRole.Patient:
    default:
      return ROUTES.PATIENT.DASHBOARD;
  }
}

export default ProtectedRoute;
