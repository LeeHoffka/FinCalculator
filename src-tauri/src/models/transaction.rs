use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: i64,
    pub date: String,
    pub amount: f64,
    pub currency: String,
    pub transaction_type: String,
    pub from_account_id: Option<i64>,
    pub to_account_id: Option<i64>,
    pub category_id: Option<i64>,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub is_shared: bool,
    pub status: String,
    pub recurring_payment_id: Option<i64>,
    pub flow_group_id: Option<i64>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionInput {
    pub date: String,
    pub amount: f64,
    pub currency: Option<String>,
    pub transaction_type: String,
    pub from_account_id: Option<i64>,
    pub to_account_id: Option<i64>,
    pub category_id: Option<i64>,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub is_shared: Option<bool>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionInput {
    pub date: String,
    pub amount: f64,
    pub currency: String,
    pub transaction_type: String,
    pub from_account_id: Option<i64>,
    pub to_account_id: Option<i64>,
    pub category_id: Option<i64>,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub is_shared: bool,
    pub status: String,
    pub notes: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct TransactionFilters {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub user_ids: Option<Vec<i64>>,
    pub account_ids: Option<Vec<i64>>,
    pub bank_ids: Option<Vec<i64>>,
    pub category_ids: Option<Vec<i64>>,
    pub tag_ids: Option<Vec<i64>>,
    pub types: Option<Vec<String>>,
    pub statuses: Option<Vec<String>>,
    pub min_amount: Option<f64>,
    pub max_amount: Option<f64>,
    pub search_query: Option<String>,
}

