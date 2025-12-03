use crate::db::connection::get_connection;
use crate::models::{CreateSavingsGoalInput, SavingsGoal, UpdateSavingsGoalInput};
use crate::utils::error::Result;

#[tauri::command]
pub fn create_savings_goal(input: CreateSavingsGoalInput) -> Result<SavingsGoal> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO savings_goals (name, target_amount, current_amount, currency, deadline,
         account_id, auto_deposit_amount, auto_deposit_frequency, active)
         VALUES (?1, ?2, 0, ?3, ?4, ?5, ?6, ?7, 1)",
        rusqlite::params![
            input.name,
            input.target_amount,
            input.currency.unwrap_or_else(|| "CZK".to_string()),
            input.deadline,
            input.account_id,
            input.auto_deposit_amount,
            input.auto_deposit_frequency,
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_savings_goal_by_id(id)
}

fn get_savings_goal_by_id(id: i64) -> Result<SavingsGoal> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM savings_goals WHERE id = ?1", [id], |row| {
        Ok(SavingsGoal {
            id: row.get(0)?,
            name: row.get(1)?,
            target_amount: row.get(2)?,
            current_amount: row.get(3)?,
            currency: row.get(4)?,
            deadline: row.get(5)?,
            account_id: row.get(6)?,
            auto_deposit_amount: row.get(7)?,
            auto_deposit_frequency: row.get(8)?,
            active: row.get::<_, i32>(9)? != 0,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_savings_goals() -> Result<Vec<SavingsGoal>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT * FROM savings_goals ORDER BY name")?;
    let goals = stmt
        .query_map([], |row| {
            Ok(SavingsGoal {
                id: row.get(0)?,
                name: row.get(1)?,
                target_amount: row.get(2)?,
                current_amount: row.get(3)?,
                currency: row.get(4)?,
                deadline: row.get(5)?,
                account_id: row.get(6)?,
                auto_deposit_amount: row.get(7)?,
                auto_deposit_frequency: row.get(8)?,
                active: row.get::<_, i32>(9)? != 0,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(goals)
}

#[tauri::command]
pub fn update_savings_goal(id: i64, input: UpdateSavingsGoalInput) -> Result<SavingsGoal> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE savings_goals SET name = ?1, target_amount = ?2, current_amount = ?3,
         currency = ?4, deadline = ?5, account_id = ?6, auto_deposit_amount = ?7,
         auto_deposit_frequency = ?8, active = ?9
         WHERE id = ?10",
        rusqlite::params![
            input.name,
            input.target_amount,
            input.current_amount,
            input.currency,
            input.deadline,
            input.account_id,
            input.auto_deposit_amount,
            input.auto_deposit_frequency,
            input.active as i32,
            id
        ],
    )?;

    get_savings_goal_by_id(id)
}

#[tauri::command]
pub fn delete_savings_goal(id: i64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute("DELETE FROM savings_goals WHERE id = ?1", [id])?;

    Ok(())
}

