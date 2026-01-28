/**
 * Authentication Store
 * Token-based auth: only token is persisted, user info is fetched from API
 */

import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services';
import { getAccessToken, clearTokens } from '@/lib/api/client';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;  // True after initial auth check completes
  
  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  // Initial state - user not loaded yet
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /**
   * Initialize auth state by checking token and fetching user
   * Called once on app load
   */
  initialize: async () => {
    console.log('[AuthStore] initialize called');
    // Don't re-initialize if already done
    if (get().isInitialized) {
      console.log('[AuthStore] Already initialized, skipping');
      return;
    }
    const token = getAccessToken();
    console.log('[AuthStore] Initializing, token exists:', !!token, 'token:', token);
    if (!token) {
      // No token - user is not authenticated
      set({ isInitialized: true, isAuthenticated: false, user: null });
      console.log('[AuthStore] No token, set user null, isAuthenticated false');
      return;
    }
    // Token exists - verify it by fetching user
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      console.log('[AuthStore] User fetched:', user);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      console.log('[AuthStore] Set user, isAuthenticated true');
    } catch (error) {
      // Token is invalid or expired
      console.log('[AuthStore] Token invalid, clearing', error);
      clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      console.log('[AuthStore] Set user null, isAuthenticated false');
    }
  },

  /**
   * Login user
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(credentials);
      console.log('[AuthStore] Login successful:', response.user.email);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(data);
      console.log('[AuthStore] Registration successful:', response.user.email);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Set user manually
   */
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },
}));

export default useAuthStore;
