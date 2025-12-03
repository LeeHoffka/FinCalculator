import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { banksApi, accountsApi, type Bank, type BankAccount } from "@/lib/tauri";

// ============================================
// BANKS
// ============================================
export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      console.log("[useBanks] Fetching banks...");
      try {
        const result = await banksApi.getBanks();
        console.log("[useBanks] Got banks:", result);
        return result;
      } catch (error) {
        console.error("[useBanks] ERROR:", error);
        throw error;
      }
    },
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: banksApi.createBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: banksApi.deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

// ============================================
// ACCOUNTS
// ============================================
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      console.log("[useAccounts] Fetching accounts...");
      const result = await accountsApi.getAccounts();
      console.log("[useAccounts] Got accounts:", result);
      return result;
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof accountsApi.updateAccount>[1] }) =>
      accountsApi.updateAccount(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

// ============================================
// COMBINED
// ============================================
export interface BankWithAccounts {
  bank: Bank;
  accounts: BankAccount[];
}

export function useBanksWithAccounts() {
  const { data: banks, isLoading: banksLoading } = useBanks();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const banksWithAccounts: BankWithAccounts[] = (banks || []).map((bank) => ({
    bank,
    accounts: (accounts || []).filter((acc) => acc.bank_id === bank.id),
  }));

  return {
    banksWithAccounts,
    banks: banks || [],
    accounts: accounts || [],
    isLoading: banksLoading || accountsLoading,
  };
}

