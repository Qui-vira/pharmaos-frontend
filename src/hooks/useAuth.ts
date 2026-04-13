'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, requireAuth, isAuthenticated, router]);

  return { user, isAuthenticated, isLoading };
}
