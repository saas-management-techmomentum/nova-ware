-- Create batch_allocations table for tracking inventory allocations
CREATE TABLE IF NOT EXISTS public.batch_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.product_batches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  allocation_strategy TEXT NOT NULL CHECK (allocation_strategy IN ('FIFO', 'LIFO', 'FEFO')),
  allocated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL,
  warehouse_id UUID,
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.batch_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batch_allocations
CREATE POLICY "Users can view batch_allocations in their companies"
  ON public.batch_allocations FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert batch_allocations"
  ON public.batch_allocations FOR INSERT
  WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can delete batch_allocations"
  ON public.batch_allocations FOR DELETE
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- Create index for performance
CREATE INDEX idx_batch_allocations_order_id ON public.batch_allocations(order_id);
CREATE INDEX idx_batch_allocations_batch_id ON public.batch_allocations(batch_id);
CREATE INDEX idx_product_batches_received_date ON public.product_batches(received_date);

-- FIFO allocation function (oldest batches first)
CREATE OR REPLACE FUNCTION public.allocate_inventory_fifo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(batch_id UUID, allocated_qty INTEGER, batch_number TEXT, location_name TEXT)
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
    FROM public.product_batches pb
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
    rb.location_name
  FROM ranked_batches rb
  WHERE rb.running_total - rb.quantity < p_quantity
  ORDER BY rb.received_date ASC, rb.created_at ASC;
END;
$$;

-- LIFO allocation function (newest batches first)
CREATE OR REPLACE FUNCTION public.allocate_inventory_lifo(
  p_product_id UUID,
  p_quantity INTEGER,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(batch_id UUID, allocated_qty INTEGER, batch_number TEXT, location_name TEXT)
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
    FROM public.product_batches pb
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
    rb.location_name
  FROM ranked_batches rb
  WHERE rb.running_total - rb.quantity < p_quantity
  ORDER BY rb.received_date DESC, rb.created_at DESC;
END;
$$;

-- Master allocation and deduction function
CREATE OR REPLACE FUNCTION public.allocate_and_deduct_inventory(
  p_order_id UUID,
  p_order_item_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_strategy TEXT,
  p_user_id UUID,
  p_warehouse_id UUID,
  p_company_id UUID
)
RETURNS TABLE(
  batch_id UUID, 
  allocated_qty INTEGER, 
  batch_number TEXT, 
  location_name TEXT,
  allocation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch RECORD;
  v_allocation_id UUID;
BEGIN
  -- Validate strategy
  IF p_strategy NOT IN ('FIFO', 'LIFO', 'FEFO') THEN
    RAISE EXCEPTION 'Invalid allocation strategy: %. Must be FIFO, LIFO, or FEFO', p_strategy;
  END IF;

  -- Check if sufficient inventory exists
  IF (SELECT COALESCE(SUM(quantity), 0) FROM public.product_batches 
      WHERE product_id = p_product_id 
      AND (p_warehouse_id IS NULL OR warehouse_id = p_warehouse_id)
      AND quantity > 0) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', p_product_id;
  END IF;

  -- Allocate based on strategy
  IF p_strategy = 'FIFO' THEN
    FOR v_batch IN 
      SELECT * FROM public.allocate_inventory_fifo(p_product_id, p_quantity, p_warehouse_id)
    LOOP
      -- Deduct from batch
      UPDATE public.product_batches
      SET quantity = quantity - v_batch.allocated_qty,
          updated_at = now()
      WHERE id = v_batch.batch_id;

      -- Record allocation
      INSERT INTO public.batch_allocations (
        order_id, order_item_id, batch_id, product_id, quantity,
        allocation_strategy, user_id, warehouse_id, company_id
      ) VALUES (
        p_order_id, p_order_item_id, v_batch.batch_id, p_product_id, v_batch.allocated_qty,
        p_strategy, p_user_id, p_warehouse_id, p_company_id
      ) RETURNING id INTO v_allocation_id;

      -- Return allocation details
      batch_id := v_batch.batch_id;
      allocated_qty := v_batch.allocated_qty;
      batch_number := v_batch.batch_number;
      location_name := v_batch.location_name;
      allocation_id := v_allocation_id;
      RETURN NEXT;
    END LOOP;

  ELSIF p_strategy = 'LIFO' THEN
    FOR v_batch IN 
      SELECT * FROM public.allocate_inventory_lifo(p_product_id, p_quantity, p_warehouse_id)
    LOOP
      -- Deduct from batch
      UPDATE public.product_batches
      SET quantity = quantity - v_batch.allocated_qty,
          updated_at = now()
      WHERE id = v_batch.batch_id;

      -- Record allocation
      INSERT INTO public.batch_allocations (
        order_id, order_item_id, batch_id, product_id, quantity,
        allocation_strategy, user_id, warehouse_id, company_id
      ) VALUES (
        p_order_id, p_order_item_id, v_batch.batch_id, p_product_id, v_batch.allocated_qty,
        p_strategy, p_user_id, p_warehouse_id, p_company_id
      ) RETURNING id INTO v_allocation_id;

      -- Return allocation details
      batch_id := v_batch.batch_id;
      allocated_qty := v_batch.allocated_qty;
      batch_number := v_batch.batch_number;
      location_name := v_batch.location_name;
      allocation_id := v_allocation_id;
      RETURN NEXT;
    END LOOP;

  ELSIF p_strategy = 'FEFO' THEN
    FOR v_batch IN 
      SELECT * FROM public.allocate_inventory_fefo(p_product_id, p_quantity, p_warehouse_id)
    LOOP
      -- Deduct from batch
      UPDATE public.product_batches
      SET quantity = quantity - v_batch.allocated_qty,
          updated_at = now()
      WHERE id = v_batch.batch_id;

      -- Record allocation
      INSERT INTO public.batch_allocations (
        order_id, order_item_id, batch_id, product_id, quantity,
        allocation_strategy, user_id, warehouse_id, company_id
      ) VALUES (
        p_order_id, p_order_item_id, v_batch.batch_id, p_product_id, v_batch.allocated_qty,
        p_strategy, p_user_id, p_warehouse_id, p_company_id
      ) RETURNING id INTO v_allocation_id;

      -- Return allocation details
      batch_id := v_batch.batch_id;
      allocated_qty := v_batch.allocated_qty;
      batch_number := v_batch.batch_number;
      location_name := COALESCE(v_batch.location_name, 'Unknown');
      allocation_id := v_allocation_id;
      RETURN NEXT;
    END LOOP;
  END IF;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.allocate_inventory_fifo IS 'Allocates inventory using FIFO (First In, First Out) strategy - oldest batches first';
COMMENT ON FUNCTION public.allocate_inventory_lifo IS 'Allocates inventory using LIFO (Last In, First Out) strategy - newest batches first';
COMMENT ON FUNCTION public.allocate_and_deduct_inventory IS 'Master function that allocates inventory, deducts quantities from batches, and records allocations';