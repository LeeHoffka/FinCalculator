import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { householdApi, type HouseholdMember, type MemberIncome } from "@/lib/tauri";

// ============================================
// MEMBERS
// ============================================
export function useMembers() {
  return useQuery({
    queryKey: ["household-members"],
    queryFn: householdApi.getMembers,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: householdApi.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof householdApi.updateMember>[1] }) =>
      householdApi.updateMember(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: householdApi.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

// ============================================
// INCOMES
// ============================================
export function useMemberIncomes(memberId: number | undefined) {
  return useQuery({
    queryKey: ["member-incomes", memberId],
    queryFn: () => householdApi.getIncomes(memberId!),
    enabled: !!memberId,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: householdApi.createIncome,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-incomes", variables.member_id] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      queryClient.invalidateQueries({ queryKey: ["member-incomes"] });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof householdApi.updateIncome>[1] }) =>
      householdApi.updateIncome(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: householdApi.deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

// ============================================
// COMBINED DATA
// ============================================
export interface MemberWithIncomes {
  member: HouseholdMember;
  incomes: MemberIncome[];
  totalMonthlyIncome: number;
}

// Helper to convert frequency to monthly
const toMonthlyAmount = (amount: number, frequency: string): number => {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
};

export function useMembersWithIncomes() {
  const { data: members, isLoading: membersLoading, error: membersError } = useMembers();

  // We'll fetch incomes for all members in the component
  // This is a simplified approach - in production you might want to batch this

  return {
    members: members || [],
    isLoading: membersLoading,
    error: membersError,
    toMonthlyAmount,
  };
}

