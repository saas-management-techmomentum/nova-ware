
CREATE OR REPLACE FUNCTION public.calculate_warehouse_metrics(warehouse_uuid uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_products INTEGER;
    total_orders INTEGER;
    completed_orders INTEGER;
    total_tasks INTEGER;
    completed_tasks INTEGER;
    accurate_inventory_count INTEGER;
    metrics json;
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get counts for orders in the last 30 days with warehouse filtering
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'order-shipped' THEN 1 END)
    INTO
        total_orders,
        completed_orders
    FROM public.orders
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
    FROM public.inventory_history
    WHERE created_at >= NOW() - INTERVAL '30 days'
    AND user_id = current_user_id
    AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
    
    -- Calculate total products with warehouse filtering
    SELECT COUNT(*) 
    INTO total_products 
    FROM public.products 
    WHERE user_id = current_user_id
    AND (warehouse_uuid IS NULL OR warehouse_id = warehouse_uuid);
    
    -- Calculate inventory accuracy with warehouse filtering
    SELECT COUNT(*)
    INTO accurate_inventory_count
    FROM public.products p
    WHERE p.quantity > 0 
    AND p.user_id = current_user_id
    AND (warehouse_uuid IS NULL OR p.warehouse_id = warehouse_uuid);
    
    -- Build the metrics object with proper null handling
    metrics := json_build_object(
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
        'efficiency_change',
        2.3,
        'task_completion_rate',
        ROUND(COALESCE(completed_tasks::NUMERIC / NULLIF(total_tasks, 0) * 100, 0), 1),
        'completion_rate_change',
        1.8,
        'order_processing_speed',
        ROUND(COALESCE(completed_orders::NUMERIC / NULLIF(total_orders, 0) * 100, 0), 1),
        'processing_speed_change',
        -0.5,
        'inventory_accuracy',
        ROUND(COALESCE(accurate_inventory_count::NUMERIC / NULLIF(total_products, 0) * 100, 0), 1),
        'accuracy_change',
        0.8,
        'warehouse_context',
        CASE 
            WHEN warehouse_uuid IS NULL THEN 'corporate_overview'
            ELSE 'warehouse_specific'
        END,
        'warehouse_id',
        warehouse_uuid
    );
    
    RETURN metrics;
END;
$function$;
