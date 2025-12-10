import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature if webhook secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Parse event directly if no webhook secret (for testing)
      event = JSON.parse(body);
      console.log('Warning: Processing webhook without signature verification');
    }

    console.log('Received Stripe event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const invoiceId = session.metadata?.invoice_id;
      const invoiceNumber = session.metadata?.invoice_number;
      
      if (!invoiceId) {
        console.error('No invoice_id in session metadata');
        return new Response(JSON.stringify({ error: 'Missing invoice_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Processing payment for invoice: ${invoiceId}`);

      // Fetch invoice to get user_id and other details
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError || !invoice) {
        console.error('Error fetching invoice:', fetchError);
        throw new Error('Invoice not found');
      }

      // Update invoice status to paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice status:', updateError);
        throw updateError;
      }

      console.log(`Invoice ${invoiceId} marked as paid`);

      // Create payment record
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoiceId,
          amount: (session.amount_total || 0) / 100, // Convert from cents
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'stripe',
          reference_number: session.payment_intent as string,
          stripe_payment_id: session.payment_intent as string,
          user_id: invoice.user_id,
          notes: `Stripe payment - Session: ${session.id}`,
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      } else {
        console.log('Payment record created successfully');
      }

      // Create journal entry for payment (Cash Dr, AR Cr)
      try {
        const entryNumber = `JE-PAY-${Date.now()}`;
        
        // Create journal entry
        const { data: journalEntry, error: jeError } = await supabase
          .from('journal_entries')
          .insert({
            entry_number: entryNumber,
            entry_date: new Date().toISOString().split('T')[0],
            description: `Payment received for Invoice ${invoiceNumber || invoiceId}`,
            reference: `Stripe: ${session.payment_intent}`,
            status: 'posted',
            user_id: invoice.user_id,
            company_id: invoice.company_id,
            warehouse_id: invoice.warehouse_id,
            total_amount: invoice.total_amount,
          })
          .select()
          .single();

        if (jeError) {
          console.error('Error creating journal entry:', jeError);
        } else if (journalEntry) {
          // Get accounts for journal entry lines
          const { data: accounts } = await supabase
            .from('accounts')
            .select('id, account_code')
            .eq('company_id', invoice.company_id)
            .in('account_code', ['1000', '1100']); // Cash and AR

          const cashAccount = accounts?.find(a => a.account_code === '1000');
          const arAccount = accounts?.find(a => a.account_code === '1100');

          if (cashAccount && arAccount) {
            // Create journal entry lines
            await supabase
              .from('journal_entry_lines')
              .insert([
                {
                  journal_entry_id: journalEntry.id,
                  account_id: cashAccount.id,
                  debit_amount: invoice.total_amount,
                  credit_amount: 0,
                  description: 'Cash received',
                },
                {
                  journal_entry_id: journalEntry.id,
                  account_id: arAccount.id,
                  debit_amount: 0,
                  credit_amount: invoice.total_amount,
                  description: 'Accounts Receivable reduction',
                },
              ]);

            console.log('Journal entry created successfully');
          }
        }
      } catch (jeErr) {
        console.error('Error in journal entry creation:', jeErr);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});