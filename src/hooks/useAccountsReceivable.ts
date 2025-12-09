import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { toast } from 'sonner';

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

export interface ARFilter {
  status: string;
  dateRange: string;
  customer: string;
  overdue: boolean;
}

export const useAccountsReceivable = () => {
  const { selectedWarehouse, warehouses } = useWarehouse();
  
  // Get the warehouse object for the selected warehouse
  const currentWarehouse = useMemo(() => {
    return warehouses.find(w => w.warehouse_id === selectedWarehouse);
  }, [selectedWarehouse, warehouses]);
  
  const [arInvoices, setArInvoices] = useState<ARInvoice[]>([]);
  const [arSummary, setArSummary] = useState<ARSummary>({
    total_outstanding: 0,
    current_ar: 0,
    past_due: 0,
    overdue_30: 0,
    overdue_60: 0,
    overdue_90_plus: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<ARFilter>({
    status: 'all',
    dateRange: 'all',
    customer: '',
    overdue: false
  });

  const calculateDaysPastDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getAgingBucket = (daysPastDue: number): string => {
    if (daysPastDue === 0) return 'current';
    if (daysPastDue <= 30) return '1-30';
    if (daysPastDue <= 60) return '31-60';
    if (daysPastDue <= 90) return '61-90';
    return '90+';
  };

  const fetchARData = useCallback(async () => {
    if (!selectedWarehouse) return;
    
    setIsLoading(true);
    try {
      // Fetch invoices with their payments
      let query = supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          client_id,
          client_name,
          client_contact_email,
          invoice_date,
          due_date,
          total_amount,
          status
        `)
        .eq('warehouse_id', selectedWarehouse)
        .order('due_date', { ascending: true });

      // Apply status filter - exclude drafts from AR, show sent/overdue/paid
      if (filter.status === 'all') {
        query = query.in('status', ['sent', 'overdue', 'paid', 'approved']);
      } else if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      // Fetch payments for these invoices
      const invoiceIds = invoices?.map(inv => inv.id) || [];
      let paymentsData: { invoice_id: string; amount: number }[] = [];
      
      if (invoiceIds.length > 0) {
        const { data: payments } = await supabase
          .from('invoice_payments')
          .select('invoice_id, amount')
          .in('invoice_id', invoiceIds);
        
        paymentsData = payments || [];
      }

      // Calculate paid amounts per invoice
      const paidAmountsByInvoice = paymentsData.reduce((acc, payment) => {
        acc[payment.invoice_id] = (acc[payment.invoice_id] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);

      // Transform invoices with AR data
      const arData: ARInvoice[] = (invoices || []).map(invoice => {
        const daysPastDue = calculateDaysPastDue(invoice.due_date);
        const paidAmount = paidAmountsByInvoice[invoice.id] || 0;
        
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_id: invoice.client_id || '',
          client_name: invoice.client_name || 'Unknown',
          client_contact_email: invoice.client_contact_email || '',
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          total_amount: invoice.total_amount,
          paid_amount: invoice.status === 'paid' ? invoice.total_amount : paidAmount,
          status: invoice.status || 'sent',
          days_past_due: invoice.status === 'paid' ? 0 : daysPastDue,
          aging_bucket: invoice.status === 'paid' ? 'paid' : getAgingBucket(daysPastDue)
        };
      });

      // Apply overdue filter
      let filteredData = arData;
      if (filter.overdue) {
        filteredData = arData.filter(inv => inv.days_past_due > 0 && inv.status !== 'paid');
      }

      setArInvoices(filteredData);

      // Calculate summary
      const summary: ARSummary = {
        total_outstanding: 0,
        current_ar: 0,
        past_due: 0,
        overdue_30: 0,
        overdue_60: 0,
        overdue_90_plus: 0
      };

      arData.forEach(invoice => {
        const outstanding = invoice.total_amount - invoice.paid_amount;
        if (outstanding <= 0 || invoice.status === 'paid') return;

        summary.total_outstanding += outstanding;

        if (invoice.days_past_due === 0) {
          summary.current_ar += outstanding;
        } else {
          summary.past_due += outstanding;
          if (invoice.days_past_due <= 30) {
            summary.overdue_30 += outstanding;
          } else if (invoice.days_past_due <= 60) {
            summary.overdue_60 += outstanding;
          } else {
            summary.overdue_90_plus += outstanding;
          }
        }
      });

      setArSummary(summary);
    } catch (error) {
      console.error('Error fetching AR data:', error);
      toast.error('Failed to load accounts receivable data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWarehouse, filter.status, filter.overdue]);

  useEffect(() => {
    fetchARData();
  }, [fetchARData]);

  const recordPayment = async (invoiceId: string, paymentData: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoiceId,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          reference_number: paymentData.reference_number,
          notes: paymentData.notes,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Payment recorded successfully');
      await fetchARData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const sendPaymentReminder = async (invoiceId: string) => {
    try {
      // Find the invoice
      const invoice = arInvoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        toast.error('Invoice not found');
        return;
      }

      // For now, just show a success message
      // In production, this would call an edge function to send the email
      toast.success(`Payment reminder would be sent to ${invoice.client_contact_email || 'customer'}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send payment reminder');
    }
  };

  const refreshData = useCallback(async () => {
    await fetchARData();
    toast.success('Data refreshed');
  }, [fetchARData]);

  return {
    arInvoices,
    arSummary,
    isLoading,
    filter,
    setFilter,
    recordPayment,
    sendPaymentReminder,
    fetchARData,
    refreshData
  };
};
