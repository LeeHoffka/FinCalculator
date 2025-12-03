import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi, type FinancialGoal } from "@/lib/tauri";

// ============================================
// QUERIES
// ============================================

export function useFinancialGoals() {
  return useQuery({
    queryKey: ["financial-goals"],
    queryFn: () => goalsApi.getGoals(),
  });
}

export function useFundWithdrawals(goalId: number) {
  return useQuery({
    queryKey: ["fund-withdrawals", goalId],
    queryFn: () => goalsApi.getWithdrawals(goalId),
    enabled: !!goalId,
  });
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof goalsApi.updateGoal>[1] }) =>
      goalsApi.updateGoal(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
    },
  });
}

export function useAddContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: number; amount: number }) =>
      goalsApi.addContribution(goalId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
    },
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.createWithdrawal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["fund-withdrawals", variables.goal_id] });
    },
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const DAY_NAMES = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
const MONTH_NAMES = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", 
                     "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || "Neznámý";
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "Neznámý";
}

/**
 * Spočítá kolik daných dnů v týdnu je v daném měsíci
 */
export function countWeekdaysInMonth(year: number, month: number, dayOfWeek: number): number {
  // month je 1-12, dayOfWeek je 0=Po, 1=Út...
  // JavaScript Date: 0=Ne, 1=Po, 2=Út...
  const jsDayOfWeek = (dayOfWeek + 1) % 7; // Konverze na JS formát
  
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  let count = 0;
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === jsDayOfWeek) {
      count++;
    }
  }
  return count;
}

/**
 * Spočítá doporučenou měsíční částku pro variabilní výdaj
 */
export function calculateWeeklyRecommendation(
  weeklyAmount: number,
  dayOfWeek: number,
  year?: number,
  month?: number
): { count: number; total: number; monthName: string } {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  
  const count = countWeekdaysInMonth(y, m, dayOfWeek);
  const total = count * weeklyAmount;
  const monthName = getMonthName(m);
  
  return { count, total, monthName };
}

/**
 * Spočítá kolik měsíců zbývá do cílového měsíce a doporučenou měsíční částku
 * Zohledňuje již naspořenou částku (currentSaved)
 */
export function calculateYearlyGoalRecommendation(
  yearlyAmount: number,
  targetMonth: number,
  currentSaved: number = 0
): { monthsRemaining: number; monthlyAmount: number; targetMonthName: string; remaining: number; progress: number } {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  let monthsRemaining: number;
  
  if (targetMonth > currentMonth) {
    // Cílový měsíc je ještě tento rok
    monthsRemaining = targetMonth - currentMonth;
  } else if (targetMonth === currentMonth) {
    // Jsme v cílovém měsíci
    monthsRemaining = 0;
  } else {
    // Cílový měsíc je příští rok
    monthsRemaining = (12 - currentMonth) + targetMonth;
  }
  
  const remaining = Math.max(0, yearlyAmount - currentSaved);
  const monthlyAmount = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
  const targetMonthName = getMonthName(targetMonth);
  const progress = yearlyAmount > 0 ? (currentSaved / yearlyAmount) * 100 : 0;
  
  return { monthsRemaining, monthlyAmount, targetMonthName, remaining, progress };
}

// ============================================
// COMPOSITE HOOK
// ============================================

export function useGoalsSummary() {
  const { data: goals, isLoading } = useFinancialGoals();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Výpočet doporučení pro tento měsíc
  const recommendations = (goals || []).map((goal) => {
    if (goal.goal_type === "weekly_variable" && goal.weekly_amount && goal.day_of_week !== undefined) {
      const rec = calculateWeeklyRecommendation(goal.weekly_amount, goal.day_of_week, currentYear, currentMonth);
      return {
        goal,
        type: "weekly" as const,
        recommended: rec.total,
        detail: `${rec.count}× ${getDayName(goal.day_of_week)} v ${rec.monthName}`,
      };
    }
    
    if (goal.goal_type === "fund" && goal.monthly_contribution) {
      return {
        goal,
        type: "fund" as const,
        recommended: goal.monthly_contribution,
        detail: `Zůstatek fondu: ${goal.current_balance?.toFixed(0) || 0} Kč`,
      };
    }
    
    if (goal.goal_type === "yearly_goal" && goal.yearly_amount && goal.target_month) {
      const rec = calculateYearlyGoalRecommendation(goal.yearly_amount, goal.target_month, goal.current_saved || 0);
      return {
        goal,
        type: "yearly" as const,
        recommended: rec.monthlyAmount,
        detail: rec.monthsRemaining > 0 
          ? `${rec.monthsRemaining} měsíců do ${rec.targetMonthName} (${rec.progress.toFixed(0)}% naspořeno)` 
          : `Splatné v ${rec.targetMonthName}!`,
        progress: rec.progress,
        remaining: rec.remaining,
      };
    }
    
    return { goal, type: "unknown" as const, recommended: 0, detail: "" };
  });
  
  const totalRecommended = recommendations.reduce((sum, r) => sum + r.recommended, 0);
  
  return {
    goals: goals || [],
    recommendations,
    totalRecommended,
    isLoading,
  };
}

