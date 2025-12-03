use crate::db::connection::get_connection;
use crate::models::{Category, CreateCategoryInput, UpdateCategoryInput};
use crate::utils::error::{AppError, Result};

#[tauri::command]
pub fn create_category(input: CreateCategoryInput) -> Result<Category> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO categories (name, parent_category_id, icon, color, category_type, is_system)
         VALUES (?1, ?2, ?3, ?4, ?5, 0)",
        rusqlite::params![
            input.name,
            input.parent_category_id,
            input.icon,
            input.color.unwrap_or_else(|| "#6B7280".to_string()),
            input.category_type,
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_category_by_id(id)
}

fn get_category_by_id(id: i64) -> Result<Category> {
    let conn = get_connection()?;

    conn.query_row("SELECT * FROM categories WHERE id = ?1", [id], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_category_id: row.get(2)?,
            icon: row.get(3)?,
            color: row.get(4)?,
            category_type: row.get(5)?,
            is_system: row.get::<_, i32>(6)? != 0,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            children: None,
        })
    })
    .map_err(Into::into)
}

#[tauri::command]
pub fn get_categories() -> Result<Vec<Category>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT * FROM categories ORDER BY name")?;
    let categories = stmt
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_category_id: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                category_type: row.get(5)?,
                is_system: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                children: None,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(categories)
}

#[tauri::command]
pub fn get_category_tree() -> Result<Vec<Category>> {
    let categories = get_categories()?;
    Ok(build_category_tree(categories))
}

fn build_category_tree(categories: Vec<Category>) -> Vec<Category> {
    let mut root_categories: Vec<Category> = categories
        .iter()
        .filter(|c| c.parent_category_id.is_none())
        .cloned()
        .collect();

    for root in &mut root_categories {
        root.children = Some(get_children(&categories, root.id));
    }

    root_categories
}

fn get_children(categories: &[Category], parent_id: i64) -> Vec<Category> {
    let mut children: Vec<Category> = categories
        .iter()
        .filter(|c| c.parent_category_id == Some(parent_id))
        .cloned()
        .collect();

    for child in &mut children {
        child.children = Some(get_children(categories, child.id));
    }

    children
}

#[tauri::command]
pub fn update_category(id: i64, input: UpdateCategoryInput) -> Result<Category> {
    let conn = get_connection()?;

    // Nelze upravit systémové kategorie
    let is_system: i32 = conn.query_row(
        "SELECT is_system FROM categories WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if is_system != 0 {
        return Err(AppError::InvalidInput(
            "Systémové kategorie nelze upravovat".to_string(),
        ));
    }

    conn.execute(
        "UPDATE categories SET name = ?1, parent_category_id = ?2, icon = ?3, color = ?4, category_type = ?5
         WHERE id = ?6",
        rusqlite::params![
            input.name,
            input.parent_category_id,
            input.icon,
            input.color,
            input.category_type,
            id
        ],
    )?;

    get_category_by_id(id)
}

#[tauri::command]
pub fn delete_category(id: i64) -> Result<()> {
    let conn = get_connection()?;

    // Nelze smazat systémové kategorie
    let is_system: i32 = conn.query_row(
        "SELECT is_system FROM categories WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if is_system != 0 {
        return Err(AppError::InvalidInput(
            "Systémové kategorie nelze mazat".to_string(),
        ));
    }

    conn.execute("DELETE FROM categories WHERE id = ?1", [id])?;

    Ok(())
}

