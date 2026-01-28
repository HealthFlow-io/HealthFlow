'use client';

/**
 * Protected Route Component
 * Wraps pages that require authentication and/or specific roles
 * Uses Zustand store which fetches user from API on initialization
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
  console.log('[ProtectedRoute] Component mount');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Handle redirects after initialization
  useEffect(() => {
    console.log('[ProtectedRoute] useEffect: state', {
      isInitialized,
      isLoading,
      isAuthenticated,
      user,
      allowedRoles,
      fallbackUrl
    });
    if (!isInitialized || isLoading) {
      console.log('[ProtectedRoute] Waiting for initialization or loading...');
      return;
    }

    console.log('[ProtectedRoute] Auth state:', { isAuthenticated, user: user?.email, role: user?.role });

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login', {
        isAuthenticated,
        user
      });
      const currentPath = window.location.pathname;
      router.replace(`${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check role if required
    if (allowedRoles) {
      // Convert user.role to UserRole enum for proper comparison
      const userRole = user.role as UserRole;
      const isAllowed = allowedRoles.some(role => role === userRole || role === user.role);
      console.log('[ProtectedRoute] Role check:', {
        userRole: user.role,
        userRoleType: typeof user.role,
        allowedRoles,
        allowedRolesTypes: allowedRoles.map(r => typeof r),
        isAllowed,
        comparison: allowedRoles.map(r => ({ role: r, matches: r === userRole, exact: r === user.role }))
      });
      if (!isAllowed) {
        const dashboardUrl = getDashboardForRole(userRole);
        console.log('[ProtectedRoute] Role mismatch, redirecting to:', dashboardUrl);
        router.replace(dashboardUrl);
        return;
      }
    }

    console.log('[ProtectedRoute] User is authorized, rendering children');
  }, [isInitialized, isLoading, isAuthenticated, user, allowedRoles, router, fallbackUrl]);

  console.log('[ProtectedRoute] Render:', {
    isInitialized,
    isLoading,
    isAuthenticated,
    user,
    allowedRoles
  });

  // Show loading state while initializing or loading
  if (!isInitialized || isLoading) {
    console.log('[ProtectedRoute] Render: loading spinner');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated - show loading while redirecting
  if (!isAuthenticated || !user) {
    console.log('[ProtectedRoute] Render: not authenticated spinner');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Wrong role - show loading while redirecting
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] Render: wrong role spinner');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // User is authorized - render children
  console.log('[ProtectedRoute] Render: authorized, rendering children');
  return <>{children}</>;
}

// Helper function to get dashboard URL for a role
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
