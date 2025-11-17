// COMMENTED OUT: invoice_payments table schema mismatch
// This feature requires database schema updates before it can be enabled

export interface ARInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_contact_email: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  days_past_due: number;
  aging_bucket: string;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface ARSummary {
  total_outstanding: number;
  current_ar: number;
  past_due: number;
  overdue_30: number;
  overdue_60: number;
  overdue_90_plus: number;
}

// Stub export to maintain compatibility
export const useAccountsReceivable = () => ({
  arInvoices: [] as ARInvoice[],
  arSummary: {
    total_outstanding: 0,
    current_ar: 0,
    past_due: 0,
    overdue_30: 0,
    overdue_60: 0,
    overdue_90_plus: 0
  } as ARSummary,
  isLoading: false,
  filter: {
    status: 'all',
    dateRange: 'all',
    customer: '',
    overdue: false
  },
  setFilter: () => {},
  recordPayment: async () => {},
  fetchARData: async () => {},
  refreshData: async () => {}
});
