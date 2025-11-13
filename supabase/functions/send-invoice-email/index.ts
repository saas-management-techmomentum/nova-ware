import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceAmount: string;
  dueDate: string;
  pdfUrl?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing invoice email request...");
    
    const {
      recipientEmail,
      recipientName,
      invoiceNumber,
      invoiceAmount,
      dueDate,
      pdfUrl,
      notes
    }: InvoiceEmailRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !invoiceNumber || !invoiceAmount) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail, invoiceNumber, invoiceAmount" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending invoice ${invoiceNumber} to ${recipientEmail}`);

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f8fafc; }
            .invoice-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .button { display: inline-block; background-color: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LogistiX WMS</h1>
              <p>Invoice Notification</p>
            </div>
            <div class="content">
              <h2>Hello ${recipientName || 'Customer'},</h2>
              <p>You have received a new invoice from LogistiX WMS.</p>
              
              <div class="invoice-details">
                <div class="detail-row">
                  <strong>Invoice Number:</strong>
                  <span>${invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <strong>Amount:</strong>
                  <span>${invoiceAmount}</span>
                </div>
                <div class="detail-row">
                  <strong>Due Date:</strong>
                  <span>${dueDate || 'N/A'}</span>
                </div>
              </div>

              ${notes ? `<p><strong>Notes:</strong><br>${notes}</p>` : ''}

              ${pdfUrl ? `
                <div style="text-align: center;">
                  <a href="${pdfUrl}" class="button">View Invoice PDF</a>
                </div>
              ` : ''}

              <p>If you have any questions about this invoice, please contact us.</p>
            </div>
            <div class="footer">
              <p>LogistiX WMS - Warehouse Management System</p>
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "LogistiX WMS <support@logistixwms.com>",
      to: [recipientEmail],
      subject: `Invoice ${invoiceNumber} from LogistiX WMS`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invoice email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
