import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmployeeRequest {
  employeeEmail: string;
  employeeName: string;
  companyName: string;
  position?: string;
  invitedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing employee invitation request...");
    
    const {
      employeeEmail,
      employeeName,
      companyName,
      position,
      invitedBy
    }: InviteEmployeeRequest = await req.json();

    // Validate required fields
    if (!employeeEmail || !employeeName || !companyName) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: employeeEmail, employeeName, companyName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending invitation to ${employeeName} (${employeeEmail}) for ${companyName}`);

    // Generate invitation link (using the app's auth page)
    const invitationLink = `https://stejrgorjpuojorrwbvk.supabase.co/auth/v1/verify?type=invite&token_hash=placeholder`;
    const appSignupLink = `${Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:3000"}/auth`;

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
            .invitation-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f172a; }
            .button { display: inline-block; background-color: #0f172a; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .details { background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LogistiX WMS</h1>
              <p>Employee Invitation</p>
            </div>
            <div class="content">
              <h2>Hello ${employeeName}!</h2>
              <p>You've been invited to join <strong>${companyName}</strong> on LogistiX WMS.</p>
              
              <div class="invitation-box">
                <h3>🎉 You're Invited!</h3>
                <p>${invitedBy} has invited you to join their team at ${companyName}.</p>
                
                ${position ? `<div class="details">
                  <strong>Position:</strong> ${position}
                </div>` : ''}

                <p>LogistiX WMS is a comprehensive warehouse management system that will help you manage inventory, orders, shipments, and more.</p>
                
                <div style="text-align: center;">
                  <a href="${appSignupLink}" class="button">Accept Invitation & Sign Up</a>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                  <strong>Next Steps:</strong><br>
                  1. Click the button above to create your account<br>
                  2. Use your email (${employeeEmail}) to sign up<br>
                  3. Complete your profile setup<br>
                  4. Start collaborating with your team!
                </p>
              </div>

              <p>If you have any questions, please contact your administrator or reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>LogistiX WMS - Warehouse Management System</p>
              <p>This invitation was sent by ${invitedBy} from ${companyName}</p>
              <p style="margin-top: 10px; font-size: 12px;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "LogistiX WMS <support@logistixwms.com>",
      to: [employeeEmail],
      subject: `You're invited to join ${companyName} on LogistiX WMS`,
      html: emailHtml,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.id,
      message: `Invitation sent to ${employeeName} at ${employeeEmail}`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in invite-employee function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send employee invitation",
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
