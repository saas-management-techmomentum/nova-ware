-- =====================================================
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- Creates comprehensive indexes for all major tables
-- to dramatically improve query performance across the app
-- =====================================================

-- Products Table Indexes (Inventory Page)
CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_warehouse_user ON products(warehouse_id, user_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(warehouse_id, quantity) WHERE quantity <= 10 AND warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_company_sku ON products(company_id, sku) WHERE company_id IS NOT NULL;

-- Orders Table Indexes (Orders Page)
CREATE INDEX IF NOT EXISTS idx_orders_warehouse ON orders(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse_status ON orders(warehouse_id, status) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_company_created ON orders(company_id, created_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Order Items and Documents Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku);
CREATE INDEX IF NOT EXISTS idx_order_documents_order ON order_documents(order_id) WHERE order_id IS NOT NULL;

-- Shipments Table Indexes (Shipments Page)
CREATE INDEX IF NOT EXISTS idx_shipments_warehouse ON shipments(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_expected ON shipments(expected_date);
CREATE INDEX IF NOT EXISTS idx_shipments_type ON shipments(shipment_type) WHERE shipment_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_warehouse_status ON shipments(warehouse_id, status) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at DESC);

-- Shipment Items Index
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_sku ON shipment_items(sku);

-- Clients Table Indexes (Clients Page)
CREATE INDEX IF NOT EXISTS idx_clients_warehouse ON clients(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_id, name) WHERE company_id IS NOT NULL;

-- Vendors Table Indexes (Vendors Page)
CREATE INDEX IF NOT EXISTS idx_vendors_company ON vendors(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_warehouse ON vendors(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_user ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active) WHERE is_active IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_id, vendor_name) WHERE company_id IS NOT NULL;

-- Tasks Table Indexes (Dashboard & Employee Management)
CREATE INDEX IF NOT EXISTS idx_tasks_warehouse ON tasks(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_warehouse_status ON tasks(warehouse_id, status) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Pallet Locations Indexes (Locations Page)
CREATE INDEX IF NOT EXISTS idx_pallet_locations_warehouse ON pallet_locations(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pallet_locations_company ON pallet_locations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pallet_locations_user ON pallet_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_pallet_products_pallet ON pallet_products(pallet_id);
CREATE INDEX IF NOT EXISTS idx_pallet_products_user ON pallet_products(user_id);
CREATE INDEX IF NOT EXISTS idx_pallet_products_product ON pallet_products(product_id);
CREATE INDEX IF NOT EXISTS idx_pallet_products_warehouse ON pallet_products(warehouse_id) WHERE warehouse_id IS NOT NULL;

-- Employees Table Indexes (Employee Management)
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_warehouse ON employees(assigned_warehouse_id) WHERE assigned_warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_auth ON employees(user_id_auth) WHERE user_id_auth IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_company_status ON employees(company_id, status) WHERE company_id IS NOT NULL;

-- Warehouse Users Indexes (RLS Performance)
CREATE INDEX IF NOT EXISTS idx_warehouse_users_user_warehouse ON warehouse_users(user_id, warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_users_warehouse ON warehouse_users(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_users_user ON warehouse_users(user_id);

-- Warehouses Table Indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active) WHERE is_active IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_company_active ON warehouses(company_id, is_active) WHERE company_id IS NOT NULL;

-- Company Users Indexes (RLS Performance)
CREATE INDEX IF NOT EXISTS idx_company_users_user ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_users_user_company ON company_users(user_id, company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_users_approval ON company_users(approval_status) WHERE approval_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(role);

-- Invoices Table Indexes (Financial Pages)
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_warehouse ON invoices(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON invoices(company_id, status) WHERE company_id IS NOT NULL;

-- Invoice Items Index
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id) WHERE product_id IS NOT NULL;

-- Product Batches Indexes (Inventory Management)
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiration ON product_batches(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_batches_user ON product_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_location ON product_batches(location_id) WHERE location_id IS NOT NULL;

-- Inventory History Indexes (Audit Trail)
CREATE INDEX IF NOT EXISTS idx_inventory_history_product ON inventory_history(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_history_warehouse ON inventory_history(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_history_created ON inventory_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_history_type ON inventory_history(transaction_type);

-- Journal Entries Indexes (Financial)
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created ON journal_entries(created_at DESC);

-- Accounts Indexes (Financial)
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_warehouse ON accounts(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active) WHERE is_active IS NOT NULL;