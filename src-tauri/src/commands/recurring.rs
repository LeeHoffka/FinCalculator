use crate::db::connection::get_connection;
use crate::models::{CreateRecurringPaymentInput, RecurringPayment, UpdateRecurringPaymentInput};
use crate::utils::error::Result;
use chrono::{Datelike, Duration, NaiveDate, Utc};

#[tauri::command]
pub fn create_recurring_payment(input: CreateRecurringPaymentInput) -> Result<RecurringPayment> {
    let conn = get_connection()?;

    let next_date = calculate_next_execution_date(
        &input.frequency,
        input.frequency_value.unwrap_or(1),
        input.day_of_period,
    );

    conn.execute(
        "INSERT INTO recurring_payments (name, amount, currency, frequency, frequency_value,
         day_of_period, account_id, category_id, description, active, next_execution_date)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10)",
        rusqlite::params![
            input.name,
            input.amount,
            input.currency.unwrap_or_else(|| "CZK".to_string()),
            input.frequency,
            input.frequency_value.unwrap_or(1),
            input.day_of_period,
            input.account_id,
            input.category_id,
            input.description,
            next_date,
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_recurring_payment_by_id(id)
}

fn get_recurring_payment_by_id(id: i64) -> Result<RecurringPayment> {
    let conn = get_connection()?;

    conn.query_row(
        "SELECT * FROM recurring_payments WHERE id = ?1",
        [id],
        |row| {
            Ok(RecurringPayment {
                id: row.get(0)?,
                name: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                frequency: row.get(4)?,
                frequency_value: row.get(5)?,
                day_of_period: row.get(6)?,
                account_id: row.get(7)?,
                category_id: row.get(8)?,
                description: row.get(9)?,
                active: row.get::<_, i32>(10)? != 0,
                next_execution_date: row.get(11)?,
                last_execution_date: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        },
    )
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_recurring_payments() -> Result<Vec<RecurringPayment>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT * FROM recurring_payments ORDER BY name")?;
    let payments = stmt
        .query_map([], |row| {
            Ok(RecurringPayment {
                id: row.get(0)?,
                name: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                frequency: row.get(4)?,
                frequency_value: row.get(5)?,
                day_of_period: row.get(6)?,
                account_id: row.get(7)?,
                category_id: row.get(8)?,
                description: row.get(9)?,
                active: row.get::<_, i32>(10)? != 0,
                next_execution_date: row.get(11)?,
                last_execution_date: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(payments)
}

#[tauri::command]
pub fn update_recurring_payment(
    id: i64,
    input: UpdateRecurringPaymentInput,
) -> Result<RecurringPayment> {
    let conn = get_connection()?;

    conn.execute(
        "UPDATE recurring_payments SET name = ?1, amount = ?2, currency = ?3, frequency = ?4,
         frequency_value = ?5, day_of_period = ?6, account_id = ?7, category_id = ?8,
         description = ?9, active = ?10
         WHERE id = ?11",
        rusqlite::params![
            input.name,
            input.amount,
            input.currency,
            input.frequency,
            input.frequency_value,
            input.day_of_period,
            input.account_id,
            input.category_id,
            input.description,
            input.active as i32,
            id
        ],
    )?;

    get_recurring_payment_by_id(id)
}

#[tauri::command]
pub fn delete_recurring_payment(id: i64) -> Result<()> {
    let conn = get_connection()?;

    conn.execute("DELETE FROM recurring_payments WHERE id = ?1", [id])?;

    Ok(())
}

#[tauri::command]
pub fn process_recurring_payments() -> Result<()> {
    let conn = get_connection()?;
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let mut stmt = conn.prepare(
        "SELECT * FROM recurring_payments WHERE active = 1 AND next_execution_date <= ?1",
    )?;

    let payments: Vec<RecurringPayment> = stmt
        .query_map([&today], |row| {
            Ok(RecurringPayment {
                id: row.get(0)?,
                name: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                frequency: row.get(4)?,
                frequency_value: row.get(5)?,
                day_of_period: row.get(6)?,
                account_id: row.get(7)?,
                category_id: row.get(8)?,
                description: row.get(9)?,
                active: row.get::<_, i32>(10)? != 0,
                next_execution_date: row.get(11)?,
                last_execution_date: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    for payment in payments {
        // Vytvořit transakci
        conn.execute(
            "INSERT INTO transactions (date, amount, currency, transaction_type, from_account_id,
             category_id, description, status, recurring_payment_id)
             VALUES (?1, ?2, ?3, 'expense', ?4, ?5, ?6, 'completed', ?7)",
            rusqlite::params![
                today,
                payment.amount,
                payment.currency,
                payment.account_id,
                payment.category_id,
                payment.description,
                payment.id,
            ],
        )?;

        // Aktualizovat zůstatek účtu
        conn.execute(
            "UPDATE accounts SET current_balance = current_balance - ?1 WHERE id = ?2",
            rusqlite::params![payment.amount, payment.account_id],
        )?;

        // Aktualizovat recurring payment
        let next_date = calculate_next_execution_date(
            &payment.frequency,
            payment.frequency_value,
            payment.day_of_period,
        );

        conn.execute(
            "UPDATE recurring_payments SET last_execution_date = ?1, next_execution_date = ?2 WHERE id = ?3",
            rusqlite::params![today, next_date, payment.id],
        )?;
    }

    Ok(())
}

fn calculate_next_execution_date(
    frequency: &str,
    frequency_value: i32,
    day_of_period: Option<i32>,
) -> String {
    let today = Utc::now().date_naive();

    let next = match frequency {
        "daily" => today + Duration::days(frequency_value as i64),
        "weekly" => today + Duration::weeks(frequency_value as i64),
        "monthly" => {
            let day = day_of_period.unwrap_or(today.day() as i32);
            let mut next_month = today.month() + frequency_value as u32;
            let mut next_year = today.year();

            while next_month > 12 {
                next_month -= 12;
                next_year += 1;
            }

            NaiveDate::from_ymd_opt(next_year, next_month, day.min(28) as u32)
                .unwrap_or(today + Duration::days(30))
        }
        "yearly" => {
            NaiveDate::from_ymd_opt(today.year() + frequency_value, today.month(), today.day())
                .unwrap_or(today + Duration::days(365))
        }
        _ => today + Duration::days(frequency_value as i64),
    };

    next.format("%Y-%m-%d").to_string()
}

