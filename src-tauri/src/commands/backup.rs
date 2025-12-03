use crate::db::connection::{get_connection, get_db_path};
use crate::models::{TransactionFilters, FullBackup, BackupData, HouseholdMemberWithIncomes, BankWithAccounts, AccountExtended};
use crate::models::household::*;
use crate::utils::error::Result;
use std::fs;

#[tauri::command]
pub fn export_database(path: String) -> Result<()> {
    let db_path = get_db_path()?;
    fs::copy(db_path, path)?;
    Ok(())
}

#[tauri::command]
pub fn import_database(path: String) -> Result<()> {
    let db_path = get_db_path()?;
    
    // Backup stávající databáze
    let backup_path = db_path.with_extension("db.backup");
    fs::copy(&db_path, &backup_path)?;
    
    // Kopírovat novou databázi
    fs::copy(path, &db_path)?;
    
    Ok(())
}

/// Export all data as JSON
#[tauri::command]
pub fn export_full_backup() -> Result<FullBackup> {
    let conn = get_connection()?;
    
    // Get household members with incomes
    let mut members_stmt = conn.prepare(
        "SELECT id, name, color, avatar, created_at, updated_at FROM household_members"
    )?;
    let members: Vec<HouseholdMember> = members_stmt.query_map([], |row| {
        Ok(HouseholdMember {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            color: row.get(2)?,
            avatar: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    let mut members_with_incomes = Vec::new();
    for member in members {
        let member_id = member.id.unwrap();
        let mut income_stmt = conn.prepare(
            "SELECT id, member_id, name, amount, frequency, day_of_month, account_id, is_active, created_at, updated_at 
             FROM member_incomes WHERE member_id = ?1"
        )?;
        let incomes: Vec<MemberIncome> = income_stmt.query_map([member_id], |row| {
            Ok(MemberIncome {
                id: Some(row.get(0)?),
                member_id: row.get(1)?,
                name: row.get(2)?,
                amount: row.get(3)?,
                frequency: row.get(4)?,
                day_of_month: row.get(5)?,
                account_id: row.get(6)?,
                is_active: row.get::<_, i32>(7)? == 1,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?.collect::<std::result::Result<Vec<_>, _>>()?;
        
        members_with_incomes.push(HouseholdMemberWithIncomes { member, incomes });
    }
    
    // Get banks with accounts
    let mut banks_stmt = conn.prepare(
        "SELECT id, name, short_name, logo, color, notes, active, created_at, updated_at FROM banks"
    )?;
    let banks: Vec<(i64, String, Option<String>, Option<String>, String, Option<String>, i32, Option<String>, Option<String>)> = 
        banks_stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?, row.get(8)?))
        })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    let mut banks_with_accounts = Vec::new();
    for (id, name, short_name, logo, color, notes, active, created_at, updated_at) in banks {
        let mut acc_stmt = conn.prepare(
            "SELECT id, name, account_type, bank_id, owner_user_id, account_number, currency, initial_balance, current_balance, color, icon, is_premium, premium_min_flow, active 
             FROM accounts WHERE bank_id = ?1"
        )?;
        let accounts: Vec<AccountExtended> = acc_stmt.query_map([id], |row| {
            Ok(AccountExtended {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                account_type: row.get(2)?,
                bank_id: row.get(3)?,
                owner_user_id: row.get(4)?,
                account_number: row.get(5)?,
                currency: row.get(6)?,
                initial_balance: row.get(7)?,
                current_balance: row.get(8)?,
                color: row.get(9)?,
                icon: row.get(10)?,
                is_premium: row.get::<_, Option<i32>>(11)?.unwrap_or(0) == 1,
                premium_min_flow: row.get(12)?,
                active: row.get::<_, i32>(13)? == 1,
            })
        })?.collect::<std::result::Result<Vec<_>, _>>()?;
        
        banks_with_accounts.push(BankWithAccounts { 
            bank: crate::models::Bank {
                id,
                name,
                short_name,
                logo,
                color,
                notes,
                active: active == 1,
                created_at: created_at.unwrap_or_default(),
                updated_at: updated_at.unwrap_or_default(),
            }, 
            accounts 
        });
    }
    
    // Get scheduled transfers
    let mut transfers_stmt = conn.prepare(
        "SELECT id, name, from_account_id, to_account_id, amount, day_of_month, description, category, display_order, is_active, created_at, updated_at 
         FROM scheduled_transfers"
    )?;
    let transfers: Vec<ScheduledTransfer> = transfers_stmt.query_map([], |row| {
        Ok(ScheduledTransfer {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            from_account_id: row.get(2)?,
            to_account_id: row.get(3)?,
            amount: row.get(4)?,
            day_of_month: row.get(5)?,
            description: row.get(6)?,
            category: row.get(7)?,
            display_order: row.get(8)?,
            is_active: row.get::<_, i32>(9)? == 1,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    // Get fixed expenses
    let mut expenses_stmt = conn.prepare(
        "SELECT id, name, amount, category, frequency, day_of_month, account_id, assigned_to, is_active, notes, created_at, updated_at 
         FROM fixed_expenses"
    )?;
    let expenses: Vec<FixedExpense> = expenses_stmt.query_map([], |row| {
        Ok(FixedExpense {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            amount: row.get(2)?,
            category: row.get(3)?,
            frequency: row.get(4)?,
            day_of_month: row.get(5)?,
            account_id: row.get(6)?,
            assigned_to: row.get(7)?,
            is_active: row.get::<_, i32>(8)? == 1,
            notes: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    // Get budget categories
    let mut budgets_stmt = conn.prepare(
        "SELECT id, name, budget_type, monthly_limit, color, icon, assigned_to, created_at, updated_at 
         FROM budget_categories"
    )?;
    let budgets: Vec<BudgetCategory> = budgets_stmt.query_map([], |row| {
        Ok(BudgetCategory {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            budget_type: row.get(2)?,
            monthly_limit: row.get(3)?,
            color: row.get(4)?,
            icon: row.get(5)?,
            assigned_to: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(FullBackup {
        version: "1.0.0".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        data: BackupData {
            household_members: members_with_incomes,
            banks: banks_with_accounts,
            scheduled_transfers: transfers,
            fixed_expenses: expenses,
            budget_categories: budgets,
        },
    })
}

/// Save full backup to JSON file
#[tauri::command]
pub fn save_backup_to_file(path: String) -> Result<()> {
    let backup = export_full_backup()?;
    let json = serde_json::to_string_pretty(&backup)?;
    fs::write(path, json)?;
    Ok(())
}

/// Load and import backup from JSON file
#[tauri::command]
pub fn import_from_backup_file(path: String) -> Result<()> {
    let json = fs::read_to_string(path)?;
    let backup: FullBackup = serde_json::from_str(&json)?;
    
    let conn = get_connection()?;
    
    // Clear existing data
    conn.execute("DELETE FROM member_incomes", [])?;
    conn.execute("DELETE FROM household_members", [])?;
    conn.execute("DELETE FROM scheduled_transfers", [])?;
    conn.execute("DELETE FROM accounts WHERE bank_id IS NOT NULL", [])?;
    conn.execute("DELETE FROM banks", [])?;
    conn.execute("DELETE FROM fixed_expenses", [])?;
    conn.execute("DELETE FROM budget_categories", [])?;
    
    // Import banks and accounts
    for bank_data in backup.data.banks {
        conn.execute(
            "INSERT INTO banks (name, short_name, logo, color, notes, active) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (&bank_data.bank.name, &None::<String>, &bank_data.bank.logo, &bank_data.bank.color, &bank_data.bank.notes, if bank_data.bank.active { 1 } else { 0 }),
        )?;
        let bank_id = conn.last_insert_rowid();
        
        for acc in bank_data.accounts {
            conn.execute(
                "INSERT INTO accounts (name, account_type, bank_id, owner_user_id, account_number, currency, initial_balance, current_balance, color, icon, is_premium, premium_min_flow, active) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                (
                    &acc.name, &acc.account_type, bank_id, acc.owner_user_id, &acc.account_number,
                    &acc.currency, acc.initial_balance, acc.current_balance, &acc.color, &acc.icon,
                    if acc.is_premium { 1 } else { 0 }, acc.premium_min_flow, if acc.active { 1 } else { 0 }
                ),
            )?;
        }
    }
    
    // Import household members with incomes
    for member_data in backup.data.household_members {
        conn.execute(
            "INSERT INTO household_members (name, color, avatar) VALUES (?1, ?2, ?3)",
            (&member_data.member.name, &member_data.member.color, &member_data.member.avatar),
        )?;
        let member_id = conn.last_insert_rowid();
        
        for income in member_data.incomes {
            conn.execute(
                "INSERT INTO member_incomes (member_id, name, amount, frequency, day_of_month, account_id, is_active) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                (member_id, &income.name, income.amount, &income.frequency, income.day_of_month, income.account_id, if income.is_active { 1 } else { 0 }),
            )?;
        }
    }
    
    // Import scheduled transfers
    for transfer in backup.data.scheduled_transfers {
        conn.execute(
            "INSERT INTO scheduled_transfers (name, from_account_id, to_account_id, amount, day_of_month, description, category, display_order, is_active) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            (&transfer.name, transfer.from_account_id, transfer.to_account_id, transfer.amount, transfer.day_of_month, &transfer.description, &transfer.category, transfer.display_order, if transfer.is_active { 1 } else { 0 }),
        )?;
    }
    
    // Import fixed expenses
    for expense in backup.data.fixed_expenses {
        conn.execute(
            "INSERT INTO fixed_expenses (name, amount, category, frequency, day_of_month, assigned_to, is_active, notes) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            (&expense.name, expense.amount, &expense.category, &expense.frequency, expense.day_of_month, &expense.assigned_to, if expense.is_active { 1 } else { 0 }, &expense.notes),
        )?;
    }
    
    // Import budget categories
    for budget in backup.data.budget_categories {
        conn.execute(
            "INSERT INTO budget_categories (name, budget_type, monthly_limit, color, icon, assigned_to) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (&budget.name, &budget.budget_type, budget.monthly_limit, &budget.color, &budget.icon, &budget.assigned_to),
        )?;
    }
    
    Ok(())
}

#[tauri::command]
pub fn export_transactions_csv(path: String, filters: Option<TransactionFilters>) -> Result<()> {
    let conn = get_connection()?;
    
    let query = if filters.is_some() {
        "SELECT t.id, t.date, t.amount, t.currency, t.transaction_type, t.description, 
         t.status, c.name as category, a1.name as from_account, a2.name as to_account
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a1 ON t.from_account_id = a1.id
         LEFT JOIN accounts a2 ON t.to_account_id = a2.id
         ORDER BY t.date DESC"
    } else {
        "SELECT t.id, t.date, t.amount, t.currency, t.transaction_type, t.description, 
         t.status, c.name as category, a1.name as from_account, a2.name as to_account
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a1 ON t.from_account_id = a1.id
         LEFT JOIN accounts a2 ON t.to_account_id = a2.id
         ORDER BY t.date DESC"
    };
    
    let mut stmt = conn.prepare(query)?;
    let mut wtr = csv::Writer::from_path(path)?;
    
    wtr.write_record([
        "ID", "Datum", "Částka", "Měna", "Typ", "Popis", "Status", "Kategorie", 
        "Z účtu", "Na účet"
    ])?;
    
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, f64>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, String>(6)?,
            row.get::<_, Option<String>>(7)?,
            row.get::<_, Option<String>>(8)?,
            row.get::<_, Option<String>>(9)?,
        ))
    })?;
    
    for row in rows {
        let (id, date, amount, currency, tx_type, desc, status, cat, from_acc, to_acc) = row?;
        wtr.write_record([
            id.to_string(),
            date,
            amount.to_string(),
            currency,
            tx_type,
            desc.unwrap_or_default(),
            status,
            cat.unwrap_or_default(),
            from_acc.unwrap_or_default(),
            to_acc.unwrap_or_default(),
        ])?;
    }
    
    wtr.flush()?;
    Ok(())
}

