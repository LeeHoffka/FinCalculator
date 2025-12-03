use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub avatar: Option<String>,
    pub role: String,
    pub is_shared_user: bool,
    pub active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserInput {
    pub name: String,
    pub color: Option<String>,
    pub avatar: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserInput {
    pub name: String,
    pub color: String,
    pub avatar: Option<String>,
    pub role: String,
    pub active: bool,
}

