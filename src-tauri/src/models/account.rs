use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: i64,
    pub name: String,
    pub account_type: String,
    pub bank_id: Option<i64>,
    pub owner_user_id: Option<i64>,
    pub account_number: Option<String>,
    pub currency: String,
    pub initial_balance: f64,
    pub current_balance: f64,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountInput {
    pub name: String,
    pub account_type: String,
    pub bank_id: Option<i64>,
    pub owner_user_id: Option<i64>,
    pub account_number: Option<String>,
    pub currency: String,
    pub initial_balance: f64,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountInput {
    pub name: String,
    pub account_type: String,
    pub bank_id: Option<i64>,
    pub owner_user_id: Option<i64>,
    pub account_number: Option<String>,
    pub currency: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub active: bool,
}

