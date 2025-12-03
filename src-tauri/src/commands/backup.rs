use crate::db::connection::{get_connection, get_db_path};
use crate::models::TransactionFilters;
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

