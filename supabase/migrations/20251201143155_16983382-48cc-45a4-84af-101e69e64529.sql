-- Seed standard Chart of Accounts for new companies
-- This provides a basic accounting structure for all financial transactions

-- First, ensure we have standard account types (with correct capitalization)
INSERT INTO account_types (id, name, category, description) VALUES
  (gen_random_uuid(), 'Cash', 'Asset', 'Cash and cash equivalents'),
  (gen_random_uuid(), 'Accounts Receivable', 'Asset', 'Money owed by customers'),
  (gen_random_uuid(), 'Inventory', 'Asset', 'Product inventory value'),
  (gen_random_uuid(), 'Accounts Payable', 'Liability', 'Money owed to vendors'),
  (gen_random_uuid(), 'Sales Revenue', 'Revenue', 'Revenue from sales'),
  (gen_random_uuid(), 'Service Revenue', 'Revenue', 'Revenue from services'),
  (gen_random_uuid(), 'Cost of Goods Sold', 'Expense', 'Direct costs of products sold'),
  (gen_random_uuid(), 'Operating Expenses', 'Expense', 'General operating expenses'),
  (gen_random_uuid(), 'Payroll Expense', 'Expense', 'Employee compensation costs')
ON CONFLICT DO NOTHING;

-- Function to seed chart of accounts for a company
CREATE OR REPLACE FUNCTION seed_chart_of_accounts_for_company(p_company_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cash_type_id uuid;
  v_ar_type_id uuid;
  v_inventory_type_id uuid;
  v_ap_type_id uuid;
  v_sales_revenue_type_id uuid;
  v_service_revenue_type_id uuid;
  v_cogs_type_id uuid;
  v_operating_expense_type_id uuid;
  v_payroll_expense_type_id uuid;
BEGIN
  -- Get account type IDs
  SELECT id INTO v_cash_type_id FROM account_types WHERE name = 'Cash' AND category = 'Asset' LIMIT 1;
  SELECT id INTO v_ar_type_id FROM account_types WHERE name = 'Accounts Receivable' AND category = 'Asset' LIMIT 1;
  SELECT id INTO v_inventory_type_id FROM account_types WHERE name = 'Inventory' AND category = 'Asset' LIMIT 1;
  SELECT id INTO v_ap_type_id FROM account_types WHERE name = 'Accounts Payable' AND category = 'Liability' LIMIT 1;
  SELECT id INTO v_sales_revenue_type_id FROM account_types WHERE name = 'Sales Revenue' AND category = 'Revenue' LIMIT 1;
  SELECT id INTO v_service_revenue_type_id FROM account_types WHERE name = 'Service Revenue' AND category = 'Revenue' LIMIT 1;
  SELECT id INTO v_cogs_type_id FROM account_types WHERE name = 'Cost of Goods Sold' AND category = 'Expense' LIMIT 1;
  SELECT id INTO v_operating_expense_type_id FROM account_types WHERE name = 'Operating Expenses' AND category = 'Expense' LIMIT 1;
  SELECT id INTO v_payroll_expense_type_id FROM account_types WHERE name = 'Payroll Expense' AND category = 'Expense' LIMIT 1;

  -- Insert standard accounts for the company
  INSERT INTO accounts (account_code, account_name, account_type_id, user_id, company_id, opening_balance, current_balance, description) VALUES
    ('1000', 'Cash', v_cash_type_id, p_user_id, p_company_id, 0, 0, 'Cash and cash equivalents'),
    ('1100', 'Accounts Receivable', v_ar_type_id, p_user_id, p_company_id, 0, 0, 'Money owed by customers'),
    ('1200', 'Inventory', v_inventory_type_id, p_user_id, p_company_id, 0, 0, 'Product inventory value'),
    ('2000', 'Accounts Payable', v_ap_type_id, p_user_id, p_company_id, 0, 0, 'Money owed to vendors'),
    ('4000', 'Sales Revenue', v_sales_revenue_type_id, p_user_id, p_company_id, 0, 0, 'Revenue from product sales'),
    ('4100', 'Service Revenue', v_service_revenue_type_id, p_user_id, p_company_id, 0, 0, 'Revenue from services'),
    ('5000', 'Cost of Goods Sold', v_cogs_type_id, p_user_id, p_company_id, 0, 0, 'Direct costs of products sold'),
    ('5100', 'Operating Expenses', v_operating_expense_type_id, p_user_id, p_company_id, 0, 0, 'General operating expenses'),
    ('5200', 'Payroll Expense', v_payroll_expense_type_id, p_user_id, p_company_id, 0, 0, 'Employee compensation costs')
  ON CONFLICT (account_code, company_id) DO NOTHING;
END;
$$;

-- Seed accounts for all existing companies that don't have accounts yet
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN 
    SELECT DISTINCT c.id as company_id, cu.user_id
    FROM companies c
    JOIN company_users cu ON cu.company_id = c.id
    WHERE cu.role = 'admin' AND cu.approval_status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM accounts WHERE company_id = c.id LIMIT 1
    )
  LOOP
    PERFORM seed_chart_of_accounts_for_company(company_record.company_id, company_record.user_id);
  END LOOP;
END;
$$;