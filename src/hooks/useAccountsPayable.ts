// COMMENTED OUT: Missing vendor_bills.paid_amount column in database schema
// This feature requires database schema updates before it can be enabled

import { toast } from '@/hooks/use-toast';

export interface VendorBill {
  id: string;
  bill_number: string;
  vendor_name: string;
  vendor_id?: string;
  po_id?: string;
  issue_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'pending_invoice' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  description?: string;
  notes?: string;
  attachment_url?: string;
  user_id: string;
  warehouse_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  purchase_orders?: {
    id: string;
    po_number: string;
    vendor_name: string;
    status: string;
  };
}

export interface VendorBillPayment {
  id: string;
  bill_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface APSummary {
  totalPayable: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueNextWeek: number;
  dueIn30Days: number;
  aging: {
    current: number;
    days_30: number;
    days_60: number;
    days_90: number;
    days_90_plus: number;
  };
}

// Stub export to maintain compatibility
export const useAccountsPayable = () => ({
  bills: [] as VendorBill[],
  payments: [] as VendorBillPayment[],
  apSummary: null as APSummary | null,
  loading: false,
  error: null,
  createBill: async () => {
    toast({
      title: "Feature Unavailable",
      description: "Accounts Payable requires database schema updates",
      variant: "destructive"
    });
  },
  recordPayment: async () => {},
  fetchBills: async () => {},
  fetchPayments: async () => {},
  refreshData: async () => {}
});
