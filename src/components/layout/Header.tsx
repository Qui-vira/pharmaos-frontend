'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { getStoredUser } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Header({ title }: { title: string }) {
  const user = getStoredUser();
  const [showNotifs, setShowNotifs] = useState(false);

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    pharmacy_admin: 'Pharmacy Admin',
    cashier: 'Cashier',
    pharmacist: 'Pharmacist',
    distributor_admin: 'Distributor Admin',
    warehouse_staff: 'Warehouse Staff',
    sales_rep: 'Sales Rep',
  };

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-surface-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-surface-400"
          />
        </div>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-surface-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-3 border-l border-surface-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-surface-800">{user?.full_name || 'User'}</div>
            <div className="text-xs text-surface-400">{roleLabels[user?.role || ''] || user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
