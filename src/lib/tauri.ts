import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Bank,
  CreateBankInput,
  UpdateBankInput,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  Tag,
  CreateTagInput,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  RecurringPayment,
  CreateRecurringPaymentInput,
  UpdateRecurringPaymentInput,
  FlowGroup,
  CreateFlowGroupInput,
  UpdateFlowGroupInput,
  SavingsGoal,
  CreateSavingsGoalInput,
  UpdateSavingsGoalInput,
  MonthlySummary,
  CategoryBreakdown,
  CashFlowData,
} from "@/types";

// Check if running in Tauri
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// Dynamic import of Tauri API
let invokeFunction: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

if (isTauri) {
  // Running in Tauri - use real invoke
  import("@tauri-apps/api/core").then((module) => {
    invokeFunction = module.invoke;
  });
} else {
  // Running in browser - use mock
  console.warn("Tauri API not available - using mock data for development");
}

// Mock invoke for browser development
async function mockInvoke<T>(cmd: string, _args?: Record<string, unknown>): Promise<T> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return mock data based on command
  const mockData: Record<string, unknown> = {
    get_users: [
      {
        id: 1,
        name: "Společné",
        color: "#9333EA",
        avatar: null,
        role: "member",
        is_shared_user: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as User[],
    get_banks: [
      {
        id: 1,
        name: "Česká spořitelna",
        logo: null,
        color: "#0066b3",
        notes: "Hlavní banka",
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Raiffeisenbank",
        logo: null,
        color: "#ffcc00",
        notes: null,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as Bank[],
    get_accounts: [
      {
        id: 1,
        name: "Běžný účet",
        account_type: "checking",
        bank_id: 1,
        owner_user_id: null,
        account_number: "123456789/0800",
        currency: "CZK",
        initial_balance: 50000,
        current_balance: 45230.5,
        color: "#3B82F6",
        icon: "💳",
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Spořicí účet",
        account_type: "savings",
        bank_id: 1,
        owner_user_id: null,
        account_number: "987654321/0800",
        currency: "CZK",
        initial_balance: 100000,
        current_balance: 125000,
        color: "#10B981",
        icon: "🏦",
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Hotovost",
        account_type: "cash",
        bank_id: null,
        owner_user_id: null,
        account_number: null,
        currency: "CZK",
        initial_balance: 5000,
        current_balance: 3500,
        color: "#F59E0B",
        icon: "💵",
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as Account[],
    get_categories: [
      { id: 1, name: "Příjem", icon: "💰", color: "#10B981", category_type: "income", is_system: true, parent_category_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: "Výdaj", icon: "💸", color: "#EF4444", category_type: "expense", is_system: true, parent_category_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: "Převod", icon: "🔄", color: "#3B82F6", category_type: "both", is_system: true, parent_category_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, name: "Potraviny", icon: "🛒", color: "#F97316", category_type: "expense", is_system: false, parent_category_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 5, name: "Doprava", icon: "🚗", color: "#8B5CF6", category_type: "expense", is_system: false, parent_category_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 6, name: "Zábava", icon: "🎬", color: "#EC4899", category_type: "expense", is_system: false, parent_category_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 7, name: "Plat", icon: "💼", color: "#10B981", category_type: "income", is_system: false, parent_category_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ] as Category[],
    get_category_tree: [
      { 
        id: 1, name: "Příjem", icon: "💰", color: "#10B981", category_type: "income", is_system: true, parent_category_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        children: [
          { id: 7, name: "Plat", icon: "💼", color: "#10B981", category_type: "income", is_system: false, parent_category_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), children: [] },
        ]
      },
      { 
        id: 2, name: "Výdaj", icon: "💸", color: "#EF4444", category_type: "expense", is_system: true, parent_category_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        children: [
          { id: 4, name: "Potraviny", icon: "🛒", color: "#F97316", category_type: "expense", is_system: false, parent_category_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), children: [] },
          { id: 5, name: "Doprava", icon: "🚗", color: "#8B5CF6", category_type: "expense", is_system: false, parent_category_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), children: [] },
          { id: 6, name: "Zábava", icon: "🎬", color: "#EC4899", category_type: "expense", is_system: false, parent_category_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), children: [] },
        ]
      },
      { id: 3, name: "Převod", icon: "🔄", color: "#3B82F6", category_type: "both", is_system: true, parent_category_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), children: [] },
    ] as Category[],
    get_transactions: [
      { id: 1, date: "2024-12-01", amount: 35000, currency: "CZK", transaction_type: "income", from_account_id: null, to_account_id: 1, category_id: 7, description: "Výplata", owner_user_id: null, is_shared: false, status: "completed", recurring_payment_id: null, flow_group_id: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, date: "2024-12-02", amount: 1250, currency: "CZK", transaction_type: "expense", from_account_id: 1, to_account_id: null, category_id: 4, description: "Nákup v Albertu", owner_user_id: null, is_shared: false, status: "completed", recurring_payment_id: null, flow_group_id: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, date: "2024-12-02", amount: 450, currency: "CZK", transaction_type: "expense", from_account_id: 1, to_account_id: null, category_id: 5, description: "Benzín", owner_user_id: null, is_shared: false, status: "completed", recurring_payment_id: null, flow_group_id: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, date: "2024-12-03", amount: 350, currency: "CZK", transaction_type: "expense", from_account_id: 3, to_account_id: null, category_id: 6, description: "Kino", owner_user_id: null, is_shared: false, status: "completed", recurring_payment_id: null, flow_group_id: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 5, date: "2024-12-03", amount: 5000, currency: "CZK", transaction_type: "transfer", from_account_id: 1, to_account_id: 2, category_id: 3, description: "Převod na spoření", owner_user_id: null, is_shared: false, status: "completed", recurring_payment_id: null, flow_group_id: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ] as Transaction[],
    get_tags: [] as Tag[],
    get_recurring_payments: [] as RecurringPayment[],
    get_flow_groups: [] as FlowGroup[],
    get_savings_goals: [] as SavingsGoal[],
    get_monthly_summary: {
      month: "2024-12",
      total_income: 35000,
      total_expense: 7050,
      net_change: 27950,
      by_category: [
        { category_id: 4, category_name: "Potraviny", category_color: "#F97316", amount: 1250, percentage: 17.7, transaction_count: 1 },
        { category_id: 5, category_name: "Doprava", category_color: "#8B5CF6", amount: 450, percentage: 6.4, transaction_count: 1 },
        { category_id: 6, category_name: "Zábava", category_color: "#EC4899", amount: 350, percentage: 5.0, transaction_count: 1 },
        { category_id: 3, category_name: "Převod", category_color: "#3B82F6", amount: 5000, percentage: 70.9, transaction_count: 1 },
      ],
    } as MonthlySummary,
    get_category_breakdown: [
      { category_id: 4, category_name: "Potraviny", category_color: "#F97316", amount: 1250, percentage: 17.7, transaction_count: 1 },
      { category_id: 5, category_name: "Doprava", category_color: "#8B5CF6", amount: 450, percentage: 6.4, transaction_count: 1 },
      { category_id: 6, category_name: "Zábava", category_color: "#EC4899", amount: 350, percentage: 5.0, transaction_count: 1 },
    ] as CategoryBreakdown[],
    get_cash_flow_data: [
      { date: "2024-12-01", income: 35000, expense: 0, balance: 35000 },
      { date: "2024-12-02", income: 0, expense: 1700, balance: 33300 },
      { date: "2024-12-03", income: 0, expense: 350, balance: 32950 },
    ] as CashFlowData[],
  };

  return (mockData[cmd] ?? null) as T;
}

// Invoke wrapper that uses either real Tauri or mock
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri && invokeFunction) {
    return invokeFunction(cmd, args);
  }
  return mockInvoke<T>(cmd, args);
}

// ============================================
// USERS API
// ============================================
export const usersApi = {
  create: (input: CreateUserInput) => invoke<User>("create_user", { input }),
  getAll: (activeOnly: boolean = true) =>
    invoke<User[]>("get_users", { activeOnly }),
  update: (id: number, input: UpdateUserInput) =>
    invoke<User>("update_user", { id, input }),
  delete: (id: number) => invoke<void>("delete_user", { id }),
};

// ============================================
// BANKS API
// ============================================
export const banksApi = {
  create: (input: CreateBankInput) => invoke<Bank>("create_bank", { input }),
  getAll: (activeOnly: boolean = true) =>
    invoke<Bank[]>("get_banks", { activeOnly }),
  update: (id: number, input: UpdateBankInput) =>
    invoke<Bank>("update_bank", { id, input }),
  delete: (id: number) => invoke<void>("delete_bank", { id }),
};

// ============================================
// ACCOUNTS API
// ============================================
export const accountsApi = {
  create: (input: CreateAccountInput) =>
    invoke<Account>("create_account", { input }),
  getAll: (activeOnly: boolean = true) =>
    invoke<Account[]>("get_accounts", { activeOnly }),
  getById: (id: number) => invoke<Account>("get_account_by_id", { id }),
  update: (id: number, input: UpdateAccountInput) =>
    invoke<Account>("update_account", { id, input }),
  delete: (id: number) => invoke<void>("delete_account", { id }),
  getBalance: (id: number) => invoke<number>("get_account_balance", { id }),
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesApi = {
  create: (input: CreateCategoryInput) =>
    invoke<Category>("create_category", { input }),
  getAll: () => invoke<Category[]>("get_categories"),
  getTree: () => invoke<Category[]>("get_category_tree"),
  update: (id: number, input: UpdateCategoryInput) =>
    invoke<Category>("update_category", { id, input }),
  delete: (id: number) => invoke<void>("delete_category", { id }),
};

// ============================================
// TAGS API
// ============================================
export const tagsApi = {
  create: (input: CreateTagInput) => invoke<Tag>("create_tag", { input }),
  getAll: () => invoke<Tag[]>("get_tags"),
  addToTransaction: (transactionId: number, tagId: number) =>
    invoke<void>("add_tag_to_transaction", { transactionId, tagId }),
  removeFromTransaction: (transactionId: number, tagId: number) =>
    invoke<void>("remove_tag_from_transaction", { transactionId, tagId }),
};

// ============================================
// TRANSACTIONS API
// ============================================
export const transactionsApi = {
  create: (input: CreateTransactionInput) =>
    invoke<Transaction>("create_transaction", { input }),
  getAll: () => invoke<Transaction[]>("get_transactions"),
  getById: (id: number) => invoke<Transaction>("get_transaction_by_id", { id }),
  update: (id: number, input: UpdateTransactionInput) =>
    invoke<Transaction>("update_transaction", { id, input }),
  delete: (id: number) => invoke<void>("delete_transaction", { id }),
  getFiltered: (filters: TransactionFilters) =>
    invoke<Transaction[]>("get_transactions_filtered", { filters }),
};

// ============================================
// RECURRING PAYMENTS API
// ============================================
export const recurringApi = {
  create: (input: CreateRecurringPaymentInput) =>
    invoke<RecurringPayment>("create_recurring_payment", { input }),
  getAll: () => invoke<RecurringPayment[]>("get_recurring_payments"),
  update: (id: number, input: UpdateRecurringPaymentInput) =>
    invoke<RecurringPayment>("update_recurring_payment", { id, input }),
  delete: (id: number) => invoke<void>("delete_recurring_payment", { id }),
  process: () => invoke<void>("process_recurring_payments"),
};

// ============================================
// FLOW GROUPS API
// ============================================
export const flowsApi = {
  create: (input: CreateFlowGroupInput) =>
    invoke<FlowGroup>("create_flow_group", { input }),
  getAll: () => invoke<FlowGroup[]>("get_flow_groups"),
  update: (id: number, input: UpdateFlowGroupInput) =>
    invoke<FlowGroup>("update_flow_group", { id, input }),
  delete: (id: number) => invoke<void>("delete_flow_group", { id }),
  addTransaction: (flowId: number, transactionId: number) =>
    invoke<void>("add_transaction_to_flow", { flowId, transactionId }),
  removeTransaction: (flowId: number, transactionId: number) =>
    invoke<void>("remove_transaction_from_flow", { flowId, transactionId }),
};

// ============================================
// SAVINGS GOALS API
// ============================================
export const goalsApi = {
  create: (input: CreateSavingsGoalInput) =>
    invoke<SavingsGoal>("create_savings_goal", { input }),
  getAll: () => invoke<SavingsGoal[]>("get_savings_goals"),
  update: (id: number, input: UpdateSavingsGoalInput) =>
    invoke<SavingsGoal>("update_savings_goal", { id, input }),
  delete: (id: number) => invoke<void>("delete_savings_goal", { id }),
};

// ============================================
// BACKUP API
// ============================================
export const backupApi = {
  exportDatabase: (path: string) =>
    invoke<void>("export_database", { path }),
  importDatabase: (path: string) =>
    invoke<void>("import_database", { path }),
  exportTransactionsCsv: (path: string, filters?: TransactionFilters) =>
    invoke<void>("export_transactions_csv", { path, filters }),
};

// ============================================
// REPORTS API
// ============================================
export const reportsApi = {
  getMonthlySummary: (year: number, month: number) =>
    invoke<MonthlySummary>("get_monthly_summary", { year, month }),
  getCategoryBreakdown: (startDate: string, endDate: string) =>
    invoke<CategoryBreakdown[]>("get_category_breakdown", { startDate, endDate }),
  getCashFlowData: (startDate: string, endDate: string) =>
    invoke<CashFlowData[]>("get_cash_flow_data", { startDate, endDate }),
};
