use crate::db::connection::get_connection;
use crate::models::{FinancialGoal, CreateGoalInput, UpdateGoalInput, FundWithdrawal, CreateWithdrawalInput, MonthlyPlan, CreateMonthlyPlanInput, UpdateMonthlyPlanInput};
use crate::utils::error::Result;

const GOAL_COLUMNS: &str = "id, name, goal_type, icon, color, weekly_amount, day_of_week, 
    monthly_contribution, current_balance, yearly_amount, target_month, current_saved,
    account_id, notes, is_active, created_at, updated_at";

fn row_to_goal(row: &rusqlite::Row) -> rusqlite::Result<FinancialGoal> {
    Ok(FinancialGoal {
        id: row.get(0)?,
        name: row.get(1)?,
        goal_type: row.get(2)?,
        icon: row.get(3)?,
        color: row.get(4)?,
        weekly_amount: row.get(5)?,
        day_of_week: row.get(6)?,
        monthly_contribution: row.get(7)?,
        current_balance: row.get(8)?,
        yearly_amount: row.get(9)?,
        target_month: row.get(10)?,
        current_saved: row.get(11)?,
        account_id: row.get(12)?,
        notes: row.get(13)?,
        is_active: row.get::<_, i32>(14)? == 1,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

// ============================================
// FINANCIAL GOALS CRUD
// ============================================

#[tauri::command]
pub fn create_financial_goal(input: CreateGoalInput) -> Result<FinancialGoal> {
    log::info!("create_financial_goal: name={}, type={}", input.name, input.goal_type);
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO financial_goals (name, goal_type, icon, color, weekly_amount, day_of_week,
         monthly_contribution, current_balance, yearly_amount, target_month, current_saved, account_id, notes, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 1)",
        rusqlite::params![
            input.name,
            input.goal_type,
            input.icon,
            input.color,
            input.weekly_amount,
            input.day_of_week,
            input.monthly_contribution,
            input.current_balance.unwrap_or(0.0),
            input.yearly_amount,
            input.target_month,
            input.current_saved.unwrap_or(0.0),
            input.account_id,
            input.notes,
        ],
    )?;

    let id = conn.last_insert_rowid();
    let goal = conn.query_row(
        &format!("SELECT {} FROM financial_goals WHERE id = ?1", GOAL_COLUMNS),
        [id],
        row_to_goal,
    )?;

    Ok(goal)
}

#[tauri::command]
pub fn get_financial_goals() -> Result<Vec<FinancialGoal>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        &format!("SELECT {} FROM financial_goals WHERE is_active = 1 ORDER BY name", GOAL_COLUMNS)
    )?;

    let goals = stmt
        .query_map([], row_to_goal)?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(goals)
}

#[tauri::command]
pub fn update_financial_goal(id: i64, input: UpdateGoalInput) -> Result<FinancialGoal> {
    log::info!("update_financial_goal: id={}", id);
    let conn = get_connection()?;

    conn.execute(
        "UPDATE financial_goals SET name = ?1, goal_type = ?2, icon = ?3, color = ?4,
         weekly_amount = ?5, day_of_week = ?6, monthly_contribution = ?7, current_balance = ?8,
         yearly_amount = ?9, target_month = ?10, current_saved = ?11, account_id = ?12, notes = ?13, is_active = ?14,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?15",
        rusqlite::params![
            input.name,
            input.goal_type,
            input.icon,
            input.color,
            input.weekly_amount,
            input.day_of_week,
            input.monthly_contribution,
            input.current_balance,
            input.yearly_amount,
            input.target_month,
            input.current_saved,
            input.account_id,
            input.notes,
            input.is_active as i32,
            id
        ],
    )?;

    let goal = conn.query_row(
        &format!("SELECT {} FROM financial_goals WHERE id = ?1", GOAL_COLUMNS),
        [id],
        row_to_goal,
    )?;

    Ok(goal)
}

#[tauri::command]
pub fn delete_financial_goal(id: i64) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("UPDATE financial_goals SET is_active = 0 WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// FUND WITHDRAWALS (čerpání z fondu)
// ============================================

#[tauri::command]
pub fn create_fund_withdrawal(input: CreateWithdrawalInput) -> Result<FundWithdrawal> {
    let conn = get_connection()?;
    
    let date = input.date.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string());

    conn.execute(
        "INSERT INTO fund_withdrawals (goal_id, amount, description, date) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![input.goal_id, input.amount, input.description, date],
    )?;

    // Update fund balance
    conn.execute(
        "UPDATE financial_goals SET current_balance = current_balance - ?1 WHERE id = ?2",
        rusqlite::params![input.amount, input.goal_id],
    )?;

    let id = conn.last_insert_rowid();

    let withdrawal = conn.query_row(
        "SELECT id, goal_id, amount, description, date, created_at FROM fund_withdrawals WHERE id = ?1",
        [id],
        |row| {
            Ok(FundWithdrawal {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                amount: row.get(2)?,
                description: row.get(3)?,
                date: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )?;

    Ok(withdrawal)
}

#[tauri::command]
pub fn get_fund_withdrawals(goal_id: i64) -> Result<Vec<FundWithdrawal>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, goal_id, amount, description, date, created_at 
         FROM fund_withdrawals WHERE goal_id = ?1 ORDER BY date DESC"
    )?;

    let withdrawals = stmt
        .query_map([goal_id], |row| {
            Ok(FundWithdrawal {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                amount: row.get(2)?,
                description: row.get(3)?,
                date: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(withdrawals)
}

#[tauri::command]
pub fn add_fund_contribution(goal_id: i64, amount: f64) -> Result<FinancialGoal> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE financial_goals SET current_balance = current_balance + ?1 WHERE id = ?2",
        rusqlite::params![amount, goal_id],
    )?;

    let goal = conn.query_row(
        &format!("SELECT {} FROM financial_goals WHERE id = ?1", GOAL_COLUMNS),
        [goal_id],
        row_to_goal,
    )?;

    Ok(goal)
}

// ============================================
// MONTHLY PLANS
// ============================================

#[tauri::command]
#[allow(non_snake_case)]
pub fn get_monthly_plan(goalId: i64, year: i32, month: i32) -> Result<Option<MonthlyPlan>> {
    let conn = get_connection()?;
    
    let plan = conn.query_row(
        "SELECT id, goal_id, year, month, planned_count, realized_count, planned_amount, realized_amount, notes, created_at, updated_at
         FROM monthly_plans WHERE goal_id = ?1 AND year = ?2 AND month = ?3",
        rusqlite::params![goalId, year, month],
        |row| {
            Ok(MonthlyPlan {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                planned_count: row.get(4)?,
                realized_count: row.get(5)?,
                planned_amount: row.get(6)?,
                realized_amount: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    );
    
    match plan {
        Ok(p) => Ok(Some(p)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn create_or_update_monthly_plan(
    goalId: i64,
    year: i32,
    month: i32,
    plannedCount: i32,
    realizedCount: i32,
    plannedAmount: f64,
    realizedAmount: f64,
    notes: Option<String>,
) -> Result<MonthlyPlan> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO monthly_plans (goal_id, year, month, planned_count, realized_count, planned_amount, realized_amount, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(goal_id, year, month) DO UPDATE SET
         planned_count = excluded.planned_count,
         realized_count = excluded.realized_count,
         planned_amount = excluded.planned_amount,
         realized_amount = excluded.realized_amount,
         notes = excluded.notes,
         updated_at = CURRENT_TIMESTAMP",
        rusqlite::params![goalId, year, month, plannedCount, realizedCount, plannedAmount, realizedAmount, notes],
    )?;
    
    let plan = conn.query_row(
        "SELECT id, goal_id, year, month, planned_count, realized_count, planned_amount, realized_amount, notes, created_at, updated_at
         FROM monthly_plans WHERE goal_id = ?1 AND year = ?2 AND month = ?3",
        rusqlite::params![goalId, year, month],
        |row| {
            Ok(MonthlyPlan {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                planned_count: row.get(4)?,
                realized_count: row.get(5)?,
                planned_amount: row.get(6)?,
                realized_amount: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    )?;
    
    Ok(plan)
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn get_monthly_plans_history(goalId: i64, limit: Option<i32>) -> Result<Vec<MonthlyPlan>> {
    let conn = get_connection()?;
    let lim = limit.unwrap_or(12);
    
    let mut stmt = conn.prepare(
        "SELECT id, goal_id, year, month, planned_count, realized_count, planned_amount, realized_amount, notes, created_at, updated_at
         FROM monthly_plans WHERE goal_id = ?1 ORDER BY year DESC, month DESC LIMIT ?2"
    )?;
    
    let plans = stmt
        .query_map(rusqlite::params![goalId, lim], |row| {
            Ok(MonthlyPlan {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                planned_count: row.get(4)?,
                realized_count: row.get(5)?,
                planned_amount: row.get(6)?,
                realized_amount: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(plans)
}

