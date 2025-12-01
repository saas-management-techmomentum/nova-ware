
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendInvoiceEmailRequest {
  invoiceId: string;
  recipientEmail: string;
  customMessage?: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    
    const { invoiceId, recipientEmail, customMessage }: SendInvoiceEmailRequest = await req.json();
    
    if (!invoiceId || !recipientEmail) {
      throw new Error('Invoice ID and recipient email are required');
    }


    // Validate required environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendDomain = Deno.env.get('RESEND_DOMAIN') || 'logistixwms.com';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }



    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Set the auth context for the supabase client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Invalid authentication token');
    }


    // Generate the PDF by calling the generate-invoice-pdf function directly via HTTP
    // This ensures we get the raw binary response instead of processed data
    const pdfUrl = `${supabaseUrl}/functions/v1/generate-invoice-pdf`;
    
    const pdfResponse = await fetch(pdfUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ invoiceId }),
    });

    if (!pdfResponse.ok) {
      console.error('PDF generation failed with status:', pdfResponse.status);
      const errorText = await pdfResponse.text();
      console.error('PDF generation error:', errorText);
      throw new Error(`Failed to generate invoice PDF: ${pdfResponse.status} - ${errorText}`);
    }

    // Get the PDF as binary data
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    

    // Get invoice details for email content
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      throw new Error('Invoice not found');
    }

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .single();

    if (clientError || !client) {
      console.error('Client fetch error:', clientError);
      throw new Error('Client not found');
    }

    // Get company info for email template
    let companyInfo = {
      name: 'LogitixWMS',
      address: '1000',
      city: 'Skopje MKD',
      phone: '(555) 123-4567',
      email: 'support@unsynth.ai',
      website: 'logistixwms.com',
    };

    try {
      let template = null;
      
      // First, try to get the template used for this specific invoice
      if (invoice.template_id) {
        const { data: invoiceTemplate } = await supabase
          .from('invoice_templates')
          .select('design_config')
          .eq('id', invoice.template_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        template = invoiceTemplate;
      }
      
      // If no invoice-specific template, fall back to default
      if (!template) {
        const { data: defaultTemplate } = await supabase
          .from('invoice_templates')
          .select('design_config')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        
        template = defaultTemplate;
      }

      if (template?.design_config) {
        const config = typeof template.design_config === 'string' 
          ? JSON.parse(template.design_config)
          : template.design_config;
        
        if (config?.company) {
          companyInfo = { ...companyInfo, ...config.company };
        }
      }
    } catch (error) {
      console.log('No template found, using default company info');
    }

    // Create professional HTML email template
    const emailSubject = `Invoice ${invoice.invoice_number} from ${companyInfo.name}`;
    
    const defaultMessage = `Hi there,

Please find your invoice attached. 

Payment can be made online by clicking the payment link in the attached invoice, or you can remit payment using the details provided in the invoice.

Thank you for your business!

Best regards,
${companyInfo.name}`;

    const emailMessage = customMessage || defaultMessage;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .invoice-info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .detail-item { padding: 10px; background: #f5f5f5; border-radius: 4px; }
            .detail-label { font-weight: bold; color: #555; }
            .message-content { white-space: pre-line; background: #fff; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .payment-info { background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 15px 0; }
            @media (max-width: 600px) {
                .invoice-details { grid-template-columns: 1fr; }
                body { padding: 10px; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${companyInfo.name}</div>
            <div>${companyInfo.address}</div>
            <div>${companyInfo.city}</div>
            <div>${companyInfo.phone} | ${companyInfo.email}</div>
        </div>

        <div class="invoice-info">
            <h2 style="margin: 0 0 15px 0; color: #2c3e50;">Invoice ${invoice.invoice_number}</h2>
            <div class="invoice-details">
                <div class="detail-item">
                    <div class="detail-label">Bill To:</div>
                    <div>${client.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Invoice Date:</div>
                    <div>${new Date(invoice.invoice_date).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Due Date:</div>
                    <div>${new Date(invoice.due_date).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Amount Due:</div>
                    <div style="font-weight: bold; color: #e74c3c;">$${invoice.total_amount.toFixed(2)}</div>
                </div>
            </div>
        </div>

        <div class="message-content">
            ${emailMessage}
        </div>

        ${invoice.payment_link ? `
        <div class="payment-info">
            <strong>🔗 Pay Online:</strong> <a href="${invoice.payment_link}" style="color: #3498db;">Click here to pay securely online</a>
        </div>
        ` : ''}

        <div class="footer">
            <p>This email was sent by ${companyInfo.name}</p>
            <p>If you have any questions about this invoice, please contact us at ${companyInfo.email}</p>
        </div>
    </body>
    </html>`;

    
    const emailResponse = await resend.emails.send({
      from: `${companyInfo.name} <invoices@${resendDomain}>`,
      to: [recipientEmail],
      subject: emailSubject,
      html: htmlContent,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: Array.from(pdfBytes),
        },
      ],
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message || 'Unknown Resend error'}`);
    }

    // Update invoice with email sent timestamp
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      // Don't fail the entire operation for this
    }

    // Log email in tracking table
    const { error: logError } = await supabase
      .from('invoice_emails')
      .insert({
        invoice_id: invoiceId,
        email_type: 'invoice_sent',
        recipient_email: recipientEmail,
        email_status: 'sent'
      });

    if (logError) {
      console.error('Error logging email:', logError);
      // Don't fail the entire operation for this
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Invoice email sent successfully',
      emailId: emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
