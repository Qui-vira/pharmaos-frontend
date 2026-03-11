'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Upload, Settings,
  LogOut, Pill, ChevronLeft, Menu, TrendingUp, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, getStoredUser } from '@/lib/api';

const distributorNav = [
  { href: '/distributor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/distributor/catalog', label: 'My Catalog', icon: Package },
  { href: '/distributor/orders', label: 'Incoming Orders', icon: ShoppingCart },
  { href: '/distributor/upload', label: 'Upload Products', icon: Upload },
  { href: '/distributor/settings', label: 'Settings', icon: Settings },
];

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    // Distributor roles only
    const distributorRoles = ['distributor_admin', 'warehouse_staff', 'sales_rep', 'super_admin'];
    if (!distributorRoles.includes(user.role)) {
      router.replace('/dashboard');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-elevated border border-surface-200"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="w-5 h-5 text-surface-600" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-surface-200 transition-all duration-300 flex flex-col w-[260px]',
          'max-lg:translate-x-[-100%]',
          !collapsed && 'max-lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-100 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-surface-900 tracking-tight">PharmaOS</div>
            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Distributor Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {distributorNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/distributor' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isActive
                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'sidebar-link',
                )}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-surface-100">
          <button
            onClick={() => authApi.logout()}
            className="sidebar-link w-full text-danger-500 hover:text-danger-600 hover:bg-danger-500/5"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-[260px] min-h-screen">{children}</main>
    </div>
  );
}
