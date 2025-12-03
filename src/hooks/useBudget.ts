import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi, budgetsApi, type FixedExpense, type BudgetCategory } from "@/lib/tauri";

// ============================================
// FIXED EXPENSES
// ============================================
export function useFixedExpenses() {
  return useQuery({
    queryKey: ["fixed-expenses"],
    queryFn: expensesApi.getExpenses,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.deleteExpense,
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
    queryFn: budgetsApi.getBudgets,
  });
}

export function useCreateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetsApi.createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });
}

export function useDeleteBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetsApi.deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });
}

// ============================================
// HELPERS
// ============================================
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

export function useBudgetSummary() {
  const { data: expenses, isLoading: expensesLoading } = useFixedExpenses();
  const { data: budgets, isLoading: budgetsLoading } = useBudgetCategories();

  const activeExpenses = (expenses || []).filter((e) => e.is_active);

  const totalFixedExpenses = activeExpenses.reduce(
    (sum, e) => sum + toMonthlyAmount(e.amount, e.frequency),
    0
  );

  const totalBudgets = (budgets || []).reduce((sum, b) => sum + b.monthly_limit, 0);

  // Group expenses by category
  const expensesByCategory = activeExpenses.reduce((acc, e) => {
    const monthlyAmount = toMonthlyAmount(e.amount, e.frequency);
    acc[e.category] = (acc[e.category] || 0) + monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  return {
    expenses: expenses || [],
    budgets: budgets || [],
    totalFixedExpenses,
    totalBudgets,
    expensesByCategory,
    isLoading: expensesLoading || budgetsLoading,
    toMonthlyAmount,
  };
}

// ============================================
// EXPENSE CATEGORIES CONSTANTS
// ============================================
export const FIXED_EXPENSE_CATEGORIES = [
  { value: "housing", label: "Bydlení", icon: "🏠" },
  { value: "utilities", label: "Energie a služby", icon: "💡" },
  { value: "insurance", label: "Pojištění", icon: "🛡️" },
  { value: "loans", label: "Splátky a půjčky", icon: "💳" },
  { value: "subscriptions", label: "Předplatné", icon: "📺" },
  { value: "transport", label: "Doprava", icon: "🚗" },
  { value: "communication", label: "Telefon a internet", icon: "📱" },
  { value: "childcare", label: "Děti a vzdělávání", icon: "👶" },
  { value: "other", label: "Ostatní", icon: "📦" },
];

export const BUDGET_CATEGORY_TYPES = [
  { value: "food", label: "Jídlo a potraviny", icon: "🛒", color: "#F97316" },
  { value: "entertainment", label: "Zábava", icon: "🎬", color: "#EC4899" },
  { value: "clothing", label: "Oblečení", icon: "👕", color: "#8B5CF6" },
  { value: "health", label: "Zdraví", icon: "💊", color: "#10B981" },
  { value: "personal", label: "Osobní výdaje", icon: "🧴", color: "#06B6D4" },
  { value: "gifts", label: "Dárky", icon: "🎁", color: "#F43F5E" },
  { value: "education", label: "Vzdělávání", icon: "📚", color: "#6366F1" },
  { value: "savings", label: "Úspory a rezerva", icon: "🏦", color: "#22C55E" },
  { value: "vacation", label: "Dovolená", icon: "✈️", color: "#0EA5E9" },
  { value: "pets", label: "Domácí mazlíčci", icon: "🐕", color: "#A855F7" },
  { value: "other", label: "Ostatní", icon: "📦", color: "#6B7280" },
];

