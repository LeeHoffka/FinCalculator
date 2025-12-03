import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersApi, type ScheduledTransfer } from "@/lib/tauri";

export function useScheduledTransfers() {
  return useQuery({
    queryKey: ["scheduled-transfers"],
    queryFn: transfersApi.getTransfers,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfersApi.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfersApi.deleteTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

// ============================================
// TIMELINE HELPERS
// ============================================
export interface TransfersByDay {
  day: number;
  transfers: ScheduledTransfer[];
  total: number;
}

export function useTransfersTimeline() {
  const { data: transfers, isLoading } = useScheduledTransfers();

  const timeline: TransfersByDay[] = [];
  const activeTransfers = (transfers || []).filter((t) => t.is_active);

  // Group by day
  const days = [...new Set(activeTransfers.map((t) => t.day_of_month))].sort((a, b) => a - b);

  for (const day of days) {
    const dayTransfers = activeTransfers
      .filter((t) => t.day_of_month === day)
      .sort((a, b) => a.display_order - b.display_order);

    timeline.push({
      day,
      transfers: dayTransfers,
      total: dayTransfers.reduce((sum, t) => sum + t.amount, 0),
    });
  }

  const totalAmount = activeTransfers.reduce((sum, t) => sum + t.amount, 0);

  return {
    transfers: transfers || [],
    timeline,
    totalAmount,
    isLoading,
  };
}

