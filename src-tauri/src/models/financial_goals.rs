use serde::{Deserialize, Serialize};

/// Typ finančního cíle/fondu
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GoalType {
    /// Variabilní výdaj - týdenní s počtem výskytů v měsíci (uklízečka)
    WeeklyVariable,
    /// Fond/Budget - měsíční příspěvek se sledováním zůstatku (kadeřník)
    Fund,
    /// Roční cíl - roční částka s měsícem splátky (pojištění)
    YearlyGoal,
}

/// Finanční cíl nebo fond
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialGoal {
    pub id: i64,
    pub name: String,
    pub goal_type: String, // "weekly_variable", "fund", "yearly_goal"
    pub icon: Option<String>,
    pub color: Option<String>,
    
    // Pro weekly_variable
    pub weekly_amount: Option<f64>,      // Částka za týden (1150 Kč)
    pub day_of_week: Option<i32>,        // Den v týdnu (0=Po, 1=Út, 2=St...)
    
    // Pro fund
    pub monthly_contribution: Option<f64>, // Měsíční příspěvek (2000 Kč)
    pub current_balance: Option<f64>,      // Aktuální zůstatek fondu
    
    // Pro yearly_goal
    pub yearly_amount: Option<f64>,       // Roční částka (10000 Kč)
    pub target_month: Option<i32>,        // Měsíc splátky (1-12, duben=4)
    pub current_saved: Option<f64>,       // Kolik už mám naspořeno
    
    // Společné
    pub account_id: Option<i64>,          // Z jakého účtu se platí
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

/// Měsíční plán pro cíl/fond
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyPlan {
    pub id: i64,
    pub goal_id: i64,
    pub year: i32,
    pub month: i32,
    pub planned_count: i32,
    pub realized_count: i32,
    pub planned_amount: f64,
    pub realized_amount: f64,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMonthlyPlanInput {
    pub goal_id: i64,
    pub year: i32,
    pub month: i32,
    pub planned_count: Option<i32>,
    pub planned_amount: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMonthlyPlanInput {
    pub realized_count: i32,
    pub realized_amount: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGoalInput {
    pub name: String,
    pub goal_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub weekly_amount: Option<f64>,
    pub day_of_week: Option<i32>,
    pub monthly_contribution: Option<f64>,
    pub current_balance: Option<f64>,
    pub yearly_amount: Option<f64>,
    pub target_month: Option<i32>,
    pub current_saved: Option<f64>,
    pub account_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGoalInput {
    pub name: String,
    pub goal_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub weekly_amount: Option<f64>,
    pub day_of_week: Option<i32>,
    pub monthly_contribution: Option<f64>,
    pub current_balance: Option<f64>,
    pub yearly_amount: Option<f64>,
    pub target_month: Option<i32>,
    pub current_saved: Option<f64>,
    pub account_id: Option<i64>,
    pub notes: Option<String>,
    pub is_active: bool,
}

/// Záznam čerpání z fondu
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FundWithdrawal {
    pub id: i64,
    pub goal_id: i64,
    pub amount: f64,
    pub description: Option<String>,
    pub date: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWithdrawalInput {
    pub goal_id: i64,
    pub amount: f64,
    pub description: Option<String>,
    pub date: Option<String>,
}

