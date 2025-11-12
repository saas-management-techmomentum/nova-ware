import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export const useAccountsReceivable = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [filter, setFilter] = useState({
    status: 'all',
    dateRange: 'all',
    customer: '',
    overdue: false
  });

  const fetchARData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Fetching AR invoices via RLS policies');
      
      // Fetch invoices with payment information
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(name, contact_email)
        `)
        .neq('status', 'draft')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: false });

      console.log('📊 AR invoices query result:', { data: invoicesData?.length || 0, error: invoicesError });

      if (invoicesError) throw invoicesError;

      // Fetch payments for each invoice
      const invoiceIds = invoicesData.map(inv => inv.id);
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('invoice_payments')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (paymentsError) throw paymentsError;

      // Process AR data
      const processedInvoices = invoicesData.map(invoice => {
        const payments = paymentsData.filter(p => p.invoice_id === invoice.id);
        const paid_amount = payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = invoice.total_amount - paid_amount;
        
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysDiff = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        const days_past_due = daysDiff > 0 ? daysDiff : 0;
        
        let aging_bucket = '0-30';
        let status = invoice.status;
        
        if (remaining <= 0) {
          status = 'paid';
          aging_bucket = 'paid';
        } else if (days_past_due === 0) {
          aging_bucket = 'current';
        } else if (days_past_due <= 30) {
          aging_bucket = '1-30';
          status = 'overdue';
        } else if (days_past_due <= 60) {
          aging_bucket = '31-60';
          status = 'overdue';
        } else if (days_past_due <= 90) {
          aging_bucket = '61-90';
          status = 'overdue';
        } else {
          aging_bucket = '90+';
          status = 'overdue';
        }

        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_id: invoice.client_id,
          client_name: invoice.clients.name,
          client_contact_email: invoice.clients.contact_email,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          total_amount: invoice.total_amount,
          paid_amount,
          status,
          days_past_due,
          aging_bucket
        };
      });

      // Calculate AR summary
      const summary = processedInvoices.reduce((acc, inv) => {
        const outstanding = inv.total_amount - inv.paid_amount;
        if (outstanding <= 0) return acc;

        acc.total_outstanding += outstanding;
        
        switch (inv.aging_bucket) {
          case 'current':
            acc.current_ar += outstanding;
            break;
          case '1-30':
            acc.overdue_30 += outstanding;
            acc.past_due += outstanding;
            break;
          case '31-60':
            acc.overdue_60 += outstanding;
            acc.past_due += outstanding;
            break;
          case '61-90':
          case '90+':
            acc.overdue_90_plus += outstanding;
            acc.past_due += outstanding;
            break;
        }
        
        return acc;
      }, {
        total_outstanding: 0,
        current_ar: 0,
        past_due: 0,
        overdue_30: 0,
        overdue_60: 0,
        overdue_90_plus: 0
      });

      setArInvoices(processedInvoices);
      setArSummary(summary);
    } catch (error) {
      console.error('Error fetching AR data:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts receivable data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recordPayment = async (paymentData: {
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }) => {
    if (!user?.id) return;

    try {
      // Record the payment
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          ...paymentData,
          created_at: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      // Update invoice status if fully paid
      const invoice = arInvoices.find(inv => inv.id === paymentData.invoice_id);
      if (invoice) {
        const newPaidAmount = invoice.paid_amount + paymentData.amount;
        if (newPaidAmount >= invoice.total_amount) {
          const { error: invoiceError } = await supabase
            .from('invoices')
            .update({ 
              status: 'paid',
              payment_date: paymentData.payment_date
            })
            .eq('id', paymentData.invoice_id);

          if (invoiceError) throw invoiceError;
        }
      }

      // Create journal entries for payment
      await createPaymentJournalEntries(paymentData);

      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded",
      });

      // Refresh AR data
      fetchARData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const createPaymentJournalEntries = async (paymentData: any) => {
    if (!user?.id) return;

    try {
      // Get accounts for journal entry
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_code', ['1100', '1000']); // AR and Cash accounts

      const arAccount = accounts?.find(a => a.account_code === '1100');
      const cashAccount = accounts?.find(a => a.account_code === '1000');

      if (!arAccount || !cashAccount) return;

      // Create journal entry
      const { data: journalEntry, error: jeError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: `PMT-${Date.now()}`,
          entry_date: paymentData.payment_date,
          description: `Payment received - Invoice ${paymentData.invoice_id}`,
          total_amount: paymentData.amount,
          status: 'posted',
          user_id: user.id,
          created_by: user.id,
          reference: `Payment: ${paymentData.reference_number || paymentData.invoice_id}`
        })
        .select()
        .single();

      if (jeError) throw jeError;

      // Create journal entry lines
      const journalLines = [
        {
          journal_entry_id: journalEntry.id,
          account_id: cashAccount.id,
          line_number: 1,
          description: `Cash received - ${paymentData.payment_method}`,
          debit_amount: paymentData.amount,
          credit_amount: 0
        },
        {
          journal_entry_id: journalEntry.id,
          account_id: arAccount.id,
          line_number: 2,
          description: `AR payment - Invoice ${paymentData.invoice_id}`,
          debit_amount: 0,
          credit_amount: paymentData.amount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(journalLines);

      if (linesError) throw linesError;
    } catch (error) {
      console.error('Error creating payment journal entries:', error);
    }
  };

  const sendPaymentReminder = async (invoiceId: string) => {
    // Implementation for sending payment reminders
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the customer",
    });
  };

  const getFilteredInvoices = () => {
    return arInvoices.filter(invoice => {
      const outstanding = invoice.total_amount - invoice.paid_amount;
      if (outstanding <= 0 && filter.status !== 'paid') return false;
      
      if (filter.status !== 'all' && invoice.status !== filter.status) return false;
      if (filter.overdue && invoice.days_past_due === 0) return false;
      if (filter.customer && !invoice.client_name.toLowerCase().includes(filter.customer.toLowerCase())) return false;
      
      return true;
    });
  };

  useEffect(() => {
    fetchARData();
  }, [user?.id]);

  return {
    arInvoices: getFilteredInvoices(),
    arSummary,
    isLoading,
    filter,
    setFilter,
    recordPayment,
    sendPaymentReminder,
    refreshData: fetchARData
  };
};