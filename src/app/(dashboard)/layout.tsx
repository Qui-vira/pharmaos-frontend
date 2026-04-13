'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import PageTransition from '@/components/layout/PageTransition';
import { getStoredUser } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <AppSidebar />
      <main className="lg:ml-[72px] min-h-screen transition-all duration-300">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
