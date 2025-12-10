-- Add Stripe-related columns to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add Stripe payment ID to invoice_payments table
ALTER TABLE public.invoice_payments
ADD COLUMN IF NOT EXISTS stripe_payment_id text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout_session ON public.invoices(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_payments_stripe_payment_id ON public.invoice_payments(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;