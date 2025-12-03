use crate::db::connection::get_connection;
use crate::models::{Bank, CreateBankInput, UpdateBankInput};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_bank(input: CreateBankInput) -> Result<Bank> {
    log::info!("create_bank called: {:?}", input.name);
    let conn = get_connection()?;
    log::info!("create_bank: got connection");

    conn.execute(
        "INSERT INTO banks (name, short_name, logo, color, notes, active)
         VALUES (?1, ?2, ?3, ?4, ?5, 1)",
        rusqlite::params![
            input.name,
            input.short_name,
            input.logo,
            input.color.unwrap_or_else(|| "#10B981".to_string()),
            input.notes,
        ],
    )?;
    log::info!("create_bank: inserted");

    let id = conn.last_insert_rowid();
    log::info!("create_bank: getting bank by id {}", id);
    
    // Return inline to avoid holding connection
    let bank = conn.query_row(
        "SELECT id, name, short_name, logo, color, notes, active, created_at, updated_at FROM banks WHERE id = ?1",
        [id],
        |row| {
            Ok(Bank {
                id: row.get(0)?,
                name: row.get(1)?,
                short_name: row.get(2)?,
                logo: row.get(3)?,
                color: row.get(4)?,
                notes: row.get(5)?,
                active: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    )?;
    
    log::info!("create_bank: done");
    Ok(bank)
}

#[tauri::command]
pub fn get_banks(active_only: bool) -> Result<Vec<Bank>> {
    log::info!("get_banks called, active_only: {}", active_only);
    let conn = get_connection()?;
    log::info!("get_banks: got connection");

    let query = if active_only {
        "SELECT id, name, short_name, logo, color, notes, active, created_at, updated_at FROM banks WHERE active = 1 ORDER BY name"
    } else {
        "SELECT id, name, short_name, logo, color, notes, active, created_at, updated_at FROM banks ORDER BY name"
    };

    let mut stmt = conn.prepare(query)?;
    let banks = stmt
        .query_map([], |row| {
            Ok(Bank {
                id: row.get(0)?,
                name: row.get(1)?,
                short_name: row.get(2)?,
                logo: row.get(3)?,
                color: row.get(4)?,
                notes: row.get(5)?,
                active: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    log::info!("get_banks: returning {} banks", banks.len());
    Ok(banks)
}

#[tauri::command]
pub fn update_bank(id: i64, input: UpdateBankInput) -> Result<Bank> {
    log::info!("update_bank called: id={}", id);
    let conn = get_connection()?;

    conn.execute(
        "UPDATE banks SET name = ?1, short_name = ?2, logo = ?3, color = ?4, notes = ?5, active = ?6
         WHERE id = ?7",
        rusqlite::params![
            input.name,
            input.short_name,
            input.logo,
            input.color,
            input.notes,
            input.active as i32,
            id
        ],
    )?;

    // Inline query to avoid deadlock
    let bank = conn.query_row(
        "SELECT id, name, short_name, logo, color, notes, active, created_at, updated_at FROM banks WHERE id = ?1",
        [id],
        |row| {
            Ok(Bank {
                id: row.get(0)?,
                name: row.get(1)?,
                short_name: row.get(2)?,
                logo: row.get(3)?,
                color: row.get(4)?,
                notes: row.get(5)?,
                active: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    )?;
    
    log::info!("update_bank: done");
    Ok(bank)
}

#[tauri::command]
pub fn delete_bank(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Hard delete (kvůli UNIQUE constraint na name)
    // Nejprve smazat účty
    conn.execute("DELETE FROM accounts WHERE bank_id = ?1", [id])?;
    conn.execute("DELETE FROM banks WHERE id = ?1", [id])?;

    Ok(())
}

