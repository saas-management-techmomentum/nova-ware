-- ============================================================================
-- PHASE 0: CRITICAL SECURITY FIX - Role Management System
-- ============================================================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee', 'viewer');

-- 2. Create user_roles table with proper RLS
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, company_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their companies"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = user_roles.company_id
      AND ur.role = 'admin'::public.app_role
  )
);

-- 3. Create has_role() security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _company_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;

-- 4. Migrate existing roles from company_users
INSERT INTO public.user_roles (user_id, company_id, role, created_at)
SELECT 
  user_id, 
  company_id, 
  role::public.app_role,
  created_at
FROM public.company_users
WHERE approval_status = 'approved'
  AND role IN ('admin', 'manager', 'employee', 'viewer')
ON CONFLICT (user_id, company_id, role) DO NOTHING;

-- 5. Update is_company_admin() to use has_role()
CREATE OR REPLACE FUNCTION public.is_company_admin(user_uuid UUID, comp_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_uuid, comp_id, 'admin'::public.app_role);
$$;

-- ============================================================================
-- PHASE 0.5: BACKFILL USER PROFILES
-- ============================================================================

-- Backfill profiles for existing auth.users without profiles
INSERT INTO public.profiles (id, display_name, onboarding_enabled, onboarding_completed, onboarding_current_step)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email) as display_name,
  true as onboarding_enabled,
  false as onboarding_completed,
  0 as onboarding_current_step
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- ============================================================================
-- PHASE 2: EXTENDED SCHEMA COLUMNS
-- ============================================================================

-- Extend journal_entries table
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Backfill created_by for existing journal entries
UPDATE public.journal_entries 
SET created_by = user_id 
WHERE created_by IS NULL;

-- Extend company_users table
ALTER TABLE public.company_users
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Update RLS policies to use has_role() - Example for key tables

-- Accounts table policies
DROP POLICY IF EXISTS "Company admins can delete accounts" ON public.accounts;
CREATE POLICY "Company admins can delete accounts"
ON public.accounts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Invoices table policies
DROP POLICY IF EXISTS "Company admins can delete invoices" ON public.invoices;
CREATE POLICY "Company admins can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Clients table policies
DROP POLICY IF EXISTS "Company admins can delete clients" ON public.clients;
CREATE POLICY "Company admins can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Employees table policies
DROP POLICY IF EXISTS "Company admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Company admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Company admins can update employees" ON public.employees;

CREATE POLICY "Company admins can delete employees"
ON public.employees FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

CREATE POLICY "Company admins can insert employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

CREATE POLICY "Company admins can update employees"
ON public.employees FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Journal Entries policies
DROP POLICY IF EXISTS "Company admins can delete journal_entries" ON public.journal_entries;
CREATE POLICY "Company admins can delete journal_entries"
ON public.journal_entries FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Order Statuses policies
DROP POLICY IF EXISTS "Company admins can delete order_statuses" ON public.order_statuses;
CREATE POLICY "Company admins can delete order_statuses"
ON public.order_statuses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Orders policies
DROP POLICY IF EXISTS "Company admins can delete orders" ON public.orders;
CREATE POLICY "Company admins can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Bank Accounts policies
DROP POLICY IF EXISTS "Company admins can delete bank_accounts" ON public.bank_accounts;
CREATE POLICY "Company admins can delete bank_accounts"
ON public.bank_accounts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Company Users policies
DROP POLICY IF EXISTS "Company admins can delete company_users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can update company_users" ON public.company_users;

CREATE POLICY "Company admins can delete company_users"
ON public.company_users FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

CREATE POLICY "Company admins can update company_users"
ON public.company_users FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- ============================================================================
-- PHASE 3: ADVANCED FEATURES - New Tables
-- ============================================================================

-- 3A. billing_transactions table for expense tracking
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL, -- 'expense', 'income', 'transfer'
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT,
  reference TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view billing_transactions in their companies"
ON public.billing_transactions FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert billing_transactions"
ON public.billing_transactions FOR INSERT
TO authenticated
WITH CHECK (company_id = ANY(public.get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update billing_transactions"
ON public.billing_transactions FOR UPDATE
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete billing_transactions"
ON public.billing_transactions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Trigger for updated_at on billing_transactions
CREATE TRIGGER update_billing_transactions_updated_at
BEFORE UPDATE ON public.billing_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3B. order_workflows table for workflow management
CREATE TABLE IF NOT EXISTS public.order_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  picking_strategy TEXT DEFAULT 'FIFO', -- 'FIFO', 'LIFO', 'FEFO'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflows in their companies"
ON public.order_workflows FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert workflows"
ON public.order_workflows FOR INSERT
TO authenticated
WITH CHECK (company_id = ANY(public.get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update workflows"
ON public.order_workflows FOR UPDATE
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

CREATE POLICY "Company admins can delete workflows"
ON public.order_workflows FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), company_id, 'admin'::public.app_role));

-- Trigger for updated_at on order_workflows
CREATE TRIGGER update_order_workflows_updated_at
BEFORE UPDATE ON public.order_workflows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3C. workflow_steps table
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.order_workflows(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  assigned_to UUID REFERENCES public.employees(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_time INTEGER, -- in minutes
  actual_time INTEGER, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow_steps"
ON public.workflow_steps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_workflows
    WHERE id = workflow_steps.workflow_id
    AND company_id = ANY(public.get_user_company_ids(auth.uid()))
  )
);

CREATE POLICY "Users can insert workflow_steps"
ON public.workflow_steps FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_workflows
    WHERE id = workflow_steps.workflow_id
    AND company_id = ANY(public.get_user_company_ids(auth.uid()))
  )
);

CREATE POLICY "Users can update workflow_steps"
ON public.workflow_steps FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_workflows
    WHERE id = workflow_steps.workflow_id
    AND company_id = ANY(public.get_user_company_ids(auth.uid()))
  )
);

-- ============================================================================
-- PHASE 4: ESSENTIAL RPC FUNCTIONS
-- ============================================================================

-- 4A. generate_batch_number() function
CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  batch_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 7) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.product_batches
  WHERE batch_number LIKE 'BATCH-%';
  
  batch_number := 'BATCH-' || LPAD(next_num::TEXT, 6, '0');
  RETURN batch_number;
END;
$$;

-- 4B. allocate_inventory_fefo() function
CREATE OR REPLACE FUNCTION public.allocate_inventory_fefo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(batch_id UUID, allocated_qty INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_batches AS (
    SELECT 
      pb.id,
      pb.quantity,
      pb.expiration_date,
      pb.received_date,
      SUM(pb.quantity) OVER (ORDER BY pb.expiration_date ASC NULLS LAST, pb.received_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total
    FROM public.product_batches pb
    WHERE pb.product_id = p_product_id
      AND (p_warehouse_id IS NULL OR pb.warehouse_id = p_warehouse_id)
      AND pb.quantity > 0
    ORDER BY pb.expiration_date ASC NULLS LAST, pb.received_date ASC
  )
  SELECT 
    rb.id,
    CASE 
      WHEN rb.running_total <= p_quantity THEN rb.quantity
      WHEN rb.running_total - rb.quantity < p_quantity THEN p_quantity - (rb.running_total - rb.quantity)
      ELSE 0
    END::INTEGER as allocated_qty
  FROM ranked_batches rb
  WHERE rb.running_total - rb.quantity < p_quantity
  ORDER BY rb.expiration_date ASC NULLS LAST, rb.received_date ASC;
END;
$$;

-- 4C. safe_assign_user_to_warehouse() function
CREATE OR REPLACE FUNCTION public.safe_assign_user_to_warehouse(
  p_user_id UUID,
  p_warehouse_id UUID,
  p_access_level TEXT DEFAULT 'write'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if warehouse exists and user has access to company
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = p_warehouse_id
    AND w.company_id = ANY(public.get_user_company_ids(p_user_id))
  ) THEN
    RAISE EXCEPTION 'Warehouse not found or access denied';
  END IF;

  INSERT INTO public.warehouse_users (user_id, warehouse_id, access_level)
  VALUES (p_user_id, p_warehouse_id, p_access_level)
  ON CONFLICT (user_id, warehouse_id) 
  DO UPDATE SET access_level = p_access_level, updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 4D. get_user_data_scope() function
CREATE OR REPLACE FUNCTION public.get_user_data_scope(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'company_ids', COALESCE(ARRAY_AGG(DISTINCT cu.company_id) FILTER (WHERE cu.company_id IS NOT NULL), ARRAY[]::UUID[]),
    'admin_company_ids', COALESCE(ARRAY_AGG(DISTINCT ur.company_id) FILTER (WHERE ur.role = 'admin' AND ur.company_id IS NOT NULL), ARRAY[]::UUID[]),
    'warehouse_ids', COALESCE(ARRAY_AGG(DISTINCT wu.warehouse_id) FILTER (WHERE wu.warehouse_id IS NOT NULL), ARRAY[]::UUID[]),
    'is_multi_company_admin', COUNT(DISTINCT ur.company_id) FILTER (WHERE ur.role = 'admin') > 1,
    'total_companies', COUNT(DISTINCT cu.company_id),
    'total_warehouses', COUNT(DISTINCT wu.warehouse_id)
  )
  INTO result
  FROM public.company_users cu
  LEFT JOIN public.user_roles ur ON ur.user_id = cu.user_id AND ur.company_id = cu.company_id
  LEFT JOIN public.warehouse_users wu ON wu.user_id = cu.user_id
  WHERE cu.user_id = p_user_id
    AND cu.approval_status = 'approved';
  
  RETURN COALESCE(result, jsonb_build_object(
    'user_id', p_user_id,
    'company_ids', '[]'::jsonb,
    'admin_company_ids', '[]'::jsonb,
    'warehouse_ids', '[]'::jsonb,
    'is_multi_company_admin', false,
    'total_companies', 0,
    'total_warehouses', 0
  ));
END;
$$;

-- ============================================================================
-- PHASE 5: RELATIONS & CONSTRAINTS (WITHOUT PROBLEMATIC FK)
-- ============================================================================

-- 5B. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON public.products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

CREATE INDEX IF NOT EXISTS idx_orders_warehouse_id ON public.orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_batches_expiration ON public.product_batches(expiration_date);
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_id ON public.product_batches(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON public.journal_entries(company_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_users_user_id ON public.warehouse_users(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_users_warehouse_id ON public.warehouse_users(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_company ON public.user_roles(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_role ON public.user_roles(company_id, role);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_company ON public.billing_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_date ON public.billing_transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_order_workflows_order ON public.order_workflows(order_id);
CREATE INDEX IF NOT EXISTS idx_order_workflows_status ON public.order_workflows(status);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON public.workflow_steps(workflow_id);

-- 5C. Set default values for new columns
UPDATE public.journal_entries SET total_amount = 0 WHERE total_amount IS NULL;
UPDATE public.journal_entries SET created_by = user_id WHERE created_by IS NULL;
UPDATE public.company_users SET permissions = '{}'::jsonb WHERE permissions IS NULL;