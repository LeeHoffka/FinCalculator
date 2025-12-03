use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bank {
    pub id: i64,
    pub name: String,
    pub logo: Option<String>,
    pub color: String,
    pub notes: Option<String>,
    pub active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateBankInput {
    pub name: String,
    pub logo: Option<String>,
    pub color: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBankInput {
    pub name: String,
    pub logo: Option<String>,
    pub color: String,
    pub notes: Option<String>,
    pub active: bool,
}

