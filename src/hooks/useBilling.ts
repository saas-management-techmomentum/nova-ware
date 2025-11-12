
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';

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

export const useBilling = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [billingRates, setBillingRates] = useState<BillingRate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [billingTransactions, setBillingTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBillingData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get employee info to check for warehouse assignment
      const { data: employees } = await supabase
        .from('employees')
        .select('assigned_warehouse_id')
        .eq('user_id_auth', user.id)
        .maybeSingle();

      const { data: userRoles } = await supabase
        .from('company_users')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => role.role === 'admin') || false;
      const isAssignedEmployee = employees?.assigned_warehouse_id; // Prioritize warehouse assignment over admin status

      // Fetch billing rates
      let ratesQuery = supabase
        .from('billing_rates')
        .select('*');

      if (isAssignedEmployee) {
        ratesQuery = ratesQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else {
        ratesQuery = ratesQuery.eq('user_id', user.id);
      }

      const { data: ratesData, error: ratesError } = await ratesQuery;
      if (ratesError) throw ratesError;
      setBillingRates(ratesData || []);

      // Fetch invoices (exclude cancelled invoices from the main list)
      let invoicesQuery = supabase
        .from('invoices')
        .select('*')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (isAssignedEmployee) {
        invoicesQuery = invoicesQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else {
        invoicesQuery = invoicesQuery.eq('user_id', user.id);
      }

      const { data: invoicesData, error: invoicesError } = await invoicesQuery;

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Fetch invoice templates
      let templatesQuery = supabase
        .from('invoice_templates')
        .select('*')
        .order('is_default', { ascending: false });

      if (isAssignedEmployee) {
        templatesQuery = templatesQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else {
        templatesQuery = templatesQuery.eq('user_id', user.id);
      }

      const { data: templatesData, error: templatesError } = await templatesQuery;
      if (templatesError) throw templatesError;
      setInvoiceTemplates(templatesData || []);

      // Fetch recurring invoices with proper type casting
      let recurringQuery = supabase
        .from('recurring_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (isAssignedEmployee) {
        recurringQuery = recurringQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else {
        recurringQuery = recurringQuery.eq('user_id', user.id);
      }

      const { data: recurringData, error: recurringError } = await recurringQuery;

      if (recurringError) throw recurringError;
      
      // Cast the frequency field to the proper type
      const typedRecurringData = (recurringData || []).map(item => ({
        ...item,
        frequency: item.frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      }));
      
      setRecurringInvoices(typedRecurringData);

      // Fetch billing transactions
      let transactionsQuery = supabase
        .from('billing_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (isAssignedEmployee) {
        transactionsQuery = transactionsQuery.eq('warehouse_id', employees.assigned_warehouse_id);
      } else {
        transactionsQuery = transactionsQuery.eq('user_id', user.id);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;
      setBillingTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReversalJournalEntry = async (invoiceId: string) => {
    if (!user?.id) return;

    try {
      // Get the original invoice to calculate reversal amounts
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (invoiceError || !invoiceData) {
        console.error('Could not find invoice for reversal:', invoiceError);
        return;
      }

      // Check if a reversal entry already exists
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('reference', `Invoice Cancellation: ${invoiceId}`)
        .eq('user_id', user.id)
        .single();

      if (existingEntry) {
        console.log('Reversal entry already exists for invoice:', invoiceId);
        return;
      }

      // Get account IDs for reversal entry
      const { data: revenueAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('account_code', '4000')
        .eq('user_id', user.id)
        .single();

      const { data: receivablesAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('account_code', '1100')
        .eq('user_id', user.id)
        .single();

      if (!revenueAccount || !receivablesAccount) {
        console.log('Required accounts not found for reversal entry');
        return;
      }

      // Create reversal journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: `JE-CANCEL-${invoiceId}-${Date.now()}`,
          entry_date: new Date().toISOString().split('T')[0],
          description: `Revenue reversal - Invoice ${invoiceData.invoice_number} cancelled`,
          total_amount: invoiceData.total_amount,
          status: 'posted',
          user_id: user.id,
          created_by: user.id,
          reference: `Invoice Cancellation: ${invoiceId}`
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create reversal journal lines: Debit Revenue, Credit Accounts Receivable
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert([
          {
            journal_entry_id: journalEntry.id,
            account_id: revenueAccount.id,
            line_number: 1,
            description: `Revenue reversal - Invoice ${invoiceData.invoice_number}`,
            debit_amount: invoiceData.total_amount,
            credit_amount: 0
          },
          {
            journal_entry_id: journalEntry.id,
            account_id: receivablesAccount.id,
            line_number: 2,
            description: `A/R reversal - Invoice ${invoiceData.invoice_number}`,
            debit_amount: 0,
            credit_amount: invoiceData.total_amount
          }
        ]);

      if (linesError) throw linesError;

      console.log('Reversal journal entry created for cancelled invoice:', invoiceId);
    } catch (error) {
      console.error('Error creating reversal journal entry:', error);
    }
  };

  const generateInvoicePDF = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId }
      });

      if (error) throw error;

      // Update invoice with PDF URL
      await supabase
        .from('invoices')
        .update({ pdf_url: data.pdfUrl })
        .eq('id', invoiceId)
        .eq('user_id', user?.id);

      toast({
        title: "Success",
        description: "Invoice PDF generated successfully",
      });

      return data.pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice PDF",
        variant: "destructive",
      });
    }
  };

  const sendInvoiceEmail = async (invoiceId: string, recipientEmail: string, customMessage?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoiceId, recipientEmail, customMessage }
      });

      if (error) throw error;

      // Update invoice with email sent timestamp
      await supabase
        .from('invoices')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', user?.id);

      // Log email in tracking table
      await supabase
        .from('invoice_emails')
        .insert({
          invoice_id: invoiceId,
          email_type: 'invoice_sent',
          recipient_email: recipientEmail
        });

      toast({
        title: "Success",
        description: "Invoice sent successfully",
      });

      return data;
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  const createRecurringInvoice = async (recurringData: Omit<RecurringInvoice, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .insert([{ ...recurringData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Cast the frequency field to proper type for local state
      const typedData = {
        ...data,
        frequency: data.frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      };

      setRecurringInvoices(prev => [typedData, ...prev]);
      toast({
        title: "Success",
        description: "Recurring invoice created successfully",
      });
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create recurring invoice",
        variant: "destructive",
      });
    }
  };

  const processRecurringInvoices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-recurring-invoices');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Processed ${data.processed} recurring invoices`,
      });

      fetchBillingData(); // Refresh data
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
      toast({
        title: "Error",
        description: "Failed to process recurring invoices",
        variant: "destructive",
      });
    }
  };

  const createPaymentLink = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { invoiceId }
      });

      if (error) throw error;

      // Update invoice with payment link
      await supabase
        .from('invoices')
        .update({ payment_link: data.paymentLink })
        .eq('id', invoiceId)
        .eq('user_id', user?.id);

      toast({
        title: "Success",
        description: "Payment link created successfully",
      });

      return data.paymentLink;
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast({
        title: "Error",
        description: "Failed to create payment link",
        variant: "destructive",
      });
    }
  };

  const addBillingRate = async (rateData: Omit<BillingRate, 'id'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('billing_rates')
        .insert([{ ...rateData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setBillingRates(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Billing rate added successfully",
      });
    } catch (error) {
      console.error('Error adding billing rate:', error);
      toast({
        title: "Error",
        description: "Failed to add billing rate",
        variant: "destructive",
      });
    }
  };

  const deleteBillingRate = async (rateId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('billing_rates')
        .delete()
        .eq('id', rateId)
        .eq('user_id', user.id);

      if (error) throw error;

      setBillingRates(prev => prev.filter(rate => rate.id !== rateId));
      toast({
        title: "Success",
        description: "Billing rate deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting billing rate:', error);
      toast({
        title: "Error",
        description: "Failed to delete billing rate",
        variant: "destructive",
      });
    }
  };

  const createInvoice = async (invoiceData: Partial<Invoice> & { line_items?: InvoiceLineItem[] }) => {
    if (!user?.id) return;

    // Validate required fields
    if (!invoiceData.client_id || !invoiceData.due_date || !invoiceData.billing_period_start || !invoiceData.billing_period_end) {
      toast({
        title: "Error",
        description: "Missing required fields for invoice creation",
        variant: "destructive",
      });
      return;
    }

    try {
      const invoiceNumber = invoiceData.invoice_number || `INV-${Date.now()}`;
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          id: invoiceNumber, // Use invoice number as ID since it's a text field
          invoice_number: invoiceNumber,
          user_id: user.id,
          client_id: invoiceData.client_id,
          invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          billing_period_start: invoiceData.billing_period_start,
          billing_period_end: invoiceData.billing_period_end,
          subtotal: invoiceData.subtotal || 0,
          tax_amount: invoiceData.tax_amount || 0,
          total_amount: invoiceData.total_amount || 0,
          status: invoiceData.status || 'draft',
          payment_date: invoiceData.payment_date || null,
          notes: invoiceData.notes || null,
          template_id: invoiceData.template_id || null
        }])
        .select()
        .single();

      if (error) throw error;

      // Save line items if provided
      if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        const lineItemsData = invoiceData.line_items.map(item => ({
          invoice_id: data.id,
          description: item.description,
          quantity: item.quantity,
          unit_rate: item.price,
          total_amount: item.amount,
          service_type: 'product',
          billing_period_start: invoiceData.billing_period_start!,
          billing_period_end: invoiceData.billing_period_end!
        }));

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;
      }

      const newInvoice = { 
        ...data, 
        line_items: invoiceData.line_items || []
      } as Invoice;
      
      setInvoices(prev => [newInvoice, ...prev]);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const createOrderFromInvoice = async (invoice: Invoice) => {
    if (!user?.id || !invoice.line_items || invoice.line_items.length === 0) return;

    try {
      // Get client info for the order
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name')
        .eq('id', invoice.client_id)
        .single();

      if (clientError) throw clientError;

      const orderId = `ORD-${Date.now()}`;
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_name: clientData.name,
          status: 'pending',
          user_id: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items from invoice line items
      const orderItemsData = invoice.line_items
        .filter(item => item.sku) // Only items with SKUs
        .map(item => ({
          order_id: orderId,
          sku: item.sku!,
          quantity: item.quantity,
          unit_price: item.price
        }));

      if (orderItemsData.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Order Created",
        description: `Order ${orderId} has been created from invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error('Error creating order from invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create order from invoice",
        variant: "destructive",
      });
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status,
          payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Handle cancelled invoices
      if (status === 'cancelled') {
        // Create reversal journal entry for cancelled invoices
        await createReversalJournalEntry(invoiceId);
        
        // Remove from local state (it will be excluded from future fetches)
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
        
        toast({
          title: "Invoice Cancelled",
          description: "Invoice has been cancelled and removed from the active list. Financial entries have been reversed.",
        });
        
        return;
      }

      // Find the invoice that was updated
      const invoiceToUpdate = invoices.find(invoice => invoice.id === invoiceId);
      
      // If invoice is marked as paid and it wasn't paid before, create an order
      if (status === 'paid' && invoiceToUpdate && invoiceToUpdate.status !== 'paid') {
        console.log('Creating order from paid invoice:', invoiceId);
        await createOrderFromInvoice(invoiceToUpdate);
      }

      // Update local state for non-cancelled invoices
      const updatedInvoices = invoices.map(invoice => {
        if (invoice.id === invoiceId) {
          return { 
            ...invoice, 
            status, 
            payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : invoice.payment_date 
          };
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);

      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user && employees.length > 0) { // Wait for employees to load
      fetchBillingData();
    }
  }, [user, employees.length]);

  return {
    billingRates,
    invoices,
    invoiceTemplates,
    recurringInvoices,
    billingTransactions,
    loading,
    fetchBillingData,
    addBillingRate,
    deleteBillingRate,
    createInvoice,
    updateInvoiceStatus,
    generateInvoicePDF,
    sendInvoiceEmail,
    createRecurringInvoice,
    processRecurringInvoices,
    createPaymentLink,
  };
};
