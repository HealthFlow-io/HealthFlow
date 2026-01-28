'use client';

/**
 * useAuth Hook
 * Provides authentication state and actions
 */

import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    initialize,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    // This will throw if login fails, allowing the component to catch the error
    await storeLogin({ email, password });
    // Redirect is now handled by the component via useEffect
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    // This will throw if register fails, allowing the component to catch the error
    await storeRegister(data);
    // Redirect is now handled by the component via useEffect
  };

  const logout = async () => {
    await storeLogout();
    router.push(ROUTES.LOGIN);
  };

  /**
   * Get the dashboard route based on user role
   */
  const getDashboardRoute = (role?: string) => {
    switch (role) {
      case 'Doctor':
        return ROUTES.DOCTOR.DASHBOARD;
      case 'Secretary':
        return ROUTES.SECRETARY.DASHBOARD;
      case 'Admin':
        return ROUTES.ADMIN.DASHBOARD;
      default:
        return ROUTES.PATIENT.DASHBOARD;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    initialize,
    getDashboardRoute,
  };
}

export default useAuth;
