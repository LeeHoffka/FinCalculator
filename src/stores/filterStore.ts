import { create } from "zustand";
import type { TransactionFilters } from "@/types";
import { getCurrentMonth } from "@/utils/date";

interface FilterState {
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  setDateRange: (startDate: string, endDate: string) => void;
}

const { start, end } = getCurrentMonth();

const defaultFilters: TransactionFilters = {
  start_date: start,
  end_date: end,
};

export const useFilterStore = create<FilterState>()((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setDateRange: (start_date, end_date) =>
    set((state) => ({
      filters: { ...state.filters, start_date, end_date },
    })),
}));

