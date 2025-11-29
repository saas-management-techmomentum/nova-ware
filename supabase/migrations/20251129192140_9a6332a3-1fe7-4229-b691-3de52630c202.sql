-- Update shipments_status_check constraint to include outgoing shipment statuses
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;

-- Add new constraint with both incoming and outgoing shipment statuses
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check 
CHECK (status = ANY (ARRAY[
  -- Incoming shipment statuses
  'pending'::text, 
  'partially-received'::text, 
  'received'::text, 
  'inspected'::text,
  -- Outgoing shipment statuses
  'ready-to-ship'::text,
  'shipped'::text,
  'in-transit'::text,
  'delivered'::text,
  'order-ready'::text,
  'order-shipped'::text
]));