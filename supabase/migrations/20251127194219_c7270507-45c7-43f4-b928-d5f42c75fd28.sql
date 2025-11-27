-- Step 1: Add needs_password_change column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT false;

-- Step 2: Update user_needs_password_change() RPC to check employees table
CREATE OR REPLACE FUNCTION public.user_needs_password_change()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT needs_password_change 
     FROM employees 
     WHERE user_id_auth = auth.uid() 
     LIMIT 1),
    false
  );
$$;

-- Step 3: Create activate_employee_after_password_change() RPC
CREATE OR REPLACE FUNCTION public.activate_employee_after_password_change(employee_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE employees
  SET needs_password_change = false,
      status = 'active'
  WHERE user_id_auth = employee_user_id;
  
  RETURN FOUND;
END;
$$;