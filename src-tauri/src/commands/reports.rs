use crate::db::connection::get_connection;
use crate::utils::error::Result;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct MonthlySummary {
    pub month: String,
    pub total_income: f64,
    pub total_expense: f64,
    pub net_change: f64,
    pub by_category: Vec<CategoryBreakdown>,
}

#[derive(Debug, Serialize)]
pub struct CategoryBreakdown {
    pub category_id: i64,
    pub category_name: String,
    pub category_color: String,
    pub amount: f64,
    pub percentage: f64,
    pub transaction_count: i64,
}

#[derive(Debug, Serialize)]
pub struct CashFlowData {
    pub date: String,
    pub income: f64,
    pub expense: f64,
    pub balance: f64,
}

#[tauri::command]
pub fn get_monthly_summary(year: i32, month: i32) -> Result<MonthlySummary> {
    let conn = get_connection()?;

    let start_date = format!("{:04}-{:02}-01", year, month);
    let end_date = if month == 12 {
        format!("{:04}-01-01", year + 1)
    } else {
        format!("{:04}-{:02}-01", year, month + 1)
    };

    // Celkový příjem
    let total_income: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE transaction_type = 'income' AND status = 'completed'
             AND date >= ?1 AND date < ?2",
            [&start_date, &end_date],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Celkové výdaje
    let total_expense: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE transaction_type = 'expense' AND status = 'completed'
             AND date >= ?1 AND date < ?2",
            [&start_date, &end_date],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    // Rozpad podle kategorií
    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.color, SUM(t.amount) as total, COUNT(t.id) as count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.transaction_type = 'expense' AND t.status = 'completed'
         AND t.date >= ?1 AND t.date < ?2
         GROUP BY c.id
         ORDER BY total DESC",
    )?;

    let categories: Vec<CategoryBreakdown> = stmt
        .query_map([&start_date, &end_date], |row| {
            let amount: f64 = row.get(3)?;
            Ok(CategoryBreakdown {
                category_id: row.get(0)?,
                category_name: row.get(1)?,
                category_color: row.get(2)?,
                amount,
                percentage: if total_expense > 0.0 {
                    (amount / total_expense) * 100.0
                } else {
                    0.0
                },
                transaction_count: row.get(4)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(MonthlySummary {
        month: format!("{:04}-{:02}", year, month),
        total_income,
        total_expense,
        net_change: total_income - total_expense,
        by_category: categories,
    })
}

#[tauri::command]
pub fn get_category_breakdown(start_date: String, end_date: String) -> Result<Vec<CategoryBreakdown>> {
    let conn = get_connection()?;

    let total_expense: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions 
             WHERE transaction_type = 'expense' AND status = 'completed'
             AND date >= ?1 AND date <= ?2",
            [&start_date, &end_date],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.color, SUM(t.amount) as total, COUNT(t.id) as count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.transaction_type = 'expense' AND t.status = 'completed'
         AND t.date >= ?1 AND t.date <= ?2
         GROUP BY c.id
         ORDER BY total DESC",
    )?;

    let categories = stmt
        .query_map([&start_date, &end_date], |row| {
            let amount: f64 = row.get(3)?;
            Ok(CategoryBreakdown {
                category_id: row.get(0)?,
                category_name: row.get(1)?,
                category_color: row.get(2)?,
                amount,
                percentage: if total_expense > 0.0 {
                    (amount / total_expense) * 100.0
                } else {
                    0.0
                },
                transaction_count: row.get(4)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(categories)
}

#[tauri::command]
pub fn get_cash_flow_data(start_date: String, end_date: String) -> Result<Vec<CashFlowData>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT date(date) as day,
         SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expense
         FROM transactions
         WHERE status = 'completed' AND date >= ?1 AND date <= ?2
         GROUP BY day
         ORDER BY day",
    )?;

    let mut running_balance = 0.0;
    let data: Vec<CashFlowData> = stmt
        .query_map([&start_date, &end_date], |row| {
            let income: f64 = row.get(1)?;
            let expense: f64 = row.get(2)?;
            Ok((row.get::<_, String>(0)?, income, expense))
        })?
        .filter_map(|r| r.ok())
        .map(|(date, income, expense)| {
            running_balance += income - expense;
            CashFlowData {
                date,
                income,
                expense,
                balance: running_balance,
            }
        })
        .collect();

    Ok(data)
}

