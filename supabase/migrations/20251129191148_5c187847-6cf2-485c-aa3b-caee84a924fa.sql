-- Add invoice_id column to orders table for proper foreign key relationship
ALTER TABLE orders ADD COLUMN invoice_id text REFERENCES invoices(id);
CREATE INDEX idx_orders_invoice_id ON orders(invoice_id);

-- Add order_id column to shipments table for proper foreign key relationship
ALTER TABLE shipments ADD COLUMN order_id uuid REFERENCES orders(id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);