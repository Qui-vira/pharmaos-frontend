'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, AlertTriangle, TrendingUp,
  ShoppingCart, Store, MessageSquare, Bell, Settings, LogOut,
  ChevronLeft, Pill, Menu, Users, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, getStoredUser } from '@/lib/api';

const pharmacyNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/expiry', label: 'Expiry Alerts', icon: AlertTriangle },
  { href: '/sales', label: 'Sales & Analytics', icon: TrendingUp },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/suppliers', label: 'Supplier Catalog', icon: Store },
  { href: '/consultations', label: 'Consultations', icon: MessageSquare },
  { href: '/reminders', label: 'Reminders', icon: Bell },
];

const distributorNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'My Catalog', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const user = getStoredUser();

  const isDistributor = user?.role === 'distributor_admin' || user?.role === 'warehouse_staff' || user?.role === 'sales_rep';
  const nav = isDistributor ? distributorNav : pharmacyNav;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-elevated border border-surface-200"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="w-5 h-5 text-surface-600" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-surface-200 transition-all duration-300 flex flex-col',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          'max-lg:translate-x-[-100%]',
          !collapsed && 'max-lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-100 flex-shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Pill className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="font-extrabold text-sm text-surface-900 tracking-tight">PharmaOS</div>
              <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest">AI Platform</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isActive ? 'sidebar-link-active' : 'sidebar-link',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-surface-100 space-y-1">
          <Link
            href="/settings"
            className={cn('sidebar-link', collapsed && 'justify-center px-0')}
          >
            <Settings className="w-[18px] h-[18px]" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={() => authApi.logout()}
            className={cn(
              'sidebar-link w-full text-danger-500 hover:text-danger-600 hover:bg-danger-500/5',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center py-2 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
      </aside>
    </>
  );
}
