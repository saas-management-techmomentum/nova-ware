-- Add invoice_number column to orders table
ALTER TABLE orders ADD COLUMN invoice_number text;

-- Create index for better query performance
CREATE INDEX idx_orders_invoice_number ON orders(invoice_number);

-- Add comment for documentation
COMMENT ON COLUMN orders.invoice_number IS 'User-entered invoice number for the order';