import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface InviteEmployeeRequest {
  employeeId: string;
  email: string;
  temporaryPassword: string;
  companyId: string;
  companyName?: string;
  role: 'manager' | 'employee';
  warehouseId?: string;
  warehouseName?: string;
}

// Simple password generator function
function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function sendCustomInvitationEmail(
  email: string, 
  employeeName: string, 
  companyName: string, 
  password: string,
  loginUrl: string,
  warehouseName?: string
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .password-box { background: #e11d48; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .instructions { background: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${companyName}!</h1>
          </div>
          <div class="content">
            <h2>Hello ${employeeName},</h2>
            <p>You've been invited to join ${companyName}'s warehouse management system. ${warehouseName ? `You'll be working at <strong>${warehouseName}</strong> warehouse.` : ''} We're excited to have you on our team!</p>
            
            <div class="password-box">
              Your temporary password: ${password}
            </div>
            
            <p><strong>To get started:</strong></p>
            <div class="instructions">
              <ol>
                <li>Go to the login page using the link below</li>
                <li>Use your email (${email}) and the password above to log in</li>
                <li>You'll be prompted to change your password on first login for security</li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </div>
            
            <p><strong>Important Security Notes:</strong></p>
            <ul>
              <li>Keep your password secure and don't share it with anyone</li>
              <li>Change your password after your first login</li>
              <li>If you have any issues, contact your manager</li>
            </ul>
            
            <div class="footer">
              <p>This email was sent from ${companyName} Warehouse Management System</p>
              <p>If you didn't expect this email, please contact your system administrator.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    
    const emailData = {
      from: "Warehouse Management <support@logistixwms.com>",
      to: [email],
      subject: `Welcome to ${companyName} - Your Account is Ready!`,
      html: emailHtml,
    };
    
    
    const result = await resend.emails.send(emailData);
    
    
    return result;
  } catch (error: any) {
    console.error('=== RESEND ERROR DETAILS ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
     
    throw new Error(`Resend API Error: ${error.message}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    const { employeeId, email, temporaryPassword, companyId, companyName, role, warehouseId, warehouseName }: InviteEmployeeRequest = requestBody;
    
    // Validate required fields
    if (!employeeId || !email || !companyId || !role) {
      throw new Error('Missing required fields: employeeId, email, companyId, or role');
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!serviceRoleKey 
      });
      throw new Error('Missing required environment variables');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get employee and company data
    const { data: employeeData } = await supabaseAdmin
      .from('employees')
      .select('name')
      .eq('id', employeeId)
      .single();

    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const finalCompanyName = companyName || companyData?.name || 'Your Company';

    const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userListError) {
      console.error('Error checking existing users:', userListError);
      throw new Error(`Failed to check existing users: ${userListError.message}`);
    }
    
    const existingUser = userList.users.find(user => user.email === email);
    
    if (existingUser) {
      // If user exists, send password reset email instead
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `https://logistixwms.com/auth`
      });
      
      if (resetError) {
        console.error('Error sending password reset:', resetError);
        throw new Error(`User already exists but failed to send password reset: ${resetError.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User already exists. Password reset email sent.',
          userId: existingUser.id,
          email: email
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Generate a new secure password if the provided one is problematic
    const securePassword = temporaryPassword && temporaryPassword.length >= 8 
      ? temporaryPassword 
      : generateSecurePassword();
    

    // Create user with email confirmed since we're sending custom email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: securePassword,
      email_confirm: true, // Auto-confirm since we're handling invitation flow
      user_metadata: {
        employee_id: employeeId,
        company_id: companyId,
        role: role,
        employee_name: employeeData?.name || 'Employee',
        warehouse_id: warehouseId,
        warehouse_name: warehouseName
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('User creation failed - no user returned');
    }


    // Update employee record with ONLY auth-related fields - preserve all existing data
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({
        user_id_auth: authUser.user.id,
        status: 'invited',
        invited_at: new Date().toISOString(),
        needs_password_change: true
      })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Error updating employee:', updateError);
      // Clean up auth user if employee update fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to link employee to user account: ${updateError.message}`);
    }

    // Create company_users entry (use upsert to handle duplicates)
    // Set approval_status to 'approved' since admin invited = auto-approved
    const { error: companyUserError } = await supabaseAdmin
      .from('company_users')
      .upsert({
        user_id: authUser.user.id,
        company_id: companyId,
        role: role,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: authUser.user.id
      }, {
        onConflict: 'user_id,company_id'
      });

    if (companyUserError) {
      console.error('Error creating company user:', companyUserError);
      // Clean up if company_users creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to assign user to company: ${companyUserError.message}`);
    }

    // Create warehouse_users entry if warehouse is specified
    if (warehouseId) {
      const { error: warehouseUserError } = await supabaseAdmin
        .from('warehouse_users')
        .upsert({
          user_id: authUser.user.id,
          warehouse_id: warehouseId,
          role: 'staff'
        }, {
          onConflict: 'user_id,warehouse_id'
        });

      if (warehouseUserError) {
        console.error('Error creating warehouse user:', warehouseUserError);
        // Clean up if warehouse_users creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to assign user to warehouse: ${warehouseUserError.message}`);
      }
    }

    // Generate login URL - always use production URL
    const loginUrl = 'https://logistixwms.com/auth';

    // Send custom invitation email with password
    try {
      await sendCustomInvitationEmail(
        email,
        employeeData?.name || 'Employee',
        finalCompanyName,
        securePassword,
        loginUrl,
        warehouseName
      );
    } catch (emailError) {
      console.error('Error sending custom email:', emailError);
      throw new Error(`Failed to send invitation email: ${emailError.message}`);
    }


    return new Response(
      JSON.stringify({
        success: true,
        message: 'Employee invited successfully and confirmation email sent with password',
        userId: authUser.user.id,
        email: email
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in invite-employee function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to invite employee'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
