-- Phase 1: Create profiles and order_statuses tables with RLS policies

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Create profiles table for user profile data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  onboarding_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_current_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ORDER_STATUSES TABLE
-- ============================================

-- Create order_statuses table for customizable order workflows
CREATE TABLE public.order_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on order_statuses
ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_statuses
-- Users can view order statuses in their companies
CREATE POLICY "Users can view order_statuses in their companies"
ON public.order_statuses
FOR SELECT
TO authenticated
USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- Users can insert order statuses in their companies
CREATE POLICY "Users can insert order_statuses"
ON public.order_statuses
FOR INSERT
TO authenticated
WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

-- Users can update order statuses in their companies
CREATE POLICY "Users can update order_statuses"
ON public.order_statuses
FOR UPDATE
TO authenticated
USING (company_id = ANY(get_user_company_ids(auth.uid())));

-- Company admins can delete order statuses
CREATE POLICY "Company admins can delete order_statuses"
ON public.order_statuses
FOR DELETE
TO authenticated
USING (is_company_admin(auth.uid(), company_id));

-- Add updated_at trigger for order_statuses
CREATE TRIGGER update_order_statuses_updated_at
  BEFORE UPDATE ON public.order_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_order_statuses_company_id ON public.order_statuses(company_id);
CREATE INDEX idx_order_statuses_warehouse_id ON public.order_statuses(warehouse_id);
CREATE INDEX idx_order_statuses_order_index ON public.order_statuses(order_index);

-- ============================================
-- SEED DEFAULT ORDER STATUSES
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profile data including onboarding status';
COMMENT ON TABLE public.order_statuses IS 'Customizable order status workflow for each company';