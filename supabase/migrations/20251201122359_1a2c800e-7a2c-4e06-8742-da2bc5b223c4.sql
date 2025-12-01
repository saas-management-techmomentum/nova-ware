-- Add location_name column to product_batches for better allocation tracking
ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Drop existing allocation functions to allow signature changes
DROP FUNCTION IF EXISTS allocate_inventory_fefo(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS allocate_inventory_fifo(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS allocate_inventory_lifo(UUID, INTEGER, UUID);

-- Recreate allocate_inventory_fifo with location_name
CREATE FUNCTION allocate_inventory_fifo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(
  batch_id UUID,
  allocated_qty INTEGER,
  batch_number TEXT,
  location_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_batches AS (
    SELECT 
      pb.id,
      pb.batch_number,
      pb.quantity,
      pb.received_date,
      pb.location_name,
      SUM(pb.quantity) OVER (
        ORDER BY pb.received_date ASC, pb.created_at ASC 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as running_total
    FROM product_batches pb
    WHERE pb.product_id = p_product_id
      AND (p_warehouse_id IS NULL OR pb.warehouse_id = p_warehouse_id)
      AND pb.quantity > 0
    ORDER BY pb.received_date ASC, pb.created_at ASC
  )
  SELECT 
    rb.id,
    CASE 
      WHEN rb.running_total <= p_quantity THEN rb.quantity
      WHEN rb.running_total - rb.quantity < p_quantity THEN p_quantity - (rb.running_total - rb.quantity)
      ELSE 0
    END::INTEGER as allocated_qty,
    rb.batch_number,
    COALESCE(rb.location_name, 'Unknown') as location_name
  FROM ranked_batches rb
  WHERE rb.running_total - rb.quantity < p_quantity
  ORDER BY rb.received_date ASC, rb.created_at ASC;
END;
$$;

-- Recreate allocate_inventory_lifo with location_name
CREATE FUNCTION allocate_inventory_lifo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(
  batch_id UUID,
  allocated_qty INTEGER,
  batch_number TEXT,
  location_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_batches AS (
    SELECT 
      pb.id,
      pb.batch_number,
      pb.quantity,
      pb.received_date,
      pb.location_name,
      SUM(pb.quantity) OVER (
        ORDER BY pb.received_date DESC, pb.created_at DESC 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as running_total
    FROM product_batches pb
    WHERE pb.product_id = p_product_id
      AND (p_warehouse_id IS NULL OR pb.warehouse_id = p_warehouse_id)
      AND pb.quantity > 0
    ORDER BY pb.received_date DESC, pb.created_at DESC
  )
  SELECT 
    rb.id,
    CASE 
      WHEN rb.running_total <= p_quantity THEN rb.quantity
      WHEN rb.running_total - rb.quantity < p_quantity THEN p_quantity - (rb.running_total - rb.quantity)
      ELSE 0
    END::INTEGER as allocated_qty,
    rb.batch_number,
    COALESCE(rb.location_name, 'Unknown') as location_name
  FROM ranked_batches rb
  WHERE rb.running_total - rb.quantity < p_quantity
  ORDER BY rb.received_date DESC, rb.created_at DESC;
END;
$$;

-- Recreate allocate_inventory_fefo with batch_number and location_name
CREATE FUNCTION allocate_inventory_fefo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(
  batch_id UUID,
  allocated_qty INTEGER,
  batch_number TEXT,
  location_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_batches AS (
    SELECT 
      pb.id,
      pb.batch_number,
      pb.quantity,
      pb.expiration_date,
      pb.received_date,
      pb.location_name,
      SUM(pb.quantity) OVER (
        ORDER BY pb.expiration_date ASC NULLS LAST, pb.received_date ASC 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as running_total
    FROM product_batches pb
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
    END::INTEGER as allocated_qty,
    rb.batch_number,
    COALESCE(rb.location_name, 'Unknown') as location_name
  FROM ranked_batches rb
  WHERE rb.running_total - rb.quantity < p_quantity
  ORDER BY rb.expiration_date ASC NULLS LAST, rb.received_date ASC;
END;
$$;