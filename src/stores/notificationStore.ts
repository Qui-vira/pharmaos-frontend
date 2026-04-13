import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationsApi } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  /** Fetch notifications from the API */
  fetch: () => Promise<void>;

  /** Mark a single notification as read */
  markRead: (id: string) => Promise<void>;

  /** Mark all notifications as read */
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.list();
      const notifications = res.items;
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    try {
      await notificationsApi.markRead(id);
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      );
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch {
      // silently fail — next fetch will reconcile
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead();
      const notifications = get().notifications.map((n) => ({ ...n, is_read: true }));
      set({ notifications, unreadCount: 0 });
    } catch {
      // silently fail
    }
  },
}));
