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
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    fetchCurrentUser,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    await storeLogin({ email, password });
    // Redirect based on user role after login
    const user = useAuthStore.getState().user;
    if (user) {
      switch (user.role) {
        case 'Doctor':
          router.push(ROUTES.DOCTOR.DASHBOARD);
          break;
        case 'Secretary':
          router.push(ROUTES.SECRETARY.DASHBOARD);
          break;
        case 'Admin':
          router.push(ROUTES.ADMIN.DASHBOARD);
          break;
        default:
          router.push(ROUTES.PATIENT.DASHBOARD);
      }
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    await storeRegister(data);
    router.push(ROUTES.PATIENT.DASHBOARD);
  };

  const logout = async () => {
    await storeLogout();
    router.push(ROUTES.LOGIN);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
}

export default useAuth;
