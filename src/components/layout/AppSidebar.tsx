'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  LayoutDashboard, Package, AlertTriangle, TrendingUp, BarChart3,
  ShoppingCart, Store, MessageSquare, Bell, Settings, LogOut,
  Pill, Menu, X, Users, ShoppingBag, Video, Camera, QrCode, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, getStoredUser } from '@/lib/api';
import { useSidebarStore } from '@/stores/sidebarStore';
import type { LucideIcon } from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 260;

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

const pharmacyNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS', icon: ShoppingBag },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/expiry', label: 'Expiry Alerts', icon: AlertTriangle },
  { href: '/sales', label: 'Sales & Analytics', icon: TrendingUp },
  { href: '/analytics', label: 'Predictions', icon: BarChart3 },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/suppliers', label: 'Supplier Catalog', icon: Store },
  { href: '/consultations', label: 'Consultations', icon: MessageSquare },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/share', label: 'Patient QR', icon: QrCode },
  { href: '/telepharmacy', label: 'Telepharmacy', icon: Video },
  { href: '/snap-to-stock', label: 'Snap to Stock', icon: Camera },
];

const distributorNav: NavItem[] = [
  { href: '/distributor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/distributor/catalog', label: 'My Catalog', icon: Package },
  { href: '/distributor/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/distributor/upload', label: 'Bulk Upload', icon: Upload },
  { href: '/distributor/settings', label: 'Settings', icon: Settings },
];

// ─── Animation Variants ─────────────────────────────────────────────────────

const labelVariants: Variants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.15, delay: 0.05 } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.1 } },
};

const mobileBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const mobileSidebarVariants: Variants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '-100%', transition: { duration: 0.2 } },
};

// ─── Shared Sidebar Content ─────────────────────────────────────────────────

function SidebarContent({
  nav,
  pathname,
  expanded,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-100 dark:border-surface-800 flex-shrink-0">
        <motion.div
          className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0"
          whileHover={{ rotate: 15, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Pill className="w-4 h-4 text-white" />
        </motion.div>
        <AnimatePresence mode="wait">
          {expanded && (
            <motion.div
              key="logo-text"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="font-extrabold text-sm text-surface-900 dark:text-surface-50 tracking-tight">
                PharmaOS
              </div>
              <div className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                AI Platform
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 h-10 rounded-lg text-[13px] font-medium transition-colors duration-150',
                expanded ? 'px-3' : 'justify-center px-0',
                isActive
                  ? 'bg-brand-50/80 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100',
              )}
              title={!expanded ? item.label : undefined}
            >
              {/* Active indicator — left border */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-600 dark:bg-brand-400"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <Icon className="w-[18px] h-[18px] flex-shrink-0" />

              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.span
                    key={item.label}
                    variants={labelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {expanded && item.badge && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-surface-100 dark:border-surface-800 space-y-1">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 h-10 rounded-lg text-[13px] font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors duration-150',
            expanded ? 'px-3' : 'justify-center px-0',
          )}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.span
                key="settings-label"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={() => authApi.logout()}
          className={cn(
            'flex items-center gap-3 h-10 w-full rounded-lg text-[13px] font-medium text-danger-500 dark:text-danger-400 hover:bg-danger-500/5 dark:hover:bg-danger-500/10 hover:text-danger-600 dark:hover:text-danger-300 transition-colors duration-150',
            expanded ? 'px-3' : 'justify-center px-0',
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.span
                key="logout-label"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AppSidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const { mobileOpen, closeMobile, toggleMobile } = useSidebarStore();
  const user = getStoredUser();

  const isDistributor =
    user?.role === 'distributor_admin' ||
    user?.role === 'warehouse_staff' ||
    user?.role === 'sales_rep';
  const nav = isDistributor ? distributorNav : pharmacyNav;
  const expanded = hovered;

  return (
    <>
      {/* ── Desktop sidebar (hover-to-expand) ───────────────────────────── */}
      <motion.aside
        className="hidden lg:flex fixed top-0 left-0 z-40 h-screen bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex-col overflow-hidden"
        initial={false}
        animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <SidebarContent nav={nav} pathname={pathname} expanded={expanded} />
      </motion.aside>

      {/* ── Mobile sidebar (slide-in overlay) ───────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              variants={mobileBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={closeMobile}
              aria-hidden="true"
            />

            {/* Sidebar panel */}
            <motion.aside
              key="mobile-sidebar"
              variants={mobileSidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden fixed top-0 left-0 z-50 h-screen bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col overflow-hidden"
              style={{ width: EXPANDED_WIDTH }}
            >
              <SidebarContent
                nav={nav}
                pathname={pathname}
                expanded
                onNavigate={closeMobile}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
