import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useAccountsPayable = () => {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [payments, setPayments] = useState<VendorBillPayment[]>([]);
  const [apSummary, setApSummary] = useState<APSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch vendor bills (only those linked to valid Purchase Orders)
  const fetchBills = async () => {
    try {
      console.log('🔄 Fetching vendor bills via RLS policies');
      
      const { data, error } = await supabase
        .from('vendor_bills')
        .select(`
          *,
          purchase_orders:po_id (
            id,
            po_number,
            vendor_name,
            status
          )
        `)
        .not('po_id', 'is', null)
        .order('due_date', { ascending: true });

      console.log('📊 Vendor bills query result:', { data: data?.length || 0, error });

      if (error) throw error;
      
      // Filter to only include bills with valid linked Purchase Orders
      const validBills = (data || []).filter(bill => bill.purchase_orders);
      setBills(validBills as VendorBill[]);
    } catch (err) {
      console.error('Error fetching vendor bills:', err);
      setError('Failed to fetch vendor bills');
    }
  };

  // Fetch bill payments
  const fetchPayments = async () => {
    try {
      console.log('🔄 Fetching vendor bill payments via RLS policies');
      
      const { data, error } = await supabase
        .from('vendor_bill_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      console.log('📊 Vendor bill payments query result:', { data: data?.length || 0, error });

      if (error) throw error;
      setPayments((data as VendorBillPayment[]) || []);
    } catch (err) {
      console.error('Error fetching bill payments:', err);
    }
  };

  // Calculate AP summary and aging
  const calculateAPSummary = (billsData: VendorBill[]): APSummary => {
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let totalPayable = 0;
    let overdueAmount = 0;
    let dueThisWeek = 0;
    let dueNextWeek = 0;
    let dueIn30Days = 0;

    const aging = {
      current: 0,
      days_30: 0,
      days_60: 0,
      days_90: 0,
      days_90_plus: 0
    };

    billsData.forEach(bill => {
      const outstandingAmount = bill.amount - bill.paid_amount;
      if (outstandingAmount <= 0) return;

      totalPayable += outstandingAmount;
      
      const dueDate = new Date(bill.due_date);
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Check if overdue
      if (dueDate < now) {
        overdueAmount += outstandingAmount;
      }

      // Check upcoming due dates
      if (dueDate >= now && dueDate <= oneWeek) {
        dueThisWeek += outstandingAmount;
      } else if (dueDate > oneWeek && dueDate <= twoWeeks) {
        dueNextWeek += outstandingAmount;
      } else if (dueDate > twoWeeks && dueDate <= thirtyDays) {
        dueIn30Days += outstandingAmount;
      }

      // Calculate aging buckets
      if (daysPastDue <= 0) {
        aging.current += outstandingAmount;
      } else if (daysPastDue <= 30) {
        aging.days_30 += outstandingAmount;
      } else if (daysPastDue <= 60) {
        aging.days_60 += outstandingAmount;
      } else if (daysPastDue <= 90) {
        aging.days_90 += outstandingAmount;
      } else {
        aging.days_90_plus += outstandingAmount;
      }
    });

    return {
      totalPayable,
      overdueAmount,
      dueThisWeek,
      dueNextWeek,
      dueIn30Days,
      aging
    };
  };

  // Create new vendor bill
  const createBill = async (billData: Partial<VendorBill>): Promise<void> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const billToInsert = {
        bill_number: billData.bill_number!,
        vendor_name: billData.vendor_name!,
        vendor_id: billData.vendor_id,
        po_id: billData.po_id,
        issue_date: billData.issue_date!,
        due_date: billData.due_date!,
        amount: billData.amount!,
        description: billData.description,
        notes: billData.notes,
        attachment_url: billData.attachment_url,
        warehouse_id: billData.warehouse_id,
        company_id: billData.company_id,
        user_id: user.user.id,
        status: (billData.status as 'pending_invoice' | 'unpaid') || 'unpaid' as const,
        paid_amount: 0
      };

      const { data, error } = await supabase
        .from('vendor_bills')
        .insert(billToInsert)
        .select()
        .single();

      if (error) throw error;

      // Create GL entry for the bill
      await createBillGLEntry(data as VendorBill);

      await fetchBills();
      toast({
        title: "Success",
        description: "Vendor bill created successfully",
      });
    } catch (err) {
      console.error('Error creating bill:', err);
      toast({
        title: "Error",
        description: "Failed to create vendor bill",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Record payment for a bill
  const recordPayment = async (billId: string, paymentData: {
    payment_amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Get the bill details
      const { data: bill, error: billError } = await supabase
        .from('vendor_bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (billError) throw billError;

      const billData = bill as VendorBill;
      const newPaidAmount = billData.paid_amount + paymentData.payment_amount;
      const newStatus = newPaidAmount >= billData.amount ? 'paid' : 'partially_paid';

      // Record the payment
      const { error: paymentError } = await supabase
        .from('vendor_bill_payments')
        .insert([{
          ...paymentData,
          bill_id: billId,
          user_id: user.user.id
        }]);

      if (paymentError) throw paymentError;

      // Update the bill
      const { error: updateError } = await supabase
        .from('vendor_bills')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus
        })
        .eq('id', billId);

      if (updateError) throw updateError;

      // Create GL entry for the payment
      await createPaymentGLEntry(billData, paymentData);

      await fetchBills();
      await fetchPayments();

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

    } catch (err) {
      console.error('Error recording payment:', err);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Create GL entry when bill is created
  const createBillGLEntry = async (bill: VendorBill) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get expense account (5000) and AP account (2000)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.user.id)
        .in('account_code', ['5000', '2000']);

      if (accountsError || !accounts || accounts.length < 2) return;

      const expenseAccount = accounts.find(acc => acc.account_code === '5000');
      const apAccount = accounts.find(acc => acc.account_code === '2000');

      if (!expenseAccount || !apAccount) return;

      // Create journal entry
      const entryNumber = `JE-AP-BILL-${bill.id}-${Date.now()}`;
      
      const { data: journalEntry, error: jeError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          entry_date: bill.issue_date,
          description: `Vendor bill - ${bill.vendor_name}`,
          total_amount: bill.amount,
          status: 'posted',
          user_id: user.user.id,
          created_by: user.user.id,
          reference: `Vendor Bill: ${bill.bill_number}`,
          warehouse_id: bill.warehouse_id,
          company_id: bill.company_id
        }])
        .select()
        .single();

      if (jeError) throw jeError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: expenseAccount.id,
          line_number: 1,
          description: `Expense - ${bill.vendor_name}`,
          debit_amount: bill.amount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: apAccount.id,
          line_number: 2,
          description: `Accounts Payable - ${bill.vendor_name}`,
          debit_amount: 0,
          credit_amount: bill.amount
        }
      ];

      await supabase
        .from('journal_entry_lines')
        .insert(lines);

    } catch (err) {
      console.error('Error creating bill GL entry:', err);
    }
  };

  // Create GL entry when payment is recorded
  const createPaymentGLEntry = async (bill: VendorBill, paymentData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get AP account (2000) and Cash account (1000)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.user.id)
        .in('account_code', ['2000', '1000']);

      if (accountsError || !accounts || accounts.length < 2) return;

      const apAccount = accounts.find(acc => acc.account_code === '2000');
      const cashAccount = accounts.find(acc => acc.account_code === '1000');

      if (!apAccount || !cashAccount) return;

      // Create journal entry
      const entryNumber = `JE-AP-PAY-${bill.id}-${Date.now()}`;
      
      const { data: journalEntry, error: jeError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          entry_date: paymentData.payment_date,
          description: `Payment to ${bill.vendor_name}`,
          total_amount: paymentData.payment_amount,
          status: 'posted',
          user_id: user.user.id,
          created_by: user.user.id,
          reference: `Payment: ${paymentData.reference_number || bill.bill_number}`,
          warehouse_id: bill.warehouse_id,
          company_id: bill.company_id
        }])
        .select()
        .single();

      if (jeError) throw jeError;

      // Create journal entry lines
      const lines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: apAccount.id,
          line_number: 1,
          description: `Payment to ${bill.vendor_name}`,
          debit_amount: paymentData.payment_amount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: cashAccount.id,
          line_number: 2,
          description: `Cash payment - ${paymentData.payment_method}`,
          debit_amount: 0,
          credit_amount: paymentData.payment_amount
        }
      ];

      await supabase
        .from('journal_entry_lines')
        .insert(lines);

    } catch (err) {
      console.error('Error creating payment GL entry:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBills(), fetchPayments()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Calculate summary when bills change
  useEffect(() => {
    if (bills.length > 0) {
      const summary = calculateAPSummary(bills);
      setApSummary(summary);
    }
  }, [bills]);

  return {
    bills,
    payments,
    apSummary,
    loading,
    error,
    createBill,
    recordPayment,
    fetchBills,
    fetchPayments,
    refreshData: async () => {
      await Promise.all([fetchBills(), fetchPayments()]);
    }
  };
};