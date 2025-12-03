use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowGroup {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub is_template: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFlowGroupInput {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub is_template: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFlowGroupInput {
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub is_template: bool,
}

