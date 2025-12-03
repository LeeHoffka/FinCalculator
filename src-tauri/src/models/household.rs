use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HouseholdMember {
    pub id: Option<i64>,
    pub name: String,
    pub color: String,
    pub avatar: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberIncome {
    pub id: Option<i64>,
    pub member_id: i64,
    pub name: String,
    pub amount: f64,
    pub frequency: String,
    pub day_of_month: Option<i32>,
    pub account_id: Option<i64>,
    pub is_active: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledTransfer {
    pub id: Option<i64>,
    pub name: String,
    pub from_account_id: i64,
    pub to_account_id: i64,
    pub amount: f64,
    pub day_of_month: i32,
    pub description: Option<String>,
    pub category: Option<String>,
    pub display_order: i32,
    pub is_active: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixedExpense {
    pub id: Option<i64>,
    pub name: String,
    pub amount: f64,
    pub category: String,
    pub frequency: String,
    pub day_of_month: Option<i32>,
    pub assigned_to: Option<String>,
    pub is_active: bool,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetCategory {
    pub id: Option<i64>,
    pub name: String,
    pub budget_type: String,
    pub monthly_limit: f64,
    pub color: String,
    pub icon: Option<String>,
    pub assigned_to: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// Input structs for creating/updating
#[derive(Debug, Deserialize)]
pub struct CreateMemberInput {
    pub name: String,
    pub color: Option<String>,
    pub avatar: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateIncomeInput {
    pub member_id: i64,
    pub name: String,
    pub amount: f64,
    pub frequency: Option<String>,
    pub day_of_month: Option<i32>,
    pub account_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransferInput {
    pub name: String,
    pub from_account_id: i64,
    pub to_account_id: i64,
    pub amount: f64,
    pub day_of_month: i32,
    pub description: Option<String>,
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFixedExpenseInput {
    pub name: String,
    pub amount: f64,
    pub category: String,
    pub frequency: Option<String>,
    pub day_of_month: Option<i32>,
    pub assigned_to: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBudgetCategoryInput {
    pub name: String,
    pub budget_type: String,
    pub monthly_limit: f64,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub assigned_to: Option<String>,
}

