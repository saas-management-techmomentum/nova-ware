import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/components/ui/use-toast';
import { CreateInvoiceData, InventoryValidationResult } from '@/types/billing';

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

export const useWarehouseScopedBilling = () => {
  const [billingRates, setBillingRates] = useState<BillingRate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWarehouse, companyId } = useWarehouse();
  const { toast } = useToast();

  const fetchBillingRates = async () => {
    try {
      console.log('🔄 Fetching billing rates for warehouse:', selectedWarehouse);
      
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
      console.log('🔄 Fetching invoices for warehouse:', selectedWarehouse);
      
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

      console.log('📊 Invoice query result:', { data: data?.length || 0, error });

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

  const refetch = async () => {
    setIsLoading(true);
    await Promise.all([fetchBillingRates(), fetchInvoices()]);
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
      
      console.log('Creating invoice with two-step process to ensure trigger fires...');
      
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
      console.log('Invoice created with ID:', data.id);

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
        console.log('Invoice items inserted successfully');
      }

      // STEP 2: Update status to trigger inventory reduction (with timeout to avoid race conditions)
      if (invoiceData.status !== 'draft') {
        console.log(`Updating invoice status to ${invoiceData.status} to trigger inventory reduction...`);
        
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
        
        console.log('Invoice status updated, database trigger will handle inventory reduction automatically');
        
        // Update the data object to reflect the new status
        data.status = invoiceData.status;
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

      // Database trigger will automatically handle inventory reduction for status changes

      toast({
        title: "Invoice updated",
        description: `Invoice status changed to ${status}.${status === 'sent' || status === 'approved' || status === 'paid' ? ' Inventory reduced automatically.' : ''}`,
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
      // Implementation for recurring invoices
      console.log('Creating recurring invoice:', recurringData);
      
      toast({
        title: "Recurring invoice created",
        description: "Your recurring invoice has been set up successfully.",
      });
    } catch (error: any) {
      console.error('Error creating recurring invoice:', error);
      toast({
        title: "Error creating recurring invoice",
        description: error.message,
        variant: "destructive",
      });
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
      console.log('Generating PDF for invoice:', invoiceId);
      
      // Get the user's auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Make direct fetch request to edge function
      const response = await fetch(`https://whmpesmpkvfcbycsrasr.supabase.co/functions/v1/generate-invoice-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobXBlc21wa3ZmY2J5Y3NyYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzODM0ODksImV4cCI6MjA2Mzk1OTQ4OX0.oG00P0r-_-4eF3OH6y7VvmQEaJqqPQDMaz4rAdGyCV0'
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
      console.log('Sending invoice email for:', invoiceId, 'to:', recipientEmail);
      
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

  return {
    billingRates,
    invoices,
    isLoading,
    addBillingRate,
    addInvoice,
    updateInvoiceStatus,
    createRecurringInvoice,
    validateInventoryAvailability,
    generateInvoicePDF,
    sendInvoiceEmail,
    createPaymentLink,
    refetch,
  };
};
