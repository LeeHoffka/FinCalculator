use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub parent_category_id: Option<i64>,
    pub icon: Option<String>,
    pub color: String,
    pub category_type: String,
    pub is_system: bool,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<Category>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryInput {
    pub name: String,
    pub parent_category_id: Option<i64>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub category_type: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryInput {
    pub name: String,
    pub parent_category_id: Option<i64>,
    pub icon: Option<String>,
    pub color: String,
    pub category_type: String,
}

