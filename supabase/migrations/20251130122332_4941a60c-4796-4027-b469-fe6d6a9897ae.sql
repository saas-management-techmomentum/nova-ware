-- Add interval_count column to recurring_invoices table
ALTER TABLE recurring_invoices 
ADD COLUMN IF NOT EXISTS interval_count integer DEFAULT 1;

COMMENT ON COLUMN recurring_invoices.interval_count IS 'Number of intervals between invoice generation (e.g., 2 for bi-weekly if frequency is weekly)';
