// ============================================
// INCOME TYPES (Příjmy uživatelů)
// ============================================
export interface Income {
  id: string;
  userId: string;
  name: string; // "Výplata", "Brigáda", "Důchod"
  amount: number;
  frequency: "monthly" | "weekly" | "biweekly" | "yearly";
  dayOfMonth?: number; // Den v měsíci kdy přichází (1-31)
  accountId?: string; // ID účtu kam příjem přichází
  isActive: boolean;
}

// ============================================
// HOUSEHOLD MEMBER (Člen domácnosti)
// ============================================
export interface HouseholdMember {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  incomes: Income[];
  createdAt: string;
}

// ============================================
// FIXED EXPENSE (Stálé výdaje)
// ============================================
export type FixedExpenseCategory =
  | "housing" // Bydlení (nájem, hypotéka)
  | "utilities" // Energie, voda, plyn
  | "insurance" // Pojištění
  | "loans" // Splátky, půjčky
  | "subscriptions" // Předplatné (Netflix, Spotify)
  | "transport" // Doprava (MHD, leasing)
  | "communication" // Telefon, internet
  | "childcare" // Školka, kroužky
  | "other";

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: FixedExpenseCategory;
  frequency: "monthly" | "quarterly" | "yearly";
  dayOfMonth?: number;
  assignedTo?: string; // ID uživatele nebo "shared"
  isActive: boolean;
  notes?: string;
}

// ============================================
// BUDGET CATEGORY (Rozpočtové kategorie)
// ============================================
export type BudgetCategoryType =
  | "food" // Jídlo a potraviny
  | "entertainment" // Zábava
  | "clothing" // Oblečení
  | "health" // Zdraví, léky
  | "personal" // Osobní výdaje
  | "gifts" // Dárky
  | "education" // Vzdělávání
  | "savings" // Úspory, rezerva
  | "vacation" // Dovolená
  | "pets" // Domácí mazlíčci
  | "other";

export interface BudgetCategory {
  id: string;
  name: string;
  type: BudgetCategoryType;
  monthlyLimit: number;
  color: string;
  icon: string;
  assignedTo?: string; // ID uživatele nebo "shared"
}

// ============================================
// BUDGET SUMMARY (Souhrn rozpočtu)
// ============================================
export interface BudgetSummary {
  totalMonthlyIncome: number;
  totalFixedExpenses: number;
  totalBudgets: number;
  remaining: number;
  incomeByUser: { userId: string; name: string; amount: number }[];
  fixedExpensesByCategory: { category: FixedExpenseCategory; amount: number }[];
}

// ============================================
// CONSTANTS
// ============================================
export const FIXED_EXPENSE_CATEGORIES: {
  value: FixedExpenseCategory;
  label: string;
  icon: string;
}[] = [
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

export const BUDGET_CATEGORIES: {
  value: BudgetCategoryType;
  label: string;
  icon: string;
  defaultColor: string;
}[] = [
  { value: "food", label: "Jídlo a potraviny", icon: "🛒", defaultColor: "#F97316" },
  { value: "entertainment", label: "Zábava", icon: "🎬", defaultColor: "#EC4899" },
  { value: "clothing", label: "Oblečení", icon: "👕", defaultColor: "#8B5CF6" },
  { value: "health", label: "Zdraví", icon: "💊", defaultColor: "#10B981" },
  { value: "personal", label: "Osobní výdaje", icon: "🧴", defaultColor: "#06B6D4" },
  { value: "gifts", label: "Dárky", icon: "🎁", defaultColor: "#F43F5E" },
  { value: "education", label: "Vzdělávání", icon: "📚", defaultColor: "#6366F1" },
  { value: "savings", label: "Úspory a rezerva", icon: "🏦", defaultColor: "#22C55E" },
  { value: "vacation", label: "Dovolená", icon: "✈️", defaultColor: "#0EA5E9" },
  { value: "pets", label: "Domácí mazlíčci", icon: "🐕", defaultColor: "#A855F7" },
  { value: "other", label: "Ostatní", icon: "📦", defaultColor: "#6B7280" },
];

