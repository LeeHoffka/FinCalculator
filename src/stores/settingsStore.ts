import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  theme: "light" | "dark" | "system";
  defaultCurrency: string;
  dateFormat: string;
  language: string;
  sidebarCollapsed: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setDefaultCurrency: (currency: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      defaultCurrency: "CZK",
      dateFormat: "DD.MM.YYYY",
      language: "cs",
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "finance-settings",
    }
  )
);

