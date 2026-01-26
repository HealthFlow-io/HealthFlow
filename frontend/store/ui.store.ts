/**
 * UI Store
 * Zustand store for managing UI state (sidebar, modals, theme, etc.)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: Theme;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Loading states
  globalLoading: boolean;

  // Notifications panel
  notificationsPanelOpen: boolean;
}

interface UIStore extends UIState {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme actions
  setTheme: (theme: Theme) => void;

  // Modal actions
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Loading actions
  setGlobalLoading: (loading: boolean) => void;

  // Notifications panel
  toggleNotificationsPanel: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system',
  activeModal: null,
  modalData: null,
  globalLoading: false,
  notificationsPanelOpen: false,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (sidebarOpen: boolean) => {
        set({ sidebarOpen });
      },

      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (sidebarCollapsed: boolean) => {
        set({ sidebarCollapsed });
      },

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      openModal: (activeModal: string, modalData?: Record<string, unknown>) => {
        set({ activeModal, modalData: modalData || null });
      },

      closeModal: () => {
        set({ activeModal: null, modalData: null });
      },

      setGlobalLoading: (globalLoading: boolean) => {
        set({ globalLoading });
      },

      toggleNotificationsPanel: () => {
        set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen }));
      },

      setNotificationsPanelOpen: (notificationsPanelOpen: boolean) => {
        set({ notificationsPanelOpen });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

export default useUIStore;
