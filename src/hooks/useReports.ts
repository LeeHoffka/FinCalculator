import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/tauri";

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: ["reports", "monthly", year, month],
    queryFn: () => reportsApi.getMonthlySummary(year, month),
  });
}

export function useCategoryBreakdown(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "categoryBreakdown", startDate, endDate],
    queryFn: () => reportsApi.getCategoryBreakdown(startDate, endDate),
  });
}

export function useCashFlowData(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "cashFlow", startDate, endDate],
    queryFn: () => reportsApi.getCashFlowData(startDate, endDate),
  });
}

