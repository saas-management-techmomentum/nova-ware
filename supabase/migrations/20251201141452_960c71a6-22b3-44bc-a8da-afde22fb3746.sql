-- Add vendor column to billing_transactions table
ALTER TABLE billing_transactions ADD COLUMN IF NOT EXISTS vendor TEXT;