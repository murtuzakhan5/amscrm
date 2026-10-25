import { create } from 'zustand';
import api from '../services/api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get('/auth/me');
      set({
        user: res.data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return res.data.data.user;
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/auth/login', { email, password });
      const user = res.data.data.user;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Continue clearing client state anyway
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUserProfile: (updatedEmployee) => {
    set((state) => ({
      user: state.user ? { ...state.user, employee: updatedEmployee } : null,
    }));
  },
}));
