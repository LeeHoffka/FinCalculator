use crate::db::connection::get_connection;
use crate::models::{Bank, CreateBankInput, UpdateBankInput};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_bank(input: CreateBankInput) -> Result<Bank> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO banks (name, logo, color, notes, active)
         VALUES (?1, ?2, ?3, ?4, 1)",
        rusqlite::params![
            input.name,
            input.logo,
            input.color.unwrap_or_else(|| "#10B981".to_string()),
            input.notes,
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_bank_by_id(id)
}

fn get_bank_by_id(id: i64) -> Result<Bank> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM banks WHERE id = ?1", [id], |row| {
        Ok(Bank {
            id: row.get(0)?,
            name: row.get(1)?,
            logo: row.get(2)?,
            color: row.get(3)?,
            notes: row.get(4)?,
            active: row.get::<_, i32>(5)? != 0,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_banks(active_only: bool) -> Result<Vec<Bank>> {
    let conn = get_connection()?;

    let query = if active_only {
        "SELECT * FROM banks WHERE active = 1 ORDER BY name"
    } else {
        "SELECT * FROM banks ORDER BY name"
    };

    let mut stmt = conn.prepare(query)?;
    let banks = stmt
        .query_map([], |row| {
            Ok(Bank {
                id: row.get(0)?,
                name: row.get(1)?,
                logo: row.get(2)?,
                color: row.get(3)?,
                notes: row.get(4)?,
                active: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(banks)
}

#[tauri::command]
pub fn update_bank(id: i64, input: UpdateBankInput) -> Result<Bank> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE banks SET name = ?1, logo = ?2, color = ?3, notes = ?4, active = ?5
         WHERE id = ?6",
        rusqlite::params![
            input.name,
            input.logo,
            input.color,
            input.notes,
            input.active as i32,
            id
        ],
    )?;

    get_bank_by_id(id)
}

#[tauri::command]
pub fn delete_bank(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Soft delete
    conn.execute("UPDATE banks SET active = 0 WHERE id = ?1", [id])?;

    Ok(())
}

