import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/tauri";
import type { CreateAccountInput, UpdateAccountInput } from "@/types";

export function useAccounts(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ["accounts", activeOnly],
    queryFn: () => accountsApi.getAll(activeOnly),
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => accountsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAccountInput }) =>
      accountsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.id] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useAccountBalance(id: number) {
  return useQuery({
    queryKey: ["accountBalance", id],
    queryFn: () => accountsApi.getBalance(id),
    enabled: !!id,
  });
}

