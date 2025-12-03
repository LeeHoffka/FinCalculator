use crate::commands::accounts::update_account_balance;
use crate::db::connection::get_connection;
use crate::models::{
    CreateTagInput, CreateTransactionInput, Tag, Transaction, TransactionFilters,
    UpdateTransactionInput,
};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_transaction(input: CreateTransactionInput) -> Result<Transaction> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO transactions (date, amount, currency, transaction_type, from_account_id,
         to_account_id, category_id, description, owner_user_id, is_shared, status, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            input.date,
            input.amount,
            input.currency.unwrap_or_else(|| "CZK".to_string()),
            input.transaction_type,
            input.from_account_id,
            input.to_account_id,
            input.category_id,
            input.description,
            input.owner_user_id,
            input.is_shared.unwrap_or(false) as i32,
            input.status.clone().unwrap_or_else(|| "completed".to_string()),
            input.notes,
        ],
    )?;

    let id = conn.last_insert_rowid();

    // Aktualizace zůstatků účtů
    if input.status.as_deref() != Some("planned") {
        match input.transaction_type.as_str() {
            "expense" => {
                if let Some(from_id) = input.from_account_id {
                    drop(conn);
                    update_account_balance(from_id, -input.amount)?;
                }
            }
            "income" => {
                if let Some(to_id) = input.to_account_id {
                    drop(conn);
                    update_account_balance(to_id, input.amount)?;
                }
            }
            "transfer" => {
                if let Some(from_id) = input.from_account_id {
                    drop(conn);
                    update_account_balance(from_id, -input.amount)?;
                    if let Some(to_id) = input.to_account_id {
                        update_account_balance(to_id, input.amount)?;
                    }
                }
            }
            _ => {}
        }
    }

    get_transaction_by_id(id)
}

#[tauri::command]
pub fn get_transaction_by_id(id: i64) -> Result<Transaction> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM transactions WHERE id = ?1", [id], |row| {
        Ok(Transaction {
            id: row.get(0)?,
            date: row.get(1)?,
            amount: row.get(2)?,
            currency: row.get(3)?,
            transaction_type: row.get(4)?,
            from_account_id: row.get(5)?,
            to_account_id: row.get(6)?,
            category_id: row.get(7)?,
            description: row.get(8)?,
            owner_user_id: row.get(9)?,
            is_shared: row.get::<_, i32>(10)? != 0,
            status: row.get(11)?,
            recurring_payment_id: row.get(12)?,
            flow_group_id: row.get(13)?,
            notes: row.get(14)?,
            created_at: row.get(15)?,
            updated_at: row.get(16)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_transactions() -> Result<Vec<Transaction>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC")?;
    let transactions = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                date: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                transaction_type: row.get(4)?,
                from_account_id: row.get(5)?,
                to_account_id: row.get(6)?,
                category_id: row.get(7)?,
                description: row.get(8)?,
                owner_user_id: row.get(9)?,
                is_shared: row.get::<_, i32>(10)? != 0,
                status: row.get(11)?,
                recurring_payment_id: row.get(12)?,
                flow_group_id: row.get(13)?,
                notes: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(transactions)
}

#[tauri::command]
pub fn get_transactions_filtered(filters: TransactionFilters) -> Result<Vec<Transaction>> {
    let conn = get_connection()?;

    let mut query = String::from("SELECT * FROM transactions WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(start) = &filters.start_date {
        query.push_str(" AND date >= ?");
        params.push(Box::new(start.clone()));
    }

    if let Some(end) = &filters.end_date {
        query.push_str(" AND date <= ?");
        params.push(Box::new(end.clone()));
    }

    if let Some(min) = filters.min_amount {
        query.push_str(" AND amount >= ?");
        params.push(Box::new(min));
    }

    if let Some(max) = filters.max_amount {
        query.push_str(" AND amount <= ?");
        params.push(Box::new(max));
    }

    if let Some(search) = &filters.search_query {
        query.push_str(" AND (description LIKE ? OR notes LIKE ?)");
        let pattern = format!("%{}%", search);
        params.push(Box::new(pattern.clone()));
        params.push(Box::new(pattern));
    }

    query.push_str(" ORDER BY date DESC, id DESC");

    let mut stmt = conn.prepare(&query)?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let transactions = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(Transaction {
                id: row.get(0)?,
                date: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                transaction_type: row.get(4)?,
                from_account_id: row.get(5)?,
                to_account_id: row.get(6)?,
                category_id: row.get(7)?,
                description: row.get(8)?,
                owner_user_id: row.get(9)?,
                is_shared: row.get::<_, i32>(10)? != 0,
                status: row.get(11)?,
                recurring_payment_id: row.get(12)?,
                flow_group_id: row.get(13)?,
                notes: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(transactions)
}

#[tauri::command]
pub fn update_transaction(id: i64, input: UpdateTransactionInput) -> Result<Transaction> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE transactions SET date = ?1, amount = ?2, currency = ?3, transaction_type = ?4,
         from_account_id = ?5, to_account_id = ?6, category_id = ?7, description = ?8,
         owner_user_id = ?9, is_shared = ?10, status = ?11, notes = ?12
         WHERE id = ?13",
        rusqlite::params![
            input.date,
            input.amount,
            input.currency,
            input.transaction_type,
            input.from_account_id,
            input.to_account_id,
            input.category_id,
            input.description,
            input.owner_user_id,
            input.is_shared as i32,
            input.status,
            input.notes,
            id
        ],
    )?;

    get_transaction_by_id(id)
}

#[tauri::command]
pub fn delete_transaction(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Získat transakci před smazáním pro úpravu zůstatku
    let tx = get_transaction_by_id(id)?;

    // Vrátit zůstatek
    if tx.status != "planned" {
        match tx.transaction_type.as_str() {
            "expense" => {
                if let Some(from_id) = tx.from_account_id {
                    drop(conn);
                    update_account_balance(from_id, tx.amount)?;
                    let conn = get_connection()?;
                    conn.execute("DELETE FROM transactions WHERE id = ?1", [id])?;
                    return Ok(());
                }
            }
            "income" => {
                if let Some(to_id) = tx.to_account_id {
                    drop(conn);
                    update_account_balance(to_id, -tx.amount)?;
                    let conn = get_connection()?;
                    conn.execute("DELETE FROM transactions WHERE id = ?1", [id])?;
                    return Ok(());
                }
            }
            "transfer" => {
                if let Some(from_id) = tx.from_account_id {
                    drop(conn);
                    update_account_balance(from_id, tx.amount)?;
                    if let Some(to_id) = tx.to_account_id {
                        update_account_balance(to_id, -tx.amount)?;
                    }
                    let conn = get_connection()?;
                    conn.execute("DELETE FROM transactions WHERE id = ?1", [id])?;
                    return Ok(());
                }
            }
            _ => {}
        }
    }

    conn.execute("DELETE FROM transactions WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// TAGS
// ============================================

#[tauri::command]
pub fn create_tag(input: CreateTagInput) -> Result<Tag> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO tags (name, color) VALUES (?1, ?2)",
        rusqlite::params![
            input.name,
            input.color.unwrap_or_else(|| "#8B5CF6".to_string()),
        ],
    )?;

    let id = conn.last_insert_rowid();

    conn.query_row("SELECT * FROM tags WHERE id = ?1", [id], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_tags() -> Result<Vec<Tag>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name")?;
    let tags = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(tags)
}

#[tauri::command]
pub fn add_tag_to_transaction(transaction_id: i64, tag_id: i64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?1, ?2)",
        [transaction_id, tag_id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn remove_tag_from_transaction(transaction_id: i64, tag_id: i64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "DELETE FROM transaction_tags WHERE transaction_id = ?1 AND tag_id = ?2",
        [transaction_id, tag_id],
    )?;

    Ok(())
}

