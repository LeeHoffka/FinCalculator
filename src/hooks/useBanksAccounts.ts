import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { banksApi, accountsApi, type Bank, type BankAccount } from "@/lib/tauri";

// ============================================
// BANKS
// ============================================
export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: banksApi.getBanks,
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
    queryFn: accountsApi.getAccounts,
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

