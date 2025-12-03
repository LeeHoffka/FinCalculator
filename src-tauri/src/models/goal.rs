use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavingsGoal {
    pub id: i64,
    pub name: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub currency: String,
    pub deadline: Option<String>,
    pub account_id: Option<i64>,
    pub auto_deposit_amount: Option<f64>,
    pub auto_deposit_frequency: Option<String>,
    pub active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSavingsGoalInput {
    pub name: String,
    pub target_amount: f64,
    pub currency: Option<String>,
    pub deadline: Option<String>,
    pub account_id: Option<i64>,
    pub auto_deposit_amount: Option<f64>,
    pub auto_deposit_frequency: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSavingsGoalInput {
    pub name: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub currency: String,
    pub deadline: Option<String>,
    pub account_id: Option<i64>,
    pub auto_deposit_amount: Option<f64>,
    pub auto_deposit_frequency: Option<String>,
    pub active: bool,
}

