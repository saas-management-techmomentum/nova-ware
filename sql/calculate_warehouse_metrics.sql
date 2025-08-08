
CREATE OR REPLACE FUNCTION public.calculate_warehouse_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    total_products INTEGER;
    total_inventory_value NUMERIC;
    total_orders INTEGER;
    completed_orders INTEGER;
    total_tasks INTEGER;
    completed_tasks INTEGER;
    avg_processing_time INTERVAL;
    accurate_inventory_count INTEGER;
    metrics json;
BEGIN
    -- Get counts for orders in the last 30 days
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO
        total_orders,
        completed_orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    -- Get counts for tasks in the last 30 days
    SELECT
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO
        total_tasks,
        completed_tasks
    FROM tasks
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate total products and inventory accuracy
    SELECT COUNT(*) INTO total_products FROM products;
    
    -- Calculate inventory accuracy (products with correct quantities vs thresholds)
    SELECT COUNT(*) INTO accurate_inventory_count
    FROM products p
    LEFT JOIN thresholds t ON t.product_id = p.id
    WHERE p.quantity >= COALESCE(t.min_quantity, 0);
    
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
            ELSE 0
        END,
        'efficiency_change',
        0, -- Set to 0 for now, would need historical data for real change
        'task_completion_rate',
        ROUND(COALESCE(completed_tasks::NUMERIC / NULLIF(total_tasks, 0) * 100, 0), 1),
        'completion_rate_change',
        0, -- Set to 0 for now, would need historical data for real change
        'order_processing_speed',
        ROUND(COALESCE(completed_orders::NUMERIC / NULLIF(total_orders, 0) * 100, 0), 1),
        'processing_speed_change',
        0, -- Set to 0 for now, would need historical data for real change
        'inventory_accuracy',
        ROUND(COALESCE(accurate_inventory_count::NUMERIC / NULLIF(total_products, 0) * 100, 0), 1),
        'accuracy_change',
        0  -- Set to 0 for now, would need historical data for real change
    );
    
    RETURN metrics;
END;
$function$;
