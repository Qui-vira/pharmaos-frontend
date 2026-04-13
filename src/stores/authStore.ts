import { create } from 'zustand';
import type { User } from '@/types';
import { authApi, getStoredUser } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Load user from localStorage on app boot */
  initialize: () => void;

  /** Authenticate with email + password */
  login: (email: string, password: string) => Promise<{
    requires_verification: boolean;
    requires_2fa: boolean;
    temp_token?: string;
    email?: string;
  }>;

  /** Clear tokens and redirect to /login */
  logout: () => void;

  /** Manually set the user (e.g. after registration or 2FA verify) */
  setUser: (user: User) => void;

  /** Re-fetch current user from the API */
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    const stored = getStoredUser();
    set({
      user: stored,
      isAuthenticated: !!stored,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);

      // If verification or 2FA is required, don't set user yet
      if (res.requires_verification || res.requires_2fa) {
        set({ isLoading: false });
        return {
          requires_verification: res.requires_verification,
          requires_2fa: res.requires_2fa,
          temp_token: res.temp_token,
          email: res.email,
        };
      }

      // Successful login — authApi.login already persists tokens + user to localStorage
      if (res.user) {
        set({ user: res.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return {
        requires_verification: false,
        requires_2fa: false,
      };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authApi.logout(); // clears tokens + redirects
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  refreshUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
