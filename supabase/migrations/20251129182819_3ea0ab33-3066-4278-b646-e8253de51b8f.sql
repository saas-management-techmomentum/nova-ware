-- Add indexes for user-related queries to optimize performance

-- Index for company_users lookups by user and approval status
CREATE INDEX IF NOT EXISTS idx_company_users_user_approval 
ON company_users(user_id, approval_status);

-- Index for employees by user_id_auth (for current employee lookup)
CREATE INDEX IF NOT EXISTS idx_employees_user_id_auth 
ON employees(user_id_auth) WHERE user_id_auth IS NOT NULL;

-- Index for warehouse_users user lookup
CREATE INDEX IF NOT EXISTS idx_warehouse_users_user 
ON warehouse_users(user_id);

-- Composite index for warehouse_users role checks
CREATE INDEX IF NOT EXISTS idx_warehouse_users_user_warehouse 
ON warehouse_users(user_id, warehouse_id);