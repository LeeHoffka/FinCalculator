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
            commands::set_account_balance,
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
            commands::export_full_backup,
            commands::save_backup_to_file,
            commands::import_from_backup_file,
            // Reports
            commands::get_monthly_summary,
            commands::get_category_breakdown,
            commands::get_cash_flow_data,
            // Household Members
            commands::get_household_members,
            commands::create_household_member,
            commands::delete_household_member,
            // Member Incomes
            commands::get_member_incomes,
            commands::get_all_incomes,
            commands::create_member_income,
            commands::delete_member_income,
            // Scheduled Transfers
            commands::get_scheduled_transfers,
            commands::create_scheduled_transfer,
            commands::update_scheduled_transfer,
            commands::delete_scheduled_transfer,
            // Fixed Expenses
            commands::get_fixed_expenses,
            commands::create_fixed_expense,
            commands::update_fixed_expense,
            commands::delete_fixed_expense,
            // Budget Categories
            commands::get_budget_categories,
            commands::create_budget_category,
            commands::delete_budget_category,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
