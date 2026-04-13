import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;

  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,

      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
      closeMobile: () => set({ mobileOpen: false }),
    }),
    {
      name: 'pharmaos-sidebar',
      // Only persist collapsed state, not mobileOpen (transient UI state)
      partialize: (state) => ({ collapsed: state.collapsed }),
    },
  ),
);
