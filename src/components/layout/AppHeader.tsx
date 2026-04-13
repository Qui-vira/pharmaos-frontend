'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  Command,
  Sun,
  Moon,
} from 'lucide-react';
import { authApi, getStoredUser } from '@/lib/api';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { formatRelativeTime, cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  pharmacy_admin: 'Pharmacy Admin',
  cashier: 'Cashier',
  pharmacist: 'Pharmacist',
  distributor_admin: 'Distributor Admin',
  warehouse_staff: 'Warehouse Staff',
  sales_rep: 'Sales Rep',
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.1, ease: 'easeIn' as const } },
};

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/inventory': 'Inventory',
  '/expiry': 'Expiry Alerts',
  '/sales': 'Sales & Analytics',
  '/analytics': 'Predictions',
  '/orders': 'Orders',
  '/suppliers': 'Supplier Catalog',
  '/consultations': 'Consultations',
  '/reminders': 'Reminders',
  '/patients': 'Patients',
  '/share': 'Patient QR',
  '/telepharmacy': 'Telepharmacy',
  '/snap-to-stock': 'Snap to Stock',
  '/settings': 'Settings',
  '/distributor': 'Distributor Dashboard',
  '/distributor/catalog': 'My Catalog',
  '/distributor/orders': 'Incoming Orders',
  '/distributor/upload': 'Upload Products',
  '/distributor/settings': 'Settings',
};

export default function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'PharmaOS';
  const user = getStoredUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Stores
  const {
    notifications,
    unreadCount,
    isLoading: notifsLoading,
    fetch: fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  const toggleMobile = useSidebarStore((s) => s.toggleMobile);

  // Hydration guard for theme icon
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications on mount and poll every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
    await markAllRead();
  };

  const handleMarkRead = async (id: string) => {
    await markRead(id);
  };

  return (
    <header
      className={cn(
        'h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30',
        'backdrop-blur-xl bg-white/70 dark:bg-surface-900/70',
        'border-b border-surface-200 dark:border-surface-700',
      )}
    >
      {/* Left: mobile menu toggle + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command palette trigger */}
        <button
          className={cn(
            'hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-56 transition-colors',
            'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
            'hover:border-surface-300 dark:hover:border-surface-600',
            'text-surface-400 dark:text-surface-500',
          )}
          aria-label="Open command palette"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-surface-200 dark:border-surface-600 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 text-[10px] font-medium text-surface-400 dark:text-surface-500">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )
          ) : (
            <Sun className="w-5 h-5 opacity-0" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-danger-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  'absolute right-0 top-12 w-80 rounded-xl shadow-elevated overflow-hidden z-50',
                  'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                )}
              >
                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-surface-900 dark:text-surface-50">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifsLoading ? (
                    <div className="py-8 text-center text-sm text-surface-400 dark:text-surface-500">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-surface-400 dark:text-surface-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) handleMarkRead(n.id);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-surface-100 dark:border-surface-700 transition-colors',
                          'hover:bg-surface-50 dark:hover:bg-surface-700/50',
                          !n.is_read && 'bg-brand-50/30 dark:bg-brand-500/5',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.is_read && (
                            <span className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                          )}
                          <div className={cn(!n.is_read ? '' : 'ml-4')}>
                            <p className="text-sm font-medium text-surface-800 dark:text-surface-100">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">
                              {formatRelativeTime(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifs(false);
            }}
            className={cn(
              'flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg transition-colors',
              'border-l border-surface-200 dark:border-surface-700',
              'hover:bg-surface-50 dark:hover:bg-surface-800',
            )}
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                {user?.full_name || 'User'}
              </div>
              <div className="text-xs text-surface-400 dark:text-surface-500">
                {roleLabels[user?.role || ''] || user?.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  'absolute right-0 top-12 w-48 rounded-xl shadow-elevated overflow-hidden z-50',
                  'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
                )}
              >
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => authApi.logout()}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors',
                    'text-danger-600 dark:text-danger-400 hover:bg-danger-500/5 dark:hover:bg-danger-500/10',
                  )}
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
