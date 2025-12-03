// ============================================
// USER TYPES
// ============================================
export interface User {
  id: number;
  name: string;
  color: string;
  avatar?: string;
  role: "admin" | "member";
  is_shared_user: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  color?: string;
  avatar?: string;
  role?: "admin" | "member";
}

export interface UpdateUserInput {
  name: string;
  color: string;
  avatar?: string;
  role: "admin" | "member";
  active: boolean;
}

// ============================================
// BANK TYPES
// ============================================
export interface Bank {
  id: number;
  name: string;
  logo?: string;
  color: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankInput {
  name: string;
  logo?: string;
  color?: string;
  notes?: string;
}

export interface UpdateBankInput {
  name: string;
  logo?: string;
  color: string;
  notes?: string;
  active: boolean;
}

// ============================================
// ACCOUNT TYPES
// ============================================
export type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "investment"
  | "cash"
  | "other";

export interface Account {
  id: number;
  name: string;
  account_type: AccountType;
  bank_id?: number;
  owner_user_id?: number;
  account_number?: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  color?: string;
  icon?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields
  bank?: Bank;
  owner?: User;
}

export interface CreateAccountInput {
  name: string;
  account_type: AccountType;
  bank_id?: number;
  owner_user_id?: number;
  account_number?: string;
  currency: string;
  initial_balance: number;
  color?: string;
  icon?: string;
}

export interface UpdateAccountInput {
  name: string;
  account_type: AccountType;
  bank_id?: number;
  owner_user_id?: number;
  account_number?: string;
  currency: string;
  color?: string;
  icon?: string;
  active: boolean;
}

// ============================================
// CATEGORY TYPES
// ============================================
export type CategoryType = "income" | "expense" | "both";

export interface Category {
  id: number;
  name: string;
  parent_category_id?: number;
  icon?: string;
  color: string;
  category_type: CategoryType;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  // For tree structure
  children?: Category[];
}

export interface CreateCategoryInput {
  name: string;
  parent_category_id?: number;
  icon?: string;
  color?: string;
  category_type: CategoryType;
}

export interface UpdateCategoryInput {
  name: string;
  parent_category_id?: number;
  icon?: string;
  color: string;
  category_type: CategoryType;
}

// ============================================
// TAG TYPES
// ============================================
export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

// ============================================
// TRANSACTION TYPES
// ============================================
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "planned" | "completed" | "cancelled";

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  currency: string;
  transaction_type: TransactionType;
  from_account_id?: number;
  to_account_id?: number;
  category_id?: number;
  description?: string;
  owner_user_id?: number;
  is_shared: boolean;
  status: TransactionStatus;
  recurring_payment_id?: number;
  flow_group_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Populated
  from_account?: Account;
  to_account?: Account;
  category?: Category;
  owner?: User;
  tags?: Tag[];
}

export interface CreateTransactionInput {
  date: string;
  amount: number;
  currency?: string;
  transaction_type: TransactionType;
  from_account_id?: number;
  to_account_id?: number;
  category_id?: number;
  description?: string;
  owner_user_id?: number;
  is_shared?: boolean;
  status?: TransactionStatus;
  notes?: string;
}

export interface UpdateTransactionInput {
  date: string;
  amount: number;
  currency: string;
  transaction_type: TransactionType;
  from_account_id?: number;
  to_account_id?: number;
  category_id?: number;
  description?: string;
  owner_user_id?: number;
  is_shared: boolean;
  status: TransactionStatus;
  notes?: string;
}

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  user_ids?: number[];
  account_ids?: number[];
  bank_ids?: number[];
  category_ids?: number[];
  tag_ids?: number[];
  types?: TransactionType[];
  statuses?: TransactionStatus[];
  min_amount?: number;
  max_amount?: number;
  search_query?: string;
}

// ============================================
// RECURRING PAYMENT TYPES
// ============================================
export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export interface RecurringPayment {
  id: number;
  name: string;
  amount: number;
  currency: string;
  frequency: RecurringFrequency;
  frequency_value: number;
  day_of_period?: number;
  account_id: number;
  category_id?: number;
  description?: string;
  active: boolean;
  next_execution_date?: string;
  last_execution_date?: string;
  created_at: string;
  updated_at: string;
  // Populated
  account?: Account;
  category?: Category;
}

export interface CreateRecurringPaymentInput {
  name: string;
  amount: number;
  currency?: string;
  frequency: RecurringFrequency;
  frequency_value?: number;
  day_of_period?: number;
  account_id: number;
  category_id?: number;
  description?: string;
}

export interface UpdateRecurringPaymentInput {
  name: string;
  amount: number;
  currency: string;
  frequency: RecurringFrequency;
  frequency_value: number;
  day_of_period?: number;
  account_id: number;
  category_id?: number;
  description?: string;
  active: boolean;
}

// ============================================
// FLOW GROUP TYPES
// ============================================
export interface FlowGroup {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  // Populated
  transactions?: Transaction[];
}

export interface CreateFlowGroupInput {
  name: string;
  description?: string;
  color?: string;
  is_template?: boolean;
}

export interface UpdateFlowGroupInput {
  name: string;
  description?: string;
  color: string;
  is_template: boolean;
}

// ============================================
// SAVINGS GOAL TYPES
// ============================================
export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline?: string;
  account_id?: number;
  auto_deposit_amount?: number;
  auto_deposit_frequency?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Populated
  account?: Account;
  // Calculated
  progress_percentage?: number;
  remaining_amount?: number;
  months_remaining?: number;
}

export interface CreateSavingsGoalInput {
  name: string;
  target_amount: number;
  currency?: string;
  deadline?: string;
  account_id?: number;
  auto_deposit_amount?: number;
  auto_deposit_frequency?: string;
}

export interface UpdateSavingsGoalInput {
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline?: string;
  account_id?: number;
  auto_deposit_amount?: number;
  auto_deposit_frequency?: string;
  active: boolean;
}

// ============================================
// SETTINGS TYPES
// ============================================
export interface Settings {
  default_currency: string;
  fiscal_month_start: number;
  date_format: string;
  language: string;
  theme: "light" | "dark" | "system";
}

// ============================================
// REPORT TYPES
// ============================================
export interface MonthlySummary {
  month: string;
  total_income: number;
  total_expense: number;
  net_change: number;
  by_category: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  category_color: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

// ============================================
// SHARED EXPENSE TYPES
// ============================================
export interface SharedExpenseSplit {
  id: number;
  transaction_id: number;
  user_id: number;
  amount: number;
  percentage?: number;
  created_at: string;
  user?: User;
}

// ============================================
// CREDIT CARD CONFIG TYPES
// ============================================
export interface CreditCardConfig {
  account_id: number;
  billing_day: number;
  payment_count: number;
  payment_days: number[];
  statement_period_days: number;
  created_at: string;
  updated_at: string;
}

