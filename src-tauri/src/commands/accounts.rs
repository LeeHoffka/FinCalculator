use crate::db::connection::get_connection;
use crate::models::{Account, CreateAccountInput, UpdateAccountInput};
use crate::utils::error::Result;

fn row_to_account(row: &rusqlite::Row) -> rusqlite::Result<Account> {
    Ok(Account {
        id: row.get(0)?,
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
        is_premium: row.get::<_, Option<i32>>(11)?.unwrap_or(0) != 0,
        premium_min_flow: row.get(12)?,
        credit_limit: row.get(13)?,
        active: row.get::<_, i32>(14)? != 0,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

const ACCOUNT_COLUMNS: &str = "id, name, account_type, bank_id, owner_user_id, account_number, currency, 
    initial_balance, current_balance, color, icon, is_premium, premium_min_flow, credit_limit, active, created_at, updated_at";

#[tauri::command]
pub fn create_account(input: CreateAccountInput) -> Result<Account> {
    log::info!("create_account called: name={}, type={}, bank_id={:?}, credit_limit={:?}", 
        input.name, input.account_type, input.bank_id, input.credit_limit);
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO accounts (name, account_type, bank_id, owner_user_id, account_number,
         currency, initial_balance, current_balance, color, icon, credit_limit, active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1)",
        rusqlite::params![
            input.name,
            input.account_type,
            input.bank_id,
            input.owner_user_id,
            input.account_number,
            input.currency,
            input.initial_balance,
            input.initial_balance, // current_balance = initial
            input.color,
            input.icon,
            input.credit_limit,
        ],
    )?;

    let id = conn.last_insert_rowid();
    
    // Return inline to avoid deadlock
    let account = conn.query_row(
        &format!("SELECT {} FROM accounts WHERE id = ?1", ACCOUNT_COLUMNS),
        [id],
        row_to_account,
    )?;
    
    Ok(account)
}

#[tauri::command]
pub fn get_account_by_id(id: i64) -> Result<Account> {
    log::info!("get_account_by_id called: {}", id);
    let conn = get_connection()?;

    let account = conn.query_row(
        &format!("SELECT {} FROM accounts WHERE id = ?1", ACCOUNT_COLUMNS),
        [id],
        row_to_account,
    )?;
    
    Ok(account)
}

#[tauri::command]
pub fn get_accounts(active_only: Option<bool>) -> Result<Vec<Account>> {
    let filter_active = active_only.unwrap_or(true);
    log::info!("get_accounts called, active_only: {}", filter_active);
    let conn = get_connection()?;

    let query = if filter_active {
        format!("SELECT {} FROM accounts WHERE active = 1 ORDER BY name", ACCOUNT_COLUMNS)
    } else {
        format!("SELECT {} FROM accounts ORDER BY name", ACCOUNT_COLUMNS)
    };

    let mut stmt = conn.prepare(&query)?;
    let accounts = stmt
        .query_map([], row_to_account)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    log::info!("get_accounts: returning {} accounts", accounts.len());
    Ok(accounts)
}

#[tauri::command]
pub fn update_account(id: i64, input: UpdateAccountInput) -> Result<Account> {
    log::info!("update_account called: id={}, balance={:?}, credit_limit={:?}", id, input.current_balance, input.credit_limit);
    let conn = get_connection()?;

    conn.execute(
        "UPDATE accounts SET name = ?1, account_type = ?2, bank_id = ?3,
         owner_user_id = ?4, account_number = ?5, currency = ?6,
         color = ?7, icon = ?8, active = ?9, current_balance = ?10, initial_balance = ?10, credit_limit = ?11
         WHERE id = ?12",
        rusqlite::params![
            input.name,
            input.account_type,
            input.bank_id,
            input.owner_user_id,
            input.account_number,
            input.currency,
            input.color,
            input.icon,
            input.active as i32,
            input.current_balance.unwrap_or(0.0),
            input.credit_limit,
            id
        ],
    )?;

    // Return inline to avoid deadlock
    let account = conn.query_row(
        &format!("SELECT {} FROM accounts WHERE id = ?1", ACCOUNT_COLUMNS),
        [id],
        row_to_account,
    )?;
    
    log::info!("update_account done: balance={}", account.current_balance);
    Ok(account)
}

#[tauri::command]
pub fn delete_account(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Soft delete
    conn.execute("UPDATE accounts SET active = 0 WHERE id = ?1", [id])?;

    Ok(())
}

#[tauri::command]
pub fn get_account_balance(id: i64) -> Result<f64> {
    let conn = get_connection()?;

    let balance: f64 = conn.query_row(
        "SELECT current_balance FROM accounts WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    Ok(balance)
}

pub fn update_account_balance(account_id: i64, amount_change: f64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE accounts SET current_balance = current_balance + ?1 WHERE id = ?2",
        rusqlite::params![amount_change, account_id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn set_account_balance(id: i64, balance: f64) -> Result<Account> {
    log::info!("set_account_balance called: id={}, balance={}", id, balance);
    let conn = get_connection()?;

    conn.execute(
        "UPDATE accounts SET current_balance = ?1, initial_balance = ?1 WHERE id = ?2",
        rusqlite::params![balance, id],
    )?;

    // Return inline to avoid deadlock
    let account = conn.query_row(
        &format!("SELECT {} FROM accounts WHERE id = ?1", ACCOUNT_COLUMNS),
        [id],
        row_to_account,
    )?;

    log::info!("set_account_balance: done");
    Ok(account)
}

