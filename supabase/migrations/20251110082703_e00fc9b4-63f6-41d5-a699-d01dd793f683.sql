-- =============================================
-- PHASE 1: CORE TABLES & INFRASTRUCTURE
-- =============================================

-- Companies table (top-level organization)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses table
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  manager_id TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company users (multi-tenant user to company mappings)
CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'viewer')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Warehouse users (warehouse-level assignments)
CREATE TABLE warehouse_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'viewer')),
  access_level TEXT DEFAULT 'read' CHECK (access_level IN ('admin', 'manager', 'read', 'write')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, warehouse_id)
);

-- =============================================
-- PHASE 2: EMPLOYEES
-- =============================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_id_auth UUID,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  assigned_warehouse_id UUID REFERENCES warehouses(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  role TEXT DEFAULT 'employee',
  initials TEXT,
  employee_id TEXT,
  department TEXT,
  start_date DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  pay_type TEXT CHECK (pay_type IN ('hourly', 'salary')),
  hourly_rate NUMERIC(10,2),
  annual_salary NUMERIC(12,2),
  tax_withholding_status TEXT CHECK (tax_withholding_status IN ('single', 'married', 'head-of-household')),
  health_insurance_amount NUMERIC(10,2),
  dental_insurance_amount NUMERIC(10,2),
  retirement_401k_amount NUMERIC(10,2),
  other_deductions_amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  invited_at TIMESTAMPTZ,
  avatar_url TEXT,
  page_permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 3: INVENTORY MANAGEMENT
-- =============================================

-- Products table (main inventory items)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  unit_price NUMERIC(10,2) DEFAULT 0,
  cost_price NUMERIC(10,2),
  case_price NUMERIC(10,2),
  case_cost NUMERIC(10,2),
  casesize TEXT,
  upc TEXT,
  asin TEXT,
  dimensions TEXT,
  weight TEXT,
  expiration DATE,
  low_stock_threshold INTEGER DEFAULT 10,
  location TEXT,
  has_batches BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product batches (for batch tracking)
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  location_id UUID,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2),
  expiration_date DATE,
  received_date DATE,
  supplier_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory history (transactions log)
CREATE TABLE inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  quantity INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('incoming', 'outgoing', 'adjustment', 'damaged')),
  reference TEXT,
  notes TEXT,
  remaining_stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 4: LOCATIONS & PALLETS
-- =============================================

-- Pallet locations
CREATE TABLE pallet_locations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pallet products
CREATE TABLE pallet_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id TEXT REFERENCES pallet_locations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 5: CLIENTS
-- =============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  tax_id TEXT,
  business_type TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  payment_terms TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  resale_certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 6: VENDORS
-- =============================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor transactions
CREATE TABLE vendor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase_order', 'invoice', 'payment', 'expense')),
  reference_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 7: ORDERS & SHIPMENTS
-- =============================================

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  customer_name TEXT NOT NULL,
  shipping_address TEXT,
  status TEXT DEFAULT 'pending',
  carrier TEXT,
  tracking_number TEXT,
  shipping_method TEXT,
  ship_date DATE,
  shipment_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order documents
CREATE TABLE order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments table
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  source_po_id UUID,
  shipment_type TEXT DEFAULT 'incoming' CHECK (shipment_type IN ('incoming', 'outgoing')),
  supplier TEXT NOT NULL,
  order_reference TEXT NOT NULL,
  expected_date DATE NOT NULL,
  received_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially-received', 'received', 'inspected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment items
CREATE TABLE shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  expected_qty INTEGER NOT NULL,
  received_qty INTEGER DEFAULT 0,
  damaged_qty INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 8: PURCHASE ORDERS
-- =============================================

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  po_number TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  vendor_email TEXT,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'confirmed', 'received', 'partially_received', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PO items
CREATE TABLE po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  item_sku TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 9: BILLING & INVOICING
-- =============================================

-- Invoice templates
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  design_config JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  invoice_number TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES invoice_templates(id),
  client_name TEXT,
  client_contact_email TEXT,
  client_contact_phone TEXT,
  client_billing_address TEXT,
  client_payment_terms_days INTEGER,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'paid', 'overdue', 'cancelled')),
  subtotal NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  payment_link TEXT,
  pdf_url TEXT,
  email_sent_at TIMESTAMPTZ,
  payment_due_reminder_sent_at TIMESTAMPTZ,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  product_description TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  stock_at_creation INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items (alternative/legacy)
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice payments
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT REFERENCES invoices(id),
  user_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice emails log
CREATE TABLE invoice_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT REFERENCES invoices(id),
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  error_message TEXT
);

-- Billing rates
CREATE TABLE billing_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  service_type TEXT NOT NULL,
  rate_type TEXT NOT NULL,
  rate_amount NUMERIC(10,2) NOT NULL,
  unit TEXT,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring invoices
CREATE TABLE recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  template_data JSONB NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_invoice_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 10: FINANCIAL/ACCOUNTING SYSTEM
-- =============================================

-- Account types
CREATE TABLE account_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  account_type_id UUID REFERENCES account_types(id),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  description TEXT,
  opening_balance NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, account_code)
);

-- Journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'voided')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entry lines
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id),
  description TEXT,
  debit_amount NUMERIC(15,2) DEFAULT 0,
  credit_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 11: ACCOUNTS PAYABLE
-- =============================================

-- Vendor bills
CREATE TABLE vendor_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  po_id UUID,
  bill_number TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('pending_invoice', 'unpaid', 'partially_paid', 'paid', 'overdue')),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor bill payments
CREATE TABLE vendor_bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_bill_id UUID REFERENCES vendor_bills(id),
  user_id UUID NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 12: BANKING
-- =============================================

-- Bank accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('checking', 'savings', 'credit', 'other')),
  routing_number TEXT,
  current_balance NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  last_reconciled_date DATE,
  plaid_access_token TEXT,
  plaid_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES bank_accounts(id),
  user_id UUID NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('debit', 'credit')),
  category TEXT,
  status TEXT DEFAULT 'unmatched' CHECK (status IN ('matched', 'unmatched', 'pending')),
  matched_entry_id UUID,
  plaid_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Petty cash entries
CREATE TABLE petty_cash_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  transaction_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('disbursement', 'replenishment')),
  category TEXT,
  description TEXT NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 13: TASKS
-- =============================================

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  assigned_to UUID,
  assigned_by UUID,
  warehouse_id UUID REFERENCES warehouses(id),
  company_id UUID REFERENCES companies(id),
  start_time TIMESTAMPTZ,
  pause_time TIMESTAMPTZ,
  resume_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_duration INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  time_tracking_status TEXT DEFAULT 'not_started' CHECK (time_tracking_status IN ('not_started', 'in_progress', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task audit log
CREATE TABLE task_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 14: INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_products_user_warehouse ON products(user_id, warehouse_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_user_warehouse ON orders(user_id, warehouse_id);
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_warehouse ON invoices(warehouse_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_warehouse_users_user ON warehouse_users(user_id);
CREATE INDEX idx_warehouse_users_warehouse ON warehouse_users(warehouse_id);
CREATE INDEX idx_employees_user_auth ON employees(user_id_auth);
CREATE INDEX idx_employees_warehouse ON employees(assigned_warehouse_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_warehouse ON tasks(warehouse_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_warehouse ON shipments(warehouse_id);

-- =============================================
-- PHASE 15: RLS HELPER FUNCTIONS
-- =============================================

-- Function to get user's company IDs
CREATE OR REPLACE FUNCTION get_user_company_ids(user_uuid UUID)
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(company_id)
  FROM company_users
  WHERE user_id = user_uuid AND approval_status = 'approved';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is company admin
CREATE OR REPLACE FUNCTION is_company_admin(user_uuid UUID, comp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = user_uuid
    AND company_id = comp_id
    AND role = 'admin'
    AND approval_status = 'approved'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get employee's assigned warehouse
CREATE OR REPLACE FUNCTION get_employee_assigned_warehouse(user_uuid UUID)
RETURNS UUID AS $$
  SELECT assigned_warehouse_id
  FROM employees
  WHERE user_id_auth = user_uuid
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get accessible warehouses for a user
CREATE OR REPLACE FUNCTION get_accessible_warehouses(user_uuid UUID)
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(DISTINCT warehouse_id)
  FROM warehouse_users
  WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- PHASE 16: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 17: RLS POLICIES - COMPANIES
-- =============================================

CREATE POLICY "Users can view companies they belong to"
  ON companies FOR SELECT
  USING (id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert companies"
  ON companies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Company admins can update their companies"
  ON companies FOR UPDATE
  USING (is_company_admin(auth.uid(), id));

CREATE POLICY "Company admins can delete their companies"
  ON companies FOR DELETE
  USING (is_company_admin(auth.uid(), id));

-- =============================================
-- PHASE 18: RLS POLICIES - WAREHOUSES
-- =============================================

CREATE POLICY "Users can view warehouses in their companies"
  ON warehouses FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can insert warehouses"
  ON warehouses FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can update warehouses"
  ON warehouses FOR UPDATE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can delete warehouses"
  ON warehouses FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

-- =============================================
-- PHASE 19: RLS POLICIES - COMPANY_USERS
-- =============================================

CREATE POLICY "Users can view their own company memberships"
  ON company_users FOR SELECT
  USING (user_id = auth.uid() OR is_company_admin(auth.uid(), company_id));

CREATE POLICY "Anyone can insert company_users (for signup)"
  ON company_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Company admins can update company_users"
  ON company_users FOR UPDATE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can delete company_users"
  ON company_users FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

-- =============================================
-- PHASE 20: RLS POLICIES - WAREHOUSE_USERS
-- =============================================

CREATE POLICY "Users can view their warehouse memberships"
  ON warehouse_users FOR SELECT
  USING (user_id = auth.uid() OR warehouse_id = ANY(get_accessible_warehouses(auth.uid())));

CREATE POLICY "Company admins can insert warehouse_users"
  ON warehouse_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM warehouses
      WHERE id = warehouse_id
      AND is_company_admin(auth.uid(), company_id)
    )
  );

CREATE POLICY "Company admins can update warehouse_users"
  ON warehouse_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM warehouses
      WHERE id = warehouse_id
      AND is_company_admin(auth.uid(), company_id)
    )
  );

CREATE POLICY "Company admins can delete warehouse_users"
  ON warehouse_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM warehouses
      WHERE id = warehouse_id
      AND is_company_admin(auth.uid(), company_id)
    )
  );

-- =============================================
-- PHASE 21: RLS POLICIES - EMPLOYEES
-- =============================================

CREATE POLICY "Users can view employees in their companies"
  ON employees FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can insert employees"
  ON employees FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can update employees"
  ON employees FOR UPDATE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can delete employees"
  ON employees FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

-- =============================================
-- PHASE 22: RLS POLICIES - PRODUCTS
-- =============================================

CREATE POLICY "Users can view products in their companies"
  ON products FOR SELECT
  USING (
    company_id = ANY(get_user_company_ids(auth.uid()))
  );

CREATE POLICY "Users can insert products in their companies"
  ON products FOR INSERT
  WITH CHECK (
    company_id = ANY(get_user_company_ids(auth.uid()))
  );

CREATE POLICY "Users can update products in their companies"
  ON products FOR UPDATE
  USING (
    company_id = ANY(get_user_company_ids(auth.uid()))
  );

CREATE POLICY "Company admins can delete products"
  ON products FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

-- =============================================
-- PHASE 23: RLS POLICIES - PRODUCT_BATCHES
-- =============================================

CREATE POLICY "Users can view product_batches in their companies"
  ON product_batches FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert product_batches"
  ON product_batches FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update product_batches"
  ON product_batches FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete product_batches"
  ON product_batches FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- =============================================
-- PHASE 24: RLS POLICIES - INVENTORY_HISTORY
-- =============================================

CREATE POLICY "Users can view inventory_history in their companies"
  ON inventory_history FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert inventory_history"
  ON inventory_history FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

-- =============================================
-- PHASE 25: RLS POLICIES - PALLETS
-- =============================================

CREATE POLICY "Users can view pallet_locations in their companies"
  ON pallet_locations FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert pallet_locations"
  ON pallet_locations FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update pallet_locations"
  ON pallet_locations FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete pallet_locations"
  ON pallet_locations FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can view pallet_products in their companies"
  ON pallet_products FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert pallet_products"
  ON pallet_products FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update pallet_products"
  ON pallet_products FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete pallet_products"
  ON pallet_products FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- =============================================
-- PHASE 26: RLS POLICIES - CLIENTS
-- =============================================

CREATE POLICY "Users can view clients in their companies"
  ON clients FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete clients"
  ON clients FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

-- =============================================
-- PHASE 27: RLS POLICIES - VENDORS
-- =============================================

CREATE POLICY "Users can view vendors in their companies"
  ON vendors FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert vendors"
  ON vendors FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update vendors"
  ON vendors FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete vendors"
  ON vendors FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view vendor_transactions"
  ON vendor_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_transactions.vendor_id
      AND vendors.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert vendor_transactions"
  ON vendor_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_transactions.vendor_id
      AND vendors.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 28: RLS POLICIES - ORDERS
-- =============================================

CREATE POLICY "Users can view orders in their companies"
  ON orders FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert orders"
  ON orders FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update orders"
  ON orders FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete orders"
  ON orders FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update order_items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can delete order_items"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can view order_documents"
  ON order_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_documents.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert order_documents"
  ON order_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_documents.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can delete order_documents"
  ON order_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_documents.order_id
      AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 29: RLS POLICIES - SHIPMENTS
-- =============================================

CREATE POLICY "Users can view shipments in their companies"
  ON shipments FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert shipments"
  ON shipments FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update shipments"
  ON shipments FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete shipments"
  ON shipments FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view shipment_items"
  ON shipment_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_items.shipment_id
      AND shipments.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert shipment_items"
  ON shipment_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_items.shipment_id
      AND shipments.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update shipment_items"
  ON shipment_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_items.shipment_id
      AND shipments.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can delete shipment_items"
  ON shipment_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_items.shipment_id
      AND shipments.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 30: RLS POLICIES - PURCHASE ORDERS
-- =============================================

CREATE POLICY "Users can view purchase_orders in their companies"
  ON purchase_orders FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert purchase_orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update purchase_orders"
  ON purchase_orders FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete purchase_orders"
  ON purchase_orders FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view po_items"
  ON po_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = po_items.po_id
      AND purchase_orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert po_items"
  ON po_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = po_items.po_id
      AND purchase_orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update po_items"
  ON po_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = po_items.po_id
      AND purchase_orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can delete po_items"
  ON po_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE purchase_orders.id = po_items.po_id
      AND purchase_orders.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 31: RLS POLICIES - INVOICES
-- =============================================

CREATE POLICY "Users can view invoice_templates in their companies"
  ON invoice_templates FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert invoice_templates"
  ON invoice_templates FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update invoice_templates"
  ON invoice_templates FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete invoice_templates"
  ON invoice_templates FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can view invoices in their companies"
  ON invoices FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update invoices"
  ON invoices FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete invoices"
  ON invoices FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view invoice_items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert invoice_items"
  ON invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update invoice_items"
  ON invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can delete invoice_items"
  ON invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can view invoice_line_items"
  ON invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert invoice_line_items"
  ON invoice_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can view invoice_payments"
  ON invoice_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert invoice_payments"
  ON invoice_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can view invoice_emails"
  ON invoice_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_emails.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert invoice_emails"
  ON invoice_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_emails.invoice_id
      AND invoices.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can view billing_rates in their companies"
  ON billing_rates FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert billing_rates"
  ON billing_rates FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update billing_rates"
  ON billing_rates FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete billing_rates"
  ON billing_rates FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can view recurring_invoices in their companies"
  ON recurring_invoices FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert recurring_invoices"
  ON recurring_invoices FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update recurring_invoices"
  ON recurring_invoices FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete recurring_invoices"
  ON recurring_invoices FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- =============================================
-- PHASE 32: RLS POLICIES - ACCOUNTING
-- =============================================

CREATE POLICY "Everyone can view account_types"
  ON account_types FOR SELECT
  USING (true);

CREATE POLICY "Users can view accounts in their companies"
  ON accounts FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert accounts"
  ON accounts FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update accounts"
  ON accounts FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete accounts"
  ON accounts FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view journal_entries in their companies"
  ON journal_entries FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert journal_entries"
  ON journal_entries FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update journal_entries"
  ON journal_entries FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete journal_entries"
  ON journal_entries FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view journal_entry_lines"
  ON journal_entry_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_entry_lines.journal_entry_id
      AND journal_entries.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert journal_entry_lines"
  ON journal_entry_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_entry_lines.journal_entry_id
      AND journal_entries.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update journal_entry_lines"
  ON journal_entry_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_entry_lines.journal_entry_id
      AND journal_entries.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can delete journal_entry_lines"
  ON journal_entry_lines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_entry_lines.journal_entry_id
      AND journal_entries.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 33: RLS POLICIES - ACCOUNTS PAYABLE
-- =============================================

CREATE POLICY "Users can view vendor_bills in their companies"
  ON vendor_bills FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert vendor_bills"
  ON vendor_bills FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update vendor_bills"
  ON vendor_bills FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete vendor_bills"
  ON vendor_bills FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view vendor_bill_payments"
  ON vendor_bill_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendor_bills
      WHERE vendor_bills.id = vendor_bill_payments.vendor_bill_id
      AND vendor_bills.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert vendor_bill_payments"
  ON vendor_bill_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_bills
      WHERE vendor_bills.id = vendor_bill_payments.vendor_bill_id
      AND vendor_bills.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 34: RLS POLICIES - BANKING
-- =============================================

CREATE POLICY "Users can view bank_accounts in their companies"
  ON bank_accounts FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert bank_accounts"
  ON bank_accounts FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update bank_accounts"
  ON bank_accounts FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete bank_accounts"
  ON bank_accounts FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view bank_transactions"
  ON bank_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = bank_transactions.bank_account_id
      AND bank_accounts.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert bank_transactions"
  ON bank_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = bank_transactions.bank_account_id
      AND bank_accounts.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update bank_transactions"
  ON bank_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = bank_transactions.bank_account_id
      AND bank_accounts.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can view petty_cash_entries in their companies"
  ON petty_cash_entries FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert petty_cash_entries"
  ON petty_cash_entries FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update petty_cash_entries"
  ON petty_cash_entries FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete petty_cash_entries"
  ON petty_cash_entries FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- =============================================
-- PHASE 35: RLS POLICIES - TASKS
-- =============================================

CREATE POLICY "Users can view tasks in their companies"
  ON tasks FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete tasks"
  ON tasks FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view task_audit_log"
  ON task_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_audit_log.task_id
      AND tasks.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert task_audit_log"
  ON task_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_audit_log.task_id
      AND tasks.company_id = ANY(get_user_company_ids(auth.uid()))
    )
  );

-- =============================================
-- PHASE 36: DATABASE FUNCTIONS
-- =============================================

-- Function to generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  po_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-%';
  
  po_number := 'PO-' || LPAD(next_num::TEXT, 6, '0');
  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to reduce invoice inventory (also used for fixing existing invoices)
CREATE OR REPLACE FUNCTION reduce_invoice_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'draft' AND NEW.status IN ('sent', 'paid', 'approved') THEN
    UPDATE products p
    SET quantity = p.quantity - ii.quantity
    FROM invoice_items ii
    WHERE ii.invoice_id = NEW.id
    AND ii.product_id = p.id;
    
    INSERT INTO inventory_history (product_id, quantity, transaction_type, reference, user_id, warehouse_id, company_id)
    SELECT 
      ii.product_id,
      -ii.quantity,
      'outgoing',
      'Invoice: ' || NEW.invoice_number,
      NEW.user_id,
      NEW.warehouse_id,
      NEW.company_id
    FROM invoice_items ii
    WHERE ii.invoice_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_status_inventory_reduction
  AFTER UPDATE ON invoices
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION reduce_invoice_inventory();

-- Function to fix existing invoice inventory (callable from code)
CREATE OR REPLACE FUNCTION fix_existing_invoice_inventory(invoice_uuid TEXT)
RETURNS JSONB AS $$
DECLARE
  invoice_rec RECORD;
  result JSONB;
BEGIN
  SELECT * INTO invoice_rec FROM invoices WHERE id = invoice_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invoice not found');
  END IF;
  
  IF invoice_rec.status = 'draft' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invoice is still in draft status');
  END IF;
  
  UPDATE products p
  SET quantity = p.quantity - ii.quantity
  FROM invoice_items ii
  WHERE ii.invoice_id = invoice_uuid
  AND ii.product_id = p.id;
  
  INSERT INTO inventory_history (product_id, quantity, transaction_type, reference, user_id, warehouse_id, company_id)
  SELECT 
    ii.product_id,
    -ii.quantity,
    'outgoing',
    'Invoice Fix: ' || invoice_rec.invoice_number,
    invoice_rec.user_id,
    invoice_rec.warehouse_id,
    invoice_rec.company_id
  FROM invoice_items ii
  WHERE ii.invoice_id = invoice_uuid;
  
  RETURN jsonb_build_object('success', true, 'message', 'Inventory adjusted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign employee to warehouse
CREATE OR REPLACE FUNCTION assign_employee_to_warehouse(employee_uuid UUID, warehouse_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE employees
  SET assigned_warehouse_id = warehouse_uuid
  WHERE id = employee_uuid;
  
  INSERT INTO warehouse_users (user_id, warehouse_id, role, access_level)
  SELECT user_id_auth, warehouse_uuid, 'staff', 'write'
  FROM employees
  WHERE id = employee_uuid AND user_id_auth IS NOT NULL
  ON CONFLICT (user_id, warehouse_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user task metrics
CREATE OR REPLACE FUNCTION get_user_task_metrics(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_tasks', COUNT(*),
    'completed_tasks', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending_tasks', COUNT(*) FILTER (WHERE status = 'pending'),
    'in_progress_tasks', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'completion_rate', CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0 
    END,
    'is_user_specific', true
  ) INTO result
  FROM tasks
  WHERE assigned_to = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_users_updated_at BEFORE UPDATE ON company_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_users_updated_at BEFORE UPDATE ON warehouse_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON product_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pallet_locations_updated_at BEFORE UPDATE ON pallet_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pallet_products_updated_at BEFORE UPDATE ON pallet_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipment_items_updated_at BEFORE UPDATE ON shipment_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_po_items_updated_at BEFORE UPDATE ON po_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON invoice_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_line_items_updated_at BEFORE UPDATE ON invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_rates_updated_at BEFORE UPDATE ON billing_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_invoices_updated_at BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_bills_updated_at BEFORE UPDATE ON vendor_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PHASE 37: SEED DATA
-- =============================================

-- Insert default account types for accounting
INSERT INTO account_types (name, category, description) VALUES
  ('Cash', 'Asset', 'Cash and cash equivalents'),
  ('Accounts Receivable', 'Asset', 'Money owed by customers'),
  ('Inventory', 'Asset', 'Goods available for sale'),
  ('Fixed Assets', 'Asset', 'Long-term assets'),
  ('Accounts Payable', 'Liability', 'Money owed to vendors'),
  ('Short-term Debt', 'Liability', 'Debt due within one year'),
  ('Long-term Debt', 'Liability', 'Debt due after one year'),
  ('Owners Equity', 'Equity', 'Owner investments'),
  ('Retained Earnings', 'Equity', 'Accumulated profits'),
  ('Sales Revenue', 'Revenue', 'Income from sales'),
  ('Service Revenue', 'Revenue', 'Income from services'),
  ('Cost of Goods Sold', 'Expense', 'Direct costs of products sold'),
  ('Operating Expenses', 'Expense', 'General business expenses'),
  ('Payroll Expenses', 'Expense', 'Employee compensation'),
  ('Depreciation', 'Expense', 'Asset depreciation');