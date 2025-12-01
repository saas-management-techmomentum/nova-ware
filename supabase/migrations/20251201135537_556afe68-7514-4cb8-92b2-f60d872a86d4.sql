-- Create payroll_entries table for employee payroll management
CREATE TABLE IF NOT EXISTS public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  overtime_rate NUMERIC DEFAULT 0,
  bonus_amount NUMERIC DEFAULT 0,
  gross_pay NUMERIC NOT NULL DEFAULT 0,
  federal_tax NUMERIC DEFAULT 0,
  state_tax NUMERIC DEFAULT 0,
  social_security NUMERIC DEFAULT 0,
  medicare NUMERIC DEFAULT 0,
  health_insurance NUMERIC DEFAULT 0,
  dental_insurance NUMERIC DEFAULT 0,
  retirement_401k NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
  pay_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view payroll_entries in their companies"
  ON public.payroll_entries
  FOR SELECT
  USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Admins can insert payroll_entries"
  ON public.payroll_entries
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), company_id, 'admin'::app_role));

CREATE POLICY "Admins can update payroll_entries"
  ON public.payroll_entries
  FOR UPDATE
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));

CREATE POLICY "Admins can delete payroll_entries"
  ON public.payroll_entries
  FOR DELETE
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- Performance indexes
CREATE INDEX idx_payroll_entries_employee ON public.payroll_entries(employee_id);
CREATE INDEX idx_payroll_entries_company ON public.payroll_entries(company_id);
CREATE INDEX idx_payroll_entries_status ON public.payroll_entries(status);
CREATE INDEX idx_payroll_entries_pay_period ON public.payroll_entries(pay_period_start, pay_period_end);

-- Trigger for updated_at
CREATE TRIGGER update_payroll_entries_updated_at
  BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();