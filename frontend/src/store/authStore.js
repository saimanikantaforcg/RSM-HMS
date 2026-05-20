import { create } from 'zustand';

/**
 * authStore — Centralized Enterprise Auth State
 * 
 * Replaces the rudimentary module-level caching in api.js
 * with a reactive, multi-component-aware state.
 */
export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  tenantId: null,
  isAuthenticated: false,
  isFetching: false,

  /** Sets the current user context (called after /auth/me or /login) */
  setUser: (userData) => {
    if (!userData) {
      set({ user: null, role: null, tenantId: null, isAuthenticated: false });
      return;
    }
    set({
      user: userData,
      role: userData.role,
      tenantId: userData.tenantId,
      isAuthenticated: true,
    });
  },

  /** Marks the store as currently fetching (prevents duplicate requests) */
  setFetching: (isFetching) => set({ isFetching }),

  /** Full logout — clears state */
  logout: () => {
    set({ user: null, role: null, tenantId: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
