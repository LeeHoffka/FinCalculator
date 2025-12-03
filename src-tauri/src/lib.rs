mod commands;
mod db;
mod models;
mod utils;

use db::connection::init_database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Inicializace databáze
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&app_dir)?;

            let db_path = app_dir.join("finance.db");
            init_database(db_path.to_str().unwrap())?;

            log::info!("Aplikace inicializována");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Users
            commands::create_user,
            commands::get_users,
            commands::update_user,
            commands::delete_user,
            // Banks
            commands::create_bank,
            commands::get_banks,
            commands::update_bank,
            commands::delete_bank,
            // Accounts
            commands::create_account,
            commands::get_accounts,
            commands::get_account_by_id,
            commands::update_account,
            commands::delete_account,
            commands::get_account_balance,
            // Categories
            commands::create_category,
            commands::get_categories,
            commands::get_category_tree,
            commands::update_category,
            commands::delete_category,
            // Transactions
            commands::create_transaction,
            commands::get_transactions,
            commands::get_transaction_by_id,
            commands::update_transaction,
            commands::delete_transaction,
            commands::get_transactions_filtered,
            // Tags
            commands::create_tag,
            commands::get_tags,
            commands::add_tag_to_transaction,
            commands::remove_tag_from_transaction,
            // Recurring Payments
            commands::create_recurring_payment,
            commands::get_recurring_payments,
            commands::update_recurring_payment,
            commands::delete_recurring_payment,
            commands::process_recurring_payments,
            // Flow Groups
            commands::create_flow_group,
            commands::get_flow_groups,
            commands::update_flow_group,
            commands::delete_flow_group,
            commands::add_transaction_to_flow,
            commands::remove_transaction_from_flow,
            // Savings Goals
            commands::create_savings_goal,
            commands::get_savings_goals,
            commands::update_savings_goal,
            commands::delete_savings_goal,
            // Backup & Export
            commands::export_database,
            commands::import_database,
            commands::export_transactions_csv,
            // Reports
            commands::get_monthly_summary,
            commands::get_category_breakdown,
            commands::get_cash_flow_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
