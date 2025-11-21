-- Fix security warnings: Add search_path to functions

-- Fix generate_batch_number() function
CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix allocate_inventory_fefo() function
CREATE OR REPLACE FUNCTION public.allocate_inventory_fefo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(batch_id UUID, allocated_qty INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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