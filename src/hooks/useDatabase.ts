import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  membersApi,
  incomesApi,
  banksApi,
  accountsApi,
  transfersApi,
  expensesApi,
  budgetsApi,
} from "@/lib/api";

// ============================================
// HOUSEHOLD MEMBERS
// ============================================

export function useHouseholdMembers() {
  return useQuery({
    queryKey: ["household-members"],
    queryFn: membersApi.getAll,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: membersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      queryClient.invalidateQueries({ queryKey: ["member-incomes"] });
    },
  });
}

// ============================================
// MEMBER INCOMES
// ============================================

export function useMemberIncomes(memberId: number) {
  return useQuery({
    queryKey: ["member-incomes", memberId],
    queryFn: () => incomesApi.getByMember(memberId),
    enabled: !!memberId,
  });
}

export function useAllIncomes(memberIds: number[]) {
  return useQuery({
    queryKey: ["all-incomes", memberIds],
    queryFn: async () => {
      const results = await Promise.all(
        memberIds.map((id) => incomesApi.getByMember(id))
      );
      return results.flat();
    },
    enabled: memberIds.length > 0,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incomesApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-incomes", variables.member_id] });
      queryClient.invalidateQueries({ queryKey: ["all-incomes"] });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incomesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["all-incomes"] });
    },
  });
}

// ============================================
// BANKS
// ============================================

export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: banksApi.getAll,
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: banksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: banksApi.delete,
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
    queryFn: accountsApi.getAll,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

// ============================================
// SCHEDULED TRANSFERS
// ============================================

export function useScheduledTransfers() {
  return useQuery({
    queryKey: ["scheduled-transfers"],
    queryFn: transfersApi.getAll,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

// ============================================
// FIXED EXPENSES
// ============================================

export function useFixedExpenses() {
  return useQuery({
    queryKey: ["fixed-expenses"],
    queryFn: expensesApi.getAll,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
    },
  });
}

// ============================================
// BUDGET CATEGORIES
// ============================================

export function useBudgetCategories() {
  return useQuery({
    queryKey: ["budget-categories"],
    queryFn: budgetsApi.getAll,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });
}

// ============================================
// COMPUTED / SUMMARY
// ============================================

export function useBudgetSummary() {
  const { data: members = [] } = useHouseholdMembers();
  const { data: expenses = [] } = useFixedExpenses();
  const { data: budgets = [] } = useBudgetCategories();
  const memberIds = members.map((m) => m.id);
  const { data: incomes = [] } = useAllIncomes(memberIds);

  // Convert frequency to monthly
  const toMonthly = (amount: number, frequency: string): number => {
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

  // Calculate totals
  const totalMonthlyIncome = incomes
    .filter((i) => i.is_active)
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);

  const totalFixedExpenses = expenses
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);

  const totalBudgets = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);

  const remaining = totalMonthlyIncome - totalFixedExpenses - totalBudgets;

  // Income by member
  const incomeByMember = members.map((member) => {
    const memberIncomes = incomes.filter((i) => i.member_id === member.id && i.is_active);
    const amount = memberIncomes.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);
    return {
      memberId: member.id,
      name: member.name,
      color: member.color,
      amount,
    };
  });

  return {
    totalMonthlyIncome,
    totalFixedExpenses,
    totalBudgets,
    remaining,
    incomeByMember,
    members,
    expenses,
    budgets,
    incomes,
  };
}

