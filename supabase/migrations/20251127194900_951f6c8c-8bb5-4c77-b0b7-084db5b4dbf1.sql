-- Fix existing invited employees to have approved status
-- This ensures they can access pages according to their page_permissions
UPDATE company_users
SET approval_status = 'approved',
    approved_at = NOW(),
    approved_by = user_id  -- Self-approved since invited by admin
WHERE approval_status = 'pending'
AND user_id IN (
  SELECT user_id_auth 
  FROM employees 
  WHERE user_id_auth IS NOT NULL 
  AND status IN ('invited', 'active')
);