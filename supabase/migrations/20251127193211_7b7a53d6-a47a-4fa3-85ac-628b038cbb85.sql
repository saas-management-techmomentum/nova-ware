-- Sync existing admin users from company_users to user_roles
INSERT INTO user_roles (user_id, company_id, role)
SELECT cu.user_id, cu.company_id, 'admin'::app_role
FROM company_users cu
WHERE cu.role = 'admin' 
  AND cu.approval_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = cu.user_id 
    AND ur.company_id = cu.company_id 
    AND ur.role = 'admin'
  );

-- Create trigger to auto-sync admin role additions
CREATE OR REPLACE FUNCTION sync_admin_role_to_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' AND NEW.approval_status = 'approved' THEN
    INSERT INTO user_roles (user_id, company_id, role)
    VALUES (NEW.user_id, NEW.company_id, 'admin'::app_role)
    ON CONFLICT (user_id, company_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_admin_on_company_user_insert
AFTER INSERT ON company_users
FOR EACH ROW
EXECUTE FUNCTION sync_admin_role_to_user_roles();

CREATE TRIGGER sync_admin_on_company_user_update
AFTER UPDATE ON company_users
FOR EACH ROW
WHEN (NEW.role = 'admin' AND NEW.approval_status = 'approved' AND (OLD.role != 'admin' OR OLD.approval_status != 'approved'))
EXECUTE FUNCTION sync_admin_role_to_user_roles();

-- Fix warehouse metrics function - remove thresholds reference
DROP FUNCTION IF EXISTS calculate_warehouse_metrics_enhanced(uuid);

CREATE OR REPLACE FUNCTION calculate_warehouse_metrics_enhanced(warehouse_uuid uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_company_ids uuid[];
    
    -- Current period metrics (last 30 days)
    current_total_orders integer := 0;
    current_completed_orders integer := 0;
    current_total_tasks integer := 0;
    current_completed_tasks integer := 0;
    current_total_products integer := 0;
    current_accurate_inventory integer := 0;
    
    -- Previous period metrics (31-60 days ago)
    prev_total_orders integer := 0;
    prev_completed_orders integer := 0;
    prev_total_tasks integer := 0;
    prev_completed_tasks integer := 0;
    prev_total_products integer := 0;
    prev_accurate_inventory integer := 0;
    
    -- Calculated rates
    current_order_rate numeric := 0;
    prev_order_rate numeric := 0;
    current_task_rate numeric := 0;
    prev_task_rate numeric := 0;
    current_inventory_rate numeric := 0;
    prev_inventory_rate numeric := 0;
    current_efficiency numeric := 0;
    prev_efficiency numeric := 0;
    
    -- Stock level counts
    critical_stock integer := 0;
    warning_stock integer := 0;
    healthy_stock integer := 0;
    active_orders_count integer := 0;
    
    -- Context info
    warehouse_context text;
    warehouse_name_val text;
    warehouse_code_val text;
    company_name_val text;
    
    result jsonb;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get user's company IDs
    v_company_ids := get_user_company_ids(v_user_id);
    
    -- Determine context
    IF warehouse_uuid IS NULL THEN
        warehouse_context := 'corporate_overview';
    ELSE
        warehouse_context := 'warehouse_specific';
        SELECT name, code INTO warehouse_name_val, warehouse_code_val
        FROM warehouses
        WHERE id = warehouse_uuid;
    END IF;
    
    -- Get company name
    SELECT name INTO company_name_val
    FROM companies
    WHERE id = ANY(v_company_ids)
    LIMIT 1;
    
    -- CURRENT PERIOD: Calculate orders (last 30 days)
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'order-shipped' THEN 1 END)
    INTO current_total_orders, current_completed_orders
    FROM orders
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid)
      AND created_at >= NOW() - INTERVAL '30 days';
    
    -- PREVIOUS PERIOD: Calculate orders (31-60 days ago)
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'order-shipped' THEN 1 END)
    INTO prev_total_orders, prev_completed_orders
    FROM orders
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid)
      AND created_at >= NOW() - INTERVAL '60 days'
      AND created_at < NOW() - INTERVAL '30 days';
    
    -- CURRENT PERIOD: Calculate tasks (last 30 days)
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO current_total_tasks, current_completed_tasks
    FROM tasks
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid)
      AND created_at >= NOW() - INTERVAL '30 days';
    
    -- PREVIOUS PERIOD: Calculate tasks (31-60 days ago)
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO prev_total_tasks, prev_completed_tasks
    FROM tasks
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid)
      AND created_at >= NOW() - INTERVAL '60 days'
      AND created_at < NOW() - INTERVAL '30 days';
    
    -- Calculate total products and inventory accuracy (products with quantity > 0)
    SELECT COUNT(*) INTO current_total_products
    FROM products
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
    
    SELECT COUNT(*) INTO current_accurate_inventory
    FROM products
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid)
      AND quantity > 0;
    
    -- Stock level categorization
    SELECT
        COUNT(CASE WHEN quantity = 0 THEN 1 END),
        COUNT(CASE WHEN quantity > 0 AND quantity <= 10 THEN 1 END),
        COUNT(CASE WHEN quantity > 10 THEN 1 END)
    INTO critical_stock, warning_stock, healthy_stock
    FROM products
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
    
    -- Active orders count
    SELECT COUNT(*) INTO active_orders_count
    FROM orders
    WHERE company_id = ANY(v_company_ids)
      AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid)
      AND status != 'order-shipped';
    
    -- Calculate rates for current period
    current_order_rate := CASE WHEN current_total_orders > 0 
        THEN (current_completed_orders::numeric / current_total_orders * 100)
        ELSE 0 END;
    
    current_task_rate := CASE WHEN current_total_tasks > 0
        THEN (current_completed_tasks::numeric / current_total_tasks * 100)
        ELSE 0 END;
    
    current_inventory_rate := CASE WHEN current_total_products > 0
        THEN (current_accurate_inventory::numeric / current_total_products * 100)
        ELSE 0 END;
    
    -- Calculate rates for previous period
    prev_order_rate := CASE WHEN prev_total_orders > 0
        THEN (prev_completed_orders::numeric / prev_total_orders * 100)
        ELSE 0 END;
    
    prev_task_rate := CASE WHEN prev_total_tasks > 0
        THEN (prev_completed_tasks::numeric / prev_total_tasks * 100)
        ELSE 0 END;
    
    prev_inventory_rate := CASE WHEN prev_total_products > 0
        THEN (prev_accurate_inventory::numeric / prev_total_products * 100)
        ELSE 0 END;
    
    -- Calculate overall efficiency (weighted average)
    IF current_total_orders = 0 AND current_total_tasks = 0 AND current_total_products = 0 THEN
        current_efficiency := 0.0;
    ELSE
        current_efficiency := ROUND(
            (current_order_rate * 0.4 +
             current_task_rate * 0.3 +
             current_inventory_rate * 0.3),
            1
        );
    END IF;
    
    IF prev_total_orders = 0 AND prev_total_tasks = 0 AND prev_total_products = 0 THEN
        prev_efficiency := 0.0;
    ELSE
        prev_efficiency := ROUND(
            (prev_order_rate * 0.4 +
             prev_task_rate * 0.3 +
             prev_inventory_rate * 0.3),
            1
        );
    END IF;
    
    -- Build result JSON
    result := jsonb_build_object(
        'warehouse_efficiency', current_efficiency,
        'efficiency_change', ROUND(current_efficiency - prev_efficiency, 1),
        'task_completion_rate', ROUND(current_task_rate, 1),
        'completion_rate_change', ROUND(current_task_rate - prev_task_rate, 1),
        'order_processing_speed', ROUND(current_order_rate, 1),
        'processing_speed_change', ROUND(current_order_rate - prev_order_rate, 1),
        'inventory_accuracy', ROUND(current_inventory_rate, 1),
        'accuracy_change', ROUND(current_inventory_rate - prev_inventory_rate, 1),
        'warehouse_context', warehouse_context,
        'warehouse_id', warehouse_uuid,
        'warehouse_name', warehouse_name_val,
        'warehouse_code', warehouse_code_val,
        'company_name', company_name_val,
        'total_orders', current_total_orders,
        'completed_orders', current_completed_orders,
        'active_orders', active_orders_count,
        'pending_shipments', 0,
        'total_products', current_total_products,
        'critical_stock_items', critical_stock,
        'warning_stock_items', warning_stock,
        'healthy_stock_items', healthy_stock,
        'historical_data', '[]'::jsonb,
        'last_updated', NOW()
    );
    
    RETURN result;
END;
$function$;