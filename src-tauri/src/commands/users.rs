use crate::db::connection::get_connection;
use crate::models::{CreateUserInput, UpdateUserInput, User};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_user(input: CreateUserInput) -> Result<User> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO users (name, color, avatar, role, is_shared_user, active)
         VALUES (?1, ?2, ?3, ?4, 0, 1)",
        rusqlite::params![
            input.name,
            input.color.unwrap_or_else(|| "#3B82F6".to_string()),
            input.avatar,
            input.role.unwrap_or_else(|| "member".to_string()),
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_user_by_id(id)
}

fn get_user_by_id(id: i64) -> Result<User> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM users WHERE id = ?1", [id], |row| {
        Ok(User {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            avatar: row.get(3)?,
            role: row.get(4)?,
            is_shared_user: row.get::<_, i32>(5)? != 0,
            active: row.get::<_, i32>(6)? != 0,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_users(active_only: bool) -> Result<Vec<User>> {
    let conn = get_connection()?;

    let query = if active_only {
        "SELECT * FROM users WHERE active = 1 ORDER BY is_shared_user DESC, name"
    } else {
        "SELECT * FROM users ORDER BY is_shared_user DESC, name"
    };

    let mut stmt = conn.prepare(query)?;
    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                avatar: row.get(3)?,
                role: row.get(4)?,
                is_shared_user: row.get::<_, i32>(5)? != 0,
                active: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(users)
}

#[tauri::command]
pub fn update_user(id: i64, input: UpdateUserInput) -> Result<User> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE users SET name = ?1, color = ?2, avatar = ?3, role = ?4, active = ?5
         WHERE id = ?6 AND is_shared_user = 0",
        rusqlite::params![
            input.name,
            input.color,
            input.avatar,
            input.role,
            input.active as i32,
            id
        ],
    )?;

    get_user_by_id(id)
}

#[tauri::command]
pub fn delete_user(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Soft delete - nelze smazat shared uživatele
    conn.execute(
        "UPDATE users SET active = 0 WHERE id = ?1 AND is_shared_user = 0",
        [id],
    )?;

    Ok(())
}

