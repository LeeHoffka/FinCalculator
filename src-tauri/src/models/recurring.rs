use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurringPayment {
    pub id: i64,
    pub name: String,
    pub amount: f64,
    pub currency: String,
    pub frequency: String,
    pub frequency_value: i32,
    pub day_of_period: Option<i32>,
    pub account_id: i64,
    pub category_id: Option<i64>,
    pub description: Option<String>,
    pub active: bool,
    pub next_execution_date: Option<String>,
    pub last_execution_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecurringPaymentInput {
    pub name: String,
    pub amount: f64,
    pub currency: Option<String>,
    pub frequency: String,
    pub frequency_value: Option<i32>,
    pub day_of_period: Option<i32>,
    pub account_id: i64,
    pub category_id: Option<i64>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRecurringPaymentInput {
    pub name: String,
    pub amount: f64,
    pub currency: String,
    pub frequency: String,
    pub frequency_value: i32,
    pub day_of_period: Option<i32>,
    pub account_id: i64,
    pub category_id: Option<i64>,
    pub description: Option<String>,
    pub active: bool,
}

