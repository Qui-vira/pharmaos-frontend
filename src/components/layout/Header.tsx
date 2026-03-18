'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { authApi, notificationsApi, getStoredUser } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { Notification } from '@/types';

export default function Header({ title }: { title: string }) {
  const user = getStoredUser();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsError, setNotifsError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    pharmacy_admin: 'Pharmacy Admin',
    cashier: 'Cashier',
    pharmacist: 'Pharmacist',
    distributor_admin: 'Distributor Admin',
    warehouse_staff: 'Warehouse Staff',
    sales_rep: 'Sales Rep',
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setNotifsLoading(true);
    setNotifsError(null);
    try {
      const data = await notificationsApi.list();
      setNotifications(data.items);
      setUnreadCount(data.items.filter((n) => !n.is_read).length);
    } catch (err: any) {
      setNotifsError(err.message || 'Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifsLoading(false);
    }
  };

  // Fetch on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* non-critical */ }
    finally { setMarkingAllRead(false); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* non-critical */ }
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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-surface-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-danger-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-elevated border border-surface-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-surface-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markingAllRead}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  >
                    {markingAllRead ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifsLoading ? (
                  <div className="py-8 text-center text-sm text-surface-400">Loading...</div>
                ) : notifsError ? (
                  <div className="py-8 text-center text-sm text-danger-500">{notifsError}</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-surface-400">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-surface-100 hover:bg-surface-50 transition-colors',
                        !n.is_read && 'bg-brand-50/30',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />}
                        <div className={cn(!n.is_read ? '' : 'ml-4')}>
                          <p className="text-sm font-medium text-surface-800">{n.title}</p>
                          {n.body && <p className="text-xs text-surface-400 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-surface-300 mt-1">{formatRelativeTime(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-2 pl-3 border-l border-surface-200 hover:bg-surface-50 rounded-lg pr-2 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-700">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-surface-800">{user?.full_name || 'User'}</div>
              <div className="text-xs text-surface-400">{roleLabels[user?.role || ''] || user?.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-elevated border border-surface-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-semibold text-surface-800">{user?.full_name}</p>
                <p className="text-xs text-surface-400">{user?.email}</p>
              </div>
              <button
                onClick={() => authApi.logout()}
                className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-500/5 transition-colors flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
