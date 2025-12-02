import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/components/ui/use-toast';
import { CreateInvoiceData, InventoryValidationResult } from '@/types/billing';
import { createInvoiceJournalEntry, createInvoicePaymentJournalEntry } from '@/utils/journalEntryGenerator';

export interface BillingRate {
  id: string;
  service_type: string;
  rate_type: string;
  rate_amount: number;
  unit?: string;
  client_id: string;
  effective_date: string;
  end_date?: string;
  warehouse_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name?: string;
  client_contact_email?: string;
  client_contact_phone?: string;
  client_billing_address?: string;
  client_payment_terms_days?: number;
  invoice_date: string;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  payment_link?: string;
  pdf_url?: string;
  email_sent_at?: string;
  payment_due_reminder_sent_at?: string;
  payment_date?: string;
  template_id?: string;
  warehouse_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  items?: any[];
}

export interface RecurringInvoice {
  id: string;
  client_id: string;
  template_data: any;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval_count: number;
  next_invoice_date: string;
  end_date?: string;
  is_active: boolean;
  warehouse_id?: string;
  company_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useWarehouseScopedBilling = () => {
  const [billingRates, setBillingRates] = useState<BillingRate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, companyId } = useWarehouse();
  const { toast } = useToast();

  const fetchBillingRates = async () => {
    try {

      
      const { data, error } = await supabase
        .from('billing_rates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching billing rates:', error);
        throw error;
      }

      setBillingRates(data || []);
    } catch (error: any) {
      console.error('Error in fetchBillingRates:', error);
      toast({
        title: "Error fetching billing rates",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchInvoices = async () => {
    try {
    
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(
            name,
            contact_email,
            contact_phone,
            billing_address,
            payment_terms_days
          ),
          invoice_items(*),
          invoice_line_items(*)
        `)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });


      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      const processedInvoices = (data || []).map(invoice => ({
        ...invoice,
        // Populate client information from the joined clients table
        client_name: invoice.clients?.name || invoice.client_name,
        client_contact_email: invoice.clients?.contact_email || invoice.client_contact_email,
        client_contact_phone: invoice.clients?.contact_phone || invoice.client_contact_phone,
        client_billing_address: invoice.clients?.billing_address || invoice.client_billing_address,
        client_payment_terms_days: invoice.clients?.payment_terms_days || invoice.client_payment_terms_days,
        status: invoice.status as 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled',
        items: [...(invoice.invoice_items || []), ...(invoice.invoice_line_items || [])]
      }));

      setInvoices(processedInvoices);
    } catch (error: any) {
      console.error('Error in fetchInvoices:', error);
      toast({
        title: "Error fetching invoices",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchRecurringInvoices = async () => {
    try {
     
      
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select(`
          *,
          clients(
            name
          )
        `)
        .order('next_invoice_date', { ascending: true });

      if (error) {
        console.error('Error fetching recurring invoices:', error);
        throw error;
      }

      const processedData = (data || []).map(item => ({
        ...item,
        frequency: item.frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        end_date: item.end_date || undefined,
        warehouse_id: item.warehouse_id || undefined,
        company_id: item.company_id || undefined
      }));

      setRecurringInvoices(processedData);
    } catch (error: any) {
      console.error('Error in fetchRecurringInvoices:', error);
      toast({
        title: "Error fetching recurring invoices",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    await Promise.all([fetchBillingRates(), fetchInvoices(), fetchRecurringInvoices()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refetch();
  }, [selectedWarehouse]);

  const addBillingRate = async (rateData: Omit<BillingRate, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'warehouse_id'>): Promise<BillingRate | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newRate = {
        ...rateData,
        user_id: user.id,
        warehouse_id: selectedWarehouse,
      };

      const { data, error } = await supabase
        .from('billing_rates')
        .insert([newRate])
        .select()
        .single();

      if (error) throw error;

      setBillingRates(prev => [data, ...prev]);
      
      toast({
        title: "Billing rate added",
        description: "New billing rate has been created successfully.",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding billing rate:', error);
      toast({
        title: "Error adding billing rate",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const addInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate company_id is available
      if (!companyId) {
        throw new Error('Company ID not available. Please select a warehouse first.');
      }

      // Validate inventory availability before creating invoice
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemsForValidation = invoiceData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          name: item.name,
          sku: item.sku
        }));

        const validationResult = await validateInventoryAvailability(itemsForValidation);
        
        if (!validationResult.valid) {
          const shortageDetails = validationResult.items
            .filter(item => !item.available)
            .map(item => `${item.product_name} (${item.sku}): Available ${item.current_stock}, Required ${item.requested_quantity}`)
            .join('\n');
          
          throw new Error(`Insufficient inventory for invoice:\n${shortageDetails}`);
        }
      }

      // Generate invoice number
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 11);
      const invoiceNumber = `inv-${timestamp}-${randomSuffix}`;

      // Extract items from invoiceData to handle separately
      const { items, ...invoiceFields } = invoiceData;
      

      
      // STEP 1: Create invoice with 'draft' status first to avoid timing issues
      const newInvoice = {
        id: invoiceNumber,
        invoice_number: invoiceNumber,
        user_id: user.id,
        warehouse_id: selectedWarehouse,
        company_id: companyId,
        ...invoiceFields,
        status: 'draft', // Always start as draft
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();

      if (error) throw error;
    

      // Insert invoice items immediately after invoice creation
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemsToInsert = invoiceData.items.map(item => ({
          invoice_id: data.id,
          product_id: item.product_id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          product_description: item.product_description,
          stock_at_creation: item.stock_at_creation,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error inserting invoice items:', itemsError);
          throw itemsError;
        }

      }

      // STEP 2: Update status to trigger inventory reduction (with timeout to avoid race conditions)
      if (invoiceData.status !== 'draft') {

        
        // Small delay to ensure all items are inserted
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: statusError } = await supabase
          .from('invoices')
          .update({ status: invoiceData.status })
          .eq('id', data.id);

        if (statusError) {
          console.error('Error updating invoice status:', statusError);
          throw statusError;
        }
        

        
        // Update the data object to reflect the new status
        data.status = invoiceData.status;

        // Create journal entry for sent/approved invoices
        if (invoiceData.status === 'sent' || invoiceData.status === 'approved') {
          await createInvoiceJournalEntry({
            id: data.id,
            invoice_number: data.invoice_number,
            invoice_date: data.invoice_date,
            total_amount: data.total_amount,
            client_name: data.client_name,
            user_id: data.user_id,
            company_id: companyId!,
            warehouse_id: selectedWarehouse,
          });
        }
      }

      await fetchInvoices();
      
      toast({
        title: "Invoice created",
        description: `Invoice ${data.invoice_number} has been created successfully.${invoiceData.status === 'sent' || invoiceData.status === 'paid' ? ' Inventory has been automatically reduced.' : ''}`,
      });

      return {
        ...data,
        status: data.status as 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled'
      } as Invoice;
    } catch (error: any) {
      console.error('Error adding invoice:', error);
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: 'draft' | 'sent' | 'approved' | 'paid' | 'overdue' | 'cancelled') => {
    try {
      // Get the invoice details for journal entry
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;

      // If status is cancelled, remove from local state immediately for real-time update
      if (status === 'cancelled') {
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      } else {
        setInvoices(prev => 
          prev.map(invoice => 
            invoice.id === invoiceId 
              ? { ...invoice, status }
              : invoice
          )
        );
      }

      // Create journal entries based on status change
      if (invoice && companyId) {
        if (status === 'sent' || status === 'approved') {
          // Create AR/Revenue entry (only if not already created)
          await createInvoiceJournalEntry({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            total_amount: invoice.total_amount,
            client_name: invoice.client_name,
            user_id: invoice.user_id,
            company_id: companyId,
            warehouse_id: invoice.warehouse_id,
          });
        } else if (status === 'paid') {
          // Create Cash/AR entry
          await createInvoicePaymentJournalEntry({
            invoice_number: invoice.invoice_number,
            payment_date: new Date().toISOString().split('T')[0],
            amount: invoice.total_amount,
            user_id: invoice.user_id,
            company_id: companyId,
            warehouse_id: invoice.warehouse_id,
          });
        }
      }

      toast({
        title: "Invoice updated",
        description: `Invoice status changed to ${status}.${status === 'sent' || status === 'approved' || status === 'paid' ? ' Journal entry created automatically.' : ''}`,
      });
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error updating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createRecurringInvoice = async (recurringData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!companyId) {
        throw new Error('Company ID not available. Please select a warehouse first.');
      }



      // Fetch the template invoice with all items
      const { data: templateInvoice, error: templateError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(
            name,
            contact_email,
            contact_phone,
            billing_address,
            payment_terms_days
          ),
          invoice_items(*)
        `)
        .eq('id', recurringData.template_invoice_id)
        .single();

      if (templateError) throw templateError;
      if (!templateInvoice) throw new Error('Template invoice not found');

      // Prepare template data with client information
      const templateData = {
        ...templateInvoice,
        client_name: templateInvoice.clients?.name || templateInvoice.client_name,
        client_contact_email: templateInvoice.clients?.contact_email || templateInvoice.client_contact_email,
        client_contact_phone: templateInvoice.clients?.contact_phone || templateInvoice.client_contact_phone,
        client_billing_address: templateInvoice.clients?.billing_address || templateInvoice.client_billing_address,
        client_payment_terms_days: templateInvoice.clients?.payment_terms_days || templateInvoice.client_payment_terms_days,
        items: templateInvoice.invoice_items
      };

      // Insert recurring invoice
      const { data, error } = await supabase
        .from('recurring_invoices')
        .insert({
          user_id: user.id,
          warehouse_id: selectedWarehouse,
          company_id: companyId,
          client_id: recurringData.client_id,
          frequency: recurringData.frequency,
          interval_count: recurringData.interval_count || 1,
          next_invoice_date: recurringData.next_invoice_date,
          end_date: recurringData.end_date || null,
          is_active: true,
          template_data: templateData
        })
        .select()
        .single();

      if (error) throw error;


      
      toast({
        title: "Recurring invoice created",
        description: `Your recurring invoice has been set up successfully. Next invoice: ${recurringData.next_invoice_date}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating recurring invoice:', error);
      toast({
        title: "Error creating recurring invoice",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const validateInventoryAvailability = async (items: { product_id: string; quantity: number }[]): Promise<InventoryValidationResult> => {
    try {
      const productIds = items.map(item => item.product_id);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, quantity')
        .in('id', productIds);

      if (error) throw error;

      const validationResults = items.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        if (!product) {
          return {
            product_id: item.product_id,
            available: false,
            current_stock: 0,
            requested_quantity: item.quantity,
            shortage: item.quantity,
            product_name: 'Unknown Product',
            sku: 'UNKNOWN'
          };
        }

        const shortage = Math.max(0, item.quantity - product.quantity);
        return {
          product_id: item.product_id,
          available: product.quantity >= item.quantity,
          current_stock: product.quantity,
          requested_quantity: item.quantity,
          shortage,
          product_name: product.name,
          sku: product.sku
        };
      });

      const totalShortage = validationResults.reduce((sum, result) => sum + result.shortage, 0);

      return {
        valid: validationResults.every(result => result.available),
        total_shortage: totalShortage,
        items: validationResults
      };
    } catch (error: any) {
      console.error('Error validating inventory:', error);
      toast({
        title: "Error validating inventory",
        description: error.message,
        variant: "destructive",
      });
      return {
        valid: false,
        total_shortage: 0,
        items: []
      };
    }
  };

  const generateInvoicePDF = async (invoiceId: string): Promise<string | undefined> => {
    try {

      
      // Get the user's auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Make direct fetch request to edge function
      const response = await fetch(`https://stejrgorjpuojorrwbvk.supabase.co/functions/v1/generate-invoice-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZWpyZ29yanB1b2pvcnJ3YnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODA3MDksImV4cCI6MjA3ODE1NjcwOX0.i8SMUfbWmyTnO6h6k36XICqtjxBxRz37NhisCuIYaX8'
        },
        body: JSON.stringify({ invoiceId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', response.status, errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      // Get the PDF as binary data
      const pdfArrayBuffer = await response.arrayBuffer();
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      
      const invoice = invoices.find(inv => inv.id === invoiceId);
      const filename = `invoice-${invoice?.invoice_number || invoiceId}.pdf`;
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Generated",
        description: "Invoice PDF has been downloaded successfully.",
      });
      
      return url;
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error generating PDF",
        description: error.message,
        variant: "destructive",
      });
      return undefined;
    }
  };

  const sendInvoiceEmail = async (invoiceId: string, recipientEmail: string, customMessage?: string) => {
    try {

      
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: { 
          invoiceId, 
          recipientEmail, 
          customMessage 
        }
      });

      if (error) {
        console.error('Error sending invoice email:', error);
        throw new Error(error.message || 'Failed to send invoice email');
      }

      // Update local state to reflect email sent
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, email_sent_at: new Date().toISOString() }
            : invoice
        )
      );

      toast({
        title: "Email sent successfully",
        description: `Invoice email sent to ${recipientEmail}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      toast({
        title: "Error sending email",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createPaymentLink = async (invoiceId: string): Promise<string | undefined> => {
    try {
      // Implementation for payment link creation
      const paymentLink = `https://pay.logistixwms.com/invoice/${invoiceId}`;
      
      const { error } = await supabase
        .from('invoices')
        .update({ payment_link: paymentLink })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, payment_link: paymentLink }
            : invoice
        )
      );

      toast({
        title: "Payment link created",
        description: "Payment link has been generated and copied to clipboard.",
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(paymentLink);

      return paymentLink;
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      toast({
        title: "Error creating payment link",
        description: error.message,
        variant: "destructive",
      });
      return undefined;
    }
  };

  const updateRecurringInvoice = async (id: string, updates: Partial<RecurringInvoice>) => {
    try {
      const { error } = await supabase
        .from('recurring_invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setRecurringInvoices(prev => 
        prev.map(recurring => 
          recurring.id === id 
            ? { ...recurring, ...updates }
            : recurring
        )
      );

      toast({
        title: "Recurring invoice updated",
        description: "Recurring invoice schedule has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating recurring invoice:', error);
      toast({
        title: "Error updating recurring invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRecurringInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecurringInvoices(prev => prev.filter(recurring => recurring.id !== id));

      toast({
        title: "Recurring invoice deleted",
        description: "Recurring invoice schedule has been removed.",
      });
    } catch (error: any) {
      console.error('Error deleting recurring invoice:', error);
      toast({
        title: "Error deleting recurring invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    billingRates,
    invoices,
    recurringInvoices,
    isLoading,
    addBillingRate,
    addInvoice,
    updateInvoiceStatus,
    createRecurringInvoice,
    updateRecurringInvoice,
    deleteRecurringInvoice,
    validateInventoryAvailability,
    generateInvoicePDF,
    sendInvoiceEmail,
    createPaymentLink,
    refetch,
  };
};
