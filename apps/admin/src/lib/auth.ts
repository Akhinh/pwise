'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuth {
  isLoggedIn: boolean;
  email: string;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Admin credentials — change these before going live
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@prepwise.ng';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'prepwise-admin-2026';

export const useAdminAuth = create<AdminAuth>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      email: '',
      login(email, password) {
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          set({ isLoggedIn: true, email });
          return true;
        }
        return false;
      },
      logout() {
        set({ isLoggedIn: false, email: '' });
      },
    }),
    { name: 'prepwise-admin-auth' }
  )
);
