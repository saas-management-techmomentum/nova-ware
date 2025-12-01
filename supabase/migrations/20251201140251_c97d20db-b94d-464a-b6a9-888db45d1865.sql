-- Create financial_reports table
CREATE TABLE financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  warehouse_id UUID REFERENCES warehouses(id),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  description TEXT,
  date_range_start DATE,
  date_range_end DATE,
  parameters JSONB DEFAULT '{}',
  generated_data JSONB,
  file_url TEXT,
  file_format TEXT DEFAULT 'PDF',
  file_size TEXT,
  status TEXT DEFAULT 'draft',
  is_template BOOLEAN DEFAULT false,
  frequency TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view financial_reports" ON financial_reports
  FOR SELECT USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can insert financial_reports" ON financial_reports
  FOR INSERT WITH CHECK (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Users can update financial_reports" ON financial_reports
  FOR UPDATE USING (company_id = ANY(get_user_company_ids(auth.uid())));

CREATE POLICY "Admins can delete financial_reports" ON financial_reports
  FOR DELETE USING (has_role(auth.uid(), company_id, 'admin'));

-- Indexes for performance
CREATE INDEX idx_financial_reports_company ON financial_reports(company_id);
CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_status ON financial_reports(status);

-- Update trigger
CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();