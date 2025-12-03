use crate::db::schema::SCHEMA;
use crate::utils::error::{AppError, Result};
use once_cell::sync::OnceCell;
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

static DB_PATH: OnceCell<PathBuf> = OnceCell::new();
static CONNECTION: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn init_database(path: &str) -> Result<()> {
    let path_buf = PathBuf::from(path);
    DB_PATH
        .set(path_buf.clone())
        .map_err(|_| AppError::Internal("Databáze již byla inicializována".to_string()))?;

    let conn = Connection::open(&path_buf)?;

    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    // Execute schema
    conn.execute_batch(SCHEMA)?;

    CONNECTION
        .set(Mutex::new(conn))
        .map_err(|_| AppError::Internal("Připojení již existuje".to_string()))?;

    log::info!("Databáze inicializována: {:?}", path_buf);
    Ok(())
}

pub fn get_connection() -> Result<std::sync::MutexGuard<'static, Connection>> {
    CONNECTION
        .get()
        .ok_or_else(|| AppError::Internal("Databáze není inicializována".to_string()))?
        .lock()
        .map_err(|e| AppError::Internal(format!("Chyba zámku databáze: {}", e)))
}

pub fn get_db_path() -> Result<PathBuf> {
    DB_PATH
        .get()
        .cloned()
        .ok_or_else(|| AppError::Internal("Cesta k databázi není nastavena".to_string()))
}

