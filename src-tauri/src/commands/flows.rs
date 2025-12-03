use crate::db::connection::get_connection;
use crate::models::{CreateFlowGroupInput, FlowGroup, UpdateFlowGroupInput};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_flow_group(input: CreateFlowGroupInput) -> Result<FlowGroup> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO flow_groups (name, description, color, is_template)
         VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![
            input.name,
            input.description,
            input.color.unwrap_or_else(|| "#F59E0B".to_string()),
            input.is_template.unwrap_or(false) as i32,
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_flow_group_by_id(id)
}

fn get_flow_group_by_id(id: i64) -> Result<FlowGroup> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM flow_groups WHERE id = ?1", [id], |row| {
        Ok(FlowGroup {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            color: row.get(3)?,
            is_template: row.get::<_, i32>(4)? != 0,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_flow_groups() -> Result<Vec<FlowGroup>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT * FROM flow_groups ORDER BY name")?;
    let flows = stmt
        .query_map([], |row| {
            Ok(FlowGroup {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                is_template: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(flows)
}

#[tauri::command]
pub fn update_flow_group(id: i64, input: UpdateFlowGroupInput) -> Result<FlowGroup> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE flow_groups SET name = ?1, description = ?2, color = ?3, is_template = ?4
         WHERE id = ?5",
        rusqlite::params![
            input.name,
            input.description,
            input.color,
            input.is_template as i32,
            id
        ],
    )?;

    get_flow_group_by_id(id)
}

#[tauri::command]
pub fn delete_flow_group(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Odebrat flow_group_id z transakcí
    conn.execute(
        "UPDATE transactions SET flow_group_id = NULL WHERE flow_group_id = ?1",
        [id],
    )?;

    conn.execute("DELETE FROM flow_groups WHERE id = ?1", [id])?;

    Ok(())
}

#[tauri::command]
pub fn add_transaction_to_flow(flow_id: i64, transaction_id: i64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE transactions SET flow_group_id = ?1 WHERE id = ?2",
        [flow_id, transaction_id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn remove_transaction_from_flow(_flow_id: i64, transaction_id: i64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE transactions SET flow_group_id = NULL WHERE id = ?1",
        [transaction_id],
    )?;

    Ok(())
}

