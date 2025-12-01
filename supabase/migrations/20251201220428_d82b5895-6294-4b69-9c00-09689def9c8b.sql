-- Create the order-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents',
  'order-documents',
  true,
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for the storage bucket
CREATE POLICY "Users can upload order documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read order documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-documents');

CREATE POLICY "Users can delete their own order documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add missing columns to order_documents table
ALTER TABLE order_documents
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

ALTER TABLE order_documents
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

ALTER TABLE order_documents
ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES warehouses(id);

-- Enable RLS on order_documents if not already enabled
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert order documents" ON order_documents;
DROP POLICY IF EXISTS "Users can view order documents in their company" ON order_documents;
DROP POLICY IF EXISTS "Users can delete order_documents" ON order_documents;

-- Create new RLS policies on order_documents table
CREATE POLICY "Users can insert order documents"
ON order_documents FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_documents.order_id 
    AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
  )
);

CREATE POLICY "Users can view order documents in their company"
ON order_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_documents.order_id 
    AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
  )
);

CREATE POLICY "Users can delete order_documents"
ON order_documents FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_documents.order_id 
    AND orders.company_id = ANY(get_user_company_ids(auth.uid()))
  )
);