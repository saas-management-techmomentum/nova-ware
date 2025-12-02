-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND approval_status = 'approved')
  )
);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

-- Function to notify admins and managers
CREATE OR REPLACE FUNCTION notify_admins_managers(
  p_company_id UUID,
  p_warehouse_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT DISTINCT cu.user_id 
    FROM company_users cu
    WHERE cu.company_id = p_company_id 
      AND cu.role IN ('admin', 'manager')
      AND cu.approval_status = 'approved'
  LOOP
    INSERT INTO notifications (user_id, company_id, warehouse_id, title, message, type, entity_type, entity_id, action_type, metadata)
    VALUES (v_user.user_id, p_company_id, p_warehouse_id, p_title, p_message, p_type, p_entity_type, p_entity_id, p_action_type, p_metadata);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Orders trigger
CREATE OR REPLACE FUNCTION notify_on_order_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'New Order Created',
      'Order ' || COALESCE(NEW.id::text, 'N/A') || ' has been created',
      'order', 'orders', NEW.id, 'created',
      jsonb_build_object('status', NEW.status, 'client', NEW.client)
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

CREATE TRIGGER order_notification_trigger
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_on_order_change();

-- Shipments trigger
CREATE OR REPLACE FUNCTION notify_on_shipment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      CASE WHEN NEW.shipment_type = 'incoming' THEN 'Incoming Shipment Created' ELSE 'Outgoing Shipment Created' END,
      'Shipment from ' || COALESCE(NEW.supplier, 'Unknown') || ' has been created',
      'shipment', 'shipments', NEW.id, 'created',
      jsonb_build_object('type', NEW.shipment_type, 'status', NEW.status)
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'Shipment Status Updated',
      'Shipment status changed to ' || NEW.status,
      'shipment', 'shipments', NEW.id, 'status_changed',
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'type', NEW.shipment_type)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER shipment_notification_trigger
AFTER INSERT OR UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION notify_on_shipment_change();

-- Invoices trigger
CREATE OR REPLACE FUNCTION notify_on_invoice_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'Invoice Paid',
      'Invoice ' || NEW.invoice_number || ' has been marked as paid',
      'invoice', 'invoices', NEW.id::uuid, 'paid',
      jsonb_build_object('amount', NEW.total_amount, 'client_id', NEW.client_id)
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'Invoice Overdue',
      'Invoice ' || NEW.invoice_number || ' is now overdue',
      'invoice', 'invoices', NEW.id::uuid, 'overdue',
      jsonb_build_object('amount', NEW.total_amount, 'due_date', NEW.due_date)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER invoice_notification_trigger
AFTER UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION notify_on_invoice_change();

-- Tasks trigger
CREATE OR REPLACE FUNCTION notify_on_task_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    PERFORM notify_admins_managers(
      NEW.company_id, NEW.warehouse_id,
      'Task Completed',
      'Task "' || NEW.title || '" has been completed',
      'task', 'tasks', NEW.id, 'completed',
      jsonb_build_object('assigned_to', NEW.assigned_to)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER task_notification_trigger
AFTER UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION notify_on_task_change();

-- Enable realtime for notifications
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;