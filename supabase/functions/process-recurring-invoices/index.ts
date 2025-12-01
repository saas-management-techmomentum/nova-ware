import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringInvoice {
  id: string;
  user_id: string;
  warehouse_id: string | null;
  company_id: string | null;
  client_id: string | null;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval_count: number;
  next_invoice_date: string;
  end_date: string | null;
  is_active: boolean;
  template_data: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Query active recurring invoices due today or earlier
    const { data: recurringInvoices, error: queryError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('is_active', true)
      .lte('next_invoice_date', today);

    if (queryError) {
      console.error('❌ Error querying recurring invoices:', queryError);
      throw queryError;
    }

    if (!recurringInvoices || recurringInvoices.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recurring invoices due for processing',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      processed: 0,
      failed: 0,
      deactivated: 0,
      errors: [] as string[],
    };

    // Process each recurring invoice
    for (const recurring of recurringInvoices as RecurringInvoice[]) {
      try {

        const templateData = recurring.template_data;
        if (!templateData) {
          throw new Error('Template data is missing');
        }

        // Generate unique invoice number
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 11);
        const invoiceNumber = `inv-${timestamp}-${randomSuffix}`;

        // Calculate dates
        const invoiceDate = today;
        const paymentTermsDays = templateData.client_payment_terms_days || 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + paymentTermsDays);

        // Create new invoice from template
        const newInvoice = {
          id: invoiceNumber,
          invoice_number: invoiceNumber,
          user_id: recurring.user_id,
          warehouse_id: recurring.warehouse_id,
          company_id: recurring.company_id,
          client_id: recurring.client_id,
          client_name: templateData.client_name,
          client_contact_email: templateData.client_contact_email,
          client_contact_phone: templateData.client_contact_phone,
          client_billing_address: templateData.client_billing_address,
          client_payment_terms_days: paymentTermsDays,
          invoice_date: invoiceDate,
          due_date: dueDate.toISOString().split('T')[0],
          billing_period_start: templateData.billing_period_start,
          billing_period_end: templateData.billing_period_end,
          subtotal: templateData.subtotal,
          tax_amount: templateData.tax_amount || 0,
          total_amount: templateData.total_amount,
          status: 'draft',
          notes: templateData.notes,
          template_id: templateData.template_id,
        };

        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(newInvoice)
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Insert invoice items
        if (templateData.items && templateData.items.length > 0) {
          const itemsToInsert = templateData.items.map((item: any) => ({
            invoice_id: invoice.id,
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

          if (itemsError) throw itemsError;
        }

        // Calculate next invoice date
        const nextDate = new Date(recurring.next_invoice_date);
        switch (recurring.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + (7 * recurring.interval_count));
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + recurring.interval_count);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + (3 * recurring.interval_count));
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + recurring.interval_count);
            break;
        }

        const nextInvoiceDate = nextDate.toISOString().split('T')[0];

        // Check if we should deactivate (end_date exceeded)
        const shouldDeactivate = recurring.end_date && nextInvoiceDate > recurring.end_date;

        // Update recurring invoice
        const { error: updateError } = await supabase
          .from('recurring_invoices')
          .update({
            next_invoice_date: nextInvoiceDate,
            is_active: !shouldDeactivate,
          })
          .eq('id', recurring.id);

        if (updateError) throw updateError;

        if (shouldDeactivate) {
          results.deactivated++;
        } else {
          console.log(`📅 Updated next invoice date to ${nextInvoiceDate}`);
        }

        results.processed++;
      } catch (error: any) {
        console.error(`❌ Error processing recurring invoice ${recurring.id}:`, error);
        results.failed++;
        results.errors.push(`${recurring.id}: ${error.message}`);
      }
    }


    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Fatal error in recurring invoice processor:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
