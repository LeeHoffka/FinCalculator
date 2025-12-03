import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { banksApi } from "@/lib/tauri";
import type { CreateBankInput, UpdateBankInput } from "@/types";

export function useBanks(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ["banks", activeOnly],
    queryFn: () => banksApi.getAll(activeOnly),
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBankInput) => banksApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBankInput }) =>
      banksApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => banksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

