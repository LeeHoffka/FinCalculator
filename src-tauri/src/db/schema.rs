pub const SCHEMA: &str = r#"
-- ============================================
-- MIGRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    version INTEGER NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS (Dynamické uživatelé)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    is_shared_user INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- ============================================
-- BANKS (Uživatelsky definované banky)
-- ============================================
CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    color TEXT NOT NULL DEFAULT '#10B981',
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banks_active ON banks(active);

-- ============================================
-- ACCOUNTS (Variabilní účty)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    bank_id INTEGER,
    owner_user_id INTEGER,
    account_number TEXT,
    currency TEXT NOT NULL DEFAULT 'CZK',
    initial_balance REAL NOT NULL DEFAULT 0.0,
    current_balance REAL NOT NULL DEFAULT 0.0,
    color TEXT,
    icon TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_bank ON accounts(bank_id);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(active);

-- ============================================
-- CATEGORIES (Hierarchické kategorie)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_category_id INTEGER,
    icon TEXT,
    color TEXT NOT NULL DEFAULT '#6B7280',
    category_type TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);

-- ============================================
-- TAGS (Volné tagování)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#8B5CF6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRANSACTIONS (Hlavní transakce)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TIMESTAMP NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CZK',
    transaction_type TEXT NOT NULL,
    from_account_id INTEGER,
    to_account_id INTEGER,
    category_id INTEGER,
    description TEXT,
    owner_user_id INTEGER,
    is_shared INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    recurring_payment_id INTEGER,
    flow_group_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (recurring_payment_id) REFERENCES recurring_payments(id) ON DELETE SET NULL,
    FOREIGN KEY (flow_group_id) REFERENCES flow_groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================
-- TRANSACTION_TAGS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (transaction_id, tag_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag ON transaction_tags(tag_id);

-- ============================================
-- SHARED_EXPENSE_SPLITS (Rozdělení sdílených výdajů)
-- ============================================
CREATE TABLE IF NOT EXISTS shared_expense_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    percentage REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_splits_transaction ON shared_expense_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_splits_user ON shared_expense_splits(user_id);

-- ============================================
-- RECURRING_PAYMENTS (Opakující se platby)
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CZK',
    frequency TEXT NOT NULL,
    frequency_value INTEGER DEFAULT 1,
    day_of_period INTEGER,
    account_id INTEGER NOT NULL,
    category_id INTEGER,
    description TEXT,
    active INTEGER DEFAULT 1,
    next_execution_date TIMESTAMP,
    last_execution_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_payments(active);
CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_payments(next_execution_date);

-- ============================================
-- FLOW_GROUPS (Propojené transakce / toky)
-- ============================================
CREATE TABLE IF NOT EXISTS flow_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#F59E0B',
    is_template INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SAVINGS_GOALS (Spořicí cíle)
-- ============================================
CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'CZK',
    deadline TIMESTAMP,
    account_id INTEGER,
    auto_deposit_amount REAL,
    auto_deposit_frequency TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_active ON savings_goals(active);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON savings_goals(deadline);

-- ============================================
-- CREDIT_CARD_CONFIGS (Konfigurace kreditek)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_card_configs (
    account_id INTEGER PRIMARY KEY,
    billing_day INTEGER NOT NULL,
    payment_count INTEGER DEFAULT 1,
    payment_days TEXT NOT NULL,
    statement_period_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ============================================
-- SETTINGS (Globální nastavení)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Výchozí nastavení
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('default_currency', 'CZK'),
    ('fiscal_month_start', '1'),
    ('date_format', 'DD.MM.YYYY'),
    ('language', 'cs'),
    ('theme', 'light');

-- ============================================
-- VÝCHOZÍ DATA
-- ============================================

-- Systémové kategorie
INSERT OR IGNORE INTO categories (id, name, icon, color, category_type, is_system) VALUES
    (1, 'Příjem', '💰', '#10B981', 'income', 1),
    (2, 'Výdaj', '💸', '#EF4444', 'expense', 1),
    (3, 'Převod', '🔄', '#3B82F6', 'both', 1);

-- Společný uživatel
INSERT OR IGNORE INTO users (id, name, color, is_shared_user, role) VALUES
    (1, 'Společné', '#9333EA', 1, 'member');
"#;

