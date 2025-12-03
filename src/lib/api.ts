import { invoke } from "@tauri-apps/api/core";

// ============================================
// Types
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
  active: boolean;
}

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

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  day_of_month?: number;
  assigned_to?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

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

// ============================================
// Check if running in Tauri
// ============================================

const isTauri = () => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

// ============================================
// Household Members API
// ============================================

export const membersApi = {
  getAll: async (): Promise<HouseholdMember[]> => {
    if (!isTauri()) return [];
    return invoke<HouseholdMember[]>("get_household_members");
  },

  create: async (data: { name: string; color?: string; avatar?: string }): Promise<HouseholdMember> => {
    return invoke<HouseholdMember>("create_household_member", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_household_member", { id });
  },
};

// ============================================
// Member Incomes API
// ============================================

export const incomesApi = {
  getByMember: async (memberId: number): Promise<MemberIncome[]> => {
    if (!isTauri()) return [];
    return invoke<MemberIncome[]>("get_member_incomes", { memberId });
  },

  create: async (data: {
    member_id: number;
    name: string;
    amount: number;
    frequency?: string;
    day_of_month?: number;
    account_id?: number;
  }): Promise<MemberIncome> => {
    return invoke<MemberIncome>("create_member_income", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_member_income", { id });
  },
};

// ============================================
// Banks API
// ============================================

export const banksApi = {
  getAll: async (): Promise<Bank[]> => {
    if (!isTauri()) return [];
    return invoke<Bank[]>("get_banks");
  },

  create: async (data: { name: string; color?: string; logo?: string; notes?: string }): Promise<Bank> => {
    return invoke<Bank>("create_bank", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_bank", { id });
  },
};

// ============================================
// Accounts API
// ============================================

export const accountsApi = {
  getAll: async (): Promise<BankAccount[]> => {
    if (!isTauri()) return [];
    return invoke<BankAccount[]>("get_accounts");
  },

  create: async (data: {
    name: string;
    account_type: string;
    bank_id?: number;
    owner_user_id?: number;
    account_number?: string;
    currency?: string;
    is_premium?: boolean;
    premium_min_flow?: number;
  }): Promise<BankAccount> => {
    return invoke<BankAccount>("create_account", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_account", { id });
  },
};

// ============================================
// Scheduled Transfers API
// ============================================

export const transfersApi = {
  getAll: async (): Promise<ScheduledTransfer[]> => {
    if (!isTauri()) return [];
    return invoke<ScheduledTransfer[]>("get_scheduled_transfers");
  },

  create: async (data: {
    name: string;
    from_account_id: number;
    to_account_id: number;
    amount: number;
    day_of_month: number;
    description?: string;
    category?: string;
  }): Promise<ScheduledTransfer> => {
    return invoke<ScheduledTransfer>("create_scheduled_transfer", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_scheduled_transfer", { id });
  },
};

// ============================================
// Fixed Expenses API
// ============================================

export const expensesApi = {
  getAll: async (): Promise<FixedExpense[]> => {
    if (!isTauri()) return [];
    return invoke<FixedExpense[]>("get_fixed_expenses");
  },

  create: async (data: {
    name: string;
    amount: number;
    category: string;
    frequency?: string;
    day_of_month?: number;
    assigned_to?: string;
    notes?: string;
  }): Promise<FixedExpense> => {
    return invoke<FixedExpense>("create_fixed_expense", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_fixed_expense", { id });
  },
};

// ============================================
// Budget Categories API
// ============================================

export const budgetsApi = {
  getAll: async (): Promise<BudgetCategory[]> => {
    if (!isTauri()) return [];
    return invoke<BudgetCategory[]>("get_budget_categories");
  },

  create: async (data: {
    name: string;
    budget_type: string;
    monthly_limit: number;
    color?: string;
    icon?: string;
    assigned_to?: string;
  }): Promise<BudgetCategory> => {
    return invoke<BudgetCategory>("create_budget_category", { input: data });
  },

  delete: async (id: number): Promise<void> => {
    return invoke("delete_budget_category", { id });
  },
};

// ============================================
// Backup API
// ============================================

export const backupApi = {
  exportToFile: async (path: string): Promise<void> => {
    return invoke("save_backup_to_file", { path });
  },

  importFromFile: async (path: string): Promise<void> => {
    return invoke("import_from_backup_file", { path });
  },

  exportFull: async () => {
    return invoke("export_full_backup");
  },
};

