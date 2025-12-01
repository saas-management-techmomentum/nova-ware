-- Fix ambiguous column reference in generate_po_number function
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  result_po_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_orders.po_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM purchase_orders
  WHERE purchase_orders.po_number LIKE 'PO-%';
  
  result_po_number := 'PO-' || LPAD(next_num::TEXT, 6, '0');
  RETURN result_po_number;
END;
$$;