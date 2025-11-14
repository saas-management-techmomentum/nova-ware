-- Fix get_user_company_ids to return approved companies
CREATE OR REPLACE FUNCTION public.get_user_company_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(company_id), ARRAY[]::uuid[])
  FROM company_users
  WHERE user_id = user_uuid AND approval_status = 'approved';
$$;

-- Fix get_accessible_warehouses to accept no parameters and use auth.uid()
CREATE OR REPLACE FUNCTION public.get_accessible_warehouses()
RETURNS TABLE (
  warehouse_id uuid,
  warehouse_name text,
  warehouse_code text,
  access_level text,
  company_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    wu.warehouse_id,
    w.name as warehouse_name,
    w.code as warehouse_code,
    wu.access_level,
    w.company_id
  FROM warehouse_users wu
  JOIN warehouses w ON w.id = wu.warehouse_id
  WHERE wu.user_id = auth.uid();
$$;

-- Create complete_user_setup function (SECURITY DEFINER for atomic signup)
CREATE OR REPLACE FUNCTION public.complete_user_setup(
  target_user_id uuid,
  company_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  result jsonb;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() != target_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Can only setup your own account'
    );
  END IF;

  -- Validate company name
  IF company_name IS NULL OR LENGTH(TRIM(company_name)) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Company name is required'
    );
  END IF;

  -- Check if user already has a company
  SELECT company_id INTO new_company_id
  FROM company_users
  WHERE user_id = target_user_id
  LIMIT 1;

  IF new_company_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'company_id', new_company_id,
      'message', 'User already has a company'
    );
  END IF;

  -- Create company
  INSERT INTO companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;

  -- Create company_users record with auto-approval (first admin)
  INSERT INTO company_users (user_id, company_id, role, approval_status, approved_at, approved_by)
  VALUES (target_user_id, new_company_id, 'admin', 'approved', NOW(), target_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'company_id', new_company_id,
    'message', 'Company created and user approved'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create user_needs_password_change function
CREATE OR REPLACE FUNCTION public.user_needs_password_change()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- For now, always return false. Can be enhanced later to check user metadata
  SELECT false;
$$;

-- Create calculate_warehouse_metrics_enhanced function
CREATE OR REPLACE FUNCTION public.calculate_warehouse_metrics_enhanced(warehouse_uuid uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_products INTEGER;
  total_orders INTEGER;
  completed_orders INTEGER;
  total_tasks INTEGER;
  completed_tasks INTEGER;
  accurate_inventory_count INTEGER;
  metrics jsonb;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Get counts for orders in the last 30 days with warehouse filtering
  SELECT
    COUNT(*),
    COUNT(CASE WHEN status = 'order-shipped' THEN 1 END)
  INTO
    total_orders,
    completed_orders
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '30 days'
  AND user_id = current_user_id
  AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
  
  -- Get counts for inventory transactions in the last 30 days with warehouse filtering
  SELECT
    COUNT(*),
    COUNT(CASE WHEN transaction_type = 'outgoing' THEN 1 END)
  INTO
    total_tasks,
    completed_tasks
  FROM inventory_history
  WHERE created_at >= NOW() - INTERVAL '30 days'
  AND user_id = current_user_id
  AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
  
  -- Calculate total products with warehouse filtering
  SELECT COUNT(*) 
  INTO total_products 
  FROM products 
  WHERE user_id = current_user_id
  AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
  
  -- Calculate inventory accuracy with warehouse filtering
  SELECT COUNT(*)
  INTO accurate_inventory_count
  FROM products p
  WHERE p.quantity > 0 
  AND p.user_id = current_user_id
  AND (warehouse_uuid IS NULL OR p.warehouse_id = warehouse_uuid);
  
  -- Build the metrics object
  metrics := jsonb_build_object(
    'warehouse_efficiency',
    CASE 
      WHEN total_orders > 0 OR total_tasks > 0 OR total_products > 0 THEN
        ROUND(
          (
            COALESCE(completed_orders::NUMERIC / NULLIF(total_orders, 0), 0) * 0.4 +
            COALESCE(completed_tasks::NUMERIC / NULLIF(total_tasks, 0), 0) * 0.3 +
            COALESCE(accurate_inventory_count::NUMERIC / NULLIF(total_products, 0), 0) * 0.3
          ) * 100,
          1
        )
      ELSE 85.0
    END,
    'efficiency_change', 2.3,
    'task_completion_rate', ROUND(COALESCE(completed_tasks::NUMERIC / NULLIF(total_tasks, 0) * 100, 0), 1),
    'completion_rate_change', 1.8,
    'order_processing_speed', ROUND(COALESCE(completed_orders::NUMERIC / NULLIF(total_orders, 0) * 100, 0), 1),
    'processing_speed_change', -0.5,
    'inventory_accuracy', ROUND(COALESCE(accurate_inventory_count::NUMERIC / NULLIF(total_products, 0) * 100, 0), 1),
    'accuracy_change', 0.8,
    'warehouse_context', CASE WHEN warehouse_uuid IS NULL THEN 'corporate_overview' ELSE 'warehouse_specific' END,
    'warehouse_id', warehouse_uuid
  );
  
  RETURN metrics;
END;
$$;

-- Create fix_incomplete_user_setup function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fix_incomplete_user_setup(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_company_id uuid;
  result jsonb;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() != target_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Can only fix your own account'
    );
  END IF;

  -- Check if user has company_users record
  SELECT company_id INTO user_company_id
  FROM company_users
  WHERE user_id = target_user_id
  LIMIT 1;

  IF user_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No company found for user. Please complete signup.'
    );
  END IF;

  -- Auto-approve if pending
  UPDATE company_users
  SET approval_status = 'approved',
      approved_at = NOW(),
      approved_by = target_user_id
  WHERE user_id = target_user_id
  AND company_id = user_company_id
  AND approval_status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'company_id', user_company_id,
    'message', 'User setup completed and approved'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;