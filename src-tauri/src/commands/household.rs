use crate::db::connection::get_connection;
use crate::models::household::*;
use crate::utils::error::Result;

// ============================================
// HOUSEHOLD MEMBERS
// ============================================

#[tauri::command]
pub fn get_household_members() -> Result<Vec<HouseholdMember>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, color, avatar, created_at, updated_at 
         FROM household_members 
         ORDER BY created_at ASC"
    )?;
    
    let members = stmt.query_map([], |row| {
        Ok(HouseholdMember {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            color: row.get(2)?,
            avatar: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(members)
}

#[tauri::command]
pub fn create_household_member(input: CreateMemberInput) -> Result<HouseholdMember> {
    let conn = get_connection()?;
    let color = input.color.unwrap_or_else(|| "#3B82F6".to_string());
    
    conn.execute(
        "INSERT INTO household_members (name, color, avatar) VALUES (?1, ?2, ?3)",
        (&input.name, &color, &input.avatar),
    )?;
    
    let id = conn.last_insert_rowid();
    
    Ok(HouseholdMember {
        id: Some(id),
        name: input.name,
        color,
        avatar: input.avatar,
        created_at: None,
        updated_at: None,
    })
}

#[tauri::command]
pub fn delete_household_member(id: i64) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM household_members WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// MEMBER INCOMES
// ============================================

#[tauri::command]
pub fn get_member_incomes(member_id: i64) -> Result<Vec<MemberIncome>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, member_id, name, amount, frequency, day_of_month, account_id, is_active, created_at, updated_at 
         FROM member_incomes 
         WHERE member_id = ?1
         ORDER BY created_at ASC"
    )?;
    
    let incomes = stmt.query_map([member_id], |row| {
        Ok(MemberIncome {
            id: Some(row.get(0)?),
            member_id: row.get(1)?,
            name: row.get(2)?,
            amount: row.get(3)?,
            frequency: row.get(4)?,
            day_of_month: row.get(5)?,
            account_id: row.get(6)?,
            is_active: row.get::<_, i32>(7)? == 1,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(incomes)
}

#[tauri::command]
pub fn get_all_incomes() -> Result<Vec<MemberIncome>> {
    log::info!("get_all_incomes called");
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, member_id, name, amount, frequency, day_of_month, account_id, is_active, created_at, updated_at 
         FROM member_incomes 
         WHERE is_active = 1
         ORDER BY day_of_month ASC"
    )?;
    
    let incomes = stmt.query_map([], |row| {
        Ok(MemberIncome {
            id: Some(row.get(0)?),
            member_id: row.get(1)?,
            name: row.get(2)?,
            amount: row.get(3)?,
            frequency: row.get(4)?,
            day_of_month: row.get(5)?,
            account_id: row.get(6)?,
            is_active: row.get::<_, i32>(7)? == 1,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    log::info!("get_all_incomes: returning {} incomes", incomes.len());
    Ok(incomes)
}

#[tauri::command]
pub fn create_member_income(input: CreateIncomeInput) -> Result<MemberIncome> {
    let conn = get_connection()?;
    let frequency = input.frequency.unwrap_or_else(|| "monthly".to_string());
    
    conn.execute(
        "INSERT INTO member_incomes (member_id, name, amount, frequency, day_of_month, account_id, is_active) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)",
        (
            input.member_id,
            &input.name,
            input.amount,
            &frequency,
            input.day_of_month,
            input.account_id,
        ),
    )?;
    
    let id = conn.last_insert_rowid();
    
    Ok(MemberIncome {
        id: Some(id),
        member_id: input.member_id,
        name: input.name,
        amount: input.amount,
        frequency,
        day_of_month: input.day_of_month,
        account_id: input.account_id,
        is_active: true,
        created_at: None,
        updated_at: None,
    })
}

#[tauri::command]
pub fn delete_member_income(id: i64) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM member_incomes WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// SCHEDULED TRANSFERS
// ============================================

#[tauri::command]
pub fn get_scheduled_transfers() -> Result<Vec<ScheduledTransfer>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, from_account_id, to_account_id, amount, day_of_month, description, category, display_order, is_active, created_at, updated_at 
         FROM scheduled_transfers 
         WHERE is_active = 1
         ORDER BY day_of_month ASC, display_order ASC"
    )?;
    
    let transfers = stmt.query_map([], |row| {
        Ok(ScheduledTransfer {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            from_account_id: row.get(2)?,
            to_account_id: row.get(3)?,
            amount: row.get(4)?,
            day_of_month: row.get(5)?,
            description: row.get(6)?,
            category: row.get(7)?,
            display_order: row.get(8)?,
            is_active: row.get::<_, i32>(9)? == 1,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(transfers)
}

#[tauri::command]
pub fn create_scheduled_transfer(input: CreateTransferInput) -> Result<ScheduledTransfer> {
    let conn = get_connection()?;
    let category = input.category.unwrap_or_else(|| "internal".to_string());
    
    // Get next display order
    let max_order: i32 = conn.query_row(
        "SELECT COALESCE(MAX(display_order), 0) FROM scheduled_transfers",
        [],
        |row| row.get(0),
    )?;
    
    conn.execute(
        "INSERT INTO scheduled_transfers (name, from_account_id, to_account_id, amount, day_of_month, description, category, display_order, is_active) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)",
        (
            &input.name,
            input.from_account_id,
            input.to_account_id,
            input.amount,
            input.day_of_month,
            &input.description,
            &category,
            max_order + 1,
        ),
    )?;
    
    let id = conn.last_insert_rowid();
    
    Ok(ScheduledTransfer {
        id: Some(id),
        name: input.name,
        from_account_id: input.from_account_id,
        to_account_id: input.to_account_id,
        amount: input.amount,
        day_of_month: input.day_of_month,
        description: input.description,
        category: Some(category),
        display_order: max_order + 1,
        is_active: true,
        created_at: None,
        updated_at: None,
    })
}

#[tauri::command]
pub fn update_scheduled_transfer(id: i64, input: CreateTransferInput) -> Result<ScheduledTransfer> {
    log::info!("update_scheduled_transfer called: id={}", id);
    let conn = get_connection()?;
    let category = input.category.unwrap_or_else(|| "internal".to_string());
    
    conn.execute(
        "UPDATE scheduled_transfers SET name = ?1, from_account_id = ?2, to_account_id = ?3, 
         amount = ?4, day_of_month = ?5, description = ?6, category = ?7, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?8",
        (
            &input.name,
            input.from_account_id,
            input.to_account_id,
            input.amount,
            input.day_of_month,
            &input.description,
            &category,
            id,
        ),
    )?;
    
    // Return updated transfer
    let transfer = conn.query_row(
        "SELECT id, name, from_account_id, to_account_id, amount, day_of_month, description, category, display_order, is_active, created_at, updated_at 
         FROM scheduled_transfers WHERE id = ?1",
        [id],
        |row| {
            Ok(ScheduledTransfer {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                from_account_id: row.get(2)?,
                to_account_id: row.get(3)?,
                amount: row.get(4)?,
                day_of_month: row.get(5)?,
                description: row.get(6)?,
                category: row.get(7)?,
                display_order: row.get(8)?,
                is_active: row.get::<_, i32>(9)? == 1,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        },
    )?;
    
    log::info!("update_scheduled_transfer: done");
    Ok(transfer)
}

#[tauri::command]
pub fn delete_scheduled_transfer(id: i64) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM scheduled_transfers WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// FIXED EXPENSES
// ============================================

#[tauri::command]
pub fn get_fixed_expenses() -> Result<Vec<FixedExpense>> {
    log::info!("get_fixed_expenses called");
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, amount, category, frequency, day_of_month, account_id, assigned_to, is_active, notes, created_at, updated_at 
         FROM fixed_expenses 
         WHERE is_active = 1
         ORDER BY day_of_month ASC, category ASC, name ASC"
    )?;
    
    let expenses = stmt.query_map([], |row| {
        Ok(FixedExpense {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            amount: row.get(2)?,
            category: row.get(3)?,
            frequency: row.get(4)?,
            day_of_month: row.get(5)?,
            account_id: row.get(6)?,
            assigned_to: row.get(7)?,
            is_active: row.get::<_, i32>(8)? == 1,
            notes: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    log::info!("get_fixed_expenses: returning {} expenses", expenses.len());
    Ok(expenses)
}

#[tauri::command]
pub fn create_fixed_expense(input: CreateFixedExpenseInput) -> Result<FixedExpense> {
    log::info!("create_fixed_expense called: {:?}", input.name);
    let conn = get_connection()?;
    let frequency = input.frequency.unwrap_or_else(|| "monthly".to_string());
    let assigned_to = input.assigned_to.unwrap_or_else(|| "shared".to_string());
    
    conn.execute(
        "INSERT INTO fixed_expenses (name, amount, category, frequency, day_of_month, account_id, assigned_to, is_active, notes) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8)",
        (
            &input.name,
            input.amount,
            &input.category,
            &frequency,
            input.day_of_month,
            input.account_id,
            &assigned_to,
            &input.notes,
        ),
    )?;
    
    let id = conn.last_insert_rowid();
    log::info!("create_fixed_expense: done, id={}", id);
    
    Ok(FixedExpense {
        id: Some(id),
        name: input.name,
        amount: input.amount,
        category: input.category,
        frequency,
        day_of_month: input.day_of_month,
        account_id: input.account_id,
        assigned_to: Some(assigned_to),
        is_active: true,
        notes: input.notes,
        created_at: None,
        updated_at: None,
    })
}

#[tauri::command]
pub fn update_fixed_expense(id: i64, input: CreateFixedExpenseInput) -> Result<FixedExpense> {
    log::info!("update_fixed_expense called: id={}", id);
    let conn = get_connection()?;
    let frequency = input.frequency.unwrap_or_else(|| "monthly".to_string());
    let assigned_to = input.assigned_to.unwrap_or_else(|| "shared".to_string());
    
    conn.execute(
        "UPDATE fixed_expenses SET name = ?1, amount = ?2, category = ?3, frequency = ?4, 
         day_of_month = ?5, account_id = ?6, assigned_to = ?7, notes = ?8, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?9",
        (
            &input.name,
            input.amount,
            &input.category,
            &frequency,
            input.day_of_month,
            input.account_id,
            &assigned_to,
            &input.notes,
            id,
        ),
    )?;
    
    // Return updated expense
    let expense = conn.query_row(
        "SELECT id, name, amount, category, frequency, day_of_month, account_id, assigned_to, is_active, notes, created_at, updated_at 
         FROM fixed_expenses WHERE id = ?1",
        [id],
        |row| {
            Ok(FixedExpense {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                amount: row.get(2)?,
                category: row.get(3)?,
                frequency: row.get(4)?,
                day_of_month: row.get(5)?,
                account_id: row.get(6)?,
                assigned_to: row.get(7)?,
                is_active: row.get::<_, i32>(8)? == 1,
                notes: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        },
    )?;
    
    log::info!("update_fixed_expense: done");
    Ok(expense)
}

#[tauri::command]
pub fn delete_fixed_expense(id: i64) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM fixed_expenses WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// BUDGET CATEGORIES
// ============================================

#[tauri::command]
pub fn get_budget_categories() -> Result<Vec<BudgetCategory>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, budget_type, monthly_limit, color, icon, assigned_to, created_at, updated_at 
         FROM budget_categories 
         ORDER BY name ASC"
    )?;
    
    let categories = stmt.query_map([], |row| {
        Ok(BudgetCategory {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            budget_type: row.get(2)?,
            monthly_limit: row.get(3)?,
            color: row.get(4)?,
            icon: row.get(5)?,
            assigned_to: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?.collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(categories)
}

#[tauri::command]
pub fn create_budget_category(input: CreateBudgetCategoryInput) -> Result<BudgetCategory> {
    let conn = get_connection()?;
    let color = input.color.unwrap_or_else(|| "#6B7280".to_string());
    let assigned_to = input.assigned_to.unwrap_or_else(|| "shared".to_string());
    
    conn.execute(
        "INSERT INTO budget_categories (name, budget_type, monthly_limit, color, icon, assigned_to) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (
            &input.name,
            &input.budget_type,
            input.monthly_limit,
            &color,
            &input.icon,
            &assigned_to,
        ),
    )?;
    
    let id = conn.last_insert_rowid();
    
    Ok(BudgetCategory {
        id: Some(id),
        name: input.name,
        budget_type: input.budget_type,
        monthly_limit: input.monthly_limit,
        color,
        icon: input.icon,
        assigned_to: Some(assigned_to),
        created_at: None,
        updated_at: None,
    })
}

#[tauri::command]
pub fn delete_budget_category(id: i64) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM budget_categories WHERE id = ?1", [id])?;
    Ok(())
}

