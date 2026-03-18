'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { getStoredUser } from '@/lib/api';

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    setMounted(true);
  }, [router]);

  if (!mounted) return <div className="min-h-screen flex items-center justify-center bg-surface-50"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="lg:ml-[260px] min-h-screen">{children}</main>
    </div>
  );
}
