-- Fix notify_on_order_change function to use customer_name instead of client
CREATE OR REPLACE FUNCTION public.notify_on_order_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'New Order Created',
      'Order ' || COALESCE(NEW.id::text, 'N/A') || ' has been created',
      'order', 'orders', NEW.id, 'created',
      jsonb_build_object('status', NEW.status, 'customer_name', NEW.customer_name)
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'Order Status Updated',
      'Order status changed to ' || NEW.status,
      'order', 'orders', NEW.id, 'status_changed',
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;