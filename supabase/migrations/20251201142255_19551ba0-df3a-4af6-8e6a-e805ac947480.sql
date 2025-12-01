-- Add paid_amount column to vendor_bills table
ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN vendor_bills.paid_amount IS 'Total amount paid against this bill';

-- Update existing records to ensure paid_amount is set to 0
UPDATE vendor_bills SET paid_amount = 0 WHERE paid_amount IS NULL;