-- Fix security warnings: Add search_path to all functions

-- Fix get_user_company_ids
CREATE OR REPLACE FUNCTION get_user_company_ids(user_uuid UUID)
RETURNS UUID[] 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(company_id)
  FROM company_users
  WHERE user_id = user_uuid AND approval_status = 'approved';
$$;

-- Fix is_company_admin
CREATE OR REPLACE FUNCTION is_company_admin(user_uuid UUID, comp_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = user_uuid
    AND company_id = comp_id
    AND role = 'admin'
    AND approval_status = 'approved'
  );
$$;

-- Fix get_employee_assigned_warehouse
CREATE OR REPLACE FUNCTION get_employee_assigned_warehouse(user_uuid UUID)
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_warehouse_id
  FROM employees
  WHERE user_id_auth = user_uuid
  LIMIT 1;
$$;

-- Fix get_accessible_warehouses
CREATE OR REPLACE FUNCTION get_accessible_warehouses(user_uuid UUID)
RETURNS UUID[] 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT warehouse_id)
  FROM warehouse_users
  WHERE user_id = user_uuid;
$$;

-- Fix reduce_invoice_inventory
CREATE OR REPLACE FUNCTION reduce_invoice_inventory()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Fix fix_existing_invoice_inventory
CREATE OR REPLACE FUNCTION fix_existing_invoice_inventory(invoice_uuid TEXT)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix assign_employee_to_warehouse
CREATE OR REPLACE FUNCTION assign_employee_to_warehouse(employee_uuid UUID, warehouse_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Fix get_user_task_metrics
CREATE OR REPLACE FUNCTION get_user_task_metrics(user_uuid UUID)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix generate_po_number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;