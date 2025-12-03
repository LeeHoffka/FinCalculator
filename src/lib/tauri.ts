import { invoke as tauriInvoke } from "@tauri-apps/api/core";

// Check if we're running in Tauri (v2)
const isTauri = () => {
  if (typeof window === "undefined") return false;
  
  // Try multiple detection methods for Tauri v2
  const win = window as any;
  const hasTauri = 
    win.__TAURI_INTERNALS__ !== undefined ||
    win.__TAURI__ !== undefined ||
    win.__TAURI_METADATA__ !== undefined;
  
  // Log for debugging
  if (!hasTauri) {
    console.log("[Tauri Detection] Not in Tauri environment, using mock data");
  }
  
  return hasTauri;
};

// In-memory mock storage for browser development
const mockStorage = {
  members: [] as HouseholdMember[],
  incomes: [] as MemberIncome[],
  banks: [] as Bank[],
  accounts: [] as BankAccount[],
  transfers: [] as ScheduledTransfer[],
  expenses: [] as FixedExpense[],
  budgets: [] as BudgetCategory[],
  nextId: 1,
};

// Generic invoke wrapper with mock fallback
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    console.log(`[Tauri] Calling: ${cmd}`, args);
    try {
      const result = await tauriInvoke<T>(cmd, args);
      console.log(`[Tauri] Result for ${cmd}:`, result);
      return result;
    } catch (error) {
      console.error(`[Tauri] Error in ${cmd}:`, error);
      throw error;
    }
  }
  
  // Mock implementations for browser development
  console.log(`[Mock] ${cmd}`, args);
  return handleMockCommand<T>(cmd, args);
}

function handleMockCommand<T>(cmd: string, args?: Record<string, unknown>): T {
  const id = mockStorage.nextId++;
  
  switch (cmd) {
    // Household Members
    case "get_household_members":
      return mockStorage.members as T;
    case "create_household_member": {
      const input = args?.input as { name: string; color?: string };
      const member: HouseholdMember = {
        id,
        name: input.name,
        color: input.color || "#3B82F6",
      };
      mockStorage.members.push(member);
      return member as T;
    }
    case "delete_household_member": {
      const memberId = args?.id as number;
      mockStorage.members = mockStorage.members.filter((m) => m.id !== memberId);
      mockStorage.incomes = mockStorage.incomes.filter((i) => i.member_id !== memberId);
      return undefined as T;
    }

    // Member Incomes
    case "get_member_incomes": {
      const memberId = args?.memberId as number;
      return mockStorage.incomes.filter((i) => i.member_id === memberId) as T;
    }
    case "get_all_incomes":
      return mockStorage.incomes as T;
    case "create_member_income": {
      const input = args?.input as Omit<MemberIncome, "id">;
      const income: MemberIncome = { id, ...input, is_active: true };
      mockStorage.incomes.push(income);
      return income as T;
    }
    case "delete_member_income": {
      const incomeId = args?.id as number;
      mockStorage.incomes = mockStorage.incomes.filter((i) => i.id !== incomeId);
      return undefined as T;
    }

    // Banks
    case "get_banks":
      return mockStorage.banks as T;
    case "create_bank": {
      const input = args?.input as { name: string; short_name?: string; color?: string };
      const bank: Bank = {
        id,
        name: input.name,
        short_name: input.short_name,
        color: input.color || "#10B981",
        active: true,
      };
      mockStorage.banks.push(bank);
      return bank as T;
    }
    case "delete_bank": {
      const bankId = args?.id as number;
      mockStorage.banks = mockStorage.banks.filter((b) => b.id !== bankId);
      mockStorage.accounts = mockStorage.accounts.filter((a) => a.bank_id !== bankId);
      return undefined as T;
    }

    // Accounts
    case "get_accounts":
      return mockStorage.accounts as T;
    case "create_account": {
      const input = args?.input as Partial<BankAccount>;
      const account: BankAccount = {
        id,
        name: input.name || "",
        account_type: input.account_type || "checking",
        bank_id: input.bank_id,
        owner_user_id: input.owner_user_id,
        account_number: input.account_number,
        currency: input.currency || "CZK",
        initial_balance: input.initial_balance || 0,
        current_balance: input.current_balance || input.initial_balance || 0,
        is_premium: input.is_premium || false,
        premium_min_flow: input.premium_min_flow,
        credit_limit: input.credit_limit,
        active: true,
      };
      mockStorage.accounts.push(account);
      return account as T;
    }
    case "delete_account": {
      const accountId = args?.id as number;
      mockStorage.accounts = mockStorage.accounts.filter((a) => a.id !== accountId);
      mockStorage.transfers = mockStorage.transfers.filter(
        (t) => t.from_account_id !== accountId && t.to_account_id !== accountId
      );
      return undefined as T;
    }

    // Scheduled Transfers
    case "get_scheduled_transfers":
      return mockStorage.transfers as T;
    case "create_scheduled_transfer": {
      const input = args?.input as Omit<ScheduledTransfer, "id" | "display_order" | "is_active">;
      const transfer: ScheduledTransfer = {
        id,
        ...input,
        display_order: mockStorage.transfers.length + 1,
        is_active: true,
      };
      mockStorage.transfers.push(transfer);
      return transfer as T;
    }
    case "delete_scheduled_transfer": {
      const transferId = args?.id as number;
      mockStorage.transfers = mockStorage.transfers.filter((t) => t.id !== transferId);
      return undefined as T;
    }

    // Fixed Expenses
    case "get_fixed_expenses":
      return mockStorage.expenses as T;
    case "create_fixed_expense": {
      const input = args?.input as Omit<FixedExpense, "id" | "is_active">;
      const expense: FixedExpense = { id, ...input, is_active: true };
      mockStorage.expenses.push(expense);
      return expense as T;
    }
    case "delete_fixed_expense": {
      const expenseId = args?.id as number;
      mockStorage.expenses = mockStorage.expenses.filter((e) => e.id !== expenseId);
      return undefined as T;
    }

    // Budget Categories
    case "get_budget_categories":
      return mockStorage.budgets as T;
    case "create_budget_category": {
      const input = args?.input as Omit<BudgetCategory, "id">;
      const budget: BudgetCategory = { id, ...input };
      mockStorage.budgets.push(budget);
      return budget as T;
    }
    case "delete_budget_category": {
      const budgetId = args?.id as number;
      mockStorage.budgets = mockStorage.budgets.filter((b) => b.id !== budgetId);
      return undefined as T;
    }

    // Backup
    case "export_full_backup":
      return {
        version: "1.0.0",
        created_at: new Date().toISOString(),
        data: {
          household_members: mockStorage.members.map((m) => ({
            member: m,
            incomes: mockStorage.incomes.filter((i) => i.member_id === m.id),
          })),
          banks: mockStorage.banks.map((b) => ({
            bank: b,
            accounts: mockStorage.accounts.filter((a) => a.bank_id === b.id),
          })),
          scheduled_transfers: mockStorage.transfers,
          fixed_expenses: mockStorage.expenses,
          budget_categories: mockStorage.budgets,
        },
      } as T;

    default:
      console.warn(`[Mock] Unknown command: ${cmd}`);
      return [] as T;
  }
}

// ============================================
// HOUSEHOLD MEMBERS
// ============================================
export interface HouseholdMember {
  id: number;
  name: string;
  color: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemberIncome {
  id: number;
  member_id: number;
  name: string;
  amount: number;
  frequency: string;
  day_of_month?: number;
  account_id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const householdApi = {
  getMembers: () => invoke<HouseholdMember[]>("get_household_members"),
  createMember: (input: { name: string; color?: string; avatar?: string }) =>
    invoke<HouseholdMember>("create_household_member", { input }),
  updateMember: (id: number, input: { name: string; color?: string; avatar?: string }) =>
    invoke<HouseholdMember>("update_household_member", { id, input }),
  deleteMember: (id: number) => invoke<void>("delete_household_member", { id }),

  getIncomes: (memberId: number) => invoke<MemberIncome[]>("get_member_incomes", { memberId }),
  createIncome: (input: {
    member_id: number;
    name: string;
    amount: number;
    frequency?: string;
    day_of_month?: number;
    account_id?: number;
  }) => invoke<MemberIncome>("create_member_income", { input }),
  updateIncome: (id: number, input: {
    name: string;
    amount: number;
    frequency?: string;
    day_of_month?: number;
    account_id?: number;
  }) => invoke<MemberIncome>("update_member_income", { id, input }),
  deleteIncome: (id: number) => invoke<void>("delete_member_income", { id }),
};

// ============================================
// BANKS & ACCOUNTS
// ============================================
export interface Bank {
  id: number;
  name: string;
  short_name?: string;
  logo?: string;
  color: string;
  notes?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BankAccount {
  id: number;
  name: string;
  account_type: string;
  bank_id?: number;
  owner_user_id?: number;
  account_number?: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  color?: string;
  icon?: string;
  is_premium: boolean;
  premium_min_flow?: number;
  credit_limit?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const banksApi = {
  getBanks: () => invoke<Bank[]>("get_banks", { active_only: true }),
  createBank: (input: { name: string; short_name?: string; logo?: string; color?: string; notes?: string }) =>
    invoke<Bank>("create_bank", { input }),
  deleteBank: (id: number) => invoke<void>("delete_bank", { id }),
};

export const accountsApi = {
  getAccounts: () => invoke<BankAccount[]>("get_accounts", { active_only: true }),
  createAccount: (input: {
    name: string;
    account_type: string;
    bank_id?: number;
    owner_user_id?: number;
    account_number?: string;
    currency?: string;
    initial_balance?: number;
    color?: string;
    is_premium?: boolean;
    premium_min_flow?: number;
    credit_limit?: number;
  }) => invoke<BankAccount>("create_account", { input }),
  updateAccount: (id: number, input: {
    name: string;
    account_type: string;
    bank_id: number;
    owner_user_id?: number;
    account_number?: string;
    currency?: string;
    color?: string;
    is_premium?: boolean;
    premium_min_flow?: number;
    credit_limit?: number;
    current_balance?: number;
    active?: boolean;
  }) => invoke<BankAccount>("update_account", { id, input }),
  deleteAccount: (id: number) => invoke<void>("delete_account", { id }),
};

// ============================================
// SCHEDULED TRANSFERS
// ============================================
export interface ScheduledTransfer {
  id: number;
  name: string;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  day_of_month: number;
  description?: string;
  category?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const transfersApi = {
  getTransfers: () => invoke<ScheduledTransfer[]>("get_scheduled_transfers"),
  createTransfer: (input: {
    name: string;
    from_account_id: number;
    to_account_id: number;
    amount: number;
    day_of_month: number;
    description?: string;
    category?: string;
  }) => invoke<ScheduledTransfer>("create_scheduled_transfer", { input }),
  updateTransfer: (id: number, input: {
    name: string;
    from_account_id: number;
    to_account_id: number;
    amount: number;
    day_of_month: number;
    description?: string;
    category?: string;
  }) => invoke<ScheduledTransfer>("update_scheduled_transfer", { id, input }),
  deleteTransfer: (id: number) => invoke<void>("delete_scheduled_transfer", { id }),
};

// ============================================
// INCOMES (ALL)
// ============================================
export const incomesApi = {
  getIncomes: () => invoke<MemberIncome[]>("get_all_incomes"),
};

// ============================================
// FIXED EXPENSES
// ============================================
export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  day_of_month?: number;
  account_id?: number;
  assigned_to?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const expensesApi = {
  getExpenses: () => invoke<FixedExpense[]>("get_fixed_expenses"),
  createExpense: (input: {
    name: string;
    amount: number;
    category: string;
    frequency?: string;
    day_of_month?: number;
    account_id?: number;
    assigned_to?: string;
    notes?: string;
  }) => invoke<FixedExpense>("create_fixed_expense", { input }),
  updateExpense: (id: number, input: {
    name: string;
    amount: number;
    category: string;
    frequency?: string;
    day_of_month?: number;
    account_id?: number;
    assigned_to?: string;
    notes?: string;
  }) => invoke<FixedExpense>("update_fixed_expense", { id, input }),
  deleteExpense: (id: number) => invoke<void>("delete_fixed_expense", { id }),
};

// ============================================
// BUDGET CATEGORIES
// ============================================
export interface BudgetCategory {
  id: number;
  name: string;
  budget_type: string;
  monthly_limit: number;
  color: string;
  icon?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export const budgetsApi = {
  getBudgets: () => invoke<BudgetCategory[]>("get_budget_categories"),
  createBudget: (input: {
    name: string;
    budget_type: string;
    monthly_limit: number;
    color?: string;
    icon?: string;
    assigned_to?: string;
  }) => invoke<BudgetCategory>("create_budget_category", { input }),
  deleteBudget: (id: number) => invoke<void>("delete_budget_category", { id }),
};

// ============================================
// BACKUP
// ============================================
export interface FullBackup {
  version: string;
  created_at: string;
  data: {
    household_members: Array<{
      member: HouseholdMember;
      incomes: MemberIncome[];
    }>;
    banks: Array<{
      bank: Bank;
      accounts: BankAccount[];
    }>;
    scheduled_transfers: ScheduledTransfer[];
    fixed_expenses: FixedExpense[];
    budget_categories: BudgetCategory[];
  };
}

export const backupApi = {
  exportFull: () => invoke<FullBackup>("export_full_backup"),
  saveToFile: (path: string) => invoke<void>("save_backup_to_file", { path }),
  importFromFile: (path: string) => invoke<void>("import_from_backup_file", { path }),
};

// ============================================
// FINANCIAL GOALS & FUNDS
// ============================================
export interface FinancialGoal {
  id: number;
  name: string;
  goal_type: "weekly_variable" | "fund" | "yearly_goal";
  icon?: string;
  color?: string;
  // Pro weekly_variable
  weekly_amount?: number;
  day_of_week?: number; // 0=Po, 1=Út, 2=St, 3=Čt, 4=Pá, 5=So, 6=Ne
  // Pro fund
  monthly_contribution?: number;
  current_balance?: number;
  // Pro yearly_goal
  yearly_amount?: number;
  target_month?: number; // 1-12
  current_saved?: number; // Kolik už mám naspořeno
  // Společné
  account_id?: number;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyPlan {
  id: number;
  goal_id: number;
  year: number;
  month: number;
  planned_count: number;
  realized_count: number;
  planned_amount: number;
  realized_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FundWithdrawal {
  id: number;
  goal_id: number;
  amount: number;
  description?: string;
  date: string;
  created_at?: string;
}

export const goalsApi = {
  getGoals: () => invoke<FinancialGoal[]>("get_financial_goals"),
  createGoal: (input: {
    name: string;
    goal_type: string;
    icon?: string;
    color?: string;
    weekly_amount?: number;
    day_of_week?: number;
    monthly_contribution?: number;
    current_balance?: number;
    yearly_amount?: number;
    target_month?: number;
    current_saved?: number;
    account_id?: number;
    notes?: string;
  }) => invoke<FinancialGoal>("create_financial_goal", { input }),
  updateGoal: (id: number, input: {
    name: string;
    goal_type: string;
    icon?: string;
    color?: string;
    weekly_amount?: number;
    day_of_week?: number;
    monthly_contribution?: number;
    current_balance?: number;
    yearly_amount?: number;
    target_month?: number;
    current_saved?: number;
    account_id?: number;
    notes?: string;
    is_active: boolean;
  }) => invoke<FinancialGoal>("update_financial_goal", { id, input }),
  deleteGoal: (id: number) => invoke<void>("delete_financial_goal", { id }),
  // Fund operations
  addContribution: (goalId: number, amount: number) => 
    invoke<FinancialGoal>("add_fund_contribution", { goal_id: goalId, amount }),
  createWithdrawal: (input: {
    goal_id: number;
    amount: number;
    description?: string;
    date?: string;
  }) => invoke<FundWithdrawal>("create_fund_withdrawal", { input }),
  getWithdrawals: (goalId: number) => 
    invoke<FundWithdrawal[]>("get_fund_withdrawals", { goal_id: goalId }),
  // Monthly plans
  getMonthlyPlan: (goalId: number, year: number, month: number) =>
    invoke<MonthlyPlan | null>("get_monthly_plan", { goalId, year, month }),
  updateMonthlyPlan: (
    goalId: number,
    year: number,
    month: number,
    plannedCount: number,
    realizedCount: number,
    plannedAmount: number,
    realizedAmount: number,
    notes?: string
  ) => invoke<MonthlyPlan>("create_or_update_monthly_plan", {
    goalId, 
    year, 
    month,
    plannedCount,
    realizedCount,
    plannedAmount,
    realizedAmount,
    notes
  }),
  getMonthlyPlansHistory: (goalId: number, limit?: number) =>
    invoke<MonthlyPlan[]>("get_monthly_plans_history", { goalId, limit }),
};
