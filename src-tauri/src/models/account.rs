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
    pub is_premium: bool,
    pub premium_min_flow: Option<f64>,
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
    pub currency: Option<String>,
    pub initial_balance: Option<f64>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub is_premium: Option<bool>,
    pub premium_min_flow: Option<f64>,
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
    pub is_premium: Option<bool>,
    pub premium_min_flow: Option<f64>,
    pub active: bool,
}

