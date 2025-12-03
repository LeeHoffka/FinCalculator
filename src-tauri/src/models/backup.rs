use serde::{Deserialize, Serialize};
use super::household::*;
use super::bank::Bank;

/// Complete backup structure for export/import
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FullBackup {
    pub version: String,
    pub created_at: String,
    pub data: BackupData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupData {
    pub household_members: Vec<HouseholdMemberWithIncomes>,
    pub banks: Vec<BankWithAccounts>,
    pub scheduled_transfers: Vec<ScheduledTransfer>,
    pub fixed_expenses: Vec<FixedExpense>,
    pub budget_categories: Vec<BudgetCategory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HouseholdMemberWithIncomes {
    pub member: HouseholdMember,
    pub incomes: Vec<MemberIncome>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankWithAccounts {
    pub bank: Bank,
    pub accounts: Vec<AccountExtended>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountExtended {
    pub id: Option<i64>,
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
}

impl Default for FullBackup {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            data: BackupData::default(),
        }
    }
}

impl Default for BackupData {
    fn default() -> Self {
        Self {
            household_members: vec![],
            banks: vec![],
            scheduled_transfers: vec![],
            fixed_expenses: vec![],
            budget_categories: vec![],
        }
    }
}

