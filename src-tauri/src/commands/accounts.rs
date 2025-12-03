use crate::db::connection::get_connection;
use crate::models::{Account, CreateAccountInput, UpdateAccountInput};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_account(input: CreateAccountInput) -> Result<Account> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO accounts (name, account_type, bank_id, owner_user_id, account_number,
         currency, initial_balance, current_balance, color, icon, active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 1)",
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
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_account_by_id(id)
}

#[tauri::command]
pub fn get_account_by_id(id: i64) -> Result<Account> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM accounts WHERE id = ?1", [id], |row| {
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
            active: row.get::<_, i32>(11)? != 0,
            created_at: row.get(12)?,
            updated_at: row.get(13)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_accounts(active_only: bool) -> Result<Vec<Account>> {
    let conn = get_connection()?;

    let query = if active_only {
        "SELECT * FROM accounts WHERE active = 1 ORDER BY name"
    } else {
        "SELECT * FROM accounts ORDER BY name"
    };

    let mut stmt = conn.prepare(query)?;
    let accounts = stmt
        .query_map([], |row| {
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
                active: row.get::<_, i32>(11)? != 0,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(accounts)
}

#[tauri::command]
pub fn update_account(id: i64, input: UpdateAccountInput) -> Result<Account> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE accounts SET name = ?1, account_type = ?2, bank_id = ?3,
         owner_user_id = ?4, account_number = ?5, currency = ?6,
         color = ?7, icon = ?8, active = ?9
         WHERE id = ?10",
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
            id
        ],
    )?;

    get_account_by_id(id)
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

