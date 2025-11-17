// COMMENTED OUT: Recurring invoices and billing transactions schema incomplete
// This feature requires database schema updates before it can be enabled

export interface BillingRate {
  id: string;
  client_id: string;
  service_type: string;
  rate_type: string;
  rate_amount: number;
  unit: string;
  effective_date: string;
  end_date?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  sku?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  design_config: any;
  is_default: boolean;
}

export interface RecurringInvoice {
  id: string;
  client_id: string;
  template_invoice_id: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval_count: number;
  start_date: string;
  end_date?: string;
  next_invoice_date: string;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_date?: string;
  notes?: string;
  template_id?: string;
  payment_link?: string;
  pdf_url?: string;
  email_sent_at?: string;
  payment_due_reminder_sent_at?: string;
  line_items?: InvoiceLineItem[];
}

export interface BillingTransaction {
  id: string;
  client_id: string;
  transaction_type: string;
  reference_id?: string;
  quantity: number;
  unit: string;
  rate_amount: number;
  total_amount: number;
  transaction_date: string;
  invoice_id?: string;
  description?: string;
}

// Stub export to maintain compatibility
export const useBilling = () => ({
  billingRates: [] as BillingRate[],
  invoices: [] as Invoice[],
  invoiceTemplates: [] as InvoiceTemplate[],
  recurringInvoices: [] as RecurringInvoice[],
  billingTransactions: [] as BillingTransaction[],
  loading: false,
  fetchBillingData: async () => {},
  createInvoiceFromTemplate: async () => ({} as Invoice),
  addBillingRate: async () => {},
  deleteBillingRate: async () => {},
  updateBillingRate: async () => {},
  createRecurringInvoice: async () => {},
  deleteRecurringInvoice: async () => {},
  toggleRecurringInvoice: async () => {},
  fetchBillingTransactions: async () => {},
  generateInvoiceFromTransactions: async () => ({} as Invoice),
  refreshData: async () => {}
});
