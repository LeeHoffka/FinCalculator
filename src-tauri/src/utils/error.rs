use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum AppError {
    #[error("Chyba databáze: {0}")]
    Database(String),

    #[error("Záznam nenalezen: {0}")]
    NotFound(String),

    #[error("Neplatný vstup: {0}")]
    InvalidInput(String),

    #[error("Chyba IO: {0}")]
    Io(String),

    #[error("Interní chyba: {0}")]
    Internal(String),
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        match err {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound("Záznam nebyl nalezen".to_string())
            }
            _ => AppError::Database(err.to_string()),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

impl From<csv::Error> for AppError {
    fn from(err: csv::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::InvalidInput(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;

